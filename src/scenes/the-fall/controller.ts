/**
 * The fall controller. Scroll (the dwell progress) drives the descent and the overlays; a
 * render loop draws the lattice only while the layer is visible. three.js loads on the first
 * sign of a visitor (scroll, pointer, touch or key), so it never weighs on the first paint.
 * Without WebGL, or with a software one, a still gradient stands in and the old computer
 * still opens.
 */
import { theFall } from '../../content/the-fall';
import type { SceneController } from '../registry';
import { fallState } from './beats';
import type { World } from './world';

const SIGNS = ['scroll', 'pointerdown', 'pointermove', 'wheel', 'touchstart', 'keydown'] as const;

/**
 * WebGL drawn by the CPU (no GPU, or a blocked one). Building the lattice there stalls the
 * page for seconds, scroll included, so the still shaft stays instead.
 */
const softwareGl = (): boolean => {
  const gl = document.createElement('canvas').getContext('webgl');
  if (!gl) return false;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /swiftshader|llvmpipe|softpipe|software/i.test(name);
};

const theFallScene: SceneController = ({ el, mode }) => {
  const q = <T extends Element>(sel: string): T | null => el.querySelector<T>(sel);
  const canvas = q<HTMLCanvasElement>('[data-gl]');
  const whiteout = q<HTMLElement>('[data-whiteout]');
  const intro = q<HTMLElement>('[data-intro]');
  const glimpse = q<HTMLElement>('[data-glimpse]');
  const glimpseText = q<HTMLElement>('[data-glimpse-text]');
  const retro = q<HTMLElement>('[data-retro]');
  const noWebgl = q<HTMLElement>('[data-no-webgl]');
  const still = mode === 'fade';
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let world: World | null = null;
  let loading = false;
  let visible = false;
  let raf = 0;
  let p = 0;
  let glimpseAt = -2;
  let screen = -1;
  let hole = -1;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };

  const onPointer = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    look.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    look.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  const loop = (now: number): void => {
    raf = 0;
    if (!visible || !world) return;
    look.x += (look.tx - look.x) * 0.05;
    look.y += (look.ty - look.y) * 0.05;
    const s = fallState(p);
    world.draw(s.fall, s.through, look.x, look.y, now);
    raf = requestAnimationFrame(loop);
  };

  const run = (): void => {
    if (!raf && visible && world) raf = requestAnimationFrame(loop);
  };

  const load = (): void => {
    if (loading || !canvas) return;
    loading = true;
    SIGNS.forEach((s) => window.removeEventListener(s, load));
    if (softwareGl()) {
      el.setAttribute('data-still', '');
      return;
    }
    void import('./world')
      .then(({ createWorld }) => {
        world = createWorld({ canvas, coarse, still });
        if (!world) throw new Error('no webgl');
        el.setAttribute('data-ready', '');
        run();
      })
      .catch(() => {
        if (noWebgl) noWebgl.hidden = false;
      });
  };

  return {
    onNear() {
      SIGNS.forEach((s) => window.addEventListener(s, load, { passive: true }));
    },
    onShow() {
      visible = true;
      window.addEventListener('pointermove', onPointer, { passive: true });
      run();
    },
    onHide() {
      visible = false;
      window.removeEventListener('pointermove', onPointer);
      cancelAnimationFrame(raf);
      raf = 0;
    },
    onProgress(progress) {
      p = progress;
      const s = fallState(p);
      if (whiteout) whiteout.style.opacity = s.whiteout.toFixed(3);
      if (intro) intro.style.opacity = s.intro.toFixed(3);
      if (s.glimpse !== glimpseAt) {
        glimpseAt = s.glimpse;
        glimpse?.toggleAttribute('data-on', s.glimpse >= 0);
        const label =
          s.glimpse >= theFall.moments.length ? theFall.first : theFall.moments[s.glimpse]?.label;
        if (glimpseText && label) glimpseText.textContent = label;
      }
      if (retro && s.hole !== hole) {
        hole = s.hole;
        retro.style.setProperty('--hole', `${(s.hole * 75).toFixed(2)}%`);
        retro.toggleAttribute('data-open', s.hole >= 1);
      }
      if (retro && s.retro !== screen) {
        screen = s.retro;
        retro.dataset['screen'] = String(s.retro);
      }
    },
  };
};

export default theFallScene;
