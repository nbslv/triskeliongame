/** Geometria da visão dos inimigos (pura, testável). */
export interface Vec {
  x: number;
  y: number;
}

export const DIR_ANGLE: Record<string, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

export function angleDiff(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * Distância livre ao longo do raio até bater em parede (amostragem a cada `step` px).
 * `blocked(x,y)` diz se o ponto é sólido.
 */
export function castRay(origin: Vec, angle: number, range: number, blocked: (x: number, y: number) => boolean, step = 4): number {
  const cx = Math.cos(angle);
  const cy = Math.sin(angle);
  for (let d = step; d <= range; d += step) {
    if (blocked(origin.x + cx * d, origin.y + cy * d)) return Math.max(0, d - step / 2);
  }
  return range;
}

/** O alvo está dentro do cone (alcance, meia-abertura) e com linha de visão livre? */
export function canSee(
  eye: Vec,
  facingAngle: number,
  halfAngle: number,
  range: number,
  target: Vec,
  blocked: (x: number, y: number) => boolean,
): boolean {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const ang = Math.atan2(dy, dx);
  if (angleDiff(ang, facingAngle) > halfAngle) return false;
  return castRay(eye, ang, dist, blocked) >= dist - 2;
}
