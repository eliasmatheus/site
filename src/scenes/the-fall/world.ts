/**
 * The fall in 3D: the lattice (src/scenes/the-fall/lattice.ts) drawn with three.js, the
 * glowing windows in its gaps, the first computer at the bottom and gold dust in the shaft.
 * Loaded by dynamic import from the controller, so three.js only ships when it is needed.
 *
 * Beams are three InstancedMeshes (one draw call per group) with a streaked texture made in
 * a canvas; light comes warm from below, cool from above, plus a lamp that travels with the
 * camera. Windows are pixel art drawn in small canvases.
 */
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  FogExp2,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NearestFilter,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  type Material,
} from 'three';
import { GAPS, smooth } from './beats';
import { createLattice, type Box } from './lattice';

export interface World {
  /** Dwell state to show, plus the pointer look (-1 to 1). */
  draw(fall: number, through: number, lookX: number, lookY: number, now: number): void;
  dispose(): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  coarse: boolean;
  still: boolean;
}

const seeded = (seed: number): (() => number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

/** Long stripes of warm browns, cream and a little teal, as if smeared by motion. */
function streaks(seed: number): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 32;
  const g = c.getContext('2d');
  const rnd = seeded(seed);
  if (g) {
    g.fillStyle = '#2a1d14';
    g.fillRect(0, 0, 256, 32);
    for (let y = 0; y < 32; y++) {
      const r = rnd();
      const col =
        r < 0.06
          ? [210, 225, 220]
          : r < 0.12
            ? [120, 170, 175]
            : r < 0.4
              ? [196, 160, 112]
              : r < 0.75
                ? [120, 82, 52]
                : [60, 40, 28];
      const k = 0.55 + rnd() * 0.6;
      g.fillStyle = `rgb(${col.map((v) => Math.min(255, Math.round(v * k))).join(',')})`;
      g.fillRect(0, y, 256, 1);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,236,200,${0.15 + rnd() * 0.35})`;
      g.fillRect(rnd() * 256, Math.floor(rnd() * 32), 20 + rnd() * 120, 1);
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

function pixelWindow(draw: Draw, w = 64, h = 48): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (g) {
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
  }
  const t = new CanvasTexture(c);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.colorSpace = SRGBColorSpace;
  return t;
}

const text = (
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  col: string,
  size = 6,
): void => {
  g.fillStyle = col;
  g.font = `${size}px monospace`;
  g.fillText(s, x, y);
};

/** What each gap shows, in GAPS order: newest first, like the fall itself. */
const WINDOWS: Draw[] = [
  // 2020 · the first Python program
  (g, w) => {
    g.fillStyle = '#1e1f22';
    g.fillRect(0, 0, w, 48);
    text(g, "print('Olá,", 4, 12, '#cf8e6d');
    text(g, " Mundo!')", 4, 20, '#6aab73');
    g.fillStyle = '#333';
    g.fillRect(4, 28, w - 8, 1);
    text(g, 'Olá, Mundo!', 4, 38, '#ece7dc');
  },
  // 2019 to 2020 · the desert
  (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5b3a22');
    gr.addColorStop(0.5, '#e3b27a');
    gr.addColorStop(0.52, '#8d5a33');
    gr.addColorStop(1, '#3d2414');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c48a52';
    g.beginPath();
    g.ellipse(18, 30, 30, 8, 0, 0, Math.PI * 2);
    g.fill();
  },
  // 2012 to 2020 · structures: a column on its footing, in the soil
  (g, w, h) => {
    g.fillStyle = '#0c0e12';
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(176,138,90,.35)';
    g.fillRect(0, 20, w, 28);
    g.fillStyle = '#c9ccd2';
    g.fillRect(30, 4, 4, 26);
    g.fillStyle = '#7ee2a8';
    g.fillRect(20, 30, 24, 6);
  },
  // 2011 · the choice: three cards, the first one picked
  (g, w, h) => {
    g.fillStyle = '#e3ebc4';
    g.fillRect(0, 0, w, h);
    (
      [
        ['#ffd166', 3],
        ['#f7f9ec', 23],
        ['#f7f9ec', 43],
      ] as const
    ).forEach(([c, x]) => {
      g.fillStyle = '#1f2a1a';
      g.fillRect(x - 1, 9, 20, 30);
      g.fillStyle = c;
      g.fillRect(x, 10, 18, 28);
    });
  },
];

export function createWorld({ canvas, coarse, still }: Options): World | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: !coarse,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;

  const lattice = createLattice(coarse);
  const { depth, windowDistance } = lattice;
  const scene = new Scene();
  scene.background = new Color(0x07060a);
  scene.fog = new FogExp2(0x0b0907, 0.022);
  const cam = new PerspectiveCamera(62, 1, 0.1, 400);

  const texA = streaks(7);
  const texB = streaks(91);
  const matA = new MeshStandardMaterial({
    map: texA,
    emissive: 0xffffff,
    emissiveMap: texA,
    emissiveIntensity: 0.28,
    roughness: 0.85,
  });
  const matB = new MeshStandardMaterial({
    map: texB,
    emissive: 0xffffff,
    emissiveMap: texB,
    emissiveIntensity: 0.22,
    roughness: 0.9,
  });
  const unit = new BoxGeometry(1, 1, 1);
  const disposables: { dispose(): void }[] = [texA, texB, matA, matB, unit];

  const instance = (list: Box[], mat: Material): void => {
    const m = new InstancedMesh(unit, mat, list.length);
    const o = new Object3D();
    list.forEach(([x, y, z, sx, sy, sz], i) => {
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    scene.add(m);
  };
  instance(lattice.posts, matB);
  instance(lattice.beamsX, matA);
  instance(lattice.beamsZ, matA);
  instance(lattice.floor, matA);

  scene.add(new AmbientLight(0x3a2c22, 1.2));
  const below = new PointLight(0xffc98a, 2.2, 0, 0);
  below.position.set(0, -depth + 6, 0);
  scene.add(below);
  const lamp = new PointLight(0xffe2bc, 1.4, 60, 1.6);
  scene.add(lamp);
  const sky = new DirectionalLight(0x9fc7d0, 0.6);
  sky.position.set(0.3, 1, 0.2);
  scene.add(sky);

  // The windows in the gaps, each with a halo and a light spilling out.
  const windows = GAPS.map((gap, i) => {
    const tex = pixelWindow(WINDOWS[i] ?? (() => undefined));
    const geo = new PlaneGeometry(9, 6.75);
    const mat = new MeshBasicMaterial({ map: tex, toneMapped: false, fog: false });
    disposables.push(tex, geo, mat);
    const mesh = new Mesh(geo, mat);
    const y = lattice.gapY[i] ?? 0;
    mesh.position.set(gap.side[0] * windowDistance, y, gap.side[1] * windowDistance);
    mesh.lookAt(0, y, 0);
    scene.add(mesh);
    const haloGeo = new PlaneGeometry(21.6, 16.2);
    const haloMat = new MeshBasicMaterial({
      color: 0xffc98a,
      transparent: true,
      opacity: 0.12,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    disposables.push(haloGeo, haloMat);
    const halo = new Mesh(haloGeo, haloMat);
    halo.position.set(gap.side[0] * windowDistance * 1.02, y, gap.side[1] * windowDistance * 1.02);
    halo.lookAt(0, y, 0);
    scene.add(halo);
    const pl = new PointLight(0xffc98a, 1.2, 30, 1.8);
    pl.position.set(gap.side[0] * (windowDistance - 2), y, gap.side[1] * (windowDistance - 2));
    scene.add(pl);
    return { x: mesh.position.x, y, z: mesh.position.z };
  });

  // The first computer at the bottom of the shaft, face up.
  const bootTex = pixelWindow(
    (g, w, h) => {
      g.fillStyle = '#0b0f0a';
      g.fillRect(0, 0, w, h);
      text(g, 'CPU: PENTIUM', 4, 10, '#b6f3a1');
      text(g, 'MEMORY TEST:', 4, 19, '#b6f3a1');
      text(g, '65536K OK', 4, 27, '#b6f3a1');
      text(g, 'HDD 8 GB..OK', 4, 36, '#b6f3a1');
    },
    64,
    44,
  );
  const bootGeo = new PlaneGeometry(8, 5.5);
  const bootMat = new MeshBasicMaterial({ map: bootTex, toneMapped: false, fog: false });
  const tHaloGeo = new PlaneGeometry(30, 30);
  const tHaloMat = new MeshBasicMaterial({
    color: 0xb6f3a1,
    transparent: true,
    opacity: 0.08,
    blending: AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  disposables.push(bootTex, bootGeo, bootMat, tHaloGeo, tHaloMat);
  const target = new Mesh(bootGeo, bootMat);
  target.rotation.x = -Math.PI / 2;
  target.position.set(0, -depth - 2, 0);
  scene.add(target);
  const tHalo = new Mesh(tHaloGeo, tHaloMat);
  tHalo.rotation.x = -Math.PI / 2;
  tHalo.position.set(0, -depth - 1.9, 0);
  scene.add(tHalo);

  // Gold dust in the shaft.
  const n = coarse ? 400 : 900;
  const rnd = seeded(4242);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (rnd() - 0.5) * 16;
    pos[i * 3 + 1] = -rnd() * depth;
    pos[i * 3 + 2] = (rnd() - 0.5) * 16;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const dustMat = new PointsMaterial({
    color: 0xffcf86,
    size: 0.09,
    transparent: true,
    opacity: 0.8,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(dustGeo, dustMat);
  const dust = new Points(dustGeo, dustMat);
  scene.add(dust);

  let lastNow = 0;
  const size = new Vector2();

  return {
    draw(fall, through, lookX, lookY, now) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.getSize(size);
      if (size.x !== w || size.y !== h) {
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
      }
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;

      // Descent: fast in the middle, slowing at the gaps' ends; then through the last gap.
      const y = -fall * (depth - 6) - through * 8;
      const tumble = still ? 0 : (1 - smooth(0, 0.1, fall)) * 0.8;
      const spin = fall * Math.PI * 0.9 + (still ? 0 : Math.sin(now / 2600) * 0.03);
      cam.position.set(lookX * 1.6, y, lookY * 1.6);
      const roll = spin + tumble * Math.sin(now / 500);
      // Passing a gap, the gaze swings to its window and the view rights itself, so the
      // moment reads upright; then it turns back down the shaft.
      let gx = lookX * 0.4;
      let gz = lookY * 0.4;
      let gy = y - 20;
      let upright = 0;
      for (const win of windows) {
        const k = Math.max(0, 1 - Math.abs(win.y - y) / 22);
        const pull = k * k * (3 - 2 * k);
        if (pull > 0) {
          const g = pull * (still ? 0.7 : 0.95);
          gx += (win.x - gx) * g;
          gz += (win.z - gz) * g;
          gy += (win.y - gy) * g;
          upright = Math.max(upright, pull);
        }
      }
      cam.up
        .set(Math.sin(roll) * (1 - upright), upright, Math.cos(roll) * (1 - upright))
        .normalize();
      cam.lookAt(gx, gy, gz);
      cam.fov = (w / h < 0.8 ? 82 : 62) + through * 20;
      cam.updateProjectionMatrix();
      lamp.position.set(0, y - 4, 0);
      if (!still) dust.rotation.y += dt * 0.03;
      renderer.render(scene, cam);
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
