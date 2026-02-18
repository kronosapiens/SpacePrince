import { useEffect, useMemo, useState } from "react";
import {
  PLANETS,
  PLANET_BASE_STATS,
  COMBUST_LIMIT,
  SIGNS,
} from "./game/data";
import {
  advanceEncounter,
  createRun,
  generateChart,
  getAspects,
  getUnlockedPlanets,
  resolveTurn,
} from "./game/logic";
import type { Chart, PlanetName, RunState } from "./game/types";
import { useLocalStorage } from "./components/useLocalStorage";

interface Profile {
  id: string;
  name: string;
  chart: Chart;
  totalEncounters: number;
}

const DEFAULT_PROFILE: Profile = {
  id: "prince_1",
  name: "Prince",
  chart: generateChart(),
  totalEncounters: 0,
};

const PLANET_COLORS: Record<PlanetName, { fill: string; glow: string }> = {
  Sun: { fill: "#FFD700", glow: "rgba(255, 215, 0, 0.6)" },
  Moon: { fill: "#B0C4DE", glow: "rgba(176, 196, 222, 0.6)" },
  Mercury: { fill: "#7F8F86", glow: "rgba(127, 143, 134, 0.6)" },
  Venus: { fill: "#8FBC8F", glow: "rgba(143, 188, 143, 0.6)" },
  Mars: { fill: "#CD2626", glow: "rgba(205, 38, 38, 0.6)" },
  Jupiter: { fill: "#1B3F8B", glow: "rgba(27, 63, 139, 0.6)" },
  Saturn: { fill: "#3B2F2F", glow: "rgba(59, 47, 47, 0.6)" },
};

