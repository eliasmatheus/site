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
  CLOSE_SHARE,
  UNDER_SHARE,
  DEPARTURE_END,
  horizonFrame,
  instruments,
  smooth,
  type HorizonFrame,
} from './beats';
import { createFlare } from './flare';
import { FRAGMENT, UNIFORMS, VERTEX } from './shader';
import { createStarfield } from './starfield';

type Uniform = (typeof UNIFORMS)[number];

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: V3): V3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, scale(sub(b, a), t));
const ease = (t: number): number => t * t * (3 - 2 * t);

/** Saturn's polar radius over its equatorial radius: the planet is visibly squashed. */
const FLAT = 0.902;

/** The camera's right and up for a forward direction, turned by a roll. */
const basis = (fw: V3, roll: number): { rt: V3; up: V3 } => {
  const rt0 = norm(cross(fw, [0, 1, 0]));
  const up0 = cross(rt0, fw);
  return {
    rt: add(scale(rt0, Math.cos(roll)), scale(up0, Math.sin(roll))),
    up: add(scale(up0, Math.cos(roll)), scale(rt0, -Math.sin(roll))),
  };
};
const turnY = (v: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
};

/**
 * Shot one is the film's first view of the ringed planet, matched to the frame: the camera
 * was fitted to the planet's limb and the edges of the rings in a 1280 x 720 still (about
 * 1.5 px off on average). The ship is 6.8 radii out, 6.6° under the plane of the rings,
 * with a 0.7 lens (the frame's height spans 2·atan(0.35), about 39°), aimed left of the
 * planet so it sits cut off at the right edge. The Sun is placed where the film shows it,
 * a little right of center, high, at (690, 148): that puts it 13° above the rings and 27°
 * from the planet, so the planet is backlit. Turned about the pole so the Sun keeps its real
 * direction among the catalogue's stars; only its height above the rings is film license.
 */
const FILM = {
  dist: 6.7863,
  elev: -0.115736,
  fov: 0.7,
  aim: [-0.577455, -0.087885] as const,
  roll: -0.021219,
  /** The Sun in the still, in fractions of the height from the center (y up). */
  sun: [50 / 720, 212 / 720] as const,
  /** The still's aspect: wider screens match its height, narrower ones its width. */
  aspect: 16 / 9,
};
/** A camera in the frame the stills were fitted in (before the turn about the pole). */
interface Key {
  pos: V3;
  fw: V3;
  roll: number;
  fov: number;
}
/** A camera on a line of sight from the planet: distance, height angle, aim, roll. */
const filmKey = (
  dist: number,
  elev: number,
  aim: readonly [number, number],
  roll: number,
  fov: number,
  turn = 0,
): Key => {
  const pos: V3 = [0, dist * Math.sin(elev), dist * Math.cos(elev)];
  const f0 = norm(scale(pos, -1));
  const r0 = norm(cross(f0, [0, 1, 0]));
  const u0 = cross(r0, f0);
  const fw = norm(add(f0, add(scale(r0, aim[0]), scale(u0, aim[1]))));
  return { pos: turnY(pos, turn), fw: turnY(fw, turn), roll, fov };
};
const FIRST = filmKey(FILM.dist, FILM.elev, FILM.aim, FILM.roll, FILM.fov);
/** The turn about the pole that gives the Sun its real direction among the stars. */
const SKY_TURN = (() => {
  const { rt, up } = basis(FIRST.fw, FILM.roll);
  const sun = norm(
    add(FIRST.fw, scale(add(scale(rt, FILM.sun[0]), scale(up, FILM.sun[1])), FILM.fov)),
  );
  // The Sun's real direction seen from Saturn (ecliptic longitude 36.2°, from the catalogue
  // conversion in public/data/bright-stars.bin), in the scene's frame.
  const real: V3 = [-0.6644, 0.3421, -0.6644];
  return { a: Math.atan2(real[2], real[0]) - Math.atan2(sun[2], sun[0]), sun };
})();
const toSky = (k: Key): Key => ({
  ...k,
  pos: turnY(k.pos, SKY_TURN.a),
  fw: turnY(k.fw, SKY_TURN.a),
});
const SHOT1 = { ...toSky(FIRST), sun: turnY(SKY_TURN.sun, SKY_TURN.a) };
/**
 * The end of the slow pan, fitted the same way to the film's frame (2.3 px): the ship has
 * drifted a third of a radius closer, the lens is a touch wider (0.727) and tilted 5.4°, the
 * planet near the middle and the Sun at the left edge (it lands within 8 px of the film's).
 */
