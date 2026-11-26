import { describe, expect, it } from 'vitest';
import { POINTER_TILT, SECTION_VIEW, stepView, viewTarget, type View } from './view';

describe('viewTarget', () => {
  it('looks at each section in order, left to right', () => {
    const xs = ['about', 'experience', 'projects', 'door'].map((s) => viewTarget(s, null));
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(4);
  });

  it('falls back to the first spot for unknown or missing sections', () => {
    expect(viewTarget(null, null)).toBe(SECTION_VIEW['about']);
    expect(viewTarget('nope', null)).toBe(SECTION_VIEW['about']);
  });

  it('lets the pointer tilt the view only a little, and stays inside the panorama', () => {
    const base = viewTarget('experience', null);
    expect(viewTarget('experience', 1) - base).toBeCloseTo(POINTER_TILT);
    expect(base - viewTarget('experience', 0)).toBeCloseTo(POINTER_TILT);
    expect(viewTarget('door', 1)).toBeLessThanOrEqual(1);
  });
});

describe('stepView', () => {
  const run = (view: View, target: number, seconds: number): View => {
    let v = view;
    for (let t = 0; t < seconds; t += 1 / 60) v = stepView(v, target, 1 / 60);
    return v;
  };

  it('arrives at the target without overshooting', () => {
    let v: View = { x: 0.2, glow: 0 };
    for (let i = 0; i < 600; i++) {
      v = stepView(v, 0.7, 1 / 60);
      expect(v.x).toBeLessThanOrEqual(0.7);
    }
    expect(v.x).toBeCloseTo(0.7, 3);
  });

  it('glows while moving and dims again at rest', () => {
    const moving = run({ x: 0.2, glow: 0 }, 0.7, 0.4);
    expect(moving.glow).toBeGreaterThan(0.2);
    const rested = run(moving, 0.7, 6);
    expect(rested.glow).toBeLessThan(0.01);
  });

  it('does not glow when already there', () => {
    expect(run({ x: 0.5, glow: 0 }, 0.5, 2).glow).toBe(0);
  });
});