export default function App() {
  const [profile, setProfile] = useLocalStorage<Profile>("space-prince-profile", DEFAULT_PROFILE);
  const [run, setRun] = useLocalStorage<RunState | null>("space-prince-run", null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetName | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);

  const unlockedPlanets = useMemo(() => PLANETS, []);

  const aspects = useMemo(() => getAspects(profile.chart), [profile.chart]);

  const encounter = run?.encounters[run.encounterIndex];
  const opponentChart = encounter?.opponentChart;
  const opponentPlanet = encounter?.sequence[encounter.turnIndex];

  const chartPoints = useMemo(() => {
    const radius = 150;
    const bySign = new Map<string, PlanetName[]>();
    PLANETS.forEach((planet) => {
      const sign = profile.chart.planets[planet].sign;
      const list = bySign.get(sign) ?? [];
      list.push(planet);
      bySign.set(sign, list);
    });
    return PLANETS.map((planet) => {
      const sign = profile.chart.planets[planet].sign;
      const index = SIGNS.indexOf(sign);
      const baseAngle = (index * 30 - 90 + 15) * (Math.PI / 180);
      const cluster = bySign.get(sign) ?? [];
      const position = cluster.indexOf(planet);
      const angleOffset =
        cluster.length > 1 ? (position - (cluster.length - 1) / 2) * (12 * (Math.PI / 180)) : 0;
      const spread = cluster.length > 1 ? (position - (cluster.length - 1) / 2) * 22 : 0;
      const angle = baseAngle + angleOffset;
      const offset = radius + spread;
      const x = Math.cos(angle) * offset;
      const y = Math.sin(angle) * offset;
      return { planet, sign, x, y };
    });
  }, [profile.chart]);

  const opponentPoints = useMemo(() => {
    if (!opponentChart) return [];
    const radius = 150;
    const bySign = new Map<string, PlanetName[]>();
    PLANETS.forEach((planet) => {
      const sign = opponentChart.planets[planet].sign;
      const list = bySign.get(sign) ?? [];
      list.push(planet);
      bySign.set(sign, list);
    });
    return PLANETS.map((planet) => {
      const sign = opponentChart.planets[planet].sign;
      const index = SIGNS.indexOf(sign);
      const baseAngle = (index * 30 - 90 + 15) * (Math.PI / 180);
      const cluster = bySign.get(sign) ?? [];
      const position = cluster.indexOf(planet);
      const angleOffset =
        cluster.length > 1 ? (position - (cluster.length - 1) / 2) * (12 * (Math.PI / 180)) : 0;
      const spread = cluster.length > 1 ? (position - (cluster.length - 1) / 2) * 22 : 0;
      const angle = baseAngle + angleOffset;
      const offset = radius + spread;
      const x = Math.cos(angle) * offset;
      const y = Math.sin(angle) * offset;
      return { planet, sign, x, y };
    });
  }, [opponentChart]);

  const aspectsByPlanet = useMemo(() => {
    return aspects.reduce<Record<PlanetName, typeof aspects>>((acc, aspect) => {
      acc[aspect.from] = acc[aspect.from] ? [...acc[aspect.from], aspect] : [aspect];
      return acc;
    }, {} as Record<PlanetName, typeof aspects>);
  }, [aspects]);

  const chartPointMap = useMemo(() => {
    return chartPoints.reduce<Record<string, { x: number; y: number }>>((acc, point) => {
      acc[point.planet] = { x: point.x, y: point.y };
      return acc;
    }, {});
  }, [chartPoints]);

  const activeAspects = useMemo(() => {
    if (!hoveredPlanet) return [];
    return aspects.filter((aspect) => aspect.from === hoveredPlanet);
  }, [hoveredPlanet, aspects]);

  

  const handleStartRun = () => {
    const chart = generateChart();
    const updatedProfile = { ...profile, chart };
    setProfile(updatedProfile);
    const newRun = createRun(chart, updatedProfile.totalEncounters, true);
    setRun(newRun);
  };

  const handleSelectPlanet = (planet: PlanetName) => {
    if (!run || run.over) return;
    if (run.playerState[planet].combusted) return;
    const updated = resolveTurn(run, profile.chart, planet, () => Math.random());
    setRun(updated);
  };

  useEffect(() => {
    if (!run || !encounter?.completed || run.over) return;
    setProfile({ ...profile, totalEncounters: profile.totalEncounters + 1 });
    setRun(advanceEncounter(run));
  }, [run, encounter, profile, setProfile, setRun]);


  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>🪐 Space Prince</h1>
          <p className="subtitle">Hover a planet to inspect. Click a planet to act.</p>
        </div>
        <div className="hero-actions">
          <button className="btn" onClick={handleStartRun}>
            Start Run
          </button>
        </div>
      </header>

      <section className="stack">
        <div className="panel">
          <div className="panel-header">
            <h2>Encounter</h2>
          </div>
          <div className="panel-body">
            <div className="chart-visuals">
              <div className="chart-shell">
                <p className="chart-title">Self</p>
                <div className={`chart-visual ${profile.chart.isDiurnal ? "diurnal" : "nocturnal"}`}>
                  <div className="inner-ring" />
                  {SIGNS.map((sign, index) => (
                    <div
                      key={sign}
                      className="chart-tick"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-235px)`,
                      }}
                    />
                  ))}
                  {SIGNS.map((sign, index) => (
                    <div
                      key={`${sign}-label`}
                      className="chart-sign-label"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${index * 30 + 15}deg) translateY(-226px) rotate(${
                          -(index * 30 + 15)
                        }deg)`,
                      }}
                    >
                      {sign.slice(0, 3).toUpperCase()}
                    </div>
                  ))}
                  {chartPoints.map((point) => (
                    <div
                      key={point.planet}
                      className={`chart-planet ${
                        run?.playerState[point.planet]?.combusted ? "combusted" : ""
                      }`}
                      style={{
                        transform: `translate(${point.x}px, ${point.y}px)`,
                        backgroundColor: PLANET_COLORS[point.planet].fill,
                        boxShadow: `0 0 14px ${PLANET_COLORS[point.planet].glow}`,
                        filter: run?.playerState[point.planet]?.combusted
                          ? "grayscale(1) brightness(0.7)"
                          : "none",
                      }}
                      onMouseEnter={() => setHoveredPlanet(point.planet)}
                      onMouseLeave={() => setHoveredPlanet(null)}
                      onClick={() => handleSelectPlanet(point.planet)}
                    >
                      {run?.playerState[point.planet]?.combusted && (
                        <span className="chart-x">×</span>
                      )}
                      <span
                        className="chart-label"
                        style={point.y > 0 ? { top: "-20px" } : undefined}
                      >
                        {point.planet.slice(0, 3).toUpperCase()}
                      </span>
                      <span
                        className={`chart-affliction affliction-${Math.min(
                          3,
                          Math.floor((run?.playerState[point.planet]?.affliction ?? 0) / 3)
                        )}`}
                        style={point.y > 0 ? { top: "-38px" } : undefined}
                      >
                        {run?.playerState[point.planet]?.affliction ?? 0}
                      </span>
                    </div>
                  ))}
                  <svg className="chart-aspects" viewBox="-270 -270 540 540">
                    {activeAspects.map((aspect) => {
                      const from = chartPointMap[aspect.from];
                      const to = chartPointMap[aspect.to];
                      if (!from || !to) return null;
                      return (
                        <line
                          key={`${aspect.from}-${aspect.to}-${aspect.aspect}`}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          className={`aspect-line aspect-${aspect.aspect.toLowerCase()}`}
                          style={{ opacity: Math.min(1, Math.abs(aspect.multiplier)) }}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="chart-shell">
                <p className="chart-title">Other</p>
                <div className="chart-visual">
                  <div className="inner-ring" />
                  {SIGNS.map((sign, index) => (
                    <div
                      key={`opp-${sign}`}
                      className="chart-tick"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-235px)`,
                      }}
                    />
                  ))}
                  {SIGNS.map((sign, index) => (
                    <div
                      key={`opp-${sign}-label`}
                      className="chart-sign-label"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${index * 30 + 15}deg) translateY(-226px) rotate(${
                          -(index * 30 + 15)
                        }deg)`,
                      }}
                    >
                      {sign.slice(0, 3).toUpperCase()}
                    </div>
                  ))}
                  {opponentPoints.map((point) => (
                    <div
                      key={`opp-${point.planet}`}
                      className={`chart-planet ${opponentPlanet === point.planet ? "active" : ""} ${
                        run?.opponentState[point.planet]?.combusted ? "combusted" : ""
                      }`}
                      style={{
                        transform: `translate(${point.x}px, ${point.y}px)`,
                        backgroundColor: PLANET_COLORS[point.planet].fill,
                        boxShadow: `0 0 14px ${PLANET_COLORS[point.planet].glow}`,
                        filter: run?.opponentState[point.planet]?.combusted
                          ? "grayscale(1) brightness(0.7)"
                          : "none",
                      }}
                      onMouseEnter={() => setHoveredOpponent(point.planet)}
                      onMouseLeave={() => setHoveredOpponent(null)}
                    >
                      {run?.opponentState[point.planet]?.combusted && (
                        <span className="chart-x">×</span>
                      )}
                      <span
                        className="chart-label"
                        style={point.y > 0 ? { top: "-20px" } : undefined}
                      >
                        {point.planet.slice(0, 3).toUpperCase()}
                      </span>
                      <span
                        className={`chart-affliction affliction-${Math.min(
                          3,
                          Math.floor((run?.opponentState[point.planet]?.affliction ?? 0) / 3)
                        )}`}
                        style={point.y > 0 ? { top: "-38px" } : undefined}
                      >
                        {run?.opponentState[point.planet]?.affliction ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {(hoveredPlanet || (hoveredOpponent && hoveredOpponent === opponentPlanet)) && (
              <div className="chart-tooltip">
                {hoveredPlanet && (
                  <>
                    <div className="tooltip-title">
                      {hoveredPlanet}
                      {profile.chart.planets[hoveredPlanet].dignity !== "Neutral" && (
                        <span className="tooltip-dignity">
                          {profile.chart.planets[hoveredPlanet].dignity.toLowerCase()}
                        </span>
                      )}
                    </div>
                    <div className="tooltip-row">
                      {profile.chart.planets[hoveredPlanet].sign} ·{" "}
                      {profile.chart.planets[hoveredPlanet].element} ·{" "}
                      {profile.chart.planets[hoveredPlanet].modality}
                    </div>
                    <div className="tooltip-row">
                      Dmg{" "}
                      {PLANET_BASE_STATS[hoveredPlanet].damage +
                        profile.chart.planets[hoveredPlanet].buffs.damage}{" "}
                      · Heal{" "}
                      {PLANET_BASE_STATS[hoveredPlanet].healing +
                        profile.chart.planets[hoveredPlanet].buffs.healing}{" "}
                      · Dur{" "}
                      {PLANET_BASE_STATS[hoveredPlanet].durability +
                        profile.chart.planets[hoveredPlanet].buffs.durability}{" "}
                      · Luck{" "}
                      {PLANET_BASE_STATS[hoveredPlanet].luck +
                        profile.chart.planets[hoveredPlanet].buffs.luck}
                    </div>
                  </>
                )}
                {!hoveredPlanet && hoveredOpponent && hoveredOpponent === opponentPlanet && opponentChart && (
                  <>
                    <div className="tooltip-row">
                      <span className="tooltip-title">
                        {opponentPlanet}
                        {opponentChart.planets[opponentPlanet].dignity !== "Neutral" && (
                          <span className="tooltip-dignity">
                            {opponentChart.planets[opponentPlanet].dignity.toLowerCase()}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="tooltip-row">
                      {opponentChart.planets[opponentPlanet].sign} ·{" "}
                      {opponentChart.planets[opponentPlanet].element} ·{" "}
                      {opponentChart.planets[opponentPlanet].modality}
                    </div>
                    <div className="tooltip-row">
                      Dmg{" "}
                      {PLANET_BASE_STATS[opponentPlanet].damage +
                        opponentChart.planets[opponentPlanet].buffs.damage}{" "}
                      · Heal{" "}
                      {PLANET_BASE_STATS[opponentPlanet].healing +
                        opponentChart.planets[opponentPlanet].buffs.healing}{" "}
                      · Dur{" "}
                      {PLANET_BASE_STATS[opponentPlanet].durability +
                        opponentChart.planets[opponentPlanet].buffs.durability}{" "}
                      · Luck{" "}
                      {PLANET_BASE_STATS[opponentPlanet].luck +
                        opponentChart.planets[opponentPlanet].buffs.luck}
                    </div>
                  </>
                )}
              </div>
            )}
            {encounter && (
              <div className="turn-track">
                {Array.from({ length: encounter.sequence.length }, (_, index) => (
                  <span
                    key={`turn-${index}`}
                    className={`turn-dot ${index < encounter.turnIndex ? "filled" : ""} ${
                      index === encounter.turnIndex ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            )}
            <div className="chart-actions">
              {run?.over && (
                <div className="run-status">
                  <strong>{run.victory ? "Run Complete" : "Run Failed"}</strong>
                  <p>
                    {run.victory
                      ? "You survived the sequence. Start another run to continue discovery."
                      : "Combustion overtook the chart. Mint or start a new run."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Combat Log</h2>
            <div className="tag">Latest 12</div>
          </div>
          <div className="panel-body">
            {run?.log.length ? (
              <div className="log">
                {run.log.map((entry) => (
                  <div key={entry.id} className="log-entry">
                    <div className="log-head">
                      <span>Turn {entry.turnIndex}</span>
                      <span>
                        {entry.playerPlanet} vs {entry.opponentPlanet}
                      </span>
                    </div>
                    <div className="log-body">
                      <p>
                        {entry.polarity} | Player {entry.playerCrit ? "CRIT" : ""}{" "}
                        {entry.playerDelta}
                        {entry.polarity === "Testimony" ? " healed" : " affliction"} | Opponent{" "}
                        {entry.opponentCrit ? "CRIT" : ""} {entry.opponentDelta}
                        {entry.polarity === "Testimony" ? " healed" : " affliction"}
                      </p>
                      {entry.playerCombust && <p className="warn">Player combusts</p>}
                      {entry.opponentCombust && <p className="warn">Opponent combusts</p>}
                      {entry.propagation.length > 0 && (
                        <div className="propagation">
                          {entry.propagation.map((prop, index) => (
                            <span key={`${entry.id}_${index}`}>
                              {prop.target}: {prop.delta >= 0 ? "+" : ""}{prop.delta} ({prop.note})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No turns resolved yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
