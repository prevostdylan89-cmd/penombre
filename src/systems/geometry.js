// ============================================================
//  Petites fonctions de géométrie 2D utilisées par la lumière.
// ============================================================

// Ramène un angle dans [-PI, PI]
export function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Les 4 côtés d'un rectangle {x, y, w, h} sous forme de segments
export function rectSegments(r) {
  const x2 = r.x + r.w;
  const y2 = r.y + r.h;
  return [
    { ax: r.x, ay: r.y, bx: x2, by: r.y },   // haut
    { ax: x2, ay: r.y, bx: x2, by: y2 },     // droite
    { ax: x2, ay: y2, bx: r.x, by: y2 },     // bas
    { ax: r.x, ay: y2, bx: r.x, by: r.y },   // gauche
  ];
}

// Distance d'un point à un segment
export function distPointSegment(px, py, s) {
  const ex = s.bx - s.ax;
  const ey = s.by - s.ay;
  const len2 = ex * ex + ey * ey;
  let t = len2 === 0 ? 0 : ((px - s.ax) * ex + (py - s.ay) * ey) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = s.ax + ex * t;
  const cy = s.ay + ey * t;
  return Math.hypot(px - cx, py - cy);
}

// Un rayon (origine o, direction d) touche-t-il le segment ? Renvoie la distance ou null.
export function raySegment(ox, oy, dx, dy, s) {
  const ex = s.bx - s.ax;
  const ey = s.by - s.ay;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-9) return null; // parallèles
  const px = s.ax - ox;
  const py = s.ay - oy;
  const t = (px * ey - py * ex) / denom;
  const u = (px * dy - py * dx) / denom;
  if (t >= 0 && u >= -1e-9 && u <= 1 + 1e-9) return t;
  return null;
}

// Un point est-il dans un polygone ? (points = [{x,y}, ...])
export function pointInPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y;
    const xj = pts[j].x, yj = pts[j].y;
    const crosses = (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
