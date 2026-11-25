import { describe, expect, it } from 'vitest';
import { footingView, ORIGINAL, soilRows, sweetSpot } from './footingView';

describe('footingView', () => {
  it('everything checks out before the plans change', () => {
    const v = footingView(ORIGINAL.B, ORIGINAL.D, false);
    expect(v.state).toBe('original');
    expect(v.title).toBe('One of the churches, in 3D.');
    expect(v.step).toBeUndefined();
    expect(v.rel).toBe('·');
    expect(v.solved).toBe(false);
  });

  it('the same footing fails under 480 kN: step 1, widen', () => {
    const v = footingView(ORIGINAL.B, ORIGINAL.D, true);
    expect(v.state).toBe('fail');
    expect(v.tone).toBe('fail');
    expect(v.step).toBe('widen');
    expect(v.rel).toBe('unsafe');
    expect(v.pressure).toBe('187 / 150 kPa');
    expect(v.pressurePct).toBe(100);
  });

  it('wide and shallow holds but costs: step 2, deepen', () => {
    const v = footingView(2.2, 1.5, true);
    expect(v.state).toBe('over');
    expect(v.step).toBe('deepen');
    expect(v.rel).toMatch(/^\+\d+%$/);
  });

  it('deep and still wide: step 3, shrink', () => {
    expect(footingView(1.8, 2.7, true).step).toBe('shrink');
  });

  it('the sweet spot solves the quest', () => {
    const s = sweetSpot();
    const v = footingView(s.B, s.D, true);
    expect(v.state).toBe('ok');
    expect(v.step).toBe('done');
    expect(v.rel).toBe('BEST ✓');
    expect(v.solved).toBe(true);
    expect(footingView(s.B, s.D, true, true).kicker).toBe('QUEST COMPLETE · +25 XP');
  });
});

describe('soilRows', () => {
  it('reads the real borehole and lights the row at the footing', () => {
    const rows = soilRows(2.5);
    expect(rows).toHaveLength(7);
    expect(rows.find((r) => r.depth === 3)?.n).toBe(21);
    expect(rows.find((r) => r.depth === 3)?.kpa).toBe(400);
    expect(rows.filter((r) => r.current).map((r) => r.depth)).toEqual([2.5]);
    expect(rows.map((r) => r.layer)).toEqual([
      'soft',
      'soft',
      'soft',
      'firm',
      'firm',
      'stiff',
      'stiff',
    ]);
  });
});
