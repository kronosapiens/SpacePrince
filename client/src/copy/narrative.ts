import { combustionCeiling, isCombusted } from "@/game/combust";
import { previewOption, type NarrativeContext, type Option, type Outcome, type Selection, type Target } from "@/game/narrative";
import type { Polarity, Run } from "@/game/types";

export interface EffectTextPart {
  text: string;
  kind?: Polarity | "Light";
}

const signed = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
const valence = (delta: number): Polarity => delta < 0 ? "Testimony" : "Affliction";
const lightPart = (delta: number): EffectTextPart => ({
  text: `${delta < 0 ? "Lose" : "Gain"} ${Math.abs(delta)} Light`, kind: "Light",
});
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
  if (effect.kind === "light") return [lightPart(effect.delta)];
  const name = targetName(effect.target, ctx, selection);
  if (effect.kind === "uncombust") return [{ text: `call back ${name} at half Resolve` }];
  return afflictionParts(effect.delta, name);
}

/** Actual deltas, including clamps and combustion, come from the resolver. */
function changeParts(before: Run, after: Run, ctx: NarrativeContext): EffectTextPart[] {
  const effects: EffectTextPart[][] = [];
  const light = after.light - before.light;
  const groups = new Map<number, string[]>();
  for (const p of ctx.unlocked) {
    const delta = after.state[p].affliction - before.state[p].affliction;
    if (!delta) continue;
    const wasDark = isCombusted(ctx.placements[p], before.state[p]);
    const isDark = isCombusted(ctx.placements[p], after.state[p]);
    if (wasDark && !isDark) {
      effects.push([{ text: `${p} returns with ${combustionCeiling(ctx.placements[p]) - after.state[p].affliction} Resolve remaining` }]);
    } else if (isDark) {
      effects.push([
        { text: `${p} combusts (` },
        { text: `${signed(delta)} affliction`, kind: valence(delta) },
        { text: ")" },
      ]);
    } else {
      const names = groups.get(delta) ?? [];
      names.push(p);
      groups.set(delta, names);
    }
  }
  for (const [delta, names] of groups) effects.push(afflictionParts(delta, names.join(", ")));
  if (light) effects.push([lightPart(light)]);
  return joinEffects(effects);
}

export function describeChanges(before: Run, after: Run, ctx: NarrativeContext): string {
  return plainText(changeParts(before, after, ctx));
}

/** Semantic spans let the view emphasize mechanics while targets stay neutral. */
export function describeOptionParts(run: Run, ctx: NarrativeContext, option: Option, selection: Selection = {}): EffectTextPart[] {
  const preview = previewOption(run, ctx, option, selection);
  if (preview.ok) return changeParts(run, preview.success, ctx);
  return joinEffects([
    ...option.result.effects.filter((e) => e.kind !== "light").map((e) => effectParts(e, ctx, selection)),
    ...(option.cost ? [[lightPart(-option.cost)]] : []),
    ...option.result.effects.filter((e) => e.kind === "light").map((e) => effectParts(e, ctx, selection)),
  ]);
}

export function describeOption(run: Run, ctx: NarrativeContext, option: Option, selection: Selection = {}): string {
  return plainText(describeOptionParts(run, ctx, option, selection));
}
