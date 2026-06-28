import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadDevSettings } from "@/state/settings";
import { EncounterNarrativeScreen, type CommitNarrativeArgs } from "./EncounterNarrative";
import {
  generateSeedHash,
  getOrCreateDevProfile,
  makeDevNarrative,
  makeDevRun,
  seedFromHash,
  useDevHouseParam,
} from "@/state/dev-state";
import type { Run } from "@/game/types";

/**
 * /narrative/:seed — dev-only route. Renders a narrative encounter
 * deterministically from the URL hash. House selectable via `?house=N`.
 * Bare /narrative redirects to /narrative/<random-hash>.
 * In normal mode redirects to /title.
 *
 * Holds the run in local state (no global dispatch) so commits actually advance
 * nodes and move affliction/Distance — mirrors DevCombatScreen.
 */
export function NarrativeRoute() {
  const settings = loadDevSettings();
  const navigate = useNavigate();
  const { seed: seedHash } = useParams<{ seed?: string }>();
  const house = useDevHouseParam();

  useEffect(() => {
    if (settings.devModeActive && !seedHash) {
      const houseSuffix = house ? `?house=${house}` : "";
      navigate(`${ROUTES.narrative}/${generateSeedHash()}${houseSuffix}`, { replace: true });
    }
  }, [settings.devModeActive, seedHash, house, navigate]);

  const seed = seedHash ? seedFromHash(seedHash) : 0;
  const prince = useMemo(() => getOrCreateDevProfile(), []);
  const baseRun = useMemo(() => makeDevRun(seed), [seed]);
  const encounter = useMemo(
    () => makeDevNarrative(seed, house, baseRun.seenFragmentIds),
    [seed, house, baseRun.seenFragmentIds],
  );
  const [run, setRun] = useState<Run>(() => ({ ...baseRun, encounter }));

  // Reset the live run when seed/house changes (Reroll → new hash).
  useEffect(() => {
    setRun({ ...baseRun, encounter });
  }, [baseRun, encounter]);

  const onCommit = useCallback((args: CommitNarrativeArgs) => setRun(args.nextRun), []);
  const onClearEncounter = useCallback(
    () => setRun((prev) => ({ ...prev, encounter: null })),
    [],
  );

  if (!settings.devModeActive) return <Navigate to={ROUTES.title} replace />;
  if (!seedHash) return null;

  // Drive the screen off the live run so post-commit updates flow through;
  // fall back to the seed-built encounter on the first frame.
  const liveEncounter =
    run.encounter && run.encounter.kind === "narrative"
      ? run.encounter
      : encounter;

  return (
    <EncounterNarrativeScreen
      run={run}
      prince={prince}
      encounter={liveEncounter}
      onCommit={onCommit}
      onClearEncounter={onClearEncounter}
    />
  );
}
