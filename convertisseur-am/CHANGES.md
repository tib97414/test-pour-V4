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
| `taxPerFlight` | Facultatif ; si présent, entier strictement positif | Absence acceptée |
| `demand.economy` | Entier positif ou nul | Zéro accepté avec signalement |
| `demand.business` | Entier positif ou nul | Zéro accepté avec signalement |
| `demand.first` | Entier positif ou nul | Zéro accepté avec signalement informatif |
| `demand.cargo` | Facultatif ; si présent, entier positif ou nul | Zéro accepté avec signalement |
| `prices.economy` | Entier strictement positif | Erreur bloquante |
| `prices.business` | Entier strictement positif | Erreur bloquante |
| `prices.first` | Entier strictement positif | Erreur bloquante |
| `prices.cargo` | Facultatif ; si présent, entier strictement positif | Absence acceptée |

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
- Le champ `taxPerFlight` est facultatif. S'il est absent, le convertisseur ne le calcule pas et ne le remplace pas par zéro ; le script V4 décidera des calculs possibles avec ou sans cette donnée.
- `demand.cargo` et `prices.cargo` sont facultatifs, car certains joueurs n'utilisent pas le cargo. Si ces champs sont présents, leurs valeurs sont validées selon les règles numériques ; s'ils sont absents, ils restent absents et ne sont pas remplacés par zéro.
- L'absence de `taxPerFlight`, `demand.cargo` ou `prices.cargo` ne suffit pas à exclure une route. Le script V4 gère ensuite les calculs selon les données disponibles.
- Le hub global est obligatoire. Le champ `hub` dans chaque route JSON est facultatif : s'il est absent, le hub global fournit le contexte de la route, sans prétendre que cette valeur était présente dans la source.
- Si le champ `hub` d'une route est présent, il doit correspondre au hub global ; sinon, la route est exclue et l'incohérence est signalée.
- Une valeur de hub absente au niveau de la route ne doit pas être confondue avec une valeur de hub brute fournie par la source.
- Une donnée indispensable ne doit jamais être inventée pour rendre une route exploitable.

### Identité des routes — décisions confirmées

- L'identité canonique d'une route est construite à partir du hub et de la destination normalisés, sous la forme `HUB:DESTINATION` (exemple : `CGK:FBD`).
- La casse et les espaces superflus ne doivent pas créer de fausses différences d'identité.
- Les doublons sont détectés à l'intérieur du même hub, sur la combinaison hub + destination. Deux routes vers la même destination depuis des hubs différents ne sont donc pas des doublons au titre de cette règle.
- Pour Excel/CSV, une destination seule (exemple : `FBD`) est autorisée, car le hub est sélectionné séparément dans le convertisseur ; l'identité est construite avec ce hub.
- Dans un JSON personnel, le champ `identity` est obligatoire. S'il manque, la route est exclue ; il n'est pas reconstruit silencieusement.
- Pour Excel/CSV, le hub est choisi dans le convertisseur et sert de contexte aux routes importées.
- Pour le JSON, le hub global est obligatoire et le hub de chaque route est facultatif. S'il est fourni, il doit correspondre au hub global ; en cas de contradiction, la route est exclue et l'incohérence est signalée.
- Le hub, la destination et l'identité doivent désigner la même liaison. Une identité contradictoire ne doit pas être acceptée silencieusement.
- Les routes inversées, les destinations manquantes, les routes vers le hub lui-même et les routes dont le hub ne correspond pas restent des erreurs de validation distinctes, avec des codes adaptés.
- Toutes les occurrences d'une identité dupliquée sont exclues et signalées.

### Traçabilité et nom d'affichage — décisions confirmées

- `sourceRow` représente le numéro réel de la ligne dans le fichier source lorsque ce numéro est disponible, notamment pour Excel et CSV. Il ne doit jamais être inventé.
- Pour un JSON, `sourceRow` peut être absent si aucune notion fiable de ligne source n'est fournie.
- `routeName` représente le nom brut de la route tel qu'il est fourni par la source. Si la source le fournit, sa valeur d'origine est conservée et ne doit pas être remplacée silencieusement par un texte reconstruit.
- Dans le JSON, `routeName` est facultatif : son absence ne suffit pas à exclure une route si les autres champs obligatoires sont valides.
- Le nom d'affichage est une valeur distincte du nom brut. Si aucun `routeName` utilisable n'est fourni, l'application peut générer un nom d'affichage depuis le hub et la destination, par exemple `CGK - FBD`.
- Un nom d'affichage généré ne doit jamais être présenté comme s'il s'agissait du texte brut d'origine.
- Si le `routeName` fourni contredit le hub ou la destination validés, la contradiction doit être signalée et traitée par les règles de validation ; la génération d'un nom d'affichage ne doit pas masquer l'incohérence.
- Le type de source (Excel, CSV ou JSON) et le nom du fichier, lorsqu'ils sont disponibles, doivent être conservés au niveau de l'import/du rapport plutôt que répétés dans chaque route si ces informations sont communes au fichier.
- Les champs d'origine, les champs normalisés et les valeurs calculées doivent garder des rôles distincts ; une même propriété ne doit pas changer de sens selon l'étape du traitement.

### Rapport

- Le rapport doit distinguer les problèmes globaux du fichier des problèmes propres à chaque route.
- Il doit présenter au minimum les routes lues, acceptées et exclues, ainsi que le nombre d'erreurs et d'avertissements.
- Chaque problème doit fournir un code stable, le champ concerné et la conséquence (route conservée ou exclue) ; lorsque disponible, indiquer la valeur reçue et la localisation source.
- Les statuts globaux doivent distinguer un import complet, un import partiel et un fichier rejeté.
- Les exemples de structures et codes évoqués pendant la conception sont indicatifs tant que le contrat final n'est pas figé.

### Étapes de spécification restantes

1. Finaliser les autres champs obligatoires/facultatifs du contrat JSON, notamment la structure globale et les règles précises de récupération partielle.
2. Définir le contrat des métadonnées de provenance et la façon dont les champs bruts, normalisés et calculés sont séparés dans le modèle final.
3. Transformer la spécification validée en tests automatisés avant d'implémenter les changements correspondants.
