/**
 * Exposure model for the Prologue camera. Pure functions, no DOM.
 * Values come from the prototype (docs/modelos.md#exposição).
 */

export const ISO = [160, 200, 400, 800, 1600, 3200, 6400, 12800] as const;
/** Shutter speeds as the denominator x of 1/x s. */
export const SHUTTER = [4000, 2000, 1000, 500, 250, 125, 60, 30, 15, 8] as const;
export const APERTURE = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16] as const;

export interface FilmSimulation {
  /** Short code printed on the film dial. */
  s: string;
  name: string;
  /** CSS filter applied to the image only (never to the camera body). */
  filter: string;
}

export const FILMS: readonly FilmSimulation[] = [
  { s: 'STD', name: 'PROVIA', filter: 'saturate(1.05)' },
  { s: 'V', name: 'VELVIA', filter: 'saturate(1.6) contrast(1.12)' },
  { s: 'S', name: 'ASTIA', filter: 'saturate(.95) contrast(.92) brightness(1.03)' },
  { s: 'CC', name: 'CLASSIC CHROME', filter: 'saturate(.7) contrast(1.1) sepia(.12)' },
  {
    s: 'NC',
    name: 'CLASSIC NEG',
    filter: 'saturate(.8) contrast(1.15) sepia(.1) hue-rotate(-8deg)',
  },
  { s: 'ET', name: 'ETERNA', filter: 'saturate(.72) contrast(.85) brightness(1.04)' },
  { s: 'A', name: 'ACROS', filter: 'grayscale(1) contrast(1.2)' },
];

/** Grain amount per ISO index. */
export const NOISE = [0, 0.02, 0.04, 0.07, 0.1, 0.14, 0.2, 0.28] as const;

/** Scene light: 0 with good light, -3 after the sun goes down (Prologue beat 3). */
export const SCENE_EV_GOOD = 0;
export const SCENE_EV_DUSK = -3;

/** Indices into ISO, SHUTTER, APERTURE and FILMS. */
export interface CameraSettings {
  iso: number;
  shutter: number;
  aperture: number;
  film: number;
}

/** ISO 400, 1/250, f/5.6, CLASSIC CHROME: correct in good light, 3 EV dark at dusk. */
export const INITIAL_SETTINGS: CameraSettings = { iso: 2, shutter: 4, aperture: 4, film: 3 };
/** ISO 1600, 1/125, f/5.6: ev = 0 at dusk. Film is kept as the user chose. */
export const AUTO_SETTINGS: Omit<CameraSettings, 'film'> = { iso: 4, shutter: 5, aperture: 4 };

export const GOOD_EV_TOLERANCE = 0.5;

export type DialKey = keyof CameraSettings;

const DIAL_LENGTH: Record<DialKey, number> = {
  iso: ISO.length,
  shutter: SHUTTER.length,
  aperture: APERTURE.length,
  film: FILMS.length,
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Moves a dial one or more stops. Film wraps around; the others stop at the ends. */
export function stepDial(settings: CameraSettings, key: DialKey, delta: number): CameraSettings {
  const n = DIAL_LENGTH[key];
  const next =
    key === 'film'
      ? (((settings[key] + delta) % n) + n) % n
      : clamp(settings[key] + delta, 0, n - 1);
  return { ...settings, [key]: next };
}

export function exposureValue(settings: CameraSettings, sceneEv: number): number {
  const iso = ISO[settings.iso] ?? 400;
  const shutter = SHUTTER[settings.shutter] ?? 250;
  const aperture = APERTURE[settings.aperture] ?? 5.6;
  return Math.log2(iso / 400) + Math.log2(250 / shutter) - 2 * Math.log2(aperture / 5.6) + sceneEv;
}

export interface ExposureEffect {
  ev: number;
  /** ev rounded to 1/3 stop, as shown on the meter. */
  evRounded: number;
  /** "+1.0 EV", "-3.0 EV", "±0.0 EV". */
  evLabel: string;
  brightness: number;
  contrast: number;
  /** Opacity of the wash layer over the image. */
  wash: number;
  washColor: '#f6f1e7' | '#160a02';
  noise: number;
  /** CSS filter for the image: film simulation plus brightness and contrast. */
  filter: string;
  good: boolean;
}

export function formatEv(evRounded: number): string {
  // Avoid "-0.0" for tiny negative values.
  const v = Object.is(evRounded, -0) || Math.abs(evRounded) < 1e-9 ? 0 : evRounded;
  const sign = v > 0 ? '+' : v < 0 ? '' : '±';
  return `${sign}${v.toFixed(1)} EV`;
}

export function computeExposure(settings: CameraSettings, sceneEv: number): ExposureEffect {
  const ev = exposureValue(settings, sceneEv);
  const evRounded = Math.round(ev * 3) / 3;
  const brightness = clamp(2 ** (ev * 0.25), 0.35, 2.2);
  const contrast = ev > 0 ? 1 - Math.min(ev, 5) * 0.06 : 1 + Math.min(-ev, 5) * 0.05;
  const film = FILMS[settings.film] ?? FILMS[0];
  return {
    ev,
    evRounded,
    evLabel: formatEv(evRounded),
    brightness,
    contrast,
    wash: ev > 0 ? Math.min(0.6, ev * 0.17) : Math.min(0.75, -ev * 0.22),
    washColor: ev > 0 ? '#f6f1e7' : '#160a02',
    noise: NOISE[settings.iso] ?? 0,
    filter: `${film?.filter ?? ''} brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)})`,
    good: Math.abs(ev) <= GOOD_EV_TOLERANCE,
  };
}

/** The Prologue quest is done when the sun has gone down and the exposure is good. */
export function isExposureQuestDone(settings: CameraSettings, sunDown: boolean): boolean {
  return sunDown && computeExposure(settings, SCENE_EV_DUSK).good;
}
