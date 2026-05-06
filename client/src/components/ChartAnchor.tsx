import { useMemo } from "react";
import { Chart } from "./Chart";
import type { Chart as ChartType, PlanetName, SideState } from "@/game/types";

interface ChartAnchorProps {
  chart: ChartType;
  state: SideState;
  unlockedPlanets: PlanetName[];
  /** Briefly highlight a newly-unlocked planet — Phase 7 motion polish wires this. */
  ceremonyPlanet?: PlanetName | null;
  /** Optional explicit pixel size. When omitted, the anchor fills its parent
   *  container via CSS (`.chart-anchor-btn`). The Map screen relies on CSS
   *  sizing so the chart shrinks to the `.map-anchor` width on mobile. */
  size?: number;
  /** When provided, the anchor becomes a button that opens a full-chart
   *  inspection overlay (Chart Study). Without it, the anchor is purely
   *  decorative. */
  onExpand?: () => void;
}

/**
 * Compact form of Chart for the Map screen's top-left inset.
 * The literal expression of "the chart is always present" (SCREENS.md §1).
 */
export function ChartAnchor({ chart, state, unlockedPlanets, ceremonyPlanet, size, onExpand }: ChartAnchorProps) {
  const memoState = useMemo(() => state, [state]);
  const sizeStyle = size !== undefined ? { width: size, height: size } : undefined;
  const inner = (
    <Chart
      chart={chart}
      state={memoState}
      unlockedPlanets={unlockedPlanets}
      activePlanet={ceremonyPlanet ?? null}
      showColorField={false}
      showAspects={false}
      hideAfflictionBadges
      passive
    />
  );
  if (!onExpand) {
    return <div className="chart-anchor-btn" style={sizeStyle}>{inner}</div>;
  }
  return (
    <button
      type="button"
      className="chart-anchor-btn"
      style={sizeStyle}
      onClick={onExpand}
      aria-label="Inspect chart"
    >
      {inner}
    </button>
  );
}
