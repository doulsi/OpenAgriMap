/**
 * OpenAgriMap - RPG culture codes (trigrammes) -> French labels.
 * Subset of the official RPG v2 code list (GEVES/SEMAE); unknown codes pass through.
 */
const CULTURE_CODES = {
  "BTA": "Blé tendre d'hiver", "BTH": "Blé tendre de printemps", "BDS": "Blé dur",
  "ORH": "Orge d'hiver", "ORG": "Orge de printemps", "AVH": "Avoine d'hiver",
  "MIE": "Maïs grain", "MAS": "Maïs ensilage", "SOG": "Sorgho",
  "BET": "Betterave sucrière", "COL": "Colza d'hiver", "TOU": "Tournesol",
  "LIN": "Lin oléagineux", "CHN": "Chanvre", "POT": "Pomme de terre",
  "TOM": "Tomate industrielle", "OIG": "Oignon", "CAR": "Carotte",
  "POI": "Pois protéagineux", "FEH": "Féverole d'hiver", "LUP": "Lupin",
  "VRC": "Vigne (raisin de cuve)", "VRQ": "Vigne (raisin de table)",
  "POM": "Pommier", "PIR": "Poirier", "CER": "Cerisier", "PEC": "Pêcher",
  "ABR": "Abricotier", "PRU": "Prunier", "OLI": "Olivier", "NOY": "Noyer",
  "PRA": "Prairie permanente", "PTD": "Prairie temporaire", "LUZ": "Luzerne",
  "TRE": "Trèfle", "VES": "Vesce", "MEL": "Mélilot", "FEV": "Féverole de printemps",
  "SOJ": "Soja", "RIC": "Ricin", "TAB": "Tabac", "LEG": "Légumineuses fourragères"
};

function cultureLabel(code) {
  if (!code) return "—";
  return CULTURE_CODES[String(code).toUpperCase()] || `Culture ${code}`;
}
