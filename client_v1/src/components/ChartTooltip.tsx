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
  const formatSect = (inSect: boolean) => (inSect ? "In-sect" : "Out-of-sect");
  const renderPlanetCard = (planet: PlanetName, chart: Chart) => {
    const placement = chart.planets[planet];
    const sectLabel = formatSect(isInSect(chart, planet));
    return (
      <>
        <div className="tooltip-title">{planet}</div>
        <div className="tooltip-row">
          {placement.sign} · {placement.element} · {placement.modality}
        </div>
        <div className="tooltip-row">
          {placement.dignity} · {sectLabel}
        </div>
        <div className="tooltip-row">
          Dmg {PLANET_BASE_STATS[planet].damage + placement.buffs.damage} · Heal{" "}
          {PLANET_BASE_STATS[planet].healing + placement.buffs.healing} · Dur{" "}
          {PLANET_BASE_STATS[planet].durability + placement.buffs.durability} · Luck{" "}
          {PLANET_BASE_STATS[planet].luck + placement.buffs.luck}
        </div>
      </>
    );
  };

  if (hoveredPlanet) {
    return <div className="chart-tooltip-stack"><div className="chart-tooltip">{renderPlanetCard(hoveredPlanet, playerChart)}</div></div>;
  }

  const inspectedOpponent = hoveredOpponent ?? opponentPlanet;
  if (!hoveredOpponent || !opponentChart || !inspectedOpponent) return null;
  return <div className="chart-tooltip-stack"><div className="chart-tooltip">{renderPlanetCard(inspectedOpponent, opponentChart)}</div></div>;
}
