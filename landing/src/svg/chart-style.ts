import { STROKE_HEAVY, STROKE_LIGHT, STROKE_MEDIUM } from "@/svg/viewbox";

/**
 * Every opacity / stroke-weight knob the landing chart draws with, gathered in
 * one place. Mirrors client/src/svg/chart-style.ts — same values, trimmed to the
 * elements a resting, hover-only chart renders; the client's file is the source
 * the numbers come from.
 *
 * Tuning note: the faint layers are deliberately kept above the threshold where
 * social-media video re-encoding (H.264/VP9 quantization on the near-black
 * ground) would crush them to solid black.
 */
export const CHART_STYLE = {
  /** Field — sacred-geometry ground (rotating hexagram + vesica). The hexagram
   *  is a small mark at the middle of the wheel; the vesica keeps its original
   *  radius — see the client's file for why the two halves differ. */
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

  /** Diagram — aspect web. One opacity everywhere; the active stroke (hover) is
   *  the only thing that emphasizes a line. */
  aspect: {
    opacity: 1,
    restStroke: STROKE_LIGHT,
    activeStroke: STROKE_HEAVY,
  },

  /** Diagram — planet glyph disc + rim. Rim stroke scales with glyph radius:
   *  max(rimStrokeMin, glyphR * rimStrokeRatio); the symbol scales as
   *  glyphR * symbolRatio. The ratio rose past its old 0.85 when the disc shrank
   *  to make room for the client's affliction arc — the symbol kept its size
   *  while the circle under it gave up radius. */
  planet: {
    discOpacity: 0.92,
    rimOpacity: 0.9,
    rimStrokeRatio: 0.05,
    rimStrokeMin: STROKE_LIGHT,
    symbolRatio: 1.2,
  },

  /** Active — the one interaction ring, and the halo under it. In the client the
   *  ring breathes while a planet is merely tappable and sits steady once it is
   *  hovered or selected; the landing chart only ever has the steady reading. Its
   *  colour is mist rather than the planet's own hue, which the disc, glyph and
   *  halo already carry. */
  interactionRing: { steady: 1, stroke: STROKE_HEAVY },
  invite: { halo: { steady: 1 } },

  /** Radial-gradient glow ramps (core → mid → transparent edge). */
  glow: {
    colorField: { core: 0.16, mid: 0.04 },
    halo: { core: 0.35, mid: 0.09 },
  },
} as const;
