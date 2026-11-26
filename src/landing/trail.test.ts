import { describe, expect, it } from 'vitest';
import {
  fadeTrail,
  FADE_PER_SECOND,
  isIdle,
  lightMask,
  pushPoint,
  TRAIL_SIZE,
  wanderer,
  type TrailPoint,
} from './trail';

describe('pushPoint', () => {
  it('puts the newest point first and keeps the trail bounded', () => {
    const trail: TrailPoint[] = [];
    for (let i = 0; i < TRAIL_SIZE + 5; i++) pushPoint(trail, { x: i, y: 0, s: 1 });
    expect(trail).toHaveLength(TRAIL_SIZE);
    expect(trail[0]?.x).toBe(TRAIL_SIZE + 4);
  });
});

describe('fadeTrail', () => {
  it('fades a fresh point out in 1 / FADE_PER_SECOND seconds and never below zero', () => {
    const trail = [{ x: 0, y: 0, s: 1 }];
    fadeTrail(trail, 1);
    expect(trail[0]?.s).toBeCloseTo(1 - FADE_PER_SECOND);
    fadeTrail(trail, 10);
    expect(trail[0]?.s).toBe(0);
  });
});

describe('isIdle', () => {
  it('is idle when empty or when every point has faded', () => {
    expect(isIdle([])).toBe(true);
    expect(isIdle([{ x: 0, y: 0, s: 0.01 }])).toBe(true);
    expect(isIdle([{ x: 0, y: 0, s: 0.5 }])).toBe(false);
  });
});

describe('wanderer', () => {
  it('stays inside the screen', () => {
    for (let t = 0; t < 600; t += 7) {
      const { x, y } = wanderer(t, 390, 844);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(390);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(844);
    }
  });
});

describe('lightMask', () => {
  it('lights one spot per visible point, shifted into the panned canvas', () => {
    const mask = lightMask(
      [
        { x: 100, y: 50, s: 1 },
        { x: 0, y: 0, s: 0 },
      ],
      400,
    );
    expect(mask.match(/radial-gradient/g)).toHaveLength(1);
    expect(mask).toContain('at 500.0px 50.0px');
  });

  it('masks everything out when the trail is gone', () => {
    expect(lightMask([], 0)).not.toContain('radial-gradient');
  });
});
