// The black hole, computed per pixel: rays bent around a Schwarzschild hole, a disk of gas
// with Doppler brightening, diffuse glow and the photon ring; before it, the departure: a
// ringed planet against the light, the wormhole, its tunnel and a still sky.
// WebGL1 fragment shader, no libraries.

export const VERTEX = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

export const FRAGMENT = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uClock;
uniform float uDist, uTilt, uYaw, uRoll, uFov, uWarp, uSteps;
uniform vec2 uShift;
uniform vec2 uWormC; uniform float uWormR, uIn, uReveal;
uniform vec3 uSExp;
uniform float uDawn, uPlanet, uPan, uCalm, uStill, uFlash, uSFov, uStarExp, uDetail;
uniform vec2 uTunC;
uniform vec3 uSCam, uSFw, uSRt, uSUp, uSunDir;

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

// A still sky after the tunnel: fine stars, a few small galaxies, a nebula at one side.
vec3 stillSky(vec2 q){
  vec3 c = stars2(q, 70.0) * 0.9 + stars2(q + 2.3, 170.0) * 0.55;
  vec2 g = q * 3.0;
  float n = pow(fbm(g * 0.7 + 11.0), 4.0) * smoothstep(0.2, -0.6, q.x);
  c += vec3(0.95, 0.78, 0.62) * n * 0.9 + vec3(0.45, 0.55, 0.75) * pow(fbm(g * 1.3 - 4.0), 5.0) * 0.25;
  // Small galaxies: soft warm smudges on a coarse grid.
  vec2 cell = floor(q * 4.0), f = fract(q * 4.0) - 0.5;
  float h = hash(vec3(cell, 21.0));
  c += vec3(1.0, 0.82, 0.62) * step(0.86, h) * exp(-dot(f, f) * 260.0) * 1.2;
  return c;
}

// The tunnel, seen from near its wall: the far end sits up and to one side, the universe is
// smeared on the walls and rushes past; sparks streak out of the far end.
vec3 tunnel(vec2 uv){
  vec2 t = uv - uTunC;
  float r = length(t), a = atan(t.y, t.x);
  float z = 0.5 / (r + 0.02) + uClock * 5.0;
  vec2 around = vec2(cos(a), sin(a));
  // The wall waves as it passes.
  vec2 wave = around * (1.0 + 0.08 * sin(z * 0.9 + a * 3.0) * (1.0 - uCalm));
  float wall = pow(fbm(wave * 1.6 + vec2(0.0, z * 0.12)), 2.2);
  vec3 c = mix(vec3(0.004, 0.01, 0.03), vec3(0.06, 0.08, 0.15), wall);
  c += vec3(0.85, 0.66, 0.5) * pow(fbm(wave * 2.4 + vec2(3.0, z * 0.2)), 5.0) * 1.6 * (1.0 - uCalm * 0.7);
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
    c += tint * streak * (k == 0 ? 1.6 : 0.9) * (1.0 - uCalm * 0.8);
  }
  c *= smoothstep(0.02, 0.3, r);
  // The far end: a point at first, opening wide in the calm.
  c += vec3(0.95, 0.9, 1.0) * exp(-r * mix(14.0, 2.6, uCalm)) * mix(0.9, 0.45, uCalm);
  c += vec3(1.0, 0.96, 0.9) * uFlash * 0.6;
  return mix(c, stillSky(uv * 0.9 + vec2(uPan * 0.4, 0.0)), uStill);
}

