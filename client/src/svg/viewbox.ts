// Canonical chart viewBox is 1000×1000. v2 geometry per Claude Design handoff.

export const CHART_SIZE = 1000;
export const CHART_CENTER = 500;

// v2 ring radii: outer carries labels, inner is the chart proper.
// Planets sit just inside the inner ring at radii ~308–320 (per cluster patterns).
export const OUTER_RING_R = 480;
export const INNER_RING_R = 380;
export const SIGN_LABEL_R = 430;     // sign labels sit between inner and outer rings
export const TICK_INNER_R = 410;     // tick marks straddle the gap between rings
export const TICK_OUTER_R = 450;

// Planet glyph sizing (uniform global; cluster shape is what changes per stack)
export const PLANET_R_REST = 30;
export const PLANET_R_ACTIVE = 36;
export const PLANET_HALO_R = 100;

// Stroke scale (in viewBox units)
export const STROKE_HAIRLINE = 0.5;
export const STROKE_LIGHT = 1;
export const STROKE_REGULAR = 1.5;
export const STROKE_MEDIUM = 2.5;
export const STROKE_HEAVY = 4;
