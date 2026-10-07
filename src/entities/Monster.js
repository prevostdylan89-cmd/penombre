import Phaser from 'phaser';
import { DEPTH, CONTROLS, EXPOSURE } from '../data/gameplay.js';

// ============================================================
//  Le monstre d'ombre.
//  Silhouette noire aux bords instables ; on ne voit presque que ses yeux.
//  La jauge d'exposition est lisible directement sur lui :
//  yeux qui faiblissent et vacillent, fumée qui s'échappe de son corps.
//  Déplacement avec de l'inertie (démarrage progressif, glissade à l'arrêt).
// ============================================================
export class Monster {
  constructor(scene, x, groundY, stage) {
    this.scene = scene;
    this.stage = stage;
    this.alive = true;
    this.facing = 1;
    this.gauge = 0;
    this.pushing = false;
    this.coyote = 0;
    this.jumpBuffer = 0;

    this.sprite = scene.physics.add
      .sprite(x, Monster.spawnY(groundY, stage), `${stage.spriteKey}_0`)
      .setDepth(DEPTH.MONSTER);
    this.sprite.body.pushable = false;   // il pousse les caisses, elles ne le poussent pas

    this.eyes = scene.add.image(x, 0, stage.eyesKey).setDepth(DEPTH.EYES);

    // Fumée qui s'échappe quand la jauge monte
    this.smoke = scene.add
      .particles(0, 0, 'puff', {
        lifespan: 700,
        speedY: { min: -26, max: -10 },
        speedX: { min: -8, max: 8 },
        scale: { start: 1.2, end: 0.2 },
        alpha: { start: 0.55, end: 0 },
        tint: 0x1a1318,
        frequency: -1,
        emitting: false,
      })
      .setDepth(DEPTH.EYES - 1);
    this._smokeTimer = 0;
    this._blinkAt = 1500;

    this.applyStage();
  }

  // Hauteur du centre de l'image pour que les pieds touchent le sol
  static spawnY(groundY, stage) {
    return groundY - stage.frame.h / 2 + 0.5;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  // Applique la forme du stade courant (image, corps, yeux)
  applyStage() {
    const st = this.stage;
    this.sprite.setTexture(`${st.spriteKey}_0`);
    const body = this.sprite.body;
    body.setSize(st.body.w, st.body.h, false);
    body.setOffset((st.frame.w - st.body.w) / 2, st.frame.h - st.body.h - 1);
    this.sprite.anims.play(`${st.spriteKey}-idle`);
    this.eyes.setTexture(st.eyesKey).setTint(st.eyesColor);
  }

  // Points du corps testés pour savoir s'il est éclairé (3 x 3)
  samplePoints() {
    const b = this.sprite.body;
    const xs = [b.x + 1.5, b.x + b.width / 2, b.right - 1.5];
    const ys = [b.y + 2, b.y + b.height / 2, b.bottom - 1.5];
    const pts = [];
    for (const y of ys) for (const x of xs) pts.push({ x, y });
    return pts;
  }

  update(dtMs, input, now) {
    const body = this.sprite.body;
    if (!this.alive) { this.followEyes(now); return; }
    const dt = dtMs / 1000;
    const st = this.stage;

    const onGround = body.blocked.down || body.touching.down;
    this.coyote = onGround ? CONTROLS.coyoteMs : this.coyote - dtMs;
    this.jumpBuffer = input.jumpPressed ? CONTROLS.jumpBufferMs : this.jumpBuffer - dtMs;

    // ---- Déplacement façon Limbo : de l'inertie, jamais d'arrêt net ----
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const maxSpeed = st.speed * (this.pushing ? st.pushFactor : 1);
    let vx = body.velocity.x;
    if (dir !== 0) {
      this.facing = dir;
      const turning = vx !== 0 && Math.sign(vx) !== dir;
      const rate = turning ? st.turn : onGround ? st.accel : st.accel * 0.5;
      const target = dir * maxSpeed;
      if (vx < target) vx = Math.min(vx + rate * dt, target);
      else vx = Math.max(vx - rate * dt, target);
    } else {
      // Relâchement : la vitesse retombe doucement (exponentielle)
      const k = onGround ? st.slide : st.slide * 0.2;
      vx *= Math.exp(-k * dt);
      if (Math.abs(vx) < 3) vx = 0;
    }
    body.setVelocityX(vx);

    // Saut (avec tolérance : coyote time + saut mémorisé)
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      body.setVelocityY(-st.jump);
      this.jumpBuffer = 0;
      this.coyote = 0;
    }
    if (!input.jumpHeld && body.velocity.y < -60) {
      body.setVelocityY(body.velocity.y * 0.55);   // saut plus court si on relâche
    }

    // L'animation ondule plus vite quand il avance
    this.sprite.anims.timeScale = 0.55 + (Math.abs(vx) / st.speed) * 0.9;
    this.sprite.setFlipX(this.facing < 0);
    this.pushing = false;
    this.updateGaugeFx(dtMs, now);
    this.followEyes(now);
  }

