import { runChart } from "@/game/chart";
import { getScenario } from "@/data/narrative-scenarios";
import { combustionCeiling, isCombusted, newlyCombusted } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { narrativeContext, resolveNarrative, visibleOptions, type NarrativeScenario, type Option, type Selection } from "@/game/narrative";
import { resolveTurn } from "@/game/turn";
import { unlockedPlanets } from "@/game/unlocks";
import type { Chart, CombatEncounter, MapBoundary, NecessityEntry, PlanetName, Polarity, Prince, Run, TurnLogEntry } from "@/game/types";
import type { Strategy } from "./policies";

/** One evaluated run. Strategies share a chart/game-seed pair and choose their own path. */
export interface Trial {
  chartSeed: number;
  gameSeed: number;
  strategy: Strategy;
  strategySeed: number;
}

export interface CombatAction { planet: PlanetName; verb: Polarity }
/** A legal narrative option with every selection that can carry it. */
export interface NarrativeOption { option: Option; selections: Selection[] }
export interface NarrativeChoice { optionId: string; selection: Selection }

/** What a policy plays with. Live play passes the game's own randomness; a
 *  forecast passes sampled `rng` and `turnRng` so it never reads the live draws. */
export interface PlayContext {
  trial: Trial;
  /** Chart and lifetime count, as the resolvers read them. */
  prince: Prince;
  policy: Policy;
  /** The strategy's own randomness — never fed to the game. */
  rng: () => number;
  /** Each combat turn's draws (`combatTurnRng` in live play). */
  turnRng: (run: Run, encounter: CombatEncounter) => () => number;
}

/** Each decision returns one of the legal choices it is given. */
export interface Policy {
  route(play: PlayContext, run: Run, nodeIds: string[]): string;
  combat(play: PlayContext, run: Run, actions: CombatAction[]): CombatAction;
  narrative(play: PlayContext, run: Run, options: NarrativeOption[]): NarrativeChoice;
}

/** The state a step leaves behind, so a record shows every change. */
export function snapshot(run: Run): { light: number; affliction: Record<PlanetName, number>; gains: Run["gains"] } {
  return {
    light: run.light,
    gains: run.gains,
    affliction: Object.fromEntries(PLANETS.map((p) => [p, run.state[p].affliction])) as Record<PlanetName, number>,
  };
}
export type Snapshot = ReturnType<typeof snapshot>;

/** Actual effects received by Self, after clamping and aspect inversion. */
export interface CombatPressure {
  damage: number; healing: number;
  directAffliction: number; propagatedAffliction: number; invertedTestimonyDamage: number;
  directTestimony: number; propagatedTestimony: number; invertedAfflictionHealing: number;
}

export function emptyCombatPressure(): CombatPressure {
  return { damage: 0, healing: 0, directAffliction: 0, propagatedAffliction: 0,
    invertedTestimonyDamage: 0, directTestimony: 0, propagatedTestimony: 0, invertedAfflictionHealing: 0 };
}

export function combatPressure(log: TurnLogEntry): CombatPressure {
  const pressure = emptyCombatPressure();
  pressure[log.opponentValence === "Affliction" ? "directAffliction" : "directTestimony"] = log.playerDelta;
  for (const effect of log.propagation) {
    if (effect.side !== "self") continue;
    const key = log.opponentValence === "Affliction"
      ? effect.polarity === "Affliction" ? "propagatedAffliction" : "invertedAfflictionHealing"
      : effect.polarity === "Testimony" ? "propagatedTestimony" : "invertedTestimonyDamage";
    // The separate combustion marker has delta zero, so it cannot double-count a hit.
    pressure[key] += Math.abs(effect.delta);
  }
  pressure.damage = pressure.directAffliction + pressure.propagatedAffliction + pressure.invertedTestimonyDamage;
  pressure.healing = pressure.directTestimony + pressure.propagatedTestimony + pressure.invertedAfflictionHealing;
  return pressure;
}

export interface StatePressure { damage: number; healing: number; revivalRecovery: number; resolveGain: number }

/** Affliction changes and Resolve gains remain separate sources of capacity. */
export function statePressure(chart: Chart, before: Snapshot, after: Snapshot, roster: readonly PlanetName[]): StatePressure {
  const oldChart = runChart(chart, before), newChart = runChart(chart, after);
  const pressure: StatePressure = { damage: 0, healing: 0, revivalRecovery: 0, resolveGain: 0 };
  for (const planet of roster) {
    const oldCeiling = combustionCeiling(oldChart.planets[planet]), newCeiling = combustionCeiling(newChart.planets[planet]);
    const change = after.affliction[planet] - before.affliction[planet];
    pressure.resolveGain += newCeiling - oldCeiling;
    if (change > 0) pressure.damage += change;
    else if (before.affliction[planet] >= oldCeiling && after.affliction[planet] < newCeiling) pressure.revivalRecovery -= change;
    else pressure.healing -= change;
  }
  return pressure;
}