// A wormhole is a sphere: through it, another galaxy, squeezed towards its edge; around it,
// our own stars bent outward, flicking past its rim. From far it is only a lens; its light
// shows as it comes closer.
vec3 wormhole(vec2 uv){
  vec2 d = uv - uWormC;
  float R = uWormR;
  float r = length(d) / R;
  float a = atan(d.y, d.x);
  vec2 around = vec2(cos(a), sin(a));
  vec3 col;
  if (r < 1.0) {
    float k = r / sqrt(max(0.004, 1.0 - r * r * 0.96));
    vec2 q = around * k * 0.55 + vec2(0.18, -0.08) + vec2(uClock * 0.004, 0.0);
    vec3 lens = stars2(d * 1.7 + 3.0, 60.0) * 0.7;
    col = mix(lens, galaxy(q), uReveal);
    col *= mix(0.9, 0.3, smoothstep(0.55, 1.0, r));
    float band = exp(-pow((r - 0.955) / 0.03, 2.0));
    float blot = pow(fbm(around * 1.6 + 4.0 + uClock * 0.02), 3.2) * 4.0;
    float wide = exp(-pow((r - 0.9) / 0.08, 2.0)) * pow(fbm(around * 1.1 + 9.0), 2.5) * 1.6;
    col += vec3(0.95, 0.92, 0.88) * (band * (0.05 + blot) + wide * 0.5) * (0.25 + 0.75 * uReveal);
    col += stars2(vec2(a * 1.6, (1.0 - r) * 7.0), 30.0) * smoothstep(0.6, 0.97, r) * 1.6 * uReveal;
    col += vec3(0.9, 0.93, 1.0) * pow(smoothstep(0.96, 1.0, r), 4.0) * 0.5 * (0.3 + 0.7 * uReveal);
    col = mix(col, tunnel(d / R * 0.9), uIn);
  } else {
    // Lensing outside: stars near the sphere are pushed out along the radius, and close to the
    // rim they smear into thin, quick flashes.
    vec2 bent = uv - around * R * R / length(d) * 0.85;
    col = stars2(bent, 60.0) + stars2(bent + 1.7, 140.0) * 0.6;
    col += vec3(0.25, 0.3, 0.45) * pow(fbm(bent * 1.4 + 2.0), 3.0) * 0.18;
    float near = exp(-(r - 1.0) * 6.0);
    col += stars2(vec2(a * 9.0 + uClock * 0.3, log(r) * 3.0), 14.0) * near * 2.2 * uReveal;
    col += vec3(0.85, 0.88, 1.0) * exp(-(r - 1.0) * 14.0) * 0.06;
  }
  // From far it is a tiny bright point dead ahead, before it is big enough to show anything.
  float far = 1.0 - smoothstep(0.015, 0.08, R);
  col += vec3(0.95, 0.93, 1.0) * (exp(-length(d) * 420.0) * 2.2 + exp(-length(d) * 60.0) * 0.12) * far;
  return col;
}

// The ringed planet in 3D: a sphere of radius 1 at the origin, rings on the plane y = 0 from
// 1.24 to 2.27, the star far away along uSunDir (behind the planet, so it is backlit). The
// camera flies a real path (controller.ts), so passing under the rings has true parallax.
// Stars as points: each one about a pixel wide whatever the zoom (a long lens does not make
// stars bigger), brightness spread like magnitudes. uStarExp is the camera's exposure: with
// a bright planet in frame the stars drop out, as in a real photograph.
vec3 pointStars(vec3 rd){
  float pix = uSFov / uRes.y;
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++){
    float sc = k == 0 ? 40.0 : 110.0;
    vec3 c = floor(rd * sc);
    float h = hash(c + float(k) * 7.0);
    if (h < (k == 0 ? 0.82 : 0.9)) continue;
    vec3 sd = normalize((c + vec3(hash(c + 1.0), hash(c + 2.0), hash(c + 3.0))) / sc);
    float d = length(rd - sd);
    float mag = pow(hash(c + 5.0), 4.0);
    float core = exp(-pow(d / (pix * 0.9), 2.0));
    vec3 tint = mix(vec3(1.0, 0.86, 0.72), vec3(0.78, 0.86, 1.0), hash(c + 9.0));
    col += tint * core * (0.25 + 2.6 * mag);
  }
  return col * uStarExp;
}

// The rings' radial profile, read off the film's first view of the planet (each pixel of the
// rings traced back to its radius on the ring plane): a dim C ring, the B ring brightening
// outwards, the narrow dark Cassini Division, the A ring, and the thin F ring outside.
float ringDensity(float rr, float fp){
  float c = 0.19 * smoothstep(1.27, 1.31, rr) * (1.0 - smoothstep(1.44, 1.47, rr))
    * (1.0 - 0.35 * exp(-pow((rr - 1.395) / 0.012, 2.0)));
  float b = mix(0.66, 1.0, clamp((rr - 1.53) / 0.36, 0.0, 1.0))
    * smoothstep(1.45, 1.53, rr) * (1.0 - smoothstep(1.915, 1.94, rr));
  float a = mix(0.5, 0.78, clamp((rr - 1.94) / 0.29, 0.0, 1.0))
    * smoothstep(1.935, 1.955, rr) * (1.0 - smoothstep(2.235, 2.255, rr));
  float f = 0.17 * exp(-pow((rr - 2.3) / 0.008, 2.0));
  float d = c + b + a + f;
  // Ringlets, each kept only while it is wider than a pixel (fp: a pixel's width across the
  // rings), so a long lens shows them and nothing shimmers.
  float k1 = clamp(1.0 - fp * 420.0 / 3.0, 0.0, 1.0);
  float k2 = clamp(1.0 - fp * 1400.0 / 3.0, 0.0, 1.0);
  float k3 = clamp(1.0 - fp * 700.0 * 4.0 / 3.0, 0.0, 1.0);
  // The many ringlets the film shows even from afar.
  d *= 1.0 - 0.2 * k1 * (b + a) * (0.5 + 0.5 * sin(rr * 420.0) * sin(rr * 170.0 + 1.0));
  // Close by, the fine ringlets show.
  d *= 1.0 - uDetail * 0.45 * k2 * (0.5 + 0.5 * sin(rr * 1400.0) * sin(rr * 530.0 + 2.0));
  d *= 1.0 - uDetail * 0.35 * k3 * (fbm(vec2(rr * 700.0, 0.5)) - 0.25);
  // In the close-up, the ringlets the film shows: a few pixels each, light and dark.
  float rl = 0.0;
  for (int i = 0; i < 4; i++) {
    float fq = 70.0 * pow(2.0, float(i));
    rl += clamp(1.0 - fp * fq * 1.2, 0.0, 1.0) * (noise(vec2(rr * fq, 3.1 + float(i) * 7.0)) - 0.5) / (1.0 + float(i) * 0.5);
  }
  d *= 1.0 + uSExp.z * 0.9 * rl;
  return clamp(d, 0.0, 1.0);
}

