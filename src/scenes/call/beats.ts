/**
 * The Call: maps the scene's dwell progress (0 to 1) to what is on screen. Pure, no DOM.
 *
 * boot     the first computer starts (memory test counting up)
 * montage  one vignette per scroll step, each unlocking a skill
 * choice   the skills point to COMPUTER SCIENCE; the cursor hesitates and picks CIVIL
 * save     the skills go grey into a save file: "Saved for later."
 */
import { call } from '../../content/call';

export type CallBeat = 'boot' | 'montage' | 'choice' | 'save';

export const MONTAGE_LENGTH = call.montage.length;

// Share of the dwell for each beat. The montage gets most of it: one step per vignette.
const BOOT_END = 0.1;
const MONTAGE_END = 0.72;
const CHOICE_END = 0.88;

/**
 * Where a gesture lands (src/engine/pacing.ts): one line of dialogue or one action per
 * gesture. The boot once the memory test is done; each vignette once its action has played;
 * the cursor hesitating over COMPUTER SCIENCE, then the pick; the save.
 */
export const CALL_STOPS: readonly number[] = [
  BOOT_END * 0.85,
  ...Array.from(
    { length: MONTAGE_LENGTH },
    (_, i) => BOOT_END + ((i + 0.85) / MONTAGE_LENGTH) * (MONTAGE_END - BOOT_END),
  ),
  MONTAGE_END + 0.45 * (CHOICE_END - MONTAGE_END),
  MONTAGE_END + 0.95 * (CHOICE_END - MONTAGE_END),
  CHOICE_END + 0.8 * (1 - CHOICE_END),
];

export type Look = 'handheld' | 'flash' | 'console' | 'life' | 'glass' | 'realm' | 'arena';

/** The dialog box of each step (0 boot, 1..n montage, n+1 choice, n+2 save) and its era tab. */
export const LOOKS: readonly { look: Look; when: string }[] = [
  call.boot,
  ...call.montage,
  { look: call.choiceLook, when: call.when },
  { look: call.choiceLook, when: call.when },
];

/** Size of the RAM in KB, as the BIOS memory test counted it (64 MB). */
export const MEMORY_KB = 65536;

export interface CallState {
  beat: CallBeat;
  /**
   * Step for the text and the screen: 0 boot, 1..n montage vignettes, n+1 choice, n+2 save.
   * Changes rarely; the controller only touches the DOM when it changes.
   */
  step: number;
  /** Progress 0 to 1 inside the current beat (or the current vignette, in the montage). */
  local: number;
  /** Skills unlocked so far (0 to n). */
  skills: number;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function callState(progress: number, n = MONTAGE_LENGTH): CallState {
  const p = clamp01(progress);
  if (p < BOOT_END) return { beat: 'boot', step: 0, local: p / BOOT_END, skills: 0 };
  if (p < MONTAGE_END) {
    const t = ((p - BOOT_END) / (MONTAGE_END - BOOT_END)) * n;
    const i = Math.min(n - 1, Math.floor(t));
    // The skill unlocks a little into its vignette, once the picture has settled.
    const local = t - i;
    return { beat: 'montage', step: i + 1, local, skills: i + (local >= 0.25 ? 1 : 0) };
  }
  if (p < CHOICE_END) {
    return {
      beat: 'choice',
      step: n + 1,
      local: (p - MONTAGE_END) / (CHOICE_END - MONTAGE_END),
      skills: n,
    };
  }
  return { beat: 'save', step: n + 2, local: (p - CHOICE_END) / (1 - CHOICE_END), skills: n };
}

/** The memory test counter during the boot, in KB. Reaches the total at 70% of the boot. */
export function memoryCount(bootLocal: number): number {
  const t = clamp01(bootLocal / 0.7);
  // Count in 1024 KB blocks, like the real test.
  return Math.round((t * MEMORY_KB) / 1024) * 1024;
}

export type CardId = 'civil' | 'cs' | 'arch';

export interface CursorState {
  /** Horizontal position over the cards row, 0 to 100 (%). Card centers: 1/6, 1/2, 5/6. */
  x: number;
  /** Card under the cursor (or highlighted, on mobile), if any. */
  over: CardId | undefined;
  /** CIVIL ENGINEERING has been clicked. */
  picked: boolean;
}

const CENTER: Record<CardId, number> = { civil: 100 / 6, cs: 50, arch: 500 / 6 };

const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp01(t);
const ease = (t: number): number => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/**
 * The cursor during the choice beat. It drifts to COMPUTER SCIENCE, hesitates there,
 * slides past it and clicks CIVIL ENGINEERING. With `settled` (reduced motion) the choice
 * is already made.
 */
export function cursorAt(choiceLocal: number, settled = false): CursorState {
  if (settled) return { x: CENTER.civil, over: 'civil', picked: true };
  const c = clamp01(choiceLocal);
  if (c < 0.3) {
    // From below the cards, over to COMPUTER SCIENCE.
    return {
      x: lerp(70, CENTER.cs, ease(c / 0.3)),
      over: c > 0.2 ? 'cs' : undefined,
      picked: false,
    };
  }
  if (c < 0.55) {
    // Hesitates: a small wobble on COMPUTER SCIENCE.
    const w = Math.sin(((c - 0.3) / 0.25) * Math.PI * 3) * 3;
    return { x: CENTER.cs + w, over: 'cs', picked: false };
  }
  if (c < 0.8) {
    const x = lerp(CENTER.cs, CENTER.civil, ease((c - 0.55) / 0.25));
    return { x, over: x < (CENTER.civil + CENTER.cs) / 2 ? 'civil' : 'cs', picked: false };
  }
  return { x: CENTER.civil, over: 'civil', picked: true };
}
