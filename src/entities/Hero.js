import { DEPTH } from '../data/gameplay.js';

// ============================================================
//  Héros "guetteur" : il se tient sur sa plateforme et balaie
//  le sol avec sa lanterne, à gauche puis à droite.
//  Sous la plateforme, il reste une zone d'ombre pour se cacher.
// ============================================================
export class Sentinel {
  constructor(scene, lightSystem, cfg, color) {
    this.cfg = cfg;
    this.lantern = scene.add.image(cfg.x, 0, 'lantern').setDepth(DEPTH.LANTERN);
    this.sprite = scene.add
      .image(cfg.x, cfg.platformTop - 20, 'sentinel')
      .setDepth(DEPTH.SENTINEL);

    this.baseY = cfg.platformTop - 10;
    this.angleRight = cfg.tilt;                  // vers le bas à droite
    this.angleLeft = Math.PI - cfg.tilt;         // vers le bas à gauche
    this.light = lightSystem.addLight({
      id: cfg.id,
      x: cfg.x + cfg.offsetX,
      y: this.baseY,
      radius: cfg.radius,
      dir: this.angleRight,
      spread: cfg.spread,
      color,
    });
    this.level = 1;
  }

  // u : 0 = regarde à droite, 1 = regarde à gauche
  position(u) {
    const { x, offsetX } = this.cfg;
    this.light.dir = this.angleRight + (this.angleLeft - this.angleRight) * u;
    this.light.x = x + offsetX * (1 - 2 * u);
    this.light.y = this.baseY;
    this.sprite.setFlipX(u > 0.5);
    this.lantern.setPosition(this.light.x, this.light.y);
  }

  update(timeMs) {
    const { holdMs: H, sweepMs: S } = this.cfg;
    const cycle = 2 * (H + S);
    const t = timeMs % cycle;
    const ease = (v) => v * v * (3 - 2 * v);
    let u;
    if (t < H) u = 0;
    else if (t < H + S) u = ease((t - H) / S);
    else if (t < 2 * H + S) u = 1;
    else u = 1 - ease((t - 2 * H - S) / S);
    this.position(u);
    // La lanterne s'éteint visuellement avec la lumière
    this.lantern.setAlpha(Math.min(1, this.light.level * 1.4));
  }
}