// Saturn is squashed: the polar radius is 0.902 of the equatorial one. The first hit on the
// planet along a ray, or 1e9.
const float FLAT = 0.902;
float hitPlanet(vec3 ro, vec3 rd){
  vec3 o = vec3(ro.x, ro.y / FLAT, ro.z), d = vec3(rd.x, rd.y / FLAT, rd.z);
  float a = dot(d, d), b = dot(o, d), h = b * b - a * (dot(o, o) - 1.0);
  if (h <= 0.0) return 1e9;
  float t = (-b - sqrt(h)) / a;
  return t > 0.0 ? t : 1e9;
}

vec3 saturn(vec2 uv){
  vec3 ro = uSCam;
  vec3 rd = normalize(uSFw + uSFov * (uv.x * uSRt + uv.y * uSUp));
  vec3 L = uSunDir;
  vec3 col = pointStars(rd);
  // The planet.
  float ts = hitPlanet(ro, rd);
  // The rings.
  float tr = abs(rd.y) > 1e-5 ? -ro.y / rd.y : -1.0;
  vec3 pr = ro + rd * tr;
  float rr = length(pr.xz);
  float ring = (tr > 0.0 && rr > 1.24 && rr < 2.33) ? ringDensity(rr, tr * uSFov / uRes.y / max(abs(rd.y), 0.002)) : 0.0;
  if (ts < 1e8) {
    vec3 p = ro + rd * ts;
    vec3 n = normalize(vec3(p.x, p.y / (FLAT * FLAT), p.z));
    // The backlit crescent, matched to the film's first view: light wraps well past the
    // terminator (film license; the true sliver would be a few pixels), saturated near the
    // edge and falling off exponentially into the night side.
    float ndl = dot(n, L);
    float u = max(0.042 - ndl, 0.0);
    float lit = exp(-6.2 * u - 26.0 * u * u);
    // The day side keeps a gentle gradient towards the subsolar point.
    lit *= mix(1.0, 1.35, smoothstep(0.04, 0.9, ndl)) * 3.9;
    // The close-up's light, read off the film's close-up frames: brightness grows about as
    // ndl^1.45 from the terminator, with only a thin soft edge into the night.
    float near = (5.4 * pow(max(ndl, 0.0), 1.45) + 0.03 * smoothstep(-0.06, 0.02, ndl)) / 0.8;
    lit = mix(lit, near, uSExp.z);
    // The rings' shadow on the planet.
    float tsh = -p.y / L.y;
    vec3 q = p + L * tsh;
    float rq = length(q.xz);
    if (tsh > 0.0 && rq > 1.24 && rq < 2.33) lit *= pow(1.0 - ringDensity(rq, 0.01) * 0.85, 1.6);
    float lon = atan(p.z, p.x);
    float band = 0.5 + 0.5 * sin(p.y * 26.0 + sin(p.y * 7.0) * 1.6 + fbm(vec2(lon * 2.0, p.y * 9.0)) * 1.4);
    // Close by, finer bands and storms in the clouds.
    band += uDetail * 0.25 * (fbm(vec2(lon * 14.0, p.y * 70.0)) - 0.5) + uDetail * 0.12 * sin(p.y * 160.0);
    // Close by, the clouds turn tactile: long streaks drawn out along the latitudes, eddies
    // where bands shear, and a fine grain.
    float warp = fbm(vec2(lon * 3.0, p.y * 30.0));
    float swirl = fbm(vec2(lon * 2.0 + warp * 1.4, p.y * 70.0)) - 0.5;
    float streak = fbm(vec2(lon * 4.0 + warp * 0.6, p.y * 260.0)) - 0.5;
    float grain = fbm(vec2(lon * 25.0, p.y * 900.0)) - 0.5;
    band += uDetail * (0.16 * swirl + 0.34 * streak + 0.12 * grain);
    // In the close-up the bands are soft: the light's falloff carries the picture.
    band = mix(band, 0.62 + (band - 0.5) * 0.35, uSExp.z);
    vec3 albedo = mix(vec3(0.72, 0.6, 0.48), vec3(0.98, 0.92, 0.84), clamp(band, 0.0, 1.0));
    // A little olive where the light grazes towards the terminator.
    albedo *= mix(vec3(0.9, 0.86, 0.66), vec3(1.0), smoothstep(0.0, 0.7, ndl + 0.15));
    // Dramatic light: the night side is black.
    // The very edge is a little softer, as in the film (the haze at the limb).
    lit *= smoothstep(-0.02, 0.16, dot(n, -rd));
    col = albedo * mix(mix(vec3(1.0, 0.88, 0.74), vec3(1.0, 0.93, 0.86), uDetail), vec3(1.24, 1.02, 0.9), uSExp.z) * lit * uSExp.x;
    // Light through the thin upper atmosphere, strongest looking towards the star.
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
    col += vec3(1.0, 0.88, 0.7) * rim * (0.2 + 1.6 * pow(max(dot(rd, L), 0.0), 2.0)) * smoothstep(-0.05, 0.35, dot(n, L));
  } else {
    // The star, where nothing covers it.
    float sd = max(dot(rd, L), 0.0);
    // The Sun: from Saturn a hard, tiny disc (about 3.4 arcminutes) and a little glow; the
    // flare canvas adds the rest.
    float sa = acos(clamp(sd, -1.0, 1.0));
    float pix = uSFov / uRes.y;
    col += vec3(1.0, 0.96, 0.9) * (exp(-pow(sa / max(pix * 1.6, 0.0005), 2.0)) * 8.0 + exp(-sa / 0.006) * 0.05);
  }
  if (ring > 0.0 && tr < ts) {
    // The planet's shadow across the rings.
    vec3 o2 = vec3(pr.x, pr.y / FLAT, pr.z), d2 = vec3(L.x, L.y / FLAT, L.z);
    float a2 = dot(d2, d2), b2 = dot(o2, d2), h2 = b2 * b2 - a2 * (dot(o2, o2) - 1.0);
    float shade = (h2 > 0.0 && -b2 + sqrt(h2) > 0.0) ? 0.12 : 1.0;
    // From the lit side the rings scatter light back; from below they glow through,
    // brightest looking towards the star.
    float litSide = step(0.0, ro.y * L.y);
    float fwd = pow(max(dot(rd, L), 0.0), 4.0);
    // From the lit side the rings scatter sunlight back; from below only a little light
    // gets through the thinner parts.
    vec3 tint = mix(vec3(0.95, 0.74, 0.52), vec3(1.0, 0.72, 0.6), uSExp.z);
    // Close up, only the dense rings glow; the thin C ring is a dark veil.
    tint *= mix(1.0, smoothstep(0.25, 0.6, ring), uSExp.z);
    vec3 ringCol = tint * (litSide * (0.7 + 0.6 * fwd) + (1.0 - litSide) * (0.33 + 0.12 * fwd)) * shade;
    // Seen almost edge-on, a line of sight crosses far more of the rings: even the thin C ring
    // turns nearly opaque and darkens the clouds behind it.
    float alpha = ring * 0.9;
    alpha = mix(alpha, 1.0 - pow(1.0 - alpha, clamp(0.1 / max(abs(rd.y), 0.001), 1.0, 10.0)), uSExp.z);
    col = mix(col, ringCol * uSExp.y, alpha);
  }
  return col;
}

vec3 departure(vec2 uv){
  vec3 col = wormhole(uv);
  if (uPlanet > 0.001) col = mix(col, saturn(uv), uPlanet);
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
  if (uWarp > 0.001) col = mix(col, departure(uv0) * uDawn, uWarp);
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
  'uReveal',
  'uPlanet',
  'uPan',
  'uCalm',
  'uStill',
  'uFlash',
  'uTunC',
  'uSFov',
  'uSCam',
  'uSFw',
  'uSRt',
  'uSUp',
  'uSunDir',
  'uDawn',
  'uStarExp',
  'uDetail',
  'uSExp',
] as const;
