import { STROKE_HEAVY, STROKE_MEDIUM } from "@/svg/viewbox";

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
    activeStroke: 2.4,
  },

  /** Diagram — planet glyph disc + rim. Rim/ghost stroke scales with glyph
   *  radius: max(rimStrokeMin, glyphR * rimStrokeRatio). */
  planet: {
    discOpacity: 0.92,
    discCombustedOpacity: 0.4,
    rimOpacity: 0.9,
    rimStrokeRatio: 0.05,
    rimStrokeMin: 1,
  },
  /** Diagram — ghost (un-revealed) planet: dashed outline + faded glyph. */
  ghost: { outlineOpacity: 0.35, glyphOpacity: 0.4, dash: "2 4" },

  /** Active — the tappable invite: breathing halo + ring, both snapping to
   *  full on hover. The ring is the clickability signal and must read against
   *  the ambient blooms (playtesters missed it at medium weight), so it sits
   *  at the heavy end of the stroke scale with a high opacity floor. */
  invite: {
    halo: { rest: 0.35, hover: 1 },
    ring: { rest: 0.85, hover: 1, stroke: STROKE_HEAVY },
  },
  /** Active — the select / opponent-acting ring. */
  selectRing: { opacity: 1, stroke: STROKE_MEDIUM },
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
  },
} as const;
