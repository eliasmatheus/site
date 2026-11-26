/**
 * Pacing: some moments of the journey are told in steps (a line of dialogue, an action) and a
 * fast flick or a long trackpad glide would carry the visitor past several of them. A scene can
 * declare stops (points of its dwell). Inside a run of stops, one gesture moves exactly one
 * stop: the wheel, a swipe or a key starts a short glide to the next one and the rest of that
 * gesture (its momentum) is absorbed. Past the last stop the scroll is native again, so nothing
 * ever locks: every gesture still moves the story forward.
 *
 * The pure helpers at the top are tested; `createPacer` wires them to the window.
 */

/** A run of stops: absolute scroll positions (px), ascending. */
export type Zone = readonly number[];

/** Positions closer than this (px) count as the same stop. */
const EPS = 2;

/**
 * Where a scroll of `delta` px from `y` should land, or undefined to let the browser scroll.
 * Inside a zone it is the next stop in the direction of the scroll. From outside, a scroll
 * that would jump into or across a zone lands on its first (or last) stop instead.
 */
export function stopFor(zones: readonly Zone[], y: number, delta: number): number | undefined {
  if (delta === 0) return undefined;
  for (const zone of zones) {
    const first = zone[0];
    const last = zone[zone.length - 1];
    if (first === undefined || last === undefined) continue;
    if (y >= first - EPS && y <= last + EPS) {
      return delta > 0 ? zone.find((s) => s > y + EPS) : zone.findLast((s) => s < y - EPS);
    }
    if (delta > 0 && y < first && y + delta >= first) return first;
    if (delta < 0 && y > last && y + delta <= last) return last;
  }
  return undefined;
}

/** The first stop a native scroll from `from` to `to` passed over (for touch momentum). */
export function crossedStop(zones: readonly Zone[], from: number, to: number): number | undefined {
  if (to === from) return undefined;
  const all = zones.flat();
  return to > from
    ? all.filter((s) => s > from + EPS && s <= to).sort((a, b) => a - b)[0]
    : all.filter((s) => s < from - EPS && s >= to).sort((a, b) => b - a)[0];
}

/** Glide length (ms) for a distance (px): short hops are quick, long ones read as travel. */
export function glideMs(distance: number): number {
  return Math.round(Math.min(1100, Math.max(550, Math.abs(distance) * 1.6)));
}

/** Ease in and out (cubic). */
export const glideEase = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Splits a stream of wheel events into gestures. A trackpad flick goes on sending events
 * (momentum) for a second or more, with shrinking deltas. A new gesture starts after a pause,
 * when the direction flips, or when the deltas jump well above the fading tail.
 */
export function createWheelGestures(gapMs = 180): (delta: number, time: number) => boolean {
  let last = -Infinity;
  let sign = 0;
  let recent: number[] = [];
  return (delta, time) => {
    const size = Math.abs(delta);
    const s = Math.sign(delta);
    const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const fresh =
      time - last > gapMs || s !== sign || (recent.length >= 3 && size > 12 && size > avg * 2.2);
    last = time;
    sign = s;
    recent = fresh ? [size] : [...recent.slice(-3), size];
    return fresh;
  };
}

export interface Pacer {
  destroy(): void;
}

const KEYS_DOWN = new Set(['ArrowDown', 'PageDown', ' ']);
const KEYS_UP = new Set(['ArrowUp', 'PageUp']);

/**
 * Steps the window's scroll through the zones. `zones` is read on every gesture, so it can
 * follow resizes and mode changes.
 */
