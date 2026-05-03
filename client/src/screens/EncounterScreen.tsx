import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/routes";
import { useProfile } from "@/state/ProfileStore";
import { useRun, useRunDispatch } from "@/state/RunStore";
import { useCommitNarrative, useCommitTurn } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { EncounterCombatScreen, type CommitTurnResult } from "./EncounterCombat";
import { EncounterNarrativeScreen } from "./EncounterNarrative";
import { resolveTurn } from "@/game/turn";
import {
  generateSeedHash,
  makeDevProfile,
  makeDevCombat,
  makeDevRun,
  seedFromHash,
} from "@/state/dev-state";
import type { CombatEncounter, PlanetName, RunState } from "@/game/types";

export function EncounterScreen() {
  const settings = loadDevSettings();
  if (settings.devModeActive) return <DevCombatScreen />;
  return <NormalEncounterScreen />;
}

function NormalEncounterScreen() {
  const profile = useProfile();
  const run = useRun();
  const dispatchRun = useRunDispatch();
  const commitTurn = useCommitTurn();
  const commitNarrative = useCommitNarrative();
  const settings = loadDevSettings();

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  if (!run) return <Navigate to={ROUTES.title} replace />;
  const enc = run.currentEncounter;
  if (!enc) return <Navigate to={ROUTES.map} replace />;

  if (enc.kind === "combat") {
    return (
      <EncounterCombatScreen
        run={run}
        profile={profile}
        encounter={enc}
        onCommitTurn={(planet, rng) => commitTurn(run, profile.chart, planet, rng)}
        onClearEncounter={() => dispatchRun({ type: "run/clearEncounter" })}
        devUnlockAll={settings.unlockAll}
      />
    );
  }
  return (
    <EncounterNarrativeScreen
      run={run}
      profile={profile}
      encounter={enc}
      onCommit={(args) =>
        commitNarrative({ run, nextRun: args.nextRun, summary: args.summary, resolved: args.resolved })
      }
      onClearEncounter={() => dispatchRun({ type: "run/clearEncounter" })}
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
  // Profile (player chart) is also seed-driven so Regenerate refreshes both
  // charts, not just the opponent's. `makeDevProfile` is pure (no storage),
  // so useMemo is StrictMode-safe.
  const profile = useMemo(() => makeDevProfile(seed), [seed]);
  const baseRun = useMemo(() => makeDevRun(seed, profile), [seed, profile]);
  const encounter = useMemo(() => makeDevCombat(seed, profile), [seed, profile]);
  const [run, setRun] = useState<RunState>({ ...baseRun, currentEncounter: encounter });

  // Reset the in-memory run when seed changes (Reroll → new hash → remount via key).
  useEffect(() => {
    setRun({ ...baseRun, currentEncounter: encounter });
  }, [baseRun, encounter]);

  const onCommitTurn = useCallback(
    (planet: PlanetName, rng: () => number): CommitTurnResult | null => {
      const result = resolveTurn(run, profile.chart, planet, rng);
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
    [run, profile.chart],
  );

  const onClearEncounter = useCallback(() => {
    setRun((prev) => ({ ...prev, currentEncounter: null }));
  }, []);

  if (!seedHash) return null;

  // Use the encounter on the current run so post-turn updates (turnIndex,
  // opponentState, log, resolved) actually flow into the screen. Falling back
  // to the seed-memoized encounter only on the very first render before the
  // run-reset effect has fired.
  const liveEncounter: CombatEncounter =
    run.currentEncounter && run.currentEncounter.kind === "combat"
      ? run.currentEncounter
      : encounter;

  return (
    <EncounterCombatScreen
      run={run}
      profile={profile}
      encounter={liveEncounter}
      onCommitTurn={onCommitTurn}
      onClearEncounter={onClearEncounter}
      devUnlockAll
    />
  );
}
