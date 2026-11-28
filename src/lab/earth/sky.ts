/**
 * The sky over the launch site at dusk: a gradient lit by a Sun just under the horizon, the
 * Milky Way drawn along the real galactic plane and every star of the Yale Bright Star
 * Catalogue to magnitude 6.5 (public/data/stars-j2000.bin: x, y, z in J2000 equatorial
 * coordinates, V magnitude, B-V), turned to the local horizon for a latitude and sidereal time.
 *
 * Local frame: y is up, -z is north, +x is east.
 */
import * as THREE from 'three';

const DEG = Math.PI / 180;

/** Equatorial (x to RA 0h, y to RA 6h, z to the north pole) to local (east, up, south). */
export function equatorialToLocal(latDeg: number, lstHours: number, yawDeg = 0): THREE.Matrix4 {
  const phi = latDeg * DEG;
  const th = lstHours * 15 * DEG;
  // Hour-angle frame: m points at the meridian on the equator, e to the east.
  const m = new THREE.Vector3(Math.cos(th), Math.sin(th), 0);
  const e = new THREE.Vector3(-Math.sin(th), Math.cos(th), 0);
  const z = new THREE.Vector3(0, 0, 1);
  const up = m.clone().multiplyScalar(Math.cos(phi)).addScaledVector(z, Math.sin(phi));
  const north = m.clone().multiplyScalar(-Math.sin(phi)).addScaledVector(z, Math.cos(phi));
  // Rows of the matrix: local x = east, y = up, z = south.
  const r = new THREE.Matrix4();
  r.set(e.x, e.y, e.z, 0, up.x, up.y, up.z, 0, -north.x, -north.y, -north.z, 0, 0, 0, 0, 1);
  // Turn the world so the azimuth `yaw` (from north towards east) lies straight ahead (-z).
  return new THREE.Matrix4().makeRotationY(yawDeg * DEG).multiply(r);
}

/** Direction to a body at (RA hours, Dec degrees) in the local frame. */
export function bodyDirection(
  toLocal: THREE.Matrix4,
  raHours: number,
  decDeg: number,
): THREE.Vector3 {
  const ra = raHours * 15 * DEG;
  const de = decDeg * DEG;
  return new THREE.Vector3(Math.cos(de) * Math.cos(ra), Math.cos(de) * Math.sin(ra), Math.sin(de))
    .applyMatrix4(toLocal)
    .normalize();
}

/** Equatorial to galactic (IAU, J2000). */
const EQ_TO_GAL = new THREE.Matrix3().set(
  -0.0548755604,
  -0.8734370902,
  -0.4838350155,
  0.4941094279,
  -0.44482963,
  0.7469822445,
  -0.867666149,
  -0.1980763734,
  0.4559837762,
);

