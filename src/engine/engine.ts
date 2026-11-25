/**
 * Scroll engine runtime: one requestAnimationFrame loop that reads scrollY and writes
 * only transforms, opacity, visibility and CSS custom properties. No scroll-jacking:
 * the document scrolls natively and its height is the timeline length plus one viewport.
 */
import { layerStyle, type StageMode } from './layers';
import {
  activeIndex,
  createTimeline,
  journeyProgress,
  locate,
  sceneProgress,
  scrollForScene,
  type ScenePlacement,
  type Timeline,
  type TimelineConfig,
} from './timeline';

/** Hooks a scene can register. All optional; none of them runs every frame except onProgress. */
export interface SceneHooks {
  /** Once, when the camera gets within one scene. Load heavy code and assets here. */
  onNear?(): void;
  /** The layer became visible (start render loops). */
  onShow?(): void;
  /** The layer became hidden (stop render loops). */
  onHide?(): void;
  /** The scene became the one the visitor is in. */
  onEnter?(): void;
  /** The visitor left the scene. */
  onLeave?(): void;
  /** Every frame while visible, with the dwell progress 0 to 1. Keep it cheap. */
  onProgress?(progress: number): void;
}

export const MODE_CONFIG: Record<StageMode, TimelineConfig> = {
  fly: { travel: 1000, zStep: 3000 },
  stack: { travel: 600, zStep: 3000 },
  fade: { travel: 400, zStep: 3000 },
};

export interface EngineOptions {
  /** Tall element whose height drives the scroll. */
  root: HTMLElement;
  /** Sticky full-screen element holding the layers. */
  stage: HTMLElement;
  /** One element per scene, in journey order, each with data-scene="<id>". */
  layers: HTMLElement[];
  placements: readonly ScenePlacement[];
  /** Called every frame with the overall progress 0 to 1 (header bar). */
  onJourney?(progress: number, activeId: string): void;
}

export interface Engine {
  register(id: string, hooks: SceneHooks): void;
  mode(): StageMode;
  destroy(): void;
}

export function detectMode(win: Window = window): StageMode {
  if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'fade';
  if (win.matchMedia('(max-width: 767px), (pointer: coarse)').matches) return 'stack';
  return 'fly';
}

interface LayerState {
  /** undefined until the first frame writes it (CSS shows the first layer before that). */
  visible: boolean | undefined;
  near: boolean;
}

export function createEngine(opts: EngineOptions): Engine {
  const { root, stage, layers, placements } = opts;
  const hooks = new Map<string, SceneHooks>();
  const state: LayerState[] = layers.map(() => ({ visible: undefined, near: false }));
  let mode: StageMode = detectMode();
  let tl: Timeline = createTimeline(placements, MODE_CONFIG[mode]);
  let active = -1;
  let raf = 0;
  let destroyed = false;

  const applyHeight = (): void => {
    root.style.height = `calc(${tl.length}px + 100vh)`;
    stage.dataset['mode'] = mode;
  };

  const call = (j: number, name: keyof Omit<SceneHooks, 'onProgress'>): void => {
    const id = placements[j]?.id;
    if (!id) return;
    hooks.get(id)?.[name]?.();
  };

  const frame = (): void => {
    raf = 0;
    if (destroyed) return;
    const y = window.scrollY;
    const loc = locate(tl, y);
    const now = activeIndex(loc.f);

    layers.forEach((el, j) => {
      const s = layerStyle(tl, loc.f, j, mode);
      const st = state[j];
      if (!st) return;
      if (!st.near && Math.abs(j - loc.f) <= 1) {
        st.near = true;
        call(j, 'onNear');
      }
      if (s.visible !== st.visible) {
        const first = st.visible === undefined;
        st.visible = s.visible;
        el.style.visibility = s.visible ? 'visible' : 'hidden';
        if (s.visible || !first) call(j, s.visible ? 'onShow' : 'onHide');
      }
      if (!s.visible) return;
      el.style.opacity = String(s.opacity);
      el.style.transform = s.transform;
      el.style.filter = s.filter;
      el.style.setProperty('--r', `${s.radius}px`);
      el.style.pointerEvents = s.interactive ? 'auto' : 'none';
      el.inert = !s.interactive;
      const p = sceneProgress(tl, y, j);
      el.style.setProperty('--p', p.toFixed(4));
      const id = placements[j]?.id;
      if (id) hooks.get(id)?.onProgress?.(p);
    });

    if (now !== active) {
      if (active >= 0) call(active, 'onLeave');
      active = now;
      call(active, 'onEnter');
      const id = placements[active]?.id ?? '';
      stage.dataset['active'] = id;
      const hash = active === 0 ? '' : `#${id}`;
      if (window.location.hash !== hash) {
        history.replaceState(null, '', hash || window.location.pathname + window.location.search);
      }
    }
    opts.onJourney?.(journeyProgress(tl, loc.f), placements[active]?.id ?? '');
  };

  const schedule = (): void => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const goToHash = (): void => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const j = placements.findIndex((s) => s.id === id);
    if (j >= 0) window.scrollTo({ top: scrollForScene(tl, j), behavior: 'instant' });
  };

  /** Keep the visitor in the same place when the staging mode changes. */
  const onModeChange = (): void => {
    const next = detectMode();
    if (next === mode) return;
    const y = window.scrollY;
    const loc = locate(tl, y);
    const dwell = placements[loc.index]?.dwell ?? 0;
    const dwellEnd = (tl.starts[loc.index] ?? 0) + dwell;
    // Fraction of the flight already done (0 when resting).
    const u = loc.travelling ? (y - dwellEnd) / tl.config.travel : 0;
    mode = next;
    tl = createTimeline(placements, MODE_CONFIG[mode]);
    applyHeight();
    const start = tl.starts[loc.index] ?? 0;
    const top = loc.travelling
      ? start + dwell + u * tl.config.travel
      : start + dwell * loc.progress;
    window.scrollTo({ top, behavior: 'instant' });
    schedule();
  };

  const queries = [
    window.matchMedia('(prefers-reduced-motion: reduce)'),
    window.matchMedia('(max-width: 767px), (pointer: coarse)'),
  ];

  applyHeight();
  // Layers are flat siblings (no preserve-3d, which breaks clicks), so the browser paints
  // them in DOM order. Earlier scenes are always nearer the camera: they go on top.
  layers.forEach((el, j) => {
    el.style.zIndex = String(layers.length - j);
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', goToHash);
  queries.forEach((q) => q.addEventListener('change', onModeChange));
  if (window.location.hash) goToHash();
  schedule();

  return {
    register(id, h) {
      hooks.set(id, h);
      // A scene that registers late catches up with what already happened.
      const j = placements.findIndex((s) => s.id === id);
      const st = state[j];
      if (!st) return;
      if (st.near) h.onNear?.();
      if (st.visible) h.onShow?.();
      if (j === active) h.onEnter?.();
      schedule();
    },
    mode: () => mode,
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', goToHash);
      queries.forEach((q) => q.removeEventListener('change', onModeChange));
    },
  };
}
