import { describe, expect, it } from 'vitest';
import { layerStyle } from './layers';
import { createTimeline } from './timeline';

const tl = createTimeline(
  [
    { id: 'a', dwell: 1000, x: 0, y: 0 },
    { id: 'b', dwell: 1000, x: 400, y: -100 },
    { id: 'c', dwell: 1000, x: 0, y: 0 },
  ],
  { travel: 1000, zStep: 3000 },
);

describe('fly mode', () => {
  it('the resting scene has no transform and takes clicks', () => {
    const s = layerStyle(tl, 1, 1, 'fly');
    expect(s).toMatchObject({
      visible: true,
      opacity: 1,
      transform: 'none',
      interactive: true,
      radius: 0,
    });
  });

  it('the next scene waits in depth, visible but not clickable', () => {
    const s = layerStyle(tl, 0, 1, 'fly');
    expect(s.visible).toBe(true);
    expect(s.transform).toBe('translate3d(400px, -100px, -3000px)');
    expect(s.interactive).toBe(false);
    expect(s.radius).toBe(28);
  });

  it('far scenes are hidden', () => {
    expect(layerStyle(tl, 0, 2, 'fly').visible).toBe(false);
  });

  it('a passed scene fades out as it crosses the camera', () => {
    expect(layerStyle(tl, 1.1, 1, 'fly').opacity).toBeCloseTo(1 - 300 / 700, 3);
    expect(layerStyle(tl, 1.3, 1, 'fly').visible).toBe(false);
  });

  it('there is never an empty frame during a flight', () => {
    for (let f = 0; f <= 2; f += 0.01) {
      const visible = [0, 1, 2].some((j) => {
        const s = layerStyle(tl, f, j, 'fly');
        return s.visible && s.opacity > 0.2;
      });
      expect(visible).toBe(true);
    }
  });
});

describe('stack mode (mobile)', () => {
  it('only the two scenes around the camera exist', () => {
    expect(layerStyle(tl, 0.5, 0, 'stack').visible).toBe(true);
    expect(layerStyle(tl, 0.5, 1, 'stack').visible).toBe(true);
    expect(layerStyle(tl, 0.5, 2, 'stack').visible).toBe(false);
  });

  it('crossfades with scale and blur', () => {
    const out = layerStyle(tl, 0.5, 0, 'stack');
    const inc = layerStyle(tl, 0.5, 1, 'stack');
    expect(out.opacity).toBe(0.5);
    expect(inc.opacity).toBe(0.5);
    expect(out.transform).toBe('scale(1.06)');
    expect(inc.transform).toBe('scale(0.96)');
    expect(out.filter).toBe('blur(3px)');
  });

  it('rests clean', () => {
    expect(layerStyle(tl, 2, 2, 'stack')).toMatchObject({
      transform: 'none',
      filter: 'none',
      opacity: 1,
    });
  });
});

describe('fade mode (reduced motion)', () => {
  it('never moves or blurs', () => {
    for (let f = 0; f <= 2; f += 0.05) {
      for (const j of [0, 1, 2]) {
        const s = layerStyle(tl, f, j, 'fade');
        expect(s.transform).toBe('none');
        expect(s.filter).toBe('none');
      }
    }
  });

  it('hands clicks over halfway through the crossfade', () => {
    expect(layerStyle(tl, 0.4, 0, 'fade').interactive).toBe(true);
    expect(layerStyle(tl, 0.6, 0, 'fade').interactive).toBe(false);
    expect(layerStyle(tl, 0.6, 1, 'fade').interactive).toBe(true);
  });
});