const PAN_END_KEY = toSky(
  filmKey(6.45373, -0.11677, [0.050162, 0.055737], -0.094563, 0.72716, (0.75 * Math.PI) / 180),
);

/** The Sun: high, a little right of center in the first shot, behind the planet. */
const SUN: V3 = SHOT1.sun;
/**
 * In the close-up the film's Sun stands lower over the rings, about 8°: that is where their
 * shadows fall on the clouds in its frames (the Cassini Division's shadow lines up). Same
 * direction round the pole, so the terminator stays where it is.
 */
const SUN_LOW: V3 = (() => {
  const h = norm([SUN[0], 0, SUN[2]]);
  const e = (8 * Math.PI) / 180;
  return [h[0] * Math.cos(e), Math.sin(e), h[2] * Math.cos(e)];
})();

/** The camera flying past the planet, and where the star lands on screen. */
interface SaturnView {
  /** The camera's exposure for the stars, 0 (a bright planet fills the frame) to 1. */
  exposure: number;
  /** How close we are, 0 to 1: closer shows finer detail. */
  detail: number;
  pos: V3;
  fw: V3;
  rt: V3;
  up: V3;
  fov: number;
  /** The star in screen units (fractions of the height), and how much of it shows. */
  sun: { x: number; y: number; seen: number };
  /** The ship on screen (fractions of the height) and the Sun's direction there. */
  ship: { x: number; y: number; r: number; lx: number; ly: number } | null;
  /** Where the Sun is, for the light. */
  light: V3;
  /** The lens flare's scale: 1 with the film's lens, smaller with a wider one. */
  unit: number;
  /** Exposure for the planet and for the rings, and the light: 0 the film's backlit
   * crescent, 1 the close-up's falloff. */
  gain: [number, number, number];
}

/**
 * Shot two, after a hard cut: a close-up of the planet's edge from just outside the rings,
 * a hair under their plane, with a long lens. Its first and last frames are fitted to the
 * film's (0.85 px on the edges of the rings, the far side of the rings past the limb and the
 * limb itself): the ship sits 2.70 radii out, 0.081 under the plane, the lens is 0.183, and
 * between the two frames only the camera turns, a very slow pan towards the night side. The
 * terminator falls where the film's does with the ship 191.2° round from the first shot.
 * Then the ship pulls away towards where the wormhole waits.
 */
/** A camera rc radii out, h under the ring plane, a round the pole, aimed off the planet. */
const orbitKey = (
  rc: number,
  h: number,
  aDeg: number,
  aim: readonly [number, number],
  roll: number,
  fov: number,
): Key => {
  const pos = turnY(turnY([rc, -h, 0], (aDeg * Math.PI) / 180), SKY_TURN.a);
  const toP = norm(scale(pos, -1));
  const b = basis(toP, 0);
  return { pos, fw: norm(add(toP, add(scale(b.rt, aim[0]), scale(b.up, aim[1])))), roll, fov };
};
const CLOSE_START = orbitKey(2.70435, 0.08103, 191.2, [0.28435, -0.01816], -0.00016, 0.18302);
const CLOSE_LAST = orbitKey(2.70435, 0.08103, 191.2, [0.39748, -0.02282], -0.00657, 0.18302);
/**
 * Shot three, after another cut: the planet large on the left with its terminator, the rings
 * sweeping out with the planet's shadow across them, and the ship small against it all, for
 * scale. Composed by eye for now (the film's frames are not matched yet): 3.2 radii out, a
 * little above the rings, a 0.42 lens tilted 14°, the same low Sun as the close-up. Again
 * only the camera turns.
 */
