import { useCallback } from "react";
import { usePrinceDispatch } from "./PrinceStore";
import { resolveTurn } from "@/game/turn";
import { beginRun, rolloverMap as rolloverMapFn } from "@/game/run";
import { randomSeed } from "@/game/rng";
import { PLANETS } from "@/game/data";
import type {
  Chart,
  CombatEncounter,
  NodeOutcome,
  PlanetName,
  Polarity,
  Run,
  TurnLogEntry,
} from "@/game/types";

/** Shape returned by `useCommitTurn` — feeds the combat animation. */
export interface CommitTurnResult {
  log: TurnLogEntry;
  nextRun: Run;
  encounter: CombatEncounter;
  encounterEnded: boolean;
  runEnded: boolean;
}

/**
 * Cross-cutting thunk hooks. These wrap impure work (RNG, time, computed
 * `nextRun` shapes) and dispatch the resolved state to the pure Prince reducer.
 * A run lives inside the Prince (STATE.md); these mutate the tail run.
 */

/** Append a fresh run to the Prince. Returns the run that was dispatched. */
export function useStartRun() {
  const dispatch = usePrinceDispatch();
  return useCallback(
    (seed: number = randomSeed()): Run => {
      const run = beginRun(seed);
      dispatch({ kind: "startRun", run });
      return run;
    },
    [dispatch],
  );
}

/** Resolve a combat turn and dispatch the result. Bumps `numEncounters` and
 *  records a NodeOutcome on the map when the encounter ends. */
export function useCommitTurn() {
  const dispatch = usePrinceDispatch();
  return useCallback(
    (
      run: Run,
      playerChart: Chart,
      planet: PlanetName,
      valence: Polarity,
      rng: () => number,
    ): CommitTurnResult | null => {
      const result = resolveTurn(run, playerChart, planet, valence, rng);
      if (!result) return null;
      let nextRun = result.run;
      if (result.encounterEnded && result.encounter.kind === "combat") {
        const combusts = PLANETS.filter(
          (p) => nextRun.state[p].combusted && !run.state[p].combusted,
        );
        const outcome: NodeOutcome = {
          nodeId: nextRun.map.currentNodeId,
          kind: "combat",
          summary: `Combat · ${result.encounter.opponentChart.name}`,
          distanceDelta: nextRun.distance - run.distance,
          combusts,
        };
        nextRun = {
          ...nextRun,
          map: {
            ...nextRun.map,
            outcomes: { ...nextRun.map.outcomes, [outcome.nodeId]: outcome },
          },
        };
        dispatch({ kind: "incrementEncounters" });
      }
      dispatch({ kind: "commitRun", run: nextRun });
      return {
        log: result.log,
        nextRun,
        encounter: result.encounter,
        encounterEnded: result.encounterEnded,
        runEnded: result.runEnded,
      };
    },
    [dispatch],
  );
}

/** Resolve a narrative step (mid-tree or terminal) and dispatch. When the
 *  encounter resolves, bumps `numEncounters` + records a NodeOutcome. */
export function useCommitNarrative() {
  const dispatch = usePrinceDispatch();
  return useCallback(
    (args: { run: Run; nextRun: Run; summary: string; resolved: boolean }) => {
      let next = args.nextRun;
      if (args.resolved) {
        const combusts = PLANETS.filter(
          (p) => next.state[p].combusted && !args.run.state[p].combusted,
        );
        const outcome: NodeOutcome = {
          nodeId: next.map.currentNodeId,
          kind: "narrative",
          summary: args.summary,
          distanceDelta: next.distance - args.run.distance,
          combusts,
        };
        next = {
          ...next,
          map: {
            ...next.map,
            outcomes: { ...next.map.outcomes, [outcome.nodeId]: outcome },
          },
        };
        dispatch({ kind: "incrementEncounters" });
      }
      dispatch({ kind: "commitRun", run: next });
      return next;
    },
    [dispatch],
  );
}

/** Roll over to a fresh map (terminal node reached). The chart + fielded
 *  roster feed the map boundary — uncombust rolls and the barrage (§11.3). */
export function useRolloverMap() {
  const dispatch = usePrinceDispatch();
  return useCallback(
    (run: Run, chart: Chart, roster: PlanetName[], seed: number = randomSeed()): Run => {
      const nextRun = rolloverMapFn(run, chart, roster, seed);
      dispatch({ kind: "commitRun", run: nextRun });
      return nextRun;
    },
    [dispatch],
  );
}

/** Reset everything — the Prince and all its runs, localStorage wiped. */
export function useResetAll() {
  const dispatch = usePrinceDispatch();
  return useCallback(() => {
    dispatch({ kind: "clear" });
  }, [dispatch]);
}
