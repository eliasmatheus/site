/**
 * Life in the sky, for ambience: satellites crossing in the last sunlight (at dusk they are
 * bright and many), now and then a meteor, and the blink of a plane far off. Not catalogued:
 * placed to be seen. The sky itself stays exact; these only pass through it.
 */
import * as THREE from 'three';

const R = 7000;

interface Pass {
  from: THREE.Vector3;
  to: THREE.Vector3;
  start: number;
  length: number;
  mag: number;
}

/** A great-circle track across the sky, from one low point to another. */
function track(
  azFrom: number,
  altFrom: number,
  azTo: number,
  altTo: number,
): [THREE.Vector3, THREE.Vector3] {
  const dir = (az: number, alt: number): THREE.Vector3 =>
    new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));
  return [dir(azFrom, altFrom), dir(azTo, altTo)];
}

export function createSkyLife(pixelRatio: number) {
  const group = new THREE.Group();
  const D = Math.PI / 180;

  // Satellites: slow points of light, each taking a minute or two across the frame.
  const passes: Pass[] = [];
  for (const [a0, h0, a1, h1, start, length, mag] of [
    [-50, 8, 40, 70, 0, 140, 0.8],
    [30, 5, -20, 60, 40, 170, 0.5],
    [-15, 50, 60, 12, 85, 120, 0.4],
    [60, 30, -60, 35, 20, 200, 0.3],
  ] as const) {
    const [from, to] = track(a0 * D, h0 * D, a1 * D, h1 * D);
    passes.push({ from, to, start, length, mag });
  }
  const satGeo = new THREE.BufferGeometry();
  satGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(passes.length * 3), 3),
  );
  satGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(passes.length), 1));
  const sats = new THREE.Points(
    satGeo,
    new THREE.ShaderMaterial({
      vertexShader: `
attribute float aA;
uniform float uPx;
varying float vA;
void main() {
  vA = aA;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
  gl_PointSize = 2.2 * uPx;
}`,
      fragmentShader: `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * vA * (1.0 - smoothstep(0.4, 1.0, d)), 1.0);
}`,
      uniforms: { uPx: { value: pixelRatio } },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
  sats.frustumCulled = false;
  sats.renderOrder = -1;
  group.add(sats);

  // A meteor every so often: a short bright streak that fades.
  const meteorMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(1.6, 1.7, 2.0),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const meteorGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const meteor = new THREE.Line(meteorGeo, meteorMat);
  meteor.frustumCulled = false;
  group.add(meteor);
  const showers: [number, number, number, number][] = [
    // [second of the minute, azimuth, altitude, length], degrees from straight ahead.
    [8, -25, 40, 30],
    [27, 15, 25, 18],
    [46, 30, 35, 25],
  ];

  return {
    group,
    update(t: number, camera: THREE.Camera) {
      group.position.copy(camera.position);
      const pos = satGeo.attributes['position'] as THREE.BufferAttribute;
      const alpha = satGeo.attributes['aA'] as THREE.BufferAttribute;
      const p = new THREE.Vector3();
      passes.forEach((s, i) => {
        const k =
          ((((t - s.start) % (s.length * 1.6)) + s.length * 1.6) % (s.length * 1.6)) / s.length;
        const on = k >= 0 && k <= 1;
        p.copy(s.from)
          .lerp(s.to, Math.min(1, Math.max(0, k)))
          .normalize()
          .multiplyScalar(R);
        pos.setXYZ(i, p.x, p.y, p.z);
        // Fade in and out at the ends of the pass (into the Earth's shadow).
        alpha.setX(i, on ? s.mag * Math.min(1, k * 8, (1 - k) * 8) : 0);
      });
      pos.needsUpdate = true;
      alpha.needsUpdate = true;

      // Meteors: each cycle of 60 s, a few at set times, about 0.6 s each.
      const cyc = t % 60;
      meteorMat.opacity = 0;
      for (const [at, az, alt, len] of showers) {
        const u = (cyc - at) / 0.6;
        if (u < 0 || u > 1) continue;
        const [a, b] = track(az * D, alt * D, (az + len * 0.6) * D, (alt - len * 0.4) * D);
        const head = a.clone().lerp(b, u).normalize().multiplyScalar(R);
        const tail = a
          .clone()
          .lerp(b, Math.max(0, u - 0.25))
          .normalize()
          .multiplyScalar(R);
        const mp = meteorGeo.attributes['position'] as THREE.BufferAttribute;
        mp.setXYZ(0, tail.x, tail.y, tail.z);
        mp.setXYZ(1, head.x, head.y, head.z);
        mp.needsUpdate = true;
        meteorMat.opacity = Math.sin(u * Math.PI) * 0.9;
      }
    },
  };
}