/** Where a pixel of a key's frame (film pixels, 1280 x 720) lies, at a distance along its ray. */
const along = (k: Key, px: number, py: number, d: number): V3 => {
  const { rt, up } = basis(k.fw, k.roll);
  const ray = norm(
    add(k.fw, scale(add(scale(rt, (px - 640) / 720), scale(up, (360 - py) / 720)), k.fov)),
  );
  return add(k.pos, scale(ray, d));
};
/** A take's camera: distance, height (negative is above the rings), angle round, aims, roll, lens. */
interface TakeShape {
  rc: number;
  h: number;
  az: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  roll: number;
  fov: number;
}
const take = (o: TakeShape, shipDist: number) => {
  const start = orbitKey(o.rc, o.h, o.az, [o.x0, o.y0], o.roll, o.fov);
  const last = orbitKey(o.rc, o.h, o.az, [o.x1, o.y1], o.roll, o.fov);
  const shipAt = along(start, 1120, 412, shipDist);
  return {
    start,
    last,
    shipAt,
    shipDrift: scale(norm(sub(along(last, 1052, 407, shipDist), shipAt)), shipDist * 0.002),
    /** About 28 film pixels across at the start of the shot, like the film's ship. */
    shipSize: (28 / 720) * start.fov,
    /** The way out: on to the right of the shot, a little up, where the wormhole waits. */
    ahead: norm(add(basis(last.fw, 0).rt, [0, 0.08, 0])),
  };
};
/**
 * Shot three, after another hard cut: an unexpected angle from under the planet, looking up.
 * A first fit to the film's two frames by what each pixel shows (lit planet, rings, black),
 * with the limb as a guide; still loose (the rings overhead show where the film has the limb): the camera sits 1.37 radii from the center, 0.37 under the ring plane,
 * almost beneath the planet just inside the rings, with a wide 0.65 lens rolled about 26°.
 * Only the camera turns. The low Sun again, the camera 173.2° round. The ship is close by,
 * where the film has its own.
 */
const UNDER = take(
  {
    rc: 1.36777,
    h: 0.37349,
    az: 173.2,
    x0: 0.57735,
    y0: -0.18209,
    x1: 0.74228,
    y1: -0.08793,
    roll: 0.47779,
    fov: 0.64694,
  },
  0.25,
);
/** Each take after the first cut, as a share of shot two's time; the rest is the way out. */
const CLOSE_END = CLOSE_SHARE;
const UNDER_END = UNDER_SHARE;
/** In between two keys: position and aim move together, roll and lens with them. */
const between = (a: Key, b: Key, t: number): Key => ({
  pos: lerp3(a.pos, b.pos, t),
  fw: norm(lerp3(a.fw, b.fw, t)),
  roll: a.roll + (b.roll - a.roll) * t,
  fov: a.fov + (b.fov - a.fov) * t,
});

/**
 * The camera operator on board: the ship's position is the flight's, but the operator pans
 * and zooms on their own, smoothly and a little late, like a documentary. A cut resets them.
 */
interface Operator {
  fw: V3;
  fov: number;
  ready: boolean;
  shot: number;
}

