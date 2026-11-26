// The black hole, computed per pixel: rays bent around a Schwarzschild hole, a disk of gas
// with Doppler brightening, diffuse glow and the photon ring; before it, the wormhole.
// WebGL1 fragment shader, no libraries.

export const VERTEX = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

export const FRAGMENT = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uClock;
uniform float uDist, uTilt, uYaw, uRoll, uFov, uWarp, uSteps;
uniform vec2 uShift;
uniform vec2 uWormC; uniform float uWormR, uIn;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash(vec3(i,1.0)), b = hash(vec3(i+vec2(1,0),1.0)), c = hash(vec3(i+vec2(0,1),1.0)), d = hash(vec3(i+vec2(1,1),1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a*noise(p); p *= 2.03; a *= 0.5; } return s; }

vec3 stars(vec3 d){
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++){
    float sc = k == 0 ? 90.0 : 220.0;
    vec3 c = floor(d * sc), f = fract(d * sc) - 0.5;
    float h = hash(c + float(k)*7.0);
    float star = step(0.94, h) * smoothstep(0.3, 0.0, length(f)) * (0.6 + 0.4*hash(c+3.0));
    col += star * mix(vec3(1.0,0.88,0.75), vec3(0.75,0.85,1.0), hash(c+5.0)) * (k == 0 ? 1.0 : 0.5);
  }
  return col;
}

// Gas in the disk: streaks along the orbit, fast near the hole, drifting clumps.
vec3 disk(vec3 hit, float rr, vec3 rayDir, out float alpha){
  float spin = uTime * 2.4 / pow(rr, 1.5);
  float phi = atan(hit.z, hit.x) - spin;
  vec2 ring = vec2(cos(phi), sin(phi));
  float streak = fbm(vec2(rr * 3.2, 0.0) + ring * 2.0);
  float fine = fbm(vec2(rr * 8.0, 3.0) + ring * 5.5 + vec2(0.0, uTime * 0.15));
  float clumps = fbm(ring * 7.0 + rr * 1.6 - uTime * 0.08);
  float n = streak * 0.5 + fine * 0.35 + clumps * 0.35;
  float inner = smoothstep(2.4, 3.2, rr), outer = 1.0 - smoothstep(7.0, 15.0, rr);
  float t = pow(3.0 / rr, 0.8);
  vec3 orbit = normalize(vec3(-hit.z, 0.0, hit.x));
  float beta = sqrt(0.5 / rr);
  float dop = 1.0 / (1.0 - beta * dot(orbit, -normalize(rayDir)));
  float boost = pow(clamp(dop, 0.35, 2.3), 3.0) * sqrt(max(0.0, 1.0 - 1.0 / rr));
  vec3 hot = vec3(1.0, 0.97, 0.92), warm = vec3(1.0, 0.8, 0.6), cool = vec3(0.5, 0.32, 0.2);
  vec3 base = mix(cool, mix(warm, hot, smoothstep(0.45, 1.0, t * (0.7 + 0.6 * n))), smoothstep(0.08, 0.5, t));
  alpha = inner * outer * clamp(0.3 + 0.8 * n, 0.0, 1.0);
  return base * (0.35 + 1.6 * n) * boost * t * 2.6 * alpha;
}

// Screen-space stars, for the wormhole views.
vec3 stars2(vec2 q, float sc){
  vec2 c = floor(q * sc), f = fract(q * sc) - 0.5;
  float h = hash(vec3(c, 4.0));
  float s = step(0.968, h) * smoothstep(0.3, 0.0, length(f)) * (0.4 + 0.6 * hash(vec3(c, 9.0)));
  return s * mix(vec3(1.0, 0.86, 0.7), vec3(0.72, 0.84, 1.0), hash(vec3(c, 2.0)));
}

