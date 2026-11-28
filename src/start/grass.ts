import * as THREE from 'three';

/**
 * One tuft of dry grass: a handful of thin curved blades from one root, each a narrow strip
 * that bends over towards its tip. Vertex colour runs from dark at the root to pale at the tip.
 */
export function tuftGeometry(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const index: number[] = [];
  const SEG = 4;
  const blades = 7;
  for (let b = 0; b < blades; b++) {
    const turn = (b / blades) * Math.PI * 2 + b * 0.7;
    const lean = 0.25 + ((b * 37) % 10) / 22;
    const height = 0.3 + ((b * 53) % 10) / 40;
    const width = 0.007 + ((b * 29) % 10) / 2400;
    const dir = new THREE.Vector3(Math.cos(turn), 0, Math.sin(turn));
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const base = pos.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      // Up, then over: the tip falls away from the root.
      const out = lean * t * t * height;
      const up = height * (t - 0.35 * lean * t * t);
      const w = width * (1 - t * 0.92);
      const c = new THREE.Vector3().addScaledVector(dir, out + 0.01 * b).setY(up);
      for (const s of [-1, 1]) {
        pos.push(c.x + side.x * w * s, c.y, c.z + side.z * w * s);
        const shade = 0.35 + 0.65 * t;
        col.push(shade, shade, shade);
      }
      if (i < SEG) {
        const k = base + i * 2;
        index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
