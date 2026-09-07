import type { Mood } from "@/data/chorus";
import { HOUSES } from "@/data/houses";
import { cloneSideState } from "./chart";
import { fortuneChance, fortuneSixtieths } from "./combat";
import { combustionCeiling, isCombusted, newlyCombusted, uncombust } from "./combust";
import { unlockedPlanets } from "./unlocks";
import type { PlanetName, Prince, Run } from "./types";

export type SelectionSlot = "chosen" | "recipient";
export type Selection = Partial<Record<SelectionSlot, PlanetName>>;
export type Target = SelectionSlot | "allUnlocked" | "mostAfflicted" | "healthiest" | "joy" | "ruler";
export type Outcome =
  | { kind: "affliction"; target: Target; delta: number }
  | { kind: "combust"; target: Target }
  | { kind: "uncombust"; target: Target }
  | { kind: "transfer"; amount: number }
  | { kind: "light"; delta: number };

export interface Consequence {
  text: string;
  effects: Outcome[];
}

export interface Option {
  id: string;
  text: string;
  visibleIf?: (ctx: NarrativeContext) => boolean;
  /** A purchase is paid in full before either result; ordinary losses use light effects. */
  cost?: number;
  result: Consequence;
  /** Presence makes this a single Fortune wager, with result as its success. */
  failure?: Consequence;
}

export interface NarrativeScenario {
  scenarioId: string;
  house: number;
  text: string;
  fragmentMood?: Mood;
  options: Option[];
}

export interface NarrativeContext {
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
  unlocked: PlanetName[];
  perPlanetState: Run["state"];
  placements: Prince["chart"]["planets"];
}

export function buildNarrativeContext(input: {
  prince: Prince;
  run: Run;
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
  unlocked: PlanetName[];
}): NarrativeContext {
  const { prince, run, joyPlanet, rulerPlanet, unlocked } = input;
  return { joyPlanet, rulerPlanet, unlocked, placements: prince.chart.planets, perPlanetState: run.state };
}

const strong = (ctx: NarrativeContext, p: PlanetName) =>
  ["Domicile", "Exaltation"].includes(ctx.placements[p].dignity);
const combusted = (ctx: NarrativeContext, p: PlanetName) =>
  isCombusted(ctx.placements[p], ctx.perPlanetState[p]);

export const joyPresent = (ctx: NarrativeContext): boolean =>
  !!ctx.joyPlanet && ctx.unlocked.includes(ctx.joyPlanet) &&
  !combusted(ctx, ctx.joyPlanet) && ctx.perPlanetState[ctx.joyPlanet].affliction < 96;
export const joyStrong = (ctx: NarrativeContext): boolean =>
  joyPresent(ctx) && strong(ctx, ctx.joyPlanet!);
export const rulerStrong = (ctx: NarrativeContext): boolean =>
  ctx.unlocked.includes(ctx.rulerPlanet) && !combusted(ctx, ctx.rulerPlanet) && strong(ctx, ctx.rulerPlanet);
export const anyCombusted = (ctx: NarrativeContext): boolean =>
  ctx.unlocked.some((p) => combusted(ctx, p));

/** Fortune never comes from a locked or extinguished planet. */
export function conditioningPlanet(ctx: NarrativeContext): PlanetName | null {
  const lit = ctx.unlocked.filter((p) => !combusted(ctx, p));
  return [ctx.joyPlanet, ctx.rulerPlanet, ...lit].find((p) => p && lit.includes(p)) ?? null;
}

export function wagerOdds(ctx: NarrativeContext): { planet: PlanetName; sixtieths: number; chance: number } | null {
  const planet = conditioningPlanet(ctx);
  if (!planet) return null;
  const { base, buffs } = ctx.placements[planet];
  const luck = base.luck + buffs.luck;
  return { planet, sixtieths: fortuneSixtieths(luck), chance: fortuneChance(luck) };
}

/** All roles bind against the state before the choice, never a partially applied result. */
export function resolveTargets(target: Target, ctx: NarrativeContext, selection: Selection = {}): PlanetName[] {
  const lit = ctx.unlocked.filter((p) => !combusted(ctx, p));
  const affliction = (p: PlanetName) => ctx.perPlanetState[p].affliction;
  const margin = (p: PlanetName) => combustionCeiling(ctx.placements[p]) - affliction(p);
  switch (target) {
    case "chosen": case "recipient": {
      const p = selection[target];
      return p && ctx.unlocked.includes(p) ? [p] : [];
    }
    case "allUnlocked": return lit;
    case "mostAfflicted": return lit.length ? [lit.reduce((a, b) => affliction(b) > affliction(a) ? b : a)] : [];
    case "healthiest": return lit.length ? [lit.reduce((a, b) => margin(b) > margin(a) ? b : a)] : [];
    case "joy": return ctx.joyPlanet && lit.includes(ctx.joyPlanet) ? [ctx.joyPlanet] : [];
    case "ruler": return lit.includes(ctx.rulerPlanet) ? [ctx.rulerPlanet] : [];
  }
}

export function selectionSlots(option: Option): SelectionSlot[] {
  const slots = new Set<SelectionSlot>();
  for (const effect of [...option.result.effects, ...(option.failure?.effects ?? [])]) {
    if (effect.kind === "transfer") { slots.add("chosen"); slots.add("recipient"); }
    else if ("target" in effect && (effect.target === "chosen" || effect.target === "recipient")) slots.add(effect.target);
  }
  return ["chosen", "recipient"].filter((s) => slots.has(s as SelectionSlot)) as SelectionSlot[];
}

export type AppliedOutcome = { ok: true; run: Run } | { ok: false; reason: string };
const invalid = (reason: string): AppliedOutcome => ({ ok: false, reason });

