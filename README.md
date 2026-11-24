# PARADOX — Prototype 0.2

Jeu de déduction spatiale à énigmes procédurales. Refonte du prototype 0.1 (conservé dans l'historique Git).

## Jouer

Site GitHub Pages : https://mathieubal.github.io/Paradox/

En local, depuis le dépôt cloné : `python -m http.server 8000`, puis http://localhost:8000. Aucun service externe ni dépendance.

## Mission

Reconstituer la position des sondes d'une station, puis localiser une anomalie détectée par Alpha et Beta.

- Une seule sonde par ligne et colonne.
- Les équipements interdisent le placement et bloquent les signaux.
- Alpha et Beta détectent dans une direction fixe sur trois cases au maximum.
- Les limites de zones et les autres sondes ne bloquent pas les signaux.
- L'anomalie est sur une case libre à l'intersection des deux signaux ; elle ne compte pas comme une sonde.
- Les rapports décrivent des zones, des distances, des équipements et des relations spatiales.
- Les exclusions sont des annotations manuelles ; les signaux affichés proviennent des placements du joueur.

## Génération V2

La graine et le niveau fixent la carte, les positions, les équipements, les directions et les rapports. Les quatre zones sont contiguës. Le moteur construit une configuration valide, génère des rapports vrais puis retire les rapports non nécessaires à sa résolution logique. Il rejette les niveaux si la convergence n'est pas indispensable : sans elle, au moins deux configurations des sondes restent possibles.

Le solveur propage les contraintes sur les domaines de positions (compatibilité par paires, unicité des lignes et colonnes, rapports et signaux). Le générateur conserve uniquement les niveaux entièrement résolubles par cette propagation, sans recherche par hypothèse. Le comptage exact explore les domaines résiduels pour tester l'unicité. Après 100 essais sans réussite, le générateur renvoie une erreur explicite ; une autre graine peut être essayée. Des répétitions ou grilles équivalentes restent possibles.

Les difficultés sont des préréglages de taille et d'aide, pas encore des mesures validées de difficulté humaine. Les liens incluent la version du moteur ; les anciennes graines V1 ne sont pas compatibles avec V2.

## Tests

`node test-engine.js`

181 missions : initiation + 60 par difficulté. Deux algorithmes distincts vérifient l'unicité et la nécessité de la convergence. Le test vérifie aussi la résolution par propagation, la reproductibilité, les placements incorrects et la contiguïté des zones.

## Roadmap

Tests humains et navigateur réel ; ergonomie mobile et prise en main ; calibrage de la difficulté ; enrichissement des indices ; sauvegarde ; réflexion et relais de signaux après validation du gameplay de base.
