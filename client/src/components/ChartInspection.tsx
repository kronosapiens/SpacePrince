import { useState } from "react";
import { Chart } from "@/components/Chart";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

interface ChartInspectionProps {
  chart: ChartType;
  state?: SideState;
  unlockedPlanets: PlanetName[];
  disabled?: boolean;
}

/** Inspect planets in place, with the same stats and study toggle as encounters. */
export function ChartInspection({ chart, state, unlockedPlanets, disabled = false }: ChartInspectionProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [study, setStudy] = useState(false);

  return (
    <div className="chart-inspection" onClick={() => setSelected(null)}>
      <Chart
        chart={chart}
        state={state}
        unlockedPlanets={unlockedPlanets}
        selectedPlanet={disabled ? null : selected}
        hoveredPlanet={disabled || selected ? null : hovered}
        onPlanetClick={disabled ? undefined : (p) => setSelected((cur) => cur === p ? null : p)}
        onPlanetHover={disabled ? undefined : setHovered}
        interactionPlanets={new Set(unlockedPlanets)}
        inviteInteraction={!disabled && !selected}
        statsPanelPlanet={disabled ? null : selected ?? hovered}
        statsPanelStudy={study}
        onToggleStudy={() => setStudy((s) => !s)}
        passive={disabled}
        side="self"
      />
    </div>
  );
}
