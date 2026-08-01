import { STROKE_EXTRA_HEAVY, STROKE_HEAVY, STROKE_LIGHT, STROKE_MEDIUM } from "@/svg/viewbox";

/**
 * Every opacity / stroke-weight knob the Chart draws with, gathered in one
 * place so a brightness pass edits here instead of hunting through ~900 lines
 * of JSX. Grouped by element; values are chart viewBox units (1000×1000).
 * Elements that change on interaction carry rest/active (or rest/hover) pairs.
 * Every stroke is a rung of the four-step schedule in viewbox.ts — ground,
 * structure, under attention, the affliction arc — never a loose number.
 *
 * Tuning note: the faint layers are deliberately kept above the threshold where
 * social-media video re-encoding (H.264/VP9 quantization on the near-black
 * ground) would crush them to solid black. The run map's sibling scale is the
 * TIER constant in MapDiagram.tsx; the aspect-propagation pulse is PropagationLine.tsx.
 */
export const CHART_STYLE = {
  /** Field — sacred-geometry ground (rotating hexagram + vesica). */
  substrate: { opacity: 0.16, stroke: STROKE_LIGHT },

  /** Diagram — structural rings of the wheel. */
  ring: {
    outer: { opacity: 0.55, stroke: STROKE_MEDIUM },
    inner: { opacity: 0.45, stroke: STROKE_LIGHT },
  },
  /** Diagram — the twelve sign-division ticks. */
  tick: { opacity: 0.85, stroke: STROKE_MEDIUM },
  /** Word — sign name + glyph labels on the outer band. */
  signLabel: { opacity: 0.7 },

  /** Diagram — aspect web. One opacity across every screen; the active stroke
   *  (hover / select / propagation) is the only thing that emphasizes a line, so
   *  there's no per-screen "resting brightness" to reason about. Combat reads the
   *  web to plan propagation, so it wants full clarity, same as the Title. */
  aspect: {
    opacity: 1,
    restStroke: STROKE_LIGHT,
    // Heavy, matching the propagation pulse (PropagationLine.tsx): a line
    // under attention is one weight everywhere. Anything lighter reads too
    // close to the thickened resting web.
    activeStroke: STROKE_HEAVY,
  },

  /** Diagram — planet glyph disc + rim. Rim/ghost stroke scales with glyph
   *  radius: max(rimStrokeMin, glyphR * rimStrokeRatio); the symbol scales as
   *  glyphR * symbolRatio. The ratio rose well past its old 0.85 when the disc
   *  shrank to make room for the affliction arc, so the symbol kept its size
   *  while the circle under it gave up radius — what identifies a planet is its
   *  sign, not how big a disc it sits on. Tuned live against the arc and ring
   *  (`svg/tuning.ts`). */
  planet: {
    discOpacity: 0.92,
    discCombustedOpacity: 0.4,
    rimOpacity: 0.9,
    rimStrokeRatio: 0.05,
    rimStrokeMin: STROKE_LIGHT,
    symbolRatio: 1.2,
  },
  /** Diagram — ghost (un-revealed) planet: dashed outline + faded glyph. */
  ghost: { outlineOpacity: 0.35, glyphOpacity: 0.4, dash: "2 4" },

  /** Active — the tappable invite's halo, breathing on the shared --breath
   *  clock in motion.css (one phase for every invite on every surface) and
   *  snapping to full when the planet is hovered or selected. */
  invite: {
    halo: { steady: 1 },
  },
  /** Active — the one interaction ring. It breathes while the planet is merely
   *  tappable and sits steady once hovered or selected (and on the opponent's
   *  acting planet): selection is the invite answered, not a different ring.
   *  Its colour is mist until a verb is determined for its planet and the verb's
   *  colour then (see `ringColor` in Chart.tsx) — never the planet's own hue,
   *  which the disc, glyph and halo already carry. Weight has to read against
   *  the ambient blooms (playtesters missed it at the middle rung), so it takes
   *  the heavy rung, shared with the aspect line under attention.
   *  Rejected: separate invite and select rings at different radii — they were
   *  already mutually exclusive (selecting clears the invite on every planet),
   *  so the second radius bought nothing and spent room the affliction arc
   *  needs. */
  interactionRing: { steady: 1, stroke: STROKE_HEAVY },
  /** Active — the corona on an acting planet: its verb, drawn as streamers.
   *  Colour alone wasn't enough to separate the two verbs, so they differ in
   *  silhouette as well, on the reference's own logic — a real corona is
   *  irregular and long-streamered at solar maximum, smooth and symmetric at
   *  minimum. Afflict flares: fewer rays, reaching past the halo, every other
   *  one short so the outline breaks up. Testify gathers: twice as many, half
   *  as far, even, hugging the rim.
   *
   *  The corona turns rather than breathes — `turn` and `spin` give the two
   *  verbs different periods and opposite directions, a channel that costs
   *  nothing. Symmetry is no obstacle to that: a wheel with evenly spaced
   *  spokes is plainly rotating, since motion is perceived directly rather than
   *  by comparing configurations.
   *
   *  `reach` is a radius but lives here rather than in viewbox.ts because the
   *  pair of them *is* the distinction — splitting the two verbs across files
   *  would hide the one thing worth reading. */
  corona: {
    Affliction: { rays: 12, reach: 78, flare: 0.55, stroke: STROKE_HEAVY, opacity: 0.85, cap: "butt", turn: "48s", spin: "normal" },
    Testimony: { rays: 24, reach: 54, flare: 1, stroke: STROKE_MEDIUM, opacity: 0.8, cap: "round", turn: "84s", spin: "reverse" },
  },
  /** Diagram — the affliction arc: a planet's Resolve at 1 point = 1°, drawn
   *  as a partial arc inside the interaction ring. Kind, not weight, keeps the
   *  two apart — data is an arc, interaction is a complete circle — so the arc
   *  can stay quiet and still never read as tappable. `track` is the whole
   *  ceiling (so arc length is durability, visible with no number);
   *  `remaining` is what the planet can still absorb; `diff` is the projected
   *  change to that span. */
  afflictionArc: {
    stroke: STROKE_EXTRA_HEAVY,
    trackOpacity: 0.3,
    // Full, matching the interaction ring's steady opacity. The arc is state and
    // the ring is affordance, so the arc should never be the dimmer of the two —
    // and since it is bone against the ring's mist, equal opacity leaves it the
    // brighter mark, which is the hierarchy we want. The track stays faint: it
    // is the spent span, and at full it would erase the boundary it exists to
    // show.
    remainingOpacity: 1,
    diffOpacity: 1,
  },
  /** Active — combust: colored flare ripple + delayed bone shockwave. */
  combust: {
    ripple: { opacity: 0.95, stroke: STROKE_HEAVY },
    shockwave: { opacity: 0.7, stroke: STROKE_MEDIUM },
  },

  /** Radial-gradient glow ramps (core → mid → transparent edge). */
  glow: {
    colorField: { core: 0.32, mid: 0.08 },
    halo: { core: 0.7, mid: 0.18 },
    valence: { core: 0.9, mid: 0.34 },
  },

  /** Word — affliction / projection badge pills (gold border on Void fill). */
  badge: {
    afflictionFill: 0.92,
    afflictionBorder: 0.55,
    projectionFill: 0.84,
    projectionBorder: 0.4,
    borderStroke: STROKE_LIGHT,
    signPrefixOpacity: 0.85,
    /** Combust warning — ember digits plus a blurred ember underlay whose
     *  opacity rides the shared --breath clock (motion.css); the pill border
     *  stays resting gold. */
    warningGlowStroke: 6,
  },
} as const;
