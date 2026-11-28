/**
 * A value that follows a target like a camera with mass: it eases in, glides and eases out,
 * so a scroll flick becomes one smooth move instead of a jump. Critically damped spring:
 * never overshoots, settles in about 4 / rate seconds.
 *
 * Scenes in 3D (the black hole, The fall) draw from the followed value; copy and anything a
 * test reads can stay on the raw scroll.
 */
export interface Follow {
  /** Current value. */
  readonly value: number;
  /** Current speed, units per second. */
  readonly speed: number;
  /**
   * Move towards the target over dt seconds and return the new value. With maxSpeed (units
   * per second) it never goes faster: a hard flick plays at that pace, like a film.
   */
  step(target: number, dt: number, maxSpeed?: number): number;
  /** Jump straight to a value (a far jump, a hidden scene, reduced motion). */
  snap(v: number): void;
  /** Is it still moving towards this target? */
  moving(target: number): boolean;
}

export function createFollow(rate = 4.5, start = 0): Follow {
  let x = start;
  let v = 0;
  return {
    get value() {
      return x;
    },
    get speed() {
      return v;
    },
    step(target, dt, maxSpeed = Infinity) {
      // Small fixed substeps keep the spring stable on slow frames.
      let left = Math.min(dt, 0.1);
      while (left > 0) {
        const h = Math.min(left, 1 / 120);
        const a = rate * rate * (target - x) - 2 * rate * v;
        v += a * h;
        if (v > maxSpeed) v = maxSpeed;
        else if (v < -maxSpeed) v = -maxSpeed;
        x += v * h;
        left -= h;
      }
      if (Math.abs(target - x) < 1e-5 && Math.abs(v) < 1e-4) {
        x = target;
        v = 0;
      }
      return x;
    },
    snap(value) {
      x = value;
      v = 0;
    },
    moving(target) {
      return x !== target || v !== 0;
    },
  };
}
