import { useEffect, useRef } from "react";
import { useActiveRun, usePrince } from "@/state/PrinceStore";
import { timings } from "@/svg/timings";
import type { Prince, Run } from "@/game/types";

type GuideScreen = "map" | "relational" | "narrative";

/** Whether this Prince is meeting a screen for the first time, read off its
 *  state rather than stored: the map until its first encounter clears, each
 *  encounter kind until one resolves on its first run's first map. A first map
 *  that never offers a kind leaves that guide to its `?`. */
function firstSight(prince: Prince, run: Run, screen: GuideScreen): boolean {
  if (screen === "map") return prince.numRelationalEncounters === 0 && prince.runs.length === 1 && run.mapsCompleted === 0
    && Object.keys(run.map.outcomes).length === 0;
  return prince.runs.length === 1 && run.mapsCompleted === 0
    && !Object.values(run.map.outcomes).some((outcome) => outcome.kind === screen);
}

/** Opens a screen's guide by itself, once, the first time the Prince sees the
 *  screen — a moment after nothing else is playing (`ready`), so the screen is
 *  seen bare first. Losing `ready` during that moment starts it over. */
export function useFirstGuide(screen: GuideScreen, ready: boolean, open: () => void) {
  const prince = usePrince();
  const run = useActiveRun();
  const first = !!prince && !!run && firstSight(prince, run, screen);
  const opened = useRef(false);
  const latestOpen = useRef(open);
  latestOpen.current = open;
  useEffect(() => {
    if (!first || !ready || opened.current) return;
    const timer = window.setTimeout(() => {
      opened.current = true;
      latestOpen.current();
    }, timings().arrival.guide);
    return () => window.clearTimeout(timer);
  }, [first, ready]);
}
