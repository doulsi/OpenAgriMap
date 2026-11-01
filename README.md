# OpenAgriMap France 🌾🇫🇷
> **L'OpenStreetMap pour l'Agriculture et la Vigilance Écologique en France**

Plateforme cartographique collaborative et ouverte dédiée au monde agricole et aux jardiniers. Elle unifie les données pédologiques (sols), la biodiversité fonctionnelle (pollinisateurs, oiseaux, auxiliaires), le cadastre cultural (RPG, assolement, variétés) et un **moteur d'alerte sanitaire participatif de proximité** (*"Le mildiou a été signalé par 17 jardiniers dans un rayon de 30 km"*).

---

## 🗺️ Les 4 Couches Fondatrices & Sources Open Data

### 1. 🌱 Couche Sols & Pédologie
- **ISRIC SoilGrids 2.0 (API REST)** : pH H₂O, granulométrie (argile, limon, sable), carbone organique et densité apparente à résolution 250m.
- **INRAE / GIS Sol (RMQS & BDAT)** : Réseau de Mesure de la Qualité des Sols et Banque d'analyses de terre.
- **Hub'Eau / BRGM** : Suivi piézométrique des nappes souterraines et conductivité pour évaluer la capacité de drainage.
- *Fonctionnalité clé dans l'app* : Sondeur de sol instantané interrogeant l'API REST en direct au clic sur n'importe quel point du territoire français.

### 2. 🐝 Couche Biodiversité & Auxiliaires
- **GBIF France / INPN MNHN** : Occurrences géoréférencées pour les oiseaux régulateurs (*Aves*, ex: rapaces chasseurs de rongeurs) et insectes utiles.
- **Spipoll (Vigie-Nature / MNHN)** : Suivi photographique participatif des insectes pollinisateurs (*Apis mellifera*, *Bombus*, syrphes, osmies).
- **OpenObs (SINP / OFB)** : Inventaire national du patrimoine naturel.

### 3. 🌾 Couche Cultures & Parcelles (RPG)
- **IGN Géoplateforme & ASP** : Registre Parcellaire Graphique (RPG) millésimé (2015–2024+) sous Licence Ouverte 2.0.
- **ApiCarto IGN** : Requêtage ponctuel et spatial des parcelles PAC sans téléchargement lourd.
- **GEVES & SEMAE** : Catalogue officiel des espèces et variétés végétales cultivées en France.
- *Fonctionnalité clé dans l'app* : Historique d'assolement pluriannuel et rotation culturale affichée par parcelle.

### 4. 🦠 Couche Vigilance Sanitaire & Épidémies (Crowdsourced OSM Model)
- **Bulletins de Santé du Végétal (BSV / DRAAF)** : Archives et bulletins hebdomadaires de surveillance phytosanitaire.
- **Météo-France Open Data** : Indicateurs hygrométriques et thermiques alimentant les modèles de risque mildiou et rouille.
- **Moteur d'Alerte Communautaire OpenAgriMap** :
  - **Bannière dynamique de proximité** : *"Le mildiou a été signalé par 17 jardiniers dans un rayon de 30 km."*
  - **Sélecteur de rayon interactif** : de 5 km à 80 km avec recalcul spatial temps réel (Turf.js).
  - **Formulaire de signalement citoyen** : Ajout d'observations (mildiou, rouille, doryphores, pucerons) avec mise à jour instantanée du cercle de veille et du flux d'alerte.

---

## ▶️ Lancer l'application

**Mode rapide (statique)** : ouvrez `index.html` dans un navigateur — l'app
fonctionne hors ligne avec les données d'amorçage, et les nouveaux signalements
restent locaux.

**Mode complet (avec API)** — Node >= 18, aucune dépendance à installer :

```bash
npm start          # sert l'API + le frontend sur http://127.0.0.1:8080
npm test           # tests de l'API (node --test)
```

L'API (`server/server.js`, zéro dépendance) expose :

- `GET /api/reports` — liste des signalements (filtre `?bbox=minLng,minLat,maxLng,maxLat`)
- `POST /api/reports` — enregistre un signalement validé contre
  [`schema/observation.schema.json`](schema/observation.schema.json)
  (culture, variété, bioagresseur, stade, notes, GPS, date, nom d'affichage ;
  **les signalements anonymes sont refusés** — 422)
- `GET /api/proxy/:source/*` — proxy de cache serveur pour les appels aux API
  tierces (ISRIC SoilGrids, Open-Meteo, GBIF, géocodage IGN, Nominatim), afin de ne pas exposer le navigateur
  aux limites de débit
- `PATCH /api/reports/:id` — modération (statut `pending_moderation` / `confirmed` / `rejected`)
- `GET /api/reporters/:name/reputation` — score de réputation + niveau de gamification
- `GET /api/export.geojson` — **export open data** des signalements communautaires (GeoJSON, ODbL)
- `GET /api/openapi.json` — **documentation publique de l'API** (OpenAPI 3, voir `docs/openapi.json`)
- `POST /api/auth/register` / `POST /api/auth/login` / `POST /api/auth/logout` — comptes (mot de passe hashé en scrypt, jeton de session 30 j)
- `GET /api/me` — profil du compte connecté (`Authorization: Bearer <token>`) ; un signalement soumis en étant connecté est lié au compte (`userId`)

Les signalements en doublon (même contributeur, culture et bioagresseur à moins
de 250 m et 24 h) sont refusés (409).