const SKY_VERTEX = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAGMENT = `
uniform vec3 uSun;
uniform mat3 uLocalToGal;
uniform vec3 uZenith, uHorizon, uGlow, uFog;
uniform float uMilky, uClouds;
varying vec3 vDir;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

void main() {
  vec3 d = normalize(vDir);
  float e = d.y;
  float up = clamp(e, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(up, 0.45));
  // The glow of a Sun just set: warm along the horizon, strongest towards it.
  vec3 sh = normalize(vec3(uSun.x, 0.0, uSun.z));
  float toward = max(dot(normalize(vec3(d.x, 0.0, d.z)), sh), 0.0);
  float band = exp(-max(e, 0.0) / mix(0.05, 0.22, pow(toward, 4.0)));
  col += uGlow * band * (0.12 + 1.1 * pow(toward, 6.0));
  col += vec3(0.5, 0.35, 0.45) * 0.05 * band;
  // Opposite the Sun: Earth's shadow, a blue-grey band on the horizon, the pink belt above.
  float anti = pow(max(-dot(normalize(vec3(d.x, 0.0, d.z)), sh), 0.0), 1.5);
  float depth = clamp(-uSun.y, 0.0, 0.2);
  float edge = 0.02 + depth * 0.9;
  col = mix(col, col * vec3(0.55, 0.62, 0.8), anti * smoothstep(edge + 0.02, edge - 0.03, e) * step(0.0, e));
  col += vec3(0.9, 0.45, 0.55) * 0.13 * anti * exp(-pow((e - edge - 0.035) / 0.045, 2.0)) * smoothstep(0.2, 0.05, depth);
  // The Milky Way: a band along the galactic plane, brighter towards the core, cut by dust.
  vec3 g = uLocalToGal * d;
  float b = asin(clamp(g.z, -1.0, 1.0));
  float l = atan(g.y, g.x);
  float core = exp(-l * l / 0.35);
  float w = 0.085 + 0.05 * core;
  float milky = exp(-pow(b / w, 2.0)) * (0.4 + 0.55 * core);
  // Star clouds, not weather: mottled at several scales down to a fine grain.
  float clouds = (fbm(g * 12.0) * 0.6 + fbm(g * 34.0) * 0.5) * (0.55 + 0.9 * fbm(g * 140.0));
  // The dark rift: dust lanes along the middle of the band, ragged at the edges.
  float lane = exp(-pow((b - 0.012 + 0.02 * (fbm(g * 6.0) - 0.5)) / (0.022 + 0.025 * core), 2.0));
  float dust = smoothstep(0.35, 0.7, fbm(g * 18.0 + 3.0)) * lane;
  milky *= clouds * (1.0 - 0.9 * dust);
  vec3 mw = mix(vec3(0.62, 0.66, 0.85), vec3(1.0, 0.82, 0.68), core);
  float dark = smoothstep(0.02, 0.35, e) * (1.0 - 0.8 * pow(toward, 3.0) * exp(-e / 0.4));
  col += mw * milky * uMilky * dark;
  // A low bank of clouds on the horizon, its tops lit pink by the Sun under the edge.
  if (uClouds > 0.0) {
    vec3 cq = vec3(d.x, d.y * 6.0, d.z) * 7.0;
    float cl = fbm(cq + vec3(3.0, 0.0, 1.0)) + 0.5 * fbm(cq * 3.1);
    float bank = smoothstep(0.075, 0.015, e) * smoothstep(-0.01, 0.01, e);
    float shape = smoothstep(0.62, 0.95, cl) * bank;
    vec3 lit = mix(vec3(0.16, 0.16, 0.24), vec3(0.75, 0.42, 0.5), smoothstep(0.75, 1.1, cl) * (0.3 + 0.7 * anti));
    col = mix(col, lit, shape * uClouds);
  }
  // Under the horizon the fog takes over, so the ground fades into the same colour.
  col = mix(col, uFog, smoothstep(0.02, -0.04, e));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const STAR_VERTEX = `
