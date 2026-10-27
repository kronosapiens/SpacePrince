import { useCallback } from "react";
import { usePrince, usePrinceDispatch } from "./PrinceStore";
import { resolveTurn, type TurnResult } from "@/game/turn";
import { beginRun, rolloverMap as rolloverMapFn } from "@/game/run";
import { randomSeed } from "@/game/rng";
import { loadDevSettings } from "./settings";
import type { Chart, PlanetName, Polarity, Run } from "@/game/types";

/**
 * Cross-cutting thunk hooks. These wrap impure work (RNG, time, computed
 * `nextRun` shapes) and dispatch the resolved state to the pure Prince reducer.
 * A run lives inside the Prince (STATE.md); these mutate the tail run.
 */

/** Append a fresh run to the Prince. Returns the run that was dispatched. */
export function useStartRun() {
  const prince = usePrince();
  const dispatch = usePrinceDispatch();
  const devUnlockAll = loadDevSettings().unlockAll;
  const lifetimeEncounterCount = prince?.numEncounters ?? 0;
  return useCallback(
    (seed: number = randomSeed()): Run => {
      if (!prince) throw new Error("A Prince is required to start a run");
      const run = beginRun(prince.chart, seed, lifetimeEncounterCount, devUnlockAll);
      dispatch({ kind: "startRun", run });
      return run;
    },
    [dispatch, prince, lifetimeEncounterCount, devUnlockAll],
  );
}

/** Resolve a combat turn and dispatch the result (`resolveTurn` records the
 *  NodeOutcome on the map when the encounter ends). The lifetime layer
 *  (`numEncounters` and any unlock ceremony) advances at encounter *clear*,
 *  not here — a planet must not unlock mid-surface (EncounterScreen). */
export function useCommitTurn() {
  const dispatch = usePrinceDispatch();
  return useCallback(
    (
      run: Run,
      playerChart: Chart,
      planet: PlanetName,
      valence: Polarity,
      rng: () => number,
    ): TurnResult | null => {
      const result = resolveTurn(run, playerChart, planet, valence, rng);
      if (!result) return null;
      dispatch({ kind: "commitRun", run: result.run });
      return result;
    },
    [dispatch],
  );
}

/** Roll over to a fresh map (terminal node reached). The fielded roster gates
 *  its combat rulers and feeds the boundary's uncombust rolls and necessity. */
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
