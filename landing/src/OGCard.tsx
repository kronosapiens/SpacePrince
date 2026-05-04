import { useEffect, useState } from "react";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { Chart } from "@/components/Chart";
import { PLANETS } from "@/game/data";
import { seededChart } from "@/game/chart";
import type { Chart as ChartType } from "@/game/types";
import "@/style/og.css";

/** Social-card layout sized to exactly 1200×630 (Open Graph standard).
 *  Visit /#og in the dev server to render this for screenshot capture.
 *  Output is saved to public/og.png and referenced from index.html. */
export function OGCard() {
  const { setActive } = useActivePlanet();
  useEffect(() => { setActive("Sun"); }, [setActive]);

  // Fixed seed so the OG card is deterministic — re-runs produce the same chart.
  const [chart] = useState<ChartType>(() => seededChart(0xCAFEBABE, "OG"));

  return (
    <div className="og-card">
      <div className="og-card-text">
        <div className="og-card-wordmark">SPACE&nbsp;&nbsp;PRINCE</div>
        <div className="og-card-tagline">
          A fully-onchain astrological roguelike.
          <br />
          Winter 2026.
        </div>
      </div>
      <div className="og-card-chart">
        <Chart
          chart={chart}
          unlockedPlanets={PLANETS}
          hoveredPlanet={null}
          onPlanetHover={() => {}}
          hideAfflictionBadges
          showColorField
        />
      </div>
    </div>
  );
}
