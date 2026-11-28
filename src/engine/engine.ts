/**
 * Scroll engine runtime: one requestAnimationFrame loop that reads scrollY and writes
 * only transforms, opacity, visibility and CSS custom properties. The document scrolls
 * natively and its height is the timeline length plus one viewport. The one exception is a
 * scene with stops: there each gesture glides to the next stop (src/engine/pacing.ts).
 */
import { layerStyle, type StageMode } from './layers';
import { createPacer, type Zone } from './pacing';
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
  /**
   * Called when the journey comes into view or leaves it. The journey can start below other
   * content (the landing): until the visitor scrolls down to it, nothing runs.
   */
  onStage?(inView: boolean): void;
  /**
   * The journey fades in over one screen of the content before it (the landing's door)
   * instead of scrolling up from below. The root overlaps that screen (CSS) and the stage
   * stays pinned while it fades in.
   */
  entry?: boolean;
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
  /** Where the journey starts in the document (0 when it is the whole page). */
  let origin = 0;
  let inView: boolean | undefined;

  const findOrigin = (): number =>
    root.getBoundingClientRect().top + window.scrollY + (opts.entry ? window.innerHeight : 0);

  const applyHeight = (): void => {
    root.style.height = `calc(${tl.length}px + ${opts.entry ? 200 : 100}vh)`;
    stage.dataset['mode'] = mode;
    origin = findOrigin();
  };

  const call = (j: number, name: keyof Omit<SceneHooks, 'onProgress'>): void => {
    const id = placements[j]?.id;
    if (!id) return;
    hooks.get(id)?.[name]?.();
  };

  const frame = (): void => {
    raf = 0;
    if (destroyed) return;
    const raw = window.scrollY - origin;
    const y = Math.max(0, raw);
    const loc = locate(tl, y);
    const now = activeIndex(loc.f);
    // Still above the journey (reading the landing): every layer rests, no hash changes.
    const visible = raw > -window.innerHeight;
    let shown = visible;
    if (opts.entry) {
      // Over the end of the last screen before the journey, the stage fades in on top of it.
      // It waits until the door is half gone, so the door reads clean first.
      const span = window.innerHeight * 0.6;
      const fade = Math.min(1, Math.max(0, (raw + span) / span));
      stage.style.opacity = fade.toFixed(3);
      stage.style.visibility = fade > 0 ? '' : 'hidden';
      // Layers set their own pointer-events, so the whole stage opts out while it fades in.
      stage.toggleAttribute('data-entering', fade < 1);
      shown = fade >= 1;
    }
    if (shown !== inView) {
      inView = shown;
      opts.onStage?.(shown);
    }
    if (!visible) {
      layers.forEach((el, j) => {
        const st = state[j];
        if (!st?.visible) return;
        st.visible = false;
        el.style.visibility = 'hidden';
        call(j, 'onHide');
      });
      // Start loading the first scenes a couple of screens before the journey.
      if (raw > -3 * window.innerHeight) prefetch(loc.f);
      return;
    }

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

  function prefetch(f: number): void {
    state.forEach((st, j) => {
      if (!st.near && Math.abs(j - f) <= 1) {
        st.near = true;
        call(j, 'onNear');
      }
    });
  }

  const schedule = (): void => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const goToHash = (): void => {
    // Anyone can write the hash: a malformed one (#%E0) is ignored, not thrown.
    let id = '';
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    const j = placements.findIndex((s) => s.id === id);
    if (j >= 0) window.scrollTo({ top: origin + scrollForScene(tl, j), behavior: 'instant' });
  };

  /** Keep the visitor in the same place when the staging mode changes. */
  const onModeChange = (): void => {
    const next = detectMode();
    if (next === mode) return;
    const y = window.scrollY - origin;
    if (y < 0) {
      // Still above the journey: nothing to keep in place.
      mode = next;
      tl = createTimeline(placements, MODE_CONFIG[mode]);
      applyHeight();
      schedule();
      return;
    }
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
    window.scrollTo({ top: origin + top, behavior: 'instant' });
    schedule();
  };

  /** Content above the journey can change height (fonts, resize): find its start again. */
  const onResize = (): void => {
    origin = findOrigin();
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
  window.addEventListener('resize', onResize);
  // Late fonts and images move the journey without a resize event: the page's height tells.
  const grows = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(onResize);
  grows?.observe(document.body);
  window.addEventListener('hashchange', goToHash);
  queries.forEach((q) => q.addEventListener('change', onModeChange));
  // Stops in document px, read on each gesture so they follow resizes and mode changes.
  const zones = (): Zone[] =>
    placements.flatMap((s, j) =>
      s.stops?.length
        ? [s.stops.map((p) => Math.round(origin + (tl.starts[j] ?? 0) + s.dwell * p))]
        : [],
    );
  const pacer = placements.some((s) => s.stops?.length)
    ? createPacer(zones, () => mode === 'fade')
    : undefined;
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
      window.removeEventListener('resize', onResize);
      grows?.disconnect();
      window.removeEventListener('hashchange', goToHash);
      queries.forEach((q) => q.removeEventListener('change', onModeChange));
      pacer?.destroy();
    },
  };
}
