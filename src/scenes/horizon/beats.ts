/**
 * Horizon timeline: the scene's dwell (0 to 1) mapped to the departure (the ringed planet,
 * the wormhole, the tunnel, the calm, a still sky) and then the camera around the black hole,
 * the fall and the instruments. Pure functions, no DOM. docs/viagem.md, acts I and II.
 *
 * The black hole part keeps its own timeline (`q`, 0.2 to 1) and is mapped onto the dwell
 * after the departure, so its beats and framings did not have to change.
 */

/** The ringed planet against the light, the camera panning. */
export const PLANET_END = 0.11;
/** The wormhole, revealed a little at a time, until its mouth. */
export const MOUTH_AT = 0.2;
/** Inside: the tunnel seen from near its wall, shaking. */
export const TUNNEL_END = 0.27;
/** The calm: speed falls away, the center opens. */
export const CALM_END = 0.31;
/** A still sky; then the black hole. */
export const DEPARTURE_END = 0.36;

/** The black hole's own timeline (q). */
const Q_START = 0.2;
/** Drifting in to the Off-axis view. */
export const ARRIVE_END = 0.46;
/** The dive towards the hole starts. */
export const DIVE_START = 0.5;
/** Instruments, shaking and alerts. */
export const FALL_START = 0.7;

/** Dwell progress where the black hole timeline reaches q. */
export const atQ = (q: number): number =>
  DEPARTURE_END + ((q - Q_START) / (1 - Q_START)) * (1 - DEPARTURE_END);
/** Black hole timeline at dwell progress p (Q_START before the departure ends). */
const qAt = (p: number): number =>
  p <= DEPARTURE_END
    ? Q_START
    : Q_START + ((p - DEPARTURE_END) / (1 - DEPARTURE_END)) * (1 - Q_START);

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
  /** 1 during the departure, 0 once the black hole shows. */
  warp: number;
  /** The ringed planet: 1 in view, 0 gone. */
  planet: number;
  /** The camera's pan across the planet, 0 to 1. */
  pan: number;
  /** Approaching the wormhole, 0 far to 1 at its mouth. */
  approach: number;
  /** How much of the wormhole shows, 0 (a faint lens) to 1 (all its light). */
  reveal: number;
  /** 0 outside the sphere, 1 in the tunnel. */
  inside: number;
  /** Shaking and flashes in the tunnel, 0 to 1. */
  turbulence: number;
  /** The calm after it: 1 once the tunnel has slowed and opened. */
  calm: number;
  /** A still sky, 1 at the end of the departure. */
  still: number;
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
  const q = qAt(p);
  const arrive = smooth(Q_START, ARRIVE_END, q);
  const dive = smooth(DIVE_START, 1, q);
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
    warp: 1 - smooth(DEPARTURE_END - 0.025, DEPARTURE_END, p),
    planet: 1 - smooth(PLANET_END - 0.03, PLANET_END + 0.01, p),
    pan: smooth(0, PLANET_END + 0.01, p),
    approach: smooth(PLANET_END - 0.03, MOUTH_AT, p),
    reveal: smooth(PLANET_END, MOUTH_AT - 0.015, p),
    inside: smooth(MOUTH_AT - 0.012, MOUTH_AT + 0.012, p),
    turbulence:
      smooth(MOUTH_AT, MOUTH_AT + 0.03, p) * (1 - smooth(TUNNEL_END - 0.02, TUNNEL_END, p)),
    calm: smooth(TUNNEL_END - 0.01, CALM_END, p),
    still: smooth(CALM_END, DEPARTURE_END - 0.02, p),
    fall: smooth(FALL_START, 1, q),
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
// The first line rides the departure; the others keep their place on the black hole's own
// timeline (q).
const BEAT_RANGES_Q: readonly (readonly [number, number])[] = [
  [0.24, 0.48],
  [0.48, 0.7],
  [0.86, 1.01],
];
export const BEAT_RANGES: readonly (readonly [number, number])[] = [
  [0, TUNNEL_END - 0.01],
  ...BEAT_RANGES_Q.map(([a, b]) => [atQ(a), atQ(b)] as const),
];

export function beatAt(p: number): number {
  return BEAT_RANGES.findIndex(([from, to]) => p >= from && p < to);
}
