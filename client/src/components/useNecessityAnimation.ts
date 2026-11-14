import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { playNecessityNote } from "@/audio/engine";
import { chartRuler, cloneSideState } from "@/game/chart";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { PLANETS } from "@/game/data";
import { timings } from "@/svg/timings";
import type { Chart, MapBoundary, NecessityEntry, PlanetName, SideState } from "@/game/types";

export interface NecessityAnimationPresentation {
  phase: "revival" | "reveal" | "settle";
  entries: NecessityEntry[];
  revived?: PlanetName[];
}

interface NecessityAnimationInput {
  id: string;
  chart: Chart;
  state: SideState;
  necessity?: NecessityEntry[];
  uncombusts?: MapBoundary["uncombusts"];
  enabled: boolean;
}

interface Playback {
  id: string;
  state: SideState;
  opening: NecessityAnimationPresentation;
}

/** Presentation only: reconstruct the opening from committed results, never reroll it. */
export function useNecessityAnimation(input: NecessityAnimationInput): {
  active: boolean;
  state: SideState;
  opening: NecessityAnimationPresentation | undefined;
} {
  const latest = useRef(input);
  latest.current = input;
  const [playback, setPlayback] = useState<Playback | null>(null);
  const timers = useRef<number[]>([]);
  const cancelNote = useRef<(() => void) | null>(null);
  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    cancelNote.current?.();
    cancelNote.current = null;
  }, []);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const change = () => setReducedMotion(media.matches);
    change();
    media.addEventListener?.("change", change);
    return () => media.removeEventListener?.("change", change);
  }, []);

  useLayoutEffect(() => {
    const { id, chart, state, necessity = [], uncombusts = [] } = latest.current;
    const revived = PLANETS.filter((planet) => uncombusts.some((entry) => entry.planet === planet && entry.success));
    const ordered = PLANETS.flatMap((planet) => necessity.filter((entry) => entry.planet === planet));
    if (!input.enabled || reducedMotion || (!necessity.length && !revived.length)) {
      setPlayback(null);
      return;
    }
    const beforeNecessity = cloneSideState(state);
    for (const entry of necessity) beforeNecessity[entry.planet].tension -= entry.amount;
    const progress = cloneSideState(beforeNecessity);
    for (const planet of revived) progress[planet].tension = getEffectiveStatsFromPlacement(chart.planets[planet]).resolve;
    let elapsed = 0;
    const timing = timings().necessity;
    const noteDuration = (timing.reveal + timing.settle) / 1000;
    const show = (opening: NecessityAnimationPresentation) => {
      const snapshot = { id, state: cloneSideState(progress), opening };
      const present = () => {
        if (opening.phase === "reveal") {
          cancelNote.current?.();
          cancelNote.current = playNecessityNote(chartRuler(chart), opening.entries[0]!.planet, noteDuration);
        }
        setPlayback(snapshot);
      };
      if (elapsed === 0) present();
      else timers.current.push(window.setTimeout(present, elapsed));
    };
    for (const planet of revived) {
      show({ phase: "revival", entries: [], revived: [planet] });
      elapsed += timing.revival;
      progress[planet].tension = beforeNecessity[planet].tension;
    }
    for (const entry of ordered) {
      const opening = { entries: [entry] };
      show({ ...opening, phase: "reveal" });
      elapsed += timing.reveal;
      progress[entry.planet].tension = state[entry.planet].tension;
      show({ ...opening, phase: "settle" });
      elapsed += timing.settle;
    }
    timers.current.push(window.setTimeout(() => {
      clearTimers();
      setPlayback(null);
    }, elapsed));
    return clearTimers;
  }, [input.id, input.enabled, reducedMotion, clearTimers]);

  const current = input.enabled && !reducedMotion && playback?.id === input.id ? playback : null;
  return {
    active: current !== null,
    state: current?.state ?? input.state,
    opening: current?.opening,
  };
}
