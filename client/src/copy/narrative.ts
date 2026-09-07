import { combustionCeiling, isCombusted } from "@/game/combust";
import { previewOption, type NarrativeContext, type Option, type Outcome, type Selection, type Target } from "@/game/narrative";
import type { Run } from "@/game/types";

const signed = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
const lightLabel = (delta: number) => `${delta < 0 ? "Lose" : "Gain"} ${Math.abs(delta)} Light`;
const effectLabel = (delta: number) => `${delta < 0 ? "Testify" : "Afflict"} ${Math.abs(delta)} on`;

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

function effectText(effect: Outcome, ctx: NarrativeContext, selection: Selection): string {
  if (effect.kind === "light") return lightLabel(effect.delta);
  const name = targetName(effect.target, ctx, selection);
  if (effect.kind === "uncombust") return `call back ${name} at half Resolve`;
  return `${effectLabel(effect.delta)} ${name}`;
}

/** Actual deltas, including clamps and combustion, come from the resolver. */
export function describeChanges(before: Run, after: Run, ctx: NarrativeContext): string {
  const parts: string[] = [];
  const light = after.light - before.light;
  const groups = new Map<string, string[]>();
  for (const p of ctx.unlocked) {
    const delta = after.state[p].affliction - before.state[p].affliction;
    if (!delta) continue;
    const wasDark = isCombusted(ctx.placements[p], before.state[p]);
    const isDark = isCombusted(ctx.placements[p], after.state[p]);
    if (wasDark && !isDark) {
      parts.push(`${p} returns with ${combustionCeiling(ctx.placements[p]) - after.state[p].affliction} Resolve remaining`);
    } else if (isDark) {
      parts.push(`${p} combusts (${signed(delta)} affliction)`);
    } else {
      const label = effectLabel(delta);
      const names = groups.get(label) ?? [];
      names.push(p);
      groups.set(label, names);
    }
  }
  for (const [label, names] of groups) parts.push(`${label} ${names.join(", ")}`);
  if (light) parts.push(lightLabel(light));
  return parts.join(" · ") || "No change.";
}

export function describeOption(run: Run, ctx: NarrativeContext, option: Option, selection: Selection = {}): string {
  const preview = previewOption(run, ctx, option, selection);
  if (preview.ok) return describeChanges(run, preview.success, ctx);
  return [
    ...option.result.effects.filter((e) => e.kind !== "light").map((e) => effectText(e, ctx, selection)),
    ...(option.cost ? [lightLabel(-option.cost)] : []),
    ...option.result.effects.filter((e) => e.kind === "light").map((e) => effectText(e, ctx, selection)),
  ].join(" · ") || "No change.";
}
