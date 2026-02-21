import { useEffect, useMemo, useState } from "react";
import { PLANETS, PLANET_BASE_STATS, ELEMENT_QUALITIES } from "./game/data";
import {
  advanceEncounter,
  createRun,
  generateChart,
  getAspects,
  resolveTurn,
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
    highlightLines,
    displayAffliction,
    startAnimation,
    finishAnimation,
  } = useCombatAnimation();

  const aspects = useMemo(() => getAspects(profile.chart), [profile.chart]);

  const encounter = run?.encounters[run.encounterIndex];
  const opponentChart = encounter?.opponentChart;
  const opponentPlanet = encounter?.sequence[encounter.turnIndex];

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

  const activeAspects = useMemo(() => {
    const source = hoveredPlanet ?? actionPlanet;
    if (!source) return [];
    return aspects.filter((aspect) => aspect.from === source);
  }, [hoveredPlanet, actionPlanet, aspects]);

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
    }
    const currentOpponent = encounter?.sequence[encounter.turnIndex];
    const previousRun = run;
    const updated = resolveTurn(run, profile.chart, planet, () => Math.random());
    setRun(updated);
    if (!currentOpponent) return;
    const entry = updated.log[0];
    if (!entry) return;
    startAnimation(entry, previousRun);
  };

  useEffect(() => {
    if (!run || !encounter?.completed || run.over) return;
    setProfile({ ...profile, totalEncounters: profile.totalEncounters + 1 });
    setRun(advanceEncounter(run));
  }, [run, encounter, profile, setProfile, setRun]);

  const getPolarity = (elementA: string, elementB: string) => {
    const qualitiesA = ELEMENT_QUALITIES[elementA as keyof typeof ELEMENT_QUALITIES];
    const qualitiesB = ELEMENT_QUALITIES[elementB as keyof typeof ELEMENT_QUALITIES];
    const shared = qualitiesA.filter((q) => qualitiesB.includes(q)).length;
    if (shared === 2) return "Testimony";
    if (shared === 1) return "Friction";
    return "Affliction";
  };

  const getEffectiveStats = (planet: PlanetName, affliction: number, chart: Chart) => {
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
      durability: base.durability * scale,
      luck: base.luck * scale,
    };
  };

  const getProjectedDelta = (planet: PlanetName) => {
    if (!run || !encounter || !opponentChart || !opponentPlanet) return null;
    if (run.playerState[planet].combusted) return null;
    const placement = profile.chart.planets[planet];
    const opponentPlacement = opponentChart.planets[opponentPlanet];
    const polarity = getPolarity(placement.element, opponentPlacement.element);
    const playerStats = getEffectiveStats(planet, run.playerState[planet].affliction, profile.chart);
    const opponentStats = getEffectiveStats(
      opponentPlanet,
      run.opponentState[opponentPlanet].affliction,
      opponentChart
    );

    const outgoingMap = { Cardinal: 1.25, Fixed: 1, Mutable: 1 } as const;
    const incomingMap = { Cardinal: 1, Fixed: 1, Mutable: 1.25 } as const;

    const friction = polarity === "Friction" ? 0.5 : 1;
    const playerToOpponent =
      (polarity === "Testimony" ? playerStats.healing : playerStats.damage) *
      outgoingMap[placement.modality] *
      incomingMap[opponentPlacement.modality] *
      friction;
    const opponentToPlayer =
      (polarity === "Testimony" ? opponentStats.healing : opponentStats.damage) *
      outgoingMap[opponentPlacement.modality] *
      incomingMap[placement.modality] *
      friction;

    const roundedPlayer = Math.max(0, Math.round(opponentToPlayer));
    const roundedOpponent = Math.max(0, Math.round(playerToOpponent));

    const selfDelta = polarity === "Testimony" ? -roundedPlayer : roundedPlayer;
    const otherDelta = polarity === "Testimony" ? -roundedOpponent : roundedOpponent;

    return { selfDelta, otherDelta, polarity };
  };

  const projected = hoveredPlanet ? getProjectedDelta(hoveredPlanet) : null;
  const getAfflictionLevel = (value: number) => Math.min(3, Math.floor(value / 3));

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
    return PLANETS.reduce<Record<PlanetName, boolean>>((acc, planet) => {
      acc[planet] = run?.playerState[planet]?.combusted ?? false;
      return acc;
    }, {} as Record<PlanetName, boolean>);
  }, [run]);

  const opponentCombusted = useMemo(() => {
    return PLANETS.reduce<Record<PlanetName, boolean>>((acc, planet) => {
      acc[planet] = run?.opponentState[planet]?.combusted ?? false;
      return acc;
    }, {} as Record<PlanetName, boolean>);
  }, [run]);

  return (
    <div className="app">
      <HeroHeader onNewVoyage={handleStartRun} />

      <section className="stack">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Encounter</h2>
              <p className="encounter-hint">Hover a planet to inspect. Click a planet to act.</p>
            </div>
            <div className="log-meta">
              <div className="tag">Fortune {run?.score ?? 0}</div>
            </div>
          </div>
          <div className="panel-body">
            {encounter && (
              <TurnTrack
                total={encounter.sequence.length}
                current={encounter.turnIndex}
                opponentPlanet={opponentPlanet}
                disabled={run?.over || encounter.completed}
              />
            )}
            <div className="chart-stage">
              <div className="chart-visuals">
                <ChartVisual
                  title="Self"
                  points={chartPoints}
                  planetColors={PLANET_COLORS}
                  afflictionValues={playerAffliction}
                  getAfflictionLevel={getAfflictionLevel}
                  highlightAffliction={highlightAffliction}
                  onPlanetHover={setHoveredPlanet}
                  onPlanetClick={handleSelectPlanet}
                  combusted={playerCombusted}
                  actionPlanet={actionPlanet}
                  showAspects
                  activeAspects={activeAspects}
                  pointMap={chartPointMap}
                  highlightLines={highlightLines}
                  diurnal={profile.chart.isDiurnal}
                  rotationDegrees={chartRotation}
                  ascendantSign={profile.chart.ascendantSign ?? "Aries"}
                  mode="self"
                />

                <ChartVisual
                  title="Other"
                  points={opponentPoints}
                  planetColors={PLANET_COLORS}
                  afflictionValues={opponentAffliction}
                  getAfflictionLevel={getAfflictionLevel}
                  highlightAffliction={highlightAffliction}
                  onPlanetHover={setHoveredOpponent}
                  combusted={opponentCombusted}
                  activePlanet={opponentPlanet}
                  actionPlanet={actionOpponent}
                  rotationDegrees={opponentRotation}
                  ascendantSign={opponentChart?.ascendantSign ?? "Aries"}
                  mode="other"
                />
              </div>
              <ChartTooltip
                hoveredPlanet={hoveredPlanet}
                hoveredOpponent={hoveredOpponent}
                opponentPlanet={opponentPlanet}
                playerChart={profile.chart}
                opponentChart={opponentChart}
                projected={projected}
              />
            </div>
          </div>
        </div>
      </section>

      <InteractionChart
        playerChart={profile.chart}
        opponentChart={opponentChart}
        opponentPlanet={opponentPlanet}
        run={run}
        focusedPlanet={hoveredPlanet}
      />
      <EncounterLog run={run} />
    </div>
  );
}
