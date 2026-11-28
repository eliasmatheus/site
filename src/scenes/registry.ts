/**
 * The journey, in order. Each entry places a scene in the world and says how long the
 * camera rests on it. Scenes with client code expose a `load` that is only called when
 * the camera gets near (lazy load by proximity).
 */
import type { SceneHooks } from '../engine/engine';
import type { ScenePlacement } from '../engine/timeline';
import { HORIZON_STOPS } from './horizon/beats';

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
    // The departure (ringed planet, wormhole, tunnel, calm, still sky), then the black hole:
    // arrival and the fall. A long dwell so each beat gets room, and stops through the
    // departure so each take plays.
    dwell: 12500,
    stops: HORIZON_STOPS,
    x: 0,
    y: 0,
    load: () => import('./horizon/controller'),
  },
  {
    id: 'the-fall',
    label: 'The fall',
    // Down the tesseract past four moments, to the first computer and its save file. No
    // stops: the camera follows the scroll with mass, like a flight in a 3D game.
    dwell: 5600,
    x: 0,
    y: 0,
    load: () => import('./the-fall/controller'),
  },
  // The Prologue (photography) left the opening on 25/11/2026 (docs/plano.md, Fase 4). Its
  // code stays in src/scenes/prologue until it gets a place in the timeline.
  // The Call, Structures and The Desert left the journey on 26/11/2026 (docs/viagem.md,
  // decision 7): The Call is gone, Structures and The Desert come back as Act IV rooms. Their
  // code stays in src/scenes until then.
  { id: 'to-be-continued', label: 'To be continued', dwell: 900, x: 0, y: 0 },
];
