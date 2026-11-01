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
  "SOJ": "Soja", "RIC": "Ricin", "TAB": "Tabac", "LEG": "Légumineuses fourragères",
  // codes observed in the field (Nord/Lille area) — full list: descriptif de contenu RPG v2 (GEVES)
  "MIS": "Miscanthus", "SNE": "Sarrasin (blé noir)", "PTR": "Prairie temporaire récent", "PTC": "Pâturin / prairie de fauche tardive",
  "PPH": "Prairie permanente haute valeur", "BTP": "Blé tendre de printemps", "BOR": "Bordure / bande enherbée",
  "JAC": "Jachère", "MDI": "Mélange d'espèces fourragères (méteil)", "FLA": "Fléole des prés", "FLP": "Fétuque élevée",
  "MOT": "Moutarde (culture intermédiaire)", "BFS": "Féverole de printemps", "HPC": "Houblon", "NVT": "Navet fourrager",
  "PFR": "Phacélie (culture intermédiaire)", "POR": "Pomme de terre de plein champ (primeur)", "VRG": "Verger", "CSE": "Cerise", "AVP": "Avoine de printemps",
  "CZH": "Colza de printemps (semis tardif)", "CCN": "Chou-navet / chou fourrager", "LBF": "Lupin blanc fourrager", "PEP": "Pépinière", "SIN": "Sainfoin",
  "RDI": "Radis fourrager (culture intermédiaire)", "PEV": "Poirier à cidre", "PHF": "Phacélie + féverole (mélange)", "CTG": "Châtaignier", "MLG": "Millet",
  "MID": "Millet des oiseaux", "SPH": "Sorgho fourrager", "CEL": "Céleri", "FRA": "Fraise", "BFS2": "Féverole"
};

function cultureLabel(code) {
  if (!code) return "—";
  return CULTURE_CODES[String(code).toUpperCase()] || `Culture ${code}`;
}
