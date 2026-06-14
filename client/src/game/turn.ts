import { PLANETS } from "./data";
import { drawValence, getEffectiveStatsFromPlacement } from "./combat";
import { getAspects } from "./aspects";
import { applyCombust } from "./combust";
import { cloneSideState } from "./chart";
import { turnScore } from "./score";
import { pickWeighted } from "./rng";
import type {
  Chart,
  CombatEncounter,
  PlanetName,
  PlanetPlacement,
  PlanetStats,
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

  // Sequential resolution (MECHANICS §6): your action lands on the opponent's
  // chart first (phase 1), then the opponent's lands on yours (phase 2). Phase 2
  // reads the post-phase-1 state, so combusting the opponent's acting planet in
  // phase 1 preempts — zeroes — its phase-2 response.
  const playerEff = playerStateMap[playerPlanet].combusted
    ? ZERO_STATS
    : getEffectiveStatsFromPlacement(playerPlacement);
  const phase1 = resolveAction(
    playerEff, playerValence,
    opponentStateMap, enc.opponentChart, opponentPlanet, opponentPlacement, "other", rng,
  );

  const opponentEff = opponentStateMap[opponentPlanet].combusted
    ? ZERO_STATS
    : getEffectiveStatsFromPlacement(opponentPlacement);
  const phase2 = resolveAction(
    opponentEff, opponentValence,
    playerStateMap, playerChart, playerPlanet, playerPlacement, "self", rng,
  );

  const opponentDelta = phase1.delta;
  const playerDelta = phase2.delta;
  const opponentCombust = phase1.combust;
  const playerCombust = phase2.combust;
  // Opponent's chart (phase 1) before yours (phase 2) — the order the UI replays.
  const propagation = [...phase1.propagation, ...phase2.propagation];

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
    playerCrit: phase1.crit,
    opponentCrit: phase2.crit,
    playerCombust,
    opponentCombust,
    propagation,
    turnScore: score,
    directBreakdown: {
      playerBase: phase1.base,
      playerCritMultiplier: phase1.crit ? 2 : 1,
      playerResult: phase1.amount,
      opponentBase: phase2.base,
      opponentCritMultiplier: phase2.crit ? 2 : 1,
      opponentResult: phase2.amount,
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
  // critChance = effectiveLuck × 0.05 (MECHANICS.md §7). Effective luck runs
  // ~2–12, so ~10–60%. Crit doubles the outgoing effect (applied by the caller).
  const chance = Math.max(0, luck * 0.05);
  return rng() < chance;
}

/**
 * Resolves one side's action against the other. The acting planet's stats
 * (`attackerEff`) set the magnitude; the effect lands on `side`'s active planet
 * and propagates through `chart`. The same per-direction base stat the
 * projection preview uses (combat.ts `computeDirectExchange`), so they don't
 * drift. Sequenced by the caller — phase 1 (your action) before phase 2 (theirs).
 */
function resolveAction(
  attackerEff: PlanetStats,
  valence: Polarity,
  side: SideState,
  chart: Chart,
  active: PlanetName,
  placement: PlanetPlacement,
  sideTag: "self" | "other",
  rng: () => number,
) {
  const crit = rollCrit(attackerEff.luck, rng);
  const base = valence === "Testimony" ? attackerEff.healing : attackerEff.damage;
  const amount = Math.max(0, base) * (crit ? 2 : 1);
  const delta = applyEffect(side[active], valence, amount);
  // Combustion is resolved before propagation: a planet destroyed by the blow
  // can't conduct it onward, so `propagate`'s `combusted` guard short-circuits.
  // (Aligns the active planet with the long-standing "combusted planets are
  // skipped by propagation" rule — previously only previously-dead planets.)
  const combust =
    valence !== "Testimony" && delta > 0 ? applyCombust(placement, side[active]) : false;
  const propagation = propagate(side, chart, active, valence, amount, sideTag);
  return { crit, base, amount, delta, combust, propagation };
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
      ? applyCombust(targetPlacement, target)
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
