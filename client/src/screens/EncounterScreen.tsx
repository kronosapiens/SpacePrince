import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useCommitNarrative, useCommitTurn } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { EncounterCombatScreen, type CommitTurnResult } from "./EncounterCombat";
import { EncounterNarrativeScreen } from "./EncounterNarrative";
import { resolveTurn } from "@/game/turn";
import {
  generateSeedHash,
  makeDevProfile,
  seedFromHash,
} from "@/state/dev-state";
import { beginRun } from "@/game/run";
import { beginCombatEncounter } from "@/game/encounter";
import type { CombatEncounter, PlanetName, Polarity, Run } from "@/game/types";

export function EncounterScreen() {
  const settings = loadDevSettings();
  if (settings.devModeActive) return <DevCombatScreen />;
  return <NormalEncounterScreen />;
}

function NormalEncounterScreen() {
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

/** /encounter in dev mode — fresh combat encounter per seed.
 *  Bare /encounter redirects to /encounter/<hash>; the hash drives the seed.
 *  Dev mode uses local state only — no dispatch to the global stores. */
function DevCombatScreen() {
  const navigate = useNavigate();
  const { seed: seedHash } = useParams<{ seed?: string }>();

  useEffect(() => {
    if (!seedHash) {
      navigate(`${ROUTES.encounter}/${generateSeedHash()}`, { replace: true });
    }
  }, [seedHash, navigate]);

  const seed = seedHash ? seedFromHash(seedHash) : 0;
  // Prince (player chart) is also seed-driven so Regenerate refreshes both
  // charts, not just the opponent's. `makeDevProfile` is pure (no storage),
  // so useMemo is StrictMode-safe.
  const prince = useMemo(() => makeDevProfile(seed), [seed]);
  // Build a clean, playable fight with the real run/encounter builders — turn 0,
  // distance 0, blank boards — not the synthetic mid-fight snapshot the static
  // preview screens use. So the turn counter and distance climb as you play.
  const baseRun = useMemo(() => beginRun(seed), [seed]);
  const encounter = useMemo(
    () =>
      beginCombatEncounter({
        run: baseRun,
        opponentSeed: seed,
        lifetimeEncounterCount: prince.numEncounters,
        devUnlockAll: true,
      }),
    [baseRun, seed, prince.numEncounters],
  );
  const [run, setRun] = useState<Run>({ ...baseRun, encounter });

  // Reset the in-memory run when seed changes (Reroll → new hash → remount via key).
  useEffect(() => {
    setRun({ ...baseRun, encounter });
  }, [baseRun, encounter]);

  const onCommitTurn = useCallback(
    (planet: PlanetName, valence: Polarity, rng: () => number): CommitTurnResult | null => {
      const result = resolveTurn(run, prince.chart, planet, valence, rng);
      if (!result || result.encounter.kind !== "combat") return null;
      const nextRun = result.run;
      setRun(nextRun);
      return {
        log: result.log,
        nextRun,
        encounter: result.encounter,
        encounterEnded: result.encounterEnded,
        runEnded: result.runEnded,
      };
    },
    [run, prince.chart],
  );

  const onClearEncounter = useCallback(() => {
    setRun((prev) => ({ ...prev, encounter: null }));
  }, []);

  if (!seedHash) return null;

  // Use the encounter on the current run so post-turn updates (turnIndex,
  // opponentState, log, resolved) actually flow into the screen. Falling back
  // to the seed-memoized encounter only on the very first render before the
  // run-reset effect has fired.
  const liveEncounter: CombatEncounter =
    run.encounter && run.encounter.kind === "combat"
      ? run.encounter
      : encounter;

  return (
    <EncounterCombatScreen
      run={run}
      prince={prince}
      encounter={liveEncounter}
      onCommitTurn={onCommitTurn}
      onClearEncounter={onClearEncounter}
      devUnlockAll
      devAnimationControls
    />
  );
}
