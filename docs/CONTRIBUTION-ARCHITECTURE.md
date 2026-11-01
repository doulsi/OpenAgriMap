# Architecture de la contribution ouverte — Vigilance Sanitaire & Épidémies

Ce document décrit le backend et le flux de données permettant à n'importe quel
visiteur de **créer un signalement sanitaire réel depuis l'interface** (bouton
« Signaler » → formulaire → carte + flux), sans jamais fabriquer de fausses données.

> **Règle d'or : aucune donnée fictive.** Le store démarre vide
> (`data/reports.json` = `{ "reports": [], "users": [], "sessions": [] }`),
> `seedReports()` retourne `[]`, et aucun signalement « seed » n'existe plus dans
> le frontend. La couche Vigilance n'affiche que des contributions réelles,
> éventuellement modérées.

## 1. Vue d'ensemble (flux de contribution)

```
┌──────────────┐  POST /api/uploads/photo (optionnel)   ┌───────────────────────┐
│  index.html  │ ───────────────────────────────────────▶ │  data/uploads/*.img   │
│  (formulaire │  POST /api/reports (JSON, schéma validé)│  + data/reports.json  │
│   "Signaler")│ ───────────────────────────────────────▶ │  (store persistant)   │
└──────────────┘                                          └───────────────────────┘
        ▲                                                          │
        │   GET /api/reports?bbox=…&status=pending_moderation,confirmed   │ PATCH/DELETE (moderator)
        └──────────────────────────────────────────────────────────────┘
                  │
                  ▼
        js/app.js → OutbreakEngine → marqueurs carte + flux + bannière de veille
```

## 2. Contrat de données

- **Schéma** : `schema/observation.schema.json` (draft 2020-12 subset, validé sans
  dépendance par `server/validator.js`). Champs requis : `bioaggressor`, `severity`,
  `crop`, `location{lat,lng}`, `observedAt`, `reporter{role, displayName}`.
  `photoUrl`, `variety`, `stage`, `notes` sont optionnels.
  **Les signalements anonymes sont refusés (422)** : `reporter.displayName` obligatoire.
- **Record stocké** (ajouté par le serveur) : `id` (`rep-NNN`), `submittedAt`,
  `status` (`pending_moderation` à la création), `origin: "community"`, et
  `userId` si un compte authentifié (Bearer) a soumis le signalement.

## 3. API (voir `docs/openapi.json`, servie sur `/api/openapi.json`)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | non | état du serveur + nombre de signalements |
| GET | `/api/reports?bbox=minLng,minLat,maxLng,maxLat&status=…` | non | liste, filtres bbox et statut (`all` = tout) |
| POST | `/api/reports` | optionnel | crée un signalement (201), 422 si schéma violé, 409 doublon, 429 rate-limit |
| PATCH | `/api/reports/:id` | **moderator/admin** | change le statut (confirmed/rejected/pending_moderation) |
| DELETE | `/api/reports/:id` | **moderator/admin ou propriétaire** | supprime le signalement (204) |
| GET | `/api/moderation/queue` | **moderator/admin** | file des `pending_moderation` |
| POST | `/api/uploads/photo` | non (rate-limiter) | upload photo base64 (png/jpeg/webp/gif, ≤ 2 Mo) → `{ url: /uploads/… }` |
| GET | `/uploads/:file` | non | sert les photos uploadées |
| GET | `/api/reporters/:name/reputation` | non | nb de signalements confirmés + niveau (gamification) |
| GET | `/api/export.geojson` | non | export ODbL de tous les signalements communautaires |
| POST | `/api/auth/register` / `login` / `logout`, GET `/api/me` | — | comptes P1 (scrypt + token bearer, 1er inscrit = admin) |

## 4. Anti-abus (endpoint ouvert)

1. **Rate limiting** (fenêtres glissantes en mémoire, `server/server.js`) :
   - `POST /api/reports` : 20 / 10 min par IP **et** 10 / 10 min par `displayName` → `429` + `Retry-After`.
   - `POST /api/uploads/photo` : 10 / 10 min par IP.
2. **Doublons** : même contributeur + bioagresseur + culture, à ≤ 250 m et ≤ 24 h → `409` (`store.findDuplicate`).
3. **Anonymat refusé** : 422 sans `reporter.displayName`.
4. **Modération** : tout signalement naît `pending_moderation` ; seuls les
   moderators/admins peuvent confirmer/rejeter (sinon 401/403). La carte publique
   ne demande que `status=pending_moderation,confirmed` (les `rejected` restent
   dans l'API/export mais hors carte).
5. **Suppression** : propriétaire authentifié ou modérateur (DELETE).

## 5. Stockage

- **Prototype zero-dependency** : `server/store.js` persiste en JSON
  (`data/reports.json`, écriture atomique tmp+rename) ; photos dans `data/uploads/`.
- **Cible production** : `server/schema.sql` (PostgreSQL + PostGIS, table
  `observations` avec `geom GEOMETRY(POINT, 4326)`, `status`, `user_id`, rôles
  `contributor|moderator|admin`). La migration M1–M3 consiste à brancher
  `ReportStore` sur cette schema sans changer le contrat API.

## 6. Frontend (création via l'interface)

- Formulaire « Signaler une observation sanitaire » (`index.html` →
  `js/app.js`) : type de bioagresseur, sévérité, culture, rôle, **nom d'affichage
  obligatoire**, coordonnées (bouton GPS), notes, **photo**.
- `js/api-client.js` : `uploadPhoto(file)` (FileReader → data URL →
  `POST /api/uploads/photo`), puis `submitReport(observation)` avec `photoUrl` ;
  le token P1 (`localStorage`) est envoyé en `Authorization: Bearer` quand présent.
- Le signalement apparaît immédiatement en local (`OutbreakEngine.addReport`),
  puis est rechargé depuis l'API au prochain `moveend`
  (`GET /api/reports?bbox=…&status=pending_moderation,confirmed`), fusionné avec
  les signalements locaux non encore persistés.
- Popups : photo, note, sévérité, distance, **badge de modération**
  (⏳ en attente / ✔ confirmé).

## 7. Licence des données contribuées

Les signalements communautaires sont publiés sous **ODbL-1.0**
(`/api/export.geojson`, champ `license` par feature). Voir `docs/COMPLIANCE.md`.
