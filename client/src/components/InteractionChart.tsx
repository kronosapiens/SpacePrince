import { PLANETS } from "../game/data";
import { getEffectiveStats, getPolarity } from "../game/combat";
import type { Chart, PlanetName, RunState } from "../game/types";
import { formatDisplay } from "../lib/format";

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
          <div className="interaction-heading">
            <h2>Interaction Chart</h2>
            {context && (
              <span className="interaction-subtitle">versus {context.opponentPlanet}</span>
            )}
          </div>
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
                    <th>Impact</th>
                    <th>Luck</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANETS.map((planet) => {
                    const playerState = context.run.playerState[planet];
                    const oppState = context.run.opponentState[context.opponentPlanet];
                    const placement = playerChart.planets[planet];
                    const oppPlacement = context.opponentChart.planets[context.opponentPlanet];
                    const polarity = getPolarity(placement.element, oppPlacement.element);
                    const polarityMultiplier = polarity === "Affliction" ? 2 : 1;
                    const pStats = playerState.combusted
                      ? { damage: 0, healing: 0, luck: 0 }
                      : getEffectiveStats(playerChart, planet);
                    const base = polarity === "Testimony" ? pStats.healing : pStats.damage;
                    const output = base * polarityMultiplier;
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
                        <td>{formatDisplay(output, 1)}</td>
                        <td>{formatDisplay(pStats.luck, 1)}</td>
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
