/**
 * OpenAgriMap Europe - Seeded Spatial Datasets (France & Couverture Européenne Complète)
 * - Parcelles représentatives réparties sur tous les bassins agricoles de France et d'Europe
 * - Points biodiversité & auxiliaires (INPN/LPO/Spipoll) et stations de mesure du statut
 *   hydrique et humidité du sol.
 * - Aucun signalement fictif : la couche Vigilance est alimentée exclusivement par les
 *   contributions citoyennes réelles (POST /api/reports -> data/reports.json).
 */

const DEFAULT_CENTER = {
  lat: 47.2600,
  lng: -0.0760,
  zoom: 6
};

const CROP_PARCELS = [
  {
    "id": "RPG-FR-001",
    "name": "Parcelle Les Hauts de Dampierre",
    "farm": "Domaine de la Chevalerie",
    "region": "Pays de la Loire (Saumur)",
    "country": "FR",
    "currentCrop": "Vigne AOP Saumur-Champigny",
    "cropCode": "VRC",
    "variety": "Cabernet Franc (Sélection massale)",
    "areaHa": 4.8,
    "organicCertified": false,
    "coords": [
      [
        47.245,
        -0.025
      ],
      [
        47.255,
        -0.015
      ],
      [
        47.25,
        0.005
      ],
      [
        47.238,
        -0.005
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Vigne enherbée 1 rang sur 2",
        "status": "En cours"
      },
      {
        "year": 2025,
        "crop": "Vigne (Couvert féverole / seigle)",
        "yield": "42 hL/ha"
      },
      {
        "year": 2024,
        "crop": "Vigne (Couvert trèfle)",
        "yield": "38 hL/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-002",
    "name": "Les Grands Champs de Chartres",
    "farm": "Exploitation Céréalière de Beauce",
    "region": "Centre-Val de Loire",
    "country": "FR",
    "currentCrop": "Blé tendre d'hiver",
    "cropCode": "BTH",
    "variety": "Chevignon (G1 meunerie)",
    "areaHa": 34.5,
    "organicCertified": false,
    "coords": [
      [
        48.42,
        1.48
      ],
      [
        48.45,
        1.48
      ],
      [
        48.45,
        1.54
      ],
      [
        48.41,
        1.53
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Blé tendre d'hiver",
        "status": "Stade tallage"
      },
      {
        "year": 2025,
        "crop": "Colza d'hiver",
        "yield": "36 q/ha"
      },
      {
        "year": 2024,
        "crop": "Orge brassicole",
        "yield": "78 q/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-003",
    "name": "Clos Saint-Émilion Grand Cru",
    "farm": "Château des Coteaux Dorés",
    "region": "Nouvelle-Aquitaine",
    "country": "FR",
    "currentCrop": "Vigne Rouge AOP",
    "cropCode": "VRC",
    "variety": "Merlot noir 80%, Cabernet Franc 20%",
    "areaHa": 8.2,
    "organicCertified": true,
    "coords": [
      [
        44.88,
        -0.18
      ],
      [
        44.91,
        -0.17
      ],
      [
        44.9,
        -0.13
      ],
      [
        44.87,
        -0.14
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Vigne en biodynamie",
        "status": "Taille guyot"
      },
      {
        "year": 2025,
        "crop": "Vigne (Enherbement spontané)",
        "yield": "45 hL/ha"
      },
      {
        "year": 2024,
        "crop": "Vigne",
        "yield": "41 hL/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-004",
    "name": "Îlot Légumier de la Baie",
    "farm": "Coopérative Maraîchère d'Armor",
    "region": "Bretagne",
    "country": "FR",
    "currentCrop": "Choux-fleurs de Bretagne & Artichauts",
    "cropCode": "MLG",
    "variety": "Camus de Bretagne & Belot",
    "areaHa": 12,
    "organicCertified": true,
    "coords": [
      [
        48.55,
        -1.95
      ],
      [
        48.58,
        -1.93
      ],
      [
        48.57,
        -1.88
      ],
      [
        48.54,
        -1.9
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Choux-fleurs d'hiver",
        "status": "Récolte manuelle"
      },
      {
        "year": 2025,
        "crop": "Échalotes traditionnelles",
        "yield": "24 t/ha"
      },
      {
        "year": 2024,
        "crop": "Blé noir / Sarrasin IGP",
        "yield": "18 q/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-005",
    "name": "Coteaux de la Montagne de Reims",
    "farm": "Domaine Effervescent Champenois",
    "region": "Grand-Est",
    "country": "FR",
    "currentCrop": "Vigne Champagne AOP",
    "cropCode": "VRC",
    "variety": "Pinot Noir & Chardonnay",
    "areaHa": 6.5,
    "organicCertified": false,
    "coords": [
      [
        49.12,
        4.02
      ],
      [
        49.15,
        4.04
      ],
      [
        49.14,
        4.09
      ],
      [
        49.1,
        4.07
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Vigne certifiée HVE3",
        "status": "Débourrement"
      },
      {
        "year": 2025,
        "crop": "Vigne",
        "yield": "10 500 kg/ha"
      },
      {
        "year": 2024,
        "crop": "Vigne",
        "yield": "11 200 kg/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-006",
    "name": "Plaine Sucrière de Flandre",
    "farm": "Ferme des Terres Noires",
    "region": "Hauts-de-France",
    "country": "FR",
    "currentCrop": "Betterave sucrière & Pommes de terre",
    "cropCode": "BTS",
    "variety": "BTS Isidor (tolérance cercosporiose)",
    "areaHa": 28,
    "organicCertified": false,
    "coords": [
      [
        50.48,
        2.92
      ],
      [
        50.52,
        2.94
      ],
      [
        50.51,
        3.01
      ],
      [
        50.46,
        2.99
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Betterave sucrière",
        "status": "Semis récent"
      },
      {
        "year": 2025,
        "crop": "Blé tendre d'hiver",
        "yield": "92 q/ha"
      },
      {
        "year": 2024,
        "crop": "Pommes de terre d'industrie",
        "yield": "54 t/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-007",
    "name": "Lauragais Céréalier et Oléagineux",
    "farm": "Domaine des Moulins du Midi",
    "region": "Occitanie",
    "country": "FR",
    "currentCrop": "Blé dur & Tournesol",
    "cropCode": "BDU",
    "variety": "Anvergur (qualité pastière)",
    "areaHa": 42,
    "organicCertified": false,
    "coords": [
      [
        43.52,
        1.58
      ],
      [
        43.56,
        1.61
      ],
      [
        43.54,
        1.68
      ],
      [
        43.5,
        1.64
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Blé dur de printemps",
        "status": "Tallage"
      },
      {
        "year": 2025,
        "crop": "Tournesol oléique",
        "yield": "28 q/ha"
      },
      {
        "year": 2024,
        "crop": "Pois protéagineux",
        "yield": "34 q/ha"
      }
    ]
  },
  {
    "id": "RPG-FR-008",
    "name": "Vergers & Melons de Cavaillon",
    "farm": "Mas Provençal des Oliviers",
    "region": "Provence-Alpes-Côte d'Azur",
    "country": "FR",
    "currentCrop": "Melon de Cavaillon IGP & Pommiers",
    "cropCode": "MLG",
    "variety": "Charentais jaune & Pink Lady",
    "areaHa": 14.2,
    "organicCertified": true,
    "coords": [
      [
        43.85,
        4.95
      ],
      [
        43.88,
        4.98
      ],
      [
        43.87,
        5.04
      ],
      [
        43.83,
        5.01
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Melon sous chenilles",
        "status": "Floraison"
      },
      {
        "year": 2025,
        "crop": "Courgettes & Salades d'hiver",
        "yield": "32 t/ha"
      },
      {
        "year": 2024,
        "crop": "Engrais vert (Vesce/Avoine)",
        "status": "Enfouissement"
      }
    ]
  },
  {
    "id": "RPG-FR-009",
    "name": "Plaine Agrumicole Orientale",
    "farm": "Vergers d'Aléria et Ghisonaccia",
    "region": "Corse",
    "country": "FR",
    "currentCrop": "Clémentine de Corse IGP",
    "cropCode": "AGR",
    "variety": "Clémentinier Commune de Corse",
    "areaHa": 9.8,
    "organicCertified": true,
    "coords": [
      [
        42.15,
        9.49
      ],
      [
        42.18,
        9.51
      ],
      [
        42.17,
        9.56
      ],
      [
        42.13,
        9.54
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Clémentiniers en bio",
        "status": "Grossissement fruits"
      },
      {
        "year": 2025,
        "crop": "Clémentines IGP",
        "yield": "22 t/ha"
      },
      {
        "year": 2024,
        "crop": "Clémentines IGP",
        "yield": "25 t/ha"
      }
    ]
  },
  {
    "id": "RPG-BE-001",
    "name": "Plaine de Gembloux et Hesbaye",
    "farm": "Ferme Agro-Écologique Brabançonne",
    "region": "Hesbaye (Wallonie)",
    "country": "BE",
    "currentCrop": "Pommes de terre de consommation & Betteraves",
    "cropCode": "PDT",
    "variety": "Bintje & Fontane",
    "areaHa": 26.5,
    "organicCertified": false,
    "coords": [
      [
        50.54,
        4.67
      ],
      [
        50.58,
        4.7
      ],
      [
        50.57,
        4.76
      ],
      [
        50.53,
        4.73
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Pommes de terre",
        "status": "Surveillance mildiou active"
      },
      {
        "year": 2025,
        "crop": "Blé d'hiver",
        "yield": "88 q/ha"
      },
      {
        "year": 2024,
        "crop": "Betterave sucrière",
        "yield": "85 t/ha"
      }
    ]
  },
  {
    "id": "RPG-DE-001",
    "name": "Hallertau Hopfenland",
    "farm": "Hopfenbauernhof Bayern",
    "region": "Bavière (Hallertau)",
    "country": "DE",
    "currentCrop": "Houblon AOP Hallertau & Orge brassicole",
    "cropCode": "HOU",
    "variety": "Hallertauer Mittelfrüh & Cascade",
    "areaHa": 18,
    "organicCertified": true,
    "coords": [
      [
        48.55,
        11.68
      ],
      [
        48.59,
        11.71
      ],
      [
        48.58,
        11.78
      ],
      [
        48.54,
        11.75
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Houblon palissé",
        "status": "Croissance des lianes"
      },
      {
        "year": 2025,
        "crop": "Houblon de tradition",
        "yield": "1 950 kg/ha"
      },
      {
        "year": 2024,
        "crop": "Orge de printemps",
        "yield": "72 q/ha"
      }
    ]
  },
  {
    "id": "RPG-ES-001",
    "name": "Viñedos de Rioja Alta",
    "farm": "Bodega Histórica del Ebro",
    "region": "La Rioja",
    "country": "ES",
    "currentCrop": "Vigne DOCa Rioja",
    "cropCode": "VRC",
    "variety": "Tempranillo 85%, Graciano 15%",
    "areaHa": 15.4,
    "organicCertified": true,
    "coords": [
      [
        42.48,
        -2.52
      ],
      [
        42.52,
        -2.5
      ],
      [
        42.51,
        -2.43
      ],
      [
        42.47,
        -2.45
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Vignes centenaires",
        "status": "Débourrement"
      },
      {
        "year": 2025,
        "crop": "Tempranillo Crianza",
        "yield": "5 200 kg/ha"
      },
      {
        "year": 2024,
        "crop": "Tempranillo Reserva",
        "yield": "4 800 kg/ha"
      }
    ]
  },
  {
    "id": "RPG-ES-002",
    "name": "Olivares de la Campiña Sevillana",
    "farm": "Hacienda del Guadalquivir",
    "region": "Andalousie",
    "country": "ES",
    "currentCrop": "Oliveraie AOP Huile d'Olive Vierge Extra",
    "cropCode": "OLI",
    "variety": "Picual & Hojiblanca",
    "areaHa": 48,
    "organicCertified": true,
    "coords": [
      [
        37.42,
        -5.92
      ],
      [
        37.46,
        -5.9
      ],
      [
        37.45,
        -5.82
      ],
      [
        37.4,
        -5.85
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Oliveraie super-intensive",
        "status": "Nouaison"
      },
      {
        "year": 2025,
        "crop": "Olives de table et moulin",
        "yield": "7 800 kg/ha"
      },
      {
        "year": 2024,
        "crop": "Olives bio",
        "yield": "6 900 kg/ha"
      }
    ]
  },
  {
    "id": "RPG-IT-001",
    "name": "Risaie della Bassa Cremonese",
    "farm": "Cascina Agricola Padana",
    "region": "Lombardie (Plaine du Pô)",
    "country": "IT",
    "currentCrop": "Riz IGP & Maïs grain",
    "cropCode": "RIZ",
    "variety": "Carnaroli & Arborio Superfino",
    "areaHa": 52,
    "organicCertified": false,
    "coords": [
      [
        45.16,
        10.05
      ],
      [
        45.2,
        10.08
      ],
      [
        45.19,
        10.16
      ],
      [
        45.14,
        10.13
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Riz en submersion",
        "status": "Semis aquatique"
      },
      {
        "year": 2025,
        "crop": "Riz Carnaroli",
        "yield": "68 q/ha"
      },
      {
        "year": 2024,
        "crop": "Maïs grain irrigué",
        "yield": "125 q/ha"
      }
    ]
  },
  {
    "id": "RPG-IT-002",
    "name": "Colline del Chianti Classico",
    "farm": "Tenuta Vitivinicola Senese",
    "region": "Toscane",
    "country": "IT",
    "currentCrop": "Vigne Chianti Classico DOCG & Oliviers",
    "cropCode": "VRC",
    "variety": "Sangiovese 90%, Canaiolo 10%",
    "areaHa": 11.5,
    "organicCertified": true,
    "coords": [
      [
        43.35,
        11.28
      ],
      [
        43.39,
        11.31
      ],
      [
        43.38,
        11.37
      ],
      [
        43.33,
        11.34
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Vignoble de colline",
        "status": "Taille toscane"
      },
      {
        "year": 2025,
        "crop": "Chianti Classico Riserva",
        "yield": "46 hL/ha"
      },
      {
        "year": 2024,
        "crop": "Chianti Classico",
        "yield": "48 hL/ha"
      }
    ]
  },
  {
    "id": "RPG-NL-001",
    "name": "Westland Glazen Stad",
    "farm": "Innovatie Tuinbouw Westland",
    "region": "Hollande-Méridionale",
    "country": "NL",
    "currentCrop": "Maraîchage sous serres high-tech & tomates grappes",
    "cropCode": "MLG",
    "variety": "Tomate cocktail & Poivron doux",
    "areaHa": 6.8,
    "organicCertified": false,
    "coords": [
      [
        52,
        4.19
      ],
      [
        52.03,
        4.21
      ],
      [
        52.02,
        4.26
      ],
      [
        51.98,
        4.23
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Culture hydroponique géothermique",
        "status": "Production continue"
      },
      {
        "year": 2025,
        "crop": "Tomates grappes d'élite",
        "yield": "68 kg/m²"
      },
      {
        "year": 2024,
        "crop": "Poivrons tricolores",
        "yield": "32 kg/m²"
      }
    ]
  },
  {
    "id": "RPG-CH-001",
    "name": "Vignoble en Terrasses du Valais",
    "farm": "Domaine des Bisses du Rhône",
    "region": "Valais",
    "country": "CH",
    "currentCrop": "Vigne en terrasses AOC Valais",
    "cropCode": "VRC",
    "variety": "Petite Arvine, Fendant (Chasselas), Cornalin",
    "areaHa": 5.2,
    "organicCertified": true,
    "coords": [
      [
        46.21,
        7.32
      ],
      [
        46.24,
        7.35
      ],
      [
        46.23,
        7.4
      ],
      [
        46.19,
        7.37
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Vignes de montagne",
        "status": "Débourrement"
      },
      {
        "year": 2025,
        "crop": "Petite Arvine flétrie",
        "yield": "35 hL/ha"
      },
      {
        "year": 2024,
        "crop": "Fendant du Valais",
        "yield": "48 hL/ha"
      }
    ]
  },
  {
    "id": "RPG-GB-001",
    "name": "Cambridgeshire Fenland Arable",
    "farm": "East Anglian Grain Growers",
    "region": "East Anglia",
    "country": "GB",
    "currentCrop": "Blé d'hiver meunier & Colza d'automne",
    "cropCode": "BTH",
    "variety": "Skyfall (Group 1 Milling Wheat)",
    "areaHa": 45,
    "organicCertified": false,
    "coords": [
      [
        52.23,
        0.15
      ],
      [
        52.27,
        0.18
      ],
      [
        52.26,
        0.25
      ],
      [
        52.21,
        0.22
      ]
    ],
    "history": [
      {
        "year": 2026,
        "crop": "Winter Wheat",
        "status": "Early spring tillering"
      },
      {
        "year": 2025,
        "crop": "Winter Oilseed Rape",
        "yield": "3.8 t/ha"
      },
      {
        "year": 2024,
        "crop": "Spring Malting Barley",
        "yield": "7.6 t/ha"
      }
    ]
  }
];

const BIODIVERSITY_POINTS = [
  { id: "bio-1", category: "birds", name: "Buse variable", scientificName: "Buteo buteo", lat: 47.31, lng: -0.05, role: "Rapace chasseur de rongeurs (campagnols, mulots)", date: "2026-10-12", observer: "LPO / INPN", status: "Espèce protégée — auxiliaire majeur des cultures" },
  { id: "bio-2", category: "birds", name: "Chouette hulotte", scientificName: "Strix aluco", lat: 47.22, lng: 0.12, role: "Prédation nocturne des rongeurs des silos et parcelles", date: "2026-09-28", observer: "INPN / Vigie-Nature", status: "Espèce protégée" },
  { id: "bio-3", category: "birds", name: "Hirondelle de fenêtre", scientificName: "Delichon urbicum", lat: 47.26, lng: -0.08, role: "Consommation massive d'insectes volants (pucerons, moucherons)", date: "2026-10-02", observer: "INPN", status: "Auxiliaire — population suivie" },
  { id: "bio-4", category: "pollinators", name: "Abeille domestique", scientificName: "Apis mellifera", lat: 47.252, lng: -0.02, role: "Pollinisation des vergers et cultures maraîchères", date: "2026-10-20", observer: "Spipoll / MNHN", status: "Suivi participatif Spipoll" },
  { id: "bio-5", category: "pollinators", name: "Bourdon terrestre", scientificName: "Bombus terrestris", lat: 47.30, lng: 0.05, role: "Pollinisateur de la tomate sous abri (bourdonnement vibreur)", date: "2026-10-15", observer: "Spipoll / MNHN", status: "Suivi participatif Spipoll" },
  { id: "bio-6", category: "insects", name: "Coccinelle à 7 points", scientificName: "Coccinella septempunctata", lat: 47.28, lng: -0.02, role: "Prédation des pucerons (jusqu'à 100/jour)", date: "2026-10-25", observer: "INPN", status: "Auxiliaire — lâchers biologiques" },
  { id: "bio-7", category: "insects", name: "Syrphe ceinturé", scientificName: "Episyrphus balteatus", lat: 47.24, lng: 0.08, role: "Larves prédatrices de pucerons ; adulte pollinisateur", date: "2026-10-18", observer: "INPN", status: "Auxiliaire double (larve + adulte)" },
  { id: "bio-8", category: "insects", name: "Chrysope verte", scientificName: "Chrysoperla carnea", lat: 47.33, lng: -0.11, role: "Larves voraces de pucerons, cochenilles, œufs de doryphore", date: "2026-10-22", observer: "INPN", status: "Auxiliaire — lâchers en serres" },
  { id: "bio-9", category: "birds", name: "Faucon crécerelle", scientificName: "Falco tinnunculus", lat: 47.40, lng: 0.02, role: "Régulation des populations de campagnols en prairie", date: "2026-10-08", observer: "LPO", status: "Espèce protégée" },
  { id: "bio-10", category: "pollinators", name: "Osmie rousse", scientificName: "Osmia bicornis", lat: 47.29, lng: 0.03, role: "Pollinisateur solitaire très efficace des arbres fruitiers", date: "2026-04-15", observer: "Spipoll / MNHN", status: "Espèce printanière — nichoirs" }
];

const SOIL_WATER_STATIONS = [
  {
    "id": "wat-fr-loire",
    "name": "Station Agro-Hydrique • Val de Loire",
    "hubId": "FR-LOIRE",
    "country": "FR",
    "lat": 47.26,
    "lng": -0.08,
    "surfaceMoisture": 26.3,
    "rootMoisture": 31,
    "soilTemp": 16.4,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 26.3,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 28.6,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 31,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-aquit",
    "name": "Station Agro-Hydrique • Nouvelle-Aquitaine",
    "hubId": "FR-AQUIT",
    "country": "FR",
    "lat": 44.84,
    "lng": -0.58,
    "surfaceMoisture": 33.7,
    "rootMoisture": 39.8,
    "soilTemp": 13,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 33.7,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 36.8,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 39.8,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-bretagne",
    "name": "Station Agro-Hydrique • Bretagne",
    "hubId": "FR-BRETAGNE",
    "country": "FR",
    "lat": 48.11,
    "lng": -1.68,
    "surfaceMoisture": 34.7,
    "rootMoisture": 41,
    "soilTemp": 12.6,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 34.7,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 37.9,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 41,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-beauce",
    "name": "Station Agro-Hydrique • Centre-Val de Loire",
    "hubId": "FR-BEAUCE",
    "country": "FR",
    "lat": 48.44,
    "lng": 1.49,
    "surfaceMoisture": 26.9,
    "rootMoisture": 31.7,
    "soilTemp": 16.1,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 26.9,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 29.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 31.7,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-nord",
    "name": "Station Agro-Hydrique • Hauts-de-France",
    "hubId": "FR-NORD",
    "country": "FR",
    "lat": 50.45,
    "lng": 2.85,
    "surfaceMoisture": 32.8,
    "rootMoisture": 38.7,
    "soilTemp": 13.5,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 32.8,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 35.8,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 38.7,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-champ",
    "name": "Station Agro-Hydrique • Grand-Est",
    "hubId": "FR-CHAMP",
    "country": "FR",
    "lat": 49.05,
    "lng": 4.05,
    "surfaceMoisture": 23.1,
    "rootMoisture": 27.3,
    "soilTemp": 17.9,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 23.1,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 25.2,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 27.3,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-bourg",
    "name": "Station Agro-Hydrique • Bourgogne",
    "hubId": "FR-BOURG",
    "country": "FR",
    "lat": 47.02,
    "lng": 4.84,
    "surfaceMoisture": 25.1,
    "rootMoisture": 29.6,
    "soilTemp": 17,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 25.1,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 27.4,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 29.6,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-alsace",
    "name": "Station Agro-Hydrique • Alsace",
    "hubId": "FR-ALSACE",
    "country": "FR",
    "lat": 48.08,
    "lng": 7.36,
    "surfaceMoisture": 22.3,
    "rootMoisture": 26.3,
    "soilTemp": 18.2,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 22.3,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 24.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 26.3,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-occit",
    "name": "Station Agro-Hydrique • Occitanie",
    "hubId": "FR-OCCIT",
    "country": "FR",
    "lat": 43.6,
    "lng": 1.44,
    "surfaceMoisture": 31.1,
    "rootMoisture": 36.7,
    "soilTemp": 14.2,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 31.1,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 33.9,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 36.7,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-rhone",
    "name": "Station Agro-Hydrique • Vallée du Rhône",
    "hubId": "FR-RHONE",
    "country": "FR",
    "lat": 44.93,
    "lng": 4.89,
    "surfaceMoisture": 23.2,
    "rootMoisture": 27.4,
    "soilTemp": 17.8,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 23.2,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 25.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 27.4,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-paca",
    "name": "Station Agro-Hydrique • Provence",
    "hubId": "FR-PACA",
    "country": "FR",
    "lat": 43.9,
    "lng": 4.9,
    "surfaceMoisture": 14.2,
    "rootMoisture": 16.7,
    "soilTemp": 21.9,
    "status": "drought",
    "statusLabel": "Stress Hydrique / Sécheresse",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 14.2,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 15.4,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 16.7,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-norm",
    "name": "Station Agro-Hydrique • Normandie",
    "hubId": "FR-NORM",
    "country": "FR",
    "lat": 49.44,
    "lng": 1.09,
    "surfaceMoisture": 20.9,
    "rootMoisture": 24.7,
    "soilTemp": 18.8,
    "status": "deficit",
    "statusLabel": "Déficit Hydrique Modéré",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 20.9,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 22.8,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 24.7,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-idf",
    "name": "Station Agro-Hydrique • Île-de-France",
    "hubId": "FR-IDF",
    "country": "FR",
    "lat": 48.96,
    "lng": 2.88,
    "surfaceMoisture": 34,
    "rootMoisture": 40.1,
    "soilTemp": 12.9,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 34,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 37,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 40.1,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-auvergne",
    "name": "Station Agro-Hydrique • Massif Central / Auvergne",
    "hubId": "FR-AUVERGNE",
    "country": "FR",
    "lat": 45.78,
    "lng": 3.08,
    "surfaceMoisture": 36,
    "rootMoisture": 42.5,
    "soilTemp": 12,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 36,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 39.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 42.5,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-fr-corse",
    "name": "Station Agro-Hydrique • Corse",
    "hubId": "FR-CORSE",
    "country": "FR",
    "lat": 42.45,
    "lng": 9.48,
    "surfaceMoisture": 19.4,
    "rootMoisture": 22.9,
    "soilTemp": 19.5,
    "status": "deficit",
    "statusLabel": "Déficit Hydrique Modéré",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 19.4,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 21.1,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 22.9,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-be-hesbaye",
    "name": "Station Agro-Hydrique • Belgique",
    "hubId": "BE-HESBAYE",
    "country": "BE",
    "lat": 50.56,
    "lng": 4.7,
    "surfaceMoisture": 35.8,
    "rootMoisture": 42.3,
    "soilTemp": 12.1,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 35.8,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 39,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 42.3,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-be-flandre",
    "name": "Station Agro-Hydrique • Belgique",
    "hubId": "BE-FLANDRE",
    "country": "BE",
    "lat": 51.05,
    "lng": 3.72,
    "surfaceMoisture": 29.3,
    "rootMoisture": 34.6,
    "soilTemp": 15.1,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 29.3,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 32,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 34.6,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-de-bayern",
    "name": "Station Agro-Hydrique • Allemagne",
    "hubId": "DE-BAYERN",
    "country": "DE",
    "lat": 48.4,
    "lng": 11.75,
    "surfaceMoisture": 35.9,
    "rootMoisture": 42.4,
    "soilTemp": 12,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 35.9,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 39.1,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 42.4,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-de-rhein",
    "name": "Station Agro-Hydrique • Allemagne",
    "hubId": "DE-RHEIN",
    "country": "DE",
    "lat": 49.99,
    "lng": 8.27,
    "surfaceMoisture": 25.4,
    "rootMoisture": 30,
    "soilTemp": 16.8,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 25.4,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 27.7,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 30,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-de-bw",
    "name": "Station Agro-Hydrique • Allemagne",
    "hubId": "DE-BW",
    "country": "DE",
    "lat": 48.78,
    "lng": 9.18,
    "surfaceMoisture": 36,
    "rootMoisture": 42.5,
    "soilTemp": 12,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 36,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 39.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 42.5,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-es-rioja",
    "name": "Station Agro-Hydrique • Espagne",
    "hubId": "ES-RIOJA",
    "country": "ES",
    "lat": 42.46,
    "lng": -2.45,
    "surfaceMoisture": 36,
    "rootMoisture": 42.5,
    "soilTemp": 12,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 36,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 39.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 42.5,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-es-andal",
    "name": "Station Agro-Hydrique • Espagne",
    "hubId": "ES-ANDAL",
    "country": "ES",
    "lat": 37.39,
    "lng": -5.98,
    "surfaceMoisture": 27.7,
    "rootMoisture": 32.7,
    "soilTemp": 15.8,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 27.7,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 30.2,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 32.7,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-es-valencia",
    "name": "Station Agro-Hydrique • Espagne",
    "hubId": "ES-VALENCIA",
    "country": "ES",
    "lat": 39.47,
    "lng": -0.38,
    "surfaceMoisture": 25.1,
    "rootMoisture": 29.6,
    "soilTemp": 17,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 25.1,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 27.4,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 29.6,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-es-castilla",
    "name": "Station Agro-Hydrique • Espagne",
    "hubId": "ES-CASTILLA",
    "country": "ES",
    "lat": 41.65,
    "lng": -4.72,
    "surfaceMoisture": 31.4,
    "rootMoisture": 37.1,
    "soilTemp": 14.1,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 31.4,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 34.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 37.1,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-it-po",
    "name": "Station Agro-Hydrique • Italie",
    "hubId": "IT-PO",
    "country": "IT",
    "lat": 45.13,
    "lng": 10.02,
    "surfaceMoisture": 34.1,
    "rootMoisture": 40.3,
    "soilTemp": 12.9,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 34.1,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 37.2,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 40.3,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-it-toscana",
    "name": "Station Agro-Hydrique • Italie",
    "hubId": "IT-TOSCANA",
    "country": "IT",
    "lat": 43.32,
    "lng": 11.33,
    "surfaceMoisture": 18.6,
    "rootMoisture": 21.9,
    "soilTemp": 19.9,
    "status": "deficit",
    "statusLabel": "Déficit Hydrique Modéré",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 18.6,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 20.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 21.9,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-it-veneto",
    "name": "Station Agro-Hydrique • Italie",
    "hubId": "IT-VENETO",
    "country": "IT",
    "lat": 45.67,
    "lng": 12.24,
    "surfaceMoisture": 34.7,
    "rootMoisture": 41,
    "soilTemp": 12.6,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 34.7,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 37.9,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 41,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-nl-westland",
    "name": "Station Agro-Hydrique • Pays-Bas",
    "hubId": "NL-WESTLAND",
    "country": "NL",
    "lat": 52.01,
    "lng": 4.22,
    "surfaceMoisture": 35.6,
    "rootMoisture": 42,
    "soilTemp": 12.2,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 35.6,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 38.8,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 42,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-ch-valais",
    "name": "Station Agro-Hydrique • Suisse",
    "hubId": "CH-VALAIS",
    "country": "CH",
    "lat": 46.23,
    "lng": 7.36,
    "surfaceMoisture": 34.7,
    "rootMoisture": 41,
    "soilTemp": 12.6,
    "status": "saturated",
    "statusLabel": "Engorgement / Sols Saturés",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 34.7,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 37.9,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 41,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-gb-east",
    "name": "Station Agro-Hydrique • Royaume-Uni",
    "hubId": "GB-EAST",
    "country": "GB",
    "lat": 52.2,
    "lng": 0.12,
    "surfaceMoisture": 27.3,
    "rootMoisture": 32.2,
    "soilTemp": 15.9,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 27.3,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 29.8,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 32.2,
        "label": "Zone racinaire"
      }
    ]
  },
  {
    "id": "wat-gb-kent",
    "name": "Station Agro-Hydrique • Royaume-Uni",
    "hubId": "GB-KENT",
    "country": "GB",
    "lat": 51.27,
    "lng": 0.52,
    "surfaceMoisture": 27.8,
    "rootMoisture": 32.8,
    "soilTemp": 15.7,
    "status": "optimal",
    "statusLabel": "Confort Hydrique",
    "depths": [
      {
        "depth": "0-3cm",
        "val": 27.8,
        "label": "Surface"
      },
      {
        "depth": "3-15cm",
        "val": 30.3,
        "label": "Horizon arable"
      },
      {
        "depth": "15-30cm",
        "val": 32.8,
        "label": "Zone racinaire"
      }
    ]
  }
];

