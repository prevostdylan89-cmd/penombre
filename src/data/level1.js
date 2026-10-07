// ============================================================
//  Niveau du pays 1 (V1 de test).
//  Coordonnées en pixels du monde (le sol est à y = 240).
//
//  Parcours :
//   1. Début tranquille dans le noir
//   2. Lanterne A : on tire le levier (au bord de la lumière) pour l'éteindre
//   3. Lanterne B : on pousse la caisse pour s'abriter derrière et tirer le levier
//   4. Le guetteur : sa lanterne balaie gauche/droite, il faut traverser en rythme
//   5. Sortie : le pays s'éteint
// ============================================================
export const LEVEL1 = {
  width: 1440,
  height: 270,
  groundY: 240,
  start: { x: 44 },
  exitX: 1385,

  // Points de reprise (y calculé automatiquement au niveau du sol)
  checkpoints: [{ x: 44 }, { x: 520 }, { x: 800 }, { x: 1200 }],

  // Éléments solides (ils bloquent aussi la lumière)
  platforms: [
    { x: 0, y: 240, w: 1440, h: 30, kind: 'ground' },
    { x: 150, y: 222, w: 46, h: 18, kind: 'rock' },     // petite marche
    { x: 983, y: 198, w: 34, h: 8, kind: 'plank' },     // plateforme du guetteur
  ],

  // Caisses poussables (x, y = centre)
  crates: [{ id: 'caisse1', x: 560, y: 228, w: 26, h: 24 }],

  // Lanternes fixes (pendues à un bras fixé à un poteau décoratif)
  lanterns: [
    { id: 'lanterneA', x: 400, y: 180, radius: 120, post: { x: 452, armY: 150 } },
    { id: 'lanterneB', x: 700, y: 190, radius: 110, strongRatio: 0.7, post: { x: 750, armY: 170 } },
  ],

  // Leviers : "atténuer" la lanterne ciblée
  levers: [
    { id: 'leverA', x: 312, target: 'lanterneA' },
    { id: 'leverB', x: 640, target: 'lanterneB' },
  ],

  // Guetteurs : lanterne qui balaie gauche/droite
  sentinels: [
    {
      id: 'guetteur', x: 1000, platformTop: 198,
      radius: 150, spread: 1.0, tilt: 0.52,   // tilt = angle vers le bas (rad)
      holdMs: 3800, sweepMs: 1000, offsetX: 16,
    },
  ],
};
