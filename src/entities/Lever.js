import { DEPTH } from '../data/gameplay.js';

// ============================================================
//  Levier : "atténue" la lanterne ciblée (action "Atténuer").
//  L'état est conservé après une mort.
// ============================================================
export class Lever {
  constructor(scene, cfg, groundY, light) {
    this.scene = scene;
    this.id = cfg.id;
    this.x = cfg.x;
    this.y = groundY - 7;
    this.light = light;
    this.on = false;
    this.sprite = scene.add.image(this.x, this.y, 'lever_off').setDepth(DEPTH.PROP);
  }

  toggle() {
    if (this.on) return;          // une fois tiré, il reste tiré
    this.on = true;
    this.sprite.setTexture('lever_on');
    // La lanterne baisse puis s'éteint
    this.scene.tweens.add({
      targets: this.light,
      level: 0,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
  }
}
