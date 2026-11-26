/**
 * The camera's way through the tesseract, and where the memories wait along it. Pure.
 *
 * Two parts, like the fall in the film it pays homage to:
 *   - Free fall: straight down a shaft, tumbling, out of control, to the tesseract's center.
 *   - Navigation: righted, the visitor glides on a diagonal across the grid, almost level, so
 *     the beams run to two vanishing points (two-point perspective) through a wide lens.
 *
 * `t` runs from 0 (top of the shaft) to 1 (in front of the first computer).
 */
export interface Point {
  x: number;
  y: number;
  z: number;
}

/** Depth of the shaft, in world units. */
export const SHAFT = 150;
/** Share of the path spent in free fall. */
export const FREE = 0.38;

const NAV_FROM: Point = { x: 0, y: -SHAFT, z: 0 };
const NAV_TO: Point = { x: 52, y: -SHAFT - 14, z: 52 };

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Direction of the navigation, normalized. */
export const NAV_DIR: Point = (() => {
  const x = NAV_TO.x - NAV_FROM.x;
  const y = NAV_TO.y - NAV_FROM.y;
  const z = NAV_TO.z - NAV_FROM.z;
  const l = Math.hypot(x, y, z);
  return { x: x / l, y: y / l, z: z / l };
})();

/** Horizontal, at a right angle to the navigation. */
const SIDEWAYS: Point = { x: Math.SQRT1_2, y: 0, z: -Math.SQRT1_2 };

export function pathAt(t: number): Point {
  const k = Math.min(1, Math.max(0, t));
  if (k <= FREE) return { x: 0, y: (-SHAFT * k) / FREE, z: 0 };
  const u = (k - FREE) / (1 - FREE);
  return {
    x: lerp(NAV_FROM.x, NAV_TO.x, u),
    y: lerp(NAV_FROM.y, NAV_TO.y, u),
    z: lerp(NAV_FROM.z, NAV_TO.z, u),
  };
}

/** Where along the path each memory is passed, newest first. */
export const MEMORY_T: readonly number[] = [0.49, 0.63, 0.77, 0.9];

/**
 * A memory stands beside the path, on alternating sides, a little below the eye, and a little
 * ahead of where it is named, so it is seen at an angle in the wide view, not cut at its edge.
 */
export function memoryAt(i: number): Point {
  const p = pathAt((MEMORY_T[i] ?? 0) + 0.07);
  const side = i % 2 === 0 ? -1 : 1;
  return { x: p.x + SIDEWAYS.x * side * 13, y: p.y - 2, z: p.z + SIDEWAYS.z * side * 13 };
}

/** The first computer waits straight ahead at the end of the path. */
export const COMPUTER: Point = (() => {
  const p = pathAt(1);
  return { x: p.x + NAV_DIR.x * 11, y: p.y - 1, z: p.z + NAV_DIR.z * 11 };
})();

/** Half-width of the room the camera needs (pointer parallax plus margin). */
export const CAMERA_ROOM = 3.6;
