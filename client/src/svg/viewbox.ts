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

// Planet glyph sizing (uniform global; cluster shape is what changes per stack).
// The disc gave up 6 units when the affliction arc arrived — three concentric
// things now share the budget below, and the arc is unreadable pressed against
// the disc rim.
export const PLANET_R_REST = 24;
export const PLANET_R_ACTIVE = 36;
export const PLANET_HALO_R = 100;

// Concentric budget around a planet. Both of these are drawn on every visible
// planet at once, so they're bounded by the tightest cluster: the 5/6/7-stack
// patterns sit ±13.91° apart at radius 320, which is 77.5 units center-to-
// center. That spread can't be widened — a sign wedge is 30° and ±13.91 already
// fills it — so anything always-on wants to stay inside r≈38.75 to never touch
// a neighbour. The ring's 36 reaches 37.8 at the peak of its breath, which
// clears that, so nothing collides at any stack size.
// Rejected: arc outside the ring at 42, which keeps the disc at its old 30 and
// buys the arc a third more circumference — but arcs are drawn on every planet
// at once, so at that radius they touch in a 4-stack and it stops being clear
// which arc belongs to which planet.
export const AFFLICTION_ARC_R = 30;
export const INTERACTION_RING_R = 36;
// Halos bloom *past* the ring — the ring wants a soft falloff outside it, not a
// hard bright edge as the outermost thing. So they key off the ring rather than
// the disc: keyed off the disc, shrinking it for the arc collapsed the invite
// halo onto the ring and left the ring with nothing softening it.
// Ratios are halves, which are exact in binary floating point — 1.45 lands on
// 52.199999999999996 and that reaches the DOM as the literal `r` attribute.
export const INVITE_HALO_R = INTERACTION_RING_R * 1.5;
export const ACTIVE_HALO_R = INTERACTION_RING_R * 2;
/** Where the corona's streamers begin — clear of the interaction ring's outer
 *  edge. Only one planet is ever acting, so unlike the arc and the ring the
 *  corona is exempt from the cluster budget above and may overlap neighbours. */
export const CORONA_INNER_R = INTERACTION_RING_R + 6;
/** Screen angle of the combustion line — 6 o'clock, so every planet's arc
 *  descends into the same point as it dies. Degrees are math-convention
 *  (0 = 3 o'clock, increasing counterclockwise), matching `polar` in Chart.tsx
 *  and the wheel's own sense: signs advance counterclockwise from the ASC. */
export const AFFLICTION_ARC_ANCHOR_DEG = 270;

/**
 * Stroke schedule, in chart viewBox units. Four rungs, four roles: LIGHT is
 * ground, MEDIUM is structure, HEAVY is a thing under attention, EXTRA_HEAVY is
 * the affliction arc.
 *
 * A whole unit apart rather than finer. The chart renders ~672px wide, so a
 * unit is about two thirds of a pixel and a half-unit step is invisible — the
 * five-rung scale this replaced (0.5 / 1 / 1.5 / 2.5 / 4, arrived whole in the
 * v2 design port) was drawing distinctions the surface can't express, and four
 * of its five rungs had no clients at all.
 *
 * Chart units only. The run map and the seam render at different unit scales
 * (~1.4px and 1px per unit), so the same number is a different line there;
 * MapDiagram's TIER is tuned in its own units and stays that way.
 */
export const STROKE_LIGHT = 1;
export const STROKE_MEDIUM = 2;
export const STROKE_HEAVY = 3;
/** The affliction arc alone. Named on the same axis as the rungs below it —
 *  weight, not width — since they grade one property. It sits above HEAVY
 *  because the arc carries more than any mark that is merely under attention:
 *  a planet's ceiling, what it can still absorb, and what the declared blow
 *  takes. One client is deliberate, but it is also how the five-rung scale
 *  this replaced rotted, so if nothing joins it, fold it back into HEAVY. */
export const STROKE_EXTRA_HEAVY = 4;
