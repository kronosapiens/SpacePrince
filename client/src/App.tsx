import { useEffect, useMemo, useState } from "react";
import {
  PLANETS,
  PLANET_BASE_STATS,
  ELEMENT_QUALITIES,
  SIGN_ELEMENT,
  SIGNS,
} from "./game/data";
import {
  advanceEncounter,
  createRun,
  generateChart,
  getAspects,
  resolveTurn,
  skipCombustedOpponentTurns,
} from "./game/logic";
import type { Chart, PlanetName, RunState } from "./game/types";
import { useLocalStorage } from "./components/useLocalStorage";
import { ChartVisual } from "./components/ChartVisual";
import { ChartTooltip } from "./components/ChartTooltip";
import { TurnTrack } from "./components/TurnTrack";
import { EncounterLog } from "./components/EncounterLog";
import { HeroHeader } from "./components/HeroHeader";
import { useCombatAnimation } from "./components/useCombatAnimation";
import { InteractionChart } from "./components/InteractionChart";
import { buildChartPoints, buildPointMap, getChartRotationDegrees } from "./lib/chart";
import { PLANET_COLORS } from "./lib/palette";

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

export default function App() {
  const [profile, setProfile] = useLocalStorage<Profile>("space-prince-profile", DEFAULT_PROFILE);
  const [run, setRun] = useLocalStorage<RunState | null>("space-prince-run", null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetName | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);
  const {
    animating,
    actionPlanet,
    actionOpponent,
    highlightAffliction,
    critPlanets,
    ripplePlanets,
    highlightLines,
    displayAffliction,
    displayCombusted,
    startAnimation,
    finishAnimation,
  } = useCombatAnimation();

  const aspects = useMemo(() => getAspects(profile.chart), [profile.chart]);

  const encounter = run?.encounters[run.encounterIndex];
  const opponentChart = encounter?.opponentChart;
  const opponentPlanet = encounter?.sequence[encounter.turnIndex];
  const displayOpponentPlanet = animating ? actionOpponent ?? opponentPlanet : opponentPlanet;
  const displayTurnIndex =
    animating && encounter ? Math.max(0, encounter.turnIndex - 1) : encounter?.turnIndex ?? 0;
  const opponentAspects = useMemo(
    () => (opponentChart ? getAspects(opponentChart) : []),
    [opponentChart]
  );

  const chartPoints = useMemo(() => buildChartPoints(profile.chart), [profile.chart]);
  const opponentPoints = useMemo(
    () => (opponentChart ? buildChartPoints(opponentChart) : []),
    [opponentChart]
  );
  const chartRotation = useMemo(() => getChartRotationDegrees(profile.chart), [profile.chart]);
  const opponentRotation = useMemo(
    () => (opponentChart ? getChartRotationDegrees(opponentChart) : 0),
    [opponentChart]
  );
  const chartPointMap = useMemo(() => buildPointMap(chartPoints), [chartPoints]);
  const opponentPointMap = useMemo(() => buildPointMap(opponentPoints), [opponentPoints]);

  const activeAspects = useMemo(() => {
    const source = hoveredPlanet ?? actionPlanet;
    if (!source) return [];
    return aspects.filter((aspect) => aspect.from === source);
  }, [hoveredPlanet, actionPlanet, aspects]);
  const activeOpponentAspects = useMemo(() => {
    const source = hoveredOpponent ?? actionOpponent ?? (hoveredPlanet ? displayOpponentPlanet : null);
    if (!source) return [];
    return opponentAspects.filter((aspect) => aspect.from === source);
  }, [hoveredOpponent, actionOpponent, hoveredPlanet, displayOpponentPlanet, opponentAspects]);

  const handleStartRun = () => {
    const chart = generateChart();
    const updatedProfile = { ...profile, chart };
    setProfile(updatedProfile);
    const newRun = createRun(chart, updatedProfile.totalEncounters, true);
    setRun(newRun);
  };

  const handleSelectPlanet = (planet: PlanetName) => {
    if (!run || run.over) return;
    if (!encounter || encounter.completed) return;
    if (run.playerState[planet].combusted) return;
    if (animating) {
      finishAnimation();
      return;
    }
    const currentOpponent = encounter?.sequence[encounter.turnIndex];
    const previousRun = run;
    const updated = resolveTurn(run, profile.chart, planet, () => Math.random());
    let nextRun = updated;
    const completedEncounter = updated.encounters[updated.encounterIndex];
    if (completedEncounter?.completed && !updated.over) {
      setProfile((prev) => ({ ...prev, totalEncounters: prev.totalEncounters + 1 }));
      nextRun = advanceEncounter(updated);
    }
    setRun(nextRun);
    if (!currentOpponent) return;
    const entry = updated.log[0];
    if (!entry) return;
    startAnimation(entry, previousRun);
  };

  useEffect(() => {
    if (!run || run.over) return;
    const normalized = skipCombustedOpponentTurns(run);
    if (normalized !== run) {
      setRun(normalized);
    }
  }, [run, setRun]);

  useEffect(() => {
    if (!run || !encounter?.completed || run.over) return;
    setProfile((prev) => ({ ...prev, totalEncounters: prev.totalEncounters + 1 }));
    setRun(advanceEncounter(run));
  }, [run, encounter, setProfile, setRun]);

  const getPolarity = (elementA: string, elementB: string) => {
    const qualitiesA = ELEMENT_QUALITIES[elementA as keyof typeof ELEMENT_QUALITIES];
    const qualitiesB = ELEMENT_QUALITIES[elementB as keyof typeof ELEMENT_QUALITIES];
    const shared = qualitiesA.filter((q) => qualitiesB.includes(q)).length;
    if (shared === 2) return "Testimony";
    if (shared === 1) return "Friction";
    return "Affliction";
  };

  const getEffectiveStats = (planet: PlanetName, chart: Chart) => {
    const placement = chart.planets[planet];
    return {
      damage: PLANET_BASE_STATS[planet].damage + placement.buffs.damage,
      healing: PLANET_BASE_STATS[planet].healing + placement.buffs.healing,
      durability: PLANET_BASE_STATS[planet].durability + placement.buffs.durability,
      luck: PLANET_BASE_STATS[planet].luck + placement.buffs.luck,
    };
  };

  const getProjectedDelta = (planet: PlanetName) => {
    if (!run || !encounter || !opponentChart || !displayOpponentPlanet) return null;
    if (run.playerState[planet].combusted) return null;
    const placement = profile.chart.planets[planet];
    const opponentPlacement = opponentChart.planets[displayOpponentPlanet];
    const polarity = getPolarity(placement.element, opponentPlacement.element);
    const playerStats = getEffectiveStats(planet, profile.chart);
    const opponentStats = getEffectiveStats(
      displayOpponentPlanet,
      opponentChart
    );

    const friction = polarity === "Friction" ? 0.5 : 1;
    const playerToOpponent =
      (polarity === "Testimony" ? playerStats.healing : playerStats.damage) * friction;
    const opponentToPlayer =
      (polarity === "Testimony" ? opponentStats.healing : opponentStats.damage) * friction;

    const playerCarry = run.playerCarry?.[planet] ?? 0;
    const opponentCarry = run.opponentCarry?.[displayOpponentPlanet] ?? 0;
    const roundedPlayer = Math.max(0, Math.round(Math.max(0, opponentToPlayer + playerCarry)));
    const roundedOpponent = Math.max(0, Math.round(Math.max(0, playerToOpponent + opponentCarry)));

    const selfDelta = polarity === "Testimony" ? -roundedPlayer : roundedPlayer;
    const otherDelta = polarity === "Testimony" ? -roundedOpponent : roundedOpponent;

    return { selfDelta, otherDelta, polarity };
  };

  const selfProjectedPairsByPlanet = useMemo(() => {
    if (animating) return {} as Partial<Record<PlanetName, { selfDelta: number; otherDelta: number }>>;
    if (!hoveredPlanet) return {} as Partial<Record<PlanetName, { selfDelta: number; otherDelta: number }>>;
    const projected = getProjectedDelta(hoveredPlanet);
    if (!projected) return {} as Partial<Record<PlanetName, { selfDelta: number; otherDelta: number }>>;
    return { [hoveredPlanet]: { selfDelta: projected.selfDelta, otherDelta: projected.otherDelta } };
  }, [animating, hoveredPlanet, run, encounter, opponentChart, displayOpponentPlanet, profile.chart]);
  const getAfflictionLevel = (value: number) => Math.min(3, Math.floor(value / 3));
  const selfSignPolarities = useMemo(() => {
    if (!opponentChart || !displayOpponentPlanet) return {};
    const opponentElement = opponentChart.planets[displayOpponentPlanet].element;
    return SIGNS.reduce<Partial<Record<(typeof SIGNS)[number], "Affliction" | "Testimony" | "Friction">>>(
      (acc, sign) => {
        acc[sign] = getPolarity(SIGN_ELEMENT[sign], opponentElement);
        return acc;
      },
      {}
    );
  }, [opponentChart, displayOpponentPlanet]);

  const otherSignPolarities = useMemo(() => {
    const playerRef = hoveredPlanet ?? actionPlanet;
    if (!playerRef) return {};
    const playerElement = profile.chart.planets[playerRef].element;
    return SIGNS.reduce<Partial<Record<(typeof SIGNS)[number], "Affliction" | "Testimony" | "Friction">>>(
      (acc, sign) => {
        acc[sign] = getPolarity(SIGN_ELEMENT[sign], playerElement);
        return acc;
      },
      {}
    );
  }, [hoveredPlanet, actionPlanet, profile.chart]);

  const playerAffliction = useMemo(() => {
    if (displayAffliction) return displayAffliction.self as Record<PlanetName, number>;
    return PLANETS.reduce<Record<PlanetName, number>>((acc, planet) => {
      acc[planet] = run?.playerState[planet]?.affliction ?? 0;
      return acc;
    }, {} as Record<PlanetName, number>);
  }, [displayAffliction, run]);

  const opponentAffliction = useMemo(() => {
    if (displayAffliction) return displayAffliction.other as Record<PlanetName, number>;
    return PLANETS.reduce<Record<PlanetName, number>>((acc, planet) => {
      acc[planet] = run?.opponentState[planet]?.affliction ?? 0;
      return acc;
    }, {} as Record<PlanetName, number>);
  }, [displayAffliction, run]);

  const playerCombusted = useMemo(() => {
    if (displayCombusted) return displayCombusted.self as Record<PlanetName, boolean>;
    return PLANETS.reduce<Record<PlanetName, boolean>>((acc, planet) => {
      acc[planet] = run?.playerState[planet]?.combusted ?? false;
      return acc;
    }, {} as Record<PlanetName, boolean>);
  }, [displayCombusted, run]);

  const opponentCombusted = useMemo(() => {
    if (displayCombusted) return displayCombusted.other as Record<PlanetName, boolean>;
    return PLANETS.reduce<Record<PlanetName, boolean>>((acc, planet) => {
      acc[planet] = run?.opponentState[planet]?.combusted ?? false;
      return acc;
    }, {} as Record<PlanetName, boolean>);
  }, [displayCombusted, run]);

  return (
    <div
      className="app"
      onPointerDownCapture={(event) => {
        if (!animating) return;
        event.preventDefault();
        event.stopPropagation();
        finishAnimation();
      }}
    >
      <HeroHeader onNewVoyage={handleStartRun} />

      <section className="stack">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Encounter</h2>
              <p className="encounter-hint">Hover a planet to inspect. Click a planet to act.</p>
            </div>
            <div className="log-meta">
              <div className="tag">Distance {run?.score ?? 0}</div>
            </div>
          </div>
          <div className="panel-body">
            {encounter && (
              <TurnTrack
                total={encounter.sequence.length}
                current={displayTurnIndex}
                opponentPlanet={displayOpponentPlanet}
                disabled={run?.over || encounter.completed}
              />
            )}
            <div className="chart-stage">
              <div className="chart-visuals">
                <div>
                  <ChartVisual
                    title="Self"
                    points={chartPoints}
                    planetColors={PLANET_COLORS}
                    afflictionValues={playerAffliction}
                    getAfflictionLevel={getAfflictionLevel}
                    highlightAffliction={highlightAffliction}
                    critPlanets={critPlanets}
                    ripplePlanets={ripplePlanets}
                    onPlanetHover={setHoveredPlanet}
                    onPlanetClick={handleSelectPlanet}
                    combusted={playerCombusted}
                    actionPlanet={actionPlanet}
                    showAspects
                    activeAspects={activeAspects}
                    pointMap={chartPointMap}
                    highlightLines={highlightLines.self}
                    diurnal={profile.chart.isDiurnal}
                    rotationDegrees={chartRotation}
                    signPolarities={selfSignPolarities}
                    projectedPairs={selfProjectedPairsByPlanet}
                    mode="self"
                  />
                </div>

                <div>
                  <ChartVisual
                    title="Other"
                    points={opponentPoints}
                    planetColors={PLANET_COLORS}
                    afflictionValues={opponentAffliction}
                    getAfflictionLevel={getAfflictionLevel}
                    highlightAffliction={highlightAffliction}
                    critPlanets={critPlanets}
                    ripplePlanets={ripplePlanets}
                    onPlanetHover={setHoveredOpponent}
                    combusted={opponentCombusted}
                    activePlanet={displayOpponentPlanet}
                    actionPlanet={actionOpponent}
                    showAspects={Boolean(hoveredOpponent ?? actionOpponent ?? hoveredPlanet)}
                    activeAspects={activeOpponentAspects}
                    pointMap={opponentPointMap}
                    highlightLines={highlightLines.other}
                    rotationDegrees={opponentRotation}
                    signPolarities={otherSignPolarities}
                    mode="other"
                  />
                </div>
              </div>
              <ChartTooltip
                hoveredPlanet={hoveredPlanet}
                hoveredOpponent={hoveredOpponent}
                opponentPlanet={displayOpponentPlanet}
                playerChart={profile.chart}
                opponentChart={opponentChart}
              />
            </div>
          </div>
        </div>
      </section>

      <InteractionChart
        playerChart={profile.chart}
        opponentChart={opponentChart}
        opponentPlanet={displayOpponentPlanet}
        run={run}
        focusedPlanet={hoveredPlanet}
      />
      <EncounterLog run={run} />
    </div>
  );
}
