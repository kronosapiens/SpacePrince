import { useCallback, useEffect, useState } from "react";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { EmailSignup } from "@/EmailSignup";
import { WordmarkGlow } from "@/components/WordmarkGlow";
import { MusicButton } from "@/components/MusicButton";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Chart as ChartType, PlanetName } from "@/game/types";

const RECHART_INTERVAL_MS = 3000;

export function LandingScreen() {
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  // Cycle a fresh random sample chart every few seconds so the canvas stays
  // alive — mirrors the client Title screen. Clicking also rolls a fresh chart.
  // The first chart is fixed so the prerendered HTML matches hydration; it
  // shares the OG card's seed, so the page opens on the social preview's chart.
  const [chart, setChart] = useState<ChartType>(() => seededChart(0xCAFEBABE, "Sample"));
  const reroll = useCallback(() => {
    setHovered(null);
    setChart(seededChart(randomSeed(), "Sample"));
  }, []);

  useEffect(() => {
    const id = window.setInterval(reroll, RECHART_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reroll]);

  return (
    <div className="title">
      <div className="title-wordmark">
        <WordmarkGlow />
        SPACE&nbsp;&nbsp;PRINCE
      </div>
      <div className="title-tagline">
        A fully-onchain astrological roguelike. Winter 2026.
      </div>
      <div className="title-stage">
        <button type="button" className="title-chart" onClick={reroll} aria-label="Reroll chart">
          <Chart
            chart={chart}
            hoveredPlanet={hovered}
            onPlanetHover={setHovered}
          />
        </button>
        <MusicButton />
      </div>
      <div className="title-foot">
        <EmailSignup />
      </div>
    </div>
  );
}
