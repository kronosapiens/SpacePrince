import { drawValence, getEffectiveStatsFromPlacement } from "./combat";
import { getAspects } from "./aspects";
import { applyCombust, combustionCeiling } from "./combust";
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
  Run,
  SideState,
  TurnLogEntry,
} from "./types";

const ZERO_STATS = { damage: 0, healing: 0, durability: 0, luck: 0 };

interface TurnResult {
  run: Run;
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
  run: Run,
  playerChart: Chart,
  playerPlanet: PlanetName,
  playerValence: Polarity,
  rng: () => number,
): TurnResult | null {
  const enc = run.encounter;
  if (!enc || enc.kind !== "combat" || enc.resolved) return null;
  const opponentPlanet = enc.sequence[enc.turnIndex];
  if (!opponentPlanet) return null;
  const opponentValence = enc.opponentActions[enc.turnIndex] ?? "Affliction";

  const playerStateMap = cloneSideState(run.state);
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
    opponentStateMap, enc.opponentChart, opponentPlanet, opponentPlacement, "other",
  );

  const opponentEff = opponentStateMap[opponentPlanet].combusted
    ? ZERO_STATS
    : getEffectiveStatsFromPlacement(opponentPlacement);
  const phase2 = resolveAction(
    opponentEff, opponentValence,
    playerStateMap, playerChart, playerPlanet, playerPlacement, "self",
  );

  const opponentDelta = phase1.delta;
  const playerDelta = phase2.delta;
  const opponentCombust = phase1.combust;
  const playerCombust = phase2.combust;
  // Opponent's chart (phase 1) before yours (phase 2) — the order the UI replays.
  const propagation = [...phase1.propagation, ...phase2.propagation];

  const score = turnScore(opponentDelta, playerValence, propagation);

  const log: TurnLogEntry = {
    id: `turn_${enc.id}_${enc.turnIndex}_${Date.now()}`,
    turnIndex: enc.turnIndex,
    playerPlanet,
    opponentPlanet,
    playerValence,
    opponentValence,
    playerDelta,
    opponentDelta,
    playerCombust,
    opponentCombust,
    propagation,
    turnScore: score,
  };

  // Draw the next turn's precommit — planet + verb. This is combat's only
  // randomness (MECHANICS §7): the resolution above is deterministic, and the
  // roll here decides what is *revealed* next, riding the same resolution.
  const nextTurnIndex = enc.turnIndex + 1;
  // Only the fielded roster matters (mirrored matchup, MECHANICS §11.1): the
  // opponent re-draws from its roster, and the encounter/run end when those
  // planets are spent — never the unfielded ones.
  const allOppCombusted = enc.roster.every((p) => opponentStateMap[p].combusted);
  const newSequence = [...enc.sequence];
  const newOpponentActions = [...enc.opponentActions];
  if (nextTurnIndex < newSequence.length && !allOppCombusted) {
    const selectable = enc.roster.filter((p) => !opponentStateMap[p].combusted);
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
  // The run ends when every planet the player has *fielded* this run is combust;
  // unlocked tier == roster, so locked planets (never sent) don't keep it alive.
  const runEnded = enc.roster.every((p) => playerStateMap[p].combusted);

  const updatedEnc: CombatEncounter = {
    ...enc,
    opponentState: opponentStateMap,
    sequence: newSequence,
    opponentActions: newOpponentActions,
    turnIndex: nextTurnIndex,
    log: [log, ...enc.log].slice(0, 24),
    resolved: encounterEnded,
  };

  // `over` is derived (isOver), never stored: we surface `runEnded` for callers
  // and let the unlock tier decide when the run actually ends.
  const updatedRun: Run = {
    ...run,
    state: playerStateMap,
    distance: run.distance + score,
    encounter: updatedEnc,
  };

  return { run: updatedRun, encounter: updatedEnc, log, encounterEnded, runEnded };
}

/**
 * Resolves one side's action against the other. Fully deterministic — no rolls
 * (MECHANICS §7). The acting planet's stats (`attackerEff`) set the magnitude;
 * the effect lands on `side`'s active planet and propagates through `chart`.
 * The same per-direction base stat the projection preview uses (combat.ts
 * `computeDirectExchange`), so they don't drift. Sequenced by the caller —
 * phase 1 (your action) before phase 2 (theirs).
 */
function resolveAction(
  attackerEff: PlanetStats,
  valence: Polarity,
  side: SideState,
  chart: Chart,
  active: PlanetName,
  placement: PlanetPlacement,
  sideTag: "self" | "other",
) {
  const amount = Math.max(0, valence === "Testimony" ? attackerEff.healing : attackerEff.damage);
  const delta = applyEffect(side[active], valence, amount, combustionCeiling(placement));
  // Combustion is resolved before propagation: a planet destroyed by the blow
  // can't conduct it onward, so `propagate`'s `combusted` guard short-circuits.
  const combust =
    valence !== "Testimony" && delta > 0 ? applyCombust(placement, side[active]) : false;
  const propagation = propagate(side, chart, active, valence, amount, sideTag);
  return { amount, delta, combust, propagation };
}

/** Affliction is bounded on both sides (MECHANICS §8, §10): testimony clamps
 *  at zero, affliction caps at the ceiling. Returns the amount that actually
 *  applied — a finishing blow reports only what it took to reach the line. */
function applyEffect(state: PlanetState, polarity: Polarity, raw: number, ceiling: number): number {
  if (raw <= 0 || state.combusted) return 0;
  if (polarity === "Testimony") {
    const before = state.affliction;
    state.affliction = Math.max(0, state.affliction - raw);
    return before - state.affliction;
  }
  const before = state.affliction;
  state.affliction = Math.min(ceiling, state.affliction + raw);
  return state.affliction - before;
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
    const targetPlacement = chart.planets[a.to];
    const delta = applyEffect(target, effPolarity, magnitude, combustionCeiling(targetPlacement));
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
