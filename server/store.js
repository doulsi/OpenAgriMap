/**
 * OpenAgriMap - Report store.
 * Default: JSON file persistence (zero-dependency, swap for PostgreSQL/PostGIS later).
 * Seeds itself with the bundled mock reports on first run so the map is never empty.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_DATA_FILE = path.join(__dirname, "..", "data", "reports.json");

// Moderation state machine for community reports.
// Intended workflow:
//   pending_moderation -> confirmed | rejected
//   confirmed -> rejected
//   rejected -> pending_moderation (re-open goes back through the moderation queue)
// setStatus currently accepts any status -> any status (historical behavior);
// REPORT_STATUS_TRANSITIONS documents the intended graph so a future tightening
// has a single authoritative source.
const REPORT_STATUSES = ["pending_moderation", "confirmed", "rejected"];
const REPORT_STATUS_TRANSITIONS = {
  pending_moderation: ["confirmed", "rejected"],
  confirmed: ["rejected"],
  rejected: ["pending_moderation"]
};

function seedParcels() {
  const seedFile = path.join(__dirname, "..", "js", "mock-parcels.js");
  const src = fs.readFileSync(seedFile, "utf8");
  const match = src.match(/const CROP_PARCELS = (\[[\s\S]*?\]);/);
  if (!match) return [];
  return JSON.parse(match[1]).map((p) => ({
    id: p.id,
    name: p.name,
    farm: p.farm,
    region: p.region,
    areaHa: p.areaHa,
    organicCertified: !!p.organicCertified,
    currentCrop: p.currentCrop,
    cropCode: p.cropCode,
    variety: p.variety,
    coords: p.coords,
    history: p.history || []
  }));
}

function seedApiariesAndLivestock() {
  return {
    apiaries: [
      { id: "rucher-1", name: "Rucher du Val de Loire", lat: 47.252, lng: -0.02, hives: 24, owner: "Apiculteur adhérent" },
      { id: "rucher-2", name: "Rucher des Coteaux", lat: 47.31, lng: 0.05, hives: 12, owner: "Apiculteur adhérent" }
    ],
    livestock: [
      { id: "elevage-1", name: "Élevage bovin — GAEC de la Vallée", lat: 47.29, lng: 0.02, heads: 85, type: "bovin lait" },
      { id: "elevage-2", name: "Élevage porcin plein air", lat: 47.42, lng: -0.12, heads: 120, type: "porcin" }
    ]
  };
}

/**
 * Seeded mock reports removed on purpose (cold-start is handled by public data
 * layers + the cold-start mitigation of plan §7; the alert banner must only
 * count real community reports).
 */
function seedReports() {
  return [];
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
      const data = JSON.parse(raw);
      // support both legacy (array of reports) and current {reports, users, sessions} formats
      this.reports = Array.isArray(data) ? data : (data.reports || []);
      this.users = Array.isArray(data) ? [] : (data.users || []);
      this.sessions = Array.isArray(data) ? [] : (data.sessions || []);
      this.parcels = Array.isArray(data) ? seedParcels() : (data.parcels || seedParcels());
      const al = Array.isArray(data) ? seedApiariesAndLivestock() : (data.apiaries ? data : seedApiariesAndLivestock());
      this.apiaries = al.apiaries || [];
      this.livestock = al.livestock || [];
    } catch (err) {
      this.reports = seedReports().map((r) => this.normalizeSeed(r));
      this.users = [];
      this.sessions = [];
      this.parcels = seedParcels();
      const al = seedApiariesAndLivestock();
      this.apiaries = al.apiaries;
      this.livestock = al.livestock;
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
    fs.writeFileSync(tmp, JSON.stringify({ reports: this.reports, users: this.users || [], sessions: this.sessions || [], parcels: this.parcels || [], apiaries: this.apiaries || [], livestock: this.livestock || [] }, null, 2));
    fs.renameSync(tmp, this.dataFile);
  }

  list() {
    return this.reports;
  }

  add(observation, user = null) {
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
      origin: "community",
      ...(user ? { userId: user.id } : {})
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

  get(id) {
    return this.reports.find((r) => r.id === id) || null;
  }

  /** File de modération : signalements communautaires en attente de validation. */
  pendingModeration() {
    return this.reports.filter((r) => r.origin === "community" && r.status === "pending_moderation");
  }

  /** Suppression (modérateur/admin ou propriétaire du signalement). */
  remove(id) {
    const i = this.reports.findIndex((r) => r.id === id);
    if (i < 0) return null;
    const [removed] = this.reports.splice(i, 1);
    this.persist();
    return removed;
  }

  /** P2 modération : change le statut d'un signalement (pending_moderation / confirmed / rejected). */
  setStatus(id, status) {
    if (!REPORT_STATUSES.includes(status)) {
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

  /** Plan §3.5 use case 1 : fiche d'identité d'une parcelle. */
  getParcel(id) {
    return (this.parcels || []).find((p) => p.id === id) || null;
  }

  /** Signalements communautaires géométriquement contenus dans la parcelle (point-in-polygon). */
  reportsForParcel(parcel) {
    if (!parcel || !parcel.coords) return [];
    const ring = parcel.coords;
    return this.reports.filter((r) => r.origin === "community" && pointInPolygon([r.location.lng, r.location.lat], ring));
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

/** Ray-casting point-in-polygon. coords: [[lat,lng],...]; point: [lng,lat]. */
function pointInPolygon(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = [ring[i][1], ring[i][0]];
    const [xj, yj] = [ring[j][1], ring[j][0]];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

module.exports = { ReportStore, seedReports, seedParcels, DEFAULT_DATA_FILE, REPORT_STATUSES, REPORT_STATUS_TRANSITIONS };
