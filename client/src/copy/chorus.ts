import sun from "../../../docs/research/chorus/sun.yaml";
import moon from "../../../docs/research/chorus/moon.yaml";
import mercury from "../../../docs/research/chorus/mercury.yaml";
import venus from "../../../docs/research/chorus/venus.yaml";
import mars from "../../../docs/research/chorus/mars.yaml";
import jupiter from "../../../docs/research/chorus/jupiter.yaml";
import saturn from "../../../docs/research/chorus/saturn.yaml";
import { HOUSES } from "@/data/houses";
import { encounterRuler } from "@/game/encounter";
import { pickWeighted } from "@/game/rng";
import type { EncounterState, PlanetName } from "@/game/types";

export interface ChorusPassage {
  text: string;
  author: string;
  source: string;
  translation?: string;
  source_url: string;
}

export const CHORUS: Record<PlanetName, ChorusPassage[]> = {
  Sun: sun, Moon: moon, Mercury: mercury, Venus: venus, Mars: mars, Jupiter: jupiter, Saturn: saturn,
};

export const CHORUS_COPY = {
  label: (planet: PlanetName) => `${planet} chorus`,
  continue: "Continue",
};

export function chorusRuler(encounter: EncounterState): PlanetName {
  return encounter.kind === "relational" ? encounterRuler(encounter) : HOUSES[encounter.house - 1]!.ruler;
}

/** Uniform independent selection; repeated passages are allowed. */
export function selectChorusPassage(planet: PlanetName, rng: () => number = Math.random): ChorusPassage {
  return pickWeighted(CHORUS[planet], rng);
}
