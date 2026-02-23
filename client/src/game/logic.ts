import {
  ELEMENT_BUFFS,
  EXALTATIONS,
  MODALITY_BUFFS,
  PLANET_BASE_STATS,
  PLANET_ORDER_UNLOCK,
  PLANET_UNLOCK_COSTS,
  PLANET_SECT,
  PLANETS,
  RULERSHIP,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  SIGNS,
  MAX_ENCOUNTERS,
} from "./data";
import { getEffectiveStatsFromPlacement, getPolarity } from "./combat";
import type {
  AspectConnection,
  AspectType,
  Chart,
  Dignity,
  EncounterState,
  PlanetBaseStats,
  PlanetName,
  PlanetPlacement,
  PlanetState,
  Polarity,
  SignName,
  TurnLogEntry,
  RunState,
} from "./types";
import { mulberry32, randomSeed } from "./rng";

const ASPECT_BASE: Record<Exclude<AspectType, "None">, number> = {
  Conjunction: 1,
  Sextile: 0.5,
  Trine: 0.5,
  Square: -0.5,
  Opposition: -1,
};

const IN_SECT_LUCK_BONUS = 1;
const MERCURY_MAX_ELONGATION_DEGREES = 28;
const VENUS_MAX_ELONGATION_DEGREES = 47;
const DIGNITY_COMBUST_FACTOR: Record<Dignity, number> = {
  Domicile: 0.75,
  Exaltation: 0.9,
  Neutral: 1,
  Detriment: 1.15,
  Fall: 1.3,
};

export function generateChart(seed = randomSeed(), name = "Prince"): Chart {
  const rng = mulberry32(seed);
  const isDiurnal = rng() > 0.5;
  const chartSect = isDiurnal ? "Day" : "Night";
  const planets: Record<PlanetName, PlanetPlacement> = {} as Record<PlanetName, PlanetPlacement>;
  const longitudes: Partial<Record<PlanetName, number>> = {
    Sun: rng() * 360,
  };
  const sunLongitude = longitudes.Sun ?? 0;
  longitudes.Mercury = normalizeLongitude(
    sunLongitude + sampleCenteredOffset(rng, MERCURY_MAX_ELONGATION_DEGREES)
  );
  longitudes.Venus = normalizeLongitude(
    sunLongitude + sampleCenteredOffset(rng, VENUS_MAX_ELONGATION_DEGREES)
  );
  PLANETS.forEach((planet) => {
    if (longitudes[planet] !== undefined) return;
    longitudes[planet] = rng() * 360;
  });

  PLANETS.forEach((planet) => {
    const longitude = longitudes[planet] ?? 0;
    const sign = SIGNS[Math.floor(longitude / 30)];
    const element = SIGN_ELEMENT[sign];
    const modality = SIGN_MODALITY[sign];
    const base = PLANET_BASE_STATS[planet];
    const buffs = addStats(ELEMENT_BUFFS[element], MODALITY_BUFFS[modality]);
    const planetSect = resolvePlanetSect(planet, longitude, sunLongitude);
    if (planetSect === chartSect) {
      buffs.luck += IN_SECT_LUCK_BONUS;
    }
    const dignity = getDignity(planet, sign);

    planets[planet] = {
      planet,
      sign,
      eclipticLongitude: longitude,
      element,
      modality,
      base,
      buffs,
      dignity,
    };
  });

  const ascendantSign = SIGNS[Math.floor(rng() * SIGNS.length)];

  return {
    id: `chart_${seed}`,
    name,
    isDiurnal,
    ascendantSign,
    planets,
  };
}

