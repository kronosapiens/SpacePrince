import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PlayerChartLayout } from "@/components/PlayerChartLayout";
import { PlanetBands } from "@/components/PlanetBands";
import { SettingsMenu } from "@/components/SettingsMenu";
import { PLANETS } from "@/game/data";
import { blankSideState, seededChart } from "@/game/chart";
import { ROOT_NODE_ID } from "@/game/map-gen";
import { useNecessityAnimation } from "@/components/useNecessityAnimation";
import { randomSeed } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { usePrince, useActiveRun, useRunChart } from "@/state/PrinceStore";
import { loadDevSettings } from "@/state/settings";
import { ROUTES } from "@/routes";
import { useCasting } from "./useCasting";

export interface GameLayoutContext {
  casting: ReturnType<typeof useCasting>;
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
  openingActive: boolean;
}

const RECHART_INTERVAL_MS = 3000;

/** Owns the chart across both routes; activities own the adjacent content. */
export function GameLayout() {
  const { pathname } = useLocation();
  const prince = usePrince();
  const run = useActiveRun();
  const princeChart = useRunChart();
  const isTitle = pathname === ROUTES.title;
  const isCasting = !isTitle && (!prince || !run);
  const isEncounter = !isTitle && !!run?.encounter;
  const casting = useCasting(isCasting);
  const [sample, setSample] = useState(() => seededChart(randomSeed(), "Sample"));
  const surface = isTitle ? "title" : isCasting ? "mint-screen" : run?.encounter?.kind ?? "map-screen";
  // The guide belongs to the surface it opened on, so leaving that surface
  // closes it — derived, not reset in an effect, which would run after the
  // screen's own effects and close a guide the screen opens on arrival.
  const [guideSurface, setGuideSurface] = useState<string | null>(null);
  const guideOpen = guideSurface === surface;
  const setGuideOpen = useCallback((open: boolean) => setGuideSurface(open ? surface : null), [surface]);
  const reroll = useCallback(() => setSample(seededChart(randomSeed(), "Sample")), []);

  useEffect(() => {
    if (!isTitle || prince) return;
    const timer = window.setInterval(reroll, RECHART_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isTitle, prince, reroll]);

  const chart = isCasting ? casting.chart ?? sample : princeChart ?? sample;
  const unlocked = isCasting ? casting.revealedPlanets
    : prince ? unlockedPlanets(prince.numEncounters, loadDevSettings().unlockAll) : PLANETS;
  const emptyState = useMemo(blankSideState, []);
  const opening = useNecessityAnimation({
    id: run ? `${run.id}/${run.map.id}` : "",
    chart,
    state: run?.state ?? emptyState,
    necessity: run?.map.boundary?.necessity,
    uncombusts: run?.map.boundary?.uncombusts,
    enabled: !isTitle && !isCasting && !isEncounter && run?.map.currentNodeId === ROOT_NODE_ID,
    kind: "map",
  });
  const context: GameLayoutContext = { casting, guideOpen, setGuideOpen, openingActive: opening.active };

  return (
    <>
      <PlayerChartLayout
        className={surface}
        chart={chart}
        state={isCasting ? undefined : opening.state}
        opening={opening.opening}
        unlockedPlanets={unlocked}
        mode={isCasting ? "passive" : prince ? "inspect" : "preview"}
        invite={isTitle}
        disabled={opening.active || (!isTitle && guideOpen)}
        activePlanet={isCasting ? casting.currentRevealing : null}
        hideAffliction={isTitle || isCasting}
        onReroll={isTitle && !prince ? reroll : undefined}
      >
        {isCasting && <PlanetBands on={casting.bandsOn} current={casting.bandsCurrent} />}
        <Outlet context={context} />
      </PlayerChartLayout>
      <SettingsMenu key={pathname} />
    </>
  );
}
