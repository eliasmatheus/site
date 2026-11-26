/**
 * Horizon controller. Scroll (the dwell progress) drives the camera, the copy and the fall;
 * a render loop draws the shader and the lens flare only while the layer is visible.
 * The shader starts on the first sign of a visitor (pointer, touch, scroll or key) so the
 * text paints first, and quality drops on its own when frames run slow.
 */
import type { SceneController } from '../registry';
import { beatAt, horizonFrame, instruments, smooth, type HorizonFrame } from './beats';
import { createFlare } from './flare';
import { FRAGMENT, UNIFORMS, VERTEX } from './shader';

type Uniform = (typeof UNIFORMS)[number];

interface Renderer {
  draw(f: HorizonFrame, time: number, clock: number): void;
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
    draw(f, time, clock) {
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
  let prevWarp = 1;
  let kick = 0;
  let slowFrames = 0;

  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const f = horizonFrame(p, w / Math.max(1, h));
    clock += dt * (reduce ? 0.3 : 1);
    diskTime += dt * (reduce ? 0.25 : 1);

    // The hard stop out of the wormhole: a jolt and a flash.
    if (prevWarp > 0.5 && f.warp <= 0.5) kick = 1;
    prevWarp = f.warp;
    kick = Math.max(0, kick - dt * 1.6);
    const quake = reduce ? 0 : kick * 14 + Math.pow(f.fall, 2) * 18;
    if (shake) {
      shake.style.transform =
        quake > 0.2
          ? `translate(${((Math.random() - 0.5) * quake).toFixed(1)}px, ${((Math.random() - 0.5) * quake).toFixed(1)}px)`
          : '';
    }
    if (flash) flash.style.opacity = String(Math.max(reduce ? 0 : kick * 0.85, smooth(0.94, 1, p)));
    if (vignette) vignette.style.opacity = String(f.fall * 0.9);

    if (renderer) {
      renderer.draw(f, diskTime, clock);
      if (!el.hasAttribute('data-ready')) el.setAttribute('data-ready', '');
      if (dt > 0.028) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 30) {
        slowFrames = 0;
        renderer.slower();
      }
    }
    drawFx(f, w, h, now);
  };

  function drawFx(f: HorizonFrame, w: number, h: number, now: number): void {
    if (!fx || !fxCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (fxCanvas.width !== Math.round(w * dpr) || fxCanvas.height !== Math.round(h * dpr)) {
      fxCanvas.width = Math.round(w * dpr);
      fxCanvas.height = Math.round(h * dpr);
    }
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, w, h);
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
