// ============================================================
//  Points de reprise : on enregistre le dernier checkpoint dépassé.
// ============================================================
export class Checkpoints {
  constructor(points) {
    this.points = points.map((p) => ({ x: p.x }));
    this.index = 0;
  }

  get current() { return this.points[this.index]; }

  // Renvoie true si un NOUVEAU checkpoint vient d'être atteint
  update(monsterX) {
    let reached = false;
    for (let i = this.index + 1; i < this.points.length; i++) {
      if (monsterX >= this.points[i].x) { this.index = i; reached = true; }
    }
    return reached;
  }
}
