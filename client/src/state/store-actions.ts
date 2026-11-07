import { useCallback } from "react";
import { useActiveRun, usePrince, usePrinceDispatch } from "./PrinceStore";
import { resolveTurn, type TurnResult } from "@/game/turn";
import { beginRun, enterNode, isOver, rolloverMap as rolloverMapFn } from "@/game/run";
import { hashString, mulberry32, randomSeed } from "@/game/rng";
import { loadDevSettings } from "./settings";
import { rollNodeContent } from "@/game/map-content";
import { unlockedPlanets } from "@/game/unlocks";
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
  const lifetimeRelationalEncounterCount = prince?.numRelationalEncounters ?? 0;
  return useCallback(
    (seed: number = randomSeed()): Run => {
      if (!prince) throw new Error("A Prince is required to start a run");
      const run = beginRun(prince.chart, seed, lifetimeRelationalEncounterCount, devUnlockAll);
      dispatch({ kind: "startRun", run });
      return run;
    },
    [dispatch, prince, lifetimeRelationalEncounterCount, devUnlockAll],
  );
}

/** Apply development overrides and commit initialized node entry. */
export function useEnterNode() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  return useCallback((nodeId: string) => {
    if (!prince || !run || run.encounter || isOver(run, prince.chart, prince.numRelationalEncounters)) return;
    const settings = loadDevSettings();
    let nextRun = run;
    if (settings.forceRelational || settings.forceNarrativeHouse) {
      const content = rollNodeContent({
        rng: mulberry32(hashString(`${run.map.seed}_${nodeId}`)),
        forceNarrativeHouse: settings.forceNarrativeHouse,
        forceRelational: settings.forceRelational,
        relationalRulers: unlockedPlanets(prince.numRelationalEncounters, settings.unlockAll),
      });
      nextRun = { ...run, map: { ...run.map, rolledNodes: { ...run.map.rolledNodes, [nodeId]: content } } };
    }
    nextRun = enterNode({
      run: nextRun,
      chart: prince.chart,
      nodeId,
      lifetimeRelationalEncounterCount: prince.numRelationalEncounters,
      devUnlockAll: settings.unlockAll,
    });
    if (!nextRun.encounter) return;
    dispatch({ kind: "commitRun", run: nextRun });
  }, [prince, run, dispatch]);
}

/** Resolve a relational turn and dispatch the result (`resolveTurn` records the
 *  NodeOutcome on the map when the encounter ends). The lifetime layer
 *  (`numRelationalEncounters` and any unlock ceremony) advances at encounter *clear*,
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
 *  its relational rulers and feeds the boundary's uncombust rolls and necessity. */
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
