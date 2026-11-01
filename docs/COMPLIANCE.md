# Conformité — RGPD, licences & réutilisation (P7)

Document de travail pour l'évaluation juridique (juriste) prévue au plan v2, M10-M12.

## 1. RGPD — données traitées

| Donnée | Finalité | Base légale | Conservation |
|---|---|---|---|
| Nom d'affichage (`reporter.displayName`) | Identification publique du contributeur (anti-anonymat, P2) | Consentement (case implicite à la soumission) | Tant que le compte existe ; révocable |
| Coordonnées GPS du signalement | Localisation du foyer sanitaire | Consentement | Idem |
| Notes / photo (URL) | Description de l'observation | Consentement | Idem |
| Email + mot de passe (comptes P1, à venir) | Authentification | Exécution du contrat (CGU) | Mot de passe : hash scrypt, jamais en clair |
| Jeton de session | Maintien de la connexion | Contrat | 30 jours, renouvelable |

Droits des personnes : accès, rectification, effacement, portabilité, opposition —
via l'endpoint de compte (`DELETE /api/me`, à compléter avec P1) ou contact vie privée.
Aucune donnée n'est vendue ni cédée à des tiers (règle de réciprocité du plan, §3.1/3.4).

## 2. Licences

- **Code** : MIT (`LICENSE`).
- **Données contribuées (signalements)** : ODbL 1.0, export public `/api/export.geojson`.
- **Sources tierces** (créditées dans `js/data-sources.js` et le README) :
  ISRIC SoilGrids CC-BY 4.0 ; GBIF CC-BY 4.0 ; INPN/SINP Licence Ouverte ;
  IGN & RPG Licence Ouverte 2.0 (Etalab) ; fonds OSM ODbL, OpenTopoMap CC-BY-SA.

## 3. RPG / données PAC (point sensible du plan, §2 P7)

Le RPG est un **fichier fiscal dérivé des déclarations PAC**. L'affichage ponctuel
via WMS/ApiCarto (ce que fait l'app) est l'approche retenue par le plan, **à valider
avec l'ASP** (Agence de Services et de Paiement) avant mise en production.
L'app ne télécharge, ne stocke et ne réexporte aucune donnée RPG brute.

## 4. Gouvernance de la donnée (contre le risque « on vole mes données »)

- Les signalements individuels restent lisibles publiquement (modèle OSM/ODbL),
  mais toute **agrégation B2B** (banques, assureurs, agences de l'eau) se fera à la
  maille territoire, agrégée et anonymisée au-delà d'un seuil, avec **rétrocession
  visible** aux contributeurs (modèle « give to get », plan §5).
- Gouvernance cible : coopérative / data trust (SCIC) avec les contributeurs.

## 5. Restes à faire (humain)

- [ ] Revue par un juriste (RGPD + conditions RPG/ASP) — **décision manuelle requise**.
- [ ] Mise en place d'un contact DPO / vie privée public.
- [ ] CGU + politique de confidentialité publiées (hébergées avec le déploiement).