function normalizeLongitude(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function sampleCenteredOffset(rng: () => number, maxAbs: number) {
  return (rng() + rng() - 1) * maxAbs;
}

export function getUnlockedPlanets(totalEncounters: number, unlockAll = false): PlanetName[] {
  if (unlockAll) return [...PLANET_ORDER_UNLOCK];
  return PLANET_ORDER_UNLOCK.filter((planet) => PLANET_UNLOCK_COSTS[planet] <= totalEncounters);
}

export function createInitialPlanetState(): Record<PlanetName, PlanetState> {
  return PLANETS.reduce((acc, planet) => {
    acc[planet] = { affliction: 0, combusted: false, exaltationSaveUsed: false };
    return acc;
  }, {} as Record<PlanetName, PlanetState>);
}

export function createRun(
  playerChart: Chart,
  totalEncounters: number,
  unlockAll = false,
  seed = randomSeed()
): RunState {
  const unlockedPlanets = getUnlockedPlanets(totalEncounters, unlockAll);
  const rng = mulberry32(seed);

  const encounters: EncounterState[] = Array.from({ length: MAX_ENCOUNTERS }, (_, index) => {
    const opponentSeed = Math.floor(rng() * 2 ** 31);
    const opponentChart = generateChart(opponentSeed, `Opponent ${index + 1}`);
    const sequence = buildEncounterSequence(playerChart, opponentChart, unlockedPlanets, rng);
    return {
      id: `encounter_${seed}_${index}`,
      index,
      opponentChart,
      sequence,
      turnIndex: 0,
      completed: false,
    };
  });

  return {
    id: `run_${seed}`,
    seed,
    encounterIndex: 0,
    encounters,
    unlockedPlanets,
    playerState: createInitialPlanetState(),
    opponentState: createInitialPlanetState(),
    log: [],
    score: 0,
    over: false,
    victory: false,
  };
}

export function buildEncounterSequence(
  playerChart: Chart,
  opponentChart: Chart,
  unlockedPlanets: PlanetName[],
  rng: () => number
): PlanetName[] {
  const weights = PLANETS.map((planet) => {
    const count = PLANETS.reduce((acc, playerPlanet) => {
      const aspect = getAspectType(
        playerChart.planets[playerPlanet].sign,
        opponentChart.planets[planet].sign
      );
      return acc + (aspect !== "None" ? 1 : 0);
    }, 0);
    return Math.max(1, count);
  });

  return Array.from({ length: unlockedPlanets.length }, () => {
    const choice = weightedChoice(PLANETS, weights, rng);
    return choice;
  });
}

export function resolveTurn(
  run: RunState,
  playerChart: Chart,
  playerPlanet: PlanetName,
  rng: () => number
): RunState {
  const encounter = run.encounters[run.encounterIndex];
  if (!encounter || encounter.completed) return run;
  const opponentPlanet = encounter.sequence[encounter.turnIndex];
  if (!opponentPlanet) return run;
  const opponentChart = encounter.opponentChart;

  const playerPlacement = playerChart.planets[playerPlanet];
  const opponentPlacement = opponentChart.planets[opponentPlanet];

  const playerStateMap = clonePlanetStateMap(run.playerState);
  const opponentStateMap = clonePlanetStateMap(run.opponentState);

  const playerState = playerStateMap[playerPlanet];
  const opponentState = opponentStateMap[opponentPlanet];

  const directPhase = computeDirectPhase(playerPlacement, opponentPlacement, playerState, opponentState, rng);
  const { playerDelta, opponentDelta } = applyDirectPhase(
    playerState,
    opponentState,
    directPhase.polarity,
    directPhase.opponentToPlayer,
    directPhase.playerToOpponent
  );
  const propagation = resolvePropagationPhase(
    playerStateMap,
    opponentStateMap,
    playerChart,
    opponentChart,
    playerPlanet,
    opponentPlanet,
    directPhase.polarity,
    directPhase.opponentToPlayer,
    directPhase.playerToOpponent,
    rng,
  );
  const { playerCombust, opponentCombust } = resolveDirectCombustionPhase(
    playerPlacement,
    opponentPlacement,
    playerState,
    opponentState,
    directPhase.polarity,
    playerDelta,
    opponentDelta,
    rng
  );
  const turnScore = computeTurnScore(playerDelta, opponentDelta, propagation);
  const logEntry = buildTurnLogEntry({
    runLogLength: run.log.length,
    turnIndex: encounter.turnIndex + 1,
    playerPlanet,
    opponentPlanet,
    polarity: directPhase.polarity,
    playerDelta,
    opponentDelta,
    playerCrit: directPhase.playerCrit,
    opponentCrit: directPhase.opponentCrit,
    playerCombust,
    opponentCombust,
    propagation,
    turnScore,
    playerBase: directPhase.playerBase,
    opponentBase: directPhase.opponentBase,
    friction: directPhase.friction,
    playerResult: directPhase.playerToOpponent,
    opponentResult: directPhase.opponentToPlayer,
  });

  const priorScore = run.score ?? 0;
  const updatedRun = {
    ...run,
    log: [logEntry, ...run.log].slice(0, 12),
    score: priorScore + turnScore,
  } as RunState;

  updatedRun.playerState = playerStateMap;
  updatedRun.opponentState = opponentStateMap;

  updatedRun.encounters = updatedRun.encounters.map((enc) =>
    enc.id === encounter.id
      ? {
          ...enc,
          turnIndex: enc.turnIndex + 1,
          completed: enc.turnIndex + 1 >= enc.sequence.length,
        }
      : enc
  );

  return evaluateRunState(updatedRun);
}

export function advanceEncounter(run: RunState): RunState {
  const nextIndex = run.encounterIndex + 1;
  if (nextIndex >= run.encounters.length) {
    return {
      ...run,
      over: true,
      victory: true,
    };
  }

  return {
    ...run,
    encounterIndex: nextIndex,
    opponentState: createInitialPlanetState(),
  };
}

export function skipCombustedOpponentTurns(run: RunState): RunState {
  if (run.over) return run;
  const encounter = run.encounters[run.encounterIndex];
  if (!encounter || encounter.completed) return run;

  let turnIndex = encounter.turnIndex;
  while (turnIndex < encounter.sequence.length) {
    const planet = encounter.sequence[turnIndex];
    if (!run.opponentState[planet]?.combusted) break;
    turnIndex += 1;
  }

  if (turnIndex === encounter.turnIndex) return run;
  const completed = turnIndex >= encounter.sequence.length;

  return {
    ...run,
    encounters: run.encounters.map((enc) =>
      enc.id === encounter.id
        ? {
            ...enc,
            turnIndex,
            completed,
          }
        : enc
    ),
  };
}

export function getAspects(chart: Chart): AspectConnection[] {
  const connections: AspectConnection[] = [];
  const planets = PLANETS;

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const a = planets[i];
      const b = planets[j];
      const aspect = getAspectType(chart.planets[a].sign, chart.planets[b].sign);
      if (aspect === "None") continue;
      const multiplier = ASPECT_BASE[aspect];
      connections.push({ from: a, to: b, aspect, multiplier });
      connections.push({ from: b, to: a, aspect, multiplier });
    }
  }
  return connections;
}

