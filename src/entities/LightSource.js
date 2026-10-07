import { LIGHT } from '../data/gameplay.js';

// ============================================================
//  Une source de lumière.
//  - circulaire (spread = 2π) ou en cône (spread plus petit)
//  - level : 1 = pleine, 0 = éteinte (sert à "atténuer")
//  La même géométrie sert au rendu ET à la détection (voir LightSystem).
// ============================================================
export class LightSource {
  constructor(opts) {
    this.id = opts.id;
    this.x = opts.x;
    this.y = opts.y;
    this.radius = opts.radius;
    this.strongRatio = opts.strongRatio ?? LIGHT.strongRatio;
    this.dir = opts.dir ?? 0;                      // direction du cône (radians)
    this.spread = opts.spread ?? Math.PI * 2;      // ouverture totale
    this.level = opts.level ?? 1;
    this.color = opts.color;

    // Remplis par le LightSystem
    this.rays = [];
    this.polyFull = [];
    this._sig = '';
  }

  get isCone() { return this.spread < Math.PI * 2 - 0.001; }
  get enabled() { return this.level > 0.03; }
  get currentRadius() { return this.radius * this.level; }
  get strongRadius() { return this.currentRadius * this.strongRatio; }

  // Empreinte de l'état : si elle change, il faut recalculer
  signature() {
    return [
      this.x.toFixed(1), this.y.toFixed(1), this.dir.toFixed(3),
      this.currentRadius.toFixed(1),
    ].join('|');
  }
}
