import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadDevSettings } from "@/state/settings";
import { EncounterNarrativeScreen } from "./EncounterNarrative";
import {
  generateSeedHash,
  getOrCreateDevProfile,
  makeDevNarrative,
  makeDevRun,
  seedFromHash,
  useDevHouseParam,
} from "@/state/dev-state";

/**
 * /narrative/:seed — dev-only route. Renders a fresh narrative encounter
 * deterministically from the URL hash. House selectable via `?house=N`.
 * Bare /narrative redirects to /narrative/<random-hash>.
 * In normal mode redirects to /title.
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

  if (!settings.devModeActive) {
    return <Navigate to={ROUTES.title} replace />;
  }
  if (!seedHash) return null;

  const seed = seedFromHash(seedHash);
  const profile = getOrCreateDevProfile();
  const run = makeDevRun(seed, profile);
  const encounter = makeDevNarrative(seed, house, run.seenFragmentIds);
  const runWithEnc = { ...run, currentEncounter: encounter };

  return (
    <EncounterNarrativeScreen
      run={runWithEnc}
      profile={profile}
      encounter={encounter}
      setRun={() => {}}
      setProfile={() => {}}
    />
  );
}
