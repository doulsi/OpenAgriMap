/**
 * OpenAgriMap - P5 Gamification (plan v2): niveaux
 * Graine -> Jardinier -> Maraîcher -> Agronome, sur le nombre de
 * signalements confirmés (réputation P2). Sans enjeu monétaire.
 */
"use strict";

const LEVELS = [
  { name: "Graine", minConfirmed: 0, icon: "🌱" },
  { name: "Jardinier", minConfirmed: 3, icon: "🪴" },
  { name: "Maraîcher", minConfirmed: 10, icon: "🚜" },
  { name: "Agronome", minConfirmed: 25, icon: "🎓" }
];

function levelFor(confirmedReports) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (confirmedReports >= lvl.minConfirmed) current = lvl;
  }
  const next = LEVELS.find((l) => l.minConfirmed > confirmedReports) || null;
  return {
    ...current,
    next: next ? { name: next.name, icon: next.icon, at: next.minConfirmed } : null,
    confirmedReports
  };
}

module.exports = { LEVELS, levelFor };
