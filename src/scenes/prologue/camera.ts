/**
 * Prologue camera: what the dials, the meter and the scene phase look like for a given
 * state. Pure, no DOM. The exposure math lives in src/models/exposure.ts.
 */
import { prologue } from '../../content/prologue';
import {
  APERTURE,
  computeExposure,
  FILMS,
  ISO,
  SCENE_EV_DUSK,
  SCENE_EV_GOOD,
  SHUTTER,
  type CameraSettings,
  type DialKey,
  type ExposureEffect,
} from '../../models/exposure';

/** Degrees between two ticks on a round dial. */
export const TICK_DEG = 30;

export interface DialSpec {
  key: DialKey;
  label: 'ISO' | 'SHUTTER' | 'APERTURE' | 'FILM';
  /** Text printed on the dial for each stop. */
  ticks: readonly string[];
  /** Full value for screen readers and the label under the dial. */
  values: readonly string[];
}

const kilo = (v: number): string => (v >= 1000 ? `${v / 1000}K` : String(v));
const ISO_TICKS = ['160', '200', '400', '800', '1.6K', '3.2K', '6.4K', '12K'] as const;

export const DIALS: Record<DialKey, DialSpec> = {
  iso: { key: 'iso', label: 'ISO', ticks: ISO_TICKS, values: ISO.map(String) },
  shutter: {
    key: 'shutter',
    label: 'SHUTTER',
    ticks: SHUTTER.map(kilo),
    values: SHUTTER.map((v) => `1/${v}`),
  },
  aperture: {
    key: 'aperture',
    label: 'APERTURE',
    ticks: APERTURE.map((v) => `f/${v}`),
    values: APERTURE.map((v) => `f/${v}`),
  },
  film: {
    key: 'film',
    label: 'FILM',
    ticks: FILMS.map((f) => f.s),
    values: FILMS.map((f) => f.name),
  },
};

/** Label under a dial: long film names shorten 'CLASSIC ' to 'CL. '. */
export function dialDisplay(key: DialKey, index: number): string {
  const value = DIALS[key].values[index] ?? '';
  if (key === 'film' && value.length > 11) {
    return value.replace('CLASSIC ', prologue.camera.filmShortPrefix);
  }
  return value;
}

/** Ring rotation so the current stop sits under the index mark at the top. */
export function dialRotation(index: number): number {
  return -index * TICK_DEG;
}

export interface ScenePhase {
  /** 0 = eye on the viewfinder, 1 = looking at the camera from above. Eased. */
  a: number;
  /** 0 viewfinder, 1 camera coming in, 2 camera in place (the sun goes down). */
  phase: 0 | 1 | 2;
}

/** Dwell progress to the look-up animation. From the prototype: eased between 28% and 62%. */
export function scenePhase(progress: number): ScenePhase {
  const t = Math.min(1, Math.max(0, (progress - 0.28) / 0.34));
  const a = t * t * (3 - 2 * t);
  return { a, phase: a < 0.3 ? 0 : a < 0.85 ? 1 : 2 };
}

export type ExposureTone = 'good' | 'over' | 'under';

export interface ExposureView {
  fx: ExposureEffect;
  tone: ExposureTone;
  kicker: string;
  status: string;
  exif: string;
  /** Meter needle position, 0 to 100 (%), clamped to ±3 EV. */
  meter: number;
  /** The quest is done: the sun went down and the exposure is good. */
  done: boolean;
}

export function exposureView(settings: CameraSettings, sunDown: boolean): ExposureView {
  const fx = computeExposure(settings, sunDown ? SCENE_EV_DUSK : SCENE_EV_GOOD);
  const tone: ExposureTone = fx.good ? 'good' : fx.ev > 0 ? 'over' : 'under';
  const k = prologue.exposure.kicker;
  const kicker =
    tone === 'good' ? (sunDown ? k.goodLit : k.good) : tone === 'over' ? k.over : k.under;
  const s = prologue.exposure.status;
  const status =
    tone === 'good'
      ? s.perfect(fx.evLabel)
      : tone === 'over'
        ? s.over(fx.evLabel)
        : s.under(fx.evLabel);
  const clamped = Math.max(-3, Math.min(3, fx.evRounded));
  const film = FILMS[settings.film]?.name ?? '';
  return {
    fx,
    tone,
    kicker,
    status,
    exif: prologue.viewfinder.exif(
      ISO[settings.iso] ?? 400,
      SHUTTER[settings.shutter] ?? 250,
      APERTURE[settings.aperture] ?? 5.6,
      film,
    ),
    meter: ((clamped + 3) / 6) * 100,
    done: sunDown && fx.good,
  };
}

/** Panorama yaw in px for a mouse at `mx` (0 to 1 across the viewfinder). */
export function yawForPointer(base: number, mx: number, height: number): number {
  // The panorama is drawn at 125% of the height and is 4:1, so one turn is 5 heights.
  return base - (mx - 0.5) * 5 * height;
}

/** Starting yaw that frames the sun in the viewfinder (from the prototype). */
export function initialYaw(width: number, height: number): number {
  return 0.62 * width - 1.5 * height;
}