/** Every step carries the state it leaves, so replay shows each change. */
export type Step = ReturnType<typeof snapshot> & (
  | { kind: "boundary"; map: number; seed: number; uncombusts: MapBoundary["uncombusts"]; necessity: MapBoundary["necessity"] }
  | { kind: "enter"; map: number; nodeId: string; lifetimeEncounterCount: number;
      encounter: "combat"; opponentSeed: number; ruler: PlanetName; necessity: NecessityEntry[]; combusts: PlanetName[]; wipe: boolean }
  | { kind: "enter"; map: number; nodeId: string; lifetimeEncounterCount: number; encounter: "narrative"; house: number; scenarioId: string }
  | { kind: "unlock"; planet: PlanetName; lifetimeEncounterCount: number; rescuedByUnlock: boolean; entryWipe: boolean; capacity: number }
  | {
      kind: "turn"; planet: PlanetName; verb: Polarity; opponentPlanet: PlanetName; opponentVerb: Polarity;
      playerDelta: number; opponentDelta: number; lightGain: number;
      combusts: PlanetName[]; opponentCombusts: PlanetName[];
      pressure: CombatPressure;
    }
  | {
      kind: "narrative"; optionId: string; chosen: PlanetName | null; lightDelta: number;
      combusts: PlanetName[]; revivals: PlanetName[];
      pressure: StatePressure;
    }
);

const VERBS: Polarity[] = ["Affliction", "Testimony"];

/** Every lit fielded planet, sent with either verb. */
export function combatActions(run: Run, chart: Chart, encounter: CombatEncounter): CombatAction[] {
  const placements = runChart(chart, run).planets;
  return encounter.roster
    .filter((planet) => !isCombusted(placements[planet], run.state[planet]))
    .flatMap((planet) => VERBS.map((verb) => ({ planet, verb })));
}

/** The options the narrative screen lets this chart choose. */
export function narrativeOptions(run: Run, prince: Prince, scenario: NarrativeScenario): NarrativeOption[] {
  return visibleOptions(run, narrativeContext(prince, run, scenario.house), scenario)
    .filter(({ selections }) => selections.length > 0);
}

/** Play the open encounter until it resolves. Each choice is reported to `record`. */
export function playEncounter(play: PlayContext, run: Run, record?: (step: Step) => void): Run {
  const { prince, policy } = play;
  const { chart } = prince;
  const encounter = run.encounter;
  if (encounter?.kind === "narrative") {
    const scenario = getScenario(encounter.scenarioId);
    const { optionId, selection } = policy.narrative(play, run, narrativeOptions(run, prince, scenario));
    const next = resolveNarrative(run, prince, scenario, optionId, selection)!;
    const beforeChart = runChart(chart, run), afterChart = runChart(chart, next);
    const roster = unlockedPlanets(prince.numEncounters);
    const combustedBefore = (p: PlanetName) => isCombusted(beforeChart.planets[p], run.state[p]);
    const combustedAfter = (p: PlanetName) => isCombusted(afterChart.planets[p], next.state[p]);
    record?.({
      kind: "narrative",
      optionId,
      chosen: selection.chosen ?? null,
      lightDelta: next.light - run.light,
      combusts: roster.filter((p) => !combustedBefore(p) && combustedAfter(p)),
      revivals: roster.filter((p) => combustedBefore(p) && !combustedAfter(p)),
      pressure: statePressure(chart, snapshot(run), snapshot(next), roster),
      ...snapshot(next),
    });
    return next;
  }
  while (run.encounter?.kind === "combat" && !run.encounter.resolved) {
    const enc = run.encounter;
    const { planet, verb } = policy.combat(play, run, combatActions(run, chart, enc));
    const result = resolveTurn(run, chart, planet, verb, play.turnRng(run, enc))!;
    const { log } = result;
    record?.({
      kind: "turn",
      planet,
      verb,
      opponentPlanet: log.opponentPlanet,
      opponentVerb: log.opponentValence,
      playerDelta: log.playerDelta,
      opponentDelta: log.opponentDelta,
      lightGain: log.lightGain,
      combusts: newlyCombusted(runChart(chart, run), run.state, result.run.state),
      opponentCombusts: newlyCombusted(enc.opponentChart, enc.opponentState, result.encounter.opponentState),
      pressure: combatPressure(log),
      ...snapshot(result.run),
    });
    run = result.run;
  }
  return run;
}
