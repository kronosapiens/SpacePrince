import { Navigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadDevSettings } from "@/state/settings";
import { EncounterNarrativeScreen } from "./EncounterNarrative";
import {
  getOrCreateDevProfile,
  makeDevNarrative,
  makeDevRun,
  useDevHouseParam,
  useDevSeed,
} from "@/state/dev-state";

/**
 * /narrative — dev-only route. Renders a fresh narrative encounter on each
 * visit. House selectable via `?house=N`. In normal mode redirects to /title.
 */
export function NarrativeRoute() {
  const settings = loadDevSettings();
  const seed = useDevSeed();
  const house = useDevHouseParam();

  if (!settings.devModeActive) {
    return <Navigate to={ROUTES.title} replace />;
  }

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
