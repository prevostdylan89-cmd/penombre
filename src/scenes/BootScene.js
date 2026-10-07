import Phaser from 'phaser';
import { COUNTRIES } from '../data/countries.js';

// ============================================================
//  BootScene : en V1 il n'y a AUCUNE image à charger.
//  Tous les "sprites" sont dessinés ici en code (silhouettes simples
//  aux bonnes dimensions). Quand tu auras les vrais assets, on
//  remplacera ces textures par des fichiers de public/assets/.
// ============================================================

// Petit générateur aléatoire reproductible (même décor à chaque lancement)
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const pal = COUNTRIES.pays1.palette;
    this.makeMonster();
    this.makeEyes();
    this.makeSmallProps(pal);
    this.makeSentinel();
    this.makeBackgrounds(pal);

    ['monster1', 'monster2'].forEach((k) =>
      this.anims.create({
        key: `${k}-idle`,
        frames: [0, 1, 2, 3, 2, 1].map((i) => ({ key: `${k}_${i % 4}` })),
        frameRate: 6,
        repeat: -1,
      })
    );

    this.scene.start('Country');
  }

  // Dessine une texture à partir d'une fonction de dessin
  gen(key, w, h, draw) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ---------- Monstre : 4 images aux bords qui ondulent, par stade ----------
  makeMonster() {
    const BLACK = 0x040306;
    for (let f = 0; f < 4; f++) {
      const phase = f * 1.6;

      // Stade 1 : une petite goutte d'ombre, toute simple (20 x 22)
      this.gen(`monster1_${f}`, 20, 22, (g) => {
        g.fillStyle(BLACK, 1);
        const cx = 10, cy = 11, N = 18;
        const pts = [];
        for (let i = 0; i < N; i++) {
          const th = (i / N) * Math.PI * 2;
          const wob = 1 + 0.08 * Math.sin(3 * th + phase) + 0.05 * Math.sin(5 * th - 1.3 * phase);
          const narrow = 1 - 0.2 * Math.max(0, -Math.sin(th));   // plus étroit en haut : goutte
          pts.push({ x: cx + Math.cos(th) * 5.5 * wob * narrow, y: cy + Math.sin(th) * 6 * wob });
        }
        g.fillPoints(pts, true);
        // une seule petite pointe sur la tête
        g.fillTriangle(8, 6, 12, 6, 10 + Math.round(Math.sin(phase)), 3);
        // trois petits filaments en bas
        for (let k = 0; k < 3; k++) {
          const bx = 6 + k * 4;
          const len = 1 + ((k + f) % 3);
          g.fillTriangle(bx - 1, 16, bx + 2, 16, bx + Math.round(Math.sin(phase + k)), 18 + len);
        }
      });

      // Stade 2 : cornes, bras à griffes, filaments (28 x 34)
      this.gen(`monster2_${f}`, 28, 34, (g) => {
        g.fillStyle(BLACK, 1);
        const cx = 14, cy = 19, N = 24;
        const pts = [];
        for (let i = 0; i < N; i++) {
          const th = (i / N) * Math.PI * 2;
          const wob = 1 + 0.09 * Math.sin(3 * th + phase) + 0.06 * Math.sin(5 * th - 1.3 * phase);
          pts.push({ x: cx + Math.cos(th) * 7.5 * wob, y: cy + Math.sin(th) * 9.5 * wob });
        }
        g.fillPoints(pts, true);
        const sw = Math.round(Math.sin(phase) * 1.5);
        // deux cornes
        g.fillTriangle(8, 12, 12, 10, 6 + sw, 2);
        g.fillTriangle(16, 10, 20, 12, 22 - sw, 2);
        // deux bras, terminés par des griffes
        g.fillTriangle(7, 15, 9, 22, 2 + sw, 27);
        g.fillTriangle(21, 15, 19, 22, 26 - sw, 27);
        [[0, 31], [2, 31], [4, 30]].forEach(([x, y]) => g.fillTriangle(x, 27, x + 2, 27, x + 1, y + sw));
        [[21, 30], [23, 31], [25, 31]].forEach(([x, y]) => g.fillTriangle(x, 27, x + 2, 27, x + 1, y - sw));
        // six filaments en bas
        for (let k = 0; k < 6; k++) {
          const bx = 7 + k * 3;
          const len = 2 + ((k + f) % 3) * 2;
          g.fillTriangle(bx - 1, 26, bx + 2, 26, bx + Math.round(Math.sin(phase + k) * 1.5), 29 + len);
        }
      });
    }
  }

  // ---------- Yeux : même couleur à chaque stade, de plus en plus nombreux ----------
  makeEyes() {
    // Stade 1 : deux petits yeux
    this.gen('eyes1', 10, 4, (g) => {
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(0, 0, 4, 4);
      g.fillRect(6, 0, 4, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(1, 1, 2, 2);
      g.fillRect(7, 1, 2, 2);
    });
    // Stade 2 : deux grands yeux + deux petits en dessous
    this.gen('eyes2', 13, 7, (g) => {
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(0, 0, 5, 4);
      g.fillRect(8, 0, 5, 4);
      g.fillRect(3, 4, 3, 3);
      g.fillRect(7, 4, 3, 3);
      g.fillStyle(0xffffff, 1);
      g.fillRect(1, 1, 3, 2);
      g.fillRect(9, 1, 3, 2);
      g.fillRect(4, 5, 1, 1);
      g.fillRect(8, 5, 1, 1);
    });
    this.gen('puff', 3, 3, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(1, 0, 1, 3);
      g.fillRect(0, 1, 3, 1);
    });
  }

  // ---------- Caisse, lanterne, levier ----------
  makeSmallProps(pal) {
    this.gen('crate', 26, 24, (g) => {
      g.fillStyle(0x0f0a08, 1);
      g.fillRect(0, 0, 26, 24);
      g.fillStyle(pal.wood, 1);
      g.fillRect(0, 0, 26, 2);        // bords
      g.fillRect(0, 22, 26, 2);
      g.fillRect(0, 0, 2, 24);
      g.fillRect(24, 0, 2, 24);
      g.fillRect(0, 11, 26, 2);       // planche du milieu
      g.lineStyle(2, pal.wood, 1);    // croix de renfort
      g.lineBetween(3, 3, 23, 21);
      g.lineBetween(23, 3, 3, 21);
      g.fillStyle(0x7a5f45, 1);       // clous
      [[3, 3], [22, 3], [3, 20], [22, 20]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    });

    this.gen('lantern', 7, 10, (g) => {
      g.fillStyle(0x2a2018, 1);
      g.fillRect(2, 0, 3, 1);          // anneau
      g.fillRect(1, 1, 5, 1);          // chapeau
      g.fillRect(1, 9, 5, 1);          // socle
      g.fillStyle(pal.lantern, 1);
      g.fillRect(1, 2, 5, 7);          // verre
      g.fillStyle(0xfff1c9, 1);
      g.fillRect(2, 3, 3, 5);          // flamme
    });

    const lever = (key, on) => this.gen(key, 8, 14, (g) => {
      g.fillStyle(0x1a1410, 1);
      g.fillRect(0, 11, 8, 3);         // socle
      g.fillStyle(pal.rim, 1);
      g.fillRect(0, 11, 8, 1);
      g.lineStyle(2, 0x6a5038, 1);
      if (on) g.lineBetween(4, 11, 7, 3); else g.lineBetween(4, 11, 1, 3);
      g.fillStyle(0xb08a58, 1);
      if (on) g.fillRect(6, 1, 2, 3); else g.fillRect(0, 1, 2, 3);
    });
    lever('lever_off', false);
    lever('lever_on', true);
  }

  // ---------- Guetteur : héros droit et "héroïque" ----------
  makeSentinel() {
    this.gen('sentinel', 24, 40, (g) => {
      g.fillStyle(0x0a0608, 1);
      g.fillCircle(10, 7, 4);                          // tête
      g.fillTriangle(6, 5, 10, 0, 14, 5);              // chapeau pointu
      g.fillPoints([                                    // manteau
        { x: 6, y: 11 }, { x: 14, y: 11 }, { x: 18, y: 38 }, { x: 2, y: 38 },
      ], true);
      g.fillRect(13, 12, 9, 2);                        // bras tendu
      g.fillRect(20, 6, 2, 8);                         // main levée
      g.fillStyle(0x2f2420, 1);
      g.fillRect(14, 12, 1, 24);                       // liseré de lumière
    });
  }

  // ---------- Décors : plusieurs plans de plus en plus clairs ----------
  makeBackgrounds(pal) {
    const W = 480, H = 270;
    const lerpColor = (a, b, t) => {
      const ca = Phaser.Display.Color.IntegerToColor(a);
      const cb = Phaser.Display.Color.IntegerToColor(b);
      return Phaser.Display.Color.GetColor(
        Math.round(ca.red + (cb.red - ca.red) * t),
        Math.round(ca.green + (cb.green - ca.green) * t),
        Math.round(ca.blue + (cb.blue - ca.blue) * t)
      );
    };

    // Ciel : dégradé en bandes (look pixel art)
    this.gen('bg_sky', W, H, (g) => {
      for (let y = 0; y < H; y += 3) {
        const t = Math.pow(y / H, 1.6);
        g.fillStyle(lerpColor(pal.skyTop, pal.skyBottom, t), 1);
        g.fillRect(0, y, W, 3);
      }
    });

    // Plan lointain : collines + hameau + brume (se répète sans coupure)
    this.gen('bg_far', W, H, (g) => {
      const r = rng(11);
      g.fillStyle(pal.far, 1);
      for (let x = 0; x < W; x++) {
        const a = (2 * Math.PI * x) / W;
        const h = 170 - (14 * Math.sin(2 * a + 0.8) + 8 * Math.sin(5 * a + 2.1) + 4 * Math.sin(11 * a + 0.3));
        g.fillRect(x, Math.round(h), 1, H - Math.round(h));
      }
      for (let i = 0; i < 6; i++) {                    // petites maisons au loin
        const hx = 30 + i * 75 + Math.round(r() * 20);
        const hy = 175 + Math.round(r() * 8);
        g.fillStyle(pal.mid, 1);
        g.fillRect(hx, hy, 12, 9);
        g.fillTriangle(hx - 2, hy, hx + 14, hy, hx + 6, hy - 6);
        if (r() > 0.4) { g.fillStyle(pal.window, 0.9); g.fillRect(hx + 4, hy + 3, 2, 3); }
      }
      for (let i = 0; i < 14; i++) {                   // brume qui monte du sol
        g.fillStyle(pal.fog, 0.05);
        g.fillRect(0, 150 + i * 5, W, 5);
      }
    });

    // Plan moyen : ruines et arbres morts
    this.gen('bg_mid', W, H, (g) => {
      const r = rng(23);
      g.fillStyle(pal.mid, 1);
      [[24, 34, 34], [118, 44, 44], [248, 30, 30], [326, 46, 40], [418, 32, 36]].forEach(([x, w, h]) => {
        g.fillRect(x, 240 - h, w, h);
        g.fillTriangle(x - 3, 240 - h, x + w + 3, 240 - h, x + w / 2, 240 - h - 16);
        g.fillStyle(pal.window, 0.95);
        for (let k = 0; k < 2; k++) {
          if (r() > 0.35) g.fillRect(x + 6 + k * (w / 2 - 2), 240 - h + 10, 3, 5);
        }
        g.fillStyle(pal.mid, 1);
      });
      g.lineStyle(2, pal.mid, 1);                      // arbres morts
      [80, 210, 300, 390, 458].forEach((x) => {
        const h = 60 + Math.round(r() * 30);
        g.lineBetween(x, 240, x, 240 - h);
        g.lineBetween(x, 240 - h * 0.6, x - 12, 240 - h * 0.85);
        g.lineBetween(x, 240 - h * 0.45, x + 10, 240 - h * 0.7);
        g.lineBetween(x, 240 - h, x + 5, 240 - h - 9);
      });
      for (let i = 0; i < 8; i++) {
        g.fillStyle(pal.fog, 0.05);
        g.fillRect(0, 200 + i * 5, W, 5);
      }
    });

    // Plan proche : roseaux et troncs, très sombre
    this.gen('bg_near', W, H, (g) => {
      const r = rng(37);
      g.fillStyle(pal.near, 1);
      [40, 250, 400].forEach((x) => g.fillRect(x, 0, 7 + Math.round(r() * 3), 240));
      for (let x = 0; x < W; x += 3 + Math.round(r() * 3)) {
        const h = 8 + Math.round(r() * 24);
        const lean = Math.round((r() - 0.5) * 8);
        g.fillTriangle(x - 1, 240, x + 2, 240, x + lean, 240 - h);
      }
    });

    // Avant-plan noir (devant l'obscurité) : herbes en bas, lianes en haut
    this.gen('bg_fg', W, 150, (g) => {
      const r = rng(41);
      g.fillStyle(pal.black, 1);
      for (let x = 0; x < W; x += 4 + Math.round(r() * 4)) {
        const h = 6 + Math.round(r() * 22);
        const lean = Math.round((r() - 0.5) * 10);
        g.fillTriangle(x - 2, 150, x + 3, 150, x + lean, 150 - h);
      }
      g.fillRect(0, 140, W, 10);
    });
    this.gen('bg_vines', W, 60, (g) => {
      const r = rng(53);
      g.fillStyle(pal.black, 1);
      for (let x = 6; x < W; x += 30 + Math.round(r() * 40)) {
        const h = 10 + Math.round(r() * 40);
        g.fillRect(x, 0, 2, h);
        g.fillTriangle(x - 2, h, x + 4, h, x + 1, h + 6);
      }
      g.fillRect(0, 0, W, 4);
    });
  }
}
