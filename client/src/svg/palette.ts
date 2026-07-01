import type { PlanetName } from "@/game/types";

export const NEUTRAL = {
  void: "#0B0A0F",
  smoke: "#2A2730",
  bone: "#E8E2D4",
  mist: "#9A95A0",
  gold: "#C9A96A",   // chart ring + tick accent
  goldHi: "#FFD24A", // ceremonial spiral / inspect ring
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

/** Action valence colors — afflict (amber) / testify (violet). Kept off the
 *  aspect red/green. Shared by the action buttons, the opponent's precommitted-
 *  verb label, and the projection badge. */
export const VALENCE_COLOR = {
  Affliction: "#E8913A",
  Testimony: "#9D86D9",
} as const;
