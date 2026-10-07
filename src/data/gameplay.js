// ============================================================
//  Valeurs de gameplay de Pénombre.
//  Tout ce que tu peux vouloir ajuster est ici, pas dans le code.
// ============================================================

// Écran de jeu (résolution interne, agrandie ensuite sans lissage)
export const GAME = { width: 480, height: 270, gravity: 620 };

// Ordre d'affichage (plus grand = devant)
export const DEPTH = {
  SKY: 0, FAR: 1, MID: 2, NEAR: 3,
  DECOR: 8, PLATFORM: 10, CRATE: 12, PROP: 13, SENTINEL: 14,
  DUST: 20,
  DARKNESS: 30, GLOW: 31, LANTERN: 32,
  MONSTER: 40, EYES: 41, FX: 45, FOREGROUND: 50,
};

// Rendu de la lumière
export const LIGHT = {
  darkColor: 0x050308,       // couleur de l'obscurité qui couvre l'écran
  darkAlpha: 0.86,           // 1 = noir total, plus bas = on devine le décor dans le noir
  strongRatio: 0.5,          // part du rayon où la lumière est FORTE (mort instantanée)
  // La lumière est dessinée en anneaux emboîtés :
  //  4 anneaux pour la zone FAIBLE, 1 anneau qui marque la limite de la zone FORTE
  //  (le saut visible = la frontière de la mort), puis 2 anneaux de cœur.
  // Opacité "découpée" dans l'obscurité par anneau :
  ringAlphas: [0.16, 0.14, 0.14, 0.14, 0.30, 0.20, 0.25],
  // Halo coloré additionné par anneau :
  glowAlphas: [0.025, 0.025, 0.03, 0.03, 0.06, 0.05, 0.06],
};

// Jauge d'exposition (lumière FAIBLE)
export const EXPOSURE = {
  fillPerSec: 0.55,      // la jauge se remplit de 0.55/s en lumière faible (mort à 1)
  recoverPerSec: 0.45,   // elle se vide de 0.45/s dans l'ombre
  deathAnimMs: 650,      // durée de l'animation de mort (< 2 s)
  respawnDelayMs: 450,   // pause avant de réapparaître au checkpoint
  graceMs: 400,          // invulnérabilité juste après la réapparition
};

// Confort de contrôle
export const CONTROLS = { coyoteMs: 90, jumpBufferMs: 110 };

// Interactions (leviers)
export const INTERACT = { rangeX: 16, rangeY: 24 };
