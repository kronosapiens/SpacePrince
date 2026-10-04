import { useState } from "react";
import { Chart, type ChartProps } from "@/components/Chart";
import { playUISound } from "@/audio/engine";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

export interface ChartInspectionProps extends Pick<ChartProps, "activePlanet" | "hideAffliction" | "opening"> {
  chart: ChartType;
  state?: SideState;
  unlockedPlanets: PlanetName[];
  disabled?: boolean;
  mode?: "inspect" | "preview" | "passive";
  presentation?: ChartProps;
  onReroll?: () => void;
}

/** Inspect planets in place, with the same stats and study toggle as encounters. */
export function ChartInspection({ chart, state, unlockedPlanets, disabled = false, mode = "inspect", presentation, onReroll, ...display }: ChartInspectionProps) {
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [study, setStudy] = useState(false);
  const inspect = mode === "inspect" && !disabled;
  const preview = mode !== "passive" && !disabled;
  const inspected = inspect ? selected : null;

  return (
    <div className="chart-inspection"
      role={onReroll ? "button" : undefined}
      tabIndex={onReroll ? 0 : undefined}
      aria-label={onReroll ? "Reroll chart" : undefined}
      onKeyDown={onReroll ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!event.repeat) event.currentTarget.click();
        }
      } : undefined}
      onClick={() => {
        if (presentation) return;
        if (inspect && selected) playUISound("dismiss");
        setSelected(null);
        setHovered(null);
        onReroll?.();
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
