import { Navigate } from "react-router-dom";
import { ROUTES } from "@/routes";
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

  if (!prince) return <Navigate to={ROUTES.title} replace />;
  if (!run) return <Navigate to={ROUTES.title} replace />;
  const enc = run.encounter;
  if (!enc) return <Navigate to={ROUTES.map} replace />;

  // Clearing the encounter = commit the tail run with no live encounter.
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
