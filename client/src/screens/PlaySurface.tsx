import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { isOver } from "@/game/run";
import { StartScreen } from "./StartScreen";
import { MapScreen } from "./MapScreen";
import { EncounterScreen } from "./EncounterScreen";
import { EndOfRunScreen } from "./EndOfRunScreen";

/**
 * The whole game lives at /play as one **state-derived surface**: the screen is
 * a function of the Prince's active run, not the URL (SCREENS.md). Map →
 * Encounter → End all fall out of run state — no navigation between them; only
 * `/` ↔ `/play` is a route change. `encounter` takes precedence over `isOver`
 * so a run-ending combat stays on screen (showing its result) until cleared.
 */
export function PlaySurface() {
  const prince = usePrince();
  const run = useActiveRun();
  if (!prince || !run) return <StartScreen />;
  if (run.encounter) return <EncounterScreen />;
  if (isOver(run, prince.numEncounters)) return <EndOfRunScreen />;
  return <MapScreen />;
}
