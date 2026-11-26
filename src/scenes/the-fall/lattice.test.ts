import { describe, expect, it } from 'vitest';
import { GAPS, fallState } from './beats';
import { clearings, createLattice, cuts } from './lattice';
import { FREE, MEMORY_T, NAV_DIR, pathAt } from './path';

describe('lattice', () => {
  for (const coarse of [false, true]) {
    const l = createLattice(coarse);
    const all = [...l.posts, ...l.beamsX, ...l.beamsZ, ...l.slats, ...l.glints];
    const name = coarse ? 'phone' : 'desktop';

    it(`is dense (${name})`, () => {
      expect(all.length).toBeGreaterThan(800);
    });

    it(`keeps the camera's path, each line of sight and each memory clear (${name})`, () => {
      const hits = clearings().flatMap((c) => all.filter((b) => cuts(b, c)));
      expect(hits).toEqual([]);
    });

    it(`is the same on every visit (${name})`, () => {
      expect(createLattice(coarse)).toEqual(l);
    });
  }
});

describe('path', () => {
  it('falls straight down first, then glides on a diagonal, almost level', () => {
    const top = pathAt(0);
    const center = pathAt(FREE);
    expect(center.x).toBe(top.x);
    expect(center.z).toBe(top.z);
    expect(center.y).toBeLessThan(top.y - 100);
    // Diagonal across the grid: as much x as z, little descent.
    expect(NAV_DIR.x).toBeCloseTo(NAV_DIR.z, 5);
    expect(Math.abs(NAV_DIR.y)).toBeLessThan(0.25);
  });

  it('passes every memory during the glide', () => {
    expect(MEMORY_T.every((t) => t > FREE && t < 1)).toBe(true);
  });
});

describe('fall beats', () => {
  it('starts in the white flash and ends on the save file', () => {
    expect(fallState(0).whiteout).toBe(1);
    expect(fallState(0.5).whiteout).toBe(0);
    expect(fallState(1).hole).toBe(1);
    expect(fallState(1).retro).toBe(2);
  });

  it('names each memory as it is passed, then the first computer', () => {
    GAPS.forEach((g, i) => expect(fallState(g.at).glimpse).toBe(i));
    expect(fallState(0.79).glimpse).toBe(GAPS.length);
    expect(fallState(0.03).glimpse).toBe(-1);
  });

  it('names nothing during the free fall', () => {
    for (let p = 0.05; p < 0.3; p += 0.01) expect(fallState(p).glimpse).toBe(-1);
  });

  it('opens the iris in hard steps', () => {
    const holes = new Set(Array.from({ length: 200 }, (_, i) => fallState(i / 199).hole));
    expect(holes.size).toBeLessThanOrEqual(13);
  });
});