// The other side of the wormhole: a dusty galaxy with a bright core, seen through it.
vec3 galaxy(vec2 q){
  float r = length(q);
  // A loose spiral: the noise is read in a frame that turns with the distance to the core.
  float t = log(r + 0.08) * 1.3;
  vec2 sq = mat2(cos(t), -sin(t), sin(t), cos(t)) * q;
  float arms = fbm(sq * vec2(2.2, 6.0) + 1.3);
  float dust = fbm(q * 3.6 + 7.0);
  vec3 c = vec3(0.95, 0.82, 0.66) * pow(arms, 3.0) * exp(-r * 2.4) * 1.1;
  c *= 0.35 + 0.65 * smoothstep(0.3, 0.75, dust);
  c += vec3(0.55, 0.52, 0.5) * pow(fbm(q * 2.6 - 3.0), 4.0) * 0.5;
  c += vec3(1.0, 0.92, 0.8) * exp(-r * r * 60.0) * 0.7;
  c += stars2(q, 90.0) * 1.4 + stars2(q + 3.1, 200.0) * 0.9;
  return c;
}

// The tunnel: dark blue, with sparks of warm light rushing out of the center.
vec3 tunnel(vec2 uv){
  float r = length(uv), a = atan(uv.y, uv.x);
  float z = 0.5 / (r + 0.02) + uClock * 5.0;
  vec2 around = vec2(cos(a), sin(a));
  vec3 c = mix(vec3(0.004, 0.012, 0.04), vec3(0.03, 0.07, 0.17), pow(fbm(around * 1.5 + vec2(0.0, z * 0.35)), 1.6));
  // Sparks: thin streaks along the radius, in lanes around the center.
  for (int k = 0; k < 2; k++){
    float bins = k == 0 ? 70.0 : 150.0;
    float u = (a / 6.2832 + 0.5) * bins;
    float lane = floor(u), across = abs(fract(u) - 0.5) * 2.0;
    float zz = z * (k == 0 ? 0.55 : 0.9) + hash(vec3(lane, 1.0, float(k))) * 9.0;
    float cell = floor(zz), along = fract(zz);
    float h = hash(vec3(lane, cell, 3.0 + float(k)));
    float on = step(k == 0 ? 0.9 : 0.94, h);
    float streak = on * pow(1.0 - across, 10.0) * smoothstep(0.0, 0.12, along) * smoothstep(0.75, 0.15, along);
    vec3 tint = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.92, 0.8), hash(vec3(lane, cell, 8.0)));
    c += tint * streak * (k == 0 ? 1.6 : 0.9);
  }
  c *= smoothstep(0.02, 0.3, r);
  c += vec3(0.95, 0.9, 1.0) * exp(-r * 14.0) * 0.9;
  return c;
}

// A wormhole is a sphere: through it, another galaxy, squeezed towards its edge; around it,
// our own stars bent outward; on its rim, smeared arcs of light.
vec3 wormhole(vec2 uv){
  vec2 d = uv - uWormC;
  float R = uWormR;
  float r = length(d) / R;
  float a = atan(d.y, d.x);
  vec3 col;
  if (r < 1.0) {
    float k = r / sqrt(max(0.004, 1.0 - r * r * 0.96));
    vec2 q = vec2(cos(a), sin(a)) * k * 0.55 + vec2(0.18, -0.08) + vec2(uClock * 0.004, 0.0);
    col = galaxy(q);
    col *= mix(0.9, 0.3, smoothstep(0.55, 1.0, r));
    // Our own sky wraps around the inside of the rim: smeared arcs and stretched stars.
    float band = exp(-pow((r - 0.955) / 0.03, 2.0));
    vec2 around = vec2(cos(a), sin(a));
    float blot = pow(fbm(around * 1.6 + 4.0 + uClock * 0.02), 3.2) * 4.0;
    float wide = exp(-pow((r - 0.9) / 0.08, 2.0)) * pow(fbm(around * 1.1 + 9.0), 2.5) * 1.6;
    col += vec3(0.95, 0.92, 0.88) * (band * (0.05 + blot) + wide * 0.5);
    col += stars2(vec2(a * 1.6, (1.0 - r) * 7.0), 30.0) * smoothstep(0.6, 0.97, r) * 1.6;
    col += vec3(0.9, 0.93, 1.0) * pow(smoothstep(0.96, 1.0, r), 4.0) * 0.5;
    col = mix(col, tunnel(d / R * 0.9), uIn);
  } else {
    // Lensing outside: stars near the sphere are pushed out along the radius.
    vec2 bent = uv - normalize(d) * R * R / length(d) * 0.85;
    col = stars2(bent, 60.0) + stars2(bent + 1.7, 140.0) * 0.6;
    col += vec3(0.25, 0.3, 0.45) * pow(fbm(bent * 1.4 + 2.0), 3.0) * 0.18;
    col += vec3(0.85, 0.88, 1.0) * exp(-(r - 1.0) * 14.0) * 0.06;
  }
  return col;
}

