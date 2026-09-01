import type { PlanetName } from "@/game/types";

// Note: style/*.css restates some of these hexes (CSS can't import TS
// constants). If palette iteration starts crossing that boundary, migrate the
// CSS to :root custom properties referencing these values once.
export const NEUTRAL = {
  void: "#0B0A0F",
  smoke: "#2A2730",
  bone: "#E8E2D4",
  mist: "#9A95A0",
  gold: "#C9A96A",   // chart ring + tick accent
  goldHi: "#FFD24A", // ceremonial spiral / inspect ring
  char: "#3B2F2F",   // combusted planet disc — burnt-out, off the live palette
} as const;

/**
 * Saturated, alchemical planetary palette per Claude Design v2.
 * The hue family per planet is meant to compose into an af Klint rainbow corona
 * when seven planets are inscribed in one chart wheel.
 */
export const PLANET_PRIMARY: Record<PlanetName, string> = {
  Sun: "#FFD24A",
  Moon: "#B0C4DE",
  Mercury: "#9EC9A8",
  Venus: "#E8A0BF",
  Mars: "#E04A3F",
  Jupiter: "#5878C8",
  Saturn: "#8A6FA0",
};

export const PLANET_SECONDARY: Record<PlanetName, string> = {
  Sun: "#FFF5CC",
  Moon: "#E0EAF5",
  Mercury: "#D4E8C7",
  Venus: "#F5C9D8",
  Mars: "#FF8E5A",
  Jupiter: "#9EB6E8",
  Saturn: "#C5A8D8",
};

/** Aspect-line colors: green for harmonious, red for tense (astrological
 *  convention). The heal/harm valence uses amber/violet so the two read apart. */
export const ASPECT_COLOR = {
  harmony: "#8FBC8F", // trine, sextile, conjunction
  tension: "#E15555", // square, opposition — luminant red, not deep-saturated, so
                      // thin lines survive video chroma subsampling (a dark red artifacts)
} as const;

/** Brightened harmony/tension tints for the propagation pulse's traveling
 *  head (PropagationLine) — pops out of the dim static web while keeping the
 *  aspect's mood family. */
export const ASPECT_HEAD_COLOR = {
  harmony: "#E4FAD6",
  tension: "#FFA89C",
} as const;

/** Action valence colors — afflict (amber) / testify (violet). Kept off the
 *  aspect red/green. Shared by the action buttons, the opponent's precommitted-
 *  verb label, and the projection badge. */
export const VALENCE_COLOR = {
  Affliction: "#E8913A",
  Testimony: "#9D86D9",
} as const;

/** Brightened valence tints for the projection diff on an affliction arc — the
 *  same move `ASPECT_HEAD_COLOR` makes above, and for the same reason. The diff
 *  is short by construction (1 point = 1°) and shares the bone arc's radius and
 *  width, so at the base valence colors it reads as one more segment of the
 *  ring; lifting lightness while holding the hue makes it the lit one. Used
 *  only here — the buttons, the announce line, the ring and the corona keep the
 *  base pair, so the family still reads as one. */
export const ARC_DIFF_COLOR = {
  Affliction: "#F9B176",
  Testimony: "#B9A6F2",
} as const;

/** Combust warning — combustion is on the table for this planet this turn.
 *  A luminant ember red: its own channel, kept off the valence amber (harm in
 *  flight), the luminant aspect red (edge language), and Mars vermillion
 *  (identity), which weight and kind separate it from besides.
 *
 *  Luminance is the constraint, not saturation. The mark rides the affliction
 *  arc, whose whole vocabulary is bright = still yours, dark = already spent —
 *  so a dark ember (this was #B03636) reads as *more spent*, receding into the
 *  track exactly where it should alarm. It has to sit in the same value band as
 *  the amber and violet it escalates from (L* ~60-68), never below them. */
export const COMBUST_WARNING = "#FF5C33";
