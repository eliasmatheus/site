/**
 * The journey, in order. Each entry places a scene in the world and says how long the
 * camera rests on it. Scenes with client code expose a `load` that is only called when
 * the camera gets near (lazy load by proximity).
 */
import type { SceneHooks } from '../engine/engine';
import type { ScenePlacement } from '../engine/timeline';
import { CALL_STOPS } from './call/beats';

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

// Positions and dwells from the prototype (World.dc.html, this.SC), Horizon from black-hole.html.
export const SCENES: readonly SceneEntry[] = [
  {
    id: 'horizon',
    label: 'Horizon',
    // Wormhole, hard stop, arrival, then the fall: a long dwell so each beat gets room.
    dwell: 5200,
    x: 0,
    y: 0,
    load: () => import('./horizon/controller'),
  },
  // The Prologue (photography) left the opening on 25/11/2026 (docs/plano.md, Fase 4). Its
  // code stays in src/scenes/prologue until it gets a place in the timeline.
  {
    id: 'call',
    label: 'The Call',
    // Longer than the prototype's card scene: boot, eight vignettes, the choice and the save.
    // Told one gesture at a time, so a fast flick never skips a line.
    dwell: 4800,
    stops: CALL_STOPS,
    x: 520,
    y: -120,
    load: () => import('./call/controller'),
  },
  {
    id: 'structures',
    label: 'Structures',
    dwell: 3000,
    x: -480,
    y: 80,
    load: () => import('./structures/controller'),
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
