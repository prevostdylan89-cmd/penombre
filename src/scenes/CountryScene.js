import Phaser from 'phaser';
import { DEPTH, GAME, EXPOSURE, INTERACT } from '../data/gameplay.js';
import { EVOLUTIONS } from '../data/evolutions.js';
import { COUNTRIES } from '../data/countries.js';
import { LEVEL1 } from '../data/level1.js';
import { Monster } from '../entities/Monster.js';
import { Crate } from '../entities/Obstacle.js';
import { Lever } from '../entities/Lever.js';
import { Sentinel } from '../entities/Hero.js';
import { LightSystem } from '../systems/LightSystem.js';
import { ExposureSystem } from '../systems/ExposureSystem.js';
import { Checkpoints } from '../systems/Checkpoints.js';

// ============================================================
//  Scène du pays 1 (provisoire). Une scène par pays, construite
//  à partir de sa fiche (data/countries.js) et de son niveau.
// ============================================================
export default class CountryScene extends Phaser.Scene {
  constructor() { super('Country'); }

  create() {
    const L = LEVEL1;
    const country = COUNTRIES.pays1;
    this.level = L;
    this.country = country;
    this.now = 0;
    this.gameTime = 0;
    this.ended = false;
    this.deaths = 0;
    window.__scene = this;   // pratique pour déboguer / tester

    this.physics.world.setBounds(0, 0, L.width, L.height);
    this.cameras.main.setBounds(0, 0, L.width, L.height);

    this.buildBackground();
    this.buildPlatforms();

    // Caisses
    this.crates = L.crates.map((c) => new Crate(this, c));

    // Lumière : la même géométrie sert au rendu et à la détection
    this.lightSystem = new LightSystem(this, {
      worldW: L.width,
      worldH: L.height,
      staticOccluders: L.platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
      getDynamicOccluders: () => this.crates.map((c) => c.rect()),
    });

    this.buildLanterns();
    this.levers = L.levers.map((lv) =>
      new Lever(this, lv, L.groundY, this.lightSystem.getLight(lv.target))
    );
    this.sentinels = L.sentinels.map((s) =>
      new Sentinel(this, this.lightSystem, s, country.lightColor)
    );

    // Monstre
    this.stage = EVOLUTIONS[0];
    this.checkpoints = new Checkpoints(L.checkpoints);
    const cp = this.checkpoints.current;
    this.monster = new Monster(this, cp.x, L.groundY, this.stage);
    this.exposure = new ExposureSystem(this.lightSystem);
    this.exposure.reset(0);

    // Collisions
    const crateSprites = this.crates.map((c) => c.sprite);
    this.physics.add.collider(this.monster.sprite, this.platformBodies);
    this.physics.add.collider(crateSprites, this.platformBodies);
    this.physics.add.collider(this.monster.sprite, crateSprites, (m) => {
      if (m.body.touching.left || m.body.touching.right) this.monster.pushing = true;
    });

    // Caméra
    const cam = this.cameras.main;
    cam.startFollow(this.monster.sprite, true, 0.08, 0.08);
    cam.setDeadzone(24, 0);

    this.buildForeground();
    this.buildDust();
    this.setupInput();

    cam.fadeIn(900, 0, 0, 0);
  }

  // ---------- Construction du décor ----------
  buildBackground() {
    const { width: W, height: H } = GAME;
    const mk = (key, depth) =>
      this.add.tileSprite(0, 0, W, H, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    this.add.image(0, 0, 'bg_sky').setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.SKY);
    this.parallax = [
      { sprite: mk('bg_far', DEPTH.FAR), factor: 0.15 },
      { sprite: mk('bg_mid', DEPTH.MID), factor: 0.35 },
      { sprite: mk('bg_near', DEPTH.NEAR), factor: 0.65 },
    ];
  }

  buildPlatforms() {
    const L = this.level;
    const pal = this.country.palette;
    const g = this.add.graphics().setDepth(DEPTH.PLATFORM);
    this.platformBodies = [];

    L.platforms.forEach((p) => {
      // Corps physique (invisible)
      const body = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h);
      this.physics.add.existing(body, true);
      this.platformBodies.push(body);

      // Dessin : masse noire + liseré clair en haut
      g.fillStyle(pal.platform, 1);
      g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle(pal.rim, 1);
      g.fillRect(p.x, p.y, p.w, 1);
    });

