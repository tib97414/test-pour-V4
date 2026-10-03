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
