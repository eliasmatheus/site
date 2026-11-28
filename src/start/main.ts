/**
 * Lab: the first frame as a 2.5D painting. One painted image, split into layers (sky and land,
 * the traveller, the foreground frame), each moving at its own depth; on top of it, what must be
 * true or alive: the real sky (Yale catalogue stars, meteors, satellites), the base's lights
 * blinking, mist drifting in the valley, the sea glinting, the leaves in the wind.
 *
 * Query: ?still (one frame, for screenshots), ?t=4 (time of the still), ?par=0 (no parallax).
 */
import * as THREE from 'three';
import { createSky, equatorialToLocal, framedSky } from '../lab/earth/sky';
import { createSkyLife } from '../lab/earth/skylife';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createLedge } from './ledge';

/** The painting's size, in its own pixels. */
const IW = 1672;
const IH = 941;

/** A point in the painting (its pixels): x, y, blink phase (or -1 for a steady lamp), size. */
type Light = [number, number, number, number];

interface Painting {
  dir: string;
  lights: Light[];
  /** Where the base is (x), kept in view on a phone. */
  baseX: number;
  /** The traveller's left edge (x), kept at the phone's left. */
  heroLeft: number;
  /** His centre (x) and the top of his head (y), for the 3D traveller. */
  heroX: number;
  heroTop: number;
  /** Separate sea layers (water without foam, foam, a flow map), aligned with the plate. */
  sea?: boolean;
}

const PAINTINGS: Record<string, Painting> = {
  // The first one-shot, with the painted traveller.
  '1': {
    dir: '/models/lab/painted',
    lights: [
      [945, 632, 0.0, 1],
      [1047, 592, 0.4, 1],
      [1082, 579, 0.9, 1],
      [1200, 580, 0.2, 1],
      [1220, 597, 0.7, 1],
      [1322, 636, 0.5, 1],
      [987, 687, -1, 0.6],
      [1011, 687, -1, 0.6],
      [1280, 697, -1, 0.6],
    ],
    baseX: 1130,
    heroLeft: 330,
    heroX: 560,
    heroTop: 140,
  },
  // The clean plate (no interface), the Sun setting behind him; the traveller is 3D.
  '2': {
    dir: '/models/lab/painted2',
    lights: [
      [977, 630, 0.1, 1],
      [1027, 635, 0.6, 0.8],
      [1082, 579, 0.3, 1],
      [1111, 562, 0.8, 1],
      [1247, 566, 0.5, 1],
      [1269, 585, 0.0, 1],
      [1319, 642, 0.7, 1],
      [1354, 651, 0.25, 1],
      [1137, 632, -1, 0.6],
      [1375, 455, -1, 0.35],
      [1600, 481, -1, 0.35],
    ],
    baseX: 1170,
    heroLeft: 330,
    heroX: 540,
    heroTop: 185,
  },
  // The clean plate (nothing in front of the land), with the second one's tree and bush.
  '3': {
    dir: '/models/lab/painted3',
    lights: [
      [979, 630, 0.1, 1],
      [1081, 576, 0.3, 1],
      [1108, 562, 0.8, 1],
      [1249, 562, 0.5, 1],
      [1270, 581, 0.0, 1],
      [1356, 642, 0.7, 1],
      [1134, 640, 0.45, 0.7],
      [1212, 642, 0.9, 0.7],
      [1026, 646, -1, 0.6],
      [1321, 655, -1, 0.6],
      [946, 664, -1, 0.5],
      [1378, 460, -1, 0.35],
      [1590, 483, -1, 0.35],
      [1497, 440, -1, 0.3],
    ],
    baseX: 1170,
    heroLeft: 330,
    heroX: 640,
    heroTop: 185,
  },
  // The clean plate without the planet; the second painting's whole tree, bush and plants in
  // front (keyed by the difference between the two).
  '4': {
    dir: '/models/start/painting',
    sea: true,
    lights: [
      [979, 630, 0.1, 1],
      [1081, 576, 0.3, 1],
      [1108, 562, 0.8, 1],
      [1249, 562, 0.5, 1],
      [1270, 581, 0.0, 1],
      [1356, 642, 0.7, 1],
      [1134, 640, 0.45, 0.7],
      [1212, 642, 0.9, 0.7],
      [1026, 646, -1, 0.6],
      [1321, 655, -1, 0.6],
      [946, 664, -1, 0.5],
      [1378, 460, -1, 0.35],
      [1590, 483, -1, 0.35],
      [1497, 440, -1, 0.3],
    ],
    baseX: 1170,
    heroLeft: 330,
    heroX: 640,
    heroTop: 185,
  },
};

const params = new URLSearchParams(location.search);
const num = (k: string, d: number): number => {
  const v = Number(params.get(k));
  return params.has(k) && Number.isFinite(v) ? v : d;
};
const P: Painting = PAINTINGS[params.get('v') ?? '4'] ?? (PAINTINGS['4'] as Painting);
/** The 3D traveller, unless asked for the painted one (or the painting has nothing else). */
/** Which rigged traveller: Mixamo motion on the suit, or the hand-posed ones. */
const MODEL = params.has('model') ? `lab/${params.get('model') ?? ''}` : 'start/traveller';
/** The Mixamo-rigged suit is modelled in metres; the hand-posed ones are not. */
const MIXAMO = !params.has('model') || MODEL.includes('mixamo');
/** Ground speed of the Stride clip, m/s (bind.py prints it). */
const STRIDE = 1.27;
const HERO_3D = !P.dir.endsWith('/painted') && params.get('hero') !== 'paint';

