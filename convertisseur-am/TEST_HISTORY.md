# TEST HISTORY

## V1 — Initialisation et validation renforcée

### Corrections de validation ajoutées

- Contrôle explicite du hub.
- Ignore les lignes réellement vides, même si Excel les inclut dans sa zone utilisée.
- Contrôle des 11 champs numériques (catégorie, distance, taxes, demandes et tarifs).
- Refuse les textes non numériques au lieu de les convertir silencieusement.
- Signale les valeurs numériques négatives pour vérification.
- Signale les noms de route vides, ambigus, inversés ou incompatibles avec le hub.
- Détecte les destinations dupliquées au sein du même hub.
- Affiche les erreurs globales et les erreurs par ligne dans l'interface.
- Bloque l'export JSON dès qu'une erreur est détectée.

### Jeu de référence prévu

- Source : jeu de routes AM de 1894 routes.
- Premier fichier de test : `CGK TEST.xlsx`, 20 routes, hub CGK, 13 colonnes attendues.
- Variantes prévues :
  - ordre des colonnes modifié ;
  - noms de colonnes légèrement modifiés ;
  - ordre des routes modifié ;
  - données manquantes ;
  - données corrompues ;
  - doublons ;
  - identité de route ambiguë ;
  - ajout/suppression de routes ;
  - combinaisons de plusieurs anomalies.

### Tests effectués

Aucun test de bout en bout dans le navigateur n'est encore déclaré PASS. Le fichier XLSX a été inspecté et la normalisation des 20 lignes a été simulée séparément ; le prochain test doit être exécuté par l'utilisateur dans l'application après lancement local.

### T01 — XLSX import dans le navigateur

- Résultat communiqué par l'utilisateur : 20 routes reconnues, 20 lignes sans erreur, 0 erreur, export JSON disponible.
- Statut : PASS pour l'import XLSX et la validation dans l'application.
- Vérification du JSON exporté à effectuer séparément.

### T02 — Comparaison CSV fourni / JSON exporté

- Fichiers reçus : `CGK TEST.csv` et `routes-normalisees.json`.
- CSV : 20 lignes de données, 13 colonnes attendues.
- JSON : 20 routes.
- Les 220 valeurs numériques du CSV, interprétées avec le format `6,099.00`, correspondent aux valeurs du JSON pour les 20 routes.
- Les identités de route sont présentes dans le JSON sous la forme `CGK:DESTINATION`.
- Statut : PASS pour la comparaison statique des deux fichiers.
- Limite : l'import du CSV dans l'interface du navigateur reste à tester.

### Améliorations de l'interface

- Liste déroulante : Synthèse, Routes lues, Doublons, Erreurs détaillées, Avertissements.
- L'export JSON reste séparé et n'est pas nécessaire pour consulter le rapport.
