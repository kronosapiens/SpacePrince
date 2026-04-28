import { PLANETS } from "./data";
import { getEffectiveStatsFromPlacement, getPolarity } from "./combat";
import { getAspects } from "./aspects";
import { maybeCombust } from "./combust";
import { cloneSideState } from "./chart";
import { turnScore } from "./score";
import { pickWeighted } from "./rng";
import type {
  Chart,
  CombatEncounter,
  PlanetName,
  PlanetPlacement,
  PlanetState,
  Polarity,
  PropagationEntry,
  RunState,
  SideState,
  TurnLogEntry,
} from "./types";

const ZERO = { damage: 0, healing: 0, durability: 0, luck: 0 };

interface TurnResult {
  run: RunState;
  encounter: CombatEncounter;
  log: TurnLogEntry;
  encounterEnded: boolean;
  runEnded: boolean;
}

/**
 * Resolves a single combat turn. Operates on RUN-LEVEL player state — affliction
 * and combustion persist across encounters and maps within a run.
 */
export function resolveTurn(
  run: RunState,
  playerChart: Chart,
  playerPlanet: PlanetName,
  rng: () => number,
): TurnResult | null {
  const enc = run.currentEncounter;
  if (!enc || enc.kind !== "combat" || enc.resolved) return null;
  const opponentPlanet = enc.sequence[enc.turnIndex];
  if (!opponentPlanet) return null;

  const playerStateMap = cloneSideState(run.perPlanetState);
  const opponentStateMap = cloneSideState(enc.opponentState);
  const playerPlacement = playerChart.planets[playerPlanet];
  const opponentPlacement = enc.opponentChart.planets[opponentPlanet];

  const direct = computeDirectPhase(
    playerPlacement,
    opponentPlacement,
    playerStateMap[playerPlanet],
    opponentStateMap[opponentPlanet],
    rng,
  );
  const playerDelta = applyEffect(
    playerStateMap[playerPlanet],
    direct.polarity,
    direct.opponentToPlayer,
  );
  const opponentDelta = applyEffect(
    opponentStateMap[opponentPlanet],
    direct.polarity,
    direct.playerToOpponent,
  );

  const propagation = [
    ...propagate(playerStateMap, playerChart, playerPlanet, direct.polarity, direct.opponentToPlayer, rng, "self"),
    ...propagate(opponentStateMap, enc.opponentChart, opponentPlanet, direct.polarity, direct.playerToOpponent, rng, "other"),
  ];

  const playerCombust =
    direct.polarity !== "Testimony" && playerDelta > 0
      ? maybeCombust(playerPlacement, playerStateMap[playerPlanet], rng)
      : false;
  const opponentCombust =
    direct.polarity !== "Testimony" && opponentDelta > 0
      ? maybeCombust(opponentPlacement, opponentStateMap[opponentPlanet], rng)
      : false;

  const score = turnScore(playerDelta, opponentDelta, propagation);

  const log: TurnLogEntry = {
    id: `turn_${enc.id}_${enc.turnIndex}_${Date.now()}`,
    turnIndex: enc.turnIndex,
    playerPlanet,
    opponentPlanet,
    polarity: direct.polarity,
    playerDelta,
    opponentDelta,
    playerCrit: direct.playerCrit,
    opponentCrit: direct.opponentCrit,
    playerCombust,
    opponentCombust,
    propagation,
    turnScore: score,
    directBreakdown: {
      playerBase: direct.playerBase,
      friction: direct.friction,
      playerCritMultiplier: direct.playerCrit ? 2 : 1,
      playerResult: direct.playerToOpponent,
      opponentBase: direct.opponentBase,
      opponentCritMultiplier: direct.opponentCrit ? 2 : 1,
      opponentResult: direct.opponentToPlayer,
    },
  };

  // Pick next opponent planet from non-combusted ones; advance turnIndex.
  const nextTurnIndex = enc.turnIndex + 1;
  const allOppCombusted = PLANETS.every((p) => opponentStateMap[p].combusted);
  const newSequence = [...enc.sequence];
  if (nextTurnIndex < newSequence.length && !allOppCombusted) {
    const selectable = PLANETS.filter((p) => !opponentStateMap[p].combusted);
    if (selectable.length > 0) newSequence[nextTurnIndex] = pickWeighted(selectable, rng);
  }

  const encounterEnded = nextTurnIndex >= enc.sequence.length || allOppCombusted;
  const runEnded = PLANETS.every((p) => playerStateMap[p].combusted);

  const updatedEnc: CombatEncounter = {
    ...enc,
    opponentState: opponentStateMap,
    sequence: newSequence,
    turnIndex: nextTurnIndex,
    log: [log, ...enc.log].slice(0, 24),
    resolved: encounterEnded,
  };

  const updatedRun: RunState = {
    ...run,
    perPlanetState: playerStateMap,
    runDistance: run.runDistance + score,
    currentEncounter: updatedEnc,
    over: runEnded,
  };

  return { run: updatedRun, encounter: updatedEnc, log, encounterEnded, runEnded };
}

