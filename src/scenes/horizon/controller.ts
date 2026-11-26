/**
 * Horizon controller. Scroll (the dwell progress) drives the camera, the copy and the fall;
 * a render loop draws the shader and the lens flare only while the layer is visible.
 * The shader starts on the first sign of a visitor (pointer, touch, scroll or key) so the
 * text paints first, and quality drops on its own when frames run slow.
 */
import { createFollow } from '../../engine/follow';
import type { SceneController } from '../registry';
import {
  beatAt,
  DEPARTURE_END,
  horizonFrame,
  instruments,
  smooth,
  type HorizonFrame,
} from './beats';
import { createFlare } from './flare';
import { FRAGMENT, UNIFORMS, VERTEX } from './shader';

type Uniform = (typeof UNIFORMS)[number];

/** Where things sit in the departure, in screen units (fractions of the height). */
interface Layout {
  planet: { x: number; y: number; r: number };
  sun: { x: number; y: number };
  worm: { x: number; y: number; r: number };
  tunnel: { x: number; y: number };
}

/**
 * The departure's layout for a frame. The pan carries the planet across the view (the star,
 * farther away, moves less, so the flare changes); the pointer adds a little parallax. The
 * wormhole comes in from the side, so only part of it is in view until the camera is close.
 */
function departureLayout(f: HorizonFrame, aspect: number, look: { x: number; y: number }): Layout {
  const phone = aspect < 0.8;
  // Above and to the right of the title (above it on a phone), drifting left with the pan.
  const r = phone ? 0.15 : 0.24;
  const px = (phone ? 0.14 : 0.62) - f.pan * (phone ? 0.28 : 0.5) - look.x * 0.03;
  const py = (phone ? 0.3 : 0.2) + look.y * 0.02;
  const near = Math.pow(f.approach, 2.4);
  const wx = phone ? 0.32 : 0.95 * Math.min(1, aspect / 1.6);
  const wy = phone ? 0.3 : 0.12;
  return {
    planet: { x: px, y: py, r },
    sun: { x: px - r * 1.55 + f.pan * 0.12 - look.x * 0.01, y: py + r * 0.62 },
    worm: { x: wx * (1 - near), y: wy * (1 - near), r: 0.11 + near * 1.8 },
    // Inside, we are near the right wall looking at the far end, up and to the left; the calm
    // drifts us towards the middle.
    tunnel: { x: -0.3 * (1 - f.calm * 0.8), y: 0.16 * (1 - f.calm * 0.8) },
  };
}

interface Renderer {
  draw(f: HorizonFrame, time: number, clock: number, lay: Layout, flash: number): void;
  slower(): boolean;
}

function createRenderer(canvas: HTMLCanvasElement, coarse: boolean): Renderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const compile = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(
    UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)]),
  ) as Record<Uniform, WebGLUniformLocation | null>;

  // Quality: resolution first, then ray-marching steps.
  let scale = coarse ? 0.55 : 0.75;
  let steps = coarse ? 120 : 200;

  return {
    draw(f, time, clock, lay, flash) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uClock, clock);
      gl.uniform1f(u.uDist, f.dist);
      gl.uniform1f(u.uTilt, f.tilt);
      gl.uniform1f(u.uYaw, f.yaw);
      gl.uniform1f(u.uRoll, f.roll);
      gl.uniform1f(u.uFov, f.fov);
      gl.uniform1f(u.uWarp, f.warp);
      gl.uniform1f(u.uSteps, steps);
      gl.uniform2f(u.uShift, f.sx, f.sy);
      gl.uniform2f(u.uWormC, lay.worm.x, lay.worm.y);
      gl.uniform1f(u.uWormR, lay.worm.r);
      gl.uniform1f(u.uIn, f.inside);
      gl.uniform1f(u.uReveal, f.reveal);
      gl.uniform1f(u.uPlanet, f.planet);
      gl.uniform1f(u.uPan, f.pan);
      gl.uniform2f(u.uSatC, lay.planet.x, lay.planet.y);
      gl.uniform1f(u.uSatR, lay.planet.r);
      gl.uniform2f(u.uSun, lay.sun.x, lay.sun.y);
      gl.uniform2f(u.uTunC, lay.tunnel.x, lay.tunnel.y);
      gl.uniform1f(u.uCalm, f.calm);
      gl.uniform1f(u.uStill, f.still);
      gl.uniform1f(u.uFlash, flash);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    slower() {
      if (scale > 0.4) scale -= 0.1;
      else if (steps > 90) steps -= 30;
      else return false;
      return true;
    },
  };
}

