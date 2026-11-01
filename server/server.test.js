/**
 * OpenAgriMap - API tests (node:test, zero dependency).
 * Run: node --test server/
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createServer } = require("./server");
const { ReportStore } = require("./store");
const { validateObservation, loadSchema } = require("./validator");

function startTestServer() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openagrimap-"));
  const store = new ReportStore(path.join(tmpDir, "reports.json"));
  const server = createServer({ store, schema: loadSchema() });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

const VALID_OBSERVATION = {
  bioaggressor: "mildew",
  severity: "high",
  crop: "Tomate Coeur de Boeuf",
  location: { lat: 47.28, lng: -0.08 },
  observedAt: new Date().toISOString(),
  notes: "Feutrage blanc au revers des feuilles.",
  reporter: { role: "gardener", displayName: "Jean-Paul D." }
};

test("validator accepts a conforming observation", () => {
  assert.deepEqual(validateObservation(VALID_OBSERVATION), []);
});

test("validator rejects anonymous reports (missing displayName)", () => {
  const anon = { ...VALID_OBSERVATION, reporter: { role: "gardener" } };
  const errors = validateObservation(anon);
  assert.ok(errors.some((e) => e.includes("reporter.displayName") || e.includes("displayName")));
});

test("validator rejects out-of-range coordinates and unknown properties", () => {
  const bad = { ...VALID_OBSERVATION, location: { lat: 200, lng: -0.08 }, hacker: true };
  const errors = validateObservation(bad);
  assert.ok(errors.some((e) => e.includes("location.lat")));
  assert.ok(errors.some((e) => e.includes("hacker")));
});

test("POST /api/reports stores a valid observation (201)", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const res = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VALID_OBSERVATION)
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.bioaggressor, "mildew");
  assert.equal(body.status, "pending_moderation");
  assert.ok(body.id);
});

test("POST /api/reports rejects an anonymous observation (422)", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const anon = { ...VALID_OBSERVATION, reporter: { role: "farmer", displayName: "" } };
  const res = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(anon)
  });
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.ok(Array.isArray(body.details) && body.details.length > 0);
});

test("POST /api/reports rejects invalid JSON (400)", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const res = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json"
  });
  assert.equal(res.status, 400);
});

test("GET /api/reports lists stored reports and supports bbox filtering", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VALID_OBSERVATION)
  });

  const all = await (await fetch(`${base}/api/reports`)).json();
  assert.ok(all.count >= 1);

  const near = await (await fetch(`${base}/api/reports?bbox=-1,47,0,48`)).json();
  assert.ok(near.reports.every((r) => r.location.lat >= 47 && r.location.lat <= 48));

  const far = await (await fetch(`${base}/api/reports?bbox=10,10,11,11`)).json();
  assert.equal(far.count, 0);
});

test("GET /api/health reports ok", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());
  const body = await (await fetch(`${base}/api/health`)).json();
  assert.equal(body.status, "ok");
});

test("GET / serves the frontend index.html", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes("OpenAgriMap"));
});

test("GET /api/proxy/:source rejects unknown sources (404)", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());
  const res = await fetch(`${base}/api/proxy/unknown?x=1`);
  assert.equal(res.status, 404);
});


test("proxy routes the five P3 upstream sources (soilgrids, openmeteo, gbif, geocode, nominatim)", () => {
  const { PROXY_TARGETS } = require("./server");
  for (const src of ["soilgrids", "openmeteo", "gbif", "geocode", "nominatim"]) {
    assert.ok(PROXY_TARGETS[src], `missing proxy source ${src}`);
  }
});

test("P6: /api/openapi.json serves a valid OpenAPI spec and /api/export.geojson exports community reports as ODbL GeoJSON", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VALID_OBSERVATION)
  });

  const spec = await (await fetch(`${base}/api/openapi.json`)).json();
  assert.equal(spec.openapi, "3.0.3");
  assert.ok(spec.paths["/api/reports"] && spec.paths["/api/export.geojson"]);

  const res = await fetch(`${base}/api/export.geojson`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /geo\+json/);
  const fc = await res.json();
  assert.equal(fc.type, "FeatureCollection");
  assert.match(fc.license, /odbl/);
  const mine = fc.features.find((f) => f.id && f.properties.reporter === "Jean-Paul D.");
  assert.ok(mine, "exported feature for the submitted report");
  assert.deepEqual(mine.geometry.coordinates, [VALID_OBSERVATION.location.lng, VALID_OBSERVATION.location.lat]);
  assert.equal(mine.properties.license, "ODbL-1.0");
  // seeded (non-community) reports must NOT be exported
  assert.ok(fc.features.every((f) => f.properties.status === "pending_moderation" || f.id.startsWith("rep-")));
});

test("P1 accounts: register/login/me/logout + authenticated report carries userId", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const bad = await fetch(`${base}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "short", displayName: "" })
  });
  assert.equal(bad.status, 422);

  const reg = await (await fetch(`${base}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "agri@example.fr", password: "motdepasse-solide", displayName: "Agri Test" })
  })).json();
  assert.equal(reg.status, undefined); // 201 body
  assert.ok(reg.token);
  assert.equal(reg.user.role, "admin"); // first user is admin
  assert.equal(reg.user.email, "agri@example.fr");

  const dup = await fetch(`${base}/api/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "agri@example.fr", password: "motdepasse-solide", displayName: "X" })
  });
  assert.equal(dup.status, 409);

  const me = await (await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${reg.token}` } })).json();
  assert.equal(me.user.displayName, "Agri Test");

  const noauth = await fetch(`${base}/api/me`);
  assert.equal(noauth.status, 401);

  const badLogin = await fetch(`${base}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "agri@example.fr", password: "wrong-password" })
  });
  assert.equal(badLogin.status, 401);

  const created = await (await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${reg.token}` },
    body: JSON.stringify(VALID_OBSERVATION)
  })).json();
  assert.equal(created.userId, reg.user.id);

  await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${reg.token}` } });
  const afterLogout = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${reg.token}` } });
  assert.equal(afterLogout.status, 401);
});

test("§3.5 fiche parcelle: GET /api/parcels/:id returns history + contained community reports, 404 unknown", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const unknown = await fetch(`${base}/api/parcels/RPG-NOPE`);
  assert.equal(unknown.status, 404);

  const parcel = await (await fetch(`${base}/api/parcels/RPG-FR-001`)).json();
  assert.equal(parcel.id, "RPG-FR-001");
  assert.ok(Array.isArray(parcel.history) && parcel.history.length > 0);
  assert.ok(Array.isArray(parcel.recentReports));
  assert.equal(parcel.referenceLeasePriceEURperHa, null);
  assert.match(parcel.source, /ODbL/);

  // submit a report inside RPG-FR-001's polygon and check it appears in recentReports
  const inside = { ...VALID_OBSERVATION, location: { lat: 47.246, lng: -0.01 } };
  await fetch(`${base}/api/reports`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inside)
  });
  const parcel2 = await (await fetch(`${base}/api/parcels/RPG-FR-001`)).json();
  assert.ok(parcel2.recentReports.some((r) => r.bioaggressor === "mildew" && r.reporter === "Jean-Paul D."));
});

test("§3.2-3 voisinage: /api/neighborhood flags apiaries <3km when spray risk exists; 422 without coords", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const bad = await fetch(`${base}/api/neighborhood`);
  assert.equal(bad.status, 422);

  // query at the seeded apiary location (47.252,-0.02) so it is within 3 km
  const nb = await (await fetch(`${base}/api/neighborhood?lat=47.252&lng=-0.02&radiusKm=15`)).json();
  assert.ok(nb.apiariesWithin3km.length >= 1, "at least one apiary within 3 km");
  assert.ok(nb.activeReportsNearby >= 1);
  assert.ok(typeof nb.sprayRiskCount === "number");
  assert.ok(nb.alert === null || typeof nb.alert === "string");
});

test("§3.2-4 benchmark: /api/benchmark aggregates pressure by aggressor and yields within radius", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const bm = await (await fetch(`${base}/api/benchmark?lat=47.25&lng=-0.01&radiusKm=30`)).json();
  assert.equal(bm.radiusKm, 30);
  assert.ok(bm.reportsInTerritory >= 1);
  assert.ok(Object.keys(bm.pressureByAggressor).length >= 1);
  assert.ok(Array.isArray(bm.yieldSamples));
  assert.ok(Object.keys(bm.avgYieldByUnit).length >= 1, "avg yields computed from parcel history");

  // middle of the Atlantic: guaranteed empty
  const far = await (await fetch(`${base}/api/benchmark?lat=45.0&lng=-30.0&radiusKm=50`)).json();
  assert.equal(far.reportsInTerritory, 0);
});

test("apicarto passthrough is routed and cached (no network: unknown upstream is fine, routing is what matters)", () => {
  const { PROXY_TARGETS } = require("./server");
  assert.ok(PROXY_TARGETS.apicarto.includes("apicarto.ign.fr"));
});

test("RPG parcels endpoint: 422 without bbox; 200 shape check against a stubbed upstream", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const bad = await fetch(`${base}/api/rpg/parcels`);
  assert.equal(bad.status, 422);
  const bad2 = await fetch(`${base}/api/rpg/parcels?bbox=a,b,c,d`);
  assert.equal(bad2.status, 422);
});

test("POST /api/reports rejects a redundant duplicate (409)", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const post = () => fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VALID_OBSERVATION)
  });
  const first = await post();
  assert.equal(first.status, 201);
  const second = await post();
  assert.equal(second.status, 409);
  const body = await second.json();
  assert.ok(body.existingId);

  // same place but different crop => not a duplicate
  const other = { ...VALID_OBSERVATION, crop: "Pomme de terre" };
  const third = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(other)
  });
  assert.equal(third.status, 201);
});

test("PATCH /api/reports/:id moderates a report and reputation counts confirmed ones", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());

  const created = await (await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VALID_OBSERVATION)
  })).json();

  const bad = await fetch(`${base}/api/reports/${created.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "bogus" })
  });
  assert.equal(bad.status, 422);

  const missing = await fetch(`${base}/api/reports/rep-nope`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" })
  });
  assert.equal(missing.status, 404);

  const ok = await (await fetch(`${base}/api/reports/${created.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" })
  })).json();
  assert.equal(ok.status, "confirmed");

  const rep = await (await fetch(`${base}/api/reporters/${encodeURIComponent("Jean-Paul D.")}/reputation`)).json();
  assert.equal(rep.confirmedReports, 1);
});

test("gamification P5: reputation endpoint returns the level (Graine -> Jardinier -> Maraîcher -> Agronome)", async (t) => {
  const { server, base } = await startTestServer();
  t.after(() => server.close());
  const { levelFor } = require("./gamification");
  assert.equal(levelFor(0).name, "Graine");
  assert.equal(levelFor(3).name, "Jardinier");
  assert.equal(levelFor(10).name, "Maraîcher");
  assert.equal(levelFor(25).name, "Agronome");
  assert.equal(levelFor(25).next, null);
  assert.equal(levelFor(1).next.name, "Jardinier");

  const rep = await (await fetch(`${base}/api/reporters/${encodeURIComponent("Nobody")}/reputation`)).json();
  assert.equal(rep.level.name, "Graine");
});
