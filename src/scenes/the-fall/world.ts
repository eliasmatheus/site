/**
 * The fall in 3D: a tesseract of beams (src/scenes/the-fall/lattice.ts) drawn with three.js.
 * Loaded by dynamic import from the controller, so three.js only ships when it is needed.
 *
 * No lights and no image textures on the beams: one shader paints every face dark, with
 * lanes of light running along its length (amber, cream, a little teal and green) and, on
 * some faces, rows of lit compartments. The faster the visitor falls, the longer the
 * streaks: the smeared look of a flight through it. Hair-thin lines of light cross the space
 * on the three axes. In the gaps, moments of the story stand as small 3D scenes whose own
 * light leaks onto the beams (src/scenes/the-fall/memories.ts); at the bottom waits the first
 * computer.
 */
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  HalfFloatType,
  InstancedMesh,
  Mesh,
  NearestFilter,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { smooth } from './beats';
import { createLattice, type Box } from './lattice';
import { createMemories } from './memories';
import { COMPUTER, FREE, MEMORY_T, NAV_DIR, memoryAt, pathAt } from './path';

export interface Frame {
  fall: number;
  through: number;
  /** Pointer look, -1 to 1. */
  lookX: number;
  lookY: number;
  /** How fast the visitor is falling, 0 (still) to 1 (a hard flick). */
  speed: number;
  now: number;
}

export interface World {
  draw(f: Frame): void;
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

/** Lights the memories lend to the beams: four gaps and the first computer. */
const SPILLS = 5;

const VERTEX = /* glsl */ `
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vSeed;
varying vec3 vScale;
varying float vDepth;
varying vec3 vWorld;
varying vec3 vWN;
void main() {
  vWorld = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
  vWN = normalize(mat3(modelMatrix) * normal);
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vScale = sc;
  vLocal = position * sc;
  vNormal = normal;
  vSeed = instanceMatrix[3].xyz;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const BEAM = /* glsl */ `
uniform float uSpeed;
uniform float uGlow;
uniform vec3 uLP[${SPILLS}];
uniform vec3 uLC[${SPILLS}];
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vSeed;
varying vec3 vScale;
varying float vDepth;
varying vec3 vWorld;
varying vec3 vWN;

float h1(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }

void main() {
  vec3 n = abs(vNormal);
  vec2 face; float lu; float lv;
  if (n.x > 0.5) { face = vLocal.yz; lu = vScale.y; lv = vScale.z; }
  else if (n.y > 0.5) { face = vLocal.xz; lu = vScale.x; lv = vScale.z; }
  else { face = vLocal.xy; lu = vScale.x; lv = vScale.y; }
  // u runs along the face's long side.
  if (lv > lu) { face = face.yx; float t = lu; lu = lv; lv = t; }
  float u = face.x;
  float v = face.y;
  float seed = h1(floor(vSeed * 7.0) + vNormal * 3.1);

  // Lanes of light along the length, smeared like long exposures.
  float lanes = max(2.0, floor(lv * 3.2));
  float lw = (v / lv + 0.5) * lanes;
  float lane = floor(lw);
  float across = fract(lw);
  float lh = h1(vec3(lane, seed * 91.0, 3.0));
  float segLen = mix(2.0, 14.0, lh) * (1.0 + uSpeed * 4.0);
  float su = u / segLen + lh * 17.0;
  float seg = floor(su);
  float along = fract(su);
  float sh = h1(vec3(lane, seg, seed * 37.0));
  float on = step(0.6, sh);
  float line = pow(1.0 - abs(across - 0.5) * 2.0, 6.0);
  float ends = smoothstep(0.0, 0.18, along) * smoothstep(1.0, 0.35, along);
  float ph = h1(vec3(lane, seg, 5.0));
  vec3 tint = ph < 0.5 ? vec3(1.0, 0.52, 0.16)
    : ph < 0.78 ? vec3(1.0, 0.8, 0.52)
    : ph < 0.9 ? vec3(0.25, 0.82, 0.95)
    : ph < 0.96 ? vec3(0.45, 0.95, 0.55)
    : vec3(1.0, 0.96, 0.9);
  // The body: near black, with faint warm grain along the length.
  vec3 col = vec3(0.0035, 0.003, 0.0028) + vec3(0.012, 0.008, 0.005) * lh * lh;
  float bright = pow(sh, 6.0) * 5.0 + 0.25;
  col += tint * on * line * ends * bright * uGlow;

  // Some wide faces hold rows of lit compartments.
  if (seed > 0.8 && lv > 1.1) {
    vec2 g = vec2(u * 2.6, (v / lv + 0.5) * floor(lv * 3.0));
    vec2 cell = floor(g);
    vec2 f = fract(g);
    float ch = h1(vec3(cell, seed * 11.0));
    float box = step(0.16, f.x) * step(f.x, 0.84) * step(0.2, f.y) * step(f.y, 0.8);
    float inner = smoothstep(0.2, 0.8, f.y) * 0.8 + 0.2;
    vec3 lit = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.75, 0.42), ch * ch);
    col += lit * box * step(0.55, ch) * inner * (0.15 + 0.9 * pow(ch, 3.0)) * uGlow;
  }

  // The memories' lights leak onto the beams around them.
  for (int i = 0; i < ${SPILLS}; i++) {
    vec3 L = uLP[i] - vWorld;
    float d2 = dot(L, L);
    float facing = max(0.0, dot(normalize(L), vWN)) * 0.75 + 0.25;
    col += uLC[i] * facing * (0.02 + line * on * 0.7) * 14.0 / (1.0 + d2 * 0.3);
  }

  // Far beams sink into the dark.
  col *= exp(-vDepth * 0.02);
  col = 1.0 - exp(-col * 1.6);
  // Linear out: three encodes it for the screen, or leaves it linear for the lens pass.
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const GLINT = /* glsl */ `
uniform float uSpeed;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vSeed;
varying vec3 vScale;
varying float vDepth;
float h1(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  float len = max(vScale.x, max(vScale.y, vScale.z));
  float u = (vScale.x == len ? vLocal.x : vScale.y == len ? vLocal.y : vLocal.z) / len + 0.5;
  float seed = h1(floor(vSeed * 3.0));
  vec3 tint = seed < 0.55 ? vec3(1.0, 0.6, 0.22) : seed < 0.8 ? vec3(1.0, 0.88, 0.7) : vec3(0.3, 0.85, 1.0);
  float core = sin(u * 3.14159);
  float a = core * core * (0.5 + uSpeed * 1.2) * exp(-vDepth * 0.012);
  gl_FragColor = vec4(tint * a, 1.0);
  #include <colorspace_fragment>
}`;

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

