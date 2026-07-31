import { STROKE_HEAVY } from "@/svg/viewbox";

/**
 * Every opacity / stroke-weight knob the Chart draws with, gathered in one
 * place so a brightness pass edits here instead of hunting through ~900 lines
 * of JSX. Grouped by element; values are chart viewBox units (1000×1000).
 * Elements that change on interaction carry rest/active (or rest/hover) pairs.
 *
 * Tuning note: the faint layers are deliberately kept above the threshold where
 * social-media video re-encoding (H.264/VP9 quantization on the near-black
 * ground) would crush them to solid black. The run map's sibling scale is the
 * TIER constant in MapDiagram.tsx; the aspect-propagation pulse is PropagationLine.tsx.
 */
export const CHART_STYLE = {
  /** Field — sacred-geometry ground (rotating hexagram + vesica). */
  substrate: { opacity: 0.16, stroke: 0.8 },

  /** Diagram — structural rings of the wheel. */
  ring: {
    outer: { opacity: 0.55, stroke: 1.5 },
    inner: { opacity: 0.45, stroke: 1 },
  },
  /** Diagram — the twelve sign-division ticks. */
  tick: { opacity: 0.85, stroke: 2.5 },
  /** Word — sign name + glyph labels on the outer band. */
  signLabel: { opacity: 0.7 },

  /** Diagram — aspect web. One opacity across every screen; the active stroke
   *  (hover / select / propagation) is the only thing that emphasizes a line, so
   *  there's no per-screen "resting brightness" to reason about. Combat reads the
   *  web to plan propagation, so it wants full clarity, same as the Title. */
  aspect: {
    opacity: 1,
    restStroke: 0.9,
    // Heavy, matching the propagation pulse (PropagationLine.tsx): a line
    // under attention is one weight everywhere. Anything lighter reads too
    // close to the thickened resting web.
    activeStroke: STROKE_HEAVY,
  },

  /** Diagram — planet glyph disc + rim. Rim/ghost stroke scales with glyph
   *  radius: max(rimStrokeMin, glyphR * rimStrokeRatio); the symbol scales as
   *  glyphR * symbolRatio. The symbol ratio rose when the disc shrank to make
   *  room for the affliction arc, so the symbol itself stayed roughly the size
   *  it had always been — the disc is what gave up space, not the reading. */
  planet: {
    discOpacity: 0.92,
    discCombustedOpacity: 0.4,
    rimOpacity: 0.9,
    rimStrokeRatio: 0.05,
    rimStrokeMin: 1,
    symbolRatio: 1.08,
  },
  /** Diagram — ghost (un-revealed) planet: dashed outline + faded glyph. */
  ghost: { outlineOpacity: 0.35, glyphOpacity: 0.4, dash: "2 4" },

  /** Active — the tappable invite's halo, breathing on the shared --breath
   *  clock in motion.css (one phase for every invite on every surface) and
   *  snapping to full when the planet is hovered or selected. */
  invite: {
    halo: { steady: 1 },
  },
  /** Active — the one interaction ring, in the planet's own color. It breathes
   *  while the planet is merely tappable and sits steady once hovered or
   *  selected (and on the opponent's acting planet): selection is the invite
   *  answered, not a different ring. It's the clickability signal and must read
   *  against the ambient blooms (playtesters missed it at medium weight), so it
   *  sits at the heavy end of the stroke scale.
   *  Rejected: separate invite and select rings at different radii — they were
   *  already mutually exclusive (selecting clears the invite on every planet),
   *  so the second radius bought nothing and spent room the affliction arc
   *  needs. */
  interactionRing: { steady: 1, stroke: STROKE_HEAVY },
  /** Diagram — the affliction arc: a planet's Resolve at 1 point = 1°, drawn
   *  as a partial arc inside the interaction ring. Kind, not weight, keeps the
   *  two apart — data is an arc, interaction is a complete circle — so the arc
   *  can stay quiet and still never read as tappable. `track` is the whole
   *  ceiling (so arc length is durability, visible with no number);
   *  `remaining` is what the planet can still absorb; `diff` is the projected
   *  change to that span. */
  afflictionArc: {
    stroke: 3.5,
    trackOpacity: 0.3,
    remainingOpacity: 0.85,
    diffOpacity: 0.95,
  },
  /** Active — combust: colored flare ripple + delayed bone shockwave. */
  combust: {
    ripple: { opacity: 0.95, stroke: 2.5 },
    shockwave: { opacity: 0.7, stroke: 1.5 },
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
    borderStroke: 1,
    signPrefixOpacity: 0.85,
    /** Combust warning — ember digits plus a blurred ember underlay whose
     *  opacity rides the shared --breath clock (motion.css); the pill border
     *  stays resting gold. */
    warningGlowStroke: 6,
  },
} as const;