function getDignity(planet: PlanetName, sign: SignName): Dignity {
  if (RULERSHIP[sign] === planet) return "Domicile";
  const exalted = EXALTATIONS[planet];
  if (exalted && exalted === sign) return "Exaltation";
  const opposite = getOppositeSign(sign);
  if (RULERSHIP[opposite] === planet) return "Detriment";
  if (exalted && getOppositeSign(exalted) === sign) return "Fall";
  return "Neutral";
}

function getOppositeSign(sign: SignName): SignName {
  const index = SIGNS.indexOf(sign);
  return SIGNS[(index + 6) % 12];
}

function getAspectType(signA: SignName, signB: SignName): AspectType {
  const indexA = SIGNS.indexOf(signA);
  const indexB = SIGNS.indexOf(signB);
  const delta = (indexB - indexA + 12) % 12;
  const distance = Math.min(delta, 12 - delta);
  switch (distance) {
    case 0:
      return "Conjunction";
    case 2:
      return "Sextile";
    case 3:
      return "Square";
    case 4:
      return "Trine";
    case 6:
      return "Opposition";
    default:
      return "None";
  }
}

function resolvePlanetSect(
  planet: PlanetName,
  longitude: number,
  sunLongitude: number
): "Day" | "Night" {
  const base = PLANET_SECT[planet];
  if (base === "Flexible") return resolveMercurySect(longitude, sunLongitude);
  return base;
}

function resolveMercurySect(mercuryLongitude: number, sunLongitude: number): "Day" | "Night" {
  const delta = normalizeLongitude(mercuryLongitude - sunLongitude);
  return delta > 180 ? "Day" : "Night";
}

function addStats(a: PlanetBaseStats, b: PlanetBaseStats): PlanetBaseStats {
  return {
    damage: a.damage + b.damage,
    healing: a.healing + b.healing,
    durability: a.durability + b.durability,
    luck: a.luck + b.luck,
  };
}

function rollCrit(luck: number, rng: () => number) {
  const chance = Math.max(0, luck * 0.1);
  return rng() < chance;
}

function computeEffectAmount(
  polarity: Polarity,
  stats: { damage: number; healing: number },
  crit: boolean
) {
  const critMultiplier = crit ? 2 : 1;
  const base = polarity === "Testimony" ? stats.healing : stats.damage;
  const friction = polarity === "Friction" ? 0.5 : 1;
  const amount = base * critMultiplier * friction;
  return Math.max(0, amount);
}