export function createPacer(zones: () => readonly Zone[], reduced: () => boolean): Pacer {
  const html = document.documentElement;
  const isNewGesture = createWheelGestures();
  let glide = 0;
  let aim: number | undefined;
  /** The current wheel gesture already landed on a stop: swallow the rest of it. */
  let holding = false;
  let touch:
    | {
        y0: number;
        s0: number;
        t0: number;
        mode: 'wait' | 'page' | 'native';
        to?: number | undefined;
      }
    | undefined;
  /** After a native swipe, its momentum is watched until this time. */
  let momentumUntil = 0;
  let lastY = window.scrollY;

  const jump = (top: number): void => window.scrollTo({ top, behavior: 'instant' });

  const glideTo = (to: number): void => {
    cancelAnimationFrame(glide);
    glide = 0;
    aim = to;
    const from = window.scrollY;
    if (reduced() || Math.abs(to - from) < 1) {
      jump(to);
      aim = undefined;
      return;
    }
    const ms = glideMs(to - from);
    const t0 = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - t0) / ms);
      jump(from + (to - from) * glideEase(t));
      if (t < 1) glide = requestAnimationFrame(step);
      else {
        glide = 0;
        aim = undefined;
      }
    };
    glide = requestAnimationFrame(step);
  };

  const here = (): number => aim ?? window.scrollY;

  const onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const delta = e.deltaY * unit;
    const fresh = isNewGesture(delta, e.timeStamp);
    if (!fresh && holding) {
      e.preventDefault();
      return;
    }
    const to = stopFor(zones(), here(), delta);
    if (to === undefined) {
      holding = false;
      return;
    }
    e.preventDefault();
    holding = true;
    glideTo(to);
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('input, textarea, select, button, [contenteditable]')) return;
    const down = KEYS_DOWN.has(e.key) && !(e.key === ' ' && e.shiftKey);
    const up = KEYS_UP.has(e.key) || (e.key === ' ' && e.shiftKey);
    if (!down && !up) return;
    const big = e.key === 'ArrowDown' || e.key === 'ArrowUp' ? 40 : window.innerHeight * 0.85;
    const to = stopFor(zones(), here(), down ? big : -big);
    if (to === undefined) return;
    e.preventDefault();
    glideTo(to);
  };

  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (!t || e.touches.length > 1) {
      touch = undefined;
      return;
    }
    momentumUntil = 0;
    touch = { y0: t.clientY, s0: here(), t0: e.timeStamp, mode: 'wait' };
  };

  const onTouchMove = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (!touch || !t) return;
    const dy = touch.y0 - t.clientY;
    if (touch.mode === 'wait') {
      if (Math.abs(dy) < 8) return;
      // A swipe inside a zone, or within a screen of it, is paged: it lands on the next stop
      // (or the zone's first). One from further away scrolls natively and its momentum is
      // caught at the first stop it crosses.
      const to = stopFor(zones(), touch.s0, Math.sign(dy) * window.innerHeight);
      touch.mode = to !== undefined && e.cancelable ? 'page' : 'native';
      touch.to = to;
      if (touch.mode === 'page') {
        cancelAnimationFrame(glide);
        glide = 0;
        aim = undefined;
      }
    }
    if (touch.mode !== 'page' || touch.to === undefined) return;
    e.preventDefault();
    // The page follows the finger, up to the next stop.
    const span = touch.to - touch.s0;
    const moved = Math.sign(span) * Math.min(Math.abs(span), Math.max(0, dy * Math.sign(span)));
    jump(touch.s0 + moved);
  };

  const onTouchEnd = (e: TouchEvent): void => {
    if (!touch) return;
    if (touch.mode === 'page' && touch.to !== undefined) {
      const moved = Math.abs(window.scrollY - touch.s0);
      const fast = moved / Math.max(1, e.timeStamp - touch.t0) > 0.3;
      glideTo(moved > 40 || (moved > 12 && fast) ? touch.to : touch.s0);
    } else if (touch.mode === 'native') {
      momentumUntil = performance.now() + 2500;
    }
    lastY = window.scrollY;
    touch = undefined;
  };

  /** A native swipe's momentum stops at the first stop it crosses. */
  const onScroll = (): void => {
    const y = window.scrollY;
    if (momentumUntil > performance.now() && !touch && glide === 0) {
      const s = crossedStop(zones(), lastY, y);
      if (s !== undefined) {
        momentumUntil = 0;
        // iOS ignores a programmatic scroll during momentum unless the scroll is cut first.
        html.style.overflow = 'hidden';
        jump(s);
        requestAnimationFrame(() => {
          html.style.overflow = '';
        });
      }
    }
    lastY = window.scrollY;
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  return {
    destroy() {
      cancelAnimationFrame(glide);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('scroll', onScroll);
    },
  };
}