const FRAGMENT = (lights: number): string => `
precision highp float;
uniform sampler2D uBg, uHero, uFg, uMasks, uStars, uHero3D, uWater, uFoam, uFlow;
uniform float uSea;
uniform float uUse3D, uHeroExp, uPaint;
uniform vec2 uHeroRes;
uniform vec2 uFeet;
uniform vec2 uRes;
uniform vec4 uLand;   // offset x, offset y, scale, depth (device px, y down)
uniform vec4 uFront;  // the same, for the traveller and the foreground
uniform vec2 uPar;    // parallax, device px at depth 1
uniform float uTime, uPx, uTopFade;
uniform vec4 uLights[${lights}];
const vec2 IMG = vec2(${IW}.0, ${IH}.0);

float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 x) { vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
float fb(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }

vec2 toImg(vec2 screen, vec4 l, float depth) { return (screen - l.xy - uPar * depth) / l.z; }
vec2 tex(vec2 img) { return vec2(img.x / IMG.x, 1.0 - img.y / IMG.y); }
bool inside(vec2 img) { return img.x >= 0.0 && img.y >= 0.0 && img.x <= IMG.x && img.y <= IMG.y; }

void main() {
  vec2 screen = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);

  // 1. Sky and land: one plate, the land a little nearer than the sky.
  vec2 skyImg = toImg(screen, uLand, uLand.w * 0.45);
  vec2 landImg = toImg(screen, uLand, uLand.w);
  vec4 m = texture2D(uMasks, tex(clamp(landImg, vec2(0.0), IMG)));
  vec2 plateImg = mix(skyImg, landImg, m.b);
  // Above the painting (a tall screen): its night continues, blurred out of its top edge.
  vec2 pc = clamp(plateImg, vec2(1.0), IMG - 1.0);
  vec3 col = texture2D(uBg, tex(pc)).rgb;
  float lumP = dot(col, vec3(0.299, 0.587, 0.114));

  // The sky lives, without ghosts: each point of the painted clouds sways a few pixels, slowly
  // (one sample, a warp that evolves), so the clouds billow in place. The comet and the Sun's disc
  // stay still. Over the sunset band, thin warm veils of haze drift to the left: real motion.
  vec2 cA = vec2(925.0, 165.0), cB = vec2(1080.0, 92.0);
  float cT = clamp(dot(pc - cA, cB - cA) / dot(cB - cA, cB - cA), 0.0, 1.0);
  float comet = 1.0 - smoothstep(18.0, 34.0, length(pc - mix(cA, cB, cT)));
  float skyW = (1.0 - m.b) * smoothstep(0.14, 0.3, lumP) * (1.0 - comet)
    * smoothstep(40.0, 90.0, length(pc - vec2(737.0, 382.0)));
  if (skyW > 0.001) {
    vec2 sway = vec2(fb(pc * 0.005 + vec2(uTime * 0.035, 0.0)) - 0.5, fb(pc * 0.005 + vec2(17.0, uTime * 0.028)) - 0.5);
    vec3 billow = texture2D(uBg, tex(clamp(pc + sway * vec2(9.0, 3.0), vec2(1.0), IMG - 1.0))).rgb;
    col = mix(col, billow, skyW);
  }
  float band = (1.0 - m.b) * smoothstep(150.0, 260.0, pc.y) * smoothstep(420.0, 330.0, pc.y);
  float veil = smoothstep(0.52, 0.8, fb(pc * vec2(0.0035, 0.011) + vec2(uTime * 0.02, 0.0)));
  col += band * veil * (0.06 + 0.12 * col) * vec3(1.0, 0.75, 0.55);

  // The sea moves.
  float seaA = 0.0;
  if (uSea > 0.5) {
    // In layers: the water runs towards the sand along the flow map (two phases cross-faded; the
    // water has no hard detail to ghost), less towards the horizon and not at all at the ships;
    // swells roll in along the flow; the foam, its own layer, surges up the beach.
    // A blurred read of the map (a coarser mip): its edge is stepped, and a sharp read stripes the foam.
    vec4 fl = texture2D(uFlow, tex(pc), 2.5);
    fl.a = texture2D(uFlow, tex(pc)).a;
    seaA = fl.a;
    if (seaA > 0.01) {
      vec2 flow = (fl.rg - 0.5) * 2.0;
      float far = smoothstep(425.0, 560.0, pc.y);
      float ships = min(min(length(pc - vec2(1378.0, 460.0)), length(pc - vec2(1590.0, 483.0))), length(pc - vec2(1497.0, 440.0)));
      vec2 d = flow * (4.0 + 14.0 * far) * smoothstep(14.0, 40.0, ships);
      float p0 = fract(uTime * 0.11);
      float p1 = fract(uTime * 0.11 + 0.5);
      vec4 w0 = texture2D(uWater, tex(clamp(pc - d * p0, vec2(1.0), IMG - 1.0)));
      vec4 w1 = texture2D(uWater, tex(clamp(pc - d * p1, vec2(1.0), IMG - 1.0)));
      vec4 water = mix(w0, w1, abs(1.0 - 2.0 * p0));
      vec2 dir = length(flow) > 0.01 ? normalize(flow) : vec2(0.0, 1.0);
      float crest = sin(dot(pc, dir) * (0.25 + 0.25 * far) - uTime * 1.6 + 2.0 * fb(pc * 0.01));
      water.rgb *= 1.0 + 0.08 * crest * far;
      col = col * (1.0 - water.a) + water.rgb;
      float surge = sin(uTime * 1.25 - fl.b * 7.0);
      vec4 foam = texture2D(uFoam, tex(clamp(pc - flow * 3.0 * surge, vec2(1.0), IMG - 1.0)));
      foam *= 0.6 + 0.4 * (0.5 + 0.5 * surge) + 0.25 * smoothstep(0.6, 1.0, fl.b) * max(0.0, sin(uTime * 2.1 - pc.x * 0.03));
      col = col * (1.0 - min(foam.a, 1.0)) + foam.rgb;
    }
  } else if (m.g > 0.01) {
    // One flat painting: a small travelling warp, crests and pulsing foam.
    vec2 w = vec2(sin(pc.y * 0.8 + uTime * 1.4 + sin(pc.x * 0.04)) * 2.6, sin(pc.x * 0.06 - uTime * 0.9) * 0.8);
    vec3 sea = texture2D(uBg, tex(clamp(pc + w, vec2(1.0), IMG - 1.0))).rgb;
    float crest = sin(pc.y * 0.42 + pc.x * 0.018 - uTime * 1.5 + 2.0 * fb(pc * 0.01));
    sea *= 1.0 + 0.09 * crest;
    float foam = smoothstep(0.5, 0.78, dot(sea, vec3(0.299, 0.587, 0.114)));
    sea += foam * (0.5 + 0.5 * sin(pc.x * 0.045 + pc.y * 0.11 - uTime * 2.2)) * 0.16;
    col = mix(col, sea, m.g);
  }

  // A tall screen: the painting's top dissolves into a night that goes on above it.
  float night = uTopFade * smoothstep(uTopFade * 240.0, 0.0, plateImg.y);
  vec3 nightCol = mix(vec3(0.07, 0.08, 0.17), vec3(0.008, 0.012, 0.035),
    smoothstep(0.0, 1.0, -plateImg.y / (IMG.y * 0.7)));
  col = mix(col, nightCol, night);
  float starMask = max(m.r, night);

  // Mist breathing in the valley, drifting slowly to the left.
  float valley = smoothstep(560.0, 640.0, plateImg.y) * smoothstep(800.0, 690.0, plateImg.y) * m.b;
  float mist = fb(plateImg * vec2(0.006, 0.02) + vec2(uTime * 0.025, 0.0));
  col = mix(col, vec3(0.78, 0.7, 0.72), valley * smoothstep(0.45, 0.85, mist) * 0.28);

  // The sea glints.
  float glint = smoothstep(0.93, 1.0, n2(plateImg * vec2(0.22, 1.1) + vec2(uTime * 0.5, uTime * 0.12)));
  col += max(m.g, seaA) * glint * vec3(1.0, 0.85, 0.65) * 0.8;

  // The base's lights: red beacons on the towers blink, the lamps glow.
  for (int i = 0; i < ${lights}; i++) {
    vec4 L = uLights[i];
    float d = length(landImg - L.xy) / L.w;
    float on = L.z < 0.0 ? 0.55 : (sin(uTime * 2.4 + L.z * 6.283) > 0.2 ? 1.0 : 0.08);
    vec3 c = L.z < 0.0 ? vec3(1.0, 0.78, 0.45) : vec3(1.0, 0.22, 0.12);
    col += c * on * (exp(-d * d * 0.35) * 0.9 + exp(-d * 0.35) * 0.12);
  }

  // The real sky: stars, meteors and satellites, where the painted sky is dark.
  vec3 stars = texture2D(uStars, gl_FragCoord.xy / uRes).rgb;
  // ... and they twinkle.
  float tw = 0.65 + 0.7 * n2(gl_FragCoord.xy * 0.35 + vec2(uTime * 2.3, uTime * 1.7));
  col += pow(clamp(stars, 0.0, 1.0), vec3(1.0 / 2.2)) * starMask * tw;

  // 2. The traveller.
  vec2 heroImg = toImg(screen, uFront, uFront.w);
  if (uUse3D > 0.5) {
    // Rendered in the painting's own frame: linear light, filmic curve, then sRGB.
    if (inside(heroImg)) {
      vec4 h = texture2D(uHero3D, tex(heroImg));
      if (h.a > 0.001) {
        // Painted like the rest: a small Kuwahara (each pixel takes the calmest corner).
        vec2 px = 1.0 / uHeroRes;
        vec2 uv = tex(heroImg);
        vec4 best = h; float minVar = 1e9;
        for (int k = 0; k < 4; k++) {
          vec2 dir = vec2(k == 1 || k == 3 ? 1.0 : -1.0, k >= 2 ? 1.0 : -1.0);
          vec4 m = vec4(0.0); vec3 s2 = vec3(0.0);
          for (int j = 0; j <= 2; j++) for (int i = 0; i <= 2; i++) {
            vec4 c = texture2D(uHero3D, uv + vec2(float(i), float(j)) * dir * px * uPaint);
            m += c; s2 += c.rgb * c.rgb;
          }
          m /= 9.0; s2 /= 9.0;
          vec3 v = abs(s2 - m.rgb * m.rgb);
          float var = v.r + v.g + v.b;
          if (var < minVar) { minVar = var; best = m; }
        }
        h = best;
        vec3 c = h.rgb / max(h.a, 1e-3) * uHeroExp;
        c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
        c = pow(c, vec3(1.0 / 2.2));
        // Into the painting's air: warmer, the blacks lifted a little towards the dusk.
        c = c * vec3(1.0, 0.93, 0.86) + vec3(0.035, 0.025, 0.04) * (1.0 - c);
        col = col * (1.0 - h.a) + c * h.a;
      }
    }
  } else {
    // The painted one, breathing (the chest rises: a stretch up from the feet).
    heroImg = uFeet + (heroImg - uFeet) / vec2(1.0, 1.0 + 0.0035 * sin(uTime * 1.5));
    if (inside(heroImg)) {
      vec4 h = texture2D(uHero, tex(heroImg));
      col = col * (1.0 - h.a) + h.rgb;
    }
  }

  // 3. The foreground frame, nearest: leaves and grass in the wind.
  vec2 fgImg = toImg(screen, uFront, uFront.w * 1.6);
  float tree = smoothstep(380.0, 60.0, fgImg.y) * smoothstep(80.0, 500.0, fgImg.x);
  float grass = smoothstep(900.0, 620.0, fgImg.y) * smoothstep(560.0, 900.0, fgImg.y + 300.0);
  float sway = tree * 3.0 + grass * 2.0;
  fgImg += sway * vec2(
    sin(uTime * 1.3 + fgImg.y * 0.02 + fgImg.x * 0.011) + 0.5 * sin(uTime * 2.9 + fgImg.x * 0.05),
    0.4 * cos(uTime * 1.1 + fgImg.x * 0.017));
  if (inside(fgImg)) {
    vec4 f = texture2D(uFg, tex(fgImg));
    // On a tall screen the tree would be cut by the painting's top: let it fade first.
    f *= mix(1.0, smoothstep(480.0, 560.0, fgImg.y), uTopFade);
    col = col * (1.0 - f.a) + f.rgb;
  }

  // Finish: a soft vignette and a fine grain.
  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= mix(1.0, 0.7, smoothstep(0.3, 0.85, length(c * vec2(uRes.x / uRes.y, 1.0)) / max(uRes.x / uRes.y, 1.0) * 1.3));
  col += (h1(gl_FragCoord.xy + fract(uTime * 7.0)) - 0.5) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}`;

