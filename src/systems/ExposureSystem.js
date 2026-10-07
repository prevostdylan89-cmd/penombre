import { EXPOSURE } from '../data/gameplay.js';

// ============================================================
//  Exposition du monstre à la lumière.
//  - lumière FORTE  -> mort instantanée
//  - lumière FAIBLE -> la jauge se remplit (mort quand elle est pleine)
//  - ombre          -> la jauge se vide
//  Teste plusieurs points du corps : un seul point éclairé suffit.
// ============================================================
export class ExposureSystem {
  constructor(lightSystem) {
    this.lights = lightSystem;
    this.gauge = 0;     // 0 à 1
    this.state = 0;     // 0 ombre, 1 faible, 2 forte
    this.graceUntil = 0;
  }

  reset(now = 0) {
    this.gauge = 0;
    this.state = 0;
    this.graceUntil = now + EXPOSURE.graceMs;
  }

  /** @returns {boolean} true si le monstre doit mourir */
  update(dtMs, points, resistance, now) {
    let worst = 0;
    for (const light of this.lights.lights) {
      if (!light.enabled) continue;
      for (const p of points) {
        const s = this.lights.sample(light, p.x, p.y);
        if (s > worst) worst = s;
        if (worst === 2) break;
      }
      if (worst === 2) break;
    }
    this.state = worst;

    if (now < this.graceUntil) return false;   // juste après la réapparition
    if (worst === 2) { this.gauge = 1; return true; }

    const dt = dtMs / 1000;
    if (worst === 1) this.gauge += (EXPOSURE.fillPerSec / resistance) * dt;
    else this.gauge -= EXPOSURE.recoverPerSec * dt;
    this.gauge = Math.max(0, Math.min(1, this.gauge));
    return this.gauge >= 1;
  }
}
