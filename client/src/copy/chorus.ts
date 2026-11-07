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
import type { ChorusPassage, EncounterState, PlanetName } from "@/game/types";

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

/** Uniform independent selection; snapshot only the fields shown by the card. */
export function selectChorusPassage(planet: PlanetName, rng: () => number): ChorusPassage {
  const { text, author, source, translation, source_url } = pickWeighted(CHORUS[planet], rng);
  return { text, author, source, ...(translation ? { translation } : {}), source_url };
}
