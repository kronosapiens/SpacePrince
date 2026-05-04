import { useEffect, useState } from "react";
import { Chart } from "@/components/Chart";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

interface ChartStudyOverlayProps {
  chart: ChartType;
  state: SideState;
  unlockedPlanets: PlanetName[];
  onClose: () => void;
}

/** Full-viewport chart inspection overlay — opened from the Map screen's
 *  ChartAnchor. Shows the player's chart at full Chart Study fidelity:
 *  color-field blooms, aspect web, and the planet stats panel on hover or
 *  selection. Dismissed via backdrop click, the close button, or ESC. */
export function ChartStudyOverlay({ chart, state, unlockedPlanets, onClose }: ChartStudyOverlayProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const inspected = selected ?? hovered;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Clicks on the chart bubble up to the backdrop unless we stop them.
  const onChartClick = () => {
    if (selected !== null) setSelected(null);
  };

  return (
    <div className="chart-study-overlay anim-chart-study-fade" onClick={onClose} role="dialog" aria-label="Chart inspection">
      <div className="chart-study-stage" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="chart-study-close"
          onClick={onClose}
          aria-label="Close chart inspection"
        >
          ✕
        </button>
        <div className="chart-study-chart" onClick={onChartClick}>
          <Chart
            chart={chart}
            state={state}
            unlockedPlanets={unlockedPlanets}
            selectedPlanet={selected}
            hoveredPlanet={hovered}
            inspectPlanet={selected}
            onPlanetClick={(p) => setSelected((cur) => (cur === p ? null : p))}
            onPlanetHover={setHovered}
            statsPanelPlanet={inspected}
            alwaysShowAfflictionBadges
          />
        </div>
      </div>
    </div>
  );
}
