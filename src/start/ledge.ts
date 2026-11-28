/**
 * The ground under the traveller: a ledge of earth and stone that ends in a ragged lip a few
 * metres behind him, where the painted valley takes over. Boulders sunk into it, tall dry grass
 * along the lip catching the low Sun. Its own scene with its own, dimmer light: the ground lies
 * in the dusk's shade, only the tips and edges turned to the Sun light up.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { tuftGeometry } from './grass';

const hash = (i: number, k: number): number => {
  const s = Math.sin(i * 91.7 + k * 271.3) * 43758.5453;
  return s - Math.floor(s);
};
/** Smooth 1D noise in [-1, 1]. */
const wave = (x: number): number =>
  Math.sin(x * 1.7) * 0.5 + Math.sin(x * 3.9 + 1.3) * 0.3 + Math.sin(x * 8.3 + 2.1) * 0.2;

export function createLedge(feet: THREE.Vector3, lightFrom: THREE.Vector3) {
  const scene = new THREE.Scene();
  /** Distance behind him (metres) at which the ground ends, by x. */
  const lip = (x: number): number => 2.9 + 0.6 * wave(x * 0.45 + 0.7) + 0.25 * wave(x * 1.7);
  /** Height of the ground above his feet: small bumps, then the fall past the lip. */
  const ground = (x: number, z: number): number => {
    const bump = 0.06 * wave(x * 1.3 + z * 0.7) + 0.04 * wave(z * 2.1 - x * 0.4);
    const past = Math.max(0, z - lip(x));
    return bump - 0.02 * Math.max(0, z) - past * past * 3 - past * 0.6;
  };
  const toWorld = (x: number, y: number, z: number): THREE.Vector3 =>
    new THREE.Vector3(feet.x + x, feet.y + y, feet.z - z);

  // Light: the same Sun as his, but the ground is in shade; a cool sky, warm grazing edges.
  const sun = new THREE.DirectionalLight(0xffa060, 1.2);
  sun.position.copy(feet).add(lightFrom);
  sun.target.position.copy(feet);
  const rim = new THREE.DirectionalLight(0xffc48a, 1.6);
  rim.position.copy(feet).add(new THREE.Vector3(6, 1.5, -3));
  rim.target.position.copy(feet);
  scene.add(sun, sun.target, rim, rim.target);
  scene.add(new THREE.HemisphereLight(0x5a5a86, 0x1c140e, 0.4));

  // The earth: a grid, coloured dark olive to umber in patches.
  const NX = 70;
  const NZ = 46;
  const X0 = -8;
  const X1 = 7;
  const Z0 = -2;
  const Z1 = 9;
  const pos: number[] = [];
  const col: number[] = [];
  const index: number[] = [];
  const c = new THREE.Color();
  for (let j = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++) {
      const x = X0 + ((X1 - X0) * i) / NX;
      const z = Z0 + ((Z1 - Z0) * j) / NZ;
      const p = toWorld(x, ground(x, z), z);
      pos.push(p.x, p.y, p.z);
      const patch = 0.5 + 0.5 * wave(x * 0.9 + z * 1.4);
      c.setHSL(0.11 + patch * 0.1, 0.35, 0.045 + patch * 0.035);
      col.push(c.r, c.g, c.b);
      if (i < NX && j < NZ) {
        const k = j * (NX + 1) + i;
        index.push(k, k + NX + 1, k + 1, k + 1, k + NX + 1, k + NX + 2);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  scene.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }),
    ),
  );

  // Grass: tall dry tufts, thick along the lip (they stand against the bright valley) and
  // scattered over the rest, swaying.
  const time = { value: 0 };
  const grassMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms['uTime'] = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
  vec3 root = instanceMatrix[3].xyz;
  float gust = sin(uTime * 1.1 + root.x * 0.5 + root.z * 0.3) * 0.6 + sin(uTime * 2.7 + root.x * 1.3) * 0.25;
  float bend = transformed.y * transformed.y * 0.8;
  transformed.x += bend * (0.5 + gust);
  transformed.z += bend * 0.2 * gust;`,
      );
  };
  const COUNT = 3200;
  const grass = new THREE.InstancedMesh(tuftGeometry(), grassMat, COUNT);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let n = 0;
  for (let i = 0; n < COUNT && i < COUNT * 6; i++) {
    const x = X0 + 1 + hash(i, 1) * (X1 - X0 - 2);
    const edge = lip(x);
    // Most of them in a band along the lip, the rest anywhere behind him.
    const z =
      hash(i, 2) < 0.35 ? edge - Math.pow(hash(i, 3), 2) * 0.8 : -0.5 + hash(i, 3) * (edge + 0.3);
    // Not where he stands.
    if (Math.hypot(x, z) < 0.9) continue;
    const s = (z > edge - 0.6 ? 1.2 : 0.75) * (0.4 + hash(i, 4) * 0.45);
    q.setFromEuler(new THREE.Euler((hash(i, 5) - 0.5) * 0.3, hash(i, 6) * 6.28, 0));
    m.compose(
      toWorld(x, ground(x, z) - 0.02, z),
      q,
      new THREE.Vector3(s, s * (0.9 + hash(i, 7) * 0.6), s),
    );
    grass.setMatrixAt(n, m);
    const green = hash(i, 8) < 0.3;
    c.setHSL(green ? 0.2 : 0.09 + hash(i, 9) * 0.04, green ? 0.3 : 0.45, 0.3 + hash(i, 10) * 0.2);
    grass.setColorAt(n, c);
    n++;
  }
  grass.count = n;
  grass.frustumCulled = false;
  scene.add(grass);

  // Boulders (Poly Haven, CC0; decimated, small textures), sunk deep: only their backs show
  // through the earth and grass.
  void new GLTFLoader().loadAsync('/models/start/rocks.glb').then((gltf) => {
    const get = (name: string): THREE.Object3D => {
      const o = gltf.scene.getObjectByName(name);
      if (!o) throw new Error(`rocks.glb: no ${name}`);
      o.removeFromParent();
      o.position.set(0, 0, 0);
      return o;
    };
    const a = get('namaqualand_boulder_02');
    const b = get('rock_boulder_dry');
    const r = get('namaqualand_rocks_01');
    // [model, x, z (behind him), width, how much shows above the ground, turn]
    const rocks: [THREE.Object3D, number, number, number, number, number][] = [
      [r, 1.4, 2.3, 1.8, 0.18, 1.9],
      [a, -1.9, 2.0, 1.3, 0.22, 3.1],
      [r, -0.4, 1.4, 1.6, 0.1, 0.4],
      [b, 3.4, 2.7, 1.5, 0.28, 0.9],
      [a, -3.8, 2.6, 1.6, 0.25, 2.4],
    ];
    for (const [src, x, z, w, show, turn] of rocks) {
      const rock = src.clone();
      rock.rotation.y = turn;
      rock.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(rock);
      rock.scale.setScalar(w / Math.max(box.max.x - box.min.x, box.max.z - box.min.z));
      rock.updateMatrixWorld(true);
      box.setFromObject(rock);
      const at = toWorld(x, ground(x, z) + show, z);
      rock.position.set(
        at.x - (box.min.x + box.max.x) / 2,
        at.y - box.max.y,
        at.z - (box.min.z + box.max.z) / 2,
      );
      rock.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const mat = (o.material as THREE.MeshStandardMaterial).clone();
        mat.color.setRGB(0.4, 0.37, 0.32);
        o.material = mat;
      });
      scene.add(rock);
    }
  });

  return {
    scene,
    update(t: number): void {
      time.value = t;
    },
  };
}
