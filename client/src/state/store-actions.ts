import { useCallback } from "react";
import { useRunDispatch } from "./RunStore";
import { useProfileDispatch } from "./ProfileStore";
import { resolveTurn } from "@/game/turn";
import { beginRun, rolloverMap as rolloverMapFn } from "@/game/run";
import { randomSeed } from "@/game/rng";
import { PLANETS } from "@/game/data";
import type {
  Chart,
  CombatEncounter,
  NodeOutcome,
  PlanetName,
  Profile,
  RunState,
  TurnLogEntry,
} from "@/game/types";

/** Shape returned by `useCommitTurn` — feeds the combat animation. */
export interface CommitTurnResult {
  log: TurnLogEntry;
  nextRun: RunState;
  encounter: CombatEncounter;
  encounterEnded: boolean;
  runEnded: boolean;
}

/**
 * Cross-store thunk hooks. These wrap impure work (RNG, time, computed
 * `nextRun` shapes) and dispatch the resolved state to the pure reducers.
 */

/** Begin a new run for the given profile. Returns the run that was dispatched. */
export function useStartRun() {
  const dispatchRun = useRunDispatch();
  return useCallback(
    (profile: Profile, seed: number = randomSeed()): RunState => {
      const run = beginRun(profile, seed);
      dispatchRun({ type: "run/start", run });
      return run;
    },
    [dispatchRun],
  );
}

/** Resolve a combat turn and dispatch the result. Bumps lifetimeEncounterCount
 *  and adds a NodeOutcome when the encounter ends. */
export function useCommitTurn() {
  const dispatchRun = useRunDispatch();
  const dispatchProfile = useProfileDispatch();
  return useCallback(
    (
      run: RunState,
      playerChart: Chart,
      planet: PlanetName,
      rng: () => number,
    ): CommitTurnResult | null => {
      const result = resolveTurn(run, playerChart, planet, rng);
      if (!result) return null;
      let nextRun = result.run;
      if (result.encounterEnded && result.encounter.kind === "combat") {
        const combusts = PLANETS.filter(
          (p) =>
            nextRun.perPlanetState[p].combusted &&
            !run.perPlanetState[p].combusted,
        );
        const outcome: NodeOutcome = {
          nodeId: nextRun.currentMap.currentNodeId,
          kind: "combat",
          summary: `Combat · ${result.encounter.opponentChart.name}`,
          distanceDelta: nextRun.runDistance - run.runDistance,
          combusts,
        };
        nextRun = {
          ...nextRun,
          currentMap: {
            ...nextRun.currentMap,
            outcomes: {
              ...nextRun.currentMap.outcomes,
              [outcome.nodeId]: outcome,
            },
          },
        };
        dispatchProfile({ type: "profile/incrementLifetime" });
      }
      dispatchRun({ type: "run/commitTurn", nextRun });
      return {
        log: result.log,
        nextRun,
        encounter: result.encounter,
        encounterEnded: result.encounterEnded,
        runEnded: result.runEnded,
      };
    },
    [dispatchRun, dispatchProfile],
  );
}

/** Resolve a narrative step (mid-tree or terminal) and dispatch. When the
 *  encounter resolves, also bumps lifetime + records a NodeOutcome. */
export function useCommitNarrative() {
  const dispatchRun = useRunDispatch();
  const dispatchProfile = useProfileDispatch();
  return useCallback(
    (args: {
      run: RunState;
      nextRun: RunState;
      summary: string;
      resolved: boolean;
    }) => {
      let next = args.nextRun;
      if (args.resolved) {
        const combusts = PLANETS.filter(
          (p) =>
            next.perPlanetState[p].combusted &&
            !args.run.perPlanetState[p].combusted,
        );
        const outcome: NodeOutcome = {
          nodeId: next.currentMap.currentNodeId,
          kind: "narrative",
          summary: args.summary,
          distanceDelta: next.runDistance - args.run.runDistance,
          combusts,
        };
        next = {
          ...next,
          currentMap: {
            ...next.currentMap,
            outcomes: {
              ...next.currentMap.outcomes,
              [outcome.nodeId]: outcome,
            },
          },
        };
        dispatchProfile({ type: "profile/incrementLifetime" });
      }
      dispatchRun({ type: "run/commitNarrative", nextRun: next });
      return next;
    },
    [dispatchRun, dispatchProfile],
  );
}

/** Roll over to a fresh map (terminal node reached). */
export function useRolloverMap() {
  const dispatchRun = useRunDispatch();
  return useCallback(
    (run: RunState, seed: number = randomSeed()): RunState => {
      const nextRun = rolloverMapFn(run, seed);
      dispatchRun({ type: "run/rolloverMap", nextRun });
      return nextRun;
    },
    [dispatchRun],
  );
}

/** End-of-Run: idempotent scars bump keyed on the run id. */
export function useBumpScars() {
  const dispatchProfile = useProfileDispatch();
  return useCallback(
    (runId: string) => {
      dispatchProfile({ type: "profile/incrementScars", runId });
    },
    [dispatchProfile],
  );
}

/** Reset everything — both stores cleared, localStorage wiped. */
export function useResetAll() {
  const dispatchRun = useRunDispatch();
  const dispatchProfile = useProfileDispatch();
  return useCallback(() => {
    dispatchRun({ type: "run/clear" });
    dispatchProfile({ type: "profile/clear" });
  }, [dispatchRun, dispatchProfile]);
}
