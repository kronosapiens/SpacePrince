import type { PlanetName } from "@/game/types";

/** What is fixed for a whole chart-to-chart encounter and read under the
 *  wheels, one of each per ruler. The opening says what the Other seeks from
 *  the exchange. It never says how they arrive or what they will do, and it
 *  leaves the player's response unwritten, so it stays true whichever way the
 *  turns go. */
export const ENCOUNTER_OPENINGS: Record<PlanetName, string> = {
  Moon: "They want to see you at your most vulnerable.",
  Mercury: "They want an answer they could not give themselves.",
  Venus: "They are weary and want to be eased.",
  Sun: "They want to see you at your strongest.",
  Mars: "They want their strength tested.",
  Jupiter: "They want to be met as they are.",
  Saturn: "They want to be pressed past their limit.",
};

/** The line under the opening: how Light is generated under that ruler
 *  (`RULER_RULES` in `game/score.ts`). `lead` reads in the neutral colour and
 *  `rule` in the ruler's, closed by a full stop; the guide quotes `rule` alone. */
export const ENCOUNTER_RULES: Record<PlanetName, { lead: string; rule: string }> = {
  Moon:    { lead: "Gain Light through", rule: "your planet with the least remaining Resolve, doubled" },
  Mercury: { lead: "Gain Light from",    rule: "effects contrary to the Other" },
  Venus:   { lead: "Gain Light from",    rule: "tension eased in the Other" },
  Sun:     { lead: "Gain Light through", rule: "your planet with the most remaining Resolve, doubled" },
  Mars:    { lead: "Gain Light from",    rule: "tension created in the Other" },
  Jupiter: { lead: "Gain Light from",    rule: "effects in accord with the Other" },
  Saturn:  { lead: "Gain Light from",    rule: "planets going dark on the Other" },
};
