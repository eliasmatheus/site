import { describe, expect, it } from 'vitest';
import { createWheelGestures, crossedStop, glideEase, glideMs, stopFor } from './pacing';

const zones = [[1000, 1300, 1600, 1900]];

describe('stopFor', () => {
  it('moves one stop per gesture inside a zone, however big the scroll', () => {
    expect(stopFor(zones, 1000, 40)).toBe(1300);
    expect(stopFor(zones, 1300, 5000)).toBe(1600);
    expect(stopFor(zones, 1600, -900)).toBe(1300);
  });

  it('lands on the next stop from between two stops', () => {
    expect(stopFor(zones, 1450, 10)).toBe(1600);
    expect(stopFor(zones, 1450, -10)).toBe(1300);
  });

  it('lets the browser scroll out past the ends', () => {
    expect(stopFor(zones, 1900, 100)).toBeUndefined();
    expect(stopFor(zones, 1000, -100)).toBeUndefined();
  });

  it('catches a scroll that would jump into or across a zone', () => {
    expect(stopFor(zones, 900, 50)).toBeUndefined();
    expect(stopFor(zones, 900, 150)).toBe(1000);
    expect(stopFor(zones, 800, 3000)).toBe(1000);
    expect(stopFor(zones, 2100, -400)).toBe(1900);
  });

  it('does nothing without a delta or without zones', () => {
    expect(stopFor(zones, 1300, 0)).toBeUndefined();
    expect(stopFor([], 1300, 100)).toBeUndefined();
  });
});

describe('crossedStop', () => {
  it('finds the first stop a native scroll passed, in its direction', () => {
    expect(crossedStop(zones, 700, 1450)).toBe(1000);
    expect(crossedStop(zones, 1310, 1700)).toBe(1600);
    expect(crossedStop(zones, 2400, 1500)).toBe(1900);
    expect(crossedStop(zones, 1000, 1200)).toBeUndefined();
  });
});

describe('glide', () => {
  it('is quick for a hop and capped for a long way', () => {
    expect(glideMs(100)).toBe(550);
    expect(glideMs(-500)).toBe(800);
    expect(glideMs(4000)).toBe(1100);
  });

  it('eases from 0 to 1', () => {
    expect(glideEase(0)).toBe(0);
    expect(glideEase(0.5)).toBeCloseTo(0.5);
    expect(glideEase(1)).toBe(1);
  });
});

describe('wheel gestures', () => {
  it('reads a trackpad flick and its momentum tail as one gesture', () => {
    const fresh = createWheelGestures();
    const deltas = [8, 30, 60, 55, 40, 30, 22, 15, 10, 6, 4, 2, 1];
    const starts = deltas.map((d, i) => fresh(d, i * 16));
    expect(starts.filter(Boolean)).toHaveLength(1);
  });

  it('starts a new gesture after a pause, a flip or a fresh push over the tail', () => {
    const fresh = createWheelGestures();
    expect(fresh(50, 0)).toBe(true);
    expect(fresh(40, 16)).toBe(false);
    expect(fresh(30, 400)).toBe(true);
    expect(fresh(-30, 416)).toBe(true);
    const tail = createWheelGestures();
    [40, 20, 10, 6, 4].forEach((d, i) => tail(d, i * 16));
    expect(tail(40, 96)).toBe(true);
  });
});
