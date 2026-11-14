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
import { useInfoCards, type InfoCardRef } from "@/state/InfoCardContext";
import { loadDevSettings } from "@/state/settings";
import { timings } from "@/svg/timings";
import { ROUTES } from "@/routes";
import { useCasting } from "./useCasting";

export interface GameLayoutContext {
  casting: ReturnType<typeof useCasting>;
  guideOpen: boolean;
  setGuideOpen: (open: boolean) => void;
  /** The map holds still: its Necessity opening is playing, or a queued card
   *  is waiting to open over it. */
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
  const isFraming = isCasting && casting.stage === "framing";
  const cycleSample = !prince && (isTitle || isFraming);
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
    if (!cycleSample) return;
    const timer = window.setInterval(reroll, RECHART_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [cycleSample, reroll]);

  const chart = isCasting ? casting.chart ?? sample : princeChart ?? sample;
  const unlocked = isFraming ? PLANETS : isCasting ? casting.revealedPlanets
    : prince ? unlockedPlanets(prince.numRelationalEncounters, loadDevSettings().unlockAll) : PLANETS;
  const emptyState = useMemo(blankSideState, []);
  const isMap = !isTitle && !isCasting && !isEncounter;
  const opening = useNecessityAnimation({
    id: run ? `${run.id}/${run.map.id}` : "",
    chart,
    state: run?.state ?? emptyState,
    necessity: run?.map.boundary?.necessity,
    uncombusts: run?.map.boundary?.uncombusts,
    enabled: isMap && run?.map.currentNodeId === ROOT_NODE_ID,
  });
  // A card queued on the way here (a planet's introduction) opens a moment
  // after the map is ready, and stays queued until it does, so leaving the
  // map first only postpones it.
  const { current: card } = useInfoCards();
  const [cardDue, setCardDue] = useState<InfoCardRef | null>(null);
  const cardReady = isMap && !opening.active && !!card;
  useEffect(() => {
    if (!cardReady) {
      setCardDue(null);
      return;
    }
    const timer = window.setTimeout(() => setCardDue(card), timings().arrival.card);
    return () => window.clearTimeout(timer);
  }, [cardReady, card]);
  const cardWaiting = isMap && !!card && cardDue !== card;
  const context: GameLayoutContext = {
    casting, guideOpen, setGuideOpen, openingActive: opening.active || cardWaiting,
  };

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
        disabled={opening.active || (!isTitle && (guideOpen || isEncounter))}
        activePlanet={isCasting ? casting.currentRevealing : null}
        hideResolveArc={isTitle || isCasting}
        onReroll={isTitle && !prince ? reroll : undefined}
      >
        {isCasting && <PlanetBands on={casting.bandsOn} current={casting.bandsCurrent} />}
        <Outlet context={context} />
      </PlayerChartLayout>
      <SettingsMenu key={pathname} />
    </>
  );
}
