// The pointer trail that reveals the nebula: recent points, each fading out on its own.

export interface TrailPoint {
  /** CSS pixels from the left of the viewport. */
  x: number;
  /** CSS pixels from the top of the viewport. */
  y: number;
  /** Strength, 1 when fresh, 0 when gone. */
  s: number;
}

export const TRAIL_SIZE = 14;
/** A fresh point fades out in 2.5 s. */
export const FADE_PER_SECOND = 0.4;

/** Adds a point at the head of the trail and drops the oldest past the limit. */
export function pushPoint(trail: TrailPoint[], point: TrailPoint, size = TRAIL_SIZE): void {
  trail.unshift(point);
  if (trail.length > size) trail.length = size;
}

export function fadeTrail(trail: TrailPoint[], dt: number): void {
  for (const p of trail) p.s = Math.max(0, p.s - dt * FADE_PER_SECOND);
}

/** True when nothing in the trail is still visible, so the slow wanderer takes over. */
export function isIdle(trail: readonly TrailPoint[], threshold = 0.05): boolean {
  return trail.every((p) => p.s < threshold);
}

/** Where the wanderer is at time t (seconds): a slow loop around the middle of the screen. */
export function wanderer(t: number, width: number, height: number): { x: number; y: number } {
  const k = t * 0.12;
  return {
    x: width * (0.55 + 0.3 * Math.sin(k * 1.3)),
    y: height * (0.45 + 0.3 * Math.sin(k * 0.9 + 1)),
  };
}

/**
 * Packs the trail for the shader: canvas pixels with y up, three floats per point.
 * Missing points stay at strength 0.
 */
export function packTrail(
  trail: readonly TrailPoint[],
  scale: number,
  canvasHeight: number,
  size = TRAIL_SIZE,
): Float32Array {
  const out = new Float32Array(size * 3);
  trail.slice(0, size).forEach((p, i) => {
    out[i * 3] = p.x * scale;
    out[i * 3 + 1] = canvasHeight - p.y * scale;
    out[i * 3 + 2] = p.s;
  });
  return out;
}
