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

## [0.3.0] — Spécification du contrat de données V4 (décisions)

> Cette section consigne les décisions de spécification prises pour le futur contrat V4. Elle ne signifie pas que toutes ces règles sont déjà implémentées dans le convertisseur.

### Import et validation partiels

- Importer les routes valides et exclure les routes invalides, avec un rapport détaillé.
- Une route comportant plusieurs erreurs est exclue et toutes les erreurs détectées doivent être signalées.
- Toutes les occurrences d'une route en doublon sont signalées et exclues ; aucune occurrence n'est choisie arbitrairement.
- Distinguer les erreurs bloquantes des avertissements/signalements qui n'empêchent pas l'utilisation d'une route.
- Ne jamais transformer silencieusement une valeur absente en zéro ni inventer une donnée métier.

### Règles numériques décidées

Tous les champs numériques métier ci-dessous doivent représenter des entiers. Aucune partie fractionnaire réelle n'est autorisée et aucun arrondi automatique ne doit être effectué par l'import.

| Champ | Règle | Zéro |
|---|---|---|
| `category` | Entier compris entre 1 et 10 inclus | Erreur bloquante |
| `distance` | Entier strictement positif | Erreur bloquante |
| `taxPerFlight` | Entier strictement positif | Erreur bloquante |
| `demand.economy` | Entier positif ou nul | Zéro accepté avec signalement |
| `demand.business` | Entier positif ou nul | Zéro accepté avec signalement |
| `demand.first` | Entier positif ou nul | Zéro accepté avec signalement informatif |
| `demand.cargo` | Entier positif ou nul | Zéro accepté avec signalement |
| `prices.economy` | Entier strictement positif | Erreur bloquante |
| `prices.business` | Entier strictement positif | Erreur bloquante |
| `prices.first` | Entier strictement positif | Erreur bloquante |
| `prices.cargo` | Entier strictement positif | Erreur bloquante |

- Les valeurs négatives sont interdites pour tous ces champs.
- Une catégorie doit être un entier compris entre 1 et 10 ; les catégories décimales ou hors intervalle sont rejetées.
- Les nombres numériques dont la partie fractionnaire est nulle peuvent être acceptés même si leur représentation contient des décimales : par exemple, `6099`, `6099.0` et une cellule Excel affichée `6099,00` représentent la même valeur entière.
- Une valeur réellement fractionnaire, par exemple `6099.5`, est rejetée ; elle n'est jamais arrondie.
- Pour Excel, tenir compte de la valeur numérique réelle de la cellule plutôt que de son seul format d'affichage.
- Pour CSV, interpréter les séparateurs décimaux et de milliers selon des règles explicites ; toute représentation ambiguë doit produire une erreur plutôt qu'une conversion hasardeuse.
- Dans le JSON strict, les champs numériques doivent être des nombres JSON, pas des chaînes numériques. Les nombres JSON à valeur entière sont acceptables ; les valeurs fractionnaires sont rejetées.

### JSON personnel versionné

- Le JSON personnel doit respecter un contrat V4 strict et versionné.
- Une version inconnue ou non prise en charge entraîne le rejet du fichier entier.
- Si la structure globale est incomplète ou incorrecte, tenter un import partiel lorsque les routes restent récupérables et que leurs données peuvent être validées sans deviner.
- Un champ obligatoire manquant dans une route entraîne l'exclusion de cette route seulement.
- Un champ supplémentaire déclenche un avertissement si la structure et les champs connus restent valides ; le champ inconnu n'est pas utilisé dans les calculs.
- Le champ `country` est facultatif ; son absence peut déclencher un avertissement, mais ne suffit pas à exclure la route.
- Un hub ou une autre donnée indispensable ne doit jamais être inventé pour rendre une route exploitable.

### Identité des routes — décisions confirmées

- L'identité canonique d'une route est construite à partir du hub et de la destination normalisés, sous la forme `HUB:DESTINATION` (exemple : `CGK:FBD`).
- La casse et les espaces superflus ne doivent pas créer de fausses différences d'identité.
- Les doublons sont détectés à l'intérieur du même hub, sur la combinaison hub + destination. Deux routes vers la même destination depuis des hubs différents ne sont donc pas des doublons au titre de cette règle.
- Pour Excel/CSV, une destination seule (exemple : `FBD`) est autorisée, car le hub est sélectionné séparément dans le convertisseur ; l'identité est construite avec ce hub.
- Dans un JSON personnel, le champ `identity` est obligatoire. S'il manque, la route est exclue ; il n'est pas reconstruit silencieusement.
- Le hub indiqué par une route doit être cohérent avec le hub sélectionné pour l'import. En cas de différence, la route est exclue et l'incohérence est signalée.
- Le hub, la destination et l'identité doivent désigner la même liaison. Une identité contradictoire ne doit pas être acceptée silencieusement.
- Les routes inversées, les destinations manquantes, les routes vers le hub lui-même et les routes dont le hub ne correspond pas restent des erreurs de validation distinctes, avec des codes adaptés.
- Toutes les occurrences d'une identité dupliquée sont exclues et signalées.

### Rapport

- Le rapport doit distinguer les problèmes globaux du fichier des problèmes propres à chaque route.
- Il doit présenter au minimum les routes lues, acceptées et exclues, ainsi que le nombre d'erreurs et d'avertissements.
- Chaque problème doit fournir un code stable, le champ concerné et la conséquence (route conservée ou exclue) ; lorsque disponible, indiquer la valeur reçue et la localisation source.
- Les statuts globaux doivent distinguer un import complet, un import partiel et un fichier rejeté.
- Les exemples de structures et codes évoqués pendant la conception sont indicatifs tant que le contrat final n'est pas figé.

### Étapes de spécification restantes

1. Définir la traçabilité des données : rôle et caractère obligatoire ou facultatif de `sourceRow`, `routeName` et des autres champs d'origine.
2. Finaliser la liste des champs obligatoires/facultatifs du contrat JSON, notamment les règles de traçabilité, ainsi que les comportements précis de récupération partielle.
3. Transformer la spécification validée en tests automatisés avant d'implémenter les changements correspondants.