function rollCrit(luck: number, rng: () => number): boolean {
  const chance = Math.max(0, luck * 0.1);
  return rng() < chance;
}

function effectAmount(polarity: Polarity, stats: { damage: number; healing: number }, crit: boolean) {
  const critMul = crit ? 2 : 1;
  const base = polarity === "Testimony" ? stats.healing : stats.damage;
  const polarityMul = polarity === "Affliction" ? 2 : 1;
  return Math.max(0, base * critMul * polarityMul);
}

function computeDirectPhase(
  playerPlacement: PlanetPlacement,
  opponentPlacement: PlanetPlacement,
  playerState: PlanetState,
  opponentState: PlanetState,
  rng: () => number,
) {
  const polarity = getPolarity(playerPlacement.element, opponentPlacement.element);
  const playerEff = playerState.combusted ? ZERO : getEffectiveStatsFromPlacement(playerPlacement);
  const opponentEff = opponentState.combusted ? ZERO : getEffectiveStatsFromPlacement(opponentPlacement);
  const playerCrit = rollCrit(playerEff.luck, rng);
  const opponentCrit = rollCrit(opponentEff.luck, rng);
  return {
    polarity,
    playerCrit,
    opponentCrit,
    playerToOpponent: effectAmount(polarity, playerEff, playerCrit),
    opponentToPlayer: effectAmount(polarity, opponentEff, opponentCrit),
    friction: polarity === "Affliction" ? 2 : 1,
    playerBase: polarity === "Testimony" ? playerEff.healing : playerEff.damage,
    opponentBase: polarity === "Testimony" ? opponentEff.healing : opponentEff.damage,
  };
}

function applyEffect(state: PlanetState, polarity: Polarity, raw: number): number {
  if (raw <= 0 || state.combusted) return 0;
  if (polarity === "Testimony") {
    const before = state.affliction;
    state.affliction = Math.max(0, state.affliction - raw);
    return before - state.affliction;
  }
  state.affliction += raw;
  return raw;
}

function propagate(
  side: SideState,
  chart: Chart,
  active: PlanetName,
  polarity: Polarity,
  amount: number,
  rng: () => number,
  sideTag: "self" | "other",
): PropagationEntry[] {
  if (amount <= 0) return [];
  if (side[active].combusted) return [];
  const aspects = getAspects(chart).filter((a) => a.from === active);
  if (aspects.length === 0) return [];
  const out: PropagationEntry[] = [];
  for (const a of aspects) {
    const target = side[a.to];
    if (target.combusted) continue;
    const magnitude = Math.max(0, Math.abs(amount * a.multiplier));
    if (magnitude <= 0) continue;
    const inverted = a.multiplier < 0;
    const effPolarity: Polarity = inverted
      ? polarity === "Testimony" ? "Affliction" : "Testimony"
      : polarity;
    const delta = applyEffect(target, effPolarity, magnitude);
    const targetPlacement = chart.planets[a.to];
    const combust = effPolarity !== "Testimony" && delta > 0
      ? maybeCombust(targetPlacement, target, rng)
      : false;
    out.push({
      side: sideTag,
      source: active,
      target: a.to,
      delta: effPolarity === "Testimony" ? -delta : delta,
      note: `${a.aspect} ${inverted ? "inverts" : "flows"}${delta === 0 ? " (no effect)" : ""}`,
    });
    if (combust) {
      out.push({
        side: sideTag,
        source: active,
        target: a.to,
        delta: 0,
        note: "Combusts",
      });
    }
  }
  return out;
}
