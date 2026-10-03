# Convertisseur-AM — V1

Premier socle indépendant du convertisseur destiné à terme à Script-AM.

## Objectif V1

Importer des routes depuis :

- Excel (.xlsx, .xls)
- CSV
- JSON
- XML

Puis les normaliser vers une structure interne commune et exporter du JSON.

## Principe

Le convertisseur doit :

1. accepter les colonnes dans n'importe quel ordre ;
2. reconnaître des variantes raisonnables de noms de colonnes ;
3. identifier une route par son hub + destination, pas par sa position ;
4. préserver les IDs internes existants quand une route possède la même identité ;
5. signaler les erreurs et ambiguïtés au lieu de modifier silencieusement les données ;
6. produire un rapport de validation exploitable pour les tests.

## Structure prévue

- src/converters/ : lecture des formats d'entrée
- src/normalizers/ : transformation vers le schéma interne
- src/validators/ : contrôle des données
- src/identity/ : identité et conservation des IDs
- src/exporters/ : génération des formats de sortie
- src/components/ : interface React

## Tests

Les tests seront construits à partir du jeu de référence de 1894 routes, puis déclinés en variantes volontairement perturbées.

Règle importante : le convertisseur ne doit pas deviner une donnée ambiguë et la modifier silencieusement.
