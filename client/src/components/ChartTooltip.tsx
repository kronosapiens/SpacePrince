import type { Chart, PlanetName } from "../game/types";
import { PLANET_BASE_STATS } from "../game/data";

interface ProjectedDelta {
  selfDelta: number;
  otherDelta: number;
}

interface ChartTooltipProps {
  hoveredPlanet: PlanetName | null;
  hoveredOpponent: PlanetName | null;
  opponentPlanet?: PlanetName;
  playerChart: Chart;
  opponentChart?: Chart;
  projected?: ProjectedDelta | null;
}

export function ChartTooltip({
  hoveredPlanet,
  hoveredOpponent,
  opponentPlanet,
  playerChart,
  opponentChart,
  projected,
}: ChartTooltipProps) {
  if (!hoveredPlanet && !(hoveredOpponent && hoveredOpponent === opponentPlanet)) {
    return null;
  }

  if (hoveredPlanet) {
    const placement = playerChart.planets[hoveredPlanet];
    return (
      <div className="chart-tooltip">
        <div className="tooltip-title">
          {hoveredPlanet}
          {placement.dignity !== "Neutral" && (
            <span className="tooltip-dignity">{placement.dignity.toLowerCase()}</span>
          )}
        </div>
        <div className="tooltip-row">
          {placement.sign} · {placement.element} · {placement.modality}
        </div>
        <div className="tooltip-row">
          Dmg {PLANET_BASE_STATS[hoveredPlanet].damage + placement.buffs.damage} · Heal{" "}
          {PLANET_BASE_STATS[hoveredPlanet].healing + placement.buffs.healing} · Dur{" "}
          {PLANET_BASE_STATS[hoveredPlanet].durability + placement.buffs.durability} · Luck{" "}
          {PLANET_BASE_STATS[hoveredPlanet].luck + placement.buffs.luck}
        </div>
        {projected && (
          <div className="tooltip-row projected">
            Projected: self{" "}
            <span className={projected.selfDelta >= 0 ? "delta up" : "delta down"}>
              {projected.selfDelta >= 0 ? "+" : ""}
              {projected.selfDelta}
            </span>{" "}
            · other{" "}
            <span className={projected.otherDelta >= 0 ? "delta up" : "delta down"}>
              {projected.otherDelta >= 0 ? "+" : ""}
              {projected.otherDelta}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (!opponentChart || !opponentPlanet) return null;

  const placement = opponentChart.planets[opponentPlanet];
  return (
    <div className="chart-tooltip">
      <div className="tooltip-row">
        <span className="tooltip-title">
          {opponentPlanet}
          {placement.dignity !== "Neutral" && (
            <span className="tooltip-dignity">{placement.dignity.toLowerCase()}</span>
          )}
        </span>
      </div>
      <div className="tooltip-row">
        {placement.sign} · {placement.element} · {placement.modality}
      </div>
      <div className="tooltip-row">
        Dmg {PLANET_BASE_STATS[opponentPlanet].damage + placement.buffs.damage} · Heal{" "}
        {PLANET_BASE_STATS[opponentPlanet].healing + placement.buffs.healing} · Dur{" "}
        {PLANET_BASE_STATS[opponentPlanet].durability + placement.buffs.durability} · Luck{" "}
        {PLANET_BASE_STATS[opponentPlanet].luck + placement.buffs.luck}
      </div>
    </div>
  );
}
