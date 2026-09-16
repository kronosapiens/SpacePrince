import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { InfoCardHost } from "@/components/InfoCardHost";
import { StartScreen } from "./StartScreen";
import { MapScreen } from "./MapScreen";
import { EncounterScreen } from "./EncounterScreen";

/**
 * The whole game lives at /play as one **state-derived surface**: the screen is
 * a function of the Prince's active run, not the URL (SCREENS.md). Map and
 * Encounter follow run state — no navigation between them; only `/` ↔ `/play`
 * is a route change. A run-ending encounter stays on screen until cleared,
 * then the map remains visible with the finished chart.
 */
export function PlaySurface() {
  const prince = usePrince();
  const run = useActiveRun();
  if (!prince || !run) return <StartScreen />;
  if (run.encounter) return <EncounterScreen />;
  // The map is the stable surface — queued info cards (e.g. a planet
  // introduction earned by the encounter just cleared) present here.
  return (
    <>
      <MapScreen />
      <InfoCardHost />
    </>
  );
}
