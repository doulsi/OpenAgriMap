# Feuille de route OpenAgriMap France

Issue du plan produit & business v2. Priorités P1-P7 : voir les issues GitHub
étiquetées correspondantes.

| Période | Objectif | Priorités |
|---|---|---|
| M1-M3 | Backend + base PostGIS + comptes + vrais signalements (fin des mocks) ; proxy de cache serveur | P1, **P3 done** |
| M4-M6 | PWA mobile + géolocalisation + photos ; modération et réputation ; gamification v1 | P2, P4, P5 |
| M7-M9 | Lancement communautaire (2-3 départements pilotes) ; partenariats Vigie-Nature/Spipoll et LPO | — |
| M10-M12 | Dossier bourse/financement ; évaluation RGPD/RPG avec un juriste | P7 | (P6 : API documentée + export faits)
| An 2 | Couverture nationale, premiers revenus B2B | — |

## État actuel (v0.2)

- [x] Schéma d'observation standardisé (`schema/observation.schema.json`)
- [x] API Node sans dépendance (`server/`) : `GET/POST /api/reports`, proxy de cache `/api/proxy/*`
- [x] **P3** : appels navigateur Open-Meteo / ISRIC / GBIF / IGN geocodage / Nominatim basculés sur `/api/proxy/:source` (cache 10 min côté serveur)
- [x] Refus des signalements anonymes (validation schéma, 422)
- [x] Licences : code MIT, données ODbL ; `CONTRIBUTING.md`
- [x] **P6** : API publique documentée (OpenAPI 3, `/api/openapi.json`) + export GeoJSON ODbL (`/api/export.geojson`)
- [x] **P7 (doc)** : `docs/COMPLIANCE.md` — RGPD, licences, RPG/ASP, gouvernance. Reste : revue juriste (humain)
- [x] **P1 (v1)** : comptes email+mot de passe (scrypt, jetons de session 30 j), `POST /api/auth/register|login|logout`, `GET /api/me`, signalements liés au compte (`userId`) — persistance JSON
- [ ] Persistance PostgreSQL/PostGIS (`server/schema.sql` prêt) + OAuth — **P1 (suite, nécessite une BDD)**
- [x] Modération (PATCH statut), dédoublonnage 24h/250m (409), réputation par contributeur — **P2 (v1)**
- [ ] Réseau de référents agronomes (validation humaine), score de réputation avancé — **P2 (suite)**
- [x] **P4** : PWA installable (manifest + service worker, cache app shell, réseau d'abord pour l'API), géolocalisation GPS du terrain, champ photo — v1
- [x] **P5** : niveaux Graine 🌱 → Jardinier 🪴 → Maraîcher 🚜 → Agronome 🎓 (signalements confirmés), badge live dans le formulaire — v1
- [ ] Badges & quêtes saisonnières — **P5 (suite)**

## Valeur pour les agriculteurs (§3.2/§3.5 du plan)

- [x] **Cas d'usage 1 — fiche d'identité de parcelle** : `GET /api/parcels/:id` (assolement, culture en cours, signalements contenus dans le polygone) + panneau latéral au clic sur la parcelle
- [ ] Prix réels du foncier/fermage géolocalisés (§3.2 item 2) — **nécessite une source ouverte ; décision à prendre**
- [ ] Voisinage à risque (éleveurs/apiculteurs < 3 km) (§3.2 item 3)
- [ ] Benchmark de territoire (rendements/coûts à 10 km) (§3.2 item 4)

## KPIs

Signalements/mois actifs, taux de récurrence des contributeurs, couverture
départementale, latence signalement → bannière (< 1 min).
