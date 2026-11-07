import { useEffect, useState } from "react";
import { ChorusCard } from "@/components/ChorusCard";
import { chorusRuler, selectChorusPassage, type ChorusPassage } from "@/copy/chorus";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { InfoCardHost } from "@/components/InfoCardHost";
import { StartScreen } from "./StartScreen";
import { MapScreen } from "./MapScreen";
import { EncounterScreen } from "./EncounterScreen";
import { useOutletContext } from "react-router-dom";
import type { GameLayoutContext } from "./GameLayout";
import type { EncounterState } from "@/game/types";

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
  const { openingActive } = useOutletContext<GameLayoutContext>();
  if (!prince || !run) return <StartScreen />;
  if (run.encounter) return <EncounterOpening key={run.encounter.id} encounter={run.encounter} />;
  // The map is the stable surface — queued info cards (e.g. a planet
  // introduction earned by the encounter just cleared) present here.
  return (
    <>
      <MapScreen />
      {!openingActive && <InfoCardHost />}
    </>
  );
}

/** A fresh encounter mount, including reload, gets a new presentation-only draw. */
function EncounterOpening({ encounter }: { encounter: EncounterState }) {
  const planet = chorusRuler(encounter);
  const [passage, setPassage] = useState<ChorusPassage | null>(() => selectChorusPassage(planet));
  useEffect(() => {
    if (passage) return;
    const frame = requestAnimationFrame(() => {
      if (!document.querySelector('[role="dialog"]')) {
        document.querySelector<HTMLElement>(".chart-layout")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [passage]);
  if (!passage) return <EncounterScreen />;
  return <ChorusCard planet={planet} passage={passage} kind={encounter.kind}
    onContinue={() => setPassage(null)} />;
}
