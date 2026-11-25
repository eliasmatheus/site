import { describe, expect, it } from 'vitest';
import { callState, cursorAt, MEMORY_KB, memoryCount, MONTAGE_LENGTH } from './beats';

describe('callState', () => {
  it('boots first', () => {
    expect(callState(0)).toMatchObject({ beat: 'boot', step: 0, skills: 0 });
  });

  it('plays one vignette per step and unlocks every skill', () => {
    const seen = new Set<number>();
    let last = 0;
    for (let p = 0.12; p < 0.7; p += 0.005) {
      const s = callState(p);
      expect(s.beat).toBe('montage');
      seen.add(s.step);
      expect(s.skills).toBeGreaterThanOrEqual(last);
      last = s.skills;
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(
      Array.from({ length: MONTAGE_LENGTH }, (_, i) => i + 1),
    );
    expect(last).toBe(MONTAGE_LENGTH);
  });

  it('then the choice, then the save', () => {
    expect(callState(0.75)).toMatchObject({ beat: 'choice', step: MONTAGE_LENGTH + 1 });
    expect(callState(0.95)).toMatchObject({ beat: 'save', step: MONTAGE_LENGTH + 2 });
    expect(callState(1).local).toBe(1);
  });

  it('never leaves the 0 to 1 range', () => {
    expect(callState(-1).beat).toBe('boot');
    expect(callState(2).beat).toBe('save');
  });
});

describe('memoryCount', () => {
  it('counts up in 1 MB blocks to 65536K', () => {
    expect(memoryCount(0)).toBe(0);
    expect(memoryCount(0.35) % 1024).toBe(0);
    expect(memoryCount(0.7)).toBe(MEMORY_KB);
    expect(memoryCount(1)).toBe(MEMORY_KB);
  });
});

describe('cursorAt', () => {
  it('goes to COMPUTER SCIENCE and hesitates there', () => {
    expect(cursorAt(0.3).over).toBe('cs');
    expect(cursorAt(0.45).over).toBe('cs');
    expect(cursorAt(0.45).picked).toBe(false);
  });

  it('picks CIVIL ENGINEERING in the end', () => {
    expect(cursorAt(0.9)).toMatchObject({ over: 'civil', picked: true });
    expect(cursorAt(0.9).x).toBeCloseTo(100 / 6);
  });

  it('with reduced motion the choice is already made', () => {
    expect(cursorAt(0, true)).toMatchObject({ over: 'civil', picked: true });
  });
});
