import {
  ELEMENT_BUFFS,
  ELEMENT_QUALITIES,
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
import type {
  AspectConnection,
  AspectType,
  Chart,
  Dignity,
  ElementType,
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

const IN_SECT_DURABILITY_BONUS = 1;
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
    const planetSect = resolvePlanetSect(planet, isDiurnal);
    if (planetSect === chartSect) {
      buffs.durability += IN_SECT_DURABILITY_BONUS;
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

function createInitialCarryState(): Record<PlanetName, number> {
  return PLANETS.reduce((acc, planet) => {
    acc[planet] = 0;
    return acc;
  }, {} as Record<PlanetName, number>);
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
    playerCarry: createInitialCarryState(),
    opponentCarry: createInitialCarryState(),
    log: [],
    totalAffliction: 0,
    totalTestimony: 0,
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

  const playerStateMap: Record<PlanetName, PlanetState> = PLANETS.reduce((acc, planet) => {
    acc[planet] = { ...run.playerState[planet] };
    return acc;
  }, {} as Record<PlanetName, PlanetState>);
  const opponentStateMap: Record<PlanetName, PlanetState> = PLANETS.reduce((acc, planet) => {
    acc[planet] = { ...run.opponentState[planet] };
    return acc;
  }, {} as Record<PlanetName, PlanetState>);
  const playerCarryMap: Record<PlanetName, number> = PLANETS.reduce((acc, planet) => {
    acc[planet] = run.playerCarry?.[planet] ?? 0;
    return acc;
  }, {} as Record<PlanetName, number>);
  const opponentCarryMap: Record<PlanetName, number> = PLANETS.reduce((acc, planet) => {
    acc[planet] = run.opponentCarry?.[planet] ?? 0;
    return acc;
  }, {} as Record<PlanetName, number>);

  const playerState = playerStateMap[playerPlanet];
  const opponentState = opponentStateMap[opponentPlanet];

  const polarity = getPolarity(playerPlacement.element, opponentPlacement.element);

  const playerEffective = playerState.combusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStats(playerPlacement);
  const opponentEffective = opponentState.combusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStats(opponentPlacement);

  const playerCrit = rollCrit(playerEffective.luck, rng);
  const opponentCrit = rollCrit(opponentEffective.luck, rng);
  const playerToOpponent = computeEffectAmount(polarity, playerEffective, playerCrit);
  const opponentToPlayer = computeEffectAmount(polarity, opponentEffective, opponentCrit);
  const friction = polarity === "Friction" ? 0.5 : 1;
  const playerBase = polarity === "Testimony" ? playerEffective.healing : playerEffective.damage;
  const opponentBase = polarity === "Testimony" ? opponentEffective.healing : opponentEffective.damage;

  const playerDirect = applyEffectWithCarry(
    playerState,
    polarity,
    opponentToPlayer,
    playerCarryMap[playerPlanet]
  );
  const opponentDirect = applyEffectWithCarry(
    opponentState,
    polarity,
    playerToOpponent,
    opponentCarryMap[opponentPlanet]
  );
  playerCarryMap[playerPlanet] = playerDirect.carry;
  opponentCarryMap[opponentPlanet] = opponentDirect.carry;
  const playerDelta = playerDirect.delta;
  const opponentDelta = opponentDirect.delta;

  const playerCombust =
    polarity !== "Testimony" && playerDelta > 0
      ? maybeCombust(playerPlacement, playerState, rng)
      : false;
  const opponentCombust =
    polarity !== "Testimony" && opponentDelta > 0
      ? maybeCombust(opponentPlacement, opponentState, rng)
      : false;

  const playerPropagation = propagateEffects(
    playerStateMap,
    playerChart,
    playerPlanet,
    polarity,
    opponentToPlayer,
    rng,
    "self",
    playerCarryMap
  );
  const opponentPropagation = propagateEffects(
    opponentStateMap,
    opponentChart,
    opponentPlanet,
    polarity,
    playerToOpponent,
    rng,
    "other",
    opponentCarryMap
  );
  const propagation = [...playerPropagation, ...opponentPropagation];

  let turnAffliction = 0;
  let turnTestimony = 0;
  if (polarity === "Testimony") {
    turnTestimony += playerDelta + opponentDelta;
  } else {
    turnAffliction += playerDelta + opponentDelta;
  }
  propagation.forEach((prop) => {
    if (prop.delta > 0) turnAffliction += prop.delta;
    if (prop.delta < 0) turnTestimony += Math.abs(prop.delta);
  });
  const turnScore = turnAffliction + turnTestimony;

  const logEntry: TurnLogEntry = {
    id: `turn_${run.log.length}_${Date.now()}`,
    turnIndex: encounter.turnIndex + 1,
    playerPlanet,
    opponentPlanet,
    polarity,
    playerDelta,
    opponentDelta,
    playerCrit,
    opponentCrit,
    playerCombust,
    opponentCombust,
    propagation,
    turnAffliction,
    turnTestimony,
    turnScore,
    directBreakdown: {
      playerBase,
      friction,
      playerCritMultiplier: playerCrit ? 2 : 1,
      playerResult: playerToOpponent,
      opponentBase,
      opponentCritMultiplier: opponentCrit ? 2 : 1,
      opponentResult: opponentToPlayer,
    },
  };

  const priorAffliction = run.totalAffliction ?? 0;
  const priorTestimony = run.totalTestimony ?? 0;
  const priorScore = run.score ?? 0;
  const updatedRun = {
    ...run,
    log: [logEntry, ...run.log].slice(0, 12),
    totalAffliction: priorAffliction + turnAffliction,
    totalTestimony: priorTestimony + turnTestimony,
    score: priorScore + turnScore,
  } as RunState;

  updatedRun.playerState = playerStateMap;
  updatedRun.opponentState = opponentStateMap;
  updatedRun.playerCarry = playerCarryMap;
  updatedRun.opponentCarry = opponentCarryMap;

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
    opponentCarry: createInitialCarryState(),
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

export function getPolarity(a: ElementType, b: ElementType): Polarity {
  const qualitiesA = ELEMENT_QUALITIES[a];
  const qualitiesB = ELEMENT_QUALITIES[b];
  const shared = qualitiesA.filter((q) => qualitiesB.includes(q)).length;
  if (shared === 2) return "Testimony";
  if (shared === 1) return "Friction";
  return "Affliction";
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

function resolvePlanetSect(planet: PlanetName, isDiurnal: boolean): "Day" | "Night" {
  const base = PLANET_SECT[planet];
  if (base === "Flexible") return isDiurnal ? "Day" : "Night";
  return base;
}

function addStats(a: PlanetBaseStats, b: PlanetBaseStats): PlanetBaseStats {
  return {
    damage: a.damage + b.damage,
    healing: a.healing + b.healing,
    durability: a.durability + b.durability,
    luck: a.luck + b.luck,
  };
}

function getEffectiveStats(placement: PlanetPlacement) {
  const base = addStats(placement.base, placement.buffs);
  return {
    damage: Math.max(0, base.damage),
    healing: Math.max(0, base.healing),
    durability: Math.max(0, base.durability),
    luck: Math.max(0, base.luck),
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

function quantizeWithCarry(rawAmount: number, carry: number) {
  const effective = Math.max(0, rawAmount + carry);
  const amount = Math.max(0, Math.round(effective));
  return { amount, carry: effective - amount };
}

function applyEffectWithCarry(
  state: PlanetState,
  polarity: Polarity,
  rawAmount: number,
  carry: number
): { delta: number; carry: number } {
  if (rawAmount <= 0) return { delta: 0, carry };
  if (state.combusted) return { delta: 0, carry };
  const quantized = quantizeWithCarry(rawAmount, carry);
  if (quantized.amount <= 0) return { delta: 0, carry: quantized.carry };
  if (polarity === "Testimony") {
    const before = state.affliction;
    state.affliction = Math.max(0, state.affliction - quantized.amount);
    const delta = before - state.affliction;
    const nextCarry = delta < quantized.amount ? 0 : quantized.carry;
    return { delta, carry: nextCarry };
  }
  state.affliction += quantized.amount;
  return { delta: quantized.amount, carry: quantized.carry };
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
  side: "self" | "other",
  carryMap: Record<PlanetName, number>
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

    const applied = applyEffectWithCarry(
      targetState,
      effectPolarity,
      magnitude,
      carryMap[aspect.to] ?? 0
    );
    carryMap[aspect.to] = applied.carry;
    if (applied.delta === 0) return;
    const combust =
      effectPolarity !== "Testimony"
        ? maybeCombust(targetPlacement, targetState, rng)
        : false;

    propagation.push({
      side,
      source: activePlanet,
      target: aspect.to,
      delta: effectPolarity === "Testimony" ? -applied.delta : applied.delta,
      note: `${aspect.aspect} ${inverted ? "inverts" : "flows"}`,
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
