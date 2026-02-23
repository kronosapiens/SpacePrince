import { ELEMENT_QUALITIES, PLANET_BASE_STATS, PLANET_SECT, PLANETS } from "../game/data";
import type { Chart, PlanetName, RunState } from "../game/types";

interface InteractionChartProps {
  playerChart: Chart;
  opponentChart?: Chart;
  opponentPlanet?: PlanetName;
  run: RunState | null;
  focusedPlanet: PlanetName | null;
}

const PLANET_GLYPH: Record<PlanetName, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
};

function getPolarity(a: string, b: string) {
  const qualitiesA = ELEMENT_QUALITIES[a as keyof typeof ELEMENT_QUALITIES];
  const qualitiesB = ELEMENT_QUALITIES[b as keyof typeof ELEMENT_QUALITIES];
  const shared = qualitiesA.filter((q) => qualitiesB.includes(q)).length;
  if (shared === 2) return "Testimony";
  if (shared === 1) return "Friction";
  return "Affliction";
}

function getEffectiveStats(chart: Chart, planet: PlanetName) {
  const placement = chart.planets[planet];
  return {
    damage: PLANET_BASE_STATS[planet].damage + placement.buffs.damage,
    healing: PLANET_BASE_STATS[planet].healing + placement.buffs.healing,
    durability: PLANET_BASE_STATS[planet].durability + placement.buffs.durability,
    luck: PLANET_BASE_STATS[planet].luck + placement.buffs.luck,
  };
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function isInSect(chart: Chart, planet: PlanetName) {
  const chartSect = chart.isDiurnal ? "Day" : "Night";
  const planetSect =
    PLANET_SECT[planet] === "Flexible" ? (chart.isDiurnal ? "Day" : "Night") : PLANET_SECT[planet];
  return planetSect === chartSect;
}

function getResolvedSect(chart: Chart, planet: PlanetName) {
  return PLANET_SECT[planet] === "Flexible" ? (chart.isDiurnal ? "Day" : "Night") : PLANET_SECT[planet];
}

export function InteractionChart({
  playerChart,
  opponentChart,
  opponentPlanet,
  run,
  focusedPlanet,
}: InteractionChartProps) {
  const context =
    run && opponentChart && opponentPlanet
      ? { run, opponentChart, opponentPlanet }
      : null;

  return (
    <section className="grid">
      <div className="panel">
        <div className="panel-header">
          <h2>Interaction Chart</h2>
        </div>
        <div className="panel-body">
          {!context && <p className="muted">Start a run to inspect luck, polarity, and multipliers.</p>}

          {context && (
            <div className="interaction-table-wrap">
              <table className="interaction-table">
                <thead>
                  <tr>
                    <th>Planet</th>
                    <th>Polarity</th>
                    <th>Sect</th>
                    <th>Base</th>
                    <th>Luck</th>
                    <th>Output</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANETS.map((planet) => {
                    const playerState = context.run.playerState[planet];
                    const oppState = context.run.opponentState[context.opponentPlanet];
                    const placement = playerChart.planets[planet];
                    const oppPlacement = context.opponentChart.planets[context.opponentPlanet];
                    const polarity = getPolarity(placement.element, oppPlacement.element);
                    const friction = polarity === "Friction" ? 0.5 : 1;
                    const pStats = playerState.combusted
                      ? { damage: 0, healing: 0, luck: 0 }
                      : getEffectiveStats(playerChart, planet);
                    const base = polarity === "Testimony" ? pStats.healing : pStats.damage;
                    const inSect = isInSect(playerChart, planet);
                    const output = base * friction;
                    const outputCrit = output * 2;
                    const critBonus = outputCrit - output;
                    const sectSymbol = getResolvedSect(playerChart, planet) === "Day" ? "☉" : "☽";
                    const rowClass = [
                      focusedPlanet === planet ? "focus" : "",
                      playerState.combusted ? "combusted" : "",
                      oppState.combusted ? "opponent-combusted" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr key={planet} className={rowClass}>
                        <td>
                          <span className="interaction-planet-label">
                            <span className="interaction-planet-glyph" aria-hidden="true">
                              {PLANET_GLYPH[planet]}
                            </span>{" "}
                            {planet}
                          </span>
                        </td>
                        <td>{polarity}</td>
                        <td>
                          {sectSymbol} {inSect ? "In" : "Out"}
                        </td>
                        <td>{fmt(base)}</td>
                        <td>{fmt(pStats.luck)}</td>
                        <td>
                          {Math.round(output)} (+{Math.round(critBonus)})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
