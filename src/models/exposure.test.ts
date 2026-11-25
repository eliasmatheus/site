import { describe, expect, it } from 'vitest';
import {
  AUTO_SETTINGS,
  computeExposure,
  exposureValue,
  formatEv,
  INITIAL_SETTINGS,
  isExposureQuestDone,
  SCENE_EV_DUSK,
  SCENE_EV_GOOD,
  stepDial,
} from './exposure';

const auto = { ...INITIAL_SETTINGS, ...AUTO_SETTINGS };

describe('exposure', () => {
  it('initial settings are correct in good light and 3 EV dark at dusk', () => {
    expect(exposureValue(INITIAL_SETTINGS, SCENE_EV_GOOD)).toBeCloseTo(0);
    expect(exposureValue(INITIAL_SETTINGS, SCENE_EV_DUSK)).toBeCloseTo(-3);
    expect(computeExposure(INITIAL_SETTINGS, SCENE_EV_GOOD).good).toBe(true);
    expect(computeExposure(INITIAL_SETTINGS, SCENE_EV_DUSK).good).toBe(false);
  });

  it('AUTO gives ev = 0 at dusk and solves the quest', () => {
    expect(exposureValue(auto, SCENE_EV_DUSK)).toBeCloseTo(0);
    expect(isExposureQuestDone(auto, true)).toBe(true);
  });

  it('the quest needs the sun to be down', () => {
    expect(isExposureQuestDone(INITIAL_SETTINGS, false)).toBe(false);
  });

  it('each stop moves ev by the right amount', () => {
    const base = exposureValue(INITIAL_SETTINGS, 0);
    expect(exposureValue(stepDial(INITIAL_SETTINGS, 'iso', 1), 0) - base).toBeCloseTo(1);
    expect(exposureValue(stepDial(INITIAL_SETTINGS, 'shutter', 1), 0) - base).toBeCloseTo(1);
    // f/5.6 -> f/8 closes one stop.
    expect(exposureValue(stepDial(INITIAL_SETTINGS, 'aperture', 1), 0) - base).toBeCloseTo(-1, 1);
  });

  it('matches the formula for brightness, contrast, wash and noise', () => {
    const over = computeExposure({ iso: 7, shutter: 9, aperture: 0, film: 0 }, 0);
    expect(over.ev).toBeGreaterThan(5);
    expect(over.brightness).toBe(2.2);
    expect(over.contrast).toBeCloseTo(1 - 5 * 0.06);
    expect(over.wash).toBe(0.6);
    expect(over.washColor).toBe('#f6f1e7');
    expect(over.noise).toBe(0.28);

    const dark = computeExposure(INITIAL_SETTINGS, SCENE_EV_DUSK);
    expect(dark.brightness).toBeCloseTo(2 ** -0.75);
    expect(dark.contrast).toBeCloseTo(1.15);
    expect(dark.wash).toBeCloseTo(0.66);
    expect(dark.washColor).toBe('#160a02');
    expect(dark.noise).toBe(0.04);
    expect(dark.filter).toContain('sepia(.12)');
  });

  it('clamps brightness at the bottom', () => {
    const veryDark = computeExposure({ iso: 0, shutter: 0, aperture: 7, film: 0 }, SCENE_EV_DUSK);
    expect(veryDark.brightness).toBe(0.35);
    expect(veryDark.wash).toBe(0.75);
  });

  it('good means |ev| <= 0.5', () => {
    expect(computeExposure(INITIAL_SETTINGS, 0.5).good).toBe(true);
    expect(computeExposure(INITIAL_SETTINGS, 0.51).good).toBe(false);
  });

  it('film wraps, other dials stop at the ends', () => {
    expect(stepDial(INITIAL_SETTINGS, 'film', 4).film).toBe(0);
    expect(stepDial(INITIAL_SETTINGS, 'film', -4).film).toBe(6);
    expect(stepDial(INITIAL_SETTINGS, 'iso', 99).iso).toBe(7);
    expect(stepDial(INITIAL_SETTINGS, 'shutter', -99).shutter).toBe(0);
  });

  it('formats ev labels', () => {
    expect(formatEv(0)).toBe('±0.0 EV');
    expect(formatEv(-0)).toBe('±0.0 EV');
    expect(formatEv(1)).toBe('+1.0 EV');
    expect(formatEv(-3)).toBe('-3.0 EV');
  });
});
