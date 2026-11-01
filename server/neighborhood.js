/**
 * OpenAgriMap - Plan §3.2 item 3 (voisinage utile et à risque) & item 4 (benchmark).
 * Pure functions over reports + parcel-ish points; unit-testable.
 */
"use strict";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * §3.2-3: health-risk neighborhood around a point.
 * - sprayRisk: active reports (not rejected) within `radiusKm`
 * - sensitiveCrops: crops of those reports flagged as drift-sensitive
 * - apiaries/livestock within 3 km are the receptors (plan: apiculteurs < 3 km avant pulvérisation)
 */
const DRIFT_SENSITIVE_CROPS = ["bio", "miel", "vigne", "verger", "légume"];

function neighborhoodRisk(lat, lng, reports, apiaries, livestock, radiusKm = 10) {
  const active = reports.filter(
    (r) => r.origin !== "seed" ? r.status !== "rejected" : true
  );
  const nearby = active
    .map((r) => ({ ...r, distanceKm: haversineKm(lat, lng, r.location.lat, r.location.lng) }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const sprayRisk = nearby.filter((r) => r.status === "confirmed" || r.status === "pending_moderation");
  const sensitive = sprayRisk.filter((r) =>
    DRIFT_SENSITIVE_CROPS.some((k) => (r.crop || "").toLowerCase().includes(k))
  );
  const apiariesNear = (apiaries || [])
    .map((a) => ({ ...a, distanceKm: haversineKm(lat, lng, a.lat, a.lng) }))
    .filter((a) => a.distanceKm <= 3);
  const livestockNear = (livestock || [])
    .map((l) => ({ ...l, distanceKm: haversineKm(lat, lng, l.lat, l.lng) }))
    .filter((l) => l.distanceKm <= radiusKm);

  return {
    center: { lat, lng },
    radiusKm,
    activeReportsNearby: nearby.length,
    sprayRiskCount: sprayRisk.length,
    driftSensitiveCount: sensitive.length,
    apiariesWithin3km: apiariesNear,
    livestockNearby: livestockNear,
    worstReport: sprayRisk[0] || null,
    alert: apiariesNear.length > 0 && sprayRisk.length > 0
      ? `Pulvérisation à risque : ${sprayRisk.length} foyer(s) confirmé(s) à moins de ${radiusKm} km, ${apiariesNear.length} rucher(s) à moins de 3 km.`
      : null
  };
}

/**
 * §3.2-4: territory benchmark within radiusKm of a point.
 * Aggregates community reports by bioaggressor and by crop (proxy for local
 * pressure), plus parcel yields from the seeded parcel history.
 */
function territoryBenchmark(lat, lng, reports, parcels, radiusKm = 10) {
  const nearby = reports
    .map((r) => ({ ...r, distanceKm: haversineKm(lat, lng, r.location.lat, r.location.lng) }))
    .filter((r) => r.distanceKm <= radiusKm);

  const byAggressor = {};
  const byCrop = {};
  for (const r of nearby) {
    byAggressor[r.bioaggressor] = (byAggressor[r.bioaggressor] || 0) + 1;
    byCrop[r.crop] = (byCrop[r.crop] || 0) + 1;
  }

  const yields = [];
  for (const p of parcels || []) {
    const cl = centroid(p.coords);
    if (!cl) continue;
    const d = haversineKm(lat, lng, cl[0], cl[1]);
    if (d <= radiusKm) {
      for (const h of p.history || []) {
        const m = /(\d+(?:[.,]\d+)?)\s*(hL|q|t)\/ha/.exec(h.yield || "");
        if (m) yields.push({ parcelId: p.id, year: h.year, crop: h.crop, value: parseFloat(m[1].replace(",", ".")), unit: m[2] + "/ha", distanceKm: d });
      }
    }
  }

  return {
    center: { lat, lng },
    radiusKm,
    reportsInTerritory: nearby.length,
    pressureByAggressor: byAggressor,
    pressureByCrop: byCrop,
    yieldSamples: yields,
    avgYieldByUnit: avgByUnit(yields)
  };
}

function centroid(ring) {
  if (!ring || !ring.length) return null;
  let lat = 0, lng = 0;
  for (const [la, ln] of ring) { lat += la; lng += ln; }
  return [lat / ring.length, lng / ring.length];
}

function avgByUnit(yields) {
  const acc = {};
  for (const y of yields) {
    acc[y.unit] = acc[y.unit] || { sum: 0, n: 0 };
    acc[y.unit].sum += y.value;
    acc[y.unit].n += 1;
  }
  const out = {};
  for (const [u, a] of Object.entries(acc)) out[u] = parseFloat((a.sum / a.n).toFixed(1));
  return out;
}

module.exports = { haversineKm, neighborhoodRisk, territoryBenchmark };