function saturnView(
  f: HorizonFrame,
  aspect: number,
  look: { x: number; y: number },
  op: Operator,
  dt: number,
): SaturnView {
  const phone = aspect < 0.8;
  const shot = f.pan < 1 ? 1 : f.shot2 < CLOSE_END ? 2 : 3;
  if (shot !== op.shot) {
    op.shot = shot;
    op.ready = false;
  }
  let pos: V3;
  let want: V3;
  let wantFov: number;
  let roll: number;
  let gain: [number, number, number] = [1, 1, 0];
  // The stills' frame: same height on wide screens, same width on narrower ones.
  const widen = Math.min(Math.max(1, FILM.aspect / aspect), phone ? 2.2 : 2);
  if (shot === 1) {
    // A very slow pan from the film's first frame to its last, both matched to the film.
    const key = between(SHOT1, PAN_END_KEY, ease(f.pan));
    pos = key.pos;
    want = key.fw;
    roll = key.roll;
    wantFov = key.fov * widen;
    if (phone) {
      // A phone cannot hold the still's width: a wider lens and, at first, the Sun high and
      // left of center with its ghosts falling down the middle, the rings coming in from the
      // right edge.
      wantFov = 1.2;
      const b = basis(SHOT1.fw, FILM.roll);
      const start = norm(add(SHOT1.fw, add(scale(b.rt, 0.169), scale(b.up, -0.155))));
      want = norm(lerp3(start, PAN_END_KEY.fw, ease(f.pan)));
    }
  } else if (shot === 2) {
    // Time is slowed, not the ship: it holds still while the camera pans, evenly.
    const key = between(CLOSE_START, CLOSE_LAST, f.shot2 / CLOSE_END);
    pos = key.pos;
    want = key.fw;
    roll = key.roll;
    wantFov = key.fov * widen;
    // Exposure set for the lit clouds, light falling off as in the film; the rings glow
    // through, brighter than from afar.
    gain = [1, 2.7, 1];
  } else if (f.shot2 < UNDER_END) {
    const key = between(UNDER.start, UNDER.last, (f.shot2 - CLOSE_END) / (UNDER_END - CLOSE_END));
    pos = key.pos;
    want = key.fw;
    roll = key.roll;
    wantFov = key.fov * widen;
    // From under the rings they glow with the light coming through.
    gain = [1, 2, 1];
  } else {
    const c = ease((f.shot2 - UNDER_END) / (1 - UNDER_END));
    const { last, ahead } = UNDER;
    pos = add(last.pos, scale(ahead, 7 * c * c));
    want = norm(lerp3(last.fw, ahead, c));
    wantFov = (last.fov + (0.52 - last.fov) * c) * (phone ? 1.5 : 1);
    roll = last.roll * (1 - c) - 0.07 * c;
    gain = [1, 1, 1 - c];
  }
  want = norm(add(want, [look.x * 0.02, look.y * 0.015, 0]));
  const k = op.ready ? 1 - Math.exp(-dt * 2.2) : 1;
  op.fw = norm(lerp3(op.fw, want, k));
  op.fov += (wantFov - op.fov) * k;
  op.ready = true;
  const fw = op.fw;
  const fov = op.fov;
  // A slight, steady tilt: the horizon of the rings is never quite level.
  const { rt, up } = basis(fw, roll);
  // Where the star lands, and whether the planet or the rings cover it.
  // The Sun of this shot.
  const sun = shot === 1 ? SUN : SUN_LOW;
  const depth = dot(sun, fw);
  let seen = depth > 0.05 ? 1 : 0;
  const ps: V3 = [pos[0], pos[1] / FLAT, pos[2]];
  const ss: V3 = [sun[0], sun[1] / FLAT, sun[2]];
  const aa = dot(ss, ss);
  const bb = dot(ps, ss);
  const hh = bb * bb - aa * (dot(ps, ps) - 1);
  if (hh > 0 && (-bb - Math.sqrt(hh)) / aa > 0) seen = 0;
  const tr = -pos[1] / sun[1];
  if (tr > 0) {
    const q = add(pos, scale(sun, tr));
    const rr = Math.hypot(q[0], q[2]);
    if (rr > 1.24 && rr < 2.27) seen *= 0.35;
  }
  // Exposure set for the planet: the larger it looms in frame, the fewer stars show.
  const dist = Math.hypot(pos[0], pos[1], pos[2]);
  const toPlanet = Math.max(0, dot(norm(scale(pos, -1)), fw));
  const looming = (Math.asin(Math.min(1, 1 / dist)) / fov) * toPlanet;
  // With the Sun itself in frame the exposure is short and no star registers.
  const sunX = dot(sun, rt) / Math.max(depth, 1e-3) / fov;
  const sunY = dot(sun, up) / Math.max(depth, 1e-3) / fov;
  const inFrame =
    depth > 0.05 && Math.abs(sunX) < aspect / 2 + 0.05 && Math.abs(sunY) < 0.55 ? seen : 0;
  const exposure = Math.min(1, Math.max(0, 1 - (looming - 0.05) * 3.2)) * (1 - 0.95 * inFrame);
  return {
    exposure,
    detail: Math.min(1, Math.max(0, (4.6 - dist) / 1.5)),
    pos,
    fw,
    rt,
    up,
    fov,
    sun: { x: sunX, y: sunY, seen },
    ship: (() => {
      if (shot < 3 || f.shot2 >= UNDER_END) return null;
      const t = UNDER;
      const at = add(t.shipAt, scale(t.shipDrift, (f.shot2 - CLOSE_END) / (UNDER_END - CLOSE_END)));
      const v = sub(at, pos);
      const z = dot(v, fw);
      if (z <= 0.01) return null;
      return {
        x: dot(v, rt) / z / fov,
        y: dot(v, up) / z / fov,
        r: (t.shipSize * 0.25) / z / fov / 2,
        // Which way the Sun is, on screen, to light the dish.
        lx: dot(sun, rt),
        ly: dot(sun, up),
      };
    })(),
    light: sun,
    unit: FILM.fov / fov,
    gain,
  };
}

/** Where the 2D parts of the departure sit, in screen units (fractions of the height). */
interface Layout {
  saturn: SaturnView;
  worm: { x: number; y: number; r: number };
  tunnel: { x: number; y: number };
}

