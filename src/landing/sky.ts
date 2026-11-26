// Decoration for the landing: a still nebula painted once, a view that pans across it as the
// visitor moves through the page, a nearer layer of stars and the small black hole at the door.
// Everything here is optional; the page reads fine without it.
import { paintNebula } from './nebula';
import { stepView, viewTarget, type View } from './view';

/** The panorama is this many screens wide (matches the CSS width of the nebula canvas). */
const PANORAMA = 1.7;
/** Nebula opacity at rest; moving the view adds up to the rest. */
const REST_OPACITY = 0.55;

interface Star {
  x: number;
  y: number;
  near: boolean;
  a: number;
}

/** The part of the page being read: the section crossing the middle of the screen. */
function watchSection(ids: readonly string[], onChange: (id: string | null) => void): void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) onChange(e.target.id);
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
}

export function startSky(): void {
  const stars = document.querySelector<HTMLCanvasElement>('[data-stars]');
  const nebula = document.querySelector<HTMLCanvasElement>('[data-nebula]');
  const ring = document.querySelector<HTMLCanvasElement>('[data-ring]');
  if (!stars || !nebula || !ring) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const painted = paintNebula(nebula, coarse ? 0.4 : 0.5);
  if (painted) nebula.dataset['ready'] = '';

  // ---------- where we look ----------
  let section: string | null = null;
  let pointer: number | null = null;
  let view: View = { x: viewTarget(null, null), glow: 0 };
  watchSection(['about', 'experience', 'projects', 'door'], (id) => {
    section = id;
    if (reduce) {
      view = { x: viewTarget(section, null), glow: 0 };
      paint(performance.now());
    }
  });
  if (!coarse && !reduce) {
    window.addEventListener('pointermove', (e) => (pointer = e.clientX / window.innerWidth), {
      passive: true,
    });
  }
  const panWidth = (): number => window.innerWidth * (PANORAMA - 1);
  function applyView(): void {
    if (!nebula) return;
    nebula.style.transform = `translate3d(${(-view.x * panWidth()).toFixed(1)}px, 0, 0)`;
    nebula.style.setProperty('--glow', (REST_OPACITY + (1 - REST_OPACITY) * view.glow).toFixed(3));
  }

  // ---------- nearer stars, a little faster than the nebula ----------
  const sky = stars.getContext('2d');
  const field: Star[] = Array.from({ length: 200 }, () => ({
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
    const pan = view.x * panWidth();
    for (const s of field) {
      const depth = s.near ? 1.35 : 1.15;
      const x = (((s.x * w - pan * depth) % w) + w) % w;
      const y = (((s.y * h - window.scrollY * 0.04 * depth) % h) + h) % h;
      const twinkle = reduce ? 1 : 0.6 + 0.4 * Math.sin(now / 900 + s.x * 40);
      sky.globalAlpha = s.a * twinkle;
      const size = s.near ? 1.6 : 1;
      sky.fillRect(x, y, size, size);
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

  function paint(now: number): void {
    applyView();
    drawStars(now);
    if (ringVisible) drawRing(now);
  }

  const repaintNebula = (): void => {
    paintNebula(nebula, coarse ? 0.4 : 0.5);
    paint(performance.now());
  };
  // Phones resize on every toolbar show and hide; only a new width needs a new painting.
  let paintedWidth = window.innerWidth;
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === paintedWidth) return paint(performance.now());
    paintedWidth = window.innerWidth;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(repaintNebula, 250);
  });

  if (reduce) {
    // A still sky: the view jumps between spots and is redrawn only when something changes.
    paint(0);
    window.addEventListener('scroll', () => paint(0), { passive: true });
    return;
  }

  let last = performance.now();
  let raf = 0;
  const run = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    view = stepView(view, viewTarget(section, pointer), dt);
    paint(now);
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