/** Atomic application: a missing target or unpaid cost discards every effect. */
export function applyOutcomes(
  run: Run, ctx: NarrativeContext, outcomes: Outcome[], selection: Selection = {}, cost = 0,
): AppliedOutcome {
  if (run.light < cost) return invalid(`Requires ${cost} Light; you have ${run.light}.`);
  if (selection.chosen && selection.chosen === selection.recipient) return invalid("Choose two different planets.");
  const state = cloneSideState(run.state);
  const boundCtx = { ...ctx, perPlanetState: run.state };
  let light = run.light - cost;
  for (const effect of outcomes) {
    if (effect.kind === "light") { light = Math.max(0, light + effect.delta); continue; }
    if (effect.kind === "transfer") {
      const from = resolveTargets("chosen", boundCtx, selection)[0];
      const to = resolveTargets("recipient", boundCtx, selection)[0];
      if (!from || !to) return invalid("Choose a planet to relieve, then one to carry its burden.");
      if (isCombusted(ctx.placements[from], state[from]) || isCombusted(ctx.placements[to], state[to])) return invalid("Both planets must be lit.");
      if (state[from].affliction < effect.amount) return invalid(`Requires ${effect.amount} affliction to transfer.`);
      if (combustionCeiling(ctx.placements[to]) - state[to].affliction < effect.amount) return invalid(`${to} cannot carry the full burden.`);
      state[from].affliction -= effect.amount;
      state[to].affliction += effect.amount;
      continue;
    }
    const planets = resolveTargets(effect.target, boundCtx, selection);
    if (!planets.length) return invalid("Choose an eligible planet.");
    for (const p of planets) {
      const placement = ctx.placements[p];
      const ps = state[p];
      const ceiling = combustionCeiling(placement);
      const dark = isCombusted(placement, ps);
      if (effect.kind === "uncombust") {
        if (!dark) return invalid(`${p} is already lit.`);
        uncombust(placement, ps);
      } else {
        if (dark) return invalid(`${p} is combusted.`);
        if (effect.kind === "combust") ps.affliction = ceiling;
        else {
          if (effect.delta > ceiling - ps.affliction) return invalid(`${p} cannot absorb ${effect.delta} affliction.`);
          ps.affliction = Math.max(0, ps.affliction + effect.delta);
        }
      }
    }
  }
  if (cost > 0 && outcomes.some((e) => e.kind === "affliction" && e.delta < 0) && light <= run.light - cost && ctx.unlocked.every((p) => state[p].affliction === run.state[p].affliction)) {
    return invalid("There is nothing to restore.");
  }
  return { ok: true, run: { ...run, state, light } };
}

export type OptionPreview =
  | { ok: false; reason: string }
  | { ok: true; success: Run; failure?: Run };

/** Both branches must be payable before a wager can be offered or rolled. */
export function previewOption(run: Run, ctx: NarrativeContext, option: Option, selection: Selection = {}): OptionPreview {
  if (option.visibleIf && !option.visibleIf(ctx)) return { ok: false, reason: "This choice is not offered by your chart." };
  const success = applyOutcomes(run, ctx, option.result.effects, selection, option.cost);
  if (!success.ok) return success;
  if (!option.failure) return { ok: true, success: success.run };
  if (!wagerOdds(ctx)) return { ok: false, reason: "A lit planet must carry this wager." };
  const failure = applyOutcomes(run, ctx, option.failure.effects, selection, option.cost);
  return failure.ok ? { ok: true, success: success.run, failure: failure.run } : failure;
}

/** At most 7 × 7 assignments; eligibility uses the same resolver as commit. */
export function availableSelections(run: Run, ctx: NarrativeContext, option: Option): Selection[] {
  let selections: Selection[] = [{}];
  for (const slot of selectionSlots(option)) {
    selections = selections.flatMap((s) => ctx.unlocked.map((p) => ({ ...s, [slot]: p })));
  }
  return selections.filter((s) => previewOption(run, ctx, option, s).ok);
}

/** Validate the live encounter and authored choice before consuming randomness. */
export function resolveNarrative(
  run: Run, prince: Prince, scenario: NarrativeScenario, optionId: string,
  selection: Selection, rng: () => number, devUnlockAll = false,
): Run | null {
  const encounter = run.encounter;
  if (encounter?.kind !== "narrative" || encounter.resolved || encounter.scenarioId !== scenario.scenarioId || encounter.house !== scenario.house) return null;
  const option = scenario.options.find((o) => o.id === optionId);
  if (!option) return null;
  const house = HOUSES[encounter.house - 1]!;
  const ctx = buildNarrativeContext({ prince, run, joyPlanet: house.joy, rulerPlanet: house.ruler, unlocked: unlockedPlanets(prince.numEncounters, devUnlockAll) });
  const preview = previewOption(run, ctx, option, selection);
  if (!preview.ok) return null;
  const failed = !!option.failure && rng() >= wagerOdds(ctx)!.chance;
  const result = failed ? option.failure! : option.result;
  const next = failed ? preview.failure! : preview.success;
  const nodeId = run.map.currentNodeId;
  return {
    ...next,
    encounter: { ...encounter, resolved: true, resolutionText: result.text },
    seenFragmentIds: run.seenFragmentIds.includes(encounter.fragmentId) ? run.seenFragmentIds : [...run.seenFragmentIds, encounter.fragmentId],
    map: {
      ...run.map,
      outcomes: {
        ...run.map.outcomes,
        [nodeId]: { nodeId, kind: "narrative", summary: `${house.name} · ${result.text}`, lightDelta: next.light - run.light, combusts: newlyCombusted(prince.chart, run.state, next.state) },
      },
    },
  };
}
