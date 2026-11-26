// The light that follows the pointer over the nebula: recent points, each fading out on its own.

export interface TrailPoint {
  /** CSS pixels from the left of the viewport. */
  x: number;
  /** CSS pixels from the top of the viewport. */
  y: number;
  /** Strength, 1 when fresh, 0 when gone. */
  s: number;
}

export const TRAIL_SIZE = 10;
/** A fresh point fades out in 2.5 s. */
export const FADE_PER_SECOND = 0.4;
/** Radius of the light around each point, in CSS pixels. */
export const LIGHT_RADIUS = 300;

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
 * CSS mask for the lit copy of the nebula: one soft spot per visible point.
 * `offsetX` moves screen coordinates into the panned canvas (the current pan, in pixels).
 */
export function lightMask(trail: readonly TrailPoint[], offsetX: number): string {
  const spots = trail
    .filter((p) => p.s > 0.01)
    .map((p) => {
      const a = p.s.toFixed(3);
      const half = (p.s * 0.45).toFixed(3);
      return `radial-gradient(circle ${LIGHT_RADIUS}px at ${(p.x + offsetX).toFixed(1)}px ${p.y.toFixed(1)}px, rgb(0 0 0 / ${a}), rgb(0 0 0 / ${half}) 40%, transparent)`;
    });
  return spots.length ? spots.join(', ') : 'linear-gradient(transparent, transparent)';
}
