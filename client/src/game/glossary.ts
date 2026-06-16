import type { PlanetName, PlanetPlacement, PlanetStats } from "./types";
import { ELEMENT_BUFFS, MODALITY_BUFFS } from "./data";

// Study-mode copy — the opt-in foothold for a player new to astrology
// (spec/design/SCREENS.md §3.6.1). Authored, never generated. These are study
// annotations, NOT chorus fragments: a fragment never explains, but a gloss may
// name the symbol plainly (spec/concept/PLANETS.md §1).

/** One evocative line per planet — what it is *about*, in its own register. */
export const PLANET_GLOSS: Record<PlanetName, string> = {
  Sun: "The will to shine — vitality, command, the self that takes the throne.",
  Moon: "The tide within — feeling, refuge, the body that remembers.",
  Mercury: "The quick mind — speech, exchange, the messenger who slips between.",
  Venus: "The pull toward — love, beauty, the things we draw close.",
  Mars: "The drive to act — to cut, to assert, to take the field.",
  Jupiter: "The open hand — fortune, faith, the room to grow.",
  Saturn: "The hard line — limit, time, the weight that endures.",
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

/** Prose for the per-stat drop-down: the planet's innate level, then — naming
 *  only the sign qualities that actually lift this stat — the placement buff. */
export function describeStat(p: PlanetPlacement, key: keyof PlanetStats): string {
  const word = STAT_WORD[key];
  const core = p.base[key];
  const coreQual = core >= 6 ? "strong" : core <= 2 ? "slight" : "modest";
  const parts = [`${p.planet}'s ${core} ${word} is ${coreQual} by nature.`];

  const el = ELEMENT_BUFFS[p.element][key];
  const mod = MODALITY_BUFFS[p.modality][key];
  const sect =
    key === "luck" ? p.buffs.luck - ELEMENT_BUFFS[p.element].luck - MODALITY_BUFFS[p.modality].luck : 0;

  if (el + mod > 0) {
    // Name only the contributing qualities (modality before element, the way
    // signs are spoken — "a Cardinal Fire sign").
    const factors = [mod ? p.modality : "", el ? p.element : ""].filter(Boolean).join(" ");
    parts.push(`${p.sign}, ${article(factors)} ${factors} sign, adds ${el + mod}.`);
  }
  if (sect > 0) {
    parts.push(`In sect, it adds ${sect}.`);
  }
  return parts.join(" ");
}
