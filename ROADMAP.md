# Feuille de route OpenAgriMap France

Issue du plan produit & business v2. Priorités P1-P7 : voir les issues GitHub
étiquetées correspondantes.

| Période | Objectif | Priorités |
|---|---|---|
| M1-M3 | Backend + base PostGIS + comptes + vrais signalements (fin des mocks) ; proxy de cache serveur | P1, P3 |
| M4-M6 | PWA mobile + géolocalisation + photos ; modération et réputation ; gamification v1 | P2, P4, P5 |
| M7-M9 | Lancement communautaire (2-3 départements pilotes) ; partenariats Vigie-Nature/Spipoll et LPO | — |
| M10-M12 | API publique documentée + export JSON ; dossier bourse/financement ; évaluation RGPD/RPG avec un juriste | P6, P7 |
| An 2 | Couverture nationale, premiers revenus B2B | — |

## État actuel (v0.2)

- [x] Schéma d'observation standardisé (`schema/observation.schema.json`)
- [x] API Node sans dépendance (`server/`) : `GET/POST /api/reports`, proxy de cache `/api/proxy/*`
- [x] Refus des signalements anonymes (validation schéma, 422)
- [x] Licences : code MIT, données ODbL ; `CONTRIBUTING.md`
- [ ] Comptes utilisateurs (email/OAuth) et persistance PostGIS — **P1 bloquant**
- [ ] Modération, score de réputation, validation par redondance — **P2**
- [ ] PWA installable — **P4**
- [ ] Gamification (niveaux Graine → Jardinier → Maraîcher → Agronome) — **P5**

## KPIs

Signalements/mois actifs, taux de récurrence des contributeurs, couverture
départementale, latence signalement → bannière (< 1 min).
