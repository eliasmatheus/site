/**
 * The tesseract the visitor falls through: posts along y and beams along x and z on a grid,
 * bundles of thin slats beside them and hair-thin lines of light, around an open shaft. Pure and seeded, so it is the same on every visit and testable.
 *
 * Two rules the prototype broke: nothing may cross the camera's path (a column around the
 * shaft's axis, widened by how far the pointer can move the camera), and nothing may stand
 * between the camera and a gap's window.
 */
import { GAPS, fallAt } from './beats';

/** A box: centre and size. */
export type Box = readonly [x: number, y: number, z: number, sx: number, sy: number, sz: number];

export interface Lattice {
  posts: Box[];
  beamsX: Box[];
  beamsZ: Box[];
  /** Thin beams in bundles beside the big ones: the lattice's fine grain. */
  slats: Box[];
  /** Hair-thin lines of light along the three axes. */
  glints: Box[];
  floor: Box[];
  /** Shaft depth (world units). The camera falls from 0 to -(depth - 6). */
  depth: number;
  /** Distance from the axis to each window. */
  windowDistance: number;
  /** Height of each gap's window, in GAPS order. */
  gapY: number[];
}

export const CELL = 9;
/** Half-width of the column the camera moves in (pointer parallax plus margin). */
export const CAMERA_COLUMN = 2.6;

