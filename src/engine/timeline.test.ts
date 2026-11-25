import { describe, expect, it } from 'vitest';
import {
  activeIndex,
  cameraAt,
  createTimeline,
  ease,
  journeyProgress,
  locate,
  sceneProgress,
  scrollForScene,
} from './timeline';

const scenes = [
  { id: 'a', dwell: 1000, x: 0, y: 0 },
  { id: 'b', dwell: 2000, x: 400, y: -100 },
  { id: 'c', dwell: 500, x: -200, y: 50 },
];
const tl = createTimeline(scenes, { travel: 1000, zStep: 3000 });

describe('createTimeline', () => {
  it('lays dwells and flights end to end', () => {
    expect(tl.starts).toEqual([0, 2000, 5000]);
    expect(tl.length).toBe(5500);
  });

  it('refuses an empty journey', () => {
    expect(() => createTimeline([])).toThrow();
  });
});

describe('locate', () => {
  it('rests on a scene during its dwell', () => {
    expect(locate(tl, 0)).toEqual({ f: 0, index: 0, progress: 0, travelling: false });
    expect(locate(tl, 500)).toEqual({ f: 0, index: 0, progress: 0.5, travelling: false });
    expect(locate(tl, 3000)).toMatchObject({ f: 1, index: 1, progress: 0.5 });
  });

  it('flies between scenes with easing', () => {
    const mid = locate(tl, 1500);
    expect(mid.travelling).toBe(true);
    expect(mid.index).toBe(0);
    expect(mid.progress).toBe(1);
    expect(mid.f).toBeCloseTo(0.5);
    expect(locate(tl, 1250).f).toBeCloseTo(ease(0.25));
    expect(locate(tl, 1999.999).f).toBeCloseTo(1, 3);
  });

  it('arrives exactly on the next scene', () => {
    expect(locate(tl, 2000)).toMatchObject({ f: 1, index: 1, progress: 0, travelling: false });
  });

  it('clamps before the start and after the end', () => {
    expect(locate(tl, -300)).toMatchObject({ f: 0, progress: 0 });
    expect(locate(tl, 99999)).toMatchObject({ f: 2, index: 2, progress: 1, travelling: false });
  });

  it('is monotonic', () => {
    let last = -1;
    for (let y = 0; y <= tl.length; y += 37) {
      const f = locate(tl, y).f;
      expect(f).toBeGreaterThanOrEqual(last);
      last = f;
    }
  });
});

describe('progress and active scene', () => {
  it('gives each scene its own progress', () => {
    expect(sceneProgress(tl, 3000, 0)).toBe(1);
    expect(sceneProgress(tl, 3000, 1)).toBe(0.5);
    expect(sceneProgress(tl, 3000, 2)).toBe(0);
    expect(sceneProgress(tl, 3000, 9)).toBe(0);
  });

  it('switches the active scene halfway through a flight', () => {
    expect(activeIndex(locate(tl, 1400).f)).toBe(0);
    expect(activeIndex(locate(tl, 1600).f)).toBe(1);
  });

  it('reports journey progress for the header bar', () => {
    expect(journeyProgress(tl, 0)).toBe(0);
    expect(journeyProgress(tl, 1)).toBe(0.5);
    expect(journeyProgress(tl, 2)).toBe(1);
  });

  it('maps anchors to the start of each dwell', () => {
    expect(scrollForScene(tl, 1)).toBe(2000);
    expect(locate(tl, scrollForScene(tl, 2)).index).toBe(2);
  });
});

describe('camera', () => {
  it('sits on each scene and interpolates between them', () => {
    expect(cameraAt(tl, 1)).toEqual({ x: 400, y: -100, z: 3000 });
    expect(cameraAt(tl, 0.5)).toEqual({ x: 200, y: -50, z: 1500 });
    expect(cameraAt(tl, 2)).toEqual({ x: -200, y: 50, z: 6000 });
  });
});
