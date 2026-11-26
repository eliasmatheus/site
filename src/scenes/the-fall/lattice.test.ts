import { describe, expect, it } from 'vitest';
import { GAPS, fallState } from './beats';
import { CAMERA_COLUMN, createLattice, type Box } from './lattice';

const crossesColumn = (b: Box, half: number) =>
  Math.abs(b[0]) - b[3] / 2 < half && Math.abs(b[2]) - b[5] / 2 < half;

describe('lattice', () => {
  for (const coarse of [false, true]) {
    const l = createLattice(coarse);

    it(`never puts a beam or a post in the camera's path (${coarse ? 'phone' : 'desktop'})`, () => {
      const all = [...l.posts, ...l.beamsX, ...l.beamsZ, ...l.slats, ...l.glints];
      expect(all.length).toBeGreaterThan(100);
      expect(all.filter((b) => crossesColumn(b, CAMERA_COLUMN))).toEqual([]);
    });

    it(`keeps each gap's line of sight open (${coarse ? 'phone' : 'desktop'})`, () => {
      GAPS.forEach((g, i) => {
        const y = l.gapY[i] ?? 0;
        // Sample the line from the axis to the window at the gap's height.
        for (let d = CAMERA_COLUMN; d < l.windowDistance - 1; d += 0.5) {
          const x = g.side[0] * d;
          const z = g.side[1] * d;
          const hit = [...l.posts, ...l.beamsX, ...l.beamsZ, ...l.slats].some(
            (b) =>
              Math.abs(x - b[0]) < b[3] / 2 &&
              Math.abs(y - b[1]) < b[4] / 2 &&
              Math.abs(z - b[2]) < b[5] / 2,
          );
          expect(hit).toBe(false);
        }
      });
    });

    it(`is the same on every visit (${coarse ? 'phone' : 'desktop'})`, () => {
      expect(createLattice(coarse)).toEqual(l);
    });
  }
});

describe('fall beats', () => {
  it('starts in the white flash and ends on the save file', () => {
    expect(fallState(0).whiteout).toBe(1);
    expect(fallState(0.5).whiteout).toBe(0);
    expect(fallState(1).hole).toBe(1);
    expect(fallState(1).retro).toBe(2);
  });

  it('names the moment at each gap stop, then the first computer', () => {
    GAPS.forEach((g, i) => expect(fallState(g.at).glimpse).toBe(i));
    expect(fallState(0.79).glimpse).toBe(GAPS.length);
    expect(fallState(0.03).glimpse).toBe(-1);
  });

  it('opens the iris in hard steps', () => {
    const holes = new Set(Array.from({ length: 200 }, (_, i) => fallState(i / 199).hole));
    expect(holes.size).toBeLessThanOrEqual(13);
  });
});
