import { useState } from "react";
import { Chart, type ChartProps } from "@/components/Chart";
import { playUISound } from "@/audio/engine";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

export interface ChartInspectionProps extends Pick<ChartProps, "activePlanet" | "hideAffliction"> {
  chart: ChartType;
  state?: SideState;
  unlockedPlanets: PlanetName[];
  disabled?: boolean;
  mode?: "inspect" | "preview" | "passive";
  presentation?: ChartProps;
}

/** Inspect planets in place, with the same stats and study toggle as encounters. */
export function ChartInspection({ chart, state, unlockedPlanets, disabled = false, mode = "inspect", presentation, ...display }: ChartInspectionProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [study, setStudy] = useState(false);
  const inspect = mode === "inspect" && !disabled;
  const preview = mode !== "passive" && !disabled;
  const inspected = inspect ? selected : null;

  return (
    <div className="chart-inspection" onClick={() => {
      if (presentation) return;
      if (inspect && selected) playUISound("dismiss");
      setSelected(null);
      setHovered(null);
    }}>
      <Chart {...(presentation ?? {
        ...display,
        chart,
        state,
        unlockedPlanets,
        selectedPlanet: inspected,
        hoveredPlanet: !preview || inspected ? null : hovered,
        onPlanetClick: !inspect ? undefined : (p) => {
          playUISound(selected === p ? "dismiss" : "select");
          setSelected(selected === p ? null : p);
          setHovered(null);
        },
        onPlanetHover: !preview || inspected ? undefined : setHovered,
        interactionPlanets: new Set(unlockedPlanets),
        inviteInteraction: inspect && !selected,
        statsPanelPlanet: inspect ? selected ?? hovered : null,
        statsPanelStudy: study,
        onToggleStudy: () => {
          playUISound(study ? "dismiss" : "select");
          setStudy(!study);
        },
        passive: !preview,
        side: "self",
      })} />
    </div>
  );
}
