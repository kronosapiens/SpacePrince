import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { useStartRun } from "@/state/store-actions";
import { setTheme } from "@/audio/engine";
import { isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { ChartInspection } from "@/components/ChartInspection";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import type { Chart as ChartType, PlanetName } from "@/game/types";

const RECHART_INTERVAL_MS = 3000;
const TITLE_FADE_MS = 420; // matches the .title opacity transition (layout.css)

export function TitleScreen() {
  const navigate = useNavigate();
  const prince = usePrince();
  const run = useActiveRun();
  const startRun = useStartRun();
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [leaving, setLeaving] = useState(false);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    // Neutral bone glow on Title — clear any planet tint carried in from
    // another screen so the background falls back to the resting neutral.
    // The score fades out too: the Title is arrival, not a surface.
    setActive(null);
    setTheme(null);
  }, [setActive]);

  // New visitors see sample charts; returning players keep their own Prince.
  const [chart, setChart] = useState<ChartType>(() => seededChart(randomSeed(), "Sample"));

  useEffect(() => {
    if (prince) return;
    const id = window.setInterval(
      () => setChart(seededChart(randomSeed(), "Sample")),
      RECHART_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [prince]);

  // Continue resumes a live (non-over) run; Begin starts a new run on the same
  // Prince — identity persists, the lifetime layer accumulates (SCREENS §9.2).
  // A player with no Prince falls through to the mint at /play; wiping identity
  // is dev-only (DevConsole). Which surface /play shows is derived from run
  // state by PlaySurface — the Title just routes there.
  const hasLiveRun = !!(prince && run && !isOver(run, prince.chart, prince.numEncounters));
  const label = hasLiveRun ? "Continue" : "Begin";
  const handleBegin = () => {
    if (leaving) return;
    if (prince && !hasLiveRun) startRun();
    setLeaving(true); // fade out, then hand off to /play
    window.setTimeout(() => navigate(ROUTES.play), TITLE_FADE_MS);
  };

  return (
    <div className={`chart-layout title ${leaving ? "is-leaving" : ""}`}>
      <div className="chart-layout-chart title-chart">
        {prince ? (
          <ChartInspection
            chart={prince.chart}
            state={run?.state}
            unlockedPlanets={unlockedPlanets(prince.numEncounters)}
          />
        ) : (
          <Chart
            chart={chart}
            unlockedPlanets={PLANETS}
            hoveredPlanet={hovered}
            onPlanetHover={setHovered}
            hideAffliction
            showColorField
          />
        )}
      </div>
      <div className="chart-layout-content title-content">
        <h1 className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</h1>
        <button className="begin-btn" onClick={handleBegin} type="button">
          {label}
        </button>
      </div>
    </div>
  );
}