void main(){
  vec2 uv0 = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 col = vec3(0.0);
  if (uWarp < 0.999) {
    vec2 uv = uv0 - uShift;
    float cr = cos(uRoll), sr = sin(uRoll);
    uv = mat2(cr, sr, -sr, cr) * uv;
    vec3 cam = vec3(sin(uYaw) * cos(uTilt), sin(uTilt), -cos(uYaw) * cos(uTilt)) * uDist;
    vec3 fw = normalize(-cam), rt = normalize(cross(vec3(0,1,0), fw)), up = cross(fw, rt);
    vec3 v = normalize(fw + uFov * (uv.x * rt + uv.y * up));
    vec3 p = cam;
    vec3 hv = cross(p, v); float h2 = dot(hv, hv);
    float a = 0.0; bool captured = false;
    float minR = 1e3; float haze = 0.0;
    for (int i = 0; i < 260; i++){
      if (float(i) >= uSteps) break;
      float r2 = dot(p, p), r = sqrt(r2);
      minR = min(minR, r);
      if (r < 1.0) { captured = true; break; }
      if (r > uDist + 10.0 && dot(p, v) > 0.0) break;
      float dt = clamp(0.08 * r, 0.035, 1.2);
      // Diffuse glow: light scattered by gas just above and below the disk.
      float rr0 = length(p.xz);
      haze += exp(-abs(p.y) * 2.2) * smoothstep(15.0, 3.0, rr0) * smoothstep(2.0, 3.2, rr0) * dt;
      vec3 acc = -1.5 * h2 * p / (r2 * r2 * r);
      vec3 pn = p + v * dt;
      v += acc * dt;
      if (p.y * pn.y < 0.0) {
        float k = p.y / (p.y - pn.y);
        vec3 hit = mix(p, pn, k);
        float rr = length(hit.xz);
        if (rr > 2.2 && rr < 15.0) {
          float al; vec3 dc = disk(hit, rr, v, al);
          col += dc * (1.0 - a); a += al * (1.0 - a);
        }
      }
      p = pn;
      if (a > 0.98) break;
    }
    vec3 bg = captured ? vec3(0.0) : stars(normalize(v));
    col += bg * (1.0 - a);
    // Haze: warm-white glow with a cold blue edge.
    col += (vec3(1.0, 0.86, 0.68) * 0.06 + vec3(0.25, 0.35, 0.5) * 0.035) * haze * (1.0 - 0.6 * a);
    // Photon ring: rays whose impact parameter sits just outside the critical one (3*sqrt(3)/2)
    // circle the hole before escaping and draw a thin, hot line on the shadow's edge.
    float b = sqrt(h2);
    float ring = exp(-pow((b - 2.6) / 0.012, 2.0)) + 0.35 * exp(-pow((b - 2.62) / 0.05, 2.0));
    col += vec3(1.0, 0.85, 0.45) * ring * (captured ? 0.0 : 1.0) * 1.8;
  }
  if (uWarp > 0.001) col = mix(col, wormhole(uv0), uWarp);
  col = 1.0 - exp(-col * 1.2);
  col = pow(col, vec3(0.9));
  gl_FragColor = vec4(col, 1.0);
}`;

export const UNIFORMS = [
  'uRes',
  'uTime',
  'uClock',
  'uDist',
  'uTilt',
  'uYaw',
  'uRoll',
  'uFov',
  'uWarp',
  'uSteps',
  'uShift',
  'uWormC',
  'uWormR',
  'uIn',
] as const;
