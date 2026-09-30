import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { playNecessityNote } from "@/audio/engine";
import { chartRuler, cloneSideState } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import type { Chart, MapBoundary, NecessityEntry, PlanetName, SideState } from "@/game/types";

export interface NecessityAnimationPresentation {
  phase: "accent" | "revival" | "necessity" | "fortune" | "settle";
  entries: NecessityEntry[];
  revived?: PlanetName[];
}

export const NECESSITY_ANIMATION_TIMINGS = {
  map: { accent: 250, necessity: 350, fortune: 250, settle: 150 },
  encounter: { accent: 250, necessity: 350, fortune: 250, settle: 150 },
  revival: 500,
} as const;

interface NecessityAnimationInput {
  id: string;
  chart: Chart;
  state: SideState;
  necessity?: NecessityEntry[];
  uncombusts?: MapBoundary["uncombusts"];
  enabled: boolean;
  kind: "map" | "encounter";
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
  skip: () => void;
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
  const skip = useCallback(() => {
    clearTimers();
    setPlayback(null);
  }, [clearTimers]);
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
    const { id, chart, state, necessity = [], uncombusts = [], kind } = latest.current;
    const revived = PLANETS.filter((planet) => uncombusts.some((entry) => entry.planet === planet && entry.success));
    const ordered = PLANETS.flatMap((planet) => necessity.filter((entry) => entry.planet === planet));
    if (!input.enabled || reducedMotion || (!necessity.length && !revived.length)) {
      setPlayback(null);
      return;
    }
    const beforeNecessity = cloneSideState(state);
    for (const entry of necessity) beforeNecessity[entry.planet].affliction -= entry.amount;
    const progress = cloneSideState(beforeNecessity);
    for (const planet of revived) progress[planet].affliction = combustionCeiling(chart.planets[planet]);
    let elapsed = 0;
    const timing = NECESSITY_ANIMATION_TIMINGS[kind];
    const noteDuration = (timing.accent + timing.necessity + timing.fortune + timing.settle) / 1000;
    const show = (opening: NecessityAnimationPresentation) => {
      const snapshot = { id, state: cloneSideState(progress), opening };
      const present = () => {
        if (opening.phase === "accent") {
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
      elapsed += NECESSITY_ANIMATION_TIMINGS.revival;
      progress[planet].affliction = beforeNecessity[planet].affliction;
    }
    for (const entry of ordered) {
      const opening = { entries: [entry] };
      show({ ...opening, phase: "accent" });
      elapsed += timing.accent;
      show({ ...opening, phase: "necessity" });
      elapsed += timing.necessity;
      show({ ...opening, phase: "fortune" });
      elapsed += timing.fortune;
      progress[entry.planet].affliction = state[entry.planet].affliction;
      show({ ...opening, phase: "settle" });
      elapsed += timing.settle;
    }
    timers.current.push(window.setTimeout(skip, elapsed));
    return clearTimers;
  }, [input.id, input.enabled, reducedMotion, clearTimers, skip]);

  const current = input.enabled && !reducedMotion && playback?.id === input.id ? playback : null;
  const active = current !== null;
  useLayoutEffect(() => {
    if (!active) return;
    const consume = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      skip();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") consume(event);
    };
    document.addEventListener("click", consume, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("click", consume, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [active, skip]);
  return {
    active,
    state: current?.state ?? input.state,
    opening: current?.opening,
    skip,
  };
}
