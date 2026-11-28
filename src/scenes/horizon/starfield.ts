/**
 * The real sky behind the departure: the Yale Bright Star Catalogue (5th ed., Hoffleit and
 * Warren 1991; public domain, from the Harvard mirror of VizieR V/50), every star to visual
 * magnitude 6.5, so the constellations are the real ones.
 *
 * public/data/bright-stars.bin holds, per star, five little-endian float32s: the direction
 * (x, y, z) already turned into the scene's frame (y is Saturn's north pole, J2000: RA
 * 40.589°, Dec 83.537°), the V magnitude and the B-V colour index. The conversion script
 * also fixed the Sun's direction (see SUN in controller.ts): on the ecliptic, 20° above the
 * ring plane, a ring opening Saturn really reaches.
 *
 * Stars are drawn as GPU points about a pixel wide whatever the zoom (a long lens does not
 * make stars bigger), brighter and a touch larger for low magnitudes, coloured by B-V, hidden
 * behind the planet and dimmed behind the rings.
 */
const VERTEX = `
attribute vec3 aDir;
attribute float aMag;
attribute float aBv;
uniform vec3 uCam, uFw, uRt, uUp;
uniform float uFov, uAspect, uPx, uGain;
varying vec3 vCol;
varying float vA;
void main(){
  float depth = dot(aDir, uFw);
  vec2 s = vec2(dot(aDir, uRt), dot(aDir, uUp)) / max(depth, 1e-4) / uFov;
  gl_Position = depth > 0.0 ? vec4(s.x * 2.0 / uAspect, s.y * 2.0, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  // Behind the planet (radius 1 at the origin) a star is hidden; behind the rings, dimmed.
  float b = dot(uCam, aDir);
  float h = b * b - (dot(uCam, uCam) - 1.0);
  float vis = (h > 0.0 && -b - sqrt(h) > 0.0) ? 0.0 : 1.0;
  float tr = abs(aDir.y) > 1e-5 ? -uCam.y / aDir.y : -1.0;
  if (tr > 0.0) {
    vec3 q = uCam + aDir * tr;
    float r = length(q.xz);
    if (r > 1.24 && r < 2.27) vis *= 0.25;
  }
  float flux = pow(10.0, -0.4 * (aMag - 1.0));
  // Compressed like a long exposure: faint stars still register, bright ones do not blow out.
  vA = clamp(pow(flux, 0.4) * 1.6, 0.28, 2.4) * vis * uGain;
  gl_PointSize = max(2.0, uPx * clamp(1.6 + log2(1.0 + flux) * 1.1, 1.6, 4.0));
  float t = clamp((aBv + 0.3) / 1.9, 0.0, 1.0);
  vCol = t < 0.3
    ? mix(vec3(0.66, 0.76, 1.0), vec3(1.0, 0.98, 0.95), t / 0.3)
    : mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.7, 0.42), (t - 0.3) / 0.7);
}`;

const FRAGMENT = `
precision mediump float;
varying vec3 vCol;
varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  // Flat-topped: a star a couple of pixels wide keeps its full brightness.
  gl_FragColor = vec4(vCol * vA * (1.0 - smoothstep(0.55, 1.0, d)), 1.0);
}`;

export interface StarView {
  cam: readonly [number, number, number];
  fw: readonly [number, number, number];
  rt: readonly [number, number, number];
  up: readonly [number, number, number];
  fov: number;
}

export interface Starfield {
  /** True once the catalogue is loaded and drawable. */
  ready(): boolean;
  draw(view: StarView, aspect: number, px: number, gain: number): void;
}

export function createStarfield(gl: WebGLRenderingContext, url: string): Starfield | null {
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
  const buffer = gl.createBuffer();
  const at = {
    dir: gl.getAttribLocation(program, 'aDir'),
    mag: gl.getAttribLocation(program, 'aMag'),
    bv: gl.getAttribLocation(program, 'aBv'),
  };
  const un = (n: string): WebGLUniformLocation | null => gl.getUniformLocation(program, n);
  const u = {
    cam: un('uCam'),
    fw: un('uFw'),
    rt: un('uRt'),
    up: un('uUp'),
    fov: un('uFov'),
    aspect: un('uAspect'),
    px: un('uPx'),
    gain: un('uGain'),
  };
  let count = 0;
  void fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      count = data.byteLength / 20;
    })
    .catch(() => {
      count = 0;
    });

  return {
    ready: () => count > 0,
    draw(view, aspect, px, gain) {
      if (!count || gain <= 0.001) return;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(at.dir);
      gl.enableVertexAttribArray(at.mag);
      gl.enableVertexAttribArray(at.bv);
      gl.vertexAttribPointer(at.dir, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(at.mag, 1, gl.FLOAT, false, 20, 12);
      gl.vertexAttribPointer(at.bv, 1, gl.FLOAT, false, 20, 16);
      gl.uniform3f(u.cam, ...view.cam);
      gl.uniform3f(u.fw, ...view.fw);
      gl.uniform3f(u.rt, ...view.rt);
      gl.uniform3f(u.up, ...view.up);
      gl.uniform1f(u.fov, view.fov);
      gl.uniform1f(u.aspect, aspect);
      gl.uniform1f(u.px, px);
      gl.uniform1f(u.gain, gain);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disable(gl.BLEND);
      gl.disableVertexAttribArray(at.dir);
      gl.disableVertexAttribArray(at.mag);
      gl.disableVertexAttribArray(at.bv);
    },
  };
}
