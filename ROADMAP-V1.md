# PARADOX — audit et feuille de route V1

Audit du 25 novembre 2026 sur le commit `d913937`, version publique 0.7.2. Document de décision pour Labz.

## Le jeu à finir

En quelques minutes sur téléphone, le joueur reconstitue un pont de Nacre. Il lit un rapport, formule une hypothèse spatiale, en observe les conséquences et récupère une pièce de l’enquête. La première mission apprend à localiser une Source. Le point culminant de la campagne demande de distinguer deux anomalies qui contraignent ensemble la disposition des sondes.

## Périmètre et vérifications

- Lecture du moteur, du générateur en worker, des modes, de la gestion de partie, des sauvegardes, des styles, des ressources graphiques, de la campagne et de la documentation. La page publique annonce la 0.7.2, le README annonce encore la 0.5.0.
- Suite du dépôt couvrant 301 missions de base, 225 grilles à signal alternatif et 60 doubles. Les vérifications portent sur les solutions et les contraintes. Elles ne mesurent ni le plaisir ni la compréhension.
- Parcours automatisé des huit chapitres et résolution d’une double mission après rechargement. Le scénario utilise les commandes du jeu avec un DOM simulé. La vérification réseau a porté sur la page publiée. Les gestes sur appareil physique, VoiceOver, le contraste effectif des états superposés et les performances de Safari restent à tester.
- Expérience de retrait sur 40 graines intermédiaires de forme `audit-v1-0` à `audit-v1-39`. En supprimant l’Écho et sa contrainte de convergence, 40 grilles gardent une solution unique pour les sondes et la Source. Le générateur construit d’abord une grille simple résoluble, puis lui ajoute le deuxième croisement.
- Sur ces mêmes graines, la génération locale sous Node donne une médiane d’environ 19 ms et un 95e percentile d’environ 108 ms. Ces chiffres concernent cette machine et cet échantillon. Les variantes générées par essais successifs méritent une mesure séparée sur téléphone.

## Diagnostic

| Domaine | Acquis | Problème à résoudre pour la sortie |
|---|---|---|
| Déduction | Grille vierge, règles stables, vérification indépendante et indices géographiques recoupables. | Les paliers qualifient surtout l’ouverture. Deux grilles du même niveau peuvent demander des efforts très différents au milieu de partie. |
| Source et Écho | Deux cibles nommées, deux paires, une seule paire de faisceaux affichée à la fois. | La génération actuelle rend le deuxième canal facultatif pour localiser toutes les sondes. L’écran explique aussi imparfaitement les vérifications liées à Gamma et Delta. |
| Aide | Deux pressions permettent de demander une piste puis une case. | Le texte de propagation traite certaines contraintes Gamma/Delta comme une simple obligation de case libre. Une explication doit citer le bon émetteur et expliquer une élimination vérifiable. |
| Interface mobile | Indice contextuel, épinglage, notes et essais réversibles. | Le joueur doit comprendre la différence entre annoter une case et essayer une configuration. Les retours d’action, la grille et les commandes se disputent la hauteur disponible. |
| Lisibilité et accessibilité | Formes de sondes distinctes, coordonnées, noms accessibles et navigation clavier. | La légende est repliée et la carte est reconstruite après chaque action. Vérifier le focus, le zoom, la distinction des faisceaux sous superposition et la lisibilité à une main. |
| Graphismes et son | Station, six sondes, équipements et textures ont une identité commune. | Donner une lecture immédiate à l’émission, au blocage et au croisement. Priorité à ces trois événements avant de produire de nouveaux décors. Sons facultatifs et mouvements réduits à conserver. |
| Campagne et récit | Huit chapitres et un dénouement consultable dans les archives. | Le mode double se trouve dans les modes secondaires. Après huit victoires, le menu propose à nouveau « Chapitre 1 / 8 · Premier contact ». L’enquête mérite un état terminé, un épilogue et un choix explicite de rejouer. |
| Sauvegarde et partage | Reprise locale et liens de missions versionnés. | « Charger » relance en classique depuis une mission double. La sauvegarde unique est remplacée dès qu’une autre mission commence. Définir ce que « Reprendre » protège, notamment en lançant le défi du jour. |
| Technique et livraison | Petit site statique, moteur distinct de l’interface, génération en arrière-plan, aucune infrastructure de compte. | Le dépôt contient des tests moteur, mais pas le parcours d’interface utilisé pour cet audit. Le rendu, la persistance et les interactions se concentrent dans app.js. Stabiliser avec des tests ciblés avant toute réorganisation. |

