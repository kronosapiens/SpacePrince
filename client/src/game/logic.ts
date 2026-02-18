import {
  COMBUST_LIMIT,
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
  ModalityType,
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

const SAME_SECT_MULTIPLIER = 1.25;

const OUTGOING_MULTIPLIER: Record<ModalityType, number> = {
  Cardinal: 1.25,
  Fixed: 1,
  Mutable: 1,
};

const INCOMING_MULTIPLIER: Record<ModalityType, number> = {
  Cardinal: 1,
  Fixed: 1,
  Mutable: 1.25,
};

export function generateChart(seed = randomSeed(), name = "Prince"): Chart {
  const rng = mulberry32(seed);
  const planets: Record<PlanetName, PlanetPlacement> = {} as Record<PlanetName, PlanetPlacement>;

  PLANETS.forEach((planet) => {
    const sign = SIGNS[Math.floor(rng() * SIGNS.length)];
    const element = SIGN_ELEMENT[sign];
    const modality = SIGN_MODALITY[sign];
    const base = PLANET_BASE_STATS[planet];
    const buffs = addStats(ELEMENT_BUFFS[element], MODALITY_BUFFS[modality]);
    const dignity = getDignity(planet, sign);

    planets[planet] = {
      planet,
      sign,
      element,
      modality,
      base,
      buffs,
      dignity,
    };
  });

  const isDiurnal = rng() > 0.5;

  return {
    id: `chart_${seed}`,
    name,
    isDiurnal,
    planets,
  };
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
  const opponentPlanet = encounter.sequence[encounter.turnIndex];
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

  const playerState = playerStateMap[playerPlanet];
  const opponentState = opponentStateMap[opponentPlanet];

  const polarity = getPolarity(playerPlacement.element, opponentPlacement.element);

  const playerEffective = playerState.combusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStats(playerPlacement, playerState.affliction);
  const opponentEffective = opponentState.combusted
    ? { damage: 0, healing: 0, durability: 0, luck: 0 }
    : getEffectiveStats(opponentPlacement, opponentState.affliction);

  const playerCrit = rollCrit(playerEffective.luck, rng);
  const opponentCrit = rollCrit(opponentEffective.luck, rng);

  const playerOutgoing = OUTGOING_MULTIPLIER[playerPlacement.modality];
  const playerIncoming = INCOMING_MULTIPLIER[playerPlacement.modality];
  const opponentOutgoing = OUTGOING_MULTIPLIER[opponentPlacement.modality];
  const opponentIncoming = INCOMING_MULTIPLIER[opponentPlacement.modality];

  const playerToOpponent = computeEffectAmount(
    polarity,
    playerEffective,
    playerOutgoing,
    opponentIncoming,
    playerCrit
  );
  const opponentToPlayer = computeEffectAmount(
    polarity,
    opponentEffective,
    opponentOutgoing,
    playerIncoming,
    opponentCrit
  );

  const playerDelta = applyEffect(playerState, polarity, opponentToPlayer);
  const opponentDelta = applyEffect(opponentState, polarity, playerToOpponent);

  const playerCombust =
    polarity !== "Testimony" && opponentToPlayer > 0
      ? maybeCombust(playerPlacement, playerState, rng)
      : false;
  const opponentCombust =
    polarity !== "Testimony" && playerToOpponent > 0
      ? maybeCombust(opponentPlacement, opponentState, rng)
      : false;

  const propagation = propagateEffects(
    playerStateMap,
    playerChart,
    playerPlanet,
    polarity,
    opponentToPlayer,
    rng
  );

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
  };

  const updatedRun = {
    ...run,
    log: [logEntry, ...run.log].slice(0, 12),
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

export function getAspects(chart: Chart): AspectConnection[] {
  const connections: AspectConnection[] = [];
  const planets = PLANETS;

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const a = planets[i];
      const b = planets[j];
      const aspect = getAspectType(chart.planets[a].sign, chart.planets[b].sign);
      if (aspect === "None") continue;
      const sameSect = isSameSect(chart, a, b);
      const multiplier = ASPECT_BASE[aspect] * (sameSect ? SAME_SECT_MULTIPLIER : 1);
      connections.push({ from: a, to: b, aspect, multiplier, sameSect });
      connections.push({ from: b, to: a, aspect, multiplier, sameSect });
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

function isSameSect(chart: Chart, a: PlanetName, b: PlanetName): boolean {
  const sectA = resolveSect(chart, a);
  const sectB = resolveSect(chart, b);
  return sectA === sectB;
}

function resolveSect(chart: Chart, planet: PlanetName): "Day" | "Night" {
  const base = PLANET_SECT[planet];
  if (base === "Flexible") return chart.isDiurnal ? "Day" : "Night";
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

function getEffectiveStats(placement: PlanetPlacement, affliction: number) {
  const base = addStats(placement.base, placement.buffs);
  const scale = Math.max(0, 1 - affliction / 10);
  return {
    damage: Math.max(0, base.damage * scale),
    healing: Math.max(0, base.healing * scale),
    durability: Math.max(0, base.durability * scale),
    luck: Math.max(0, base.luck * scale),
  };
}

function rollCrit(luck: number, rng: () => number) {
  const chance = Math.min(0.4, luck * 0.08);
  return rng() < chance;
}

function computeEffectAmount(
  polarity: Polarity,
  stats: { damage: number; healing: number },
  outgoing: number,
  incoming: number,
  crit: boolean
) {
  const critMultiplier = crit ? 2 : 1;
  const base = polarity === "Testimony" ? stats.healing : stats.damage;
  const friction = polarity === "Friction" ? 0.5 : 1;
  const amount = base * outgoing * incoming * critMultiplier * friction;
  return Math.max(0, Math.round(amount));
}

function applyEffect(state: PlanetState, polarity: Polarity, amount: number): number {
  if (amount === 0) return 0;
  if (polarity === "Testimony") {
    const before = state.affliction;
    state.affliction = Math.max(0, state.affliction - amount);
    return before - state.affliction;
  }
  state.affliction += amount;
  return amount;
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
  let probability = ratio;

  switch (placement.dignity) {
    case "Domicile":
      probability = ratio ** 2;
      break;
    case "Exaltation":
      probability = ratio;
      break;
    case "Neutral":
      probability = ratio;
      break;
    case "Detriment":
      probability = Math.min(0.5, ratio);
      break;
    case "Fall":
      probability = Math.sqrt(ratio);
      break;
  }

  const roll = rng();
  if (roll < probability) {
    if (placement.dignity === "Exaltation" && !state.exaltationSaveUsed) {
      state.exaltationSaveUsed = true;
      return false;
    }
    state.combusted = true;
    return true;
  }
  return false;
}

function propagateEffects(
  playerStateMap: Record<PlanetName, PlanetState>,
  chart: Chart,
  activePlanet: PlanetName,
  polarity: Polarity,
  amountReceived: number,
  rng: () => number
): TurnLogEntry["propagation"] {
  if (amountReceived <= 0) return [];
  const aspects = getAspects(chart).filter((a) => a.from === activePlanet);
  if (aspects.length === 0) return [];

  const propagation: TurnLogEntry["propagation"] = [];

  aspects.forEach((aspect) => {
    const magnitude = Math.max(0, Math.round(Math.abs(amountReceived * aspect.multiplier)));
    if (magnitude === 0) return;

    const targetState = playerStateMap[aspect.to];
    const targetPlacement = chart.planets[aspect.to];

    const inverted = aspect.multiplier < 0;
    const effectPolarity = inverted
      ? polarity === "Testimony"
        ? "Affliction"
        : "Testimony"
      : polarity;

    const delta = applyEffect(targetState, effectPolarity, magnitude);
    const combust = effectPolarity !== "Testimony" ? maybeCombust(targetPlacement, targetState, rng) : false;

    propagation.push({
      target: aspect.to,
      delta: effectPolarity === "Testimony" ? -delta : delta,
      note: `${aspect.aspect}${aspect.sameSect ? " (sect)" : ""} ${inverted ? "inverts" : "flows"}`,
    });

    if (combust) {
      propagation.push({
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
  const combusted = Object.values(run.playerState).filter((p) => p.combusted).length;
  const updated = { ...run } as RunState;

  if (combusted >= COMBUST_LIMIT) {
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
