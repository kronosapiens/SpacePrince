// Canonical chart viewBox is 1000×1000. Mirrors client/src/svg/viewbox.ts,
// trimmed to what the landing chart draws (no affliction arc, no corona).

export const CHART_SIZE = 1000;
export const CHART_CENTER = 500;

// Ring radii: outer carries labels, inner is the chart proper.
// Every sign's outermost planet sits at 335 (CLUSTER_PATTERNS) and its
// interaction ring reaches 39.375 past that at the peak of its breath, so the
// planet band ends at 374.4. The inner ring stands at 390 to leave that a
// visible margin rather than the 5.6 units it had at 380 — the ring is what the
// planets read as sitting inside, and pressed against it they read as sitting
// on it. The label band gives up the same 10 units, so its contents step out
// and in by half that to stay centred on 435, and the ticks shorten from 40 to
// 36 in proportion.
export const OUTER_RING_R = 480;
export const INNER_RING_R = 390;
export const SIGN_LABEL_R = 435;     // sign labels sit between inner and outer rings
export const TICK_INNER_R = 417;     // tick marks straddle the gap between rings
export const TICK_OUTER_R = 453;

// Planet glyph sizing (uniform global; cluster shape is what changes per stack).
// The disc gave up 6 units when the affliction arc arrived in the client — the
// landing has no arc, but the disc keeps the client's size so a chart here and a
// chart in the game read as the same object.
export const PLANET_R_REST = 24;

// The interaction ring and the halo blooming past it. Halos key off the ring
// rather than the disc, so the ring has a soft falloff outside it rather than a
// hard bright edge as the outermost thing. Ratio is a half, which is exact in
// binary floating point — it reaches the DOM as the literal `r` attribute.
export const INTERACTION_RING_R = 36;
export const INVITE_HALO_R = INTERACTION_RING_R * 1.5;

/**
 * Stroke schedule, in chart viewBox units. Three rungs, three roles: LIGHT is
 * ground, MEDIUM is structure, HEAVY is a thing under attention. (The client
 * carries a fourth, EXTRA_HEAVY, for the affliction arc, which the landing
 * doesn't draw.)
 *
 * A whole unit apart rather than finer: the chart renders ~672px wide, so a
 * unit is about two thirds of a pixel and a half-unit step is invisible.
 */
export const STROKE_LIGHT = 1;
export const STROKE_MEDIUM = 2;
export const STROKE_HEAVY = 3;
