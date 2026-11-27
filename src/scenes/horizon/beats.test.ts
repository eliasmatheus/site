import { describe, expect, it } from 'vitest';
import {
  ALERT_AT,
  ARRIVE_END as ARRIVE_Q,
  atQ,
  beatAt,
  CALM_END,
  DAWN_END,
  DEPARTURE_END,
  FALL_START as FALL_Q,
  horizonFrame,
  instruments,
  MOUTH_AT,
  PAN_END,
  PLANET_END,
  TITLE_AT,
  TUNNEL_END,
} from './beats';

const ARRIVE_END = atQ(ARRIVE_Q);
const FALL_START = atQ(FALL_Q);

describe('the departure', () => {
  it('starts in the dark, then the stars, then the planet', () => {
    const start = horizonFrame(0, 1.6);
    expect(start.dawn).toBe(0);
    expect(horizonFrame(DAWN_END, 1.6).dawn).toBe(1);
    expect(horizonFrame(PAN_END, 1.6).planet).toBe(1);
  });

  it('opens on the ringed planet, then the wormhole, then the tunnel', () => {
    const start = horizonFrame(0, 1.6);
    expect(start.inside).toBe(0);
    expect(horizonFrame(PAN_END, 1.6).pan).toBe(1);
    expect(horizonFrame(PAN_END, 1.6).zoom).toBe(0);
    expect(horizonFrame(PLANET_END, 1.6).zoom).toBe(1);
    expect(horizonFrame(PLANET_END + 0.02, 1.6).planet).toBe(0);
    expect(horizonFrame(MOUTH_AT + 0.02, 1.6).inside).toBe(1);
  });

  it('reveals the wormhole a little at a time', () => {
    let last = -1;
    for (let p = PLANET_END; p <= MOUTH_AT; p += 0.005) {
      const r = horizonFrame(p, 1.6).reveal;
      expect(r).toBeGreaterThanOrEqual(last);
      last = r;
    }
    expect(last).toBe(1);
  });

  it('shakes only in the tunnel, then calms and stills', () => {
    expect(horizonFrame(PLANET_END, 1.6).turbulence).toBe(0);
    expect(horizonFrame((MOUTH_AT + TUNNEL_END) / 2, 1.6).turbulence).toBe(1);
    expect(horizonFrame(CALM_END, 1.6).turbulence).toBe(0);
    expect(horizonFrame(CALM_END, 1.6).calm).toBe(1);
    expect(horizonFrame(DEPARTURE_END, 1.6).still).toBe(1);
  });

  it('shows the black hole only after the departure', () => {
    expect(horizonFrame(DEPARTURE_END - 0.03, 1.6).warp).toBe(1);
    expect(horizonFrame(DEPARTURE_END, 1.6).warp).toBe(0);
  });
});

describe('horizonFrame', () => {
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
    expect(beatAt(TITLE_AT)).toBe(0);
    expect(beatAt(CALM_END)).toBe(-1);
    expect(beatAt(atQ(0.3))).toBe(1);
    expect(beatAt(atQ(0.6))).toBe(2);
    expect(beatAt(atQ(0.8))).toBe(-1);
    expect(beatAt(atQ(0.95))).toBe(3);
  });
});