function departureLayout(
  f: HorizonFrame,
  aspect: number,
  look: { x: number; y: number },
  op: Operator,
  dt: number,
): Layout {
  const phone = aspect < 0.8;
  const near = Math.pow(f.approach, 2.4);
  return {
    saturn: saturnView(f, aspect, look, op, dt),
    // Past the planet, a tiny bright point ahead, above the title, settles in the middle as
    // it grows to fill the view.
    worm: { x: 0, y: (phone ? 0.26 : 0.2) * (1 - near), r: 0.004 + near * 1.9 },
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
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  // The real sky (the catalogue loads on its own; procedural stars stand in until then).
  const starfield = createStarfield(gl, '/data/bright-stars.bin');
  const u = Object.fromEntries(
    UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)]),
  ) as Record<Uniform, WebGLUniformLocation | null>;

  // Quality: resolution first, then ray-marching steps.
  let scale = coarse ? 0.55 : 0.75;
  let steps = coarse ? 120 : 200;
  /** Extra resolution for the planet while frames keep up. */
  let bonus = 0.25;

  return {
    draw(f, time, clock, lay, flash) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The planet is cheap to draw: at the departure it gets full resolution, so close up
      // the clouds and the ringlets stay sharp.
      const res = f.warp > 0.999 ? Math.min(1, scale + bonus) : scale;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr * res));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr * res));
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
      // Even far away the wormhole shows as a small bright point.
      gl.uniform1f(u.uReveal, 0.4 + 0.6 * f.reveal);
      gl.uniform1f(u.uDawn, f.dawn);
      gl.uniform1f(u.uPlanet, f.planet);
      gl.uniform1f(u.uPan, f.pan);
      const sv = lay.saturn;
      gl.uniform3f(u.uSCam, ...sv.pos);
      gl.uniform3f(u.uSFw, ...sv.fw);
      gl.uniform3f(u.uSRt, ...sv.rt);
      gl.uniform3f(u.uSUp, ...sv.up);
      gl.uniform1f(u.uSFov, sv.fov);
      gl.uniform3f(u.uSunDir, ...sv.light);
      const catalog = starfield?.ready() ?? false;
      gl.uniform1f(u.uStarExp, catalog ? 0 : sv.exposure);
      gl.uniform1f(u.uDetail, sv.detail);
      gl.uniform3f(u.uSExp, sv.gain[0], sv.gain[1], sv.gain[2]);
      gl.uniform2f(u.uTunC, lay.tunnel.x, lay.tunnel.y);
      gl.uniform1f(u.uCalm, f.calm);
      gl.uniform1f(u.uStill, f.still);
      gl.uniform1f(u.uFlash, flash);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(loc);
      if (catalog) {
        const gain = sv.exposure * f.planet * f.dawn * f.warp;
        starfield?.draw(
          { cam: sv.pos, fw: sv.fw, rt: sv.rt, up: sv.up, fov: sv.fov },
          w / h,
          (w / Math.max(1, canvas.clientWidth)) * 1.25,
          gain,
        );
      }
    },
    slower() {
      // The planet's extra sharpness goes first.
      if (bonus > 0) bonus = 0;
      else if (scale > 0.4) scale -= 0.1;
      else if (steps > 90) steps -= 30;
      else return false;
      return true;
    },
  };
}

/**
 * The ship, drawn small and simple: an original crewed ship, a ring that turns to give its
 * crew gravity (the old rotating-wheel idea), four spokes to a hub, and a spine through the
 * hub with the drive at one end. Seen a little edge-on, lit from the Sun's side.
 */