const canvas = document.querySelector<HTMLCanvasElement>('[data-painted]');
// Without WebGL the screen is still its words and its two ways in.
if (canvas) {
  try {
    start(canvas);
  } catch {
    canvas.remove();
  }
}

function start(canvas: HTMLCanvasElement): void {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pixelRatio = Math.min(devicePixelRatio, 2);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;

  // The real sky, alone: no dome, only the stars and what crosses them.
  const sky = createSky({
    toLocal: equatorialToLocal(-2.37, 17.05, 48),
    sun: new THREE.Vector3(0, -1, 0),
    fog: new THREE.Color(0),
    pixelRatio,
  });
  const dome = sky.group.children[0];
  if (dome) dome.visible = false;
  const skyLife = createSkyLife(pixelRatio);
  const skyScene = new THREE.Scene();
  skyScene.add(sky.group, skyLife.group);
  const skyCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 9000);
  skyCamera.position.set(0, 0, 0);
  skyCamera.lookAt(new THREE.Vector3(0, Math.tan(0.35), -1));
  const skyTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });

  // Turn the real Milky Way onto the painted one: its core up and right of centre, the band
  // climbing to the upper right.
  const frameStars = (): void => {
    skyCamera.updateMatrixWorld();
    const f = new THREE.Vector3();
    skyCamera.getWorldDirection(f);
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(skyCamera.quaternion);
    const u = new THREE.Vector3(0, 1, 0).applyQuaternion(skyCamera.quaternion);
    const ty = Math.tan((skyCamera.fov * Math.PI) / 360);
    const tx = ty * skyCamera.aspect;
    const core = f
      .clone()
      .addScaledVector(r, tx * num('corex', 0.32))
      .addScaledVector(u, ty * num('corey', 0.7));
    const along = r.clone().multiplyScalar(0.67).addScaledVector(u, 0.74);
    sky.setOrientation(framedSky(core, along));
  };

  const hero3D = createHero3D(renderer);

  const loader = new THREE.TextureLoader();
  let pending = (HERO_3D ? 5 : 4) + (P.sea ? 3 : 0);
  const load = (name: string, alpha: boolean, ext = 'webp'): THREE.Texture => {
    const t = loader.load(`${P.dir}/${name}.${ext}`, () => {
      pending--;
    });
    t.colorSpace = THREE.NoColorSpace;
    t.premultiplyAlpha = alpha;
    t.anisotropy = 4;
    return t;
  };

  const lights = P.lights.map(([x, y, p, s]) => new THREE.Vector4(x, y, p, s * 4));
  const uniforms = {
    uBg: { value: load('bg', false) },
    uHero: { value: load('hero', true) },
    uFg: { value: load('fg', true) },
    uMasks: { value: load('masks', false) },
    // The sea in layers (Gemini, from our brief): water, foam, and where the water runs.
    uWater: { value: P.sea ? load('sea-water', true) : new THREE.Texture() },
    uFoam: { value: P.sea ? load('sea-foam', true) : new THREE.Texture() },
    uFlow: { value: P.sea ? load('sea-flow', false, 'png') : new THREE.Texture() },
    uSea: { value: P.sea ? 1 : 0 },
    uStars: { value: skyTarget.texture },
    uRes: { value: new THREE.Vector2(1, 1) },
    uLand: { value: new THREE.Vector4() },
    uFront: { value: new THREE.Vector4() },
    uPar: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uPx: { value: pixelRatio },
    uTopFade: { value: 0 },
    uLights: { value: lights },
    uHero3D: { value: hero3D.target.texture },
    uUse3D: { value: HERO_3D ? 1 : 0 },
    uHeroExp: { value: num('hexp', 0.78) },
    uPaint: { value: num('hpaint', 1) },
    uHeroRes: { value: hero3D.size },
    uFeet: { value: new THREE.Vector2(P.heroX, IH) },
  };
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FRAGMENT(P.lights.length),
      uniforms,
      depthTest: false,
      depthWrite: false,
    }),
  );
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /** Depth of the nearest layer, in device px of parallax at full tilt. */
  let reach = 0;
  const resize = (): void => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const W = w * pixelRatio;
    const H = h * pixelRatio;
    skyTarget.setSize(W, H);
    uniforms.uRes.value.set(W, H);
    skyCamera.aspect = w / h;
    skyCamera.updateProjectionMatrix();
    frameStars();
    const tall = w / h < 0.8;
    reach = (tall ? 6 : 10) * pixelRatio;
    if (!tall) {
      // Cover, with a little overscan for the parallax.
      const s = Math.max(W / IW, H / IH) * 1.03;
      const ox = (W - IW * s) / 2;
      const oy = (H - IH * s) / 2;
      uniforms.uLand.value.set(ox, oy, s, 0.45);
      uniforms.uFront.value.set(ox, oy, s, 1);
      uniforms.uTopFade.value = 0;
      hero3D.setScale(s);
    } else {
      // A phone: the painting sits low, under a sky that goes on; the land slides left so the
      // base shows beside the traveller, who keeps the left.
      const s = (H * num('ph', 0.6)) / IH;
      const oy = H - IH * s;
      uniforms.uLand.value.set(W * num('bx', 0.84) - P.baseX * s, oy, s, 0.45);
      uniforms.uFront.value.set(W * num('hx', -0.02) - P.heroLeft * s, oy, s, 1);
      uniforms.uTopFade.value = 1;
      hero3D.setScale(s);
    }
  };
  resize();
  addEventListener('resize', resize);

  // Turn him: drag across him (mouse, or a sideways swipe on a phone; an up-down swipe still
  // scrolls). Let go and he spins on a little and stays where he stops.
  const turn = {
    angle: num('spin', 0),
    velocity: 0,
    dragging: false,
    lastX: 0,
    releasedAt: -1e9,
    step(): void {
      if (this.dragging) return;
      this.angle += this.velocity;
      this.velocity *= 0.92;
    },
  };
  /** Is the pointer over him? (a box around him in the painting's pixels) */
  const overHero = (x: number, y: number): boolean => {
    const f = uniforms.uFront.value;
    const ix = (x * pixelRatio - f.x - uniforms.uPar.value.x) / f.z;
    const iy = (y * pixelRatio - f.y - uniforms.uPar.value.y) / f.z;
    return Math.abs(ix - P.heroX) < 190 && iy > P.heroTop - 30;
  };
  const release = (): void => {
    if (!turn.dragging) return;
    turn.dragging = false;
    turn.releasedAt = performance.now();
    document.body.style.cursor = '';
  };
  canvas.style.touchAction = 'pan-y';
  addEventListener('pointerdown', (e) => {
    if (!HERO_3D || hero3D.walking || (e.target as Element).closest('a, button, .card')) return;
    if (!overHero(e.clientX, e.clientY)) return;
    turn.dragging = true;
    turn.lastX = e.clientX;
    turn.velocity = 0;
    document.body.style.cursor = 'grabbing';
  });
  addEventListener('pointermove', (e) => {
    // A drag whose release was missed (outside the window, a lost event): let go here.
    if (turn.dragging && e.buttons === 0 && e.pointerType === 'mouse') release();
    if (turn.dragging) {
      const d = (e.clientX - turn.lastX) * 0.012;
      turn.angle += d;
      turn.velocity = d;
      turn.lastX = e.clientX;
    } else if (HERO_3D && e.pointerType === 'mouse') {
      const over =
        overHero(e.clientX, e.clientY) && !(e.target as Element).closest('a, button, .card');
      document.body.style.cursor = over ? 'grab' : '';
    }
  });
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('mouseup', release);
  addEventListener('blur', release);

  // Parallax: the pointer on a desktop, a slow drift always.
  const pointer = new THREE.Vector2();
  const eased = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });

  const still = params.has('still');
  const parallax = num('par', 1);
  const t0 = performance.now();
  // Too slow to animate (no GPU, or a very weak one): paint one frame and stop, so the page and
  // its links stay responsive. A software renderer is slow from the start; otherwise judge by
  // the frames after the first few (those compile shaders).
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  let slow = /swiftshader|llvmpipe|software/i.test(gpu);
  let frames = 0;
  let spent = 0;
  let prev = 0;
  const frame = (): void => {
    const t = still ? num('t', 4) : (performance.now() - t0) / 1000;
    eased.lerp(pointer, 0.05);
    const drift = new THREE.Vector2(Math.sin(t * 0.13) * 0.5, Math.sin(t * 0.09) * 0.25);
    uniforms.uPar.value
      .copy(eased)
      .multiplyScalar(-1)
      .add(still || reduced ? new THREE.Vector2() : drift)
      .multiplyScalar(reach * parallax);
    uniforms.uTime.value = reduced ? 4 : t;
    skyLife.update(reduced ? 4 : t, skyCamera);
    sky.follow(skyCamera);
    if (HERO_3D) {
      turn.step();
      hero3D.setSpin(turn.angle);
      hero3D.render(reduced ? 4 : t, eased);
    }
    renderer.setRenderTarget(skyTarget);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(skyScene, skyCamera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    const now = performance.now();
    if (++frames > 3) spent += now - prev;
    prev = now;
    if (frames === 11 && spent / 8 > 120) slow = true;
    if (still || slow) {
      document.documentElement.dataset['ready'] = '';
      return;
    }
    requestAnimationFrame(frame);
  };
  if (HERO_3D)
    hero3D.load(uniforms.uBg.value, () => {
      pending--;
      if (!still && location.pathname.startsWith('/lab')) clipBar(hero3D);
      // The game begins: he turns to the left and walks out, the screen's words fade, the screen
      // goes dark and the journey takes over. With reduced motion the link just goes there.
      const start = document.querySelector<HTMLAnchorElement>('a.start');
      start?.addEventListener('click', (e) => {
        if (reduced || slow || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        hero3D.walk();
        start.closest('main')?.classList.add('leaving');
        setTimeout(() => location.assign(start.href), 3600);
      });
    });
  const whenLoaded = (): void => {
    if (pending > 0) setTimeout(whenLoaded, 100);
    // Give the star catalogue a moment on a still render.
    else if (still) setTimeout(frame, 900);
    else requestAnimationFrame(frame);
  };
  whenLoaded();
}

/**
 * The traveller in 3D ("Astronaut" by Jungle Jim, CC BY 4.0, rigged in Blender), helmet closed,
 * rendered in the painting's own frame so it moves with the front layer. Lit like the painting:
 * the Sun setting behind him and a little to the right (a warm rim), the dusk sky in front (a
 * cool fill), the painting itself in the visor.
 */
function createHero3D(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, IW / IH, 0.1, 100);
  const target = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 });
  const size = new THREE.Vector2(2, 2);
  const pivot = new THREE.Group();
  /** The walk out: when it began (scene time), where he stood, how he was turned. */
  let walkFrom = -1;
  let walkAsked = false;
  let walkX = 0;
  let walkZ = 0;
  let walkRy = 0;
  scene.add(pivot);
  let mixer: THREE.AnimationMixer | null = null;
  const actions = new Map<string, THREE.AnimationAction>();
  let current: THREE.AnimationAction | null = null;
  let last = -1;
  /** Left to itself he mostly breathes; now and then he settles (Neutral), more rarely he looks
   * around at the place. A click on the lab's clip bar takes over. */
  let auto = !params.has('clip') && !params.has('still');
  let until = 0;
  const pick = (t: number): void => {
    const name = current?.getClip().name;
    let next = 'Breathing';
    let hold = 16 + Math.random() * 14;
    if (name === 'Breathing') {
      next = Math.random() < 0.7 ? 'Neutral' : 'LookAround';
      hold = actions.get(next)?.getClip().duration ?? 8;
    }
    if (!actions.has(next)) return;
    play(next);
    until = t + hold;
  };
  let head: THREE.Object3D | null = null;
  let hips: THREE.Object3D | null = null;
  let headRest: THREE.Quaternion | null = null;
  let ground: ReturnType<typeof createLedge> | null = null;
  const look = new THREE.Quaternion();
  /** The traveller turned by the visitor (radians), on top of his set turn. */
  let model3: THREE.Object3D | null = null;
  let spin = 0;
  const euler = new THREE.Euler();

  const sun = new THREE.DirectionalLight(0xffa864, num('sun', 11));
  const fill = new THREE.DirectionalLight(0x8f9cd6, num('fill', 0.35));
  const bounce = new THREE.DirectionalLight(0xc98a52, 0.5);
  // A grazing light from behind on the Sun's side: the bright edge that cuts him out of the sky.
  const rim = new THREE.DirectionalLight(0xffc48a, num('rim', 9));
  scene.add(sun, sun.target, fill, fill.target, bounce, bounce.target, rim, rim.target);
  for (const l of [sun, rim]) {
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    const c = l.shadow.camera;
    c.left = c.bottom = -4;
    c.right = c.top = 4;
    c.near = 1;
    c.far = 30;
  }
  scene.add(new THREE.HemisphereLight(0x9c8fb8, 0x3c2a1a, num('hemi', 0.25)));

  /** Cross-fade to another clip. */
  const play = (name: string): void => {
    const next = actions.get(name);
    if (!next || next === current) return;
    next.reset().setEffectiveWeight(1).fadeIn(0.8).play();
    current?.fadeOut(0.8);
    current = next;
  };

  return {
    target,
    /** Device px per painting px. */
    size,
    setScale(s: number): void {
      const k = Math.min(s, 2600 / IW);
      size.set(Math.round(IW * k), Math.round(IH * k));
      target.setSize(size.x, size.y);
    },
    load(plate: THREE.Texture, done: () => void): void {
      new GLTFLoader().load(`/models/${MODEL}.glb`, (gltf) => {
        const model = gltf.scene;
        model.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.frustumCulled = false;
            o.castShadow = true;
            o.receiveShadow = true;
            // The helmet lamps are off: dusk, not a night walk.
            const m = o.material as THREE.MeshStandardMaterial;
            if (m.name.includes('lamps')) m.emissiveIntensity = 0.15;
            if (/Suit|Shell|Harness|Rubber/.test(m.name)) worn(m);
          }
          // What turns towards the visitor: the head, or in the Mixamo suit (whose helmet is fixed to
          // the torso, as a real one is) the upper chest.
          if (o.name === 'head' || o.name === 'mixamorigSpine2') head = o;
          if (o.name === 'hips' || o.name === 'mixamorigHips') hips = o;
        });
        if (head) headRest = (head as THREE.Object3D).quaternion.clone();
        // The hand-rigged suits are 1 unit tall; the Mixamo one is already in metres.
        model.scale.setScalar(MIXAMO ? 1 : 1.8);
        model.rotation.y = num('ry', 0.85);
        model3 = model;
        pivot.add(model);
        // Every clip ready to play; the one asked for (?clip=, any case) starts, or the first.
        if (params.get('clip') !== 'rest' && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          for (const c of gltf.animations) actions.set(c.name, mixer.clipAction(c));
          const asked = (params.get('clip') ?? '').toLowerCase();
          const first =
            gltf.animations.find((a) => a.name.toLowerCase() === asked) ??
            gltf.animations.find((a) => a.name === 'Breathing') ??
            gltf.animations[0];
          if (first) {
            current = actions.get(first.name) ?? null;
            current?.play();
          }
          mixer.setTime(0);
        }
        // Fit: the top of the helmet on the painted head, the feet below the frame.
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const h = box.max.y - box.min.y;
        const t = Math.tan((camera.fov * Math.PI) / 360);
        const top = 1 - (2 * num('htop', P.heroTop)) / IH;
        const feet = 1 - (2 * num('hfeet', 1190)) / IH;
        const dt = h / (top - feet);
        const d = dt / t;
        const x = ((2 * num('hcx', P.heroX)) / IW - 1) * dt * camera.aspect;
        // Centred on his hips: the bind pose's box (arms out in a T) is wider than he stands.
        const cx = hips
          ? (hips as THREE.Object3D).getWorldPosition(new THREE.Vector3()).x
          : (box.min.x + box.max.x) / 2;
        pivot.position.set(x - cx, feet * dt - box.min.y, -d);
        // Light from the painting's Sun: behind him, a little right, low; the fill from the
        // camera's side, high on the left; a warm bounce from the rock under him.
        const at = new THREE.Vector3(x, feet * dt + h * 0.6, -d);
        sun.position.copy(at).add(new THREE.Vector3(num('sunx', 3), num('suny', 1.6), -10));
        sun.target.position.copy(at);
        fill.position.copy(at).add(new THREE.Vector3(-5, 4, 6));
        fill.target.position.copy(at);
        bounce.position.copy(at).add(new THREE.Vector3(1, -6, 3));
        bounce.target.position.copy(at);
        rim.position.copy(at).add(new THREE.Vector3(6, 2.5, -3));
        rim.target.position.copy(at);
        // The ground he stands on: a ledge that ends a few metres behind him.
        ground = createLedge(
          new THREE.Vector3(x, feet * dt, -d),
          new THREE.Vector3(num('sunx', 3), num('suny', 1.6), -10),
        );
        // The painting as the world around him, for the visor and the sheen of the suit.
        const withEnv = (): void => {
          const img = plate.image as HTMLImageElement | undefined;
          if (!img?.complete) {
            setTimeout(withEnv, 50);
            return;
          }
          const env = new THREE.Texture(img);
          env.mapping = THREE.EquirectangularReflectionMapping;
          env.colorSpace = THREE.SRGBColorSpace;
          env.needsUpdate = true;
          const pmrem = new THREE.PMREMGenerator(renderer);
          scene.environment = pmrem.fromEquirectangular(env).texture;
          if (ground) {
            ground.scene.environment = scene.environment;
            ground.scene.environmentIntensity = 0.12;
          }
          scene.environmentIntensity = num('env', 0.25);
          pmrem.dispose();
          done();
        };
        withEnv();
      });
    },
    /** The names of his clips, and the one playing. */
    /** Turn him by `angle` radians from his set pose. */
    /** He turns to his left (the screen's left) and walks out of the frame. */
    walk(): void {
      if (walkAsked || !model3) return;
      walkAsked = true;
      auto = false;
      play(actions.has('Stride') ? 'Stride' : 'Walk');
    },
    get walking(): boolean {
      return walkAsked;
    },
    setSpin(angle: number): void {
      if (walkAsked) return;
      spin = angle;
      if (model3) model3.rotation.y = num('ry', 0.85) + angle;
    },
    clips(): { names: string[]; playing: string } {
      return { names: [...actions.keys()], playing: current?.getClip().name ?? '' };
    },
    /** Cross-fade to another clip. */
    play(name: string): void {
      auto = false;
      play(name);
    },
    render(t: number, pointer: THREE.Vector2): void {
      if (walkAsked && model3) {
        if (walkFrom < 0) {
          walkFrom = t;
          walkX = pivot.position.x;
          walkZ = pivot.position.z;
          walkRy = model3.rotation.y;
        }
        const e = t - walkFrom;
        // Turn to the screen's left and a little into the scene, along the ledge (his forward is
        // +z: heading (sin, cos) of the turn), the short way round.
        const goal = Math.atan2(-0.7, -0.71);
        const turnBy = Math.atan2(Math.sin(goal - walkRy), Math.cos(goal - walkRy));
        const k = Math.min(1, e / 0.8);
        model3.rotation.y = walkRy + turnBy * k * k * (3 - 2 * k);
        // Then walk: speed ramps up to a stroll's 1.35 m/s.
        const ramp = Math.max(0, e - 0.35);
        // The pack's brisk walk covers 1.27 m/s (measured in bind.py): move him at just that,
        // so his feet do not slide.
        const dist = STRIDE * (ramp < 0.6 ? (ramp * ramp) / 1.2 : ramp - 0.3);
        pivot.position.x = walkX - 0.7 * dist;
        pivot.position.z = walkZ - 0.71 * dist;
      }
      if (head && headRest) head.quaternion.copy(headRest);
      // A still frame is set by time; a live one runs, so clips can cross-fade.
      if (auto && mixer && t > until) {
        if (until === 0) until = t + 16 + Math.random() * 10;
        else pick(t);
      }
      if (params.has('still')) mixer?.setTime(t);
      else mixer?.update(last < 0 ? 0 : Math.max(0, t - last));
      last = t;
      // He follows the visitor with his head, a little.
      if (head) {
        // While he is being turned, the head stops following the pointer.
        const k = Math.max(0, 1 - Math.abs(spin) * 3);
        const g = MIXAMO ? 0.45 : 1;
        if (walkAsked && model3) {
          // Walking off, he keeps an eye on the visitor: the chest turns towards the camera.
          const p = pivot.position;
          const toCam = Math.atan2(-p.x, -p.z);
          const d = Math.atan2(
            Math.sin(toCam - model3.rotation.y),
            Math.cos(toCam - model3.rotation.y),
          );
          look.setFromEuler(euler.set(0, Math.max(-0.75, Math.min(0.75, d)) * 0.55, 0));
        } else {
          look.setFromEuler(euler.set(pointer.y * 0.12 * k * g, -pointer.x * 0.3 * k * g, 0));
        }
        (head as THREE.Object3D).quaternion.multiply(look);
      }
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      if (ground) {
        ground.update(t);
        renderer.autoClear = false;
        renderer.render(ground.scene, camera);
        renderer.autoClear = true;
      }
    },
  };
}

