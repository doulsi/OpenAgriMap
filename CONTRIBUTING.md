# Contribuer à OpenAgriMap France

Merci de votre intérêt ! OpenAgriMap est un projet **open par défaut** : le code
est sous licence MIT, les données contribuées (signalements) sous licence ODbL.

## Règle d'or du projet

> Pour chaque donnée demandée à un contributeur, celui-ci doit recevoir en retour
> une information qu'il ne peut pas avoir autrement.

Toute fonctionnalité proposée doit passer ce test de réciprocité.

## Par où commencer

1. Lancez l'app en local (voir README — `npm start` puis http://127.0.0.1:8080).
2. Choisissez une issue étiquetée `good first issue`, ou ouvrez-en une nouvelle.
3. Suivez le schéma d'observation standardisé : [`schema/observation.schema.json`](schema/observation.schema.json).
   Tout signalement accepté par l'API s'y conforme ; les signalements anonymes
   sont refusés (`reporter.displayName` obligatoire).

## Workflow

1. Forkez le dépôt et créez une branche `vibe/<sujet>` ou `fix/<sujet>`.
2. Commitez des unités logiques, messages en français ou anglais acceptés.
3. Lancez les tests : `npm test` (aucune dépendance externe requise, Node >= 18).
4. Ouvrez une Pull Request en décrivant le problème résolu et la vérification effectuée.

## Standards

- **Zéro dépendance npm** côté backend et tests tant que possible (Node >= 18,
  modules natifs uniquement).
- Le frontend reste en JS vanilla (Leaflet, Turf.js, Lucide via CDN).
- Toute nouvelle source de données doit être ouverte et créditée dans
  `js/data-sources.js` et le README (licence indiquée).
- Pas de signalement anonyme, pas de donnée personnelle au-delà du nom
  d'affichage choisi par le contributeur (RGPD).

## Signaler un bug

Ouvrez une issue avec : comportement attendu, comportement constaté, navigateur,
et capture d'écran si possible.