function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  lx: number,
  ly: number,
): void {
  if (r < 0.5) return;
  const lit = Math.hypot(lx, ly) > 1e-3 ? Math.atan2(-ly, lx) : 0;
  const tilt = 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.2);
  const shade = (a: number): string => {
    const k = 0.45 + 0.55 * Math.max(0, Math.cos(a - lit));
    const v = Math.round(110 + 135 * k);
    return `rgb(${v},${v - 4},${v - 12})`;
  };
  // The spine, through the hub, the drive glowing faintly at its far end.
  ctx.strokeStyle = 'rgb(150,148,142)';
  ctx.lineWidth = Math.max(0.8, r * 0.1);
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.55);
  ctx.lineTo(0, r * 0.75);
  ctx.stroke();
  ctx.fillStyle = 'rgba(170,200,255,0.55)';
  ctx.beginPath();
  ctx.arc(0, r * 0.8, Math.max(0.6, r * 0.09), 0, Math.PI * 2);
  ctx.fill();
  // Four spokes.
  ctx.lineWidth = Math.max(0.5, r * 0.05);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.strokeStyle = shade(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9 * tilt);
    ctx.stroke();
  }
  // The ring, a continuous band, in segments so the lit side is brighter.
  ctx.lineWidth = Math.max(0.8, r * 0.16);
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2;
    const a1 = ((i + 1.05) / 24) * Math.PI * 2;
    ctx.strokeStyle = shade((a0 + a1) / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * tilt, 0, a0, a1);
    ctx.stroke();
  }
  // The hub.
  ctx.fillStyle = shade(lit);
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.8, r * 0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  const stillPlanet = q<HTMLElement>('.still.planet');
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
  // Heavier in the departure: a wheel click pushes it gently and the motion carries on
  // between clicks, and it never plays faster than a film would.
  const view = createFollow(1.8);
  /** Departure pace: the whole planet flyby takes at least about eight seconds. */
  const FILM_SPEED = 0.022;
  /** Going back, the tape rewinds: about five times the film's pace, visibly a rewind. */
  const REWIND_SPEED = 0.11;
  let rewinding = false;
  let beat = 0;
  let alertsUp = -1;
  let renderer: Renderer | null | undefined;
  let started = false;
  let visible = false;
  let raf = 0;

  // ---------- the pointer (or finger) turns the camera a little ----------
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
  const operator: Operator = { fw: [0, 0, -1], fov: 0.2, ready: false, shot: 0 };
  let slowFrames = 0;

  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame);
    // Slow frames still keep the film's time (up to a tenth of a second per frame).
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const w = el.clientWidth;
    const h = el.clientHeight;
    // The camera never jumps through the departure: a fast flick still plays every take at
    // the film's pace, and going back rewinds. Only past it (the black hole) does a far jump
    // cut straight there.
    const inFilm = view.value < DEPARTURE_END || p < DEPARTURE_END;
    if (reduce || (!inFilm && Math.abs(p - view.value) > 0.3)) {
      view.snap(p);
      operator.ready = false;
    }
    const back = p < view.value;
    const shown = view.step(p, dt, inFilm ? (back ? REWIND_SPEED : FILM_SPEED) : 0.25);
    const rewind = inFilm && view.speed < -0.01;
    if (rewind !== rewinding) {
      rewinding = rewind;
      window.dispatchEvent(new CustomEvent('journey:rewind', { detail: rewind }));
    }
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
    const lay = departureLayout(f, w / Math.max(1, h), look, operator, dt);
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
    drawFx(f, w, h, lay);
  };

  function drawFx(f: HorizonFrame, w: number, h: number, lay: Layout): void {
    if (!fx || !fxCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (fxCanvas.width !== Math.round(w * dpr) || fxCanvas.height !== Math.round(h * dpr)) {
      fxCanvas.width = Math.round(w * dpr);
      fxCanvas.height = Math.round(h * dpr);
    }
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, w, h);
    if (!renderer) return;
    const ship = lay.saturn.ship;
    if (ship && f.planet > 0.01)
      drawShip(fx, w / 2 + ship.x * h, h / 2 - ship.y * h, ship.r * h, ship.lx, ship.ly);
    // At the planet, the flare belongs to the Sun; the camera's moves carry it across the lens.
    if (f.planet > 0.01) {
      const sun = lay.saturn.sun;
      if (sun.seen > 0.01) {
        flare(
          fx,
          w / 2 + sun.x * h,
          h / 2 - sun.y * h,
          w,
          h,
          f.planet * f.dawn * sun.seen,
          lay.saturn.unit * h,
        );
      }
      return;
    }
    // The flare that followed the pointer is gone: the flare belongs to real lights, at
    // key moments only.
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
      operator.ready = false;
      start();
      run();
    },
    onHide() {
      visible = false;
      if (rewinding) {
        rewinding = false;
        window.dispatchEvent(new CustomEvent('journey:rewind', { detail: false }));
      }
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
      // The planet's shots are cutscenes; the way out to the wormhole is the visitor's own.
      const cut = horizonFrame(p, el.clientWidth / Math.max(1, el.clientHeight));
      el.toggleAttribute('data-cutscene', !reduce && cut.shot2 < UNDER_END && cut.planet > 0.5);
      const f = horizonFrame(p, el.clientWidth / Math.max(1, el.clientHeight));
      // The still planet follows the film: dark first, then the planet comes up.
      if (stillPlanet) stillPlanet.style.opacity = p > DEPARTURE_END ? '' : f.planet.toFixed(3);
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
