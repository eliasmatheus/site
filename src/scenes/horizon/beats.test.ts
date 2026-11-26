import { describe, expect, it } from 'vitest';
import {
  ALERT_AT,
  ARRIVE_END,
  beatAt,
  FALL_START,
  horizonFrame,
  instruments,
  WARP_END,
} from './beats';

describe('horizonFrame', () => {
  it('starts inside the wormhole and leaves it with a hard stop', () => {
    expect(horizonFrame(0, 1.6).warp).toBe(1);
    expect(horizonFrame(WARP_END - 0.03, 1.6).warp).toBe(1);
    expect(horizonFrame(WARP_END, 1.6).warp).toBe(0);
  });

  it('arrives at the Off-axis view, then dives to the center', () => {
    const off = horizonFrame(ARRIVE_END, 1.6);
    expect(off.dist).toBeCloseTo(15);
    expect(off.sx).toBeGreaterThan(0.2);
    const end = horizonFrame(1, 1.6);
    expect(end.dist).toBeCloseTo(2.4);
    expect(end.sx).toBeCloseTo(0);
  });

  it('only gets closer once the dive starts', () => {
    let last = Infinity;
    for (let p = ARRIVE_END; p <= 1; p += 0.01) {
      const d = horizonFrame(p, 1.6).dist;
      expect(d).toBeLessThanOrEqual(last + 1e-9);
      last = d;
    }
  });

  it('keeps the hole on screen on a phone: less shift, a farther camera', () => {
    const desk = horizonFrame(ARRIVE_END, 1.6);
    const phone = horizonFrame(ARRIVE_END, 390 / 844);
    expect(phone.sx).toBeLessThan(desk.sx);
    expect(phone.dist).toBeGreaterThan(desk.dist);
  });

  it('falls only after FALL_START', () => {
    expect(horizonFrame(FALL_START, 1.6).fall).toBe(0);
    expect(horizonFrame(1, 1.6).fall).toBe(1);
  });
});

describe('instruments', () => {
  it('lose the hull and raise every alert by the end of the fall', () => {
    const start = instruments(horizonFrame(FALL_START, 1.6));
    expect(start.hull).toBe(100);
    expect(start.alerts).toBe(0);
    const end = instruments(horizonFrame(1, 1.6));
    expect(end.hull).toBeLessThan(10);
    expect(end.alerts).toBe(ALERT_AT.length);
  });

  it('slow time down near the hole', () => {
    const far = instruments(horizonFrame(ARRIVE_END, 1.6));
    const near = instruments(horizonFrame(1, 1.6));
    expect(near.dilation).toBeLessThan(far.dilation);
    expect(near.dilation).toBeGreaterThan(0);
  });
});

describe('beatAt', () => {
  it('shows one line at a time, and none in the gaps', () => {
    expect(beatAt(0)).toBe(0);
    expect(beatAt(0.3)).toBe(1);
    expect(beatAt(0.6)).toBe(2);
    expect(beatAt(0.8)).toBe(-1);
    expect(beatAt(0.95)).toBe(3);
  });
});
