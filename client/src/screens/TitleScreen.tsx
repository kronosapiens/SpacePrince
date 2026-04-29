import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { useProfile } from "@/state/ProfileStore";
import { useRun } from "@/state/RunStore";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { unlockedPlanets } from "@/game/unlocks";
import { loadDevSettings } from "@/state/settings";
import { seededChart } from "@/game/chart";
import { hashString } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

// Stable sample chart for visitors who haven't minted yet — same chart every
// time so the lobby presents a consistent sample of what a Prince looks like.
const SAMPLE_CHART_SEED = hashString("space-prince-sample-v1");

export function TitleScreen() {
  const navigate = useNavigate();
  const profile = useProfile();
  const run = useRun();
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive("Sun"); // ceremonial gold tint on Title
  }, [setActive]);

  const sampleChart: ChartType = useMemo(
    () => seededChart(SAMPLE_CHART_SEED, "Sample"),
    [],
  );

  const settings = loadDevSettings();
  const chart = profile?.chart ?? sampleChart;
  const unlocked = profile
    ? unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll)
    : []; // unused when allActive is on
  const beginLabel = run && !run.over ? "Start" : "Begin";
  const handleBegin = () => navigate(profile ? ROUTES.map : ROUTES.start);

  return (
    <div className="title">
      <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
      <div className="title-stage">
        <div className="title-chart">
          <Chart
            chart={chart}
            unlockedPlanets={unlocked}
            allActive
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
