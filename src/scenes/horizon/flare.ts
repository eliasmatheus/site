// Lens flare drawn on a 2D canvas over the black hole, in the style of the Dune title cards:
// a warm amber core, a wide bloom, a long anamorphic streak with teal ends, ghosts mirrored
// through the center of the screen, a cyan sliver and gold dust.

interface Mote {
  a: number;
  r: number;
  s: number;
  o: number;
}

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

// [distance along the line through the center, radius, rgb, alpha]
const GHOSTS: readonly (readonly [number, number, string, number])[] = [
  [-0.35, 14, '120,210,220', 0.35],
  [0.55, 40, '255,170,90', 0.12],
  [1.2, 90, '60,150,160', 0.1],
  [1.55, 26, '255,220,160', 0.22],
  [1.9, 150, '50,120,130', 0.06],
];

export function createFlare(): (
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  w: number,
  h: number,
  k: number,
  now: number,
) => void {
  const dust: Mote[] = Array.from({ length: 70 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: Math.random(),
    s: 0.2 + Math.random() * 0.8,
    o: Math.random(),
  }));

  return (ctx, lx, ly, w, h, k, now) => {
    if (k <= 0.01) return;
    const cx = w / 2;
    const cy = h / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const bloom = ctx.createRadialGradient(lx, ly, 0, lx, ly, h * 0.55);
    bloom.addColorStop(0, `rgba(255,196,120,${0.32 * k})`);
    bloom.addColorStop(0.25, `rgba(220,140,60,${0.12 * k})`);
    bloom.addColorStop(1, 'rgba(40,110,120,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);

    const core = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26);
    core.addColorStop(0, `rgba(255,250,235,${0.95 * k})`);
    core.addColorStop(0.4, `rgba(255,200,120,${0.5 * k})`);
    core.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(lx, ly, 26, 0, Math.PI * 2);
    ctx.fill();

    // Anamorphic streak: long, thin, teal at the ends.
    const at = clamp(lx / w, 0.01, 0.99);
    const streak = ctx.createLinearGradient(0, ly, w, ly);
    streak.addColorStop(0, 'rgba(70,190,200,0)');
    streak.addColorStop(Math.max(0, at - 0.25), `rgba(70,190,200,${0.18 * k})`);
    streak.addColorStop(at, `rgba(255,236,200,${0.75 * k})`);
    streak.addColorStop(Math.min(1, at + 0.25), `rgba(70,190,200,${0.18 * k})`);
    streak.addColorStop(1, 'rgba(70,190,200,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(0, ly - 1, w, 2);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, ly - 7, w, 14);
    ctx.globalAlpha = 1;

    for (const [t, r, c, a] of GHOSTS) {
      const gx = lx + (cx - lx) * t;
      const gy = ly + (cy - ly) * t;
      const g = ctx.createRadialGradient(gx, gy, r * 0.2, gx, gy, r);
      g.addColorStop(0, `rgba(${c},${a * 0.6 * k})`);
      g.addColorStop(0.85, `rgba(${c},${a * k})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const sx = lx + (cx - lx) * 1.35;
    const sy = ly + (cy - ly) * 1.35;
    const sliver = ctx.createLinearGradient(sx - 3, 0, sx + 3, 0);
    sliver.addColorStop(0, 'rgba(80,220,230,0)');
    sliver.addColorStop(0.5, `rgba(140,240,240,${0.55 * k})`);
    sliver.addColorStop(1, 'rgba(80,220,230,0)');
    ctx.fillStyle = sliver;
    ctx.fillRect(sx - 3, sy - 22, 6, 44);

    for (const d of dust) {
      const rr = (0.08 + d.r * 0.35) * h;
      const ang = d.a + (now / 9000) * d.s;
      const x = lx + Math.cos(ang) * rr;
      const y = ly + Math.sin(ang) * rr * 0.7 - (((now / 40) * d.s) % (h * 0.3)) * 0.2;
      const tw = 0.5 + 0.5 * Math.sin(now / 500 + d.o * 20);
      ctx.fillStyle = `rgba(255,205,120,${0.5 * tw * k * (1 - d.r * 0.6)})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();
  };
}