attribute float aMag;
attribute float aBv;
uniform float uPx, uGain;
varying vec3 vCol;
varying float vA;
void main() {
  vec3 local = normalize((modelMatrix * vec4(position, 0.0)).xyz);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
  float flux = pow(10.0, -0.4 * (aMag - 1.0));
  // Air: stars fade and redden near the horizon, and the dusk glow hides the faint ones.
  float air = smoothstep(-0.01, 0.25, local.y);
  vA = clamp(pow(flux, 0.42) * 1.5, 0.0, 2.6) * air * uGain;
  vA *= smoothstep(6.6, 4.0, aMag + (1.0 - air) * 2.0);
  gl_PointSize = max(1.5, uPx * clamp(1.3 + log2(1.0 + flux) * 1.0, 1.3, 3.6));
  float t = clamp((aBv + 0.3) / 1.9, 0.0, 1.0);
  vCol = t < 0.3 ? mix(vec3(0.66, 0.76, 1.0), vec3(1.0, 0.98, 0.95), t / 0.3)
                 : mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.7, 0.42), (t - 0.3) / 0.7);
  vCol = mix(vCol * vec3(1.0, 0.8, 0.6), vCol, air);
}`;

const STAR_FRAGMENT = `
varying vec3 vCol;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  gl_FragColor = vec4(vCol * vA * (1.0 - smoothstep(0.45, 1.0, d)), 1.0);
}`;

export interface Sky {
  group: THREE.Group;
  /** Turn the star sphere (stars and Milky Way together); the Sun's glow stays where it is. */
  setOrientation(toLocal: THREE.Matrix4): void;
  /** Keep the sky centred on the camera. */
  follow(camera: THREE.Camera): void;
}

export function createSky(opts: {
  toLocal: THREE.Matrix4;
  sun: THREE.Vector3;
  fog: THREE.Color;
  pixelRatio: number;
  /** 0 to 1: a low bank of clouds on the horizon. */
  clouds?: number;
  /** Strength of the Milky Way glow (default 0.2). */
  milky?: number;
}): Sky {
  const group = new THREE.Group();
  const toLocal = opts.toLocal.clone();
  const localToEq = new THREE.Matrix3().setFromMatrix4(toLocal).transpose();
  const localToGal = EQ_TO_GAL.clone().multiply(localToEq);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(8000, 48, 24),
    new THREE.ShaderMaterial({
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSun: { value: opts.sun },
        uLocalToGal: { value: localToGal },
        uZenith: { value: new THREE.Color(0x060b1c) },
        uHorizon: { value: new THREE.Color(0x3a4a66) },
        uGlow: { value: new THREE.Color(0xff8a4c) },
        uFog: { value: opts.fog },
        uMilky: { value: opts.milky ?? 0.2 },
        uClouds: { value: opts.clouds ?? 0 },
      },
    }),
  );
  dome.renderOrder = -2;
  dome.frustumCulled = false;
  group.add(dome);

  const stars = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: { uPx: { value: opts.pixelRatio }, uGain: { value: 0.9 } },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
  stars.renderOrder = -1;
  stars.frustumCulled = false;
  stars.matrixAutoUpdate = false;
  group.add(stars);
  void fetch('/data/stars-j2000.bin')
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const f = new Float32Array(buf);
      const n = f.length / 5;
      const pos = new Float32Array(n * 3);
      const mag = new Float32Array(n);
      const bv = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (f[i * 5] ?? 0) * 7800;
        pos[i * 3 + 1] = (f[i * 5 + 1] ?? 0) * 7800;
        pos[i * 3 + 2] = (f[i * 5 + 2] ?? 0) * 7800;
        mag[i] = f[i * 5 + 3] ?? 9;
        bv[i] = f[i * 5 + 4] ?? 0.6;
      }
      stars.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      stars.geometry.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
      stars.geometry.setAttribute('aBv', new THREE.BufferAttribute(bv, 1));
    });

  return {
    group,
    setOrientation(m) {
      toLocal.copy(m);
      const eq = new THREE.Matrix3().setFromMatrix4(m).transpose();
      localToGal.copy(EQ_TO_GAL).multiply(eq);
    },
    follow(camera) {
      dome.position.copy(camera.position);
      stars.matrix.copy(toLocal).setPosition(camera.position);
      stars.matrixWorldNeedsUpdate = true;
    },
  };
}

/**
 * An art-directed orientation of the star sphere: the real sky, turned so the core of the Milky
 * Way sits at `core` (a local direction) with the band crossing it along `along`. The stars keep
 * their true positions relative to each other: it is the real sky, seen from a chosen angle.
 */
export function framedSky(core: THREE.Vector3, along: THREE.Vector3): THREE.Matrix4 {
  const eqDir = (raDeg: number, decDeg: number): THREE.Vector3 => {
    const ra = raDeg * DEG;
    const de = decDeg * DEG;
    return new THREE.Vector3(
      Math.cos(de) * Math.cos(ra),
      Math.cos(de) * Math.sin(ra),
      Math.sin(de),
    );
  };
  // Galactic centre and north pole, J2000.
  const c = eqDir(266.405, -28.936);
  const n = eqDir(192.859, 27.128);
  n.addScaledVector(c, -n.dot(c)).normalize();
  const t = core.clone().normalize();
  const b = along.clone().addScaledVector(t, -along.dot(t)).normalize();
  // In the galactic plane the band runs along c x n (perpendicular to the pole and the centre).
  const bandEq = new THREE.Vector3().crossVectors(n, c);
  const from = new THREE.Matrix4().makeBasis(c, bandEq, n);
  const pole = new THREE.Vector3().crossVectors(t, b);
  const to = new THREE.Matrix4().makeBasis(t, b, pole);
  return to.multiply(from.transpose());
}
