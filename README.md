# PARADOX — Version 0.5.0

Jeu de déduction spatiale à missions procédurales. Toutes les sondes et l'anomalie sont à placer par le joueur ; aucun placement n'est fourni sur la carte.

## Jouer

https://mathieubal.github.io/Paradox/

En local, depuis le dépôt cloné : `python -m http.server 8000`, puis http://localhost:8000. Aucun service externe ni dépendance.

## Règles

- Une sonde par ligne et par colonne ; l'anomalie ne compte pas comme une sonde.
- Les équipements bloquent placements et signaux. Les zones colorées et les sondes ne bloquent pas les signaux.
- Alpha et Beta détectent dans une direction fixe jusqu'à trois cases. L'anomalie occupe une case libre où les deux signaux se croisent.
- Lire les rapports, sélectionner une entité, puis toucher une case libre. Toucher une entité déjà posée la sélectionne ; Effacer la retire.
- Le rapport contextuel affiche aussi les indices où l'entité sélectionnée est mentionnée. Les exclusions sont des notes manuelles. Les signaux représentent les positions proposées, pas la solution.
- Indice : première pression, orientation vers un raisonnement ; deuxième pression, révélation de la case. Aucun indice ne place automatiquement une entité.

## Difficulté

- Initiation : mission fixe 5×5, deux positions directement identifiables à partir des rapports, puis déductions simples. La convergence sert à localiser l'anomalie finale.
- Facile : 4×4, au moins deux positions directes, solution complète par élimination à partir de positions certaines et unicité de ligne/colonne.
- Intermédiaire : 5×5, exactement une position directe ; la propagation élémentaire seule ne suffit pas.
- Expert : 6×6, aucune position directe ; recoupement de domaines de possibilités nécessaire.
- Un placement direct est une sonde dont les rapports géographiques, sans autres placements ni convergence, ne laissent qu'une case libre.
- Les rapports relationnels sont reliés à au moins un ancrage géographique dans leur composante. Les rapports sont déterministes et décrivent zones, voisinage, distances, décalages et relations entre sondes.

La difficulté reste une estimation algorithmique ; elle devra être calibrée avec des joueurs.

## Génération et validation

Le moteur part d'une configuration valide, génère des rapports vrais, supprime des rapports, puis ajoute des ancrages selon le niveau. Il rejette une mission si son profil logique ne correspond pas au mode demandé. Les quatre zones sont contiguës. Les missions procédurales exigent la convergence même pour résoudre les positions des sondes : sans cette règle, plusieurs configurations restent possibles. Toutes les missions doivent être entièrement résolubles par propagation de contraintes sans hypothèse. Le générateur effectue jusqu'à 200 essais ; en cas d'échec, une erreur explicite invite à changer de graine. Des grilles équivalentes restent possibles.

Le moteur V3 change les missions procédurales associées aux graines V2. Les anciens liens V2 procéduraux ouvrent le choix de mission avec un message ; l'ancien lien d'initiation ouvre l'initiation actualisée.

## Tests

`node test-engine.js`

301 missions : initiation et 100 par difficulté. Deux solveurs indépendants vérifient l'unicité, la nécessité de la convergence pour les missions procédurales, la reproductibilité, la contiguïté, la validité et le profil logique. Le contrôle vérifie également l'absence de rapports de coordonnées fixes.

## Atelier de déduction V4

- Hypothèses ajoute ou retire la sonde sélectionnée parmi les candidates d’une case. Exclusions conserve les impossibilités propres à chaque sonde.
- Le journal permet de cocher un rapport exploité. Les deux types de notes et les placements peuvent être annulés.
- La dernière partie est sauvegardée dans le navigateur. Les liens V3 conservent leurs anciennes grilles. Le partage transmet la mission vierge, sauf si ce navigateur possède déjà une sauvegarde de la même mission.
- En intermédiaire et expert, les rapports peuvent comparer les distances à deux équipements, proposer deux zones ou relier deux sondes sur une diagonale. Le générateur exige au moins deux familles de rapports, trois en expert.
- Le premier indice s’appuie sur les domaines restants du solveur. Le deuxième révèle la case déduite.
- L’anomalie du jour utilise la date UTC comme graine commune. La génération procédurale tourne dans un Web Worker sur les navigateurs compatibles.

## Campagne et modes V0.5

Huit chapitres introduisent les indices et les six profils de faisceau. Le rapport d’Alpha décrit le signal de chaque mission. Beta conserve son émetteur directionnel. En mode relais, seule l’antenne prolonge le signal d’Alpha.

Le menu propose également le marathon de trois difficultés, l’expert absolu (sans indice, vérification intermédiaire ni affichage des faisceaux), le défi quotidien et une mission personnalisée avec choix de grille et de signal. La graine, le profil de signal et le mode sont inclus dans le lien de partage.

Le carnet local conserve les missions distinctes terminées, le temps de jeu actif, les indices demandés et les jours consécutifs de résolution (UTC). Une mission déjà enregistrée ne compte qu’une fois. Les sons sont facultatifs. Les tests indépendants couvrent aussi 225 grilles à faisceaux alternatifs.


## Équilibrage des rapports V5

En facile, les rapports géographiques suffisent à fixer deux sondes et au plus un décalage exact renvoie directement à un équipement. En intermédiaire, une seule sonde est déterminée au départ et une autre possède entre deux et cinq cases candidates. En expert, aucune position de départ n’est imposée et au moins une sonde peut être ramenée à deux, trois ou quatre cases par les rapports géographiques.

Aux deux niveaux supérieurs, un écart signé entre sondes renseigne une seule dimension. Par exemple, deux lignes plus bas laisse la colonne à déduire. Les indices géographiques individuels qui conservent plus de 70 % des cases libres (seuil arrondi à l’entier supérieur) sont écartés. Ces mesures décrivent les possibilités du solveur. La difficulté ressentie dépend aussi du joueur.

Les nouveaux liens utilisent le moteur 5. Les graines, solutions et rapports structurés des versions 3 et 4 restent reproductibles.
