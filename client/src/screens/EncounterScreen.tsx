import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useCommitNarrative, useCommitTurn } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
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
  const settings = loadDevSettings();

  // PlaySurface only renders this for a run with a live encounter.
  if (!prince || !run || !run.encounter) return null;
  const enc = run.encounter;

  // Clearing the encounter returns the surface to Map — or to End if the run
  // ended (PlaySurface derives that from `isOver`).
  const clearEncounter = () =>
    dispatch({ kind: "commitRun", run: { ...run, encounter: null } });

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
        commitNarrative({ run, nextRun: args.nextRun, summary: args.summary, resolved: args.resolved })
      }
      onClearEncounter={clearEncounter}
    />
  );
}
