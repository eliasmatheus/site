import { describe, expect, it } from 'vitest';
import { createFollow } from './follow';

const run = (rate: number, target: number, seconds: number, fps = 60): number[] => {
  const f = createFollow(rate);
  const out: number[] = [];
  for (let t = 0; t < seconds; t += 1 / fps) out.push(f.step(target, 1 / fps));
  return out;
};

describe('follow', () => {
  it('eases in: the first steps are smaller than the middle ones', () => {
    const xs = run(4.5, 1, 1.5);
    const first = (xs[1] ?? 0) - (xs[0] ?? 0);
    const middle = (xs[20] ?? 0) - (xs[19] ?? 0);
    expect(first).toBeLessThan(middle);
  });

  it('eases out and never overshoots', () => {
    const xs = run(4.5, 1, 3);
    expect(Math.max(...xs)).toBeLessThanOrEqual(1);
    expect(xs.at(-1)).toBeCloseTo(1, 3);
    const late = (xs.at(-1) ?? 0) - (xs.at(-2) ?? 0);
    expect(late).toBeLessThan(0.001);
  });

  it('lands on the target and stops', () => {
    const f = createFollow(6);
    for (let i = 0; i < 600; i++) f.step(0.5, 1 / 60);
    expect(f.value).toBe(0.5);
    expect(f.moving(0.5)).toBe(false);
  });

  it('stays stable on a very slow frame', () => {
    const f = createFollow(6);
    f.step(1, 2);
    expect(f.value).toBeGreaterThan(0);
    expect(f.value).toBeLessThanOrEqual(1);
  });

  it('never goes faster than maxSpeed', () => {
    const f = createFollow(8);
    let last = 0;
    for (let i = 0; i < 60; i++) {
      const x = f.step(1, 1 / 60, 0.5);
      expect(x - last).toBeLessThanOrEqual(0.5 / 60 + 1e-9);
      last = x;
    }
    expect(f.value).toBeLessThan(0.51);
  });

  it('snaps', () => {
    const f = createFollow();
    f.snap(0.7);
    expect(f.value).toBe(0.7);
    expect(f.speed).toBe(0);
  });
});