const horizonScene: SceneController = ({ el, mode }) => {
  const q = <T extends Element>(s: string): T | null => el.querySelector<T>(s);
  const glCanvas = q<HTMLCanvasElement>('[data-gl]');
  const fxCanvas = q<HTMLCanvasElement>('[data-fx]');
  const shake = q<HTMLElement>('[data-shake]');
  const flash = q<HTMLElement>('[data-flash]');
  const vignette = q<HTMLElement>('[data-vignette]');
  const hud = q<HTMLElement>('[data-hud]');
  const hint = q<HTMLElement>('[data-hint]');
  const dist = q<HTMLElement>('[data-dist]');
  const time = q<HTMLElement>('[data-time]');
  const hull = q<HTMLElement>('[data-hull]');
  const hullRow = q<HTMLElement>('[data-hull-row]');
  const hullBar = q<HTMLElement>('[data-hull-bar]');
  const beats = [...el.querySelectorAll<HTMLElement>('[data-beat]')];
  const alerts = [...el.querySelectorAll<HTMLElement>('[data-alert]')];
  if (!glCanvas || !fxCanvas) return {};

  const reduce = mode === 'fade';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fx = fxCanvas.getContext('2d');
  const flare = createFlare();

  let p = 0;
  // The camera follows the scroll with some mass: moves start and end slow.
  const view = createFollow(4.2);
  let beat = 0;
  let alertsUp = -1;
  let renderer: Renderer | null | undefined;
  let started = false;
  let visible = false;
  let raf = 0;

  // ---------- pointer (or finger) is the flare's light ----------
  const pointer = { x: 0, y: 0, active: false };
  const aim = (x: number, y: number): void => {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  };
  window.addEventListener('pointermove', (e) => aim(e.clientX, e.clientY), { passive: true });
  const onTouch = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (t) aim(t.clientX, t.clientY);
  };
  window.addEventListener('touchstart', onTouch, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });

  // ---------- loop ----------
  let last = performance.now();
  let clock = 0;
  let diskTime = 0;
  let burst = 0;
  const look = { x: 0, y: 0 };
  let slowFrames = 0;

  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (reduce || Math.abs(p - view.value) > 0.3) view.snap(p);
    const shown = view.step(p, dt);
    const f = horizonFrame(shown, w / Math.max(1, h));
    // Moving fast through the wormhole, the sparks rush faster; in the calm they slow away to
    // nothing, and the still sky does not move at all.
    const rush = (1 + f.turbulence * 2) * (1 - f.calm * 0.9) * (1 - f.still);
    clock += dt * (reduce ? 0.3 : (1 + Math.min(5, Math.abs(view.speed) * 40)) * rush);
    diskTime += dt * (reduce ? 0.25 : 1);

    // In the tunnel the view shakes and bright parts of the universe flash past.
    if (!reduce && f.turbulence > 0.3 && Math.random() < dt * 2.5) burst = 1;
    burst = Math.max(0, burst - dt * 4);
    const quake = reduce ? 0 : f.turbulence * 9 + Math.pow(f.fall, 2) * 18;
    if (pointer.active) {
      look.x += ((pointer.x / Math.max(1, w) - 0.5) * 2 - look.x) * 0.05;
      look.y += ((0.5 - pointer.y / Math.max(1, h)) * 2 - look.y) * 0.05;
    }
    const lay = departureLayout(f, w / Math.max(1, h), look);
    if (shake) {
      shake.style.transform =
        quake > 0.2
          ? `translate(${((Math.random() - 0.5) * quake).toFixed(1)}px, ${((Math.random() - 0.5) * quake).toFixed(1)}px)`
          : '';
    }
    if (flash) flash.style.opacity = String(smooth(0.94, 1, shown));
    if (vignette) vignette.style.opacity = String(f.fall * 0.9);

    if (renderer) {
      renderer.draw(f, diskTime, clock, lay, burst * f.turbulence);
      if (!el.hasAttribute('data-ready')) el.setAttribute('data-ready', '');
      if (dt > 0.028) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 30) {
        slowFrames = 0;
        renderer.slower();
      }
    }
    drawFx(f, w, h, now, lay);
  };

  function drawFx(f: HorizonFrame, w: number, h: number, now: number, lay: Layout): void {
    if (!fx || !fxCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (fxCanvas.width !== Math.round(w * dpr) || fxCanvas.height !== Math.round(h * dpr)) {
      fxCanvas.width = Math.round(w * dpr);
      fxCanvas.height = Math.round(h * dpr);
    }
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, w, h);
    if (!renderer) return;
    // At the planet, the flare belongs to the star; the pan moves it across the lens.
    if (f.planet > 0.01) {
      flare(fx, w / 2 + lay.sun.x * h, h / 2 - lay.sun.y * h, w, h, f.planet * 0.85, now);
      return;
    }
    const show = 1 - f.warp;
    if (show <= 0 || !renderer) return;
    // Without a pointer the flare rests on the disk's bright side.
    const hole = { x: w / 2 + f.sx * h, y: h / 2 - f.sy * h };
    const shadow = (2.6 / (f.dist * f.fov)) * h;
    const lx = pointer.active ? pointer.x : hole.x - Math.cos(f.roll) * shadow * 2.6;
    const ly = pointer.active ? pointer.y : hole.y - Math.sin(f.roll) * shadow * 2.6 * 0.3;
    flare(fx, lx, ly, w, h, show * (pointer.active ? 1 : 0.6), now);
  }

  const run = (): void => {
    if (!raf && visible && started) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = (): void => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  // The shader waits for a visitor and for the scene to be on screen: the first paint is
  // text over the still black hole, and below the landing nothing compiles until the
  // journey is reached.
  let interacted = false;
  const start = (): void => {
    if (started || !interacted || !visible) return;
    started = true;
    renderer = createRenderer(glCanvas, coarse);
    if (!renderer) q<HTMLElement>('[data-no-webgl]')?.removeAttribute('hidden');
    run();
  };
  const onFirstSign = (): void => {
    interacted = true;
    start();
  };
  for (const type of ['pointermove', 'pointerdown', 'scroll', 'keydown', 'touchstart'] as const) {
    window.addEventListener(type, onFirstSign, { once: true, passive: true });
  }

  return {
    onShow() {
      visible = true;
      view.snap(p);
      start();
      run();
    },
    onHide() {
      visible = false;
      stop();
    },
    onProgress(progress) {
      p = progress;
      const b = beatAt(p);
      if (b !== beat) {
        beat = b;
        beats.forEach((node, i) => node.toggleAttribute('data-on', i === b));
      }
      if (hint) hint.style.opacity = p < 0.02 ? '1' : '0';
      el.toggleAttribute('data-past', p > DEPARTURE_END);
      const f = horizonFrame(p, el.clientWidth / Math.max(1, el.clientHeight));
      hud?.toggleAttribute('data-on', f.fall > 0.02 && f.fall < 0.97);
      if (f.fall <= 0) return;
      const ins = instruments(f);
      if (dist) dist.textContent = `${ins.distance.toFixed(2)} rs`;
      if (time) time.textContent = `×${ins.dilation.toFixed(3)}`;
      if (hull) hull.textContent = `${ins.hull}%`;
      if (hullBar) hullBar.style.transform = `scaleX(${ins.hull / 100})`;
      hullRow?.toggleAttribute('data-bad', ins.hull < 50);
      if (ins.alerts !== alertsUp) {
        alertsUp = ins.alerts;
        alerts.forEach((a, i) => a.toggleAttribute('data-on', i < ins.alerts));
      }
    },
  };
};

export default horizonScene;
