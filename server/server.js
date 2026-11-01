/**
 * OpenAgriMap - Backend API (zero-dependency Node.js, Node >= 18).
 *
 * Endpoints:
 *   GET  /api/health
 *   GET  /api/reports?bbox=minLng,minLat,maxLng,maxLat&status=pending_moderation,confirmed
 *   POST /api/reports          (validated against schema/observation.schema.json;
 *                               anonymous reports are rejected with 422; rate-limited
 *                               per IP and per reporter display name; 409 on duplicate)
 *   PATCH  /api/reports/:id    (moderator/admin only, Bearer token; status confirmed|rejected|pending_moderation)
 *   DELETE /api/reports/:id    (moderator/admin, or the authenticated owner of the report)
 *   GET  /api/moderation/queue (moderator/admin only: pending_moderation reports)
 *   POST /api/uploads/photo    (rate-limited image upload for report evidence, <= 2 Mo)
 *   GET  /uploads/*            (uploaded report photos)
 *   GET  /api/proxy/:source/*  (server-side cache proxy for browser API calls,
 *                               keeps third-party rate limits and keys off the client)
 *
 * Static hosting: when started with `node server/server.js`, the frontend in
 * the repo root is served as-is, so `open http://127.0.0.1:8080/` works.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { validateObservation, loadSchema } = require("./validator");
const { ReportStore } = require("./store");
const { levelFor } = require("./gamification");
const { AuthService } = require("./auth");
const { neighborhoodRisk, territoryBenchmark } = require("./neighborhood");

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = path.join(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const PROXY_TARGETS = {
  soilgrids: "https://rest.isric.org/soilgrids/v2.0/properties/query",
  openmeteo: "https://api.open-meteo.com/v1/forecast",
  gbif: "https://api.gbif.org/v1/occurrence/search",
  geocode: "https://data.geopf.fr/geocodage/search",
  nominatim: "https://nominatim.openstreetmap.org/search",
  apicarto: "https://apicarto.ign.fr/api"
};

const PROXY_CACHE_TTL_MS = 10 * 60 * 1000;
const proxyCache = new Map();

const UPLOADS_DIR = path.join(ROOT, "data", "uploads");

const UPLOAD_MIME = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif"
};
const UPLOAD_MAX_BYTES = 2 * 1024 * 1024; // 2 Mo decoded

// Anti-abuse for the open contribution endpoints (sliding window, in-memory).
const DEFAULT_RATE_LIMITS = {
  reportsPerIp: { windowMs: 10 * 60 * 1000, max: 20 },
  reportsPerReporter: { windowMs: 10 * 60 * 1000, max: 10 },
  uploadsPerIp: { windowMs: 10 * 60 * 1000, max: 10 }
};

/** Sliding-window rate limiter. Returns {allowed, retryAfterSeconds}. */
function createRateLimiter({ windowMs, max }) {
  const hits = new Map(); // key -> [timestamps]
  return {
    check(key) {
      const now = Date.now();
      const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (arr.length >= max) {
        const retryAfterSeconds = Math.ceil((arr[0] + windowMs - now) / 1000);
        hits.set(key, arr);
        return { allowed: false, retryAfterSeconds };
      }
      arr.push(now);
      hits.set(key, arr);
      return { allowed: true, retryAfterSeconds: 0 };
    }
  };
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (fwd ? String(fwd).split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
}

function isModerator(user) {
  return !!user && (user.role === "admin" || user.role === "moderator");
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(payload);
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** True if [lng,lat] is inside a GeoJSON Polygon/MultiPolygon (ray casting, lng=x lat=y). */
function polygonContains(geometry, pt) {
  if (!geometry || !geometry.coordinates) return false;
  const [x, y] = pt;
  // walk down to every ring (array of [lng,lat] points) regardless of nesting depth
  const rings = [];
  (function collect(node) {
    if (!Array.isArray(node)) return;
    if (node.length && Array.isArray(node[0]) && typeof node[0][0] === "number") rings.push(node);
    else node.forEach(collect);
  })(geometry.coordinates);
  for (const ring of rings) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/** Rough centroid [lng,lat] of a GeoJSON Polygon/MultiPolygon (mean of ring points). */
function polygonCentroid(geometry) {
  if (!geometry || !geometry.coordinates) return null;
  let sx = 0, sy = 0, n = 0;
  (function walk(node) {
    if (!Array.isArray(node)) return;
    if (node.length && Array.isArray(node[0]) && typeof node[0][0] === "number") {
      for (const [x, y] of node) { sx += x; sy += y; n++; }
    } else node.forEach(walk);
  })(geometry.coordinates);
  return n ? [sx / n, sy / n] : null;
}

function createServer({ store, schema, rateLimits } = {}) {
  const reportStore = store || new ReportStore();
  const observationSchema = schema || loadSchema();
  const auth = new AuthService(reportStore);
  const limits = { ...DEFAULT_RATE_LIMITS, ...(rateLimits || {}) };
  const limitReportsIp = createRateLimiter(limits.reportsPerIp);
  const limitReportsName = createRateLimiter(limits.reportsPerReporter);
  const limitUploadsIp = createRateLimiter(limits.uploadsPerIp);

  function bearerUser(req) {
    const h = req.headers["authorization"] || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    return token ? auth.userFromToken(token) : null;
  }

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    try {
      // Plan §3.5 use case 1: fiche d'identité d'une parcelle (historique + signalements + prix de référence)
      const parcelMatch = pathname.match(/^\/api\/parcels\/([^/]+)$/);
      if (parcelMatch && req.method === "GET") {
        const parcel = reportStore.getParcel(decodeURIComponent(parcelMatch[1]));
        if (!parcel) return sendJson(res, 404, { error: "parcel not found" });
        const reports = reportStore.reportsForParcel(parcel).map((r) => ({
          id: r.id, bioaggressor: r.bioaggressor, severity: r.severity, crop: r.crop,
          observedAt: r.observedAt, status: r.status, reporter: r.reporter.displayName, notes: r.notes || ""
        }));
        return sendJson(res, 200, {
          ...parcel,
          recentReports: reports,
          referenceLeasePriceEURperHa: null, // §3.2 item 2: branché quand la source prix de fermage sera ouverte
          source: "RPG IGN/ASP (Licence Ouverte 2.0) + signalements communautaires ODbL"
        });
      }

      // RPG live parcels in the current bbox (ApiCarto IGN, Licence Ouverte 2.0).
      // path after /api/proxy/apicarto/ is forwarded, e.g. /rpg/ilot?codeinsee=49007
      if (pathname.startsWith("/api/proxy/apicarto/") && req.method === "GET") {
        const sub = pathname.slice("/api/proxy/apicarto/".length);
        const cacheKey = `apicarto:${sub}?${url.searchParams.toString()}`;
        const cached = proxyCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "X-Cache": "HIT" });
          return res.end(cached.body);
        }
        const upstream = await fetch(`${PROXY_TARGETS.apicarto}/${sub}?${url.searchParams.toString()}`);
        const body = await upstream.text();
        proxyCache.set(cacheKey, { body, expiresAt: Date.now() + 60 * 60 * 1000 }); // RPG changes yearly: 1h cache
        res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8", "X-Cache": "MISS" });
        return res.end(body);
      }

      // Live RPG parcels for a bbox: GET /api/rpg/parcels?bbox=minLng,minLat,maxLng,maxLat&annee=2024&_limit=1000
      // Proxied to ApiCarto IGN (rpg/v2, Licence Ouverte 2.0), 1h cache.
      if (pathname === "/api/rpg/parcels" && req.method === "GET") {
        const bbox = (url.searchParams.get("bbox") || "").split(",").map(Number);
        if (bbox.length !== 4 || bbox.some(Number.isNaN)) return sendJson(res, 422, { error: "bbox=minLng,minLat,maxLng,maxLat required" });
        const annee = url.searchParams.get("annee") || "2024";
        const limit = Math.min(parseInt(url.searchParams.get("_limit") || "1000", 10) || 1000, 1000);
        const [w, s_, e, n] = bbox;
        const geom = encodeURIComponent(JSON.stringify({ type: "Polygon", coordinates: [[[w, s_], [w, n], [e, n], [e, s_], [w, s_]]] }));
        const cacheKey = `rpg:${annee}:${bbox.join(",")}:${limit}`;
        const cached = proxyCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          res.writeHead(200, { "Content-Type": "application/geo+json; charset=utf-8", "X-Cache": "HIT" });
          return res.end(cached.body);
        }
        const upstream = await fetch(`${PROXY_TARGETS.apicarto}/rpg/v2?annee=${annee}&geom=${geom}&_limit=${limit}`, { headers: { accept: "application/json" } });
        const body = await upstream.text();
        proxyCache.set(cacheKey, { body, expiresAt: Date.now() + PROXY_CACHE_TTL_MS });
        res.writeHead(upstream.status, { "Content-Type": "application/geo+json; charset=utf-8", "X-Cache": "MISS" });
        return res.end(body);
      }

      // RPG multi-year history for one point: GET /api/rpg/history?lat=&lng=&years=2020,2021,2022,2023,2024
      // Returns per-year culture code/name for the parcelle at that point (ApiCarto rpg/v2, cached 1h).
      if (pathname === "/api/rpg/history" && req.method === "GET") {
        const lat = parseFloat(url.searchParams.get("lat"));
        const lng = parseFloat(url.searchParams.get("lng"));
        if (Number.isNaN(lat) || Number.isNaN(lng)) return sendJson(res, 422, { error: "lat & lng required" });
        const years = (url.searchParams.get("years") || "2020,2021,2022,2023,2024").split(",").map(y => y.trim()).filter(Boolean);
        // A point/polygon query returns ANY parcelle intersecting it, not the one
        // containing the point. So: fetch candidates for each millésime, then pick
        // the feature whose polygon actually contains (lng, lat); prefer the 2024
        // id_parcel match when several overlap.
        const d = 0.05; // ~5 km query window: dense city centers / vineyards can sit >2 km from the nearest declared parcelle
        const geom = encodeURIComponent(JSON.stringify({ type: "Polygon", coordinates: [[[lng - d, lat - d], [lng - d, lat + d], [lng + d, lat + d], [lng + d, lat - d], [lng - d, lat - d]]] }));
        const cacheKeyFor = (annee) => `rpg-hist:${annee}:${lat.toFixed(5)},${lng.toFixed(5)}`;
        async function fetchYear(annee) {
          const key = cacheKeyFor(annee);
          let body = proxyCache.get(key)?.body;
          if (!body || (proxyCache.get(key)?.expiresAt || 0) <= Date.now()) {
            const upstream = await fetch(`${PROXY_TARGETS.apicarto}/rpg/v2?annee=${annee}&geom=${geom}&_limit=50`, { headers: { accept: "application/json" } });
            body = await upstream.text();
            proxyCache.set(key, { body, expiresAt: Date.now() + PROXY_CACHE_TTL_MS });
          }
          return JSON.parse(body);
        }
        const fc2024 = years.includes("2024") ? await fetchYear("2024") : null;
        const targetId = fc2024 ? (fc2024.features || []).find(f => polygonContains(f.geometry, [lng, lat]))?.properties?.id_parcel : null;

        const out = [];
        for (const annee of years) {
          try {
            const fc = await fetchYear(annee);
            const feats = fc.features || [];
            // 1) the parcelle that actually contains the point
            let f = targetId ? feats.find(x => x.properties?.id_parcel === targetId && polygonContains(x.geometry, [lng, lat])) : null;
            if (!f) f = feats.find(x => polygonContains(x.geometry, [lng, lat]));
            // 2) fallback: nearest candidate by polygon-centroid distance (city centers,
            //    roads, undeclared land fall between parcelles)
            if (!f) {
              let best = null, bestD = Infinity;
              for (const x of feats) {
                const c = polygonCentroid(x.geometry);
                if (!c) continue;
                const dist = Math.hypot(c[0] - lng, c[1] - lat);
                if (dist < bestD) { bestD = dist; best = x; }
              }
              f = best;
            }
            const pr = f?.properties || {};
            out.push({ year: annee, id_parcel: pr.id_parcel || null, code_cultu: pr.code_cultu || null, surf_parc: pr.surf_parc ?? null });
          } catch { out.push({ year: annee, id_parcel: null, code_cultu: null, surf_parc: null }); }
        }
        return sendJson(res, 200, { lat, lng, years: out });
      }

      // Plan §3.2 item 3: voisinage à risque (pulvérisation / apiculture / élevage)
      if (pathname === "/api/neighborhood" && req.method === "GET") {
        const lat = parseFloat(url.searchParams.get("lat"));
        const lng = parseFloat(url.searchParams.get("lng"));
        const radiusKm = parseFloat(url.searchParams.get("radiusKm")) || 10;
        if (Number.isNaN(lat) || Number.isNaN(lng)) return sendJson(res, 422, { error: "lat & lng required" });
        return sendJson(res, 200, neighborhoodRisk(lat, lng, reportStore.list(), reportStore.apiaries, reportStore.livestock, radiusKm));
      }

      // Plan §3.2 item 4: benchmark de territoire (pression sanitaire + rendements à moins de R km)
      if (pathname === "/api/benchmark" && req.method === "GET") {
        const lat = parseFloat(url.searchParams.get("lat"));
        const lng = parseFloat(url.searchParams.get("lng"));
        const radiusKm = parseFloat(url.searchParams.get("radiusKm")) || 10;
        if (Number.isNaN(lat) || Number.isNaN(lng)) return sendJson(res, 422, { error: "lat & lng required" });
        return sendJson(res, 200, territoryBenchmark(lat, lng, reportStore.list(), reportStore.parcels, radiusKm));
      }

      // P1 accounts
      if (pathname === "/api/auth/register" && req.method === "POST") {
        let payload;
        try { payload = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: "invalid JSON body" }); }
        try {
          const user = auth.register(payload.email, payload.password, payload.displayName);
          const session = auth.login(payload.email, payload.password);
          return sendJson(res, 201, { user, token: session.token });
        } catch (err) {
          const status = { BAD_EMAIL: 422, WEAK_PASSWORD: 422, BAD_NAME: 422, EMAIL_TAKEN: 409 }[err.code] || 400;
          return sendJson(res, status, { error: err.message });
        }
      }

      if (pathname === "/api/auth/login" && req.method === "POST") {
        let payload;
        try { payload = JSON.parse(await readBody(req)); } catch { return sendJson(res, 400, { error: "invalid JSON body" }); }
        try {
          const session = auth.login(payload.email, payload.password);
          return sendJson(res, 200, session);
        } catch (err) {
          return sendJson(res, 401, { error: "invalid credentials" });
        }
      }

      if (pathname === "/api/auth/logout" && req.method === "POST") {
        const h = req.headers["authorization"] || "";
        if (h.startsWith("Bearer ")) auth.logout(h.slice(7));
        return sendJson(res, 204, {});
      }

      if (pathname === "/api/me" && req.method === "GET") {
        const user = bearerUser(req);
        if (!user) return sendJson(res, 401, { error: "not authenticated" });
        return sendJson(res, 200, { user: auth.publicUser(user) });
      }

      // P6 open by default: public API documentation (OpenAPI 3, static)
      if (pathname === "/api/openapi.json" && req.method === "GET") {
        const spec = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "openapi.json"), "utf8"));
        return sendJson(res, 200, spec);
      }

      // P6: full open data export of community reports (ODbL), GeoJSON FeatureCollection
      if (pathname === "/api/export.geojson" && req.method === "GET") {
        const features = reportStore.list()
          .filter((r) => r.origin === "community")
          .map((r) => ({
            type: "Feature",
            id: r.id,
            geometry: { type: "Point", coordinates: [r.location.lng, r.location.lat] },
            properties: {
              bioaggressor: r.bioaggressor,
              severity: r.severity,
              crop: r.crop,
              variety: r.variety || null,
              stage: r.stage || null,
              observedAt: r.observedAt,
              submittedAt: r.submittedAt,
              status: r.status,
              notes: r.notes || "",
              reporterRole: r.reporter.role,
              reporter: r.reporter.displayName,
              license: "ODbL-1.0"
            }
          }));
        res.writeHead(200, {
          "Content-Type": "application/geo+json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="openagrimap-reports.geojson"',
          "Cache-Control": "no-store"
        });
        return res.end(JSON.stringify({
          type: "FeatureCollection",
          license: "https://opendatacommons.org/licenses/odbl/1-0/",
          attribution: "OpenAgriMap France contributors",
          generatedAt: new Date().toISOString(),
          features
        }, null, 2));
      }

      if (pathname === "/api/health" && req.method === "GET") {
        return sendJson(res, 200, { status: "ok", reports: reportStore.list().length });
      }

      if (pathname === "/api/reports" && req.method === "GET") {
        let reports = reportStore.list();
        const bbox = url.searchParams.get("bbox");
        if (bbox) {
          const parts = bbox.split(",").map(Number);
          if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
            const [minLng, minLat, maxLng, maxLat] = parts;
            reports = reports.filter((r) =>
              r.location.lng >= minLng && r.location.lng <= maxLng &&
              r.location.lat >= minLat && r.location.lat <= maxLat
            );
          }
        }
        // status=pending_moderation,confirmed,... ("all" = no filter; default = everything stored)
        const statusParam = url.searchParams.get("status");
        if (statusParam && statusParam !== "all") {
          const wanted = new Set(statusParam.split(",").map((s) => s.trim()).filter(Boolean));
          reports = reports.filter((r) => wanted.has(r.status));
        }
        return sendJson(res, 200, { count: reports.length, reports });
      }

      // Open contribution: photo evidence upload (rate-limited, <= 2 Mo, images only).
      // Body: {"dataUrl": "data:image/png;base64,...."} -> 201 {"url": "/uploads/<file>"}
      if (pathname === "/api/uploads/photo" && req.method === "POST") {
        const ipCheck = limitUploadsIp.check(clientIp(req));
        if (!ipCheck.allowed) {
          res.setHeader("Retry-After", String(ipCheck.retryAfterSeconds));
          return sendJson(res, 429, { error: "trop d'uploads, réessayez plus tard", retryAfterSeconds: ipCheck.retryAfterSeconds });
        }
        let payload;
        try {
          payload = JSON.parse(await readBody(req, 4 * 1024 * 1024)); // dataUrl can be ~1.33x the raw size
        } catch (err) {
          if (err.message === "payload too large") return sendJson(res, 413, { error: "payload too large (max ~4 Mo encoded)" });
          return sendJson(res, 400, { error: "invalid JSON body" });
        }
        const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(String(payload.dataUrl || ""));
        if (!m) return sendJson(res, 422, { error: "dataUrl must be a base64 image (png/jpeg/webp/gif)" });
        const buf = Buffer.from(m[2].replace(/\s/g, ""), "base64");
        if (buf.length === 0 || buf.length > UPLOAD_MAX_BYTES) {
          return sendJson(res, 422, { error: `image must be between 1 byte and ${UPLOAD_MAX_BYTES} bytes decoded` });
        }
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const file = `${crypto.randomBytes(12).toString("hex")}${UPLOAD_MIME[m[1]]}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, file), buf);
        return sendJson(res, 201, { url: `/uploads/${file}`, bytes: buf.length });
      }

      // Moderation queue (moderator/admin): GET /api/moderation/queue
      if (pathname === "/api/moderation/queue" && req.method === "GET") {
        const user = bearerUser(req);
        if (!user) return sendJson(res, 401, { error: "authentication required" });
        if (!isModerator(user)) return sendJson(res, 403, { error: "moderator or admin role required" });
        const pending = reportStore.pendingModeration();
        return sendJson(res, 200, { count: pending.length, reports: pending });
      }

      if (pathname === "/api/reports" && req.method === "POST") {
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJson(res, 400, { error: "invalid JSON body" });
        }

        // Anti-abuse: per-IP and per-reporter sliding windows (open contribution endpoint).
        const ipCheck = limitReportsIp.check(clientIp(req));
        if (!ipCheck.allowed) {
          res.setHeader("Retry-After", String(ipCheck.retryAfterSeconds));
          return sendJson(res, 429, { error: "trop de signalements depuis cette adresse, réessayez plus tard", retryAfterSeconds: ipCheck.retryAfterSeconds });
        }
        const name = payload && payload.reporter && payload.reporter.displayName;
        if (name) {
          const nameCheck = limitReportsName.check(String(name));
          if (!nameCheck.allowed) {
            res.setHeader("Retry-After", String(nameCheck.retryAfterSeconds));
            return sendJson(res, 429, { error: "trop de signalements pour ce nom d'affichage, réessayez plus tard", retryAfterSeconds: nameCheck.retryAfterSeconds });
          }
        }

        const errors = validateObservation(payload, observationSchema);
        if (errors.length > 0) {
          return sendJson(res, 422, {
            error: "observation does not match schema/observation.schema.json",
            details: errors
          });
        }

        let record;
        try {
          record = reportStore.add(payload, bearerUser(req));
        } catch (err) {
          if (err.code === "DUPLICATE") {
            return sendJson(res, 409, {
              error: "duplicate observation (redundant signalement within 24h / 250m)",
              existingId: err.existingId
            });
          }
          throw err;
        }
        return sendJson(res, 201, record);
      }

      // P2 moderation: PATCH /api/reports/:id  {"status": "confirmed"|"rejected"|"pending_moderation"}
      // Moderator/admin only (Bearer token) — an open endpoint must not let anyone confirm/reject.
      const moderationMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
      if (moderationMatch && req.method === "PATCH") {
        const user = bearerUser(req);
        if (!user) return sendJson(res, 401, { error: "authentication required" });
        if (!isModerator(user)) return sendJson(res, 403, { error: "moderator or admin role required" });
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJson(res, 400, { error: "invalid JSON body" });
        }
        let record;
        try {
          record = reportStore.setStatus(moderationMatch[1], payload.status);
        } catch (err) {
          if (err.code === "BAD_STATUS") return sendJson(res, 422, { error: err.message });
          throw err;
        }
        if (!record) return sendJson(res, 404, { error: "report not found" });
        return sendJson(res, 200, record);
      }

      // DELETE /api/reports/:id — moderator/admin, or the authenticated owner of the report
      if (moderationMatch && req.method === "DELETE") {
        const user = bearerUser(req);
        if (!user) return sendJson(res, 401, { error: "authentication required" });
        const existing = reportStore.get(moderationMatch[1]);
        if (!existing) return sendJson(res, 404, { error: "report not found" });
        if (!isModerator(user) && existing.userId !== user.id) {
          return sendJson(res, 403, { error: "only a moderator/admin or the report owner can delete it" });
        }
        reportStore.remove(existing.id);
        res.writeHead(204, { "Content-Type": "application/json; charset=utf-8" });
        return res.end();
      }

      // P2 reputation: GET /api/reporters/:name/reputation
      const repMatch = pathname.match(/^\/api\/reporters\/([^/]+)\/reputation$/);
      if (repMatch && req.method === "GET") {
        const name = decodeURIComponent(repMatch[1]);
        const confirmed = reportStore.reputation(name);
        return sendJson(res, 200, {
          displayName: name,
          confirmedReports: confirmed,
          level: levelFor(confirmed)
        });
      }

      if (pathname.startsWith("/api/proxy/") && req.method === "GET") {
        const source = pathname.split("/")[3];
        const target = PROXY_TARGETS[source];
        if (!target) return sendJson(res, 404, { error: `unknown proxy source "${source}"` });

        const cacheKey = `${source}?${url.searchParams.toString()}`;
        const cached = proxyCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "X-Cache": "HIT" });
          return res.end(cached.body);
        }

        const headers = {};
        if (source === "nominatim") headers["User-Agent"] = "OpenAgriMap/0.2 (open source agriculture map)";
        let upstream = await fetch(`${target}?${url.searchParams.toString()}`, { headers });
        // GBIF rate-limits aggressively (429): one retry after a short backoff, then cache errors too (short TTL)
        if (upstream.status === 429) {
          await new Promise((r) => setTimeout(r, 1200));
          upstream = await fetch(`${target}?${url.searchParams.toString()}`, { headers });
        }
        const body = await upstream.text();
        const ttl = upstream.status === 200 ? PROXY_CACHE_TTL_MS : 60 * 1000; // cache errors only 1 min
        proxyCache.set(cacheKey, { body, expiresAt: Date.now() + ttl });
        res.writeHead(upstream.status, {
          "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
          "X-Cache": "MISS"
        });
        return res.end(body);
      }

      // Uploaded report photos: GET /uploads/<file>
      if (req.method === "GET" && pathname.startsWith("/uploads/")) {
        const filePath = path.normalize(path.join(UPLOADS_DIR, pathname.slice("/uploads/".length)));
        if (!filePath.startsWith(UPLOADS_DIR)) return sendJson(res, 403, { error: "forbidden" });
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return sendJson(res, 404, { error: "not found" });
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": Object.keys(UPLOAD_MIME).find((k) => UPLOAD_MIME[k] === ext) || "application/octet-stream",
          "Cache-Control": "public, max-age=86400"
        });
        return fs.createReadStream(filePath).pipe(res);
      }

      if (req.method === "GET" && !pathname.startsWith("/api/")) {
        let filePath = path.normalize(path.join(ROOT, pathname === "/" ? "index.html" : pathname));
        if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { error: "forbidden" });
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(ROOT, "index.html");
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        return fs.createReadStream(filePath).pipe(res);
      }

      return sendJson(res, 404, { error: "not found" });
    } catch (err) {
      return sendJson(res, 500, { error: "internal server error", message: String(err.message || err) });
    }
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`OpenAgriMap API listening on http://${HOST}:${PORT}`);
  });
}

module.exports = { createServer, PROXY_TARGETS, polygonContains, polygonCentroid };
