/**
 * Scroll timeline: maps document scroll (px) to a camera position in the world.
 * Pure functions, no DOM. Model from the prototype's `locate()` and `frame()`.
 *
 * Each scene has a `dwell` (px of scroll where the camera rests on it). Between two scenes
 * there is a `travel` (px of scroll for the flight). The camera position `f` is a float:
 * 2 means "resting on scene 2", 2.5 means "halfway through the flight from 2 to 3".
 */

export interface ScenePlacement {
  id: string;
  /** Scroll length (px) the camera stays on this scene. */
  dwell: number;
  /** Offset of the scene in the world, px. z comes from its index. */
  x: number;
  y: number;
}

export interface TimelineConfig {
  /** Scroll length (px) of each flight between scenes. */
  travel: number;
  /** World distance (px) between consecutive scenes on the z axis. */
  zStep: number;
}

export const DEFAULT_CONFIG: TimelineConfig = { travel: 1000, zStep: 3000 };

export interface Timeline {
  scenes: readonly ScenePlacement[];
  config: TimelineConfig;
  /** Scroll position (px) where each scene's dwell starts. */
  starts: readonly number[];
  /** Total scroll length (px). The document is this plus one viewport. */
  length: number;
}

export function createTimeline(
  scenes: readonly ScenePlacement[],
  config: TimelineConfig = DEFAULT_CONFIG,
): Timeline {
  if (scenes.length === 0) throw new Error('A timeline needs at least one scene.');
  const starts: number[] = [];
  let pos = 0;
  scenes.forEach((s, i) => {
    starts.push(pos);
    pos += s.dwell + (i < scenes.length - 1 ? config.travel : 0);
  });
  return { scenes, config, starts, length: pos };
}

export interface Location {
  /** Camera position: integer while resting, fractional while flying. */
  f: number;
  /** Index of the scene whose dwell or outgoing flight we are in. */
  index: number;
  /** Progress 0 to 1 inside that scene's dwell (1 during its outgoing flight). */
  progress: number;
  /** True while flying between `index` and `index + 1`. */
  travelling: boolean;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
/** Smoothstep easing for flights. */
export const ease = (u: number): number => u * u * (3 - 2 * u);

export function locate(tl: Timeline, scrollY: number): Location {
  const T = Math.max(0, scrollY);
  const last = tl.scenes.length - 1;
  for (let i = 0; i <= last; i++) {
    const start = tl.starts[i] ?? 0;
    const dwell = tl.scenes[i]?.dwell ?? 0;
    const dwellEnd = start + dwell;
    if (T < dwellEnd || i === last) {
      return {
        f: i,
        index: i,
        progress: dwell > 0 ? clamp01((T - start) / dwell) : 1,
        travelling: false,
      };
    }
    if (T < dwellEnd + tl.config.travel) {
      const u = (T - dwellEnd) / tl.config.travel;
      return { f: i + ease(u), index: i, progress: 1, travelling: true };
    }
  }
  return { f: 0, index: 0, progress: 0, travelling: false };
}

/** Progress 0 to 1 inside scene j's dwell, for any scroll position. */
export function sceneProgress(tl: Timeline, scrollY: number, j: number): number {
  const start = tl.starts[j];
  const dwell = tl.scenes[j]?.dwell;
  if (start === undefined || dwell === undefined) return 0;
  return dwell > 0 ? clamp01((scrollY - start) / dwell) : 1;
}

/** The scene the visitor is "in": the nearest one to the camera. */
export function activeIndex(f: number): number {
  return Math.round(f);
}

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export function cameraAt(tl: Timeline, f: number): Camera {
  const i0 = Math.max(0, Math.min(tl.scenes.length - 1, Math.floor(f)));
  const i1 = Math.min(tl.scenes.length - 1, i0 + 1);
  const fr = f - i0;
  const a = tl.scenes[i0];
  const b = tl.scenes[i1];
  if (!a || !b) return { x: 0, y: 0, z: 0 };
  return { x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr, z: f * tl.config.zStep };
}

/** Scroll position where scene j's dwell starts (for anchors like /#desert). */
export function scrollForScene(tl: Timeline, j: number): number {
  return tl.starts[j] ?? 0;
}

/** Overall journey progress 0 to 1, for the header bar. */
export function journeyProgress(tl: Timeline, f: number): number {
  const last = tl.scenes.length - 1;
  return last === 0 ? 1 : clamp01(f / last);
}
