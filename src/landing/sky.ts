// Decoration for the landing: stars with a little parallax, the nebula under the pointer and
// the small black hole at the door. Everything here is optional; the page reads fine without it.
import { createNebula, type Nebula } from './nebula';
import { fadeTrail, isIdle, pushPoint, wanderer, type TrailPoint } from './trail';

/** The wanderer drops a faint point every 120 ms; about ten overlap, so keep each one weak. */
const WANDER_STRENGTH = 0.07;
/** Frames measured before deciding whether the nebula stays. */
const PROBE_FRAMES = 12;
/** Average seconds per frame above which the nebula is dropped. */
const SLOW_FRAME = 1 / 24;

interface Star {
  x: number;
  y: number;
  near: boolean;
  a: number;
}

export function startSky(): void {
  const stars = document.querySelector<HTMLCanvasElement>('[data-stars]');
  const nebulaCanvas = document.querySelector<HTMLCanvasElement>('[data-nebula]');
  const ring = document.querySelector<HTMLCanvasElement>('[data-ring]');
  if (!stars || !nebulaCanvas || !ring) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let nebula: Nebula | null = createNebula(nebulaCanvas, coarse ? 0.35 : 0.5);
  if (nebula) nebulaCanvas.dataset['ready'] = '';

  // ---------- pointer trail ----------
  const trail: TrailPoint[] = [];
  let lastPush = 0;
  let pointed = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pointed = true;
      const now = performance.now();
      const head = trail[0];
      if (now - lastPush > 40 || !head) {
        pushPoint(trail, { x: e.clientX, y: e.clientY, s: 1 });
        lastPush = now;
      } else {
        head.x = e.clientX;
        head.y = e.clientY;
        head.s = 1;
      }
    },
    { passive: true },
  );

  // ---------- stars ----------
  const sky = stars.getContext('2d');
  const field: Star[] = Array.from({ length: 220 }, () => ({
    x: Math.random(),
    y: Math.random(),
    near: Math.random() < 0.3,
    a: 0.3 + Math.random() * 0.7,
  }));
  function drawStars(now: number): void {
    if (!sky || !stars) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (stars.width !== Math.round(w * dpr) || stars.height !== Math.round(h * dpr)) {
      stars.width = Math.round(w * dpr);
      stars.height = Math.round(h * dpr);
    }
    sky.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky.clearRect(0, 0, w, h);
    sky.fillStyle = '#e9e6df';
    for (const s of field) {
      const depth = s.near ? 1 : 0.4;
      const y = (((s.y * h - window.scrollY * 0.05 * depth) % h) + h) % h;
      const twinkle = reduce ? 1 : 0.6 + 0.4 * Math.sin(now / 900 + s.x * 40);
      sky.globalAlpha = s.a * twinkle;
      const size = s.near ? 1.6 : 1;
      sky.fillRect(s.x * w, y, size, size);
    }
    sky.globalAlpha = 1;
  }

  // ---------- the black hole at the door ----------
  const rc = ring.getContext('2d');
  let ringVisible = false;
  new IntersectionObserver(([e]) => (ringVisible = !!e?.isIntersecting), {
    rootMargin: '200px',
  }).observe(ring);
  function drawRing(now: number): void {
    if (!rc || !ring) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = ring.clientWidth;
    if (ring.width !== Math.round(size * dpr)) ring.width = ring.height = Math.round(size * dpr);
    rc.setTransform(dpr, 0, 0, dpr, 0, 0);
    rc.clearRect(0, 0, size, size);
    const c = size / 2;
    const r = size * 0.2;
    // The far side of the disk, bent over the top of the hole.
    for (let i = 0; i < 60; i++) {
      rc.beginPath();
      rc.ellipse(c, c, r * (1.25 + i * 0.012), r * (1.25 + i * 0.012), 0, Math.PI, 2 * Math.PI);
      rc.strokeStyle = `rgba(255,${180 + i},${120 + i},${0.05 + 0.25 * (1 - i / 60)})`;
      rc.lineWidth = 1;
      rc.stroke();
    }
    const flat = (front: boolean): void => {
      for (let i = 0; i < 70; i++) {
        const rr = r * (1.3 + i * 0.03);
        const flicker = reduce ? 1 : 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(now / 700 + i));
        rc.beginPath();
        rc.ellipse(
          c,
          c + r * 0.05,
          rr,
          rr * 0.13,
          0,
          front ? 0 : Math.PI,
          front ? Math.PI : 2 * Math.PI,
        );
        rc.strokeStyle = `rgba(255,${150 + i},${90 + i},${(0.03 + 0.12 * (1 - i / 70)) * flicker})`;
        rc.lineWidth = 1.2;
        rc.stroke();
      }
    };
    flat(false);
    rc.beginPath();
    rc.arc(c, c, r, 0, Math.PI * 2);
    rc.fillStyle = '#000';
    rc.fill();
    rc.beginPath();
    rc.arc(c, c, r * 1.02, 0, Math.PI * 2);
    rc.strokeStyle = 'rgba(255,225,190,.7)';
    rc.lineWidth = 1.5;
    rc.stroke();
    flat(true);
  }

  // ---------- loop ----------
  const probe = { frames: 0, total: 0 };
  let time = 0;
  let last = performance.now();
  let lastWander = 0;
  function frame(now: number): void {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    fadeTrail(trail, dt);
    // Nobody pointing (phones, or the mouse left): a slow wanderer keeps one window open.
    if ((!pointed || isIdle(trail)) && now - lastWander > 120) {
      const p = wanderer(time, window.innerWidth, window.innerHeight);
      pushPoint(trail, { ...p, s: WANDER_STRENGTH });
      lastWander = now;
    }
    if (nebula) {
      nebula.draw(time, trail);
      // A device that cannot keep up loses the nebula and keeps the stars.
      if (probe.frames < PROBE_FRAMES) {
        probe.frames++;
        probe.total += dt;
        if (probe.frames === PROBE_FRAMES && probe.total / PROBE_FRAMES > SLOW_FRAME) {
          nebula = null;
          delete nebulaCanvas?.dataset['ready'];
        }
      }
    }
    drawStars(now);
    if (ringVisible) drawRing(now);
  }

  if (reduce) {
    // Still sky: one frame, redrawn only when the page changes size or scrolls.
    const still = (): void => {
      trail.length = 0;
      const p = wanderer(0, window.innerWidth, window.innerHeight);
      pushPoint(trail, { ...p, s: 0.4 });
      nebula?.draw(0, trail);
      drawStars(0);
      drawRing(0);
    };
    still();
    window.addEventListener('resize', still);
    window.addEventListener('scroll', () => drawStars(0), { passive: true });
    return;
  }

  let raf = 0;
  const run = (now: number): void => {
    frame(now);
    raf = requestAnimationFrame(run);
  };
  raf = requestAnimationFrame(run);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(run);
    }
  });
}

/** Marks the section being read in the side navigation. */
export function trackSections(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-section-nav] a')];
  if (!links.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of links) {
          if (a.hash === `#${e.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  for (const a of links) {
    const section = document.getElementById(a.hash.slice(1));
    if (section) io.observe(section);
  }
}
