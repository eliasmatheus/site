// Lens flare drawn on a 2D canvas, matched to the film's first view of the ringed planet
// (measured on a 1280 x 720 still): a hard eight-pointed star, then a column of ghosts falling
// from it along the line through the lens axis (blue, a green-white cap, a pale pink ring,
// red, a tiny white point, a faint blue point, a bright orange dot) ending in a wide oval
// halo, pink outside and violet inside, as far past the axis as the Sun is before it. A dim
// blue haze hangs around the column. No anamorphic streak: the film shows none here.
//
// Sizes and the axis are in "units": the film frame's height. With the film's lens a unit is
// the screen height; a wider lens draws everything smaller.

type Ghost = readonly [t: number, r: number, rgb: string, a: number, ring?: boolean];

// t: distance along the line from the Sun (0) through the lens axis (1).
const GHOSTS: readonly Ghost[] = [
  [0.41, 0.004, '210,230,255', 0.75],
  [0.49, 0.028, '60,120,220', 0.42],
  [0.61, 0.014, '200,255,215', 0.38],
  [0.73, 0.031, '255,185,160', 0.36, true],
  [0.87, 0.022, '255,110,80', 0.5],
  [0.94, 0.0028, '255,240,240', 0.7],
  [1.36, 0.005, '40,110,170', 0.4],
  [1.65, 0.01, '255,135,90', 0.9],
];

/** The lens axis sits a little right of the frame's center in the film. */
const AXIS_X = 26 / 720;

export function createFlare(): (
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  w: number,
  h: number,
  k: number,
  unit: number,
) => void {
  return (ctx, lx, ly, w, h, k, unit) => {
    if (k <= 0.01) return;
    const ax = w / 2 + AXIS_X * unit;
    const ay = h / 2;
    const dx = ax - lx;
    const dy = ay - ly;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const blob = (x: number, y: number, r: number, stops: [number, string][]): void => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      for (const [o, c] of stops) g.addColorStop(o, c);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    // The haze: a faint blue column around the ghosts.
    for (let i = 0; i < 9; i++) {
      const t = 0.32 + i * 0.15;
      blob(lx + dx * t, ly + dy * t, 0.075 * unit, [
        [0, `rgba(40,60,150,${0.09 * k})`],
        [1, 'rgba(40,60,140,0)'],
      ]);
    }

    // The Sun: a small glow, a hard core and eight short points.
    blob(lx, ly, 0.04 * unit, [
      [0, `rgba(255,245,215,${0.6 * k})`],
      [0.3, `rgba(255,225,170,${0.2 * k})`],
      [1, 'rgba(255,215,160,0)'],
    ]);
    blob(lx, ly, 0.009 * unit, [
      [0, `rgba(255,253,240,${k})`],
      [0.6, `rgba(255,250,225,${0.9 * k})`],
      [1, 'rgba(255,240,200,0)'],
    ]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const l = (i % 2 ? 0.014 : 0.019) * unit;
      const g = ctx.createLinearGradient(lx, ly, lx + Math.cos(a) * l, ly + Math.sin(a) * l);
      g.addColorStop(0, `rgba(255,250,232,${0.9 * k})`);
      g.addColorStop(1, 'rgba(255,250,232,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(1, 0.0028 * unit);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(a) * l, ly + Math.sin(a) * l);
      ctx.stroke();
    }

    // The ghosts.
    for (const [t, r, rgb, a, ring] of GHOSTS) {
      const x = lx + dx * t;
      const y = ly + dy * t;
      const rad = Math.max(1, r * unit);
      blob(
        x,
        y,
        rad,
        ring
          ? [
              [0, `rgba(${rgb},${a * 0.75 * k})`],
              [0.75, `rgba(${rgb},${a * k})`],
              [1, `rgba(${rgb},0)`],
            ]
          : [
              [0, `rgba(${rgb},${a * k})`],
              [0.6, `rgba(${rgb},${a * 0.7 * k})`],
              [1, `rgba(${rgb},0)`],
            ],
      );
    }
    // The bright orange dot carries a small glow.
    const ox = lx + dx * 1.65;
    const oy = ly + dy * 1.65;
    blob(ox, oy, 0.028 * unit, [
      [0, `rgba(255,120,80,${0.3 * k})`],
      [1, 'rgba(255,120,80,0)'],
    ]);

    // The wide oval halo, across the line, mirrored past the axis.
    const hx = lx + dx * 1.97;
    const hy = ly + dy * 1.97;
    ctx.translate(hx, hy);
    ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
    ctx.scale(1, 0.56);
    const R = 0.19 * unit;
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    halo.addColorStop(0, `rgba(120,60,100,${0.12 * k})`);
    halo.addColorStop(0.45, `rgba(50,55,170,${0.13 * k})`);
    halo.addColorStop(0.8, `rgba(200,100,140,${0.17 * k})`);
    halo.addColorStop(1, 'rgba(200,90,120,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
}