    // Gravats au sol (purement décoratif)
    const ground = L.platforms[0];
    const r = Phaser.Math.RND;
    r.sow(['penombre']);
    g.fillStyle(pal.platform, 1);
    for (let x = 0; x < ground.w; x += 5 + r.between(0, 8)) {
      g.fillRect(x, ground.y - r.between(1, 3), r.between(2, 6), 3);
    }
    g.fillStyle(pal.rim, 0.8);
    for (let x = 0; x < ground.w; x += 40 + r.between(0, 60)) {
      g.fillRect(x, ground.y + 5 + r.between(0, 6), r.between(3, 9), 1);
    }

    // Piliers de la tour du guetteur (au second plan, on peut passer devant)
    const decor = this.add.graphics().setDepth(DEPTH.DECOR);
    L.sentinels.forEach((s) => {
      decor.fillStyle(0x16100c, 1);
      decor.fillRect(s.x - 15, s.platformTop + 8, 2, L.groundY - s.platformTop - 8);
      decor.fillRect(s.x + 13, s.platformTop + 8, 2, L.groundY - s.platformTop - 8);
      decor.fillRect(s.x - 17, s.platformTop + 18, 34, 1);
    });
  }

  buildLanterns() {
    const L = this.level;
    const decor = this.add.graphics().setDepth(DEPTH.DECOR);
    this.lanterns = L.lanterns.map((cfg) => {
      // Poteau + bras + corde (décor)
      decor.fillStyle(0x15100c, 1);
      decor.fillRect(cfg.post.x, cfg.post.armY, 3, L.groundY - cfg.post.armY);
      decor.fillRect(Math.min(cfg.x, cfg.post.x), cfg.post.armY, Math.abs(cfg.post.x - cfg.x) + 3, 2);
      decor.fillRect(cfg.x, cfg.post.armY, 1, cfg.y - 5 - cfg.post.armY);

      const light = this.lightSystem.addLight({
        id: cfg.id, x: cfg.x, y: cfg.y, radius: cfg.radius,
        strongRatio: cfg.strongRatio,
        color: this.country.lightColor,
      });
      const bulb = this.add.image(cfg.x, cfg.y, 'lantern').setDepth(DEPTH.LANTERN);
      return { light, bulb };
    });
  }

  buildForeground() {
    const { width: W } = GAME;
    this.fgGrass = this.add
      .tileSprite(0, 120, W, 150, 'bg_fg').setOrigin(0, 0)
      .setScrollFactor(0).setDepth(DEPTH.FOREGROUND);
    this.fgVines = this.add
      .tileSprite(0, 0, W, 60, 'bg_vines').setOrigin(0, 0)
      .setScrollFactor(0).setDepth(DEPTH.FOREGROUND);
  }

  // Poussière en suspension : visible seulement dans la lumière
  buildDust() {
    this.add
      .particles(0, 0, 'puff', {
        x: { min: 0, max: this.level.width },
        y: { min: 60, max: 236 },
        lifespan: 7000,
        speedX: { min: -5, max: 5 },
        speedY: { min: -6, max: 1 },
        scale: 0.35,
        alpha: { start: 0.8, end: 0 },
        tint: 0xffe2b0,
        frequency: 90,
      })
      .setDepth(DEPTH.DUST);
  }

  setupInput() {
    const kb = this.input.keyboard;
    this.keys = kb.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', space: 'SPACE',
      a: 'A', d: 'D', q: 'Q', w: 'W', z: 'Z', e: 'E', r: 'R',
    });
    this.input.on('pointerdown', () => window.focus());

    // On écoute l'événement "touche enfoncée" : un appui très bref n'est jamais perdu
    this.pressed = { jump: false, interact: false };
    this.jumpMinHold = 0;
    const onJump = () => { this.pressed.jump = true; this.jumpMinHold = 130; };
    [this.keys.up, this.keys.space, this.keys.w, this.keys.z].forEach((k) => k.on('down', onJump));
    this.keys.e.on('down', () => { this.pressed.interact = true; });
  }

  // ---------- Boucle de jeu ----------
  update(_time, delta) {
    // Horloge de jeu : tout (guetteur, jauge, effets) suit le même temps
    this.gameTime = (this.gameTime || 0) + delta;
    const time = this.gameTime;
    this.now = time;
    const cam = this.cameras.main;
    this.parallax.forEach((p) => { p.sprite.tilePositionX = cam.scrollX * p.factor; });
    this.fgGrass.tilePositionX = cam.scrollX * 1.35;
    this.fgVines.tilePositionX = cam.scrollX * 1.2;

    const K = this.keys;
    if (Phaser.Input.Keyboard.JustDown(K.r)) { this.scene.restart(); return; }

    // Lumières animées
    this.sentinels.forEach((s) => s.update(time));
    this.lanterns.forEach(({ light, bulb }) => {
      bulb.setAlpha(Math.min(1, light.level * 1.6));
    });
    this.lightSystem.update();

    if (this.ended) return;

    this.jumpMinHold = Math.max(0, this.jumpMinHold - delta);
    const input = {
      left: K.left.isDown || K.a.isDown || K.q.isDown,
      right: K.right.isDown || K.d.isDown,
      // saut d'une hauteur minimale même si la touche est relâchée aussitôt
      jumpHeld: K.up.isDown || K.space.isDown || K.w.isDown || K.z.isDown || this.jumpMinHold > 0,
      jumpPressed: this.pressed.jump,
    };
    const interact = this.pressed.interact;
    this.pressed.jump = false;
    this.pressed.interact = false;

    const m = this.monster;
    m.update(delta, input, time);
    if (!m.alive) return;

    // Exposition à la lumière
    const dead = this.exposure.update(delta, m.samplePoints(), this.stage.resistance, time);
    m.setGauge(this.exposure.gauge);
    if (dead) { this.killMonster(); return; }

    // Checkpoints
    if (this.checkpoints.update(m.x)) m.pulseEyes();

    // Leviers : retour visuel discret si on est à portée, E pour tirer
    for (const lv of this.levers) {
      const near =
        Math.abs(m.x - lv.x) <= INTERACT.rangeX && Math.abs(m.y - lv.y) <= INTERACT.rangeY;
      lv.sprite.setTint(near && !lv.on ? 0xcfefff : 0xffffff);
      if (near && interact) lv.toggle();
    }

    // Sortie : le pays s'éteint
    if (m.x >= this.level.exitX) this.startEnding();
  }

  killMonster() {
    const m = this.monster;
    if (!m.alive) return;
    this.deaths++;
    m.die(() => {
      this.time.delayedCall(EXPOSURE.respawnDelayMs, () => {
        const cp = this.checkpoints.current;
        m.respawn(cp.x, this.level.groundY);
        this.exposure.reset(this.now);
      });
    });
  }

  // Fin du pays : la lumière s'éteint, le monstre grandit (aperçu d'évolution)
  startEnding() {
    this.ended = true;
    const m = this.monster;
    m.sprite.body.setVelocity(0, 0);
    m.sprite.body.setAllowGravity(false);
    m.sprite.body.enable = false;
    m.sprite.anims.pause();

    this.lightSystem.lights.forEach((l) =>
      this.tweens.add({ targets: l, level: 0, duration: 2400, ease: 'Sine.easeIn' })
    );
    this.time.delayedCall(2600, () => {
      // Évolution : la forme change (cornes, bras à griffes, 4 yeux)
      m.evolve(EVOLUTIONS[1]);
      m.sprite.anims.resume();
      this.cameras.main.shake(900, 0.003);
    });
    this.time.delayedCall(4600, () => this.cameras.main.fadeOut(1400, 0, 0, 0));
    this.time.delayedCall(6200, () => {
      // Texte provisoire : la présence de texte reste un point ouvert du design
      this.add
        .text(GAME.width / 2, GAME.height / 2, "L'ombre grandit…", {
          fontFamily: 'monospace', fontSize: '10px', color: '#cfefff',
        })
        .setOrigin(0.5).setScrollFactor(0).setDepth(200);
      this.cameras.main.resetFX();
      this.cameras.main.setBackgroundColor('#000000');
    });
    this.time.delayedCall(9500, () => this.scene.restart());
  }
}
