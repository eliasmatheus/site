/**
 * Structures in 3D: one of the churches (two floors, six columns, six footings) over the
 * soil layers of the borehole, in the look of a structural analysis program. Loaded by
 * dynamic import from the scene controller, so three.js only ships when the scene is near.
 *
 * The central footing on the front row is the quest footing. Its yellow corners (width)
 * and arrow (depth) can be dragged; the scene sliders do the same and stay the main path.
 */
import {
  AmbientLight,
  BoxGeometry,
  ConeGeometry,
  DirectionalLight,
  EdgesGeometry,
  GridHelper,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three';
import type { Tone } from './footingView';

export interface FootingState {
  B: number;
  D: number;
  tone: Tone;
  /** Plans changed: handles and the target outline may show. */
  changed: boolean;
  /** The visitor took the controls: show the green target outline. */
  guide: boolean;
  target: { B: number; D: number };
}

export interface Model3D {
  update(s: FootingState): void;
  /** Dwell progress 0 to 1: the camera orbits and dives toward the footing. */
  setProgress(p: number): void;
  start(): void;
  stop(): void;
  dispose(): void;
}

export interface ModelOptions {
  canvas: HTMLCanvasElement;
  /** HTML tag that follows the footing on screen. */
  label?: HTMLElement | null;
  /** Phones: closer camera on the central footing. */
  compact: boolean;
  /** Reduced motion: no pulsing. */
  still: boolean;
  onDrag(kind: 'width' | 'depth', value: number): void;
  onGrab(): void;
}

const COLORS: Record<Tone, number> = {
  neutral: 0xc9ccd2,
  ok: 0x7ee2a8,
  over: 0xffb35c,
  fail: 0xff4d3d,
};

const RANGE = { B: [0.8, 3.2], D: [0.6, 3.5] } as const;
const clamp = (v: number, [lo, hi]: readonly [number, number]): number =>
  Math.min(hi, Math.max(lo, v));

/** Returns undefined when WebGL is not available; the SVG section stays. */
export function createModel(opts: ModelOptions): Model3D | undefined {
  const { canvas, label } = opts;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return undefined;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  const scene = new Scene();
  const cam = new PerspectiveCamera(opts.compact ? 44 : 38, 1, 0.1, 200);
  scene.add(new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xffffff, 0.85);
  sun.position.set(6, 12, 8);
  scene.add(sun);
  scene.add(new GridHelper(24, 24, 0x353b47, 0x1d2129));

  // Soil layers from the borehole: soft to 2 m, firm to 3 m, stiff below.
  const soil: [number, number, number, number][] = [
    [0, -2, 0xb08a5a, 0.06],
    [-2, -3, 0x9c7448, 0.1],
    [-3, -4.6, 0xd6a560, 0.13],
  ];
  soil.forEach(([top, bottom, color, opacity]) => {
    const h = top - bottom;
    const g = new BoxGeometry(20, h, 14);
    const m = new Mesh(
      g,
      new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
    );
    m.position.y = top - h / 2;
    scene.add(m);
    const e = new LineSegments(new EdgesGeometry(g), new LineBasicMaterial({ color: 0x5a4630 }));
    e.position.y = m.position.y;
    scene.add(e);
  });

  const edge = new LineBasicMaterial({ color: 0x5ec8ff });
  const concrete = new MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.85 });
  const addBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: MeshStandardMaterial = concrete,
  ): Mesh => {
    const m = new Mesh(new BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.add(new LineSegments(new EdgesGeometry(m.geometry), edge));
    scene.add(m);
    return m;
  };

  // Frame: 3 x 2 columns, beams and slabs on two floors.
  const xs = [-4, 0, 4];
  const zs = [-3, 3];
  xs.forEach((x) => zs.forEach((z) => addBox(0.3, 6, 0.3, x, 3, z)));
  const slabMat = new MeshStandardMaterial({
    color: 0x9aa3b5,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  [3, 6].forEach((y) => {
    zs.forEach((z) => addBox(8.3, 0.4, 0.2, 0, y - 0.2, z));
    xs.forEach((x) => addBox(0.2, 0.4, 6.3, x, y - 0.2, 0));
    addBox(8.6, 0.12, 6.6, 0, y + 0.06, 0, slabMat).renderOrder = 2;
  });

  // Footings. The front central one is the quest footing.
  const unit = new BoxGeometry(1, 0.5, 1);
  const stubGeo = new BoxGeometry(0.3, 1, 0.3);
  const target = { x: 0, z: 3 };
  const footMat = new MeshStandardMaterial({ color: COLORS.neutral, roughness: 0.8 });
  let foot: Mesh | undefined;
  let stub: Mesh | undefined;
  xs.forEach((x) =>
    zs.forEach((z) => {
      const quest = x === target.x && z === target.z;
      const f = new Mesh(unit, quest ? footMat : concrete);
      f.position.set(x, -1.5 + 0.25, z);
      f.scale.set(1.6, 1, 1.6);
      f.add(new LineSegments(new EdgesGeometry(unit), edge));
      scene.add(f);
      const s = new Mesh(stubGeo, concrete);
      s.position.set(x, -0.5, z);
      scene.add(s);
      if (quest) {
        foot = f;
        stub = s;
      }
    }),
  );

  const bulbMat = new MeshBasicMaterial({
    color: COLORS.ok,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const bulb = new Mesh(new SphereGeometry(1, 32, 16), bulbMat);
  scene.add(bulb);

  const handleMat = new MeshBasicMaterial({ color: 0xffd84a });
  const corners = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ].map(([sx, sz]) => {
    const h = new Mesh(new SphereGeometry(opts.compact ? 0.24 : 0.16, 16, 12), handleMat);
    h.userData = { kind: 'width', sx, sz };
    scene.add(h);
    return h;
  });
  const arrow = new Mesh(new ConeGeometry(0.22, 0.5, 16), handleMat);
  arrow.rotation.x = Math.PI;
  arrow.userData = { kind: 'depth' };
  scene.add(arrow);
  const handles: Object3D[] = [...corners, arrow];

  const ghost = new LineSegments(
    new EdgesGeometry(unit),
    new LineBasicMaterial({ color: 0x7ee2a8, transparent: true, opacity: 0.85 }),
  );
  ghost.visible = false;
  scene.add(ghost);

  let state: FootingState | undefined;
  let progress = 0;
  let raf = 0;
  let size = { w: 0, h: 0 };

  const place = (): void => {
    if (!state || !foot || !stub) return;
    const { B, D } = state;
    foot.scale.set(B, 1, B);
    foot.position.y = -D + 0.25;
    stub.scale.y = Math.max(0.01, D - 0.5);
    stub.position.y = -(D - 0.5) / 2;
    corners.forEach((h) => {
      const { sx, sz } = h.userData as { sx: number; sz: number };
      h.position.set(target.x + (sx * B) / 2, -D + 0.5, target.z + (sz * B) / 2);
    });
    arrow.position.set(target.x + B / 2 + 0.55, -D + 0.2, target.z);
    bulb.scale.set(B * 0.75, B * 0.95, B * 0.75);
    bulb.position.set(target.x, -D - B * 0.6, target.z);
    ghost.scale.set(state.target.B, 1, state.target.B);
    ghost.position.set(target.x, -state.target.D + 0.25, target.z);
    const col = COLORS[state.tone];
    footMat.color.setHex(col);
    bulbMat.color.setHex(state.tone === 'neutral' ? COLORS.ok : col);
    handles.forEach((h) => (h.visible = state?.changed ?? false));
    ghost.visible = state.changed && state.guide && state.tone !== 'ok';
  };

  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (w !== size.w || h !== size.h) {
      size = { w, h };
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    // Orbit and dive toward the footing as the visitor scrolls (from the prototype).
    const p = progress;
    const ang = -0.95 + p * 1.5;
    if (opts.compact) {
      // Phones: a close orbit around the quest footing, so it fills the small view.
      const rad = 7.5;
      cam.position.set(Math.sin(ang) * rad, 4.2 - p * 2.6, target.z + Math.cos(ang) * rad);
      cam.lookAt(target.x, -0.9 - p * 1.1, target.z);
    } else {
      const rad = 17;
      cam.position.set(Math.sin(ang) * rad, 7.5 - p * 5.6, Math.cos(ang) * rad);
      cam.lookAt(0, 0.4 - p * 2.2, 1.4);
    }

    const failing = state?.tone === 'fail';
    footMat.emissive.setHex(failing ? 0x661a12 : 0x000000);
    footMat.emissiveIntensity = failing && !opts.still ? 0.6 + 0.4 * Math.sin(now / 160) : 0;

    if (label && foot) {
      const v = foot.position.clone();
      v.y += 0.6;
      v.project(cam);
      label.style.transform = `translate(${Math.round(((v.x + 1) / 2) * w + 18)}px, ${Math.round(((1 - v.y) / 2) * h - 12)}px)`;
    }
    renderer.render(scene, cam);
  };

  // Dragging the handles.
  const ray = new Raycaster();
  const ndc = (e: PointerEvent): Vector2 => {
    const r = canvas.getBoundingClientRect();
    return new Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
  };
  const hit = (e: PointerEvent): Object3D | undefined => {
    if (!state?.changed) return undefined;
    ray.setFromCamera(ndc(e), cam);
    return ray.intersectObjects(handles, false)[0]?.object;
  };
  let drag: { kind: 'width' | 'depth'; plane: Plane } | undefined;
  const onDown = (e: PointerEvent): void => {
    const h = hit(e);
    if (!h || !state) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const kind = (h.userData as { kind: 'width' | 'depth' }).kind;
    let plane: Plane;
    if (kind === 'width') {
      plane = new Plane(new Vector3(0, 1, 0), state.D - 0.5);
    } else {
      const n = new Vector3(
        cam.position.x - h.position.x,
        0,
        cam.position.z - h.position.z,
      ).normalize();
      plane = new Plane(n, -n.dot(h.position));
    }
    drag = { kind, plane };
    canvas.style.cursor = 'grabbing';
    opts.onGrab();
  };
  const onMove = (e: PointerEvent): void => {
    if (!drag) {
      canvas.style.cursor = hit(e) ? 'grab' : '';
      return;
    }
    ray.setFromCamera(ndc(e), cam);
    const pt = new Vector3();
    if (!ray.ray.intersectPlane(drag.plane, pt)) return;
    if (drag.kind === 'width') {
      const half = Math.max(Math.abs(pt.x - target.x), Math.abs(pt.z - target.z));
      opts.onDrag('width', clamp(2 * half, RANGE.B));
    } else {
      opts.onDrag('depth', clamp(-pt.y + 0.2, RANGE.D));
    }
  };
  const onUp = (e: PointerEvent): void => {
    if (!drag) return;
    drag = undefined;
    canvas.style.cursor = '';
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  return {
    update(s) {
      state = s;
      place();
    },
    setProgress(p) {
      progress = p;
    },
    start() {
      if (!raf) raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      renderer.dispose();
    },
  };
}
