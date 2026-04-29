import { useMemo, useState } from "react";
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

type SortKey = "planet" | "polarity" | "impact" | "luck";
type SortDirection = "asc" | "desc";

export function InteractionChart({
  playerChart,
  opponentChart,
  opponentPlanet,
  run,
  focusedPlanet,
}: InteractionChartProps) {
  const [sortState, setSortState] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const context =
    run && opponentChart && opponentPlanet
      ? { run, opponentChart, opponentPlanet }
      : null;
  const rows = useMemo(() => {
    if (!context) return [];
    return PLANETS.map((planet, index) => {
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
      return { index, planet, polarity, output, luck: pStats.luck, rowClass };
    });
  }, [context, focusedPlanet, playerChart]);

  const sortedRows = useMemo(() => {
    if (!sortState) return rows;
    const polarityRank: Record<string, number> = { Affliction: 0, Friction: 1, Testimony: 2 };
    const direction = sortState.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let compare = 0;
      if (sortState.key === "planet") compare = a.planet.localeCompare(b.planet);
      if (sortState.key === "polarity") compare = polarityRank[a.polarity] - polarityRank[b.polarity];
      if (sortState.key === "impact") compare = a.output - b.output;
      if (sortState.key === "luck") compare = a.luck - b.luck;
      if (compare === 0) compare = a.index - b.index;
      return compare * direction;
    });
  }, [rows, sortState]);

  const cycleSort = (key: SortKey) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "desc" };
      if (prev.direction === "desc") return { key, direction: "asc" };
      return null;
    });
  };

  const sortIndicator = (key: SortKey) => {
    if (!sortState || sortState.key !== key) return "↕";
    return sortState.direction === "desc" ? "↓" : "↑";
  };

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
                    <th>
                      <button
                        type="button"
                        className="interaction-sort-btn"
                        onClick={() => cycleSort("planet")}
                        title="Sort by planet name."
                      >
                        Planet <span className="interaction-sort-indicator">{sortIndicator("planet")}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="interaction-sort-btn"
                        onClick={() => cycleSort("polarity")}
                        title="Polarity from your planet's element against the current opposing planet."
                      >
                        Polarity <span className="interaction-sort-indicator">{sortIndicator("polarity")}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="interaction-sort-btn"
                        onClick={() => cycleSort("impact")}
                        title="Immediate output for this action (damage/heal after polarity multiplier, before aspect propagation)."
                      >
                        Impact <span className="interaction-sort-indicator">{sortIndicator("impact")}</span>
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="interaction-sort-btn"
                        onClick={() => cycleSort("luck")}
                        title="Luck stat for this planet; higher luck increases critical chance."
                      >
                        Luck <span className="interaction-sort-indicator">{sortIndicator("luck")}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(({ planet, polarity, output, luck, rowClass }) => {
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
                        <td>{formatDisplay(luck, 1)}</td>
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
