import { useEffect, useRef } from "react";
import { ChorusCard } from "@/components/ChorusCard";
import { chorusRuler } from "@/copy/chorus";
import { usePrince, useActiveRun, usePrinceDispatch } from "@/state/PrinceStore";
import { InfoCardHost } from "@/components/InfoCardHost";
import { StartScreen } from "./StartScreen";
import { MapScreen } from "./MapScreen";
import { EncounterScreen } from "./EncounterScreen";
import { useOutletContext } from "react-router-dom";
import type { GameLayoutContext } from "./GameLayout";

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
  const dispatch = usePrinceDispatch();
  const pending = !!run?.encounter?.chorus;
  const wasPending = useRef(pending);
  useEffect(() => {
    const reveal = wasPending.current && !pending;
    wasPending.current = pending;
    if (!reveal) return;
    const frame = requestAnimationFrame(() => {
      if (!document.querySelector('[role="dialog"]')) {
        document.querySelector<HTMLElement>(".chart-layout")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pending]);
  const { openingActive } = useOutletContext<GameLayoutContext>();
  if (!prince || !run) return <StartScreen />;
  if (run.encounter?.chorus) {
    const { chorus, ...encounter } = run.encounter;
    return <ChorusCard planet={chorusRuler(encounter)} passage={chorus} kind={encounter.kind}
      onContinue={() => dispatch({ kind: "commitRun", run: { ...run, encounter } })} />;
  }
  if (run.encounter) return <EncounterScreen />;
  // The map is the stable surface — queued info cards (e.g. a planet
  // introduction earned by the encounter just cleared) present here.
  return (
    <>
      <MapScreen />
      {!openingActive && <InfoCardHost />}
    </>
  );
}
