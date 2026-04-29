import { useMemo } from "react";
import { PLANETS, SIGN_ELEMENT, SIGNS } from "../game/data";
import { getPolarity } from "../game/combat";
import { getAspects } from "../game/logic";
import { computeProjectedEffects } from "../game/projections";
import type { Chart, PlanetName, RunState, SignName } from "../game/types";
import { buildChartPoints, buildPointMap, getChartRotationDegrees } from "../lib/chart";

interface UseEncounterViewModelArgs {
  profileChart: Chart;
  run: RunState | null;
  animating: boolean;
  actionPlanet: PlanetName | null;
  actionOpponent: PlanetName | null;
  hoveredPlanet: PlanetName | null;
  hoveredOpponent: PlanetName | null;
  displayAffliction: { self: Record<string, number>; other: Record<string, number> } | null;
  displayCombusted: { self: Record<string, boolean>; other: Record<string, boolean> } | null;
}

function mapPlanets<T>(valueFor: (planet: PlanetName) => T): Record<PlanetName, T> {
  return PLANETS.reduce<Record<PlanetName, T>>((acc, planet) => {
    acc[planet] = valueFor(planet);
    return acc;
  }, {} as Record<PlanetName, T>);
}

export function useEncounterViewModel({
  profileChart,
  run,
  animating,
  actionPlanet,
  actionOpponent,
  hoveredPlanet,
  hoveredOpponent,
  displayAffliction,
  displayCombusted,
}: UseEncounterViewModelArgs) {
  const encounter = run?.encounters[run.encounterIndex];
  const opponentChart = encounter?.opponentChart;
  const opponentPlanet = encounter?.sequence[encounter.turnIndex];
  const displayOpponentPlanet = animating ? actionOpponent ?? opponentPlanet : opponentPlanet;
  const displayTurnIndex =
    animating && encounter ? Math.max(0, encounter.turnIndex - 1) : encounter?.turnIndex ?? 0;

  const aspects = useMemo(() => getAspects(profileChart), [profileChart]);
  const opponentAspects = useMemo(
    () => (opponentChart ? getAspects(opponentChart) : []),
    [opponentChart]
  );

  const chartPoints = useMemo(() => buildChartPoints(profileChart), [profileChart]);
  const opponentPoints = useMemo(
    () => (opponentChart ? buildChartPoints(opponentChart) : []),
    [opponentChart]
  );
  const chartRotation = useMemo(() => getChartRotationDegrees(profileChart), [profileChart]);
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

  const projectedEffectsBySide = useMemo(() => {
    const empty = {
      self: {} as Partial<Record<PlanetName, number>>,
      other: {} as Partial<Record<PlanetName, number>>,
    };
    if (animating || !hoveredPlanet || !run || !encounter || !opponentChart || !displayOpponentPlanet) {
      return empty;
    }

    return computeProjectedEffects({
      playerChart: profileChart,
      opponentChart,
      playerPlanet: hoveredPlanet,
      opponentPlanet: displayOpponentPlanet,
      playerState: run.playerState,
      opponentState: run.opponentState,
      playerAspects: aspects,
      opponentAspects,
    });
  }, [
    animating,
    hoveredPlanet,
    run,
    encounter,
    opponentChart,
    displayOpponentPlanet,
    profileChart,
    aspects,
    opponentAspects,
  ]);

  const selfSignPolarities = useMemo(() => {
    if (!opponentChart || !displayOpponentPlanet) return {};
    const opponentElement = opponentChart.planets[displayOpponentPlanet].element;
    return SIGNS.reduce<Partial<Record<SignName, "Affliction" | "Testimony" | "Friction">>>(
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
    const playerElement = profileChart.planets[playerRef].element;
    return SIGNS.reduce<Partial<Record<SignName, "Affliction" | "Testimony" | "Friction">>>(
      (acc, sign) => {
        acc[sign] = getPolarity(SIGN_ELEMENT[sign], playerElement);
        return acc;
      },
      {}
    );
  }, [hoveredPlanet, actionPlanet, profileChart]);

  const playerAffliction = useMemo(() => {
    if (displayAffliction) return displayAffliction.self as Record<PlanetName, number>;
    return mapPlanets((planet) => run?.playerState[planet]?.affliction ?? 0);
  }, [displayAffliction, run]);

  const opponentAffliction = useMemo(() => {
    if (displayAffliction) return displayAffliction.other as Record<PlanetName, number>;
    return mapPlanets((planet) => run?.opponentState[planet]?.affliction ?? 0);
  }, [displayAffliction, run]);

  const playerCombusted = useMemo(() => {
    if (displayCombusted) return displayCombusted.self as Record<PlanetName, boolean>;
    return mapPlanets((planet) => run?.playerState[planet]?.combusted ?? false);
  }, [displayCombusted, run]);

  const opponentCombusted = useMemo(() => {
    if (displayCombusted) return displayCombusted.other as Record<PlanetName, boolean>;
    return mapPlanets((planet) => run?.opponentState[planet]?.combusted ?? false);
  }, [displayCombusted, run]);

  return {
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
  };
}
