/**
 * Prologue controller: the look-up animation (--a), the panorama yaw, the dials and the
 * exposure. State changes only touch the few nodes that show it; nothing re-renders.
 */
import { prologue } from '../../content/prologue';
import { completeQuest } from '../../engine/quests';
import {
  AUTO_SETTINGS,
  INITIAL_SETTINGS,
  stepDial,
  type CameraSettings,
  type DialKey,
} from '../../models/exposure';
import type { SceneController } from '../registry';
import {
  DIALS,
  dialDisplay,
  dialRotation,
  exposureView,
  initialYaw,
  scenePhase,
  yawForPointer,
} from './camera';

/** Horizontal drag (px) that turns a dial one stop. */
const DRAG_STEP = 28;

const prologueScene: SceneController = ({ el }) => {
  const q = <T extends Element = HTMLElement>(sel: string): T | null => el.querySelector<T>(sel);
  const vf = q('[data-vf]');
  const pano = q('[data-pano]');
  const wash = q('[data-wash]');
  const grain = q('[data-grain]');
  const exif = q('[data-exif]');
  const evLabel = q('[data-ev]');
  const kicker = q('[data-kicker]');
  const status = q('[data-status]');
  const needle = q('[data-needle]');
  const slot = q('[data-slot]');
  const hero = q('[data-hero]');
  const camUi = q('[data-cam-ui]');
  const autoBtn = q<HTMLButtonElement>('[data-auto]');

  let settings: CameraSettings = { ...INITIAL_SETTINGS };
  let sunDown = false;
  let phase = -1;
  let lastA = -1;
  let questDone = false;
  let baseYaw = 0;
  let yaw = 0;

  // ---------- exposure and dials ----------

  const renderDial = (key: DialKey): void => {
    const box = q(`[data-dial="${key}"]`);
    if (!box) return;
    const i = settings[key];
    const knob = box.querySelector<HTMLElement>('[role="slider"]');
    knob?.setAttribute('aria-valuenow', String(i));
    knob?.setAttribute('aria-valuetext', DIALS[key].values[i] ?? '');
    box.querySelector<HTMLElement>('.ring')?.style.setProperty('--rot', `${dialRotation(i)}deg`);
    box.querySelector<HTMLElement>('.cells')?.style.setProperty('--i', String(i));
    box.querySelectorAll('.tick').forEach((t, n) => t.toggleAttribute('data-on', n === i));
    const value = box.querySelector('[data-value]');
    if (value) value.textContent = prologue.camera.dialValue(DIALS[key].label, dialDisplay(key, i));
  };

  const render = (): void => {
    const v = exposureView(settings, sunDown);
    if (pano) pano.style.filter = v.fx.filter;
    if (wash) {
      wash.style.background = v.fx.washColor;
      wash.style.opacity = v.fx.wash.toFixed(3);
    }
    if (grain) grain.style.opacity = String(v.fx.noise);
    if (exif) exif.textContent = v.exif;
    if (evLabel) evLabel.textContent = v.fx.evLabel;
    if (kicker) kicker.textContent = v.kicker;
    if (status) status.textContent = v.status;
    needle?.style.setProperty('--x', `${v.meter}%`);
    el.dataset['tone'] = v.tone;
    el.toggleAttribute('data-done', v.done);
    if (v.done && !questDone) {
      questDone = true;
      completeQuest('exposure');
    }
  };

  const set = (next: CameraSettings): void => {
    const changed = (Object.keys(DIALS) as DialKey[]).filter((k) => next[k] !== settings[k]);
    settings = next;
    changed.forEach(renderDial);
    render();
  };

  const step = (key: DialKey, delta: number): void => set(stepDial(settings, key, delta));

  (Object.keys(DIALS) as DialKey[]).forEach((key) => {
    const box = q(`[data-dial="${key}"]`);
    const knob = box?.querySelector<HTMLElement>('[role="slider"]');
    if (!box || !knob) return;

    box.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) => {
      b.addEventListener('click', () => step(key, Number(b.dataset['step'])));
    });

    knob.addEventListener('keydown', (e) => {
      const d =
        e.key === 'ArrowRight' || e.key === 'ArrowUp'
          ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
            ? -1
            : 0;
      if (!d) return;
      e.preventDefault();
      step(key, d);
    });

    // The wheel turns a dial only while it has focus, so it never hijacks the page scroll.
    knob.addEventListener(
      'wheel',
      (e) => {
        if (document.activeElement !== knob || e.deltaY === 0) return;
        e.preventDefault();
        step(key, e.deltaY < 0 ? 1 : -1);
      },
      { passive: false },
    );

    // Drag sideways to turn. touch-action: pan-y leaves vertical swipes to the page.
    let startX = 0;
    let acc = 0;
    let moved = false;
    let down = false;
    knob.addEventListener('pointerdown', (e) => {
      down = true;
      moved = false;
      startX = e.clientX;
      acc = 0;
      knob.setPointerCapture(e.pointerId);
    });
    knob.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      const stops = Math.trunc(dx / DRAG_STEP) - acc;
      if (stops !== 0) {
        acc += stops;
        // The ticks follow the finger: dragging left brings the next stop under the mark.
        step(key, -stops);
      }
    });
    const end = (e: PointerEvent): void => {
      if (!down) return;
      down = false;
      if (knob.hasPointerCapture(e.pointerId)) knob.releasePointerCapture(e.pointerId);
      // A plain click on a round dial turns it up one stop, like the prototype.
      if (!moved && key !== 'aperture' && e.type === 'pointerup') step(key, 1);
    };
    knob.addEventListener('pointerup', end);
    knob.addEventListener('pointercancel', end);
  });

  autoBtn?.addEventListener('click', () => {
    // Before the sun goes down AUTO just puts the camera back to the correct exposure.
    set({ ...settings, ...(sunDown ? AUTO_SETTINGS : INITIAL_SETTINGS), film: settings.film });
  });

  // ---------- viewfinder: look around ----------

  const setYaw = (px: number): void => {
    yaw = px;
    pano?.style.setProperty('--yaw', `${Math.round(px)}px`);
  };

  let touchX: number | undefined;
  /** The visitor has looked around; layout changes keep their view. */
  let looked = false;
  el.addEventListener('pointermove', (e) => {
    if (phase !== 0 || !vf) return;
    looked = true;
    if (e.pointerType === 'mouse') {
      const r = vf.getBoundingClientRect();
      setYaw(yawForPointer(baseYaw, (e.clientX - r.left) / Math.max(1, r.width), r.height));
    } else if (touchX !== undefined) {
      setYaw(yaw + (e.clientX - touchX) * 2);
      touchX = e.clientX;
    }
  });
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') touchX = e.clientX;
  });
  const endTouch = (): void => {
    touchX = undefined;
  };
  el.addEventListener('pointerup', endTouch);
  el.addEventListener('pointercancel', endTouch);

  // ---------- layout: where the viewfinder lands (the camera's screen) ----------

  const measure = (): void => {
    if (vf) {
      baseYaw = initialYaw(vf.offsetWidth, vf.offsetHeight);
      if (!looked) setYaw(baseYaw);
    }
    if (!slot) return;
    const box = el.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    // The layer may be scaled while flying; measure in its own pixels.
    const k = el.offsetWidth / Math.max(1, box.width);
    el.style.setProperty('--ct', `${(r.top - box.top) * k}px`);
    el.style.setProperty('--cl', `${(r.left - box.left) * k}px`);
    el.style.setProperty('--cr', `${(box.right - r.right) * k}px`);
    el.style.setProperty('--cb', `${(box.bottom - r.bottom) * k}px`);
  };

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;

  return {
    onShow() {
      measure();
      // The screen moves when the copy above it reflows (fonts, rotation), not only on resize.
      ro?.observe(el);
      if (slot) ro?.observe(slot);
      void document.fonts?.ready.then(measure);
    },
    onHide() {
      ro?.disconnect();
    },
    onProgress(p) {
      const s = scenePhase(p);
      if (Math.abs(s.a - lastA) > 0.0005) {
        lastA = s.a;
        el.style.setProperty('--a', s.a.toFixed(4));
      }
      if (s.phase === phase) return;
      phase = s.phase;
      el.dataset['phase'] = String(phase);
      if (hero) hero.inert = phase !== 0;
      if (camUi) camUi.inert = phase === 0;
      measure();
      // Beat 3: the sun goes down once and stays down.
      if (phase === 2 && !sunDown) {
        sunDown = true;
        render();
      }
    },
  };
};

export default prologueScene;
