# CHANGES

## [0.1.0] — Socle V1

- Création du projet React/Vite indépendant.
- Préparation des formats Excel, CSV, JSON et XML.
- Première interface de sélection du hub et du fichier.
- Architecture prévue pour normalisation, validation, identité des routes et export JSON.

## [0.2.0] — Rapport détaillé et formats numériques

- Ajout d'une liste déroulante de rapports : synthèse, routes lues, doublons, erreurs détaillées et avertissements.
- Ajout d'un tableau consultable des routes reconnues sans devoir exporter le JSON.
- Affichage des lignes et codes d'erreur pour faciliter la correction des fichiers source.
- Le rapport affiche le nom et le format du fichier analysé.
- Extension du parsing numérique pour reconnaître les formats courants `6,099.00`, `6.099,00`, `6 099,00` et `6099,00`.


## [0.2.1] — Correction de validation des destinations

- Préserve les segments vides dans les noms de route pour identifier une destination manquante, par exemple `CGK - `.
- Distingue une route dont l'origine et la destination sont identiques (`DESTINATION_EQUALS_HUB`) d'une route inversée (`WRONG_DIRECTION`).
- Les tests navigateur de non-régression après cette correction restent à effectuer.
