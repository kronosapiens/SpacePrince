import { useMemo } from "react";
import { Chart } from "./Chart";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

interface ChartAnchorProps {
  chart: ChartType;
  state: SideState;
  unlockedPlanets: PlanetName[];
  /** Briefly highlight a newly-unlocked planet — Phase 7 motion polish wires this. */
  ceremonyPlanet?: PlanetName | null;
  size?: number; // CSS px
}

/**
 * Compact form of Chart for the Map screen's top-left inset.
 * The literal expression of "the chart is always present" (SCREENS.md §1).
 */
export function ChartAnchor({ chart, state, unlockedPlanets, ceremonyPlanet, size = 220 }: ChartAnchorProps) {
  const memoState = useMemo(() => state, [state]);
  return (
    <div style={{ width: size, height: size }}>
      <Chart
        chart={chart}
        state={memoState}
        unlockedPlanets={unlockedPlanets}
        activePlanet={ceremonyPlanet ?? null}
        showColorField={false}
        showAspects={false}
        alwaysShowAfflictionBadges
        passive
      />
    </div>
  );
}