/**
 * Wear on the suit: dust settled low on the legs, grime in blotches, the white no longer new.
 * In the model's own space (skinned), so it moves with him.
 */
function worn(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWear;')
      .replace('#include <skinning_vertex>', '#include <skinning_vertex>\nvWear = transformed;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vWear;
float wh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float wn(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wh(i), wh(i + vec3(1,0,0)), f.x), mix(wh(i + vec3(0,1,0)), wh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wh(i + vec3(0,0,1)), wh(i + vec3(1,0,1)), f.x), mix(wh(i + vec3(0,1,1)), wh(i + vec3(1,1,1)), f.x), f.y), f.z); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
{
  float blot = wn(vWear * 22.0) * 0.6 + wn(vWear * 70.0) * 0.4;
  float low = 1.0 - smoothstep(0.08, 0.5, vWear.y);
  float dirt = clamp(low * 0.85 + (blot - 0.45) * 0.9, 0.0, 1.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.66, 0.55, 0.44), dirt * 0.75);
  diffuseColor.rgb *= 0.86 + 0.14 * wn(vWear * 140.0);
}`,
      );
  };
  m.needsUpdate = true;
}

/** Lab only: a row of buttons to try his clips, cross-fading from one to the next. */
function clipBar(hero: {
  clips(): { names: string[]; playing: string };
  play(name: string): void;
}): void {
  const { names, playing } = hero.clips();
  if (names.length < 2) return;
  const bar = document.createElement('div');
  bar.setAttribute('aria-label', 'Animation');
  bar.style.cssText =
    'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:10;display:flex;gap:6px;flex-wrap:wrap;justify-content:center;font:12px ui-monospace,monospace';
  const buttons: HTMLButtonElement[] = [];
  const mark = (name: string): void => {
    for (const b of buttons) {
      const on = b.textContent === name;
      b.style.background = on ? 'rgb(240 210 150)' : 'rgb(8 10 16 / 0.7)';
      b.style.color = on ? '#120c06' : 'rgb(244 236 222)';
    }
  };
  for (const name of names) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    b.style.cssText =
      'padding:6px 10px;border:1px solid rgb(240 210 150 / 0.6);border-radius:3px;cursor:pointer';
    b.addEventListener('click', () => {
      hero.play(name);
      mark(name);
    });
    buttons.push(b);
    bar.append(b);
  }
  mark(playing);
  document.body.append(bar);
}
