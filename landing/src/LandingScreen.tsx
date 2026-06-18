import { useEffect, useState } from "react";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { EmailSignup } from "@/EmailSignup";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

const RECHART_INTERVAL_MS = 3000;

export function LandingScreen() {
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive("Sun");
  }, [setActive]);

  // Cycle a fresh random sample chart every few seconds so the canvas stays
  // alive — mirrors the client Title screen (TitleScreen.tsx). Only the
  // interval re-rolls it; hover and other state changes during the visit don't.
  const [chart, setChart] = useState<ChartType>(() => seededChart(randomSeed(), "Sample"));

  useEffect(() => {
    const id = window.setInterval(
      () => setChart(seededChart(randomSeed(), "Sample")),
      RECHART_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="title">
      <div className="title-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
      <div className="title-tagline">
        A fully-onchain astrological roguelike. Winter 2026.
      </div>
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
        <EmailSignup />
      </div>
    </div>
  );
}
