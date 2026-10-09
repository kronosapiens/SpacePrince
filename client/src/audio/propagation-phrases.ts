import { PLANETS } from "@/game/data";
import type { PlanetName, Polarity } from "@/game/types";
import { PLANET_DEGREE, strikeMidi } from "./pitches";

export const PHRASE_VARIANTS = ["Current order", "Thirds", "Arch", "Falling thirds"] as const;
export type PhraseVariant = typeof PHRASE_VARIANTS[number];
export const ACTION_PHRASES = {
  Testimony: "Thirds",
  Affliction: "Falling thirds",
  Necessity: "Arch",
} as const satisfies Record<Polarity | "Necessity", PhraseVariant>;

export interface PropagationNote {
  planet: PlanetName;
  midi: number;
  at: number;
}

/** Gallery audition: the initial hit and each selected neighbour sound once. */
export function propagationPhrase(
  ruler: PlanetName, source: PlanetName, recipients: readonly PlanetName[], variant: PhraseVariant,
): PropagationNote[] {
  const members = PLANETS.filter((planet) => planet !== source && recipients.includes(planet));
  const initial = strikeMidi(ruler, source);
  const upwardPitch = (planet: PlanetName) => initial + (strikeMidi(ruler, planet) - initial + 12) % 12;
  let order = members;
  if (variant === "Thirds" || variant === "Falling thirds") {
    const direction = variant === "Thirds" ? 1 : -1;
    // Multiplying the degree difference by four inverts steps of two modulo seven.
    const position = (planet: PlanetName) => (direction * (PLANET_DEGREE[planet] - PLANET_DEGREE[source]) * 4 + 28) % 7;
    order = [...members].sort((a, b) => position(a) - position(b));
  } else if (variant === "Arch") {
    const ascending = [...members].sort((a, b) => upwardPitch(a) - upwardPitch(b));
    const turn = Math.max(0, Math.floor((ascending.length - 1) / 2));
    order = [...ascending.slice(0, turn), ...ascending.slice(turn).reverse()];
  }
  return [source, ...order].map((planet, index) => {
    let midi = strikeMidi(ruler, planet);
    if (variant !== "Current order") {
      // Fold the cycle into one octave on the chosen side of the initial pitch.
      midi = upwardPitch(planet);
      if (variant === "Falling thirds" && planet !== source) midi -= 12;
    }
    return { planet, midi, at: index === 0 ? 0.2 : 1.03 + (index - 1) * 0.52 };
  });
}

const DEGREE_NAMES = ["D", "E", "F", "G", "A", "B", "C"];
const NATURAL_PITCHES = [2, 4, 5, 7, 9, 11, 0];
export function phraseNoteName({ planet, midi }: Pick<PropagationNote, "planet" | "midi">): string {
  const degree = PLANET_DEGREE[planet];
  const difference = midi % 12 - NATURAL_PITCHES[degree]!;
  const accidental = difference === 1 ? "♯" : difference === -1 ? "♭" : "";
  return `${DEGREE_NAMES[degree]}${accidental}${Math.floor(midi / 12) - 1}`;
}
