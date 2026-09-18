import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PlayerChartLayout } from "@/components/PlayerChartLayout";
import { PlanetBands } from "@/components/PlanetBands";
import { SettingsMenu } from "@/components/SettingsMenu";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { loadDevSettings } from "@/state/settings";
import { ROUTES } from "@/routes";
import { useCasting } from "./useCasting";

export interface GameLayoutContext {
  casting: ReturnType<typeof useCasting>;
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
}

const RECHART_INTERVAL_MS = 3000;

/** Owns the chart across both routes; activities own the adjacent content. */
export function GameLayout() {
  const { pathname } = useLocation();
  const prince = usePrince();
  const run = useActiveRun();
  const isTitle = pathname === ROUTES.title;
  const isCasting = !isTitle && (!prince || !run);
  const isEncounter = !isTitle && !!run?.encounter;
  const casting = useCasting(isCasting);
  const [sample, setSample] = useState(() => seededChart(randomSeed(), "Sample"));
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!isTitle || prince) return;
    const timer = window.setInterval(() => setSample(seededChart(randomSeed(), "Sample")), RECHART_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isTitle, prince]);

  useEffect(() => { setGuideOpen(false); }, [pathname, isEncounter]);

  const chart = isCasting ? casting.chart ?? sample : prince?.chart ?? sample;
  const unlocked = isCasting ? casting.revealedPlanets
    : prince ? unlockedPlanets(prince.numEncounters, loadDevSettings().unlockAll) : PLANETS;
  const context: GameLayoutContext = { casting, guideOpen, setGuideOpen };

  const surface = isTitle ? "title" : isCasting ? "mint-screen" : run?.encounter?.kind ?? "map-screen";

  return (
    <>
      <PlayerChartLayout
        className={surface}
        chart={chart}
        state={isCasting ? undefined : run?.state}
        unlockedPlanets={unlocked}
        mode={isCasting ? "passive" : prince ? "inspect" : "preview"}
        disabled={!isTitle && guideOpen}
        activePlanet={isCasting && !casting.ghosted ? casting.currentRevealing : null}
        hideAffliction={isTitle || isCasting}
      >
        {isCasting && <PlanetBands on={casting.bandsOn} current={casting.bandsCurrent} />}
        <Outlet context={context} />
      </PlayerChartLayout>
      <SettingsMenu key={pathname} />
    </>
  );
}
