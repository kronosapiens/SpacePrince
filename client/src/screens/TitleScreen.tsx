import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { isOver } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

const RECHART_INTERVAL_MS = 3000;

export function TitleScreen() {
  const navigate = useNavigate();
  const prince = usePrince();
  const run = useActiveRun();
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    // Neutral bone glow on Title — clear any planet tint carried in from
    // another screen so the background falls back to the resting neutral.
    setActive(null);
  }, [setActive]);

  // Cycle a fresh random sample chart every few seconds so the Title canvas
  // stays alive. Only the interval re-rolls it — hover and other state changes
  // during the visit don't.
  const [chart, setChart] = useState<ChartType>(() => seededChart(randomSeed(), "Sample"));

  useEffect(() => {
    const id = window.setInterval(
      () => setChart(seededChart(randomSeed(), "Sample")),
      RECHART_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  // A live run (tail, not over) lets the player resume; otherwise mint a new one.
  const hasLiveRun = !!(prince && run && !isOver(run, prince.numEncounters));
  const beginLabel = hasLiveRun ? "Continue" : "Begin";
  const handleBegin = () => navigate(hasLiveRun ? ROUTES.map : ROUTES.start);

  return (
    <div className="title">
      <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
      <div className="title-stage">
        <div className="title-chart">
          <Chart
            chart={chart}
            unlockedPlanets={PLANETS}
            hoveredPlanet={hovered}
            onPlanetHover={setHovered}
            hideAfflictionBadges
            showColorField
          />
        </div>
      </div>
      <div className="title-foot">
        <button className="begin-btn" onClick={handleBegin} type="button">
          {beginLabel}
        </button>
      </div>
    </div>
  );
}
