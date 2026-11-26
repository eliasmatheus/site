// Where the visitor is looking across the nebula. Each part of the page has its own spot in
// the sky; the mouse only tilts the view a little. Moving makes the nebula glow, resting dims it.

/** Spot in the panorama (0 = far left, 1 = far right) for each part of the page. */
export const SECTION_VIEW: Readonly<Record<string, number>> = {
  about: 0.18,
  experience: 0.42,
  projects: 0.66,
  door: 0.9,
};

/** How far the mouse can tilt the view, as a fraction of the panorama. */
export const POINTER_TILT = 0.05;

export interface View {
  /** Current spot, 0 to 1. */
  x: number;
  /** Extra brightness from moving, 0 at rest. */
  glow: number;
}

/** The spot to look at: the section's, tilted by the pointer (0 to 1 across the screen). */
export function viewTarget(section: string | null, pointer: number | null): number {
  const base = (section && SECTION_VIEW[section]) ?? SECTION_VIEW['about'] ?? 0;
  const tilt = pointer === null ? 0 : (pointer - 0.5) * 2 * POINTER_TILT;
  return Math.min(1, Math.max(0, base + tilt));
}

/** Eases the view toward the target. Speed turns into glow, which fades when the view rests. */
export function stepView(view: View, target: number, dt: number): View {
  const x = view.x + (target - view.x) * (1 - Math.exp(-dt * 2.2));
  const speed = Math.abs(x - view.x) / Math.max(dt, 1e-3);
  const glow = Math.min(1, view.glow * Math.exp(-dt * 1.6) + speed * dt * 6);
  return { x, glow };
}