## Plan de développement

Les numéros ci-dessous sont des jalons proposés. Les seuils sont des critères de décision pour les prochains tests.

| Jalon | Travail | Critère de passage |
|---|---|---|
| **0.8 — Fiabilité** | Conserver mode, version et signal au chargement d’une graine. Corriger l’aide du deuxième canal. Distinguer campagne terminée et nouvelle campagne. Protéger la reprise de campagne lorsqu’un défi est ouvert. | Tests reproductibles pour charger, partager, reprendre, changer de mode et terminer. Même graine et mêmes réglages redonnent la même mission. Une victoire finale reste visible après rechargement. |
| **0.9 — Double déduction** | Générer conjointement les deux anomalies sur une sélection de missions. Introduire une relation mesurable entre elles seulement si elle enrichit le raisonnement. Conserver les doubles actuelles comme initiation. | Pour chaque mission annoncée « double déduction », une seule solution complète. En retirant séparément chaque canal, au moins deux configurations de sondes redeviennent possibles. Compter les configurations de sondes distinctes pour exclure les variations portant seulement sur la cible retirée. Vérifier avec un énumérateur indépendant. |
| **0.9.1 — Difficulté et aides** | Constituer un jeu de graines de référence. Examiner le premier coup, le premier recoupement et le passage le plus difficile. Écrire les aides autour d’une case qu’on peut éliminer et d’une raison observable. | Pour chaque niveau, faire relire cinq grilles à la main. Sur les missions de campagne, chaque révélation a une justification reproductible. Au moins quatre testeurs novices sur cinq trouvent le premier placement du tutoriel sans révélation. |
| **0.9.2 — Parcours et présentation** | Garder la Source seule pour apprendre. Introduire Gamma/Delta dans un chapitre court, puis consacrer la finale au double croisement. Mettre à jour la dernière preuve narrative pour qu’elle dépende des deux localisations. Affiner les faisceaux et les états sélectionné, noté et bloqué. | Trois actions observables sur téléphone : identifier la paire active, comprendre pourquoi un faisceau s’arrête, retrouver la preuve après la victoire. Les joueurs réussissent ces tâches avec le son coupé. |
| **RC puis 1.0 — Recette** | Geler les règles, traiter les défauts de test, mettre à jour les instructions et publier un numéro de version cohérent. | Suite moteur et parcours d’interface automatisés verts. Tester Safari sur iPhone 13, Chrome Android et un navigateur de bureau. Vérifier orientation, arrière-plan, reprise, zoom, clavier, partage et anciennes graines. Aucun blocage de résolution ni perte de progression sur ces parcours. Vérifier les fichiers réellement servis par Pages. |

## Ordre de décision

Commencer par les corrections reproductibles de 0.8 et par un prototype de trois doubles grilles conçues à la main. Pour chacune, noter le moment où une information sur l’Écho permet de départager deux positions de sonde. Si ce moment est compréhensible pour des joueurs, automatiser la génération. Dans le cas contraire, retravailler la règle sur ces trois grilles avant d’engager la campagne ou les graphismes.

La V1 peut sortir avec les modes déjà disponibles. Une troisième anomalie, un classement en ligne et de nouveaux types de sonde peuvent attendre les retours après lancement.
