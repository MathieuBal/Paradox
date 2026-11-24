# PARADOX

Jeu de déduction à deux époques. Prototype 0.1, moteur procédural V1.

## Jouer

Aucune dépendance ni base de données. Depuis le dépôt cloné :

```sh
python -m http.server 8000
```

Ouvrir http://localhost:8000. Le site peut également être hébergé sur GitHub Pages (branche main, racine), si activé dans les paramètres du dépôt.

## Règles

- Chaque symbole apparaît exactement une fois par ligne et colonne, dans chaque époque.
- Les rangs 1 à N sont affichés sur la palette.
- Un signe à la même coordonnée dans les deux grilles compare toujours le passé au futur : < (croissance), > (décroissance), = (identité). Sans signe, aucune relation n'est imposée.
- Les indices fixes ne peuvent pas être modifiés.
- Compléter les deux grilles sans contradiction.

## Génération

Deux carrés latins permutés servent de solutions initiales. Le moteur retire des indices puis des liaisons en ne conservant que les configurations résolues par propagation logique (élimination des valeurs fixées, singleton caché, filtrage des relations temporelles). Ces déductions étant nécessaires, une solution intégralement obtenue ainsi est unique. Une recherche exacte, limitée à deux solutions, vérifie en outre que chaque époque seule reste ambiguë. La graine et la difficulté déterminent le niveau dans cette version du moteur. Une nouvelle graine permet de renouveler les parties ; des grilles équivalentes ou répétées restent possibles. Si une graine ne produit pas de niveau après 40 tentatives, la génération s'arrête avec un message d'erreur.

## Tests

```sh
node test-engine.js
```

180 cas déterministes répartis sur 4×4, 5×5 et 6×6 : solution unique, ambiguïté de chaque époque prise séparément, résolution déductive, reproductibilité et contradiction élémentaire.

## Fichiers

- engine.js : générateur, solveur logique, comptage exact des solutions.
- app.js : interactions, annotations, annulation, indices, vérification et partage.
- index.html : interface responsive, sans dépendance.
- test-engine.js : tests de régression.

## Prochaines itérations

Tests utilisateurs et navigateur, calibrage empirique de la difficulté, meilleure représentation des relations temporelles, sauvegarde de partie, défi quotidien. Les difficultés actuelles sont des préréglages de taille et de densité et non une mesure validée du temps de résolution.
