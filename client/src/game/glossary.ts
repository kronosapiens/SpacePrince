import type { AspectType, PlanetName, PlanetPlacement, PlanetStats } from "./types";
import { ELEMENT_BUFFS, MODALITY_BUFFS } from "./data";

// Study-mode copy — the opt-in foothold for a player new to astrology
// (spec/design/SCREENS.md §3.6.1). Authored, never generated. These are study
// annotations, NOT chorus fragments: a fragment never explains, but a gloss may
// name the symbol plainly (spec/concept/PLANETS.md §1).

/** One grounded line per planet — its core astrological significations in a
 *  plain, textbook register (drawn from spec/concept/PLANETS.md archetypes). */
export const PLANET_GLOSS: Record<PlanetName, string> = {
  Sun: "Identity and vitality — the self, the will, and the urge to lead.",
  Moon: "The emotional inner life — instinct, memory, comfort, and changing moods.",
  Mercury: "The thinking mind — reason, language, and the exchange of ideas.",
  Venus: "Love and harmony — beauty, pleasure, relationship, and what one values.",
  Mars: "Drive and assertion — energy, courage, desire, and the force to act.",
  Jupiter: "Expansion and fortune — growth, abundance, faith, and the search for meaning.",
  Saturn: "Limit and structure — time, discipline, boundaries, and endurance.",
};

/** What the derivation table's columns mean. "Place" is spelled out here in
 *  full as placement. */
export const COLUMN_GLOSS: Record<"core" | "placement", string> = {
  core: "The planet's core nature — the same for every chart.",
  placement: "The planet's particular placement — effects differ by sign and sect.",
};

/** One plain line per aspect — what the angle is and what crosses it in play
 *  (MECHANICS.md §9: trines/sextiles carry, squares/oppositions invert). */
export const ASPECT_GLOSS: Record<Exclude<AspectType, "None">, string> = {
  Conjunction: "Standing in the same sign — effects pass between the two at full strength.",
  Sextile: "Two signs apart, an easy angle — effects pass at half strength, unaltered.",
  Trine: "Four signs apart, a flowing angle — effects pass at half strength, unaltered.",
  Square: "Three signs apart, a hard angle — effects pass at half strength and invert: harm crosses as healing, healing as harm.",
  Opposition: "Faced across the wheel — effects pass at full strength, inverted.",
};

// Per-stat provenance copy — the astrology behind a single number, so a tap
// teaches which sign quality lifts a stat (MECHANICS.md §4: each element/
// modality "expresses" one stat). Composed, never hand-authored per combination.
const STAT_WORD: Record<keyof PlanetStats, string> = {
  damage: "damage",
  healing: "healing",
  durability: "durability",
  luck: "luck",
};

const article = (s: string) => (/^[aeiou]/i.test(s) ? "an" : "a");

// The combat metric each stat surfaces as, in the panel's own labels — closes
// the blurb with a plain "Expressed as …".
const STAT_METRIC: Record<keyof PlanetStats, string> = {
  damage: "Afflict",
  healing: "Testify",
  durability: "Resolve",
  luck: "Crit",
};

/** Prose for the per-stat drop-down: the planet's innate level, the sign
 *  qualities that lift this stat, and the combat metric the stat drives. */
export function describeStat(p: PlanetPlacement, key: keyof PlanetStats): string {
  const word = STAT_WORD[key];
  const core = p.base[key];
  const coreQual = core >= 6 ? "strong" : core <= 2 ? "slight" : "modest";
  // Qualitative only — the numbers sit in the table right above this prose.
  const parts = [`${p.planet}'s ${word} is ${coreQual} by nature.`];

  const el = ELEMENT_BUFFS[p.element][key];
  const mod = MODALITY_BUFFS[p.modality][key];
  const sect =
    key === "luck" ? p.buffs.luck - ELEMENT_BUFFS[p.element].luck - MODALITY_BUFFS[p.modality].luck : 0;

  if (el + mod > 0) {
    // Name only the contributing qualities (modality before element, the way
    // signs are spoken — "a Cardinal Fire sign").
    const factors = [mod ? p.modality : "", el ? p.element : ""].filter(Boolean).join(" ");
    parts.push(`${p.sign}, ${article(factors)} ${factors} sign, lifts it.`);
  }
  if (sect > 0) {
    parts.push(el + mod > 0 ? "Sect lifts it further." : "Sect lifts it.");
  }
  parts.push(`Expressed as ${STAT_METRIC[key]}.`);
  return parts.join(" ");
}
