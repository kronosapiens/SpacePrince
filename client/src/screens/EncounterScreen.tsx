import { usePrince, usePrinceDispatch, useActiveRun, useRunChart } from "@/state/PrinceStore";
import { useInfoCards } from "@/state/InfoCardContext";
import { useCommitTurn } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { thresholdCrossedBy } from "@/game/unlocks";
import { isOver } from "@/game/run";
import { EncounterRelationalScreen } from "./EncounterRelational";
import { EncounterNarrativeScreen } from "./EncounterNarrative";

/** The encounter surface — relational or narrative, driven by the active run's
 *  `encounter`. Both kinds resolve against the real Prince store. */
export function EncounterScreen() {
  const prince = usePrince();
  const run = useActiveRun();
  const chart = useRunChart();
  const dispatch = usePrinceDispatch();
  const commitTurn = useCommitTurn();
  const { enqueueCard } = useInfoCards();
  const settings = loadDevSettings();

  // PlaySurface only renders this for a run with a live encounter.
  if (!prince || !run || !chart || !run.encounter) return null;
  const enc = run.encounter;

  // Clearing the encounter returns to the map, including when the run ends.
  // The lifetime layer
  // advances HERE, on leaving a resolved encounter — never mid-surface, so a
  // new planet can't pop in un-ghosted during the final turn's playback.
  // Crossing a Macrobian threshold queues the planet introduction, and ending
  // the run queues the card its star arrives on, after any introduction; both
  // present over the next stable surface (InfoCardHost).
  const clearEncounter = () => {
    const counted = enc.resolved && enc.kind === "relational";
    const count = prince.numRelationalEncounters + (counted ? 1 : 0);
    const cleared = { ...run, encounter: null };
    if (counted) {
      const crossed = thresholdCrossedBy(prince.numRelationalEncounters, count);
      if (crossed) enqueueCard({ kind: "planet-intro", planet: crossed });
      dispatch({ kind: "incrementRelationalEncounters" });
    }
    // Judged at the new count: a planet unlocked here can keep the run going.
    if (isOver(cleared, prince.chart, count)) enqueueCard({ kind: "run-star", runId: run.id });
    dispatch({ kind: "commitRun", run: cleared });
  };

  if (enc.kind === "relational") {
    return (
      <EncounterRelationalScreen
        run={run}
        prince={prince}
        encounter={enc}
        onCommitTurn={(planet, valence, rng) => commitTurn(run, chart, planet, valence, rng)}
        onClearEncounter={clearEncounter}
        devUnlockAll={settings.unlockAll}
      />
    );
  }
  return (
    <EncounterNarrativeScreen
      run={run}
      prince={prince}
      encounter={enc}
      onCommit={(nextRun) => dispatch({ kind: "commitRun", run: nextRun })}
      devUnlockAll={settings.unlockAll}
      onClearEncounter={clearEncounter}
    />
  );
}
