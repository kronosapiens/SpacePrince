import type { Chart, PlanetName } from "@/game/types";
import { getEffectiveStats } from "@/game/combat";
import { PLANET_ROLE } from "@/game/data";

interface PlanetStatsPanelProps {
  chart: Chart;
  planet: PlanetName;
  /** Panel center, in chart viewBox units. */
  cx: number;
  cy: number;
}

// Exported so Chart.tsx's placement algorithm can do rect-vs-circle
// collision tests against planet glyphs in the same viewBox units.
export const PLANET_STATS_PANEL_W = 370;
export const PLANET_STATS_PANEL_H = 102;
const W = PLANET_STATS_PANEL_W;
const H = PLANET_STATS_PANEL_H;

export function PlanetStatsPanel({ chart, planet, cx, cy }: PlanetStatsPanelProps) {
  const eff = getEffectiveStats(chart, planet);
  const x0 = cx - W / 2;
  const y0 = cy - H / 2;
  return (
    <g className="planet-stats">
      <rect className="planet-stats-bg" x={x0} y={y0} width={W} height={H} rx={12} />
      <text className="planet-stats-title" x={cx} y={cy - 14} textAnchor="middle">
        <tspan>{planet.toUpperCase()},</tspan>
        <tspan className="planet-stats-epithet"> {PLANET_ROLE[planet].toUpperCase()}</tspan>
      </text>
      <text className="planet-stats-row" x={cx} y={cy + 18} textAnchor="middle">
        Dmg {eff.damage} · Heal {eff.healing} · Dur {eff.durability} · Luck {eff.luck}
      </text>
    </g>
  );
}
