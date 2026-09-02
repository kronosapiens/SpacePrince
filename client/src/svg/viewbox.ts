// Canonical chart viewBox is 1000×1000. v2 geometry per Claude Design handoff.

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
// The disc gave up 6 units when the affliction arc arrived — three concentric
// things now share the budget below, and the arc is unreadable pressed against
// the disc rim.
export const PLANET_R_REST = 24;
export const PLANET_R_ACTIVE = 36;
export const PLANET_HALO_R = 100;

// Concentric budget around a planet. Both of these are drawn on every visible
// planet at once, so the ring is what sets the chart's spacing floor rather than
// the other way round: 36 with a 3-unit stroke, both scaled by the breath's 1.05
// peak, reaches 39.375, so two rings want 78.75 between centres. CLUSTER_PATTERNS
// holds every pair at 80 to clear it. Counting the radius at peak and forgetting
// the stroke is the arithmetic that let the old patterns sit 76.8 apart and
// touch — if either number here moves, that pitch has to move with it.
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
/** Ring spacing of the incoming mark — the magnitude arriving at the chart,
 *  one ring per 12 points filling inward from the interaction ring. The direct
 *  amount is a stat, so it is on the 12-lattice and caps at 48 + 12 + 12 = 72:
 *  six rings, the sixth one pitch from the centre. */
export const INCOMING_RING_PITCH = INTERACTION_RING_R / 6;
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
/** The projection diff on an affliction arc, alone. Named on the same axis as
 *  the rungs below it — weight, not width — since they grade one property. It
 *  sits above HEAVY because a blow in flight outranks anything merely under
 *  attention, including the arc it is drawn on: the arc says what a planet can
 *  absorb, the diff says what is about to be taken from it.
 *
 *  The arc itself held this rung until the diff needed to out-weigh it. HEAVY
 *  suits the arc better anyway — it is a thing under attention, and it shares
 *  that rung with the interaction ring without confusion, since kind separates
 *  those two (an arc is data, a complete circle is interaction).
 *
 *  One client is deliberate, but it is also how the five-rung scale this
 *  replaced rotted, so if nothing joins it, fold it back into HEAVY. */
export const STROKE_EXTRA_HEAVY = 4;
