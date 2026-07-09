import { useEffect, useState } from "react";
import { Chart } from "@/components/Chart";
import { StarField } from "@/components/StarField";
import type { Chart as ChartType, PlanetName, Run, SideState } from "@/game/types";

interface ChartStudyOverlayProps {
  chart: ChartType;
  state: SideState;
  unlockedPlanets: PlanetName[];
  /** Finished runs — rendered as the star-field behind the chart (NFT.md). */
  starRuns?: ReadonlyArray<Pick<Run, "id" | "seed" | "distance">>;
  onClose: () => void;
}

/** Full-viewport chart inspection overlay — opened from the Map screen's
 *  ChartAnchor. Shows the player's chart at full Chart Study fidelity:
 *  color-field blooms, aspect web, and the planet stats panel on hover or
 *  selection. Dismissed via backdrop click, the close button, or ESC. */
export function ChartStudyOverlay({ chart, state, unlockedPlanets, starRuns, onClose }: ChartStudyOverlayProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  // Study mode — sticky across inspections, same as combat's inspect "i".
  const [study, setStudy] = useState(false);
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
        {starRuns && <StarField runs={starRuns} />}
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
            onPlanetClick={(p) => setSelected((cur) => (cur === p ? null : p))}
            onPlanetHover={setHovered}
            inviteInteraction={!selected}
            statsPanelPlanet={inspected}
            statsPanelStudy={study}
            onToggleStudy={() => setStudy((s) => !s)}
          />
        </div>
      </div>
    </div>
  );
}