function clonePlanetStateMap(stateMap: Record<PlanetName, PlanetState>): Record<PlanetName, PlanetState> {
  return PLANETS.reduce((acc, planet) => {
    acc[planet] = { ...stateMap[planet] };
    return acc;
  }, {} as Record<PlanetName, PlanetState>);
}

function computeDirectPhase(
  playerPlacement: PlanetPlacement,
  opponentPlacement: PlanetPlacement,
  playerState: PlanetState,
  opponentState: PlanetState,
  rng: () => number
) {
  const polarity = getPolarity(playerPlacement.element, opponentPlacement.element);
  const playerEffective = playerState.combusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStatsFromPlacement(playerPlacement);
  const opponentEffective = opponentState.combusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStatsFromPlacement(opponentPlacement);
  const playerCrit = rollCrit(playerEffective.luck, rng);
  const opponentCrit = rollCrit(opponentEffective.luck, rng);
  const playerToOpponent = computeEffectAmount(polarity, playerEffective, playerCrit);
  const opponentToPlayer = computeEffectAmount(polarity, opponentEffective, opponentCrit);
  const friction = polarity === "Friction" ? 0.5 : 1;
  const playerBase = polarity === "Testimony" ? playerEffective.healing : playerEffective.damage;
  const opponentBase = polarity === "Testimony" ? opponentEffective.healing : opponentEffective.damage;

  return {
    polarity,
    playerCrit,
    opponentCrit,
    playerToOpponent,
    opponentToPlayer,
    friction,
    playerBase,
    opponentBase,
  };
}

function applyDirectPhase(
  playerState: PlanetState,
  opponentState: PlanetState,
  polarity: Polarity,
  opponentToPlayer: number,
  playerToOpponent: number
) {
  const playerDirect = applyEffect(playerState, polarity, opponentToPlayer);
  const opponentDirect = applyEffect(opponentState, polarity, playerToOpponent);
  return { playerDelta: playerDirect.delta, opponentDelta: opponentDirect.delta };
}

function resolvePropagationPhase(
  playerStateMap: Record<PlanetName, PlanetState>,
  opponentStateMap: Record<PlanetName, PlanetState>,
  playerChart: Chart,
  opponentChart: Chart,
  playerPlanet: PlanetName,
  opponentPlanet: PlanetName,
  polarity: Polarity,
  opponentToPlayer: number,
  playerToOpponent: number,
  rng: () => number
) {
  const playerPropagation = propagateEffects(
    playerStateMap,
    playerChart,
    playerPlanet,
    polarity,
    opponentToPlayer,
    rng,
    "self"
  );
  const opponentPropagation = propagateEffects(
    opponentStateMap,
    opponentChart,
    opponentPlanet,
    polarity,
    playerToOpponent,
    rng,
    "other"
  );
  return [...playerPropagation, ...opponentPropagation];
}

function resolveDirectCombustionPhase(
  playerPlacement: PlanetPlacement,
  opponentPlacement: PlanetPlacement,
  playerState: PlanetState,
  opponentState: PlanetState,
  polarity: Polarity,
  playerDelta: number,
  opponentDelta: number,
  rng: () => number
) {
  const opponentCombust =
    polarity !== "Testimony" && opponentDelta > 0
      ? maybeCombust(opponentPlacement, opponentState, rng)
      : false;
  const playerCombust =
    polarity !== "Testimony" && playerDelta > 0
      ? maybeCombust(playerPlacement, playerState, rng)
      : false;
  return { playerCombust, opponentCombust };
}

function computeTurnScore(
  playerDelta: number,
  opponentDelta: number,
  propagation: TurnLogEntry["propagation"]
) {
  const directMagnitude = playerDelta + opponentDelta;
  const propagationMagnitude = propagation.reduce((sum, prop) => sum + Math.abs(prop.delta), 0);
  return directMagnitude + propagationMagnitude;
}

function buildTurnLogEntry(params: {
  runLogLength: number;
  turnIndex: number;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  polarity: Polarity;
  playerDelta: number;
  opponentDelta: number;
  playerCrit: boolean;
  opponentCrit: boolean;
  playerCombust: boolean;
  opponentCombust: boolean;
  propagation: TurnLogEntry["propagation"];
  turnScore: number;
  playerBase: number;
  friction: number;
  playerResult: number;
  opponentBase: number;
  opponentResult: number;
}): TurnLogEntry {
  return {
    id: `turn_${params.runLogLength}_${Date.now()}`,
    turnIndex: params.turnIndex,
    playerPlanet: params.playerPlanet,
    opponentPlanet: params.opponentPlanet,
    polarity: params.polarity,
    playerDelta: params.playerDelta,
    opponentDelta: params.opponentDelta,
    playerCrit: params.playerCrit,
    opponentCrit: params.opponentCrit,
    playerCombust: params.playerCombust,
    opponentCombust: params.opponentCombust,
    propagation: params.propagation,
    turnScore: params.turnScore,
    directBreakdown: {
      playerBase: params.playerBase,
      friction: params.friction,
      playerCritMultiplier: params.playerCrit ? 2 : 1,
      playerResult: params.playerResult,
      opponentBase: params.opponentBase,
      opponentCritMultiplier: params.opponentCrit ? 2 : 1,
      opponentResult: params.opponentResult,
    },
  };
}

