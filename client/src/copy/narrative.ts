import type { NarrativeContext, Option, Outcome, Selection, Target } from "@/game/narrative";
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

function effectParts(effect: Outcome, ctx: NarrativeContext, selection: Selection): EffectTextPart[] {
  if (effect.kind === "light") return lightParts(effect.delta);
  const name = targetName(effect.target, ctx, selection);
  if (effect.kind === "uncombust") return [{ text: `call back ${name} at half Resolve` }];
  return afflictionParts(effect.delta, name);
}

/** Authored amounts stay fixed; the chart preview shows actual changes. */
export function describeOptionParts(ctx: NarrativeContext, option: Option, selection: Selection = {}): EffectTextPart[] {
  return joinEffects([
    ...option.result.effects.filter((e) => e.kind !== "light").map((e) => effectParts(e, ctx, selection)),
    ...(option.cost ? [lightParts(-option.cost)] : []),
    ...option.result.effects.filter((e) => e.kind === "light").map((e) => effectParts(e, ctx, selection)),
  ]);
}

export function describeOption(ctx: NarrativeContext, option: Option, selection: Selection = {}): string {
  return plainText(describeOptionParts(ctx, option, selection));
}
