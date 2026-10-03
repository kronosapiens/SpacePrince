/** Geometry and emphasis in the composition's 540-unit viewBox. */
const planetRadius = 92;
const outerOrbitRadius = 200;

export const KANDINSKY_STYLE = {
  planetRadius,
  outerOrbitRadius,
  // The embellishment space is twice the gap between the outer rings.
  innerOrbitRadius: planetRadius + (outerOrbitRadius - planetRadius) * 2 / 3,
  accentScale: 1.14,
  accentOpacity: 0.78,
} as const;
