import { useState } from "react";
import { Chart } from "@/components/Chart";
import { InfoCard } from "@/components/InfoCard";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

interface ChartStudyOverlayProps {
  chart: ChartType;
  state: SideState;
  unlockedPlanets: PlanetName[];
  onClose: () => void;
}

/** Chart inspection inside the info card — opened from the Map screen's
 *  ChartAnchor. Shows the player's chart at full Chart Study fidelity:
 *  color-field blooms, aspect web, and the planet stats panel on hover or
 *  selection. */
export function ChartStudyOverlay({ chart, state, unlockedPlanets, onClose }: ChartStudyOverlayProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  // Study mode — sticky across inspections, same as combat's inspect "i".
  const [study, setStudy] = useState(false);
  const inspected = selected ?? hovered;

  // Clicks on the chart bubble up to the backdrop unless we stop them.
  const onChartClick = () => {
    if (selected !== null) setSelected(null);
  };

  return (
    <InfoCard ariaLabel="Chart inspection" onClose={onClose}>
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
    </InfoCard>
  );
}