const seeded = (seed: number): (() => number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

/** Do two boxes overlap on the x and z axes? */
const overlapsColumn = (b: Box, half: number): boolean =>
  Math.abs(b[0]) - b[3] / 2 < half && Math.abs(b[2]) - b[5] / 2 < half;

export function createLattice(coarse: boolean): Lattice {
  const levels = coarse ? 34 : 46;
  const span = coarse ? 3 : 4;
  const depth = levels * CELL;
  const windowDistance = CELL * 1.7;
  const gapY = GAPS.map((g) => -fallAt(g.at) * (depth - 6));
  const rnd = seeded(12345);

  const grid: number[] = [];
  for (let i = -span; i <= span; i++) grid.push(i * CELL);

  // A beam near a gap's height, on the gap's wall, between the shaft and the window, blocks it.
  const blocks = (y: number, alongX: boolean, c: number): boolean =>
    GAPS.some((g, i) => {
      if (Math.abs(y - (gapY[i] ?? 0)) > 7.5) return false;
      const [sx, sz] = g.side;
      return alongX
        ? sx === 0 && Math.sign(c) === sz && Math.abs(c) <= windowDistance + 1
        : sz === 0 && Math.sign(c) === sx && Math.abs(c) <= windowDistance + 1;
    });

  const posts: Box[] = [];
  for (const x of grid) {
    for (const z of grid) {
      if (Math.abs(x) < CELL / 2 && Math.abs(z) < CELL / 2) continue;
      const inSight = GAPS.some(
        (g) =>
          (g.side[0] !== 0 &&
            z === 0 &&
            Math.sign(x) === g.side[0] &&
            Math.abs(x) <= windowDistance + CELL) ||
          (g.side[1] !== 0 &&
            x === 0 &&
            Math.sign(z) === g.side[1] &&
            Math.abs(z) <= windowDistance + CELL),
      );
      const th = 1.2 + rnd() * 1.6;
      const jx = (rnd() - 0.5) * 1.5;
      const jz = (rnd() - 0.5) * 1.5;
      if (inSight) continue;
      posts.push([x + jx, -depth / 2, z + jz, th, depth + 40, th]);
    }
  }

  const beamsX: Box[] = [];
  const beamsZ: Box[] = [];
  const len = CELL * (2 * span) + 6;
  for (let l = 0; l < levels; l++) {
    const y = -l * CELL - CELL / 2 + (rnd() - 0.5) * 3;
    for (const z of grid) {
      const skip = rnd() < 0.35;
      const th = 0.8 + rnd() * 2.2;
      const b: Box = [0, y, z + (rnd() - 0.5), len, th, th * (0.6 + rnd())];
      // Beams on the shaft's own line would cross the fall: never.
      if (skip || z === 0 || blocks(y, true, z) || overlapsColumn(b, CAMERA_COLUMN)) continue;
      beamsX.push(b);
    }
    for (const x of grid) {
      const skip = rnd() < 0.35;
      const th = 0.8 + rnd() * 2.2;
      const b: Box = [x + (rnd() - 0.5), y + CELL / 3, 0, th * (0.6 + rnd()), th, len];
      if (skip || x === 0 || blocks(y + CELL / 3, false, x) || overlapsColumn(b, CAMERA_COLUMN)) {
        continue;
      }
      beamsZ.push(b);
    }
  }

  // Bundles of slats beside the beams, along x, y and z, under the same two rules.
  const slats: Box[] = [];
  const glints: Box[] = [];
  const free = (b: Box): boolean =>
    !overlapsColumn(b, CAMERA_COLUMN) &&
    !GAPS.some((g, i) => {
      const y = gapY[i] ?? 0;
      if (Math.abs(b[1] - y) > b[4] / 2 + 3) return false;
      // Anything between the axis and the window, on the gap's side.
      const [sx, sz] = g.side;
      const along = sx !== 0 ? b[0] * sx : b[2] * sz;
      const off = sx !== 0 ? Math.abs(b[2]) - b[5] / 2 : Math.abs(b[0]) - b[3] / 2;
      const reach = sx !== 0 ? b[3] / 2 : b[5] / 2;
      return off < 5 && along + reach > 0 && along - reach < windowDistance + CELL;
    });
  const bundles = coarse ? 260 : 520;
  for (let k = 0; k < bundles; k++) {
    const axis = Math.floor(rnd() * 3);
    const y = -rnd() * depth;
    const gx = grid[Math.floor(rnd() * grid.length)] ?? 0;
    const gz = grid[Math.floor(rnd() * grid.length)] ?? 0;
    const count = 2 + Math.floor(rnd() * 4);
    const len = CELL * (1 + Math.floor(rnd() * 4)) + rnd() * 4;
    const step = 0.5 + rnd() * 0.6;
    for (let c = 0; c < count; c++) {
      const w = 0.18 + rnd() * 0.45;
      const off = (c - count / 2) * step;
      const b: Box =
        axis === 0
          ? [gx + (rnd() - 0.5) * CELL, y + off, gz + 1.6, len, w, w * (1 + rnd())]
          : axis === 1
            ? [gx + 1.6 + off, y, gz + 1.6, w, len * 1.4, w]
            : [gx + 1.6, y + off, gz + (rnd() - 0.5) * CELL, w * (1 + rnd()), w, len];
      if (free(b)) slats.push(b);
    }
  }
  const lines = coarse ? 140 : 300;
  for (let k = 0; k < lines; k++) {
    const axis = Math.floor(rnd() * 3);
    const x = (rnd() - 0.5) * 2 * span * CELL;
    const z = (rnd() - 0.5) * 2 * span * CELL;
    const y = -rnd() * depth;
    const len = 10 + rnd() * 60;
    const t = 0.03 + rnd() * 0.06;
    const b: Box =
      axis === 0 ? [x, y, z, len, t, t] : axis === 1 ? [x, y, z, t, len, t] : [x, y, z, t, t, len];
    if (free(b)) glints.push(b);
  }

  // The floor under the first computer: a frame around it and a few long beams beyond.
  const fy = -depth - 1.2;
  const floor: Box[] = [
    [0, fy, -3.6, 12, 1.4, 1.6],
    [0, fy, 3.6, 12, 1.4, 1.6],
    [-5, fy, 0, 1.6, 1.4, 8.8],
    [5, fy, 0, 1.6, 1.4, 8.8],
  ];
  for (let k = 0; k < 26; k++) {
    const along = rnd() < 0.5;
    const off = (rnd() < 0.5 ? -1 : 1) * (6 + rnd() * 30);
    const th = 0.8 + rnd() * 2;
    const y = fy - rnd() * 3;
    floor.push(along ? [0, y, off, 80, th, th] : [off, y, 0, th, th, 80]);
  }

  return { posts, beamsX, beamsZ, slats, glints, floor, depth, windowDistance, gapY };
}
