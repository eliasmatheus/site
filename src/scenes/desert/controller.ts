/**
 * The Desert: wind-blown sand drawn on a canvas. Runs only while the layer is visible,
 * uses fewer grains on mobile and none with reduced motion.
 */
import type { SceneController } from '../registry';

interface Grain {
  x: number;
  y: number;
  v: number;
  l: number;
}

const GRAINS = { fly: 180, stack: 70, fade: 0 } as const;

const desert: SceneController = ({ el, mode }) => {
  const canvas = el.querySelector<HTMLCanvasElement>('canvas[data-sand]');
  const ctx = canvas?.getContext('2d');
  const count = GRAINS[mode];
  if (!canvas || !ctx || count === 0) return {};

  const grains: Grain[] = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    v: 0.6 + Math.random() * 1.8,
    l: 8 + Math.random() * 28,
  }));
  let raf = 0;

  const tick = (): void => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(244, 214, 170, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const g of grains) {
      g.x -= (g.v / w) * 3;
      g.y += Math.sin((g.x + g.y) * 20) * 0.0004;
      if (g.x < -0.05) {
        g.x = 1.05;
        g.y = Math.random();
      }
      const X = g.x * w;
      const Y = g.y * h;
      ctx.moveTo(X, Y);
      ctx.lineTo(X + g.l, Y - g.l * 0.06);
    }
    ctx.stroke();
    raf = requestAnimationFrame(tick);
  };

  return {
    onShow() {
      if (!raf) raf = requestAnimationFrame(tick);
    },
    onHide() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
};

export default desert;
