/**
 * The moments in the tesseract's gaps, as small 3D scenes with their own light: a desk with a
 * laptop (2020), a dune under a hard sun (the desert), a footing and its column in the soil
 * (structures), three cards on a stage (the choice) and, at the bottom, the first computer.
 *
 * Each light is a color the tesseract does not have (cold blue, white sun, green, violet,
 * phosphor), so the memory reads against the amber beams; `spill` hands the same lights to
 * the beams' shader, so they leak onto the lattice around each gap.
 */
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three';

export interface Spill {
  position: Vector3;
  color: Color;
}

export interface Memories {
  spills: Spill[];
  dispose(): void;
}

interface Place {
  x: number;
  y: number;
  z: number;
}

type Screen = (w: number, h: number) => CanvasTexture;

export function createMemories(
  parent: Object3D,
  gaps: Place[],
  bottom: Place,
  screens: { code: Screen; boot: Screen },
): Memories {
  const trash: { dispose(): void }[] = [];
  const spills: Spill[] = [];

  const std = (
    color: number,
    extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {},
  ) => {
    const m = new MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...extra });
    trash.push(m);
    return m;
  };
  const mesh = (g: BufferGeometry, m: Material, x = 0, y = 0, z = 0): Mesh => {
    trash.push(g);
    const o = new Mesh(g, m);
    o.position.set(x, y, z);
    return o;
  };
  /** A memory sits at a gap and faces the shaft's axis. */
  const place = (
    at: Place,
    build: (g: Group) => void,
    light: number,
    power: number,
    lx = 0,
    ly = 1.5,
    lz = 1.5,
  ) => {
    const g = new Group();
    g.position.set(at.x, at.y, at.z);
    g.lookAt(0, at.y, 0);
    // A little bigger than life and tipped towards the camera, so it reads from the shaft.
    g.scale.setScalar(1.45);
    g.rotateX(0.32);
    build(g);
    const l = new PointLight(light, power, 22, 1.6);
    l.position.set(lx, ly, lz);
    g.add(l);
    parent.add(g);
    g.updateMatrixWorld(true);
    spills.push({ position: l.getWorldPosition(new Vector3()), color: new Color(light) });
  };

  const [code, desert, structures, choice] = gaps;

  // 2020 · a desk at night, a laptop with the first program on it.
  if (code) {
    place(
      code,
      (g) => {
        const wood = std(0x3a2a20);
        g.add(mesh(new BoxGeometry(5.4, 0.22, 2.6), wood, 0, -1.3, 0));
        for (const [x, z] of [
          [-2.5, -1.1],
          [2.5, -1.1],
          [-2.5, 1.1],
          [2.5, 1.1],
        ] as const) {
          g.add(mesh(new BoxGeometry(0.18, 2.2, 0.18), wood, x, -2.5, z));
        }
        const shell = std(0x2b2e33, { metalness: 0.5, roughness: 0.4 });
        g.add(mesh(new BoxGeometry(2.6, 0.09, 1.7), shell, 0, -1.14, 0.2));
        const tex = screens.code(256, 160);
        trash.push(tex);
        const lid = new Group();
        lid.position.set(0, -1.1, -0.64);
        lid.rotation.x = -0.22;
        lid.add(mesh(new BoxGeometry(2.6, 1.65, 0.06), shell, 0, 0.82, -0.04));
        const glass = new MeshBasicMaterial({ map: tex, toneMapped: false });
        trash.push(glass);
        lid.add(mesh(new PlaneGeometry(2.42, 1.5), glass, 0, 0.82, 0.0));
        g.add(lid);
        g.add(mesh(new CylinderGeometry(0.2, 0.17, 0.42, 16), std(0xd9d4c8), 1.9, -1.0, 0.5));
      },
      0x8fb6ff,
      14,
      0,
      -0.2,
      1.2,
    );
  }

  // 2019 to 2020 · a dune under a white sun.
  if (desert) {
    place(
      desert,
      (g) => {
        const dune = new PlaneGeometry(10, 7, 48, 34);
        const pos = dune.attributes['position'];
        if (pos) {
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            pos.setZ(i, Math.sin(x * 0.7 + y * 0.3) * 0.5 + Math.cos(x * 0.25 - y * 0.6) * 0.8);
          }
          dune.computeVertexNormals();
        }
        const sand = mesh(dune, std(0xd8a46a, { roughness: 1 }), 0, -2.0, -0.5);
        sand.rotation.x = -Math.PI / 2 + 0.35;
        g.add(sand);
        const rock = std(0x7a5a40, { roughness: 1 });
        g.add(mesh(new DodecahedronGeometry(0.45), rock, -1.8, -1.6, 0.8));
        g.add(mesh(new DodecahedronGeometry(0.28), rock, -1.2, -1.75, 1.3));
        const sunMat = new MeshBasicMaterial({ color: 0xfff4dc, toneMapped: false });
        trash.push(sunMat);
        g.add(mesh(new SphereGeometry(0.6, 24, 16), sunMat, 2.4, 1.6, -3));
      },
      0xfff0d0,
      30,
      2.2,
      1.4,
      -1.6,
    );
  }

  // 2012 to 2020 · structures: a footing and its column, cut out of the soil.
  if (structures) {
    place(
      structures,
      (g) => {
        g.add(mesh(new BoxGeometry(6, 2.6, 3.2), std(0x5a3d26, { roughness: 1 }), 0, -2.4, -0.4));
        g.add(
          mesh(new BoxGeometry(6.02, 0.5, 3.22), std(0x3c5a2a, { roughness: 1 }), 0, -0.86, -0.4),
        );
        const concrete = std(0xb9bcc2, { roughness: 0.9 });
        g.add(
          mesh(
            new BoxGeometry(2.4, 0.55, 2.4),
            std(0xb9bcc2, { emissive: 0x7ee2a8, emissiveIntensity: 0.35 }),
            0,
            -2.6,
            0,
          ),
        );
        g.add(mesh(new BoxGeometry(0.55, 4.2, 0.55), concrete, 0, -0.4, 0));
      },
      0x6fffb0,
      16,
      0,
      0.4,
      2.4,
    );
  }

  // 2011 · the choice: three cards on a stage, the first one picked.
  if (choice) {
    place(
      choice,
      (g) => {
        g.add(mesh(new CylinderGeometry(3.6, 3.8, 0.3, 40), std(0x1d1a24), 0, -2.3, 0));
        [-1.8, 0, 1.8].forEach((x, i) => {
          const picked = i === 0;
          const card = mesh(
            new BoxGeometry(1.3, 1.9, 0.07),
            std(picked ? 0xffd166 : 0xf2efe4, {
              emissive: picked ? 0xffc040 : 0x000000,
              emissiveIntensity: picked ? 0.7 : 0,
            }),
            x,
            picked ? -0.9 : -1.15,
            picked ? 0.6 : 0,
          );
          card.rotation.y = -x * 0.12;
          g.add(card);
        });
      },
      0xb07cff,
      16,
      0,
      1.6,
      2.2,
    );
  }

  // Late 90s · the first computer, waiting at the bottom: a beige monitor on its case.
  {
    const g = new Group();
    g.position.set(bottom.x, bottom.y, bottom.z);
    // Tilted back, so the screen looks up the shaft at the falling visitor.
    g.rotation.x = -Math.PI / 2 + 0.25;
    const beige = std(0xd6cdb6, { roughness: 0.8 });
    g.add(mesh(new BoxGeometry(5.6, 1.4, 4.6), beige, 0, -2.8, -0.6));
    g.add(mesh(new BoxGeometry(4.6, 3.8, 3.6), beige, 0, 0, -0.8));
    const tex = screens.boot(256, 176);
    trash.push(tex);
    const glass = new MeshBasicMaterial({ map: tex, toneMapped: false });
    trash.push(glass);
    g.add(mesh(new PlaneGeometry(3.6, 2.7), glass, 0, 0.1, 1.01));
    const l = new PointLight(0xb6f3a1, 16, 26, 1.6);
    l.position.set(0, 0, 3);
    g.add(l);
    parent.add(g);
    g.updateMatrixWorld(true);
    spills.push({ position: l.getWorldPosition(new Vector3()), color: new Color(0xb6f3a1) });
  }

  return {
    spills,
    dispose() {
      trash.forEach((t) => t.dispose());
    },
  };
}
