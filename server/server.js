/**
 * OpenAgriMap - Backend API (zero-dependency Node.js, Node >= 18).
 *
 * Endpoints:
 *   GET  /api/health
 *   GET  /api/reports?bbox=minLng,minLat,maxLng,maxLat
 *   POST /api/reports          (validated against schema/observation.schema.json;
 *                               anonymous reports are rejected with 422)
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
const { validateObservation, loadSchema } = require("./validator");
const { ReportStore } = require("./store");

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
  nominatim: "https://nominatim.openstreetmap.org/search"
};

const PROXY_CACHE_TTL_MS = 10 * 60 * 1000;
const proxyCache = new Map();

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

function createServer({ store, schema } = {}) {
  const reportStore = store || new ReportStore();
  const observationSchema = schema || loadSchema();

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    try {
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
        return sendJson(res, 200, { count: reports.length, reports });
      }

      if (pathname === "/api/reports" && req.method === "POST") {
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          return sendJson(res, 400, { error: "invalid JSON body" });
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
          record = reportStore.add(payload);
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
      const moderationMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
      if (moderationMatch && req.method === "PATCH") {
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

      // P2 reputation: GET /api/reporters/:name/reputation
      const repMatch = pathname.match(/^\/api\/reporters\/([^/]+)\/reputation$/);
      if (repMatch && req.method === "GET") {
        const name = decodeURIComponent(repMatch[1]);
        return sendJson(res, 200, {
          displayName: name,
          confirmedReports: reportStore.reputation(name)
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
        const upstream = await fetch(`${target}?${url.searchParams.toString()}`, { headers });
        const body = await upstream.text();
        proxyCache.set(cacheKey, { body, expiresAt: Date.now() + PROXY_CACHE_TTL_MS });
        res.writeHead(upstream.status, {
          "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
          "X-Cache": "MISS"
        });
        return res.end(body);
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

module.exports = { createServer, PROXY_TARGETS };
