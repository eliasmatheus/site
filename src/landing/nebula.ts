// The nebula under the landing: domain-warped gas in teal and amber, almost black at rest,
// revealed where the pointer trail passes. One full-screen triangle, drawn at reduced resolution.
import { packTrail, TRAIL_SIZE, type TrailPoint } from './trail';

const VERTEX = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uBase;
uniform vec3 uTrail[${TRAIL_SIZE}];

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.02 + 7.3; a *= 0.5; }
  return s;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  vec2 p = uv * 2.2 + vec2(0.0, uTime * 0.01);
  vec2 q = vec2(fbm(p + uTime * 0.02), fbm(p + 5.2));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + uTime * 0.015), fbm(p + 3.0 * q + vec2(8.3, 2.8)));
  float n = fbm(p + 3.5 * r);

  vec3 deep = vec3(0.02, 0.06, 0.09), teal = vec3(0.08, 0.32, 0.36);
  vec3 amber = vec3(0.86, 0.52, 0.2), hot = vec3(1.0, 0.84, 0.58);
  vec3 col = mix(deep, teal, smoothstep(0.25, 0.75, n));
  col = mix(col, amber, smoothstep(0.35, 0.8, r.x * n * 1.7));
  col += hot * pow(smoothstep(0.62, 0.95, n * r.y * 1.7), 2.0) * 0.9;
  col *= (0.45 + 1.3 * pow(n, 1.4)) * 1.35;

  // The pointer and its fading trail open windows into the gas.
  float m = uBase;
  for (int i = 0; i < ${TRAIL_SIZE}; i++){
    vec3 t = uTrail[i];
    float d = length(gl_FragCoord.xy - t.xy) / uRes.y;
    m += t.z * exp(-d * d / 0.04);
  }
  gl_FragColor = vec4(col * clamp(m, 0.0, 0.75), 1.0);
}`;

export interface Nebula {
  draw(time: number, trail: readonly TrailPoint[]): void;
}

/** Returns null when WebGL is missing or the shader fails: the page simply stays dark. */
export function createNebula(canvas: HTMLCanvasElement, resolution: number): Nebula | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
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

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uBase = gl.getUniformLocation(program, 'uBase');
  const uTrail = gl.getUniformLocation(program, 'uTrail');
  gl.uniform1f(uBase, 0.045);

  return {
    draw(time, trail) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(window.innerWidth * dpr * resolution));
      const h = Math.max(1, Math.round(window.innerHeight * dpr * resolution));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform3fv(uTrail, packTrail(trail, w / window.innerWidth, h));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
