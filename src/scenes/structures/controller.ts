/**
 * Structures controller: scroll changes the plans, the sliders and the handles resize the
 * footing, the panels follow, and the sweet spot completes the quest. Only the nodes that
 * show a value are touched, and only when the footing or the plans change.
 */
import { structures } from '../../content/structures';
import { completeQuest } from '../../engine/quests';
import type { SceneController } from '../registry';
import {
  clampB,
  clampD,
  footingView,
  ORIGINAL,
  PLANS_CHANGE_AT,
  soilRows,
  sweetSpot,
} from './footingView';
import { depthAt, sectionGeometry, widthAt, type Rect } from './section';

const SHOW_ME_MS = 1400;

const structuresScene: SceneController = ({ el, mode }) => {
  const q = <T extends Element = HTMLElement>(sel: string): T | null => el.querySelector<T>(sel);
  const svg = q<SVGSVGElement>('[data-section]');
  const width = q<HTMLInputElement>('[data-width]');
  const depth = q<HTMLInputElement>('[data-depth]');
  const showMe = q<HTMLButtonElement>('[data-show-me]');
  const soilToggle = q<HTMLButtonElement>('[data-soil-toggle]');
  const soilBody = q('#soil-table');
  const text = (sel: string, value: string): void => {
    const n = q(sel);
    if (n && n.textContent !== value) n.textContent = value;
  };
  const rect = (sel: string, r: Rect): void => {
    const n = q<SVGRectElement>(sel);
    if (!n) return;
    n.setAttribute('x', r.x.toFixed(1));
    n.setAttribute('y', r.y.toFixed(1));
    n.setAttribute('width', r.w.toFixed(1));
    n.setAttribute('height', r.h.toFixed(1));
  };

  let B: number = ORIGINAL.B;
  let D: number = ORIGINAL.D;
  let changed = false;
  let questDone = false;
  let anim = 0;

  const render = (): void => {
    const v = footingView(B, D, changed, questDone);
    el.dataset['state'] = v.state;
    el.dataset['tone'] = v.tone;
    text('[data-kicker]', v.kicker);
    text('[data-title]', v.title);
    text('[data-text]', v.text);
    text('[data-dims]', v.dims);
    text('[data-pressure]', v.pressure);
    text('[data-cost]', v.cost);
    text('[data-rel]', v.rel);
    q('[data-rel]')?.setAttribute('data-rel-tone', v.relTone);
    text('[data-verdict]', v.verdict);
    text('[data-step-text]', v.stepText);
    text('[data-tag]', v.tag);
    text('[data-load]', structures.section.load(v.load));
    text('[data-width-value]', structures.controls.widthValue(B));
    text('[data-depth-value]', structures.controls.depthValue(D));
    q('[data-bar]')?.style.setProperty('--pct', v.pressurePct.toFixed(1));
    if (width && Number(width.value) !== B) width.value = B.toFixed(2);
    if (depth && Number(depth.value) !== D) depth.value = D.toFixed(2);

    const g = sectionGeometry(B, D);
    rect('[data-pit]', g.pit);
    rect('[data-shoring]', g.shoring);
    rect('[data-column]', g.column);
    rect('[data-footing]', g.footing);
    const bulb = q('[data-bulb]');
    bulb?.setAttribute('cx', g.bulb.cx.toFixed(1));
    bulb?.setAttribute('cy', g.bulb.cy.toFixed(1));
    bulb?.setAttribute('rx', g.bulb.rx.toFixed(1));
    bulb?.setAttribute('ry', g.bulb.ry.toFixed(1));
    q('[data-handle="width"]')?.setAttribute('cx', g.corner.x.toFixed(1));
    q('[data-handle="width"]')?.setAttribute('cy', g.corner.y.toFixed(1));
    q('[data-handle="depth"]')?.setAttribute(
      'transform',
      `translate(${g.arrow.x.toFixed(1)} ${g.arrow.y.toFixed(1)})`,
    );
    q('[data-tag-g]')?.setAttribute(
      'transform',
      `translate(${(g.footing.x + g.footing.w + 10).toFixed(1)} ${(g.footing.y - 22).toFixed(1)})`,
    );

    soilRows(D).forEach((r) => {
      q(`[data-soil-row="${r.depth}"]`)?.toggleAttribute('data-current', r.current);
    });

    if (v.solved && !questDone) {
      questDone = true;
      completeQuest('footing');
      render();
    }
  };

  const set = (nextB: number, nextD: number): void => {
    B = clampB(nextB);
    D = clampD(nextD);
    render();
  };

  /** The visitor took the controls: stop any animation and show the target outline. */
  const touch = (): void => {
    cancelAnimationFrame(anim);
    anim = 0;
    el.setAttribute('data-guide', '');
  };

  width?.addEventListener('input', () => {
    touch();
    set(Number(width.value), D);
  });
  depth?.addEventListener('input', () => {
    touch();
    set(B, Number(depth.value));
  });

  showMe?.addEventListener('click', () => {
    touch();
    const from = { B, D };
    const to = sweetSpot();
    if (mode === 'fade') {
      set(to.B, to.D);
      return;
    }
    const t0 = performance.now();
    const step = (now: number): void => {
      const u = Math.min(1, (now - t0) / SHOW_ME_MS);
      const e = u * u * (3 - 2 * u);
      set(from.B + (to.B - from.B) * e, from.D + (to.D - from.D) * e);
      anim = u < 1 ? requestAnimationFrame(step) : 0;
    };
    anim = requestAnimationFrame(step);
  });

  soilToggle?.addEventListener('click', () => {
    const open = soilToggle.getAttribute('aria-expanded') !== 'true';
    soilToggle.setAttribute('aria-expanded', String(open));
    soilBody?.toggleAttribute('data-open', open);
  });

  // Handles on the cross-section: the corner sets the width, the arrow the depth.
  const toSvg = (e: PointerEvent): DOMPoint | undefined => {
    const m = svg?.getScreenCTM();
    if (!svg || !m) return undefined;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  };
  el.querySelectorAll<SVGElement>('[data-handle]').forEach((handle) => {
    const kind = handle.dataset['handle'];
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touch();
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      const p = toSvg(e);
      if (!p) return;
      if (kind === 'width') set(widthAt(p.x), D);
      else set(B, depthAt(p.y));
    });
    const end = (e: PointerEvent): void => {
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  });

  render();

  return {
    onProgress(p) {
      const next = p >= PLANS_CHANGE_AT;
      if (next === changed) return;
      changed = next;
      render();
    },
    onHide() {
      cancelAnimationFrame(anim);
      anim = 0;
    },
  };
};

export default structuresScene;
