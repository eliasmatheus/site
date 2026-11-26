// The nebula behind the landing: a wide, still painting of gas, dust lanes and star clusters
// in the palette of Dune: Part Three,
// rendered once in WebGL. It never moves on its own; the page pans the view across it.

const VERTEX = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++){ s += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
// Ridged noise: thin bright filaments, like the edges of lit gas.
float ridged(vec2 p){
  float s = 0.0, a = 0.55;
  for (int i = 0; i < 5; i++){ float n = 1.0 - abs(2.0 * noise(p) - 1.0); s += a * n * n; p = p * 2.1 + 3.1; a *= 0.5; }
  return s;
}
vec3 stars(vec2 uv, float k, float bias){
  vec2 cell = floor(uv * k), f = fract(uv * k);
  float h = hash(cell);
  if (h < bias) return vec3(0.0);
  vec2 pos = vec2(hash(cell + 1.3), hash(cell + 7.1));
  float d = length(f - pos) * uRes.y / k; // distance in canvas pixels
  float b = pow(hash(cell + 3.7), 6.0);
  vec3 tint = mix(vec3(0.8, 0.9, 0.95), vec3(1.0, 0.82, 0.6), hash(cell + 5.9));
  return tint * b * (exp(-d * d * 0.9) * 1.6 + exp(-d * 0.35) * 0.18);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float aspect = uRes.x / uRes.y;
  float x = uv.x / aspect;

  // A broad band of gas that wanders across the whole panorama.
  float centre = 0.52 + 0.16 * sin(x * 4.2 + 0.6) + 0.07 * sin(x * 11.0);
  float band = exp(-pow((uv.y - centre) * 2.6, 2.0));

  vec2 q = vec2(fbm(uv * 1.4), fbm(uv * 1.4 + vec2(5.2, 1.3)));
  float body = fbm(uv * 2.2 + 2.2 * q);
  float wisps = ridged(uv * 2.8 + q * 1.8);
  float dens = band * smoothstep(0.25, 0.85, 0.55 * body + 0.6 * wisps * body);

  // Dune: Part Three palette: blue-black teal above, spice gold below, sand highlights,
  // a cyan glow in the cool gas and gold dust in the warm air.
  float low = 1.0 - clamp(uv.y, 0.0, 1.0);
  vec3 deep = vec3(0.015, 0.035, 0.045), teal = vec3(0.07, 0.30, 0.33);
  vec3 gold = vec3(0.95, 0.56, 0.12), ember = vec3(0.55, 0.24, 0.05);
  vec3 sand = vec3(1.0, 0.86, 0.6), rust = vec3(0.30, 0.12, 0.04);
  // A short crossing, so teal and gold rarely mix into olive.
  float spice = smoothstep(0.42, 0.6, low + 0.3 * (q.x * body - 0.3));
  vec3 cool = mix(deep, teal, smoothstep(0.25, 0.75, body));
  vec3 warm = mix(ember, gold, smoothstep(0.3, 0.8, body));
  vec3 gas = mix(cool, warm, spice) * dens * (0.45 + 1.3 * pow(body, 1.4)) * 1.6;
  gas += sand * pow(wisps, 5.0) * band * (0.12 + 0.45 * spice);

  // Dark dust lanes cut through the glow, rusty at their edges.
  float dust = smoothstep(0.5, 0.78, fbm(uv * 3.4 + q * 2.4 + 9.0));
  gas = mix(gas, rust * dens, 0.35 * dust * band);
  gas *= 1.0 - 0.75 * dust * band;

  // The empty sky is not flat black: cold at the top, a warm haze near the bottom.
  vec3 col = mix(vec3(0.006, 0.012, 0.016), vec3(0.03, 0.016, 0.006), low * low) + gas;
  // Stars: a fine field everywhere, denser and brighter clusters inside the gas.
  col += stars(uv, 90.0, 0.55) * 0.5;
  col += stars(uv + 3.1, 38.0, 0.7 - 0.35 * band) * (0.6 + band);
  col += stars(uv + 7.7, 14.0, 0.85 - 0.2 * band) * 1.2;
  // Gold dust floating in the warm air.
  col += stars(uv + 11.3, 150.0, 0.5) * vec3(1.0, 0.72, 0.3) * spice * 0.9;
  // Soft glow of unresolved stars in the densest parts.
  col += sand * pow(dens, 3.0) * 0.08;

  gl_FragColor = vec4(col, 1.0);
}`;

/**
 * Paints the panorama into the canvas at its current CSS size times `scale`.
 * Returns false when WebGL is missing or the shader fails: the page simply stays dark.
 */
export function paintNebula(canvas: HTMLCanvasElement, scale: number): boolean {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    depth: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return false;
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
  if (!vs || !fs || !program) return false;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr * scale));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr * scale));
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);
  gl.uniform2f(gl.getUniformLocation(program, 'uRes'), w, h);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return true;
}