function applyEffect(state: PlanetState, polarity: Polarity, rawAmount: number): { delta: number } {
  if (rawAmount <= 0) return { delta: 0 };
  if (state.combusted) return { delta: 0 };
  const amount = Math.max(0, rawAmount);
  if (amount <= 0) return { delta: 0 };
  if (polarity === "Testimony") {
    const before = state.affliction;
    state.affliction = Math.max(0, state.affliction - amount);
    const delta = before - state.affliction;
    return { delta };
  }
  state.affliction += amount;
  return { delta: amount };
}

function maybeCombust(
  placement: PlanetPlacement,
  state: PlanetState,
  rng: () => number
): boolean {
  if (state.combusted) return false;
  if (state.affliction <= 0) return false;

  const durability = placement.base.durability + placement.buffs.durability;
  const threshold = durability * 10;
  const ratio = threshold === 0 ? 1 : Math.min(1, state.affliction / threshold);
  const probability = Math.max(0, Math.min(0.95, ratio * DIGNITY_COMBUST_FACTOR[placement.dignity]));

  const roll = rng();
  if (roll < probability) {
    state.combusted = true;
    return true;
  }
  return false;
}

function propagateEffects(
  stateMap: Record<PlanetName, PlanetState>,
  chart: Chart,
  activePlanet: PlanetName,
  polarity: Polarity,
  amountReceived: number,
  rng: () => number,
  side: "self" | "other"
): TurnLogEntry["propagation"] {
  if (amountReceived <= 0) return [];
  if (stateMap[activePlanet]?.combusted) return [];
  const aspects = getAspects(chart).filter((a) => a.from === activePlanet);
  if (aspects.length === 0) return [];

  const propagation: TurnLogEntry["propagation"] = [];

  aspects.forEach((aspect) => {
    const magnitude = Math.max(0, Math.abs(amountReceived * aspect.multiplier));
    if (magnitude <= 0) return;

    const targetState = stateMap[aspect.to];
    if (targetState.combusted) return;
    const targetPlacement = chart.planets[aspect.to];

    const inverted = aspect.multiplier < 0;
    const effectPolarity = inverted
      ? polarity === "Testimony"
        ? "Affliction"
        : "Testimony"
      : polarity;

    const applied = applyEffect(targetState, effectPolarity, magnitude);
    const combust =
      effectPolarity !== "Testimony" && applied.delta > 0
        ? maybeCombust(targetPlacement, targetState, rng)
        : false;

    propagation.push({
      side,
      source: activePlanet,
      target: aspect.to,
      delta: effectPolarity === "Testimony" ? -applied.delta : applied.delta,
      note: `${aspect.aspect} ${inverted ? "inverts" : "flows"}${
        applied.delta === 0 ? " (no effect)" : ""
      }`,
    });

    if (combust) {
      propagation.push({
        side,
        source: activePlanet,
        target: aspect.to,
        delta: 0,
        note: "Combusts",
      });
    }
  });

  return propagation;
}

function weightedChoice<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const roll = rng() * total;
  let cumulative = 0;
  for (let i = 0; i < items.length; i += 1) {
    cumulative += weights[i];
    if (roll <= cumulative) return items[i];
  }
  return items[items.length - 1];
}

function evaluateRunState(run: RunState): RunState {
  const allCombusted = PLANETS.every((planet) => run.playerState[planet].combusted);
  const updated = { ...run } as RunState;

  if (allCombusted) {
    updated.over = true;
    updated.victory = false;
    return updated;
  }

  const encounter = updated.encounters[updated.encounterIndex];
  if (encounter && encounter.completed) {
    const isFinal = updated.encounterIndex >= updated.encounters.length - 1;
    return { ...updated, over: isFinal, victory: isFinal };
  }

  return updated;
}
