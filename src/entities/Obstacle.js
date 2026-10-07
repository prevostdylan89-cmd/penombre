import { DEPTH } from '../data/gameplay.js';

// ============================================================
//  Caisse poussable. Elle bloque la lumière : son ombre sert de cachette.
// ============================================================
export class Crate {
  constructor(scene, cfg) {
    this.sprite = scene.physics.add.image(cfg.x, cfg.y, 'crate').setDepth(DEPTH.CRATE);
    this.sprite.body.setSize(cfg.w, cfg.h);
    this.sprite.body.setDragX(1200);
    this.sprite.body.setMaxVelocity(80, 500);
    this.start = { x: cfg.x, y: cfg.y };
  }

  // Rectangle utilisé par le système de lumière
  rect() {
    const b = this.sprite.body;
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }
}
