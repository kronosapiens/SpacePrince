import { useEffect, useState } from "react";
import {
  advanceEncounter,
  createRun,
  generateChart,
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
import { useEncounterViewModel } from "./components/useEncounterViewModel";
import { InteractionChart } from "./components/InteractionChart";
import { roundDisplay } from "./lib/format";
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
  const [frozenDistance, setFrozenDistance] = useState<number | null>(null);
  const {
    animating,
    actionPlanet,
    actionOpponent,
    highlightAffliction,
    critPlanets,
    highlightLines,
    displayAffliction,
    displayCombusted,
    startAnimation,
    finishAnimation,
  } = useCombatAnimation();

  const {
    encounter,
    opponentChart,
    displayOpponentPlanet,
    displayTurnIndex,
    chartPoints,
    opponentPoints,
    chartRotation,
    opponentRotation,
    chartPointMap,
    opponentPointMap,
    activeAspects,
    activeOpponentAspects,
    projectedEffectsBySide,
    selfSignPolarities,
    otherSignPolarities,
    playerAffliction,
    opponentAffliction,
    playerCombusted,
    opponentCombusted,
  } = useEncounterViewModel({
    profileChart: profile.chart,
    run,
    animating,
    actionPlanet,
    actionOpponent,
    hoveredPlanet,
    hoveredOpponent,
    displayAffliction,
    displayCombusted,
  });

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
    setRun(updated);
    if (!currentOpponent) return;
    const entry = updated.log[0];
    if (!entry) return;
    setFrozenDistance(roundDisplay(run.score ?? 0));
    startAnimation(entry, previousRun);
  };

  const handleContinueEncounter = () => {
    if (!run || run.over) return;
    if (!encounter || !encounter.completed) return;
    setProfile((prev) => ({ ...prev, totalEncounters: prev.totalEncounters + 1 }));
    setRun(advanceEncounter(run));
  };

  useEffect(() => {
    if (!animating) {
      setFrozenDistance(null);
    }
  }, [animating]);

  const getAfflictionLevel = (value: number) => Math.min(3, Math.floor(value / 3));

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
              <div className="tag">Distance | {frozenDistance ?? roundDisplay(run?.score ?? 0)}</div>
            </div>
          </div>
          <div className="panel-body">
            {encounter && (
              <TurnTrack
                total={encounter.sequence.length}
                current={displayTurnIndex}
                opponentPlanet={displayOpponentPlanet}
                disabled={run?.over || encounter.completed}
                actionSlot={
                  encounter.completed && !run?.over ? (
                    <button className="btn turn-continue-inline" onClick={handleContinueEncounter} disabled={animating}>
                      Continue
                    </button>
                  ) : undefined
                }
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
                    projectedEffects={projectedEffectsBySide.self}
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
                    projectedEffects={projectedEffectsBySide.other}
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

      <div className="interaction-log-row">
        <InteractionChart
          playerChart={profile.chart}
          opponentChart={opponentChart}
          opponentPlanet={displayOpponentPlanet}
          run={run}
          focusedPlanet={hoveredPlanet}
        />
        <EncounterLog run={run} />
      </div>
    </div>
  );
}
