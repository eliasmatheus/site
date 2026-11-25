/**
 * The Call controller: scroll drives the beats. Per frame it writes a few CSS variables;
 * the DOM (which vignette, which line, which skills) only changes when the step does.
 */
import { call } from '../../content/call';
import type { SceneController } from '../registry';
import {
  callState,
  cursorAt,
  MEMORY_KB,
  memoryCount,
  MONTAGE_LENGTH,
  type CallBeat,
} from './beats';

const callScene: SceneController = ({ el, mode }) => {
  const vigs = [...el.querySelectorAll<HTMLElement | SVGElement>('.vig[data-k]')];
  const lines = [...el.querySelectorAll<HTMLElement>('.line[data-k]')];
  const chips = [...el.querySelectorAll<HTMLElement>('[data-skill]')];
  const cards = [...el.querySelectorAll<HTMLElement>('[data-card]')];
  const mem = el.querySelector<HTMLElement>('[data-mem]');
  const toastSkill = el.querySelector<HTMLElement>('[data-toast-skill]');
  // Reduced motion: the choice appears already made.
  const settled = mode === 'fade';

  let step = -1;
  let beat: CallBeat | undefined;
  let skills = -1;
  let memKb = -1;
  let toast = false;
  let over: string | undefined = 'none';
  let chosen = false;

  const setVar = (name: string, value: number): void => {
    el.style.setProperty(name, value.toFixed(4));
  };

  return {
    onProgress(p) {
      const s = callState(p);

      // Local progress for whichever beat is on; the others rest at their end state.
      setVar('--b', s.beat === 'boot' ? s.local : 1);
      setVar('--v', s.beat === 'montage' ? s.local : 1);
      setVar('--f', s.beat === 'montage' ? (s.local * 3) % 1 : 1);
      setVar('--c', s.beat === 'choice' ? (settled ? 1 : s.local) : s.beat === 'save' ? 1 : 0);
      setVar('--s', s.beat === 'save' ? s.local : 0);

      const beatChanged = s.beat !== beat;
      if (beatChanged) {
        beat = s.beat;
        el.dataset['beat'] = beat;
      }

      if (s.step !== step) {
        step = s.step;
        const key = String(step);
        // Past the montage the screen keeps the last vignette while the monitor fades out.
        const vigKey = String(Math.min(step, MONTAGE_LENGTH));
        vigs.forEach((v) => v.toggleAttribute('data-on', v.getAttribute('data-k') === vigKey));
        lines.forEach((l) => l.toggleAttribute('data-on', l.dataset['k'] === key));
        if (s.beat === 'montage') {
          const m = call.montage[step - 1];
          if (toastSkill && m) toastSkill.textContent = m.skill;
        }
      }

      if (mem) {
        const kb = s.beat === 'boot' ? memoryCount(s.local) : MEMORY_KB;
        if (kb !== memKb) {
          memKb = kb;
          mem.textContent = call.boot.memoryLine(kb, kb === MEMORY_KB);
        }
      }

      if (s.skills !== skills || beatChanged) {
        skills = s.skills;
        chips.forEach((c, i) => {
          c.toggleAttribute('data-on', i < skills);
          c.toggleAttribute('data-new', s.beat === 'montage' && i === skills - 1);
        });
      }

      const t = s.beat === 'montage' && s.local >= 0.25;
      if (t !== toast) {
        toast = t;
        el.toggleAttribute('data-toast-on', t);
      }

      const cur = cursorAt(s.beat === 'choice' ? s.local : 1, settled);
      if (s.beat === 'choice') setVar('--cx', cur.x);
      const nextOver = s.beat === 'choice' ? cur.over : undefined;
      if (nextOver !== over) {
        over = nextOver;
        cards.forEach((c) => {
          if (c.dataset['card'] === over) c.dataset['over'] = over;
          else delete c.dataset['over'];
        });
      }
      const ch = s.beat === 'save' || (s.beat === 'choice' && cur.picked);
      if (ch !== chosen) {
        chosen = ch;
        el.toggleAttribute('data-chosen', ch);
      }
    },
  };
};

export default callScene;
