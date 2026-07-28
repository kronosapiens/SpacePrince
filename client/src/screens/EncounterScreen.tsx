import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useInfoCards } from "@/state/InfoCardContext";
import { useCommitNarrative, useCommitTurn } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { thresholdCrossedBy } from "@/game/unlocks";
import { EncounterCombatScreen } from "./EncounterCombat";
import { EncounterNarrativeScreen } from "./EncounterNarrative";

/** The encounter surface — combat or narrative, driven by the active run's
 *  `encounter`. Both kinds resolve against the real Prince store. */
export function EncounterScreen() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const commitTurn = useCommitTurn();
  const commitNarrative = useCommitNarrative();
  const { enqueueCard } = useInfoCards();
  const settings = loadDevSettings();

  // PlaySurface only renders this for a run with a live encounter.
  if (!prince || !run || !run.encounter) return null;
  const enc = run.encounter;

  // Clearing the encounter returns the surface to Map — or to End if the run
  // ended (PlaySurface derives that from `isOver`). The lifetime layer
  // advances HERE, on leaving a resolved encounter — never mid-surface, so a
  // new planet can't pop in un-ghosted during the final turn's playback.
  // Crossing a Macrobian threshold queues the planet introduction, which
  // presents over the next stable surface (InfoCardHost).
  const clearEncounter = () => {
    if (enc.resolved) {
      const crossed = thresholdCrossedBy(prince.numEncounters, prince.numEncounters + 1);
      if (crossed) enqueueCard({ kind: "planet-intro", planet: crossed });
      dispatch({ kind: "incrementEncounters" });
    }
    dispatch({ kind: "commitRun", run: { ...run, encounter: null } });
  };

  if (enc.kind === "combat") {
    return (
      <EncounterCombatScreen
        run={run}
        prince={prince}
        encounter={enc}
        onCommitTurn={(planet, valence, rng) => commitTurn(run, prince.chart, planet, valence, rng)}
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
      onCommit={(args) =>
        commitNarrative({ run, nextRun: args.nextRun, chart: prince.chart, summary: args.summary, resolved: args.resolved })
      }
      onClearEncounter={clearEncounter}
    />
  );
}
