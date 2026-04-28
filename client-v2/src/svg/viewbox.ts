// Canonical chart viewBox is 1000×1000 unit. Stroke-scale values are
// expressed in SVG userSpaceOnUse units so they read at the spec'd ratios
// regardless of rendered pixel size.

export const CHART_SIZE = 1000;
export const CHART_CENTER = 500;

// Ring radii (per STYLE.md §4)
export const OUTER_RING_R = 480;
export const INNER_RING_R = 360;
export const SIGN_LABEL_R = 444;       // half planet-glyph radius outside outer ring
export const PLANET_R_REST = 24;
export const PLANET_R_ACTIVE = 32;
export const PLANET_HALO_R = 56;

// Stroke scale (per STYLE.md §3) — 1.6x golden-adjacent ratio between adjacent steps.
export const STROKE_HAIRLINE = 0.5;
export const STROKE_LIGHT = 1;
export const STROKE_REGULAR = 1.5;
export const STROKE_MEDIUM = 2.5;
export const STROKE_HEAVY = 4;
