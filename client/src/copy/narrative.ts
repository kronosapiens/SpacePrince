import { combustionCeiling, isCombusted } from "@/game/combust";
import { previewOption, wagerOdds, type NarrativeContext, type Option, type Outcome, type Selection, type SelectionSlot, type Target } from "@/game/narrative";
import type { Run } from "@/game/types";

const signed = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;

function targetName(target: Target, ctx: NarrativeContext, selection: Selection): string {
  switch (target) {
    case "chosen": return selection.chosen ?? "a chosen planet";
    case "recipient": return selection.recipient ?? "another chosen planet";
    case "joy": return ctx.joyPlanet ?? "the house's joy";
    case "ruler": return ctx.rulerPlanet;
    case "allUnlocked": return "each lit planet";
    case "mostAfflicted": return "the most afflicted lit planet";
    case "healthiest": return "the lit planet with the most Resolve remaining";
  }
}

function effectText(effect: Outcome, ctx: NarrativeContext, selection: Selection): string {
  if (effect.kind === "light") return `${signed(effect.delta)} Light`;
  if (effect.kind === "transfer") return `move ${effect.amount} affliction from ${targetName("chosen", ctx, selection)} to ${targetName("recipient", ctx, selection)}`;
  const name = targetName(effect.target, ctx, selection);
  if (effect.kind === "combust") return `combust ${name}`;
  if (effect.kind === "uncombust") return `call back ${name} at half Resolve`;
  return effect.delta < 0 ? `relieve up to ${-effect.delta} affliction on ${name}` : `+${effect.delta} affliction on ${name}`;
}

/** Actual deltas, including clamps and combustion, come from the resolver. */
export function describeChanges(before: Run, after: Run, ctx: NarrativeContext): string {
  const parts: string[] = [];
  const light = after.light - before.light;
  if (light) parts.push(`${signed(light)} Light`);
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
      const label = delta < 0 ? `relieve ${-delta} affliction on` : `+${delta} affliction on`;
      const names = groups.get(label) ?? [];
      names.push(p);
      groups.set(label, names);
    }
  }
  for (const [label, names] of groups) parts.push(`${label} ${names.join(", ")}`);
  return parts.join(" · ") || "No change.";
}

export function describeOption(run: Run, ctx: NarrativeContext, option: Option, selection: Selection = {}): string {
  const preview = previewOption(run, ctx, option, selection);
  const nominal = (effects: Outcome[]) => [
    ...(option.cost ? [`Pay ${option.cost} Light`] : []),
    ...effects.map((e) => effectText(e, ctx, selection)),
  ].join(" · ") || "No change.";
  const success = preview.ok ? describeChanges(run, preview.success, ctx) : nominal(option.result.effects);
  if (!option.failure) return success;
  const odds = wagerOdds(ctx);
  const failure = preview.ok ? describeChanges(run, preview.failure!, ctx) : nominal(option.failure.effects);
  const stake = option.cost ? `Stake ${option.cost} Light · ` : "";
  return `${stake}Fortune (${odds?.planet ?? "unavailable"}): ${odds?.sixtieths ?? 0}/60 · Win: ${success} · Miss: ${failure}`;
}

export function selectionLabel(option: Option, slot: SelectionSlot): string {
  const effects = [...option.result.effects, ...(option.failure?.effects ?? [])];
  if (effects.some((e) => e.kind === "transfer")) return slot === "chosen" ? "Relieve" : "Carry the burden";
  const effect = effects.find((e) => "target" in e && e.target === slot);
  if (effect?.kind === "uncombust") return "Call back";
  if (effect?.kind === "combust") return "Sacrifice";
  return effect?.kind === "affliction" && effect.delta < 0 ? "Restore" : "Bear the cost";
}
