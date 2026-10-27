import { HOUSES } from "@/data/houses";
import { cloneSideState, houseSign, runChart } from "./chart";
import { combustionCeiling, isCombusted, newlyCombusted, uncombust } from "./combust";
import { unlockedPlanets } from "./unlocks";
import type { Dignity, PlanetName, PlanetPlacement, PlanetStats, Prince, Run, SignName } from "./types";

export type Selection = { chosen?: PlanetName };
export type Target = "chosen" | "allUnlocked" | "mostAfflicted" | "healthiest" | "joy" | "ruler";
export type Outcome =
  | { kind: "affliction"; target: Target; delta: number }
  /** A stat raised for the rest of the run (`Run.gains`), in raw stat units. */
  | { kind: "gain"; target: Target; stat: keyof PlanetStats; amount: number }
  | { kind: "uncombust"; target: Target }
  | { kind: "light"; delta: number };

export interface Consequence {
  /** What follows the choice; the option's own text stands in when absent. */
  text?: string;
  effects: Outcome[];
}

export interface Option {
  id: string;
  text: string;
  visibleIf?: (ctx: NarrativeContext) => boolean;
  /** A purchase is paid in full; ordinary losses use light effects. */
  cost?: number;
  result: Consequence;
}

export interface NarrativeScenario {
  scenarioId: string;
  house: number;
  /** The house's sign the scene is written for. */
  sign: SignName;
  text: string;
  options: Option[];
}

export type Occupant = Pick<PlanetPlacement, "planet" | "dignity">;

export interface NarrativeContext {
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
  unlocked: PlanetName[];
  perPlanetState: Run["state"];
  /** The run's chart (`runChart`), so ceilings include the run's gains. */
  placements: Prince["chart"]["planets"];
  /** Unlocked planets whose natal sign is the house's sign, lit or not. */
  occupants: Occupant[];
}

/** The house and the run chart determine available joys, occupants, and targets. */
export function narrativeContext(prince: Prince, run: Run, house: number, devUnlockAll = false): NarrativeContext {
  const { joy, ruler } = HOUSES[house - 1]!;
  const unlocked = unlockedPlanets(prince.numEncounters, devUnlockAll);
  const placements = runChart(prince.chart, run).planets;
  const sign = houseSign(prince.chart, house);
  return {
    joyPlanet: joy, rulerPlanet: ruler, unlocked, placements, perPlanetState: run.state,
    occupants: unlocked.map((p) => placements[p]).filter((p) => p.sign === sign),
  };
}

const combusted = (ctx: NarrativeContext, p: PlanetName) =>
  isCombusted(ctx.placements[p], ctx.perPlanetState[p]);

export const joyPresent = (ctx: NarrativeContext): boolean =>
  !!ctx.joyPlanet && ctx.unlocked.includes(ctx.joyPlanet) &&
  !combusted(ctx, ctx.joyPlanet) && ctx.perPlanetState[ctx.joyPlanet].affliction < 96;
export const anyCombusted = (ctx: NarrativeContext): boolean =>
  ctx.unlocked.some((p) => combusted(ctx, p));

