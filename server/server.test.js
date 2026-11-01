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
