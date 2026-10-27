import { getScenario } from "@/data/narrative-scenarios";
import { isCombusted, newlyCombusted } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { narrativeContext, resolveNarrative, visibleOptions, type NarrativeScenario, type Option, type Selection } from "@/game/narrative";
import { resolveTurn } from "@/game/turn";
import type { Chart, CombatEncounter, MapBoundary, PlanetName, Polarity, Prince, Run } from "@/game/types";
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
export function snapshot(run: Run): { light: number; affliction: Record<PlanetName, number> } {
  return {
    light: run.light,
    affliction: Object.fromEntries(PLANETS.map((p) => [p, run.state[p].affliction])) as Record<PlanetName, number>,
  };
}

/** Every step carries the state it leaves, so replay shows each change. */
export type Step = ReturnType<typeof snapshot> & (
  | { kind: "boundary"; map: number; seed: number; uncombusts: MapBoundary["uncombusts"]; necessity: MapBoundary["necessity"] }
  | { kind: "enter"; map: number; nodeId: string; encounter: "combat"; opponentSeed: number; ruler: PlanetName }
  | { kind: "enter"; map: number; nodeId: string; encounter: "narrative"; house: number; scenarioId: string }
  | {
      kind: "turn"; planet: PlanetName; verb: Polarity; opponentPlanet: PlanetName; opponentVerb: Polarity;
      playerDelta: number; opponentDelta: number; lightGain: number;
      combusts: PlanetName[]; opponentCombusts: PlanetName[];
    }
  | {
      kind: "narrative"; optionId: string; chosen: PlanetName | null; lightDelta: number;
      combusts: PlanetName[]; revivals: PlanetName[];
    }
);

const VERBS: Polarity[] = ["Affliction", "Testimony"];

/** Every lit fielded planet, sent with either verb. */
export function combatActions(run: Run, chart: Chart, encounter: CombatEncounter): CombatAction[] {
  return encounter.roster
    .filter((planet) => !isCombusted(chart.planets[planet], run.state[planet]))
    .flatMap((planet) => VERBS.map((verb) => ({ planet, verb })));
}

/** The options the narrative screen lets this chart choose. */
export function narrativeOptions(run: Run, prince: Prince, scenario: NarrativeScenario): NarrativeOption[] {
  return visibleOptions(run, narrativeContext(prince, run, scenario.house), scenario)
    .filter(({ selections }) => selections.length > 0);
}

/** Play the open encounter until it resolves. Each choice is reported to `record`. */
export function playEncounter(play: PlayContext, run: Run, record: (step: Step) => void = () => {}): Run {
  const { prince, policy } = play;
  const { chart } = prince;
  const encounter = run.encounter;
  if (encounter?.kind === "narrative") {
    const scenario = getScenario(encounter.scenarioId);
    const { optionId, selection } = policy.narrative(play, run, narrativeOptions(run, prince, scenario));
    const next = resolveNarrative(run, prince, scenario, optionId, selection)!;
    record({
      kind: "narrative",
      optionId,
      chosen: selection.chosen ?? null,
      lightDelta: next.light - run.light,
      combusts: newlyCombusted(chart, run.state, next.state),
      revivals: newlyCombusted(chart, next.state, run.state),
      ...snapshot(next),
    });
    return next;
  }
  while (run.encounter?.kind === "combat" && !run.encounter.resolved) {
    const enc = run.encounter;
    const { planet, verb } = policy.combat(play, run, combatActions(run, chart, enc));
    const result = resolveTurn(run, chart, planet, verb, play.turnRng(run, enc))!;
    const { log } = result;
    record({
      kind: "turn",
      planet,
      verb,
      opponentPlanet: log.opponentPlanet,
      opponentVerb: log.opponentValence,
      playerDelta: log.playerDelta,
      opponentDelta: log.opponentDelta,
      lightGain: log.lightGain,
      combusts: newlyCombusted(chart, run.state, result.run.state),
      opponentCombusts: newlyCombusted(enc.opponentChart, enc.opponentState, result.encounter.opponentState),
      ...snapshot(result.run),
    });
    run = result.run;
  }
  return run;
}
