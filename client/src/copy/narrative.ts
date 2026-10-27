import { displayStat, STAT_LABEL } from "@/game/combat";
import { occupantLean, type NarrativeContext, type Occupant, type Option, type Outcome, type Selection, type Target } from "@/game/narrative";
import type { Polarity } from "@/game/types";

export interface EffectTextPart {
  text: string;
  kind?: Polarity | "Light";
}

const valence = (delta: number): Polarity => delta < 0 ? "Testimony" : "Affliction";
const lightParts = (delta: number): EffectTextPart[] => [
  { text: `${delta < 0 ? "Lose" : "Gain"} ` },
  { text: `${Math.abs(delta)} Light`, kind: "Light" },
];
const plainText = (parts: EffectTextPart[]) => parts.map((part) => part.text).join("");

function afflictionParts(delta: number, target: string): EffectTextPart[] {
  return [
    { text: `${delta < 0 ? "Testify" : "Afflict"} ${Math.abs(delta)}`, kind: valence(delta) },
    { text: ` on ${target}` },
  ];
}

function joinEffects(effects: EffectTextPart[][]): EffectTextPart[] {
  return effects.length
    ? effects.flatMap((parts, i) => i ? [{ text: " · " }, ...parts] : parts)
    : [{ text: "No change." }];
}

function targetName(target: Target, ctx: NarrativeContext, selection: Selection): string {
  switch (target) {
    case "chosen": return selection.chosen ?? "a chosen planet";
    case "joy": return ctx.joyPlanet ?? "the house's joy";
    case "ruler": return ctx.rulerPlanet;
    case "allUnlocked": return "each lit planet";
    case "mostAfflicted": return "the most afflicted lit planet";
    case "healthiest": return "the lit planet with the most Resolve remaining";
  }
}

type PlanetOutcome = Exclude<Outcome, { kind: "light" }>;

function planetParts(effect: PlanetOutcome, name: string, named: boolean): EffectTextPart[] {
  if (effect.kind === "uncombust") return [{ text: `call back ${name} at half Resolve` }];
  if (effect.kind === "affliction") return afflictionParts(effect.delta, name);
  // A gain on the planet the previous effect named reads as the same planet.
  return [{ text: `+${displayStat(effect.stat, effect.amount)} ${STAT_LABEL[effect.stat]}${named ? "" : ` on ${name}`}` }];
}

/** Authored amounts stay fixed; the chart preview shows actual changes. A
 *  zero affliction (an occupant's dignity can bring it there) goes unmentioned. */
export function describeOptionParts(ctx: NarrativeContext, option: Option, selection: Selection = {}): EffectTextPart[] {
  const planetEffects = option.result.effects.filter((e): e is PlanetOutcome =>
    e.kind !== "light" && !(e.kind === "affliction" && e.delta === 0));
  return joinEffects([
    ...planetEffects.map((e, i) =>
      planetParts(e, targetName(e.target, ctx, selection), planetEffects[i - 1]?.target === e.target)),
    ...(option.cost ? [lightParts(-option.cost)] : []),
    ...option.result.effects.flatMap((e) => e.kind === "light" ? [lightParts(e.delta)] : []),
  ]);
}

export function describeOption(ctx: NarrativeContext, option: Option, selection: Selection = {}): string {
  return plainText(describeOptionParts(ctx, option, selection));
}

const TERMS: Record<number, string> = { 1: "better", 0: "unchanged", [-1]: "worse" };

/** The planets in the house and how they change its terms (`withOccupants`). */
export function occupantLine(occupants: readonly Occupant[]): string | null {
  const names = occupants.map((o) => o.planet);
  if (!names.length) return null;
  const who = names.length === 1 ? `${names[0]} is` : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are`;
  return `${who} in this house: the terms are ${TERMS[occupantLean(occupants)]}.`;
}
