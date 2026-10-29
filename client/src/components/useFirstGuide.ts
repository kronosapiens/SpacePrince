import { useEffect, useRef } from "react";
import { useActiveRun, usePrince } from "@/state/PrinceStore";
import type { Prince, Run } from "@/game/types";

type GuideScreen = "map" | "combat" | "narrative";

/** Whether this Prince is meeting a screen for the first time, read off its
 *  state rather than stored: the map until its first encounter clears, each
 *  encounter kind until one resolves on its first run's first map. A first map
 *  that never offers a kind leaves that guide to its `?`. */
function firstSight(prince: Prince, run: Run, screen: GuideScreen): boolean {
  if (screen === "map") return prince.numEncounters === 0;
  return prince.runs.length === 1 && run.mapsCompleted === 0
    && !Object.values(run.map.outcomes).some((outcome) => outcome.kind === screen);
}

/** Opens a screen's guide by itself, once, the first time the Prince sees the
 *  screen — as soon as nothing else is playing (`ready`). */
export function useFirstGuide(screen: GuideScreen, ready: boolean, open: () => void) {
  const prince = usePrince();
  const run = useActiveRun();
  const first = !!prince && !!run && firstSight(prince, run, screen);
  const opened = useRef(false);
  useEffect(() => {
    if (!first || !ready || opened.current) return;
    opened.current = true;
    open();
  }, [first, ready, open]);
}
