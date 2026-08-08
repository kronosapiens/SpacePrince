import type { PlanetName, PlanetPlacement, PlanetStats } from "./types";
import { ELEMENT_BUFFS, MODALITY_BUFFS } from "./data";
import { STAT_LABEL } from "./combat";

// Study-mode copy — the opt-in foothold for a player new to astrology
// (spec/design/SCREENS.md §3.6.1). Authored, never generated. These are study
// annotations, NOT chorus fragments: a fragment never explains, but a gloss may
// name the symbol plainly (spec/concept/PLANETS.md §1).

/** One grounded line per planet — its core astrological significations in a
 *  plain, textbook register (drawn from spec/concept/PLANETS.md archetypes).
 *
 *  Two lines in the panel, so keep each under ~68 characters: the gloss sits
 *  above a fixed table in a card whose width is set by that table, and a third
 *  line pushes everything below it down. */
export const PLANET_GLOSS: Record<PlanetName, string> = {
  Sun: "Identity and vitality — the self, the will, and the urge to lead.",
  Moon: "The emotional inner life — instinct, memory, comfort, and mood.",
  Mercury: "The thinking mind — reason, language, and the exchange of ideas.",
  Venus: "Love and harmony — beauty, pleasure, and what one values.",
  Mars: "Drive and assertion — energy, courage, desire, and the force to act.",
  Jupiter: "Expansion and fortune — growth, abundance, faith, and meaning.",
  Saturn: "Limit and structure — time, discipline, boundaries, and endurance.",
};

/** What the derivation table's columns mean. "Place" is spelled out here in
 *  full as placement. */
export const COLUMN_GLOSS: Record<"core" | "placement", string> = {
  core: "The planet's core nature — the same for every chart.",
  placement: "The planet's particular placement — effects differ by sign and sect.",
};

// Per-stat provenance copy — the astrology behind a single number, so a tap
// teaches which sign quality lifts a stat (MECHANICS.md §4: each element/
// modality "expresses" one stat). Composed, never hand-authored per combination.

const article = (s: string) => (/^[aeiou]/i.test(s) ? "an" : "a");

/** Prose for the per-stat drop-down: the planet's innate level and the sign
 *  qualities that lift it. The stat's name is the metric's name, so there is no
 *  "expressed as" translation left to state. */
export function describeStat(p: PlanetPlacement, key: keyof PlanetStats): string {
  const word = STAT_LABEL[key];
  const core = p.base[key];
  // Base stats live on the 12–48 lattice (MECHANICS §2).
  const coreQual = core >= 36 ? "strong" : core <= 12 ? "slight" : "modest";
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
  return parts.join(" ");
}
