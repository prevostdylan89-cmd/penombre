# Pénombre — V1 de test (Phaser 3 + Vite)

## Lancer le jeu
1. Installer Node.js (version LTS) : https://nodejs.org
2. Ouvrir PowerShell DANS ce dossier
3. `npm install`   (une seule fois)
4. `npm run dev`   puis ouvrir http://localhost:5173

Si PowerShell refuse (« l'exécution de scripts est désactivée ») :
utiliser `npm.cmd install` puis `npm.cmd run dev`.

## Contrôles
- Flèches ou Q / D : se déplacer
- Haut, Espace, Z ou W : sauter (maintenir = saut plus haut)
- E : tirer un levier (il s'éclaire en bleu pâle quand on est à portée)
- R : recommencer

## Réglages utiles (src/data/evolutions.js)
- accel  : démarrage (petit = plus progressif)
- slide  : glissade à l'arrêt (petit = glisse plus longtemps, grand = arrêt plus net)
- speed / jump : vitesse et hauteur de saut du stade

## Où modifier quoi
- `src/data/gameplay.js`  : lumière, jauge d'exposition, contrôles
- `src/data/evolutions.js`: vitesse, saut, taille du monstre
- `src/data/level1.js`    : le niveau (plateformes, lanternes, leviers, guetteur)
- `src/data/countries.js` : fiche et palette du pays (provisoire)
