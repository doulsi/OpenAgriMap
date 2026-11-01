/**
 * OpenAgriMap - Report store.
 * Default: JSON file persistence (zero-dependency, swap for PostgreSQL/PostGIS later).
 * Seeds itself with the bundled mock reports on first run so the map is never empty.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_DATA_FILE = path.join(__dirname, "..", "data", "reports.json");

function seedReports() {
  const seedFile = path.join(__dirname, "..", "js", "mock-parcels.js");
  const src = fs.readFileSync(seedFile, "utf8");
  const match = src.match(/const INITIAL_OUTBREAK_REPORTS = (\[[\s\S]*?\]);/);
  if (!match) return [];
  return JSON.parse(match[1]);
}

class ReportStore {
  constructor(dataFile = DEFAULT_DATA_FILE) {
    this.dataFile = dataFile;
    this.reports = [];
    this.nextId = 1;
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.dataFile, "utf8");
      this.reports = JSON.parse(raw);
    } catch (err) {
      this.reports = seedReports().map((r) => this.normalizeSeed(r));
      this.persist();
    }
    this.nextId = this.reports.reduce((max, r) => {
      const n = parseInt(String(r.id).replace(/\D/g, ""), 10);
      return Number.isNaN(n) ? max : Math.max(max, n + 1);
    }, 1);
  }

  normalizeSeed(r) {
    return {
      id: r.id,
      bioaggressor: r.disease,
      severity: r.severity || "medium",
      crop: r.crop || "Culture non précisée",
      location: { lat: r.lat, lng: r.lng },
      observedAt: new Date().toISOString(),
      notes: r.notes || "",
      reporter: { role: r.reporterRole || "gardener", displayName: r.reporter || "Observateur" },
      origin: "seed"
    };
  }

  persist() {
    fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
    const tmp = this.dataFile + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(this.reports, null, 2));
    fs.renameSync(tmp, this.dataFile);
  }

  list() {
    return this.reports;
  }

  add(observation) {
    const record = {
      id: `rep-${this.nextId++}`,
      ...observation,
      submittedAt: new Date().toISOString(),
      status: "pending_moderation",
      origin: "community"
    };
    this.reports.unshift(record);
    this.persist();
    return record;
  }
}

module.exports = { ReportStore, seedReports, DEFAULT_DATA_FILE };
