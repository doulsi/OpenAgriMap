# Feuille de route OpenAgriMap France

Issue du plan produit & business v2. Priorités P1-P7 : voir les issues GitHub
étiquetées correspondantes. Suivi : issues #14–#19 (couches & contribution),
PR #17/#18 fusionnées, **PR #20 en revue** (backend contribution ouverte).

| Période | Objectif | Priorités |
|---|---|---|
| M1-M3 | Backend + base PostGIS + comptes + vrais signalements (fin des mocks) ; proxy de cache serveur | P1 v1 ✅, P2 v1 ✅, **P3 done** ✅ |
| M4-M6 | PWA mobile + géolocalisation + photos ; modération et réputation ; gamification v1 ; **P2 v2 : modération sécurisée + anti-abus + upload photo (PR #20)** | P2 ✅, P4 ✅, P5 ✅ |
| M7-M9 | Lancement communautaire (2-3 départements pilotes) ; partenariats Vigie-Nature/Spipoll et LPO | — |
| M10-M12 | Dossier bourse/financement ; évaluation RGPD/RPG avec un juriste | P7 | (P6 : API documentée + export faits ✅) |
| An 2 | Couverture nationale, premiers revenus B2B ; migration PostgreSQL/PostGIS | P1 (suite) |

## État actuel (v0.2 → v0.3 en revue, PR #20)

- [x] Schéma d'observation standardisé (`schema/observation.schema.json`)
- [x] API Node sans dépendance (`server/`) : `GET/POST /api/reports`, proxy de cache `/api/proxy/*`
- [x] **P3** : appels navigateur Open-Meteo / ISRIC / GBIF / IGN geocodage / Nominatim / ApiCarto basculés sur `/api/proxy/:source` (cache 10 min côté serveur, retry 429 GBIF)
- [x] Refus des signalements anonymes (validation schéma, 422)
- [x] Licences : code MIT, données ODbL ; `CONTRIBUTING.md`
- [x] **P6** : API publique documentée (OpenAPI 3, 14 paths, `/api/openapi.json`) + export GeoJSON ODbL (`/api/export.geojson`)
- [x] **P7 (doc)** : `docs/COMPLIANCE.md` — RGPD, licences, RPG/ASP, gouvernance. Reste : revue juriste (humain)
- [x] **P1 (v1)** : comptes email+mot de passe (scrypt, jetons de session 30 j), `POST /api/auth/register|login|logout`, `GET /api/me`, signalements liés au compte (`userId`) — persistance JSON
- [ ] Persistance PostgreSQL/PostGIS (`server/schema.sql` prêt) + OAuth — **P1 (suite, nécessite une BDD)**
- [x] **P2 (v1)** : modération (PATCH statut), dédoublonnage 24h/250m (409), réputation par contributeur
- [x] **P2 (v2, PR #20)** : modération réservée moderator/admin (Bearer, 401/403), file `GET /api/moderation/queue`, `DELETE /api/reports/:id` (moderator/admin ou propriétaire), rate-limiting `POST /api/reports` (20/10 min/IP, 10/10 min/nom → 429 + `Retry-After`), filtre `?status=` sur `GET /api/reports`
- [ ] Réseau de référents agronomes (validation humaine), score de réputation avancé — **P2 (suite)**
- [x] **P4** : PWA installable (manifest + service worker, cache app shell, réseau d'abord pour l'API), géolocalisation GPS du terrain, champ photo — v1
- [x] **P4 (v2, PR #20)** : upload photo réel côté serveur `POST /api/uploads/photo` (base64, png/jpeg/webp/gif ≤ 2 Mo) servi sur `/uploads/*`, `photoUrl` joint au signalement et affiché dans les popups
- [x] **P5** : niveaux Graine 🌱 → Jardinier 🪴 → Maraîcher 🚜 → Agronome 🎓 (signalements confirmés), badge live dans le formulaire — v1
- [ ] Badges & quêtes saisonnières — **P5 (suite)**
- [x] **Zéro donnée fictive** : 506 signalements « seed » supprimés de `data/reports.json` (gitignored), `INITIAL_OUTBREAK_REPORTS` retiré du frontend, `seedReports()` = `[]` — la couche Vigilance n'affiche que des contributions réelles (PR #20)
- [x] **Architecture contribution ouverte documentée** : `docs/CONTRIBUTION-ARCHITECTURE.md` (flux, contrat, anti-abus, stockage JSON → PostGIS, ODbL)
- [x] Tests : `npm test` **30/30** (auth, rate-limit, upload, modération, doublons, filtres, proxy, proxy hubeau whitelisté, RPG…)

## Couches cartographiques (état au 2026-11)

- [x] 🐝 **Biodiversité & Auxiliaires** : 10 points seed INPN/LPO/Spipoll + flux live GBIF par viewport via `/api/proxy/gbif` (filtres Tous/Oiseaux/Pollinisateurs/Auxiliaires, sélecteur de pays, garde anti-réponses périmées). Correctifs fusionnés : crash d'init (TDZ `map.on` avant `const map`) et gardes `window.*` → `typeof` (PR #17/#18, issues #14)
- [x] 💧 **Statut Hydrique & Humidité (Sols)** : 31 stations France, badge couleur selon statut (confort/déficit/sécheresse/saturé), enrichissement live Open-Meteo (12 premières stations, « (live) ») sans mutation des seeds (PR #17/#18, issue #15)
- [x] 🦠 **Vigilance Sanitaire & Épidémies** : signalements citoyens réels uniquement (`GET /api/reports?bbox=…&status=pending_moderation,confirmed`), moteur de proximité (rayon réglable, bannière, feed cliquable), création via formulaire avec photo, modération (PR #20, issues #16/#19)
- [x] 🌾 **Cultures & Parcelles (RPG)** : WMS IGN national + parcelles live ApiCarto (zoom ≥ 10), fiche d'identité (assolement 2020-2024, voisinage, benchmark)
- [x] 💧 **Nappes phréatiques (piézomètres)** : stations live Hub'Eau/BRGM (données ADES, Licence Ouverte 2.0) par viewport via `/api/proxy/hubeau/niveaux_nappes/{stations,chroniques,chroniques_tr}` (sous-chemins whitelistés, cache 24 h / 10 min), niveau relatif calculé sur les chroniques 24 mois (légende BRGM 7 classes + tendance ▲/►/▼), popup avec sparkline et lien fiche ADES — zéro donnée fictive hors ligne

## Valeur pour les agriculteurs (§3.2/§3.5 du plan)

- [x] **Cas d'usage 1 — fiche d'identité de parcelle** : `GET /api/parcels/:id` (assolement, culture en cours, signalements contenus dans le polygone) + panneau latéral au clic sur la parcelle
- [ ] Prix réels du foncier/fermage géolocalisés (§3.2 item 2) — **nécessite une source ouverte ; décision à prendre**
- [x] **Voisinage à risque** (§3.2 item 3) : `GET /api/neighborhood?lat&lng&radiusKm` — foyers de pulvérisation, ruchers < 3 km, élevages proches, alerte si rucher exposé
- [x] **Benchmark de territoire** (§3.2 item 4) : `GET /api/benchmark?lat&lng&radiusKm` — pression par bioagresseur/culture + rendements des parcelles dans le rayon

## KPIs

Signalements/mois actifs, taux de récurrence des contributeurs, couverture
départementale, latence signalement → bannière (< 1 min), taux de signalements
confirmés vs rejetés (file de modération), uploads photo par signalement.
