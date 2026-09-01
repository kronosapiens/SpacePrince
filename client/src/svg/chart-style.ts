import { STROKE_EXTRA_HEAVY, STROKE_HEAVY, STROKE_LIGHT, STROKE_MEDIUM } from "@/svg/viewbox";

/**
 * Every opacity / stroke-weight knob the Chart draws with, gathered in one
 * place so a brightness pass edits here instead of hunting through ~900 lines
 * of JSX. Grouped by element; values are chart viewBox units (1000×1000).
 * Elements that change on interaction carry rest/active (or rest/hover) pairs.
 * Every stroke is a rung of the four-step schedule in viewbox.ts — ground,
 * structure, under attention, the affliction arc — never a loose number.
 *
 * Geometry lives in viewbox.ts, with one exception: the substrate's radii sit
 * here, beside the rest of that figure's knobs, because nothing else in the
 * chart measures against them.
 *
 * Tuning note: the faint layers are deliberately kept above the threshold where
 * social-media video re-encoding (H.264/VP9 quantization on the near-black
 * ground) would crush them to solid black. The run map's sibling scale is the
 * TIER constant in MapDiagram.tsx; the aspect-propagation pulse is PropagationLine.tsx.
 */
export const CHART_STYLE = {
  /** Field — sacred-geometry ground (rotating hexagram + vesica). The two halves
   *  sit at different scales on purpose, so the figure reads as a wide soft echo
   *  of the inner ring with a tight rosette inside it.
   *
   *  The hexagram is the half that had to come in. It began at 360, which put
   *  its twelve points through the one band where disc, arc, interaction ring
   *  and aspect endpoints already compete — and it is straight chords at the
   *  same scale as the aspect web, so only opacity told the two apart. It is
   *  also the half that moves: a vertex at that radius travels the whole
   *  circumference every turn, and motion at the edge of a reading zone is what
   *  pulls the eye. Where it lands is a judgement, not a derivation: the vesica
   *  offers no landmark below 220 (`vesicaR - vesicaOffset`, its closest
   *  approach to centre), so past that the star is simply small enough to read
   *  as a mark at the middle of the wheel rather than as structure spanning it.
   *  It clears the planet band with room to spare — that band starts around 270,
   *  the tightest rim cluster sitting at 308 with its interaction ring reaching
   *  37.8 at the peak of its breath. Stacked signs place planets inward, and at
   *  this size the second tier (236–246) clears the star where it did not
   *  before; the third and fourth (176, 162, 98) still sit inside it, which is
   *  accepted — those appear only at 4+ in one sign, and a planet that deep is
   *  in open space anyway.
   *
   *  The vesica keeps its original radius. Nothing else in the chart is drawn as
   *  arcs, so it can't be mistaken for the aspect web, and offset only 60 from
   *  centre it is nearly rotation-invariant — a full turn moves each arc ~120
   *  units, against the hexagram vertex's ~2,260. It is the quiet half, and it
   *  keeps the band between the rosette and the inner ring from going flat.
   *
   *  Rejected: collapsing both together, which left that band dead. Rejected:
   *  one star vertex per sign tick, which is what the hexagram's full radius
   *  bought — the rotation already spends it, the alignment holding for an
   *  instant every ten seconds and false through the rest of the turn. */
  substrate: {
    opacity: 0.16,
    stroke: STROKE_LIGHT,
    hexagramR: 180,
    vesicaR: 280,
    vesicaOffset: 60,
  },

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
  /** Active — what is arriving at this chart: the same corona, at the wheel's
   *  centre, around the magnitude rather than around a planet. The number sits
   *  in the hole the corona's rays leave inside CORONA_INNER_R, and fits the
   *  interaction ring at every value the game can produce — stats cap at
   *  48 + 12 + 12, so it is never more than two digits. */
  incoming: {
    fontSize: 36,
    opacity: 0.9,
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
    // Down from full, and unconditionally — the span reads the same whether or
    // not anything is being previewed, because a mark that changes brightness
    // with hover reads as a second piece of state rather than as itself.
    //
    // Full was chosen to match the interaction ring's steady opacity, on the
    // reasoning that the arc is state and the ring is affordance, so the arc
    // should never be the dimmer of the two. That held while they were the only
    // two marks in the band. The diff makes three, and it is the one the eye has
    // to reach first while a blow is in flight, so the bone gives up a little
    // headroom for it. Still well clear of the track, which stays faint because
    // it is the spent span and at full would erase the boundary it exists to
    // show.
    remainingOpacity: 0.8,
    diffOpacity: 1,
    /** The diff is the one mark that says what a blow will do, and it is short
     *  by construction — 1 point = 1°, so a 12-point blow is 12° of a radius-30
     *  arc, about 6 units of line. It cannot win on length against a lit aspect
     *  that crosses the whole wheel, so it wins on light: the same drop-shadow
     *  the interaction ring carries, in the diff's own colour. Kept well under
     *  that ring's 8, since the diff already has the brighter tint under it and
     *  the two together tipped into a smear. */
    diffGlow: 3,
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
