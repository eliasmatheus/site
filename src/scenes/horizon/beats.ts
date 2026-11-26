/**
 * Horizon timeline: the scene's dwell (0 to 1) mapped to the camera around the black hole,
 * the wormhole, the fall and the instruments. Pure functions, no DOM.
 */

/** Wormhole until here, then a hard stop. */
export const WARP_END = 0.2;
/** Drifting in to the Off-axis view. */
export const ARRIVE_END = 0.46;
/** The dive towards the hole starts. */
export const DIVE_START = 0.5;
/** Instruments, shaking and alerts. */
export const FALL_START = 0.7;

export interface Framing {
  /** Camera distance from the hole, in Schwarzschild radii. */
  dist: number;
  tilt: number;
  yaw: number;
  roll: number;
  /** Where the hole sits on screen, as a fraction of the height. */
  sx: number;
  sy: number;
  fov: number;
}

export interface HorizonFrame extends Framing {
  /** 1 inside the wormhole, 0 out of it. */
  warp: number;
  /** 0 before the fall, 1 at the end. */
  fall: number;
}

// Far after the stop, then Off-axis, then a dive to the center.
const FAR: Framing = { dist: 34, tilt: 0.07, yaw: 0.35, roll: -0.3, sx: 0.12, sy: 0.05, fov: 0.85 };
const OFF: Framing = { dist: 15, tilt: 0.055, yaw: 0.5, roll: -0.48, sx: 0.3, sy: 0.12, fov: 0.95 };
const DIVE: Framing = { dist: 2.4, tilt: 0.02, yaw: 0, roll: -0.05, sx: 0, sy: 0, fov: 1.25 };

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Camera and effects at progress p, for a screen of the given width over height. */
export function horizonFrame(p: number, aspect: number): HorizonFrame {
  const arrive = smooth(WARP_END, ARRIVE_END, p);
  const dive = smooth(DIVE_START, 1, p);
  const at = (key: keyof Framing): number =>
    dive > 0 ? mix(OFF[key], DIVE[key], Math.pow(dive, 1.3)) : mix(FAR[key], OFF[key], arrive);
  // On narrow screens the hole moves less off-center and the camera stays a bit farther.
  const narrow = Math.min(1, aspect / 1.2);
  return {
    dist: at('dist') * (aspect < 0.8 ? 1.2 : 1),
    tilt: at('tilt'),
    yaw: at('yaw'),
    roll: at('roll'),
    sx: at('sx') * narrow,
    sy: at('sy'),
    fov: at('fov'),
    warp: 1 - smooth(WARP_END - 0.02, WARP_END, p),
    fall: smooth(FALL_START, 1, p),
  };
}

export interface Instruments {
  /** Distance in Schwarzschild radii. */
  distance: number;
  /** How fast a clock here runs compared with one far away. */
  dilation: number;
  /** Hull integrity, 0 to 100. */
  hull: number;
  /** How many alerts are up. */
  alerts: number;
}

/** When each alert shows, as a fraction of the fall. */
export const ALERT_AT = [0.1, 0.35, 0.55, 0.75] as const;

export function instruments(f: HorizonFrame): Instruments {
  const distance = (f.dist / 1.73) * 1.6;
  return {
    distance,
    dilation: Math.sqrt(Math.max(0.0001, 1 - 1 / Math.max(1.0001, distance))),
    hull: Math.max(0, Math.round(100 - f.fall * 96)),
    alerts: ALERT_AT.filter((at) => f.fall >= at).length,
  };
}

/** Which copy beat is on at progress p (index into the content beats), or -1. */
export const BEAT_RANGES: readonly (readonly [number, number])[] = [
  [0, 0.19],
  [0.24, 0.48],
  [0.48, 0.7],
  [0.86, 1.01],
];

export function beatAt(p: number): number {
  return BEAT_RANGES.findIndex(([from, to]) => p >= from && p < to);
}
