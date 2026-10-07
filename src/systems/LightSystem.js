import Phaser from 'phaser';
import { DEPTH, LIGHT } from '../data/gameplay.js';
import { LightSource } from '../entities/LightSource.js';
import {
  normAngle, rectSegments, distPointSegment, raySegment, pointInPolygon,
} from './geometry.js';

// ============================================================
//  Système de lumière.
//  1. Pour chaque source : "polygone de visibilité" par lancer de rayons
//     vers les coins des obstacles.
//  2. Ce MÊME polygone sert à dessiner la lumière (on le découpe dans une
//     couche d'obscurité) et à tester si le monstre est éclairé.
//  3. Recalcul seulement si la source ou un obstacle proche a bougé.
// ============================================================
export class LightSystem {
  /**
   * @param scene          scène Phaser
   * @param cfg.worldW/H   taille du monde
   * @param cfg.staticOccluders   rectangles fixes qui bloquent la lumière
   * @param cfg.getDynamicOccluders  () => rectangles mobiles (caisses...)
   */
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    this.lights = [];

    this.staticSegments = cfg.staticOccluders.flatMap(rectSegments);
    this.dynamicSegments = [];
    this._dynSig = null;
    this._needsRedraw = true;

    // Couche d'obscurité couvrant tout le monde (on y "découpe" la lumière)
    this.dark = scene.add
      .renderTexture(0, 0, cfg.worldW, cfg.worldH)
      .setOrigin(0, 0)
      .setDepth(DEPTH.DARKNESS);
    // Graphique servant de "gomme"
    this.eraser = scene.make.graphics({ x: 0, y: 0, add: false });
    // Halo coloré par-dessus (additif)
    this.glow = scene.add
      .graphics()
      .setDepth(DEPTH.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  addLight(opts) {
    const light = new LightSource(opts);
    this.lights.push(light);
    this._needsRedraw = true;
    return light;
  }

  getLight(id) {
    return this.lights.find((l) => l.id === id);
  }

  // À appeler à chaque frame
  update() {
    // 1. Les obstacles mobiles ont-ils bougé ?
    const dyn = this.cfg.getDynamicOccluders();
    const dynSig = dyn.map((r) => `${Math.round(r.x * 2)},${Math.round(r.y * 2)}`).join(';');
    const obstaclesMoved = dynSig !== this._dynSig;
    if (obstaclesMoved) {
      this._dynSig = dynSig;
      this.dynamicSegments = dyn.flatMap(rectSegments);
    }

    // 2. Recalcul des sources qui en ont besoin
    const segments = this.staticSegments.concat(this.dynamicSegments);
    for (const light of this.lights) {
      const sig = light.signature();
      if (obstaclesMoved || sig !== light._sig) {
        light._sig = sig;
        this.computeRays(light, segments);
        this._needsRedraw = true;
      }
    }

    // 3. Redessin seulement si quelque chose a changé
    if (this._needsRedraw) {
      this.redraw();
      this._needsRedraw = false;
    }
  }

  // ---------- Calcul du polygone de visibilité ----------
  computeRays(light, segments) {
    const R = light.currentRadius;
    light.rays = [];
    light.polyFull = [];
    if (R < 1) return;

    const sx = light.x;
    const sy = light.y;
    const near = segments.filter((s) => distPointSegment(sx, sy, s) <= R + 1);
    const half = light.spread / 2;

    // Angles (relatifs à la direction) où lancer un rayon
    const rels = [-half, half];
    const step = light.isCone ? 0.045 : 0.07;
    for (let r = -half; r <= half; r += step) rels.push(r);

    // + un rayon de part et d'autre de chaque coin d'obstacle
    const addAngle = (a) => {
      const rel = normAngle(a - light.dir);
      if (Math.abs(rel) <= half + 1e-9) rels.push(rel);
    };
    for (const s of near) {
      for (const [px, py] of [[s.ax, s.ay], [s.bx, s.by]]) {
        const dx = px - sx;
        const dy = py - sy;
        if (dx * dx + dy * dy > (R + 2) * (R + 2)) continue;
        const a = Math.atan2(dy, dx);
        addAngle(a - 0.0004);
        addAngle(a);
        addAngle(a + 0.0004);
      }
    }
    rels.sort((a, b) => a - b);

    for (const rel of rels) {
      const a = rel + light.dir;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      let t = R;
      for (const s of near) {
        const hit = raySegment(sx, sy, cos, sin, s);
        if (hit !== null && hit < t) t = hit;
      }
      light.rays.push({ rel, cos, sin, t });
    }
    light.polyFull = this.polygon(light, R);
  }

  // Polygone de la lumière limité à un rayon rMax
  polygon(light, rMax) {
    const pts = [];
    if (light.isCone) pts.push({ x: light.x, y: light.y });
    for (const ray of light.rays) {
      const t = Math.min(ray.t, rMax);
      pts.push({ x: light.x + ray.cos * t, y: light.y + ray.sin * t });
    }
    return pts;
  }

  // ---------- Détection : ce point est-il éclairé ? ----------
  // 0 = ombre, 1 = lumière faible (jauge), 2 = lumière forte (mort)
  sample(light, x, y) {
    if (!light.enabled || light.polyFull.length < 3) return 0;
    const dx = x - light.x;
    const dy = y - light.y;
    const d2 = dx * dx + dy * dy;
    const R = light.currentRadius;
    if (d2 > R * R) return 0;
    if (light.isCone) {
      const rel = normAngle(Math.atan2(dy, dx) - light.dir);
      if (Math.abs(rel) > light.spread / 2) return 0;
    }
    if (!pointInPolygon(x, y, light.polyFull)) return 0;
    const S = light.strongRadius;
    return d2 <= S * S ? 2 : 1;
  }

  // ---------- Rendu ----------
  redraw() {
    this.dark.clear();
    this.dark.fill(LIGHT.darkColor, LIGHT.darkAlpha, 0, 0, this.cfg.worldW, this.cfg.worldH);

    const eraser = this.eraser;
    const glow = this.glow;
    eraser.clear();
    glow.clear();

    for (const light of this.lights) {
      if (!light.enabled) continue;
      const R = light.currentRadius;
      const s = light.strongRatio;
      // Rayons des anneaux : 4 pour la zone faible (de R vers la limite forte),
      // la limite de la zone FORTE (même valeur que pour la détection), puis 2 de cœur
      const radii = [];
      for (let i = 0; i < 4; i++) radii.push(R * (1 - (1 - s) * (i / 4)));
      radii.push(R * s, R * s * 0.7, R * s * 0.4);
      const fade = Math.min(1, light.level);

      radii.forEach((r, i) => {
        const poly = this.polygon(light, r);
        eraser.fillStyle(0xffffff, LIGHT.ringAlphas[i] * fade);
        eraser.fillPoints(poly, true);
        glow.fillStyle(light.color, LIGHT.glowAlphas[i] * fade);
        glow.fillPoints(poly, true);
      });
    }
    this.dark.erase(eraser, 0, 0);
  }
}
