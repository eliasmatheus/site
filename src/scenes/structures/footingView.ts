/**
 * Structures: what the panels say for a footing. Pure, no DOM.
 * The engineering lives in src/models/footing.ts; this turns it into scene state.
 */
import { structures } from '../../content/structures';
import {
  evaluateFooting,
  INITIAL_PHASE2,
  LOAD_CHANGED,
  LOAD_ORIGINAL,
  optimum,
  RANGE_B,
  RANGE_D,
  sigmaAdm,
  sptN,
  SWEET_SPOT_TOLERANCE,
  type FootingStatus,
} from '../../models/footing';

/** Dwell progress where the plans change (prototype: 22%). */
export const PLANS_CHANGE_AT = 0.22;

/** The original footing: sized for 320 kN, it holds. Phase 2 starts from the same block. */
export const ORIGINAL = { B: INITIAL_PHASE2.B, D: INITIAL_PHASE2.D } as const;

export type SceneState = 'original' | FootingStatus;
export type Step = 'widen' | 'deepen' | 'shrink' | 'done';
export type Tone = 'neutral' | 'ok' | 'over' | 'fail';

/** Depth (m) below which the stiff layer starts helping; Step 2 asks to go past it. */
const DEEPEN_UNTIL = 2.2;

export interface FootingView {
  state: SceneState;
  /** Colour family for the footing, the pressure bar and the verdict. */
  tone: Tone;
  load: number;
  kicker: string;
  title: string;
  text: string;
  verdict: string;
  tag: string;
  dims: string;
  pressure: string;
  /** Pressure bar fill, 0 to 100 (%). Full at the allowable pressure. */
  pressurePct: number;
  cost: string;
  rel: string;
  relTone: Tone;
  /** Guided quest step, only after the plans change. */
  step: Step | undefined;
  stepText: string;
  /** Sweet spot reached under the changed load: the quest is done. */
  solved: boolean;
}

export function footingView(
  B: number,
  D: number,
  plansChanged: boolean,
  questDone = false,
): FootingView {
  const load = plansChanged ? LOAD_CHANGED : LOAD_ORIGINAL;
  const r = evaluateFooting(load, B, D);
  const h = structures.hud;
  const state: SceneState = plansChanged ? r.status : 'original';
  const copy = structures.states[state];
  const tone: Tone = state === 'original' ? 'neutral' : state;
  const step: Step | undefined = !plansChanged
    ? undefined
    : r.status === 'fail'
      ? 'widen'
      : r.status === 'over' && D < DEEPEN_UNTIL
        ? 'deepen'
        : r.status === 'over'
          ? 'shrink'
          : 'done';
  const solved = plansChanged && r.status === 'ok';
  const best = r.aboveOptimum <= SWEET_SPOT_TOLERANCE;
  const rel = !plansChanged
    ? h.rel.idle
    : r.status === 'fail'
      ? h.rel.unsafe
      : best
        ? h.rel.best
        : h.rel.above(r.aboveOptimum * 100);
  const relTone: Tone = !plansChanged
    ? 'neutral'
    : r.status === 'fail'
      ? 'fail'
      : best
        ? 'ok'
        : 'over';
  const kicker = state === 'ok' && questDone ? structures.states.ok.kickerDone : copy.kicker;
  return {
    state,
    tone,
    load,
    kicker,
    title: copy.title,
    text: copy.text,
    verdict: copy.verdict,
    tag: copy.tag,
    dims: h.dims(B, D),
    pressure: h.pressure(r.q, r.sigma),
    pressurePct: Math.min(100, (r.q / r.sigma) * 100),
    cost: h.money(r.cost.total),
    rel,
    relTone,
    step,
    stepText: step ? structures.steps[step] : '',
    solved,
  };
}

/** Rows of the real borehole: depth, N, allowable pressure; the row at the footing is lit. */
export interface SoilRow {
  depth: number;
  n: number;
  kpa: number;
  /** Bar width, 0 to 100 (%), against the 400 kPa cap. */
  pct: number;
  layer: 'soft' | 'firm' | 'stiff';
  current: boolean;
}

export const SOIL_DEPTHS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5] as const;

export function soilRows(D: number): SoilRow[] {
  return SOIL_DEPTHS.map((depth) => {
    const kpa = sigmaAdm(depth);
    return {
      depth,
      n: sptN(depth),
      kpa,
      pct: (kpa / 400) * 100,
      layer: depth < 2 ? 'soft' : depth < 3 ? 'firm' : 'stiff',
      current: Math.abs(D - depth) <= 0.25,
    };
  });
}

/** Where "Show me" lands: the cheapest safe footing, nudged just inside the safe side. */
export function sweetSpot(): { B: number; D: number } {
  const o = optimum();
  return { B: o.B + 0.02, D: o.D };
}

export const clampB = (B: number): number => Math.min(RANGE_B.max, Math.max(RANGE_B.min, B));
export const clampD = (D: number): number => Math.min(RANGE_D.max, Math.max(RANGE_D.min, D));