La persistance par défaut est un fichier JSON (`data/reports.json`, gitignoré) ;
le schéma cible PostgreSQL/PostGIS est dans [`server/schema.sql`](server/schema.sql).

## 📱 PWA & mobile (P4)

Servie via `npm start`, l'app est **installable** (manifest + service worker `sw.js`) :
l'icône 🌾 apparaît dans « Ajouter à l'écran d'accueil » (Android) / « Sur l'écran d'accueil » (iOS).
Hors ligne, le shell de l'app reste disponible (cache) et les appels API retombent sur le cache.
Le bouton **Position actuelle** du formulaire utilise le GPS du téléphone (`navigator.geolocation`),
et un champ **photo** permet de joindre une image (aperçu local ; l'upload réel arrive avec les comptes P1).

## 🎮 Gamification (P5)

Niveaux selon les signalements **confirmés** : 🌱 Graine (0) → 🪴 Jardinier (3) → 🚜 Maraîcher (10) → 🎓 Agronome (25).
Le badge de niveau s'affiche en direct dans le formulaire de signalement (`GET /api/reporters/:name/reputation`).

## 🧪 Tester

```bash
npm test          # 16 tests node --test (aucun accès réseau requis)
npm start         # puis ouvrir http://127.0.0.1:8080
```

Vérifications manuelles rapides :
1. Ouvrir http://127.0.0.1:8080 → la carte se charge, la bannière affiche les foyers du rayon.
2. **Signaler une alerte** → remplir le formulaire (nom d'affichage obligatoire) → toast de succès, le point apparaît.
3. Soumettre le **même** signalement → toast d'erreur (409 doublon).
4. Ouvrir `http://127.0.0.1:8080/api/reports` dans le navigateur → liste JSON des signalements.
5. `http://127.0.0.1:8080/api/export.geojson` → export GeoJSON ODbL (téléchargeable).
6. `http://127.0.0.1:8080/api/openapi.json` → spec OpenAPI (lisible aussi dans un Swagger UI).
7. Créer un compte via l'API (POST `/api/auth/register` avec `{email, password, displayName}`) → récupérer le `token`, puis GET `/api/me` avec `Authorization: Bearer <token>`.
8. Installer la PWA : icône « Install » dans la barre d'adresse (Chrome/Edge) après `npm start`.

## 🗺️ Feuille de route & conformité

[ROADMAP.md](ROADMAP.md) (priorités P1–P7 du plan produit & business v2), conformité RGPD/licences/RPG dans [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

## 🤝 Contribuer

Le projet est ouvert aux contributions : voir [CONTRIBUTING.md](CONTRIBUTING.md).
Code sous licence **MIT**, données contribuées sous **ODbL** (voir [LICENSE](LICENSE)).
La feuille de route produit est dans [ROADMAP.md](ROADMAP.md).

---

## 📂 Structure du Projet

```text
├── index.html               # Interface utilisateur principale
├── css/
│   └── styles.css           # Design system moderne (Thème sombre émeraude, glassmorphism)
├── js/
│   ├── app.js               # Orchestration Leaflet, gestionnaire d'événements & UI
│   ├── data-sources.js      # Annuaire des sources Open Data & métadonnées
│   ├── services.js          # Clients API (ISRIC SoilGrids, IGN Géocodage)
│   ├── outbreak-engine.js   # Moteur spatial de calcul de proximité (Turf.js)
│   ├── mock-parcels.js      # Jeux de données d'amorçage géoréférencés
│   └── api-client.js        # Client de l'API backend (fallback local hors ligne)
├── schema/
│   └── observation.schema.json  # Schéma standardisé des signalements
├── server/
│   ├── server.js            # API HTTP zéro dépendance (Node >= 18)
│   ├── store.js             # Persistance des signalements (JSON -> PostGIS)
│   ├── validator.js         # Validateur du schéma d'observation
│   └── server.test.js       # Tests (node --test)
├── CONTRIBUTING.md          # Guide de contribution
├── ROADMAP.md               # Feuille de route produit
└── README.md                # Documentation générale
```

---

## 🗺️ Fonds de Carte 100% Libres & Gratuits (Zéro Clé API)

L'application n'utilise aucun service commercial propriétaire et intègre 4 fonds cartographiques entièrement libres :
1. **OpenStreetMap France (`osmfr`)** : `https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png`
   - Hébergé par l'association OpenStreetMap France, style de rendu adapté à la toponymie et aux terroirs français.
2. **OpenTopoMap (`opentopo`)** : `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png`
   - Affiche les courbes de niveau, le relief SRTM et la végétation, indispensable pour l'analyse des écoulements et des versants agricoles.
3. **IGN Géoplateforme Orthophoto (`ign`)** : `https://data.geopf.fr/wmts`
   - Imagerie satellite et aérienne haute résolution de la France, accessible gratuitement sous Licence Ouverte 2.0.
4. **OpenStreetMap Standard (`osm`)** : `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
   - Le fond mondial officiel de la fondation OpenStreetMap.

---

## 📜 Licences des données
- **Fonds de carte** : OpenStreetMap (ODbL), OpenTopoMap (CC-BY-SA), IGN (Licence Ouverte 2.0)
- **ISRIC SoilGrids** : CC-BY 4.0
- **IGN & RPG** : Licence Ouverte 2.0 (Etalab)
- **GBIF / INPN** : CC-BY 4.0 / Licence Ouverte SINP
- **Données participatives OpenAgriMap** : Open Database License (ODbL)

Conformité (RGPD, licences, RPG/ASP) : voir [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

