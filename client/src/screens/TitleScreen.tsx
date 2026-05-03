import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { useRun } from "@/state/RunStore";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

export function TitleScreen() {
  const navigate = useNavigate();
  const run = useRun();
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive("Sun"); // ceremonial gold tint on Title
  }, [setActive]);

  // Fresh random sample chart per mount — i.e. per page refresh. State
  // changes during the visit (hover, etc.) shouldn't re-roll the chart.
  // useState initializer captures it once and holds it for the lifetime
  // of this Title mount.
  const [chart] = useState<ChartType>(() => seededChart(randomSeed(), "Sample"));

  const beginLabel = run && !run.over ? "Start" : "Begin";
  const handleBegin = () => navigate(ROUTES.start);

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
