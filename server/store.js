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
    const duplicate = this.findDuplicate(observation);
    if (duplicate) {
      const err = new Error("duplicate observation: an identical report was submitted within the last 24h");
      err.code = "DUPLICATE";
      err.existingId = duplicate.id;
      throw err;
    }
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

  /**
   * P2 anti-abus : two reports from the same display name, same bioaggressor,
   * same crop, within 250 m and 24 h are treated as duplicates (redundant
   * signalement), not as independent confirmations.
   */
  findDuplicate(observation) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const observed = Date.parse(observation.observedAt);
    return this.reports.find((r) => {
      if (r.origin !== "community") return false;
      if (r.bioaggressor !== observation.bioaggressor) return false;
      if (r.crop !== observation.crop) return false;
      if (r.reporter.displayName !== observation.reporter.displayName) return false;
      if (Math.abs(Date.parse(r.observedAt) - observed) > DAY_MS) return false;
      const dLat = (r.location.lat - observation.location.lat) * 111320;
      const dLng = (r.location.lng - observation.location.lng) * 111320 * Math.cos(observation.location.lat * Math.PI / 180);
      return Math.hypot(dLat, dLng) <= 250;
    });
  }

  /** P2 modération : change le statut d'un signalement (pending_moderation / confirmed / rejected). */
  setStatus(id, status) {
    const allowed = ["pending_moderation", "confirmed", "rejected"];
    if (!allowed.includes(status)) {
      const err = new Error(`invalid status "${status}"`);
      err.code = "BAD_STATUS";
      throw err;
    }
    const record = this.reports.find((r) => r.id === id);
    if (!record) return null;
    record.status = status;
    this.persist();
    return record;
  }

  /** P2 réputation (style Waze) : nombre de signalements confirmés par contributeur. */
  reputation(displayName) {
    return this.reports.filter(
      (r) => r.origin === "community" &&
        r.reporter.displayName === displayName &&
        r.status === "confirmed"
    ).length;
  }
}

module.exports = { ReportStore, seedReports, DEFAULT_DATA_FILE };
