/**
 * The tesseract the visitor falls through: posts along y and beams along x and z on a grid,
 * bundles of thin slats beside them and hair-thin lines of light. Pure and seeded, so it is
 * the same on every visit and testable.
 *
 * Three rules the prototype broke: nothing may cross the camera's path (src/scenes/the-fall/
 * path.ts, widened by how far the pointer can move the camera), nothing may stand between the
 * path and a memory, and nothing may cut through a memory itself.
 */
import { CAMERA_ROOM, COMPUTER, MEMORY_T, SHAFT, memoryAt, pathAt, type Point } from './path';

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
  /** How deep the lattice goes. */
  depth: number;
}

export const CELL = 9;

/** A stretch of space to keep clear: a segment with a radius. */
export interface Clear {
  a: Point;
  b: Point;
  r: number;
}

/** Room around each memory, and the line of sight to it. */
const MEMORY_ROOM = 6.5;
const SIGHT = 1.8;

/** Everything that must stay empty: the path, each line of sight, each memory. */
export function clearings(): Clear[] {
  const out: Clear[] = [];
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    out.push({ a: pathAt(i / steps), b: pathAt((i + 1) / steps), r: CAMERA_ROOM });
  }
  MEMORY_T.forEach((t, i) => {
    const m = memoryAt(i);
    out.push({ a: pathAt(t), b: m, r: SIGHT });
    out.push({ a: m, b: m, r: MEMORY_ROOM });
  });
  out.push({ a: pathAt(1), b: COMPUTER, r: SIGHT + 1 });
  out.push({ a: COMPUTER, b: COMPUTER, r: MEMORY_ROOM + 1 });
  return out;
}

const seeded = (seed: number): (() => number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

/** Distance from a point to a box (0 inside it). */
export const toBox = (p: Point, b: Box): number =>
  Math.hypot(
    Math.max(0, Math.abs(p.x - b[0]) - b[3] / 2),
    Math.max(0, Math.abs(p.y - b[1]) - b[4] / 2),
    Math.max(0, Math.abs(p.z - b[2]) - b[5] / 2),
  );

/** Does a box reach into a clearing? Sampled every half unit along it. */
export const cuts = (b: Box, c: Clear): boolean => {
  const len = Math.hypot(c.b.x - c.a.x, c.b.y - c.a.y, c.b.z - c.a.z);
  const n = Math.max(1, Math.ceil(len / 0.5));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const p = {
      x: c.a.x + (c.b.x - c.a.x) * k,
      y: c.a.y + (c.b.y - c.a.y) * k,
      z: c.a.z + (c.b.z - c.a.z) * k,
    };
    if (toBox(p, b) < c.r) return true;
  }
  return false;
};

