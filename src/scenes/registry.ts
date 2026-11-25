/**
 * The journey, in order. Each entry places a scene in the world and says how long the
 * camera rests on it. Scenes with client code expose a `load` that is only called when
 * the camera gets near (lazy load by proximity).
 */
import type { SceneHooks } from '../engine/engine';
import type { ScenePlacement } from '../engine/timeline';

export interface SceneContext {
  /** The scene's layer element. */
  el: HTMLElement;
  mode: 'fly' | 'stack' | 'fade';
}

export type SceneController = (ctx: SceneContext) => SceneHooks;

export interface SceneEntry extends ScenePlacement {
  /** Short label for the progress bar and screen readers. */
  label: string;
  load?: () => Promise<{ default: SceneController }>;
}

// Positions and dwells from the prototype (World.dc.html, this.SC).
export const SCENES: readonly SceneEntry[] = [
  {
    id: 'prologue',
    label: 'Prologue',
    dwell: 2800,
    x: 0,
    y: 0,
    load: () => import('./prologue/controller'),
  },
  {
    id: 'desert',
    label: 'The Desert',
    dwell: 1500,
    x: 380,
    y: 140,
    load: () => import('./desert/controller'),
  },
  { id: 'to-be-continued', label: 'To be continued', dwell: 900, x: 0, y: 0 },
];
