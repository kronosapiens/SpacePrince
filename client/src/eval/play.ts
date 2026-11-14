import { runChart } from "@/game/chart";
import { getScenario } from "@/data/narrative-scenarios";
import { isCombusted, newlyCombusted } from "@/game/combust";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { PLANETS } from "@/game/data";
import { narrativeContext, resolveNarrative, visibleOptions, type NarrativeScenario, type Option, type Selection } from "@/game/narrative";
import { resolveTurn } from "@/game/turn";
import { unlockedPlanets } from "@/game/unlocks";
import type { Chart, RelationalEncounter, MapBoundary, NecessityEntry, PlanetName, Polarity, Prince, Run, TurnLogEntry } from "@/game/types";
import type { Strategy } from "./policies";

/** One evaluated run. Strategies share a chart/game-seed pair and choose their own path. */
export interface Trial {
  chartSeed: number;
  gameSeed: number;
  strategy: Strategy;
  strategySeed: number;
}

export interface RelationalAction { planet: PlanetName; verb: Polarity }
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
  /** Each relational turn's draws (`relationalTurnRng` in live play). */
  turnRng: (run: Run, encounter: RelationalEncounter) => () => number;
}

/** Each decision returns one of the legal choices it is given. */
export interface Policy {
  route(play: PlayContext, run: Run, nodeIds: string[]): string;
  relational(play: PlayContext, run: Run, actions: RelationalAction[]): RelationalAction;
  narrative(play: PlayContext, run: Run, options: NarrativeOption[]): NarrativeChoice;
}

/** The state a step leaves behind, so a record shows every change. */
export function snapshot(run: Run): { light: number; tension: Record<PlanetName, number>; gains: Run["gains"] } {
  return {
    light: run.light,
    gains: run.gains,
    tension: Object.fromEntries(PLANETS.map((p) => [p, run.state[p].tension])) as Record<PlanetName, number>,
  };
}
export type Snapshot = ReturnType<typeof snapshot>;

/** Actual effects received by Self, after clamping and aspect inversion. */
export interface RelationalTension {
  created: number; eased: number;
  directAffliction: number; propagatedAffliction: number; invertedTestimonyCreated: number;
  directTestimony: number; propagatedTestimony: number; invertedAfflictionEased: number;
}

export function emptyRelationalTension(): RelationalTension {
  return { created: 0, eased: 0, directAffliction: 0, propagatedAffliction: 0,
    invertedTestimonyCreated: 0, directTestimony: 0, propagatedTestimony: 0, invertedAfflictionEased: 0 };
}

export function relationalTension(log: TurnLogEntry): RelationalTension {
  const tension = emptyRelationalTension();
  tension[log.opponentValence === "Affliction" ? "directAffliction" : "directTestimony"] = log.playerDelta;
  for (const effect of log.propagation) {
    if (effect.side !== "self") continue;
    const key = log.opponentValence === "Affliction"
      ? effect.polarity === "Affliction" ? "propagatedAffliction" : "invertedAfflictionEased"
      : effect.polarity === "Testimony" ? "propagatedTestimony" : "invertedTestimonyCreated";
    // The separate combustion marker has delta zero, so it cannot double-count a hit.
    tension[key] += Math.abs(effect.delta);
  }
  tension.created = tension.directAffliction + tension.propagatedAffliction + tension.invertedTestimonyCreated;
  tension.eased = tension.directTestimony + tension.propagatedTestimony + tension.invertedAfflictionEased;
  return tension;
}

export interface StateTension { created: number; eased: number; revivalRecovery: number; resolveGain: number }

/** Tension changes and Resolve gains remain separate sources of capacity. */
export function stateTension(chart: Chart, before: Snapshot, after: Snapshot, roster: readonly PlanetName[]): StateTension {
  const oldChart = runChart(chart, before), newChart = runChart(chart, after);
  const tension: StateTension = { created: 0, eased: 0, revivalRecovery: 0, resolveGain: 0 };
  for (const planet of roster) {
    const oldResolve = getEffectiveStatsFromPlacement(oldChart.planets[planet]).resolve;
    const newResolve = getEffectiveStatsFromPlacement(newChart.planets[planet]).resolve;
    const change = after.tension[planet] - before.tension[planet];
    tension.resolveGain += newResolve - oldResolve;
    if (change > 0) tension.created += change;
    else if (before.tension[planet] >= oldResolve && after.tension[planet] < newResolve) tension.revivalRecovery -= change;
    else tension.eased -= change;
  }
  return tension;
}

/** Every step carries the state it leaves, so replay shows each change. */
export type Step = ReturnType<typeof snapshot> & (
  | { kind: "boundary"; map: number; seed: number; uncombusts: MapBoundary["uncombusts"]; necessity: MapBoundary["necessity"] }
  | { kind: "enter"; map: number; nodeId: string; lifetimeRelationalEncounterCount: number;
      encounter: "relational"; opponentSeed: number; ruler: PlanetName; necessity: NecessityEntry[]; combusts: PlanetName[]; wipe: boolean }
  | { kind: "enter"; map: number; nodeId: string; lifetimeRelationalEncounterCount: number; encounter: "narrative"; house: number; scenarioId: string }
  | { kind: "unlock"; planet: PlanetName; lifetimeRelationalEncounterCount: number; rescuedByUnlock: boolean; entryWipe: boolean; capacity: number }
  | {
      kind: "turn"; planet: PlanetName; verb: Polarity; opponentPlanet: PlanetName; opponentVerb: Polarity;
      playerDelta: number; opponentDelta: number; lightGain: number;
      combusts: PlanetName[]; opponentCombusts: PlanetName[];
      tensionChange: RelationalTension;
    }
  | {
      kind: "narrative"; optionId: string; chosen: PlanetName | null; lightDelta: number;
      combusts: PlanetName[]; revivals: PlanetName[];
      tensionChange: StateTension;
    }
);

const VERBS: Polarity[] = ["Affliction", "Testimony"];

/** Every lit fielded planet, sent with either verb. */
export function relationalActions(run: Run, chart: Chart, encounter: RelationalEncounter): RelationalAction[] {
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
    const roster = unlockedPlanets(prince.numRelationalEncounters);
    const combustedBefore = (p: PlanetName) => isCombusted(beforeChart.planets[p], run.state[p]);
    const combustedAfter = (p: PlanetName) => isCombusted(afterChart.planets[p], next.state[p]);
    record?.({
      kind: "narrative",
      optionId,
      chosen: selection.chosen ?? null,
      lightDelta: next.light - run.light,
      combusts: roster.filter((p) => !combustedBefore(p) && combustedAfter(p)),
      revivals: roster.filter((p) => combustedBefore(p) && !combustedAfter(p)),
      tensionChange: stateTension(chart, snapshot(run), snapshot(next), roster),
      ...snapshot(next),
    });
    return next;
  }
  while (run.encounter?.kind === "relational" && !run.encounter.resolved) {
    const enc = run.encounter;
    const { planet, verb } = policy.relational(play, run, relationalActions(run, chart, enc));
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
      tensionChange: relationalTension(log),
      ...snapshot(result.run),
    });
    run = result.run;
  }
  return run;
}
