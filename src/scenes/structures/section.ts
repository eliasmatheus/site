/**
 * Geometry of the 2D cross-section: the central column, its pit and footing in the soil.
 * Pure, no DOM. SVG units: 50 px per metre, ground at y = 70, x = 200 on the column axis.
 */
export const PX = 50;
export const GROUND = 70;
export const AXIS = 200;
export const FOOTING_H = 0.5;
const WORK_MARGIN = 0.6;
/** Top of the drawn column; the load arrow sits above it. */
export const COLUMN_TOP = 24;

/** Soil layers of the borehole (m): soft to 2 m, firm to 3 m, stiff below. */
export const LAYERS = [
  { from: 0, to: 2, kind: 'soft' },
  { from: 2, to: 3, kind: 'firm' },
  { from: 3, to: 4.6, kind: 'stiff' },
] as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SectionGeometry {
  pit: Rect;
  footing: Rect;
  column: Rect;
  /** Shoring on the pit walls below 2 m (zero height when not needed). */
  shoring: Rect;
  bulb: { cx: number; cy: number; rx: number; ry: number };
  /** Corner handle (width) and arrow tip (depth). */
  corner: { x: number; y: number };
  arrow: { x: number; y: number };
}

const y = (depth: number): number => GROUND + depth * PX;

export function footingRect(B: number, D: number): Rect {
  return { x: AXIS - (B / 2) * PX, y: y(D - FOOTING_H), w: B * PX, h: FOOTING_H * PX };
}

export function sectionGeometry(B: number, D: number): SectionGeometry {
  const pitW = B + WORK_MARGIN;
  const footing = footingRect(B, D);
  return {
    pit: { x: AXIS - (pitW / 2) * PX, y: GROUND, w: pitW * PX, h: D * PX },
    footing,
    column: { x: AXIS - 0.15 * PX, y: COLUMN_TOP, w: 0.3 * PX, h: footing.y - COLUMN_TOP },
    shoring: { x: AXIS - (pitW / 2) * PX, y: y(2), w: pitW * PX, h: Math.max(0, D - 2) * PX },
    bulb: { cx: AXIS, cy: y(D) + B * 0.3 * PX, rx: B * 0.75 * PX, ry: B * 0.6 * PX },
    corner: { x: footing.x + footing.w, y: footing.y },
    arrow: { x: AXIS + (pitW / 2) * PX + 22, y: y(D) },
  };
}

/** Inverse of the drawing: footing width (m) for a pointer at svg x. */
export const widthAt = (svgX: number): number => (2 * Math.abs(svgX - AXIS)) / PX;
/** Inverse of the drawing: footing depth (m) for a pointer at svg y. */
export const depthAt = (svgY: number): number => (svgY - GROUND) / PX;
