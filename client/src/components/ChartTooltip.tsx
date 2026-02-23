import type { Chart, PlanetName } from "../game/types";
import { PLANET_BASE_STATS } from "../game/data";
import { isInSect } from "../game/combat";

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
  const formatSect = (inSect: boolean) => (inSect ? "In sect" : "Out of sect");

  if (!hoveredPlanet && !hoveredOpponent) {
    return null;
  }

  if (hoveredPlanet) {
    const placement = playerChart.planets[hoveredPlanet];
    const sectLabel = formatSect(isInSect(playerChart, hoveredPlanet));
    return (
      <div className="chart-tooltip">
        <div className="tooltip-title">{hoveredPlanet}</div>
        <div className="tooltip-row">
          {placement.sign} · {placement.element} · {placement.modality}
        </div>
        <div className="tooltip-row">
          {placement.dignity} · {sectLabel}
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
  const sectLabel = formatSect(isInSect(opponentChart, inspectedOpponent));
  return (
    <div className="chart-tooltip">
      <div className="tooltip-row">
        <span className="tooltip-title">{inspectedOpponent}</span>
      </div>
      <div className="tooltip-row">
        {placement.sign} · {placement.element} · {placement.modality}
      </div>
      <div className="tooltip-row">
        {placement.dignity} · {sectLabel}
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
