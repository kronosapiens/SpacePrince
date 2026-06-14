import type { PlanetName } from "./types";

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

export interface ConceptGloss {
  label: string;
  blurb: string;
}

/** Plain-register explanations of the table's columns — shown one tap deeper
 *  than the table, since a player needs them roughly once. */
export const DERIVATION_GLOSS: Record<"core" | "placement", ConceptGloss> = {
  core: {
    label: "Core",
    blurb:
      "The planet's innate temperament — Mars strikes, the Moon mends, Saturn endures. The same in every chart.",
  },
  placement: {
    label: "Placement",
    blurb:
      "Where the planet sits — its sign's element and mode, and whether it's in sect — nudges each stat up.",
  },
};
