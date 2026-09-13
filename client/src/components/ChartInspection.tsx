import { useState } from "react";
import { Chart } from "@/components/Chart";
import { playUISound } from "@/audio/engine";
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
    <div className="chart-inspection" onClick={() => {
      if (!disabled && selected) playUISound("dismiss");
      setSelected(null);
      setHovered(null);
    }}>
      <Chart
        chart={chart}
        state={state}
        unlockedPlanets={unlockedPlanets}
        selectedPlanet={disabled ? null : selected}
        hoveredPlanet={disabled || selected ? null : hovered}
        onPlanetClick={disabled ? undefined : (p) => {
          playUISound(selected === p ? "dismiss" : "select");
          setSelected(selected === p ? null : p);
          setHovered(null);
        }}
        onPlanetHover={disabled || selected ? undefined : setHovered}
        interactionPlanets={new Set(unlockedPlanets)}
        inviteInteraction={!disabled && !selected}
        statsPanelPlanet={disabled ? null : selected ?? hovered}
        statsPanelStudy={study}
        onToggleStudy={() => {
          playUISound(study ? "dismiss" : "select");
          setStudy(!study);
        }}
        passive={disabled}
        side="self"
      />
    </div>
  );
}
