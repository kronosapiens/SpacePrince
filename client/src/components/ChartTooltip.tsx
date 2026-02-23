import type { Chart, PlanetName } from "../game/types";
import { PLANET_BASE_STATS } from "../game/data";

interface ChartTooltipProps {
  hoveredPlanet: PlanetName | null;
  hoveredOpponent: PlanetName | null;
  opponentPlanet?: PlanetName;
  playerChart: Chart;
  opponentChart?: Chart;
}

export function ChartTooltip({
  hoveredPlanet,
  hoveredOpponent,
  opponentPlanet,
  playerChart,
  opponentChart,
}: ChartTooltipProps) {
  if (!hoveredPlanet && !hoveredOpponent) {
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
      </div>
    );
  }

  const inspectedOpponent = hoveredOpponent ?? opponentPlanet;
  if (!opponentChart || !inspectedOpponent) return null;

  const placement = opponentChart.planets[inspectedOpponent];
  return (
    <div className="chart-tooltip">
      <div className="tooltip-row">
        <span className="tooltip-title">
          {inspectedOpponent}
          {placement.dignity !== "Neutral" && (
            <span className="tooltip-dignity">{placement.dignity.toLowerCase()}</span>
          )}
        </span>
      </div>
      <div className="tooltip-row">
        {placement.sign} · {placement.element} · {placement.modality}
      </div>
      <div className="tooltip-row">
        Dmg {PLANET_BASE_STATS[inspectedOpponent].damage + placement.buffs.damage} · Heal{" "}
        {PLANET_BASE_STATS[inspectedOpponent].healing + placement.buffs.healing} · Dur{" "}
        {PLANET_BASE_STATS[inspectedOpponent].durability + placement.buffs.durability} · Luck{" "}
        {PLANET_BASE_STATS[inspectedOpponent].luck + placement.buffs.luck}
      </div>
    </div>
  );
}