/** Drawn at four times the design size, so text stays sharp up close. */
const SCALE = 4;

function pixelWindow(draw: Draw, w = 64, h = 48): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w * SCALE;
  c.height = h * SCALE;
  const g = c.getContext('2d');
  if (g) {
    g.imageSmoothingEnabled = false;
    g.scale(SCALE, SCALE);
    draw(g, w, h);
  }
  const t = new CanvasTexture(c);
  t.magFilter = NearestFilter;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
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
  g.font = `600 ${size}px ui-monospace, Menlo, monospace`;
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

/** Barrel distortion with a little color fringing, scaled so the corners stay filled. */
const LENS = /* glsl */ `
uniform sampler2D tMap;
uniform float uK;
uniform float uAspect;
varying vec2 vUv;
vec2 bend(vec2 uv, float k) {
  vec2 c = (uv - 0.5) * vec2(uAspect, 1.0);
  float edge = (uAspect * uAspect + 1.0) * 0.25;
  c *= (1.0 + k * dot(c, c)) / (1.0 + k * edge);
  return c / vec2(uAspect, 1.0) + 0.5;
}
void main() {
  float r = texture2D(tMap, bend(vUv, uK * 1.02)).r;
  vec2 gb = bend(vUv, uK);
  float g = texture2D(tMap, gb).g;
  float b = texture2D(tMap, bend(vUv, uK * 0.98)).b;
  vec2 c = vUv - 0.5;
  float vignette = 1.0 - dot(c, c) * 0.55;
  gl_FragColor = vec4(vec3(r, g, b) * vignette, 1.0);
  #include <colorspace_fragment>
}`;

