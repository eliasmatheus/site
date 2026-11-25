import { describe, expect, it } from 'vitest';
import {
  evaluateFooting,
  findOptimum,
  footingCost,
  INITIAL_PHASE2,
  LOAD_CHANGED,
  LOAD_ORIGINAL,
  optimum,
  sigmaAdm,
  sptN,
} from './footing';

describe('soil profile', () => {
  it('interpolates SPT linearly and holds N = 23 below 4 m', () => {
    expect(sptN(0)).toBe(4);
    expect(sptN(0.5)).toBe(5);
    expect(sptN(2.5)).toBe(15);
    expect(sptN(4)).toBe(23);
    expect(sptN(6)).toBe(23);
  });

  it('caps allowable pressure at 400 kPa', () => {
    expect(sigmaAdm(1)).toBe(120);
    expect(sigmaAdm(3)).toBe(400);
    expect(sigmaAdm(5)).toBe(400);
  });
});

describe('cost', () => {
  it('adds shoring only below 2 m', () => {
    expect(footingCost(1, 2).shoring).toBe(0);
    const c = footingCost(1, 3);
    expect(c.concrete).toBeCloseTo(123);
    expect(c.excavation).toBeCloseTo(2.56 * 3 * 25);
    expect(c.shoring).toBeCloseTo(2.56 * 60);
    expect(c.total).toBeCloseTo(c.concrete + c.excavation + c.shoring);
  });
});

describe('optimum', () => {
  it('matches the documented sweet spot (B ≈ 1.16 m, D ≈ 2.74 m, ≈ $514)', () => {
    const opt = findOptimum(LOAD_CHANGED);
    expect(opt.B).toBeCloseTo(1.16, 2);
    expect(opt.D).toBeCloseTo(2.74, 1);
    expect(Math.round(opt.cost)).toBeGreaterThanOrEqual(510);
    expect(Math.round(opt.cost)).toBeLessThanOrEqual(518);
    expect(optimum()).toEqual(opt);
  });

  it('the optimum is safe', () => {
    const opt = optimum();
    expect(evaluateFooting(LOAD_CHANGED, opt.B, opt.D).status).toBe('ok');
  });
});

describe('status', () => {
  it('phase 1: the original design passes', () => {
    const r = evaluateFooting(LOAD_ORIGINAL, INITIAL_PHASE2.B, INITIAL_PHASE2.D);
    expect(r.status).toBe('ok');
  });

  it('phase 2 starts failing', () => {
    const r = evaluateFooting(LOAD_CHANGED, INITIAL_PHASE2.B, INITIAL_PHASE2.D);
    expect(r.q).toBeGreaterThan(r.sigma);
    expect(r.status).toBe('fail');
  });

  it('step 1: wider footing becomes safe but expensive', () => {
    // At D = 1.5 m sigma = 150 kPa, so B needs ~1.79 m.
    const r = evaluateFooting(LOAD_CHANGED, 1.9, INITIAL_PHASE2.D);
    expect(r.status).toBe('over');
  });

  it('step 2: deeper on the firm layer is still safe and still expensive', () => {
    const r = evaluateFooting(LOAD_CHANGED, 1.9, 2.5);
    expect(r.status).toBe('over');
  });

  it('step 3: shrink back to the sweet spot', () => {
    const opt = optimum();
    const near = evaluateFooting(LOAD_CHANGED, opt.B + 0.04, opt.D);
    expect(near.status).toBe('ok');
    expect(near.aboveOptimum).toBeLessThanOrEqual(0.06);
    expect(evaluateFooting(LOAD_CHANGED, 1.0, opt.D).status).toBe('fail');
  });
});
