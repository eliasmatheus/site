/**
 * The fall: maps the scene's dwell progress (0 to 1) to the descent and the overlays. Pure.
 *
 *   0    to 0.03  the white flash of the fall fades; a slow tumble settles
 *   0.03 to 0.82  free fall down the shaft, then a diagonal glide past four memories
 *   0.82 to 0.9   through the last gap: a pixel iris opens on an old computer
 *   0.9  to 1     the old computer: loading, then a save file waiting to continue
 */
import { MEMORY_T } from './path';

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const FALL_START = 0.03;
export const FALL_END = 0.82;
export const THROUGH_END = 0.9;

/** Inverse of the smoothstep in `fallAt`: the progress that reaches a point of the path. */
const unsmooth = (y: number): number => 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3);

/** When each memory is passed, in dwell progress. */
export const GAPS: readonly { at: number }[] = MEMORY_T.map((t) => ({
  at: FALL_START + (FALL_END - FALL_START) * unsmooth(t),
}));

/** The first computer waits at the bottom: the descent slows on it. */
export const BOTTOM_AT = 0.79;

/** How far along the path (0 to 1, src/scenes/the-fall/path.ts) the camera is. */
export const fallAt = (p: number): number => smooth(FALL_START, FALL_END, p);

export interface FallState {
  fall: number;
  /** Going through the last gap, 0 to 1. */
  through: number;
  /** The white flash left by the Horizon. */
  whiteout: number;
  /** The title. */
  intro: number;
  /** Index of the moment being passed, -1 for none, GAPS.length for the first computer. */
  glimpse: number;
  /** Pixel iris on the old computer, 0 to 1 in hard steps. */
  hole: number;
  /** The old computer's screen: 0 loading, 1 the save file, 2 the menu. */
  retro: 0 | 1 | 2;
}

/** The iris grows in twelve hard steps, like a low-resolution screen. */
const IRIS_STEPS = 12;

export function fallState(p: number): FallState {
  const fall = fallAt(p);
  const through = smooth(FALL_END, THROUGH_END, p);
  let glimpse = -1;
  if (p > 0.08 && p < 0.86) {
    GAPS.forEach((g, i) => {
      if (Math.abs(fallAt(g.at) - fall) < 0.05) glimpse = i;
    });
    if (p > 0.74) glimpse = GAPS.length;
  }
  const hole = Math.round(smooth(0.85, THROUGH_END, p) * IRIS_STEPS) / IRIS_STEPS;
  return {
    fall,
    through,
    whiteout: 1 - smooth(0, FALL_START, p),
    intro: smooth(0.004, 0.025, p) * (1 - smooth(0.1, 0.14, p)),
    glimpse,
    hole,
    retro: p < 0.93 ? 0 : p < 0.96 ? 1 : 2,
  };
}