export function createLattice(coarse: boolean): Lattice {
  const span = 7;
  const depth = SHAFT + 40;
  const levels = Math.ceil(depth / CELL) + 1;
  const rnd = seeded(12345);
  const clear = clearings();
  // Only test the clearings whose bounds come near the box.
  const free = (b: Box): boolean =>
    !clear.some((c) => {
      const lo = (k: 'x' | 'y' | 'z'): number => Math.min(c.a[k], c.b[k]) - c.r;
      const hi = (k: 'x' | 'y' | 'z'): number => Math.max(c.a[k], c.b[k]) + c.r;
      if (b[0] + b[3] / 2 < lo('x') || b[0] - b[3] / 2 > hi('x')) return false;
      if (b[1] + b[4] / 2 < lo('y') || b[1] - b[4] / 2 > hi('y')) return false;
      if (b[2] + b[5] / 2 < lo('z') || b[2] - b[5] / 2 > hi('z')) return false;
      return cuts(b, c);
    });

  const grid: number[] = [];
  for (let i = -span; i <= span; i++) grid.push(i * CELL);
  const reach = CELL * span;

  const posts: Box[] = [];
  for (const x of grid) {
    for (const z of grid) {
      const th = 1.2 + rnd() * 1.6;
      const jx = (rnd() - 0.5) * 1.5;
      const jz = (rnd() - 0.5) * 1.5;
      const whole: Box = [x + jx, -depth / 2, z + jz, th, depth + 40, th];
      if (free(whole)) {
        posts.push(whole);
        continue;
      }
      // Cut where a clearing passes, so the post runs above and below it.
      for (let y = 20; y > -depth - 20; y -= CELL) {
        const b: Box = [x + jx, y - CELL / 2, z + jz, th, CELL, th];
        if (free(b)) posts.push(b);
      }
    }
  }

  const beamsX: Box[] = [];
  const beamsZ: Box[] = [];
  const len = reach * 2 + 6;
  for (let l = 0; l < levels; l++) {
    const y = -l * CELL - CELL / 2 + (rnd() - 0.5) * 3;
    for (const z of grid) {
      const skip = rnd() < 0.3;
      const th = 0.8 + rnd() * 2.2;
      const b: Box = [0, y, z + (rnd() - 0.5), len, th, th * (0.6 + rnd())];
      if (skip) continue;
      if (free(b)) beamsX.push(b);
      else {
        // Split where it meets a clearing: keep the cells that are free.
        for (const x of grid) {
          const piece: Box = [x, b[1], b[2], CELL, b[4], b[5]];
          if (free(piece)) beamsX.push(piece);
        }
      }
    }
    for (const x of grid) {
      const skip = rnd() < 0.3;
      const th = 0.8 + rnd() * 2.2;
      const b: Box = [x + (rnd() - 0.5), y + CELL / 3, 0, th * (0.6 + rnd()), th, len];
      if (skip) continue;
      if (free(b)) beamsZ.push(b);
      else {
        for (const z of grid) {
          const piece: Box = [b[0], b[1], z, b[3], b[4], CELL];
          if (free(piece)) beamsZ.push(piece);
        }
      }
    }
  }

  // Bundles of slats beside the beams, along x, y and z.
  const slats: Box[] = [];
  const bundles = coarse ? 380 : 760;
  for (let k = 0; k < bundles; k++) {
    const axis = Math.floor(rnd() * 3);
    const y = -rnd() * depth;
    const gx = grid[Math.floor(rnd() * grid.length)] ?? 0;
    const gz = grid[Math.floor(rnd() * grid.length)] ?? 0;
    const count = 2 + Math.floor(rnd() * 4);
    const l = CELL * (1 + Math.floor(rnd() * 4)) + rnd() * 4;
    const step = 0.5 + rnd() * 0.6;
    for (let c = 0; c < count; c++) {
      const w = 0.18 + rnd() * 0.45;
      const off = (c - count / 2) * step;
      const b: Box =
        axis === 0
          ? [gx + (rnd() - 0.5) * CELL, y + off, gz + 1.6, l, w, w * (1 + rnd())]
          : axis === 1
            ? [gx + 1.6 + off, y, gz + 1.6, w, l * 1.4, w]
            : [gx + 1.6, y + off, gz + (rnd() - 0.5) * CELL, w * (1 + rnd()), w, l];
      if (free(b)) slats.push(b);
    }
  }

  const glints: Box[] = [];
  const lines = coarse ? 200 : 420;
  for (let k = 0; k < lines; k++) {
    const axis = Math.floor(rnd() * 3);
    const x = (rnd() - 0.5) * 2 * reach;
    const z = (rnd() - 0.5) * 2 * reach;
    const y = -rnd() * depth;
    const l = 10 + rnd() * 60;
    const t = 0.03 + rnd() * 0.06;
    const b: Box =
      axis === 0 ? [x, y, z, l, t, t] : axis === 1 ? [x, y, z, t, l, t] : [x, y, z, t, t, l];
    if (free(b)) glints.push(b);
  }

  return { posts, beamsX, beamsZ, slats, glints, depth };
}