/** All roles bind against the state before the choice, never a partially applied result. */
export function resolveTargets(target: Target, ctx: NarrativeContext, selection: Selection = {}): PlanetName[] {
  const lit = ctx.unlocked.filter((p) => !combusted(ctx, p));
  const affliction = (p: PlanetName) => ctx.perPlanetState[p].affliction;
  const margin = (p: PlanetName) => combustionCeiling(ctx.placements[p]) - affliction(p);
  switch (target) {
    case "chosen": {
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

export function requiresPlanet(option: Option): boolean {
  return option.result.effects.some((effect) => "target" in effect && effect.target === "chosen");
}

export type AppliedOutcome = { ok: true; run: Run } | { ok: false; reason: string };
const invalid = (reason: string): AppliedOutcome => ({ ok: false, reason });

/** Atomic application: a missing target or unpaid cost discards every effect.
 *  Effects apply in order, each against the ceilings the earlier ones left. */
export function applyOutcomes(
  run: Run, ctx: NarrativeContext, outcomes: Outcome[], selection: Selection = {}, cost = 0,
): AppliedOutcome {
  if (run.light < cost) return invalid(`Requires ${cost} Light; you have ${run.light}.`);
  const state = cloneSideState(run.state);
  const gains = { ...run.gains };
  const boundCtx = { ...ctx, perPlanetState: run.state };
  let light = run.light - cost;
  for (const effect of outcomes) {
    if (effect.kind === "light") { light = Math.max(0, light + effect.delta); continue; }
    const planets = resolveTargets(effect.target, boundCtx, selection);
    if (!planets.length) return invalid("Choose an eligible planet.");
    for (const p of planets) {
      const placement = { ...ctx.placements[p], gains: gains[p] };
      const ps = state[p];
      const dark = isCombusted(placement, ps);
      if (effect.kind === "uncombust") {
        if (!dark) return invalid(`${p} is already lit.`);
        uncombust(placement, ps);
      } else if (dark) {
        return invalid(`${p} is combusted.`);
      } else if (effect.kind === "gain") {
        gains[p] = { ...gains[p], [effect.stat]: gains[p][effect.stat] + effect.amount };
      } else {
        if (effect.delta > combustionCeiling(placement) - ps.affliction) return invalid(`${p} cannot absorb ${effect.delta} affliction.`);
        ps.affliction = Math.max(0, ps.affliction + effect.delta);
      }
    }
  }
  if (cost > 0 && outcomes.some((e) => e.kind === "affliction" && e.delta < 0) && light <= run.light - cost && ctx.unlocked.every((p) => state[p].affliction === run.state[p].affliction)) {
    return invalid("There is nothing to restore.");
  }
  return { ok: true, run: { ...run, state, gains, light } };
}

export type OptionPreview =
  | { ok: false; reason: string }
  | { ok: true; success: Run };

export function previewOption(run: Run, ctx: NarrativeContext, option: Option, selection: Selection = {}): OptionPreview {
  const success = applyOutcomes(run, ctx, option.result.effects, selection, option.cost);
  return success.ok ? { ok: true, success: success.run } : success;
}

/** Eligibility uses the same resolver as commit. */
export function availableSelections(run: Run, ctx: NarrativeContext, option: Option): Selection[] {
  const selections: Selection[] = requiresPlanet(option) ? ctx.unlocked.map((chosen) => ({ chosen })) : [{}];
  return selections.filter((s) => previewOption(run, ctx, option, s).ok);
}

const DIGNITY_STEP: Record<Dignity, number> = { Domicile: 1, Exaltation: 1, Neutral: 0, Detriment: -1, Fall: -1 };

/** The occupants' net dignity, as one step: 1 favourable, -1 unfavourable, 0 neither. */
export function occupantLean(occupants: readonly Occupant[]): number {
  return Math.sign(occupants.reduce((sum, o) => sum + DIGNITY_STEP[o.dignity], 0));
}

/** The occupants' net dignity moves an existing cost by one step: a Light
 *  price (24), else affliction taken (12), else an ordinary Light loss (24).
 *  Costs stop at zero; gifts and neutral occupants leave terms unchanged. */
export function withOccupants(option: Option, occupants: readonly Occupant[]): Option {
  const lean = occupantLean(occupants);
  if (!lean) return option;
  let cost = option.cost;
  let effects = option.result.effects;
  if (cost) {
    cost = Math.max(0, cost - lean * 24);
  } else {
    const taken = effects.findIndex((e) => e.kind === "affliction" && e.delta > 0);
    const side = taken >= 0 ? taken : effects.findIndex((e) => e.kind === "light" && e.delta < 0);
    effects = effects.map((e, i) =>
      i !== side ? e
      : e.kind === "affliction" ? { ...e, delta: Math.max(0, e.delta - lean * 12) }
      : e.kind === "light" ? { ...e, delta: Math.min(0, e.delta + lean * 24) }
      : e);
  }
  return { ...option, cost, result: { ...option.result, effects } };
}

/** The choices a scene offers this chart, on the house's terms. The screen and
 *  the resolver both read options through here. */
export function offeredOptions(scenario: NarrativeScenario, ctx: NarrativeContext): Option[] {
  return scenario.options
    .filter((o) => !o.visibleIf || o.visibleIf(ctx))
    .map((o) => withOccupants(o, ctx.occupants));
}

/** Offered choices and the selections that can carry them, shared by UI and evaluation. */
export function visibleOptions(run: Run, ctx: NarrativeContext, scenario: NarrativeScenario): { option: Option; selections: Selection[] }[] {
  return offeredOptions(scenario, ctx).map((option) => ({ option, selections: availableSelections(run, ctx, option) }));
}

/** Validate the live encounter and authored choice before applying its result. */
export function resolveNarrative(
  run: Run, prince: Prince, scenario: NarrativeScenario, optionId: string,
  selection: Selection, devUnlockAll = false,
): Run | null {
  const encounter = run.encounter;
  if (encounter?.kind !== "narrative" || encounter.resolved || encounter.scenarioId !== scenario.scenarioId || encounter.house !== scenario.house) return null;
  const ctx = narrativeContext(prince, run, encounter.house, devUnlockAll);
  const option = offeredOptions(scenario, ctx).find((o) => o.id === optionId);
  if (!option) return null;
  const preview = previewOption(run, ctx, option, selection);
  if (!preview.ok) return null;
  const text = option.result.text ?? option.text;
  const next = preview.success;
  const nodeId = run.map.currentNodeId;
  const house = HOUSES[encounter.house - 1]!;
  return {
    ...next,
    encounter: { ...encounter, resolved: true, resolutionText: text },
    map: {
      ...run.map,
      outcomes: {
        ...run.map.outcomes,
        [nodeId]: { nodeId, kind: "narrative", summary: `${house.name} · ${text}`, lightDelta: next.light - run.light, combusts: newlyCombusted(runChart(prince.chart, next), run.state, next.state) },
      },
    },
  };
}
