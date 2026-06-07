import { PLANETS } from "./data";
import {
  computeDirectExchange,
  drawValence,
  getEffectiveStatsFromPlacement,
} from "./combat";
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

const ZERO_STATS = { damage: 0, healing: 0, durability: 0, luck: 0 };

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
  playerValence: Polarity,
  rng: () => number,
): TurnResult | null {
  const enc = run.currentEncounter;
  if (!enc || enc.kind !== "combat" || enc.resolved) return null;
  const opponentPlanet = enc.sequence[enc.turnIndex];
  if (!opponentPlanet) return null;
  const opponentValence = enc.opponentActions[enc.turnIndex] ?? "Affliction";

  const playerStateMap = cloneSideState(run.perPlanetState);
  const opponentStateMap = cloneSideState(enc.opponentState);
  const playerPlacement = playerChart.planets[playerPlanet];
  const opponentPlacement = enc.opponentChart.planets[opponentPlanet];

  const direct = computeDirectPhase(
    playerPlacement,
    opponentPlacement,
    playerStateMap[playerPlanet],
    opponentStateMap[opponentPlanet],
    playerValence,
    opponentValence,
    rng,
  );
  // Each planet receives the *other* side's action: the player's planet takes
  // the opponent's precommitted valence, the opponent's planet takes the
  // player's chosen valence.
  const playerDelta = applyEffect(
    playerStateMap[playerPlanet],
    opponentValence,
    direct.opponentToPlayer,
  );
  const opponentDelta = applyEffect(
    opponentStateMap[opponentPlanet],
    playerValence,
    direct.playerToOpponent,
  );

  const propagation = [
    ...propagate(playerStateMap, playerChart, playerPlanet, opponentValence, direct.opponentToPlayer, rng, "self"),
    ...propagate(opponentStateMap, enc.opponentChart, opponentPlanet, playerValence, direct.playerToOpponent, rng, "other"),
  ];

  const playerCombust =
    opponentValence !== "Testimony" && playerDelta > 0
      ? maybeCombust(playerPlacement, playerStateMap[playerPlanet], rng)
      : false;
  const opponentCombust =
    playerValence !== "Testimony" && opponentDelta > 0
      ? maybeCombust(opponentPlacement, opponentStateMap[opponentPlanet], rng)
      : false;

  const score = turnScore(playerDelta, opponentDelta, playerValence, opponentValence, propagation);

  const log: TurnLogEntry = {
    id: `turn_${enc.id}_${enc.turnIndex}_${Date.now()}`,
    turnIndex: enc.turnIndex,
    playerPlanet,
    opponentPlanet,
    playerValence,
    opponentValence,
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
      playerCritMultiplier: direct.playerCrit ? 2 : 1,
      playerResult: direct.playerToOpponent,
      opponentBase: direct.opponentBase,
      opponentCritMultiplier: direct.opponentCrit ? 2 : 1,
      opponentResult: direct.opponentToPlayer,
    },
  };

  // Pick next opponent planet from non-combusted ones and precommit its verb;
  // advance turnIndex.
  const nextTurnIndex = enc.turnIndex + 1;
  const allOppCombusted = PLANETS.every((p) => opponentStateMap[p].combusted);
  const newSequence = [...enc.sequence];
  const newOpponentActions = [...enc.opponentActions];
  if (nextTurnIndex < newSequence.length && !allOppCombusted) {
    const selectable = PLANETS.filter((p) => !opponentStateMap[p].combusted);
    if (selectable.length > 0) {
      const nextOpponent = pickWeighted(selectable, rng);
      newSequence[nextTurnIndex] = nextOpponent;
      newOpponentActions[nextTurnIndex] = drawValence(
        getEffectiveStatsFromPlacement(enc.opponentChart.planets[nextOpponent]),
        rng,
      );
    }
  }

  const encounterEnded = nextTurnIndex >= enc.sequence.length || allOppCombusted;
  const runEnded = PLANETS.every((p) => playerStateMap[p].combusted);

  const updatedEnc: CombatEncounter = {
    ...enc,
    opponentState: opponentStateMap,
    sequence: newSequence,
    opponentActions: newOpponentActions,
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
  // critChance = effectiveLuck × 0.025 (MECHANICS.md §7). Effective luck runs
  // ~4–20, so ~10–50%. Crit doubles the outgoing effect (applied by the caller).
  const chance = Math.max(0, luck * 0.025);
  return rng() < chance;
}

function computeDirectPhase(
  playerPlacement: PlanetPlacement,
  opponentPlacement: PlanetPlacement,
  playerState: PlanetState,
  opponentState: PlanetState,
  playerValence: Polarity,
  opponentValence: Polarity,
  rng: () => number,
) {
  const playerEff = playerState.combusted ? ZERO_STATS : getEffectiveStatsFromPlacement(playerPlacement);
  const opponentEff = opponentState.combusted ? ZERO_STATS : getEffectiveStatsFromPlacement(opponentPlacement);
  const playerCrit = rollCrit(playerEff.luck, rng);
  const opponentCrit = rollCrit(opponentEff.luck, rng);
  // Reuse the exchange formula from combat.ts; multiply by crit factor here.
  // Projection (computeProjectedEffects) uses the same function without crit,
  // so projection and resolution can never drift.
  const exchange = computeDirectExchange(playerValence, opponentValence, playerEff, opponentEff);
  return {
    playerCrit,
    opponentCrit,
    playerToOpponent: exchange.playerToOpponent * (playerCrit ? 2 : 1),
    opponentToPlayer: exchange.opponentToPlayer * (opponentCrit ? 2 : 1),
    playerBase: playerValence === "Testimony" ? playerEff.healing : playerEff.damage,
    opponentBase: opponentValence === "Testimony" ? opponentEff.healing : opponentEff.damage,
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
      polarity: effPolarity,
      note: `${a.aspect} ${inverted ? "inverts" : "flows"}${delta === 0 ? " (no effect)" : ""}`,
    });
    if (combust) {
      out.push({
        side: sideTag,
        source: active,
        target: a.to,
        delta: 0,
        polarity: "Affliction",
        note: "Combusts",
      });
    }
  }
  return out;
}
