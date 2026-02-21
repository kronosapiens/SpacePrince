import { ELEMENT_QUALITIES, PLANET_BASE_STATS, PLANETS } from "../game/data";
import type { Chart, PlanetName, RunState } from "../game/types";

interface InteractionChartProps {
  playerChart: Chart;
  opponentChart?: Chart;
  opponentPlanet?: PlanetName;
  run: RunState | null;
  focusedPlanet: PlanetName | null;
}

const OUTGOING_MULTIPLIER = { Cardinal: 1.25, Fixed: 1, Mutable: 1 } as const;
const INCOMING_MULTIPLIER = { Cardinal: 1, Fixed: 1, Mutable: 1.25 } as const;
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

function getEffectiveStats(chart: Chart, planet: PlanetName, affliction: number) {
  const placement = chart.planets[planet];
  const base = {
    damage: PLANET_BASE_STATS[planet].damage + placement.buffs.damage,
    healing: PLANET_BASE_STATS[planet].healing + placement.buffs.healing,
    durability: PLANET_BASE_STATS[planet].durability + placement.buffs.durability,
    luck: PLANET_BASE_STATS[planet].luck + placement.buffs.luck,
  };
  const scale = Math.max(0, 1 - affliction / 10);
  return {
    damage: base.damage * scale,
    healing: base.healing * scale,
    luck: base.luck * scale,
  };
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
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
                    <th>Out/In</th>
                    <th>Luck</th>
                    <th>Crit</th>
                    <th>Base</th>
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
                    const outgoing = OUTGOING_MULTIPLIER[placement.modality];
                    const incoming = INCOMING_MULTIPLIER[oppPlacement.modality];
                    const friction = polarity === "Friction" ? 0.5 : 1;
                    const pStats = playerState.combusted
                      ? { damage: 0, healing: 0, luck: 0 }
                      : getEffectiveStats(playerChart, planet, playerState.affliction);
                    const base = polarity === "Testimony" ? pStats.healing : pStats.damage;
                    const output = base * outgoing * incoming * friction;
                    const critChance = Math.min(0.4, pStats.luck * 0.08);
                    const outputCrit = output * 2;
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
                          {outgoing} / {incoming}
                        </td>
                        <td>{fmt(pStats.luck)}</td>
                        <td>{Math.round(critChance * 100)}%</td>
                        <td>{fmt(base)}</td>
                        <td>
                          {Math.round(output)} ({Math.round(outputCrit)} crit)
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