  followEyes(now) {
    const st = this.stage;
    const bob = Math.round(Math.sin(now / 420) * 0.6);
    this.eyes.setPosition(
      Math.round(this.sprite.x + this.facing * st.eyesDx),
      Math.round(this.sprite.y + st.eyesDy + bob)
    );
    this.eyes.setFlipX(this.facing < 0);
  }

  // Jauge visible sur le monstre : yeux plus faibles + fumée
  updateGaugeFx(dtMs, now) {
    const g = this.gauge;
    let alpha = 1 - 0.7 * g;
    if (g > 0.4 && Math.random() < g * 0.5) alpha *= 0.4;      // vacillement
    // Clignement occasionnel des yeux (il est vivant)
    let scaleY = 1;
    if (now > this._blinkAt) {
      scaleY = 0.2;
      if (now > this._blinkAt + 110) this._blinkAt = now + 2200 + Math.random() * 2800;
    }
    this.eyes.setAlpha(alpha).setScale(1, scaleY);

    this._smokeTimer -= dtMs;
    if (g > 0.05 && this._smokeTimer <= 0) {
      this._smokeTimer = 130 - 100 * g;
      const b = this.sprite.body;
      this.smoke.emitParticleAt(
        Phaser.Math.Between(b.left, b.right),
        Phaser.Math.Between(b.top, b.bottom)
      );
    }
  }

  setGauge(g) { this.gauge = g; }

  // Petit éclat des yeux (checkpoint atteint)
  pulseEyes() {
    this.scene.tweens.add({
      targets: this.eyes, scaleX: 1.8, scaleY: 1.8, duration: 160, yoyo: true,
    });
  }

  // Évolution : la forme change (les pieds restent au même endroit)
  evolve(newStage) {
    const feetY = this.sprite.body.bottom;
    this.stage = newStage;
    this.applyStage();
    this.sprite.y = feetY - newStage.frame.h / 2 + 1;
    this.followEyes(this.scene.now);
    this.scene.cameras.main.flash(260, 207, 239, 255);
    this.scene.tweens.add({
      targets: this.eyes, scaleX: 2.2, scaleY: 2.2, duration: 300, yoyo: true,
    });
  }

  // Mort : dissolution en fumée + éclat de lumière (moins de 2 s)
  die(onDone) {
    if (!this.alive) return;
    this.alive = false;
    const s = this.scene;
    const body = this.sprite.body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.smoke.emitting = false;

    s.cameras.main.flash(140, 255, 220, 160);
    s.cameras.main.shake(180, 0.004);

    const burst = s.add
      .particles(this.sprite.x, this.sprite.y, 'puff', {
        speed: { min: 20, max: 90 },
        angle: { min: 180, max: 360 },
        lifespan: 650,
        scale: { start: 1.4, end: 0.1 },
        alpha: { start: 0.9, end: 0 },
        tint: [0x120d12, 0x2a2128, 0xcfefff],
        gravityY: -25,
        emitting: false,
      })
      .setDepth(DEPTH.FX);
    burst.explode(22);
    s.time.delayedCall(900, () => burst.destroy());

    s.tweens.add({
      targets: this.sprite, alpha: 0, scaleY: 1.6, scaleX: 0.5,
      duration: EXPOSURE.deathAnimMs * 0.7, ease: 'Quad.easeIn',
    });
    s.tweens.add({
      targets: this.eyes, scaleX: 2.4, scaleY: 2.4, alpha: 0,
      duration: EXPOSURE.deathAnimMs * 0.8, ease: 'Quad.easeOut',
    });
    s.time.delayedCall(EXPOSURE.deathAnimMs, onDone);
  }

  respawn(x, groundY) {
    const body = this.sprite.body;
    body.enable = true;
    body.reset(x, Monster.spawnY(groundY, this.stage));
    this.sprite.setScale(1).setAlpha(0);
    this.eyes.setScale(1).setAlpha(0);
    this.gauge = 0;
    this.facing = 1;
    this.alive = true;
    this.scene.tweens.add({
      targets: [this.sprite, this.eyes], alpha: 1, duration: 350,
    });
  }
}
