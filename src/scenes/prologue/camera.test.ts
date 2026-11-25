import { describe, expect, it } from 'vitest';
import { AUTO_SETTINGS, INITIAL_SETTINGS } from '../../models/exposure';
import { dialDisplay, dialRotation, DIALS, exposureView, scenePhase } from './camera';

describe('scenePhase', () => {
  it('stays on the viewfinder until 28% of the dwell', () => {
    expect(scenePhase(0)).toEqual({ a: 0, phase: 0 });
    expect(scenePhase(0.28)).toEqual({ a: 0, phase: 0 });
  });

  it('eases in and lands on the camera at 62%', () => {
    const mid = scenePhase(0.45);
    expect(mid.a).toBeCloseTo(0.5, 1);
    expect(mid.phase).toBe(1);
    expect(scenePhase(0.62)).toEqual({ a: 1, phase: 2 });
    expect(scenePhase(1)).toEqual({ a: 1, phase: 2 });
  });
});

describe('dials', () => {
  it('has one tick per stop', () => {
    expect(DIALS.iso.ticks).toHaveLength(8);
    expect(DIALS.shutter.ticks).toEqual([
      '4K',
      '2K',
      '1K',
      '500',
      '250',
      '125',
      '60',
      '30',
      '15',
      '8',
    ]);
    expect(DIALS.film.ticks).toEqual(['STD', 'V', 'S', 'CC', 'NC', 'ET', 'A']);
  });

  it('shortens long film names under the dial', () => {
    expect(dialDisplay('film', 3)).toBe('CL. CHROME');
    expect(dialDisplay('film', 0)).toBe('PROVIA');
    expect(dialDisplay('shutter', 4)).toBe('1/250');
  });

  it('turns the ring so the current stop is at the top', () => {
    expect(dialRotation(0)).toBe(-0);
    expect(dialRotation(3)).toBe(-90);
  });
});

describe('exposureView', () => {
  it('is perfect on arrival', () => {
    const v = exposureView(INITIAL_SETTINGS, false);
    expect(v.tone).toBe('good');
    expect(v.kicker).toBe('GOLDEN HOUR');
    expect(v.status).toBe('PERFECT · ±0.0 EV');
    expect(v.exif).toBe('ISO 400 · 1/250 · F5.6 · CLASSIC CHROME');
    expect(v.meter).toBe(50);
    expect(v.done).toBe(false);
  });

  it('goes 3 EV dark when the sun goes down', () => {
    const v = exposureView(INITIAL_SETTINGS, true);
    expect(v.tone).toBe('under');
    expect(v.status).toBe('UNDEREXPOSED · -3.0 EV');
    expect(v.kicker).toBe('GOLDEN HOUR · THE LIGHT IS DROPPING');
    expect(v.meter).toBe(0);
  });

  it('AUTO fixes the exposure and completes the quest', () => {
    const v = exposureView({ ...INITIAL_SETTINGS, ...AUTO_SETTINGS }, true);
    expect(v.tone).toBe('good');
    expect(v.kicker).toBe('GOLDEN HOUR · NICELY EXPOSED');
    expect(v.done).toBe(true);
  });

  it('reports too much light', () => {
    const v = exposureView({ ...INITIAL_SETTINGS, iso: 7 }, false);
    expect(v.tone).toBe('over');
    expect(v.kicker).toBe('EXPOSURE · TOO MUCH LIGHT');
    expect(v.meter).toBe(100);
  });
});
