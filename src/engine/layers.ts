/**
 * How each scene layer looks for a given camera position. Pure, no DOM.
 *
 * Three staging modes, same timeline:
 * - `fly`: desktop. Scenes float in 3D and the camera flies between them.
 * - `stack`: mobile. Scenes are stacked; a short scale + blur + fade replaces the flight.
 * - `fade`: reduced motion. No movement at all, just a crossfade.
 */
import { cameraAt, type Timeline } from './timeline';

export type StageMode = 'fly' | 'stack' | 'fade';

export interface LayerStyle {
  visible: boolean;
  opacity: number;
  /** CSS transform, or 'none' when the layer rests in front of the camera. */
  transform: string;
  /** CSS filter ('none' or a blur). */
  filter: string;
  /** Corner radius in px: scenes look like cards while flying, full screen at rest. */
  radius: number;
  /** Only the layer the visitor is in receives clicks and touches. */
  interactive: boolean;
}

/** Below this distance from a scene the camera counts as resting on it. */
const REST_EPSILON = 0.002;

const HIDDEN: LayerStyle = {
  visible: false,
  opacity: 0,
  transform: 'none',
  filter: 'none',
  radius: 0,
  interactive: false,
};

const round = (v: number, digits = 1): number => Number(v.toFixed(digits));

export function layerStyle(tl: Timeline, f: number, j: number, mode: StageMode): LayerStyle {
  const scene = tl.scenes[j];
  if (!scene) return HIDDEN;
  const distance = j - f; // > 0: still ahead of the camera; < 0: already passed.
  const resting = Math.abs(distance) < REST_EPSILON;

  if (mode === 'fly') {
    if (Math.abs(distance) >= 1.7) return HIDDEN;
    const cam = cameraAt(tl, f);
    const dz = cam.z - j * tl.config.zStep; // > 0: the scene has passed the camera.
    const opacity =
      dz > 0 ? Math.max(0, 1 - dz / 700) : Math.max(0, Math.min(1, (dz + 5200) / 5200));
    const transform = resting
      ? 'none'
      : `translate3d(${round(scene.x - cam.x)}px, ${round(scene.y - cam.y)}px, ${round(dz)}px)`;
    return {
      visible: opacity > 0,
      opacity: round(opacity, 3),
      transform,
      filter: 'none',
      radius: round(Math.min(28, Math.abs(dz) / 25)),
      interactive: Math.abs(dz) < 40,
    };
  }

  // stack and fade: only the two scenes around the camera exist.
  if (Math.abs(distance) >= 1) return HIDDEN;
  // t = 0 when resting on this scene, 1 when fully gone (ahead or behind).
  const t = Math.abs(distance);
  const opacity = round(1 - t, 3);
  const interactive = t < 0.5;

  if (mode === 'fade') {
    return {
      visible: opacity > 0,
      opacity,
      transform: 'none',
      filter: 'none',
      radius: 0,
      interactive,
    };
  }

  // stack: the outgoing scene grows toward the viewer, the incoming one comes from depth.
  const scale = distance < 0 ? 1 + 0.12 * t : 1 - 0.08 * t;
  const blur = round(6 * t);
  return {
    visible: opacity > 0,
    opacity,
    transform: resting ? 'none' : `scale(${round(scale, 4)})`,
    filter: blur > 0 ? `blur(${blur}px)` : 'none',
    radius: round(Math.min(20, t * 60)),
    interactive,
  };
}