/** The first computer's screen, booting. */
const BOOT: Draw = (g, w, h) => {
  g.fillStyle = '#0b0f0a';
  g.fillRect(0, 0, w, h);
  text(g, 'CPU: PENTIUM', 4, 10, '#b6f3a1');
  text(g, 'MEMORY TEST:', 4, 19, '#b6f3a1');
  text(g, '65536K OK', 4, 27, '#b6f3a1');
  text(g, 'HDD 8 GB..OK', 4, 36, '#b6f3a1');
};

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;

  const lattice = createLattice(coarse);
  const scene = new Scene();
  scene.background = new Color(0x030304);
  const cam = new PerspectiveCamera(62, 1, 0.1, 400);

  const unit = new BoxGeometry(1, 1, 1);
  const uniforms = {
    uSpeed: { value: 0 },
    uGlow: { value: 1 },
    uLP: { value: Array.from({ length: SPILLS }, () => new Vector3(0, 1e4, 0)) },
    uLC: { value: Array.from({ length: SPILLS }, () => new Vector3()) },
  };
  const beamMat = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: BEAM, uniforms });
  const glintMat = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: GLINT,
    uniforms,
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const disposables: { dispose(): void }[] = [unit, beamMat, glintMat];

  const instance = (list: Box[], mat: ShaderMaterial): void => {
    if (!list.length) return;
    const m = new InstancedMesh(unit, mat, list.length);
    const o = new Object3D();
    list.forEach(([x, y, z, sx, sy, sz], i) => {
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.frustumCulled = false;
    scene.add(m);
  };
  instance([...lattice.posts, ...lattice.beamsX, ...lattice.beamsZ, ...lattice.slats], beamMat);
  instance(lattice.glints, glintMat);

  // The memories: small 3D scenes beside the path, each with a light that leaks onto the beams.
  scene.add(new AmbientLight(0x2a2420, 0.6));
  const places = MEMORY_T.map((t, i) => ({ ...memoryAt(i), face: pathAt(t) }));
  const memories = createMemories(
    scene,
    places,
    { ...COMPUTER, face: pathAt(1) },
    {
      code: () => pixelWindow(WINDOWS[0] ?? (() => undefined)),
      boot: () => pixelWindow(BOOT, 64, 44),
    },
  );
  disposables.push(memories);
  memories.spills.forEach((sp, i) => {
    uniforms.uLP.value[i]?.copy(sp.position);
    uniforms.uLC.value[i]?.set(sp.color.r, sp.color.g, sp.color.b);
  });
  const sights = [...places.map((m, i) => ({ ...m, t: MEMORY_T[i] ?? 0 })), { ...COMPUTER, t: 1 }];

  // The lens: the frame is drawn into a texture, then bent a little outward (barrel), with a
  // trace of color fringing at the edges, like an ultra-wide lens. Only while navigating.
  const target = new WebGLRenderTarget(1, 1, { samples: coarse ? 0 : 4, type: HalfFloatType });
  const lensUniforms = {
    tMap: { value: target.texture },
    uK: { value: 0 },
    uAspect: { value: 1 },
  };
  const lensMat = new ShaderMaterial({
    uniforms: lensUniforms,
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: LENS,
  });
  const lensGeo = new PlaneGeometry(2, 2);
  const lensScene = new Scene();
  lensScene.add(new Mesh(lensGeo, lensMat));
  const lensCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  disposables.push(target, lensMat, lensGeo);

  // Specks of light drifting in the shaft.
  const n = coarse ? 500 : 1100;
  const rnd = seeded(4242);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // Half in the shaft, half along the glide.
    const p = pathAt(rnd());
    pos[i * 3] = p.x + (rnd() - 0.5) * 18;
    pos[i * 3 + 1] = p.y + (rnd() - 0.5) * 12;
    pos[i * 3 + 2] = p.z + (rnd() - 0.5) * 18;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const dustMat = new PointsMaterial({
    color: 0xffc77a,
    size: 0.08,
    transparent: true,
    opacity: 0.85,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  disposables.push(dustGeo, dustMat);
  const dust = new Points(dustGeo, dustMat);
  scene.add(dust);

  let lastNow = 0;
  const size = new Vector2();

  return {
    draw({ fall, through, lookX, lookY, speed, now }) {
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
      uniforms.uSpeed.value = still ? 0 : speed;

      const p = pathAt(fall);
      // 0 in free fall, 1 once righted and navigating.
      const nav = smooth(FREE - 0.05, FREE + 0.06, fall);
      const ahead = { x: NAV_DIR.x, z: NAV_DIR.z };
      const side = { x: Math.SQRT1_2, z: -Math.SQRT1_2 };
      // Through the end: on into the first computer's screen.
      const px = p.x + ahead.x * through * 9;
      const pz = p.z + ahead.z * through * 9;
      const py = p.y;

      // Free fall: down the shaft, tumbling and spinning, out of control.
      const tumble = still ? 0 : (1 - smooth(0, 0.1, fall)) * 0.8 + (1 - nav) * 0.18;
      const spin = fall * Math.PI * 2.4 + (still ? 0 : Math.sin(now / 2600) * 0.05);
      const roll = spin + tumble * Math.sin(now / 430);
      const fallLook = { x: px + lookX * 0.4, y: py - 20, z: pz + lookY * 0.4 };
      const fallUp = { x: Math.sin(roll), y: 0, z: Math.cos(roll) };

      // Navigation: level, looking along the diagonal, a little down. The grid runs to two
      // vanishing points, one each side.
      const navLook = {
        x: px + ahead.x * 20 + side.x * lookX * 3,
        y: py - 2.2 - lookY * 2,
        z: pz + ahead.z * 20 + side.z * lookX * 3,
      };
      let gx = fallLook.x + (navLook.x - fallLook.x) * nav;
      let gy = fallLook.y + (navLook.y - fallLook.y) * nav;
      let gz = fallLook.z + (navLook.z - fallLook.z) * nav;
      // Passing a memory, the gaze swings to it, then back to the way ahead.
      for (const m of sights) {
        const k = Math.max(0, 1 - Math.abs(m.t - fall) / 0.07);
        const pull = k * k * (3 - 2 * k) * nav * (still ? 0.45 : 0.6) * (m.t === 1 ? 0 : 1);
        gx += (m.x - gx) * pull;
        gy += (m.y + 1 - gy) * pull;
        gz += (m.z - gz) * pull;
      }
      cam.position.set(
        px + side.x * lookX * 1.2 * nav + lookX * 1.4 * (1 - nav),
        py,
        pz + side.z * lookX * 1.2 * nav + lookY * 1.4 * (1 - nav),
      );
      cam.up.set(fallUp.x * (1 - nav), nav, fallUp.z * (1 - nav)).normalize();
      cam.lookAt(gx, gy, gz);
      // The shaft through a normal lens; the glide through an ultra-wide one. Speed opens it
      // a little more, like a jump.
      const portrait = w / h < 0.8;
      const shaftFov = portrait ? 82 : 62;
      const wideFov = portrait ? 104 : 84;
      cam.fov = shaftFov + (wideFov - shaftFov) * nav + through * 16 + (still ? 0 : speed * 8);
      cam.updateProjectionMatrix();
      if (!still) dust.rotation.y += dt * 0.03;
      const k = nav * (portrait ? 0.24 : 0.17);
      if (k < 0.01) {
        renderer.setRenderTarget(null);
        renderer.render(scene, cam);
        return;
      }
      const dpr = renderer.getPixelRatio();
      const tw = Math.round(w * dpr);
      const th = Math.round(h * dpr);
      if (target.width !== tw || target.height !== th) target.setSize(tw, th);
      renderer.setRenderTarget(target);
      renderer.render(scene, cam);
      renderer.setRenderTarget(null);
      lensUniforms.uK.value = k;
      lensUniforms.uAspect.value = w / h;
      renderer.render(lensScene, lensCam);
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
