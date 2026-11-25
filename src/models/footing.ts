/**
 * Footing model for the Structures scene. Pure functions, no DOM.
 * Real SPT boring (SP1) and costs from the prototype (docs/modelos.md#sapata).
 */

/** SPT points: [depth in m, N blows]. Linear interpolation, N = 23 below 4 m. */
export const SPT: readonly (readonly [number, number])[] = [
  [0, 4],
  [1, 6],
  [2, 9],
  [3, 21],
  [4, 23],
];

export const LOAD_ORIGINAL = 320; // kN, phase 1
export const LOAD_CHANGED = 480; // kN, phase 2

export const RANGE_B = { min: 0.8, max: 3.2 } as const; // m
export const RANGE_D = { min: 0.6, max: 3.5 } as const; // m
export const SEARCH_STEP = 0.02; // m

/** Phase 2 starts here and fails. */
export const INITIAL_PHASE2 = { B: 1.6, D: 1.5 } as const;

/** "Sweet spot" = up to 6% above the cheapest safe footing. */
export const SWEET_SPOT_TOLERANCE = 0.06;

const CONCRETE_PER_M3 = 246;
const FOOTING_HEIGHT = 0.5; // m
const EXCAVATION_PER_M3 = 25;
const SHORING_PER_M3 = 60;
const SHORING_FROM_DEPTH = 2; // m
const WORK_MARGIN = 0.6; // m added to B for the excavation pit

export function sptN(depth: number): number {
  for (let i = 0; i < SPT.length - 1; i++) {
    const a = SPT[i];
    const b = SPT[i + 1];
    if (!a || !b) break;
    if (depth <= b[0]) return a[1] + ((b[1] - a[1]) * (depth - a[0])) / (b[0] - a[0]);
  }
  return 23;
}

/** Allowable soil pressure at depth, kPa. */
export function sigmaAdm(depth: number): number {
  return Math.min(400, 20 * sptN(depth));
}

/** Applied soil pressure for a square B x B footing, kPa. */
export function soilPressure(load: number, B: number): number {
  return load / (B * B);
}

export interface CostBreakdown {
  concrete: number;
  excavation: number;
  shoring: number;
  total: number;
}

export function footingCost(B: number, D: number): CostBreakdown {
  const pit = (B + WORK_MARGIN) ** 2;
  const concrete = FOOTING_HEIGHT * B * B * CONCRETE_PER_M3;
  const excavation = pit * D * EXCAVATION_PER_M3;
  const shoring = D > SHORING_FROM_DEPTH ? pit * (D - SHORING_FROM_DEPTH) * SHORING_PER_M3 : 0;
  return { concrete, excavation, shoring, total: concrete + excavation + shoring };
}

export function isSafe(load: number, B: number, D: number): boolean {
  return soilPressure(load, B) <= sigmaAdm(D);
}

export interface Optimum {
  B: number;
  D: number;
  cost: number;
}

/** Grid search for the cheapest safe footing under the given load. */
export function findOptimum(load: number = LOAD_CHANGED): Optimum {
  let best: Optimum = { B: Number.NaN, D: Number.NaN, cost: Infinity };
  const nB = Math.round((RANGE_B.max - RANGE_B.min) / SEARCH_STEP);
  const nD = Math.round((RANGE_D.max - RANGE_D.min) / SEARCH_STEP);
  for (let i = 0; i <= nB; i++) {
    const B = RANGE_B.min + i * SEARCH_STEP;
    for (let j = 0; j <= nD; j++) {
      const D = RANGE_D.min + j * SEARCH_STEP;
      if (!isSafe(load, B, D)) continue;
      const cost = footingCost(B, D).total;
      if (cost < best.cost) best = { B, D, cost };
    }
  }
  return best;
}

let cachedOptimum: Optimum | undefined;
/** Optimum for the changed load (480 kN), computed once. */
export function optimum(): Optimum {
  cachedOptimum ??= findOptimum(LOAD_CHANGED);
  return cachedOptimum;
}

export type FootingStatus = 'fail' | 'over' | 'ok';

export interface FootingResult {
  status: FootingStatus;
  /** Applied pressure, kPa. */
  q: number;
  /** Allowable pressure at D, kPa. */
  sigma: number;
  cost: CostBreakdown;
  /** Cost relative to the cheapest safe footing: 0.1 = 10% above. */
  aboveOptimum: number;
}

export function evaluateFooting(load: number, B: number, D: number): FootingResult {
  const q = soilPressure(load, B);
  const sigma = sigmaAdm(D);
  const cost = footingCost(B, D);
  const opt = optimum().cost;
  const status: FootingStatus =
    q > sigma
      ? 'fail'
      : load >= LOAD_CHANGED && cost.total > opt * (1 + SWEET_SPOT_TOLERANCE)
        ? 'over'
        : 'ok';
  return { status, q, sigma, cost, aboveOptimum: cost.total / opt - 1 };
}
