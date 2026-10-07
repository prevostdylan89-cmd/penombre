// ============================================================
//  Stades d'évolution du monstre.
//  Chaque stade change la FORME (pas seulement la taille) :
//   - stade 1 : petite goutte d'ombre toute simple
//   - stade 2 : cornes, bras à griffes, filaments, 4 yeux (aperçu en fin de niveau)
//  Les yeux gardent la même couleur à chaque stade pour reconnaître la créature.
//
//  Mouvement "Limbo" :
//   accel = vitesse de démarrage (petit = démarrage progressif)
//   turn  = demi-tour (plus vif que le démarrage)
//   slide = glisse à l'arrêt (petit = glisse longtemps, grand = arrêt net)
// ============================================================
export const EVOLUTIONS = [
  {
    id: 1,
    name: 'Ombre naissante',
    speed: 58,
    accel: 190,
    turn: 330,
    slide: 5.5,
    jump: 190,          // ~29 px de hauteur de saut
    pushFactor: 0.7,    // vitesse quand il pousse une caisse
    resistance: 1,      // 1 = normal, 2 = la jauge se remplit 2x moins vite
    frame: { w: 20, h: 22 },   // taille de l'image
    body: { w: 8, h: 13 },     // taille du corps (collisions et détection de la lumière)
    spriteKey: 'monster1',
    eyesKey: 'eyes1',
    eyesDx: 1, eyesDy: -1,
    eyesColor: 0xcfefff,
  },
  {
    id: 2,
    name: 'Ombre rampante (aperçu)',
    speed: 78,
    accel: 230,
    turn: 380,
    slide: 5,
    jump: 235,
    pushFactor: 0.85,
    resistance: 1.5,
    frame: { w: 28, h: 34 },
    body: { w: 11, h: 20 },
    spriteKey: 'monster2',
    eyesKey: 'eyes2',
    eyesDx: 2, eyesDy: 0,
    eyesColor: 0xcfefff,
  },
];
