import { useCallback, useEffect, useRef, useState } from "react";
import { aspectKey } from "@/components/Chart";
import type { ProjectedEffect } from "@/game/projections";
import type {
  CombatEncounter,
  PlanetName,
  Polarity,
  Run,
  SideState,
  TurnLogEntry,
} from "@/game/types";

// ── Timing constants ────────────────────────────────────────────────────
// JS-side schedule cadence. These are independent of CSS keyframe durations
// except where a beat must outlast its animation: `combustRippleDuration` must
// be ≥ the CSS ripple (currently `combust-ripple 1000ms`), and
// `propagationClearOffset` must be ≥ the CSS travel (`prop-travel 460ms`) so the
// pulse reaches the target before its line is cleared.

export const ANIMATION_TIMINGS = {
  primaryDelay: 200,
  /** Lead before an impact's apply beat to start the projection badge sliding
   *  into the affliction badge, so it lands just as the count ticks. Matches the
   *  `badge-merge` keyframe duration in motion.css. */
  mergeLead: 200,
  primaryImpactClear: 360,
  primaryGlowClear: 600,
  primaryCritClear: 720,
  propagationStart: 800,
  propagationStep: 520,
  propagationApplyOffset: 230,
  propagationClearOffset: 500,
  combustRippleDuration: 1000,
  endOffset: 360,
  /** Pause between the opponent's resolution phase and the player's, so the
   *  two charts read sequentially rather than simultaneously. */
  interPhasePause: 240,
} as const;

// ── Types ───────────────────────────────────────────────────────────────

interface FlagPair<T> {
  self: ReadonlySet<T>;
  other: ReadonlySet<T>;
}

/** Planets that took an effect this beat, mapped to the polarity they
 *  received. Heal (testimony) vs harm (affliction) drive the glyph's
 *  in-place valence bloom; presence alone drives the badge pulse. */
export type ImpactMap = ReadonlyMap<PlanetName, Polarity>;

export type ProjectionDeltas = Partial<Record<PlanetName, ProjectedEffect>>;

export interface CombatAnimationState {
  selfState: SideState;
  otherState: SideState;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  turnIndex: number;
  /** Distance shown right now — starts at the pre-turn total and ticks up as
   *  each planet's affliction resolves, in step with the resolution beats. */
  runningDistance: number;
  /** Bumps once per distance increase; used as a React key so the flash
   *  behind the number re-triggers on every resolution. */
  distanceFlashEpoch: number;
  /** The planet whose affliction resolved on the latest beat — its color tints
   *  that beat's flash, so the number flashes through the wave's planets. */
  distanceFlashPlanet: PlanetName | null;
  activePropagationKeys: FlagPair<string>;
  actionPulse: { player: PlanetName | null; opponent: PlanetName | null };
  impactPlanets: { self: ImpactMap; other: ImpactMap };
  critPlanets: FlagPair<PlanetName>;
  combustingPlanets: FlagPair<PlanetName>;
  /** Snapshot of the per-planet projection deltas captured at commit, so
   *  the projection badges can persist through the animation rather than
   *  vanishing all at once. */
  projectedDeltas: { self: ProjectionDeltas; other: ProjectionDeltas } | null;
  /** Planets whose projection has been "consumed" — once their impact
   *  pulse fires, the projection badge for that planet stops rendering.
   *  Accumulates only; never cleared until the animation ends. */
  consumedProjections: FlagPair<PlanetName>;
  /** Planets whose projection badge is currently sliding into the affliction
   *  badge (set `mergeLead` before the apply, cleared when consumed). Drives the
   *  `badge-merge` animation so the delta visibly merges into the running total. */
  mergingPlanets: FlagPair<PlanetName>;
  /** Per side, whether a crit doubled this phase's outgoing effect — drives the
   *  2× display on that side's projection badges for the rest of the phase. */
  critScale: { self: boolean; other: boolean };
  epoch: number;
}

export const EMPTY_PROPAGATION_KEYS: FlagPair<string> = {
  self: new Set(),
  other: new Set(),
};
export const EMPTY_PLANET_SET: ReadonlySet<PlanetName> = new Set();
export const EMPTY_IMPACT_MAP: ImpactMap = new Map();

// ── Hook ────────────────────────────────────────────────────────────────

export interface CombatAnimationApi {
  /** Snapshot of in-flight animation, or null when idle. */
  animation: CombatAnimationState | null;
  /** Begin choreographing a turn — call after the turn is committed (so
   *  display falls back to the new committed state when animation ends). */
  start(args: {
    entry: TurnLogEntry;
    previousRun: Run;
    previousEncounter: CombatEncounter;
    projectedDeltas?: { self: ProjectionDeltas; other: ProjectionDeltas } | null;
  }): void;
  /** Snap to final state and clear all scheduled timeouts. */
  skip(): void;
}

export function useCombatAnimation(): CombatAnimationApi {
  const [animation, setAnimation] = useState<CombatAnimationState | null>(null);
  const timeoutIds = useRef<number[]>([]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((id) => window.clearTimeout(id));
      timeoutIds.current = [];
    };
  }, []);

  const skip = useCallback(() => {
    timeoutIds.current.forEach((id) => window.clearTimeout(id));
    timeoutIds.current = [];
    setAnimation(null);
  }, []);

  const start = useCallback(
    (args: {
      entry: TurnLogEntry;
      previousRun: Run;
      previousEncounter: CombatEncounter;
      projectedDeltas?: { self: ProjectionDeltas; other: ProjectionDeltas } | null;
    }) => {
      runScheduler({
        entry: args.entry,
        previousRun: args.previousRun,
        previousEncounter: args.previousEncounter,
        projectedDeltas: args.projectedDeltas ?? null,
        setAnimation,
        timeoutIds,
      });
    },
    [],
  );

  return { animation, start, skip };
}

// ── Scheduler ───────────────────────────────────────────────────────────

function addToFlag<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  if (set.has(value)) return set;
  const next = new Set(set);
  next.add(value);
  return next;
}

function removeFromFlag<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  if (!set.has(value)) return set;
  const next = new Set(set);
  next.delete(value);
  return next;
}

function addToImpact(map: ImpactMap, planet: PlanetName, polarity: Polarity): ImpactMap {
  const next = new Map(map);
  next.set(planet, polarity);
  return next;
}

function removeFromImpact(map: ImpactMap, planet: PlanetName): ImpactMap {
  if (!map.has(planet)) return map;
  const next = new Map(map);
  next.delete(planet);
  return next;
}

function cloneSide(state: SideState): SideState {
  const out = {} as SideState;
  for (const [planet, value] of Object.entries(state) as Array<
    [PlanetName, SideState[PlanetName]]
  >) {
    out[planet] = { ...value };
  }
  return out;
}

function cloneAnimation(state: CombatAnimationState): CombatAnimationState {
  return {
    ...state,
    selfState: cloneSide(state.selfState),
    otherState: cloneSide(state.otherState),
  };
}

function applyDelta(state: SideState, planet: PlanetName, delta: number) {
  state[planet].affliction = Math.max(0, state[planet].affliction + delta);
}

function runScheduler(args: {
  entry: TurnLogEntry;
  previousRun: Run;
  previousEncounter: CombatEncounter;
  projectedDeltas: { self: ProjectionDeltas; other: ProjectionDeltas } | null;
  setAnimation: (
    update:
      | CombatAnimationState
      | null
      | ((prev: CombatAnimationState | null) => CombatAnimationState | null),
  ) => void;
  timeoutIds: { current: number[] };
}) {
  const { entry, previousRun, previousEncounter, projectedDeltas, setAnimation, timeoutIds } = args;
  timeoutIds.current.forEach((id) => window.clearTimeout(id));
  timeoutIds.current = [];

  const updateAnimation = (
    fn: (state: CombatAnimationState) => CombatAnimationState,
  ) => {
    setAnimation((prev) => (prev ? fn(prev) : prev));
  };
  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutIds.current.push(id);
  };

  setAnimation({
    selfState: cloneSide(previousRun.state),
    otherState: cloneSide(previousEncounter.opponentState),
    playerPlanet: entry.playerPlanet,
    opponentPlanet: entry.opponentPlanet,
    turnIndex: previousEncounter.turnIndex,
    runningDistance: previousRun.distance,
    distanceFlashEpoch: 0,
    distanceFlashPlanet: null,
    activePropagationKeys: EMPTY_PROPAGATION_KEYS,
    actionPulse: { player: null, opponent: null },
    impactPlanets: { self: EMPTY_IMPACT_MAP, other: EMPTY_IMPACT_MAP },
    critPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    combustingPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    projectedDeltas,
    consumedProjections: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    mergingPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    critScale: { self: false, other: false },
    epoch: previousEncounter.turnIndex,
  });

  // Each planet's direct delta carries the sign of the action it *received*:
  // the player's planet took the opponent's valence, and vice versa.
  const selfSign = entry.opponentValence === "Testimony" ? -1 : 1;
  const otherSign = entry.playerValence === "Testimony" ? -1 : 1;
  const propagationSteps = entry.propagation.filter((p) => p.target);
  const playerSteps = propagationSteps.filter((s) => s.side === "self");
  const opponentSteps = propagationSteps.filter((s) => s.side === "other");

  // Schedule one side's full resolution beat (primary hit + propagation +
  // any action-planet combust ripple) at the given base time. Returns the
  // moment the side's last visual finishes — caller uses that to chain
  // the opponent phase after the player phase.
  const schedulePhase = (args: {
    base: number;
    side: "self" | "other";
    actionPlanet: PlanetName;
    actionDelta: number;
    actionCrit: boolean;
    /** The acting (attacker) planet — on the *other* chart from `side`. Flashed
     *  at phase start when this attack crits. */
    attackerPlanet: PlanetName;
    actionCombust: boolean;
    sign: number;
    /** Distance resolved by this phase's direct hit (only testimony scores).
     *  Added when the primary lands, so the number ticks with the impact. */
    actionScore: number;
    steps: typeof propagationSteps;
  }): number => {
    const { base, side, actionPlanet, actionDelta, actionCrit, attackerPlanet, actionCombust, sign, actionScore, steps } = args;
    const isSelf = side === "self";
    // The action planet receives the opposing valence: sign < 0 means the hit
    // resolved affliction (testimony/heal), sign > 0 means it added (affliction/harm).
    const receivedPolarity: Polarity = sign < 0 ? "Testimony" : "Affliction";

    // Crit announce — at phase start, flash the attacker (the acting planet, on
    // the *other* chart) and double this phase's receiver badges for the rest of
    // the phase. The impact-time crit-burst on the receiver still fires below.
    const attackerSide = isSelf ? "other" : "self";
    if (actionCrit) {
      schedule(() => {
        updateAnimation((state) => ({
          ...state,
          critPlanets: {
            ...state.critPlanets,
            [attackerSide]: addToFlag(state.critPlanets[attackerSide], attackerPlanet),
          },
          critScale: { ...state.critScale, [side]: true },
        }));
      }, base);
      schedule(() => {
        updateAnimation((state) => ({
          ...state,
          critPlanets: {
            ...state.critPlanets,
            [attackerSide]: removeFromFlag(state.critPlanets[attackerSide], attackerPlanet),
          },
        }));
      }, base + ANIMATION_TIMINGS.primaryCritClear);
    }

    // Start the direct target's projection badge sliding into its affliction
    // badge, so it lands as the count ticks (mergeLead before the apply).
    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        mergingPlanets: {
          ...state.mergingPlanets,
          [side]: addToFlag(state.mergingPlanets[side], actionPlanet),
        },
      }));
    }, base + ANIMATION_TIMINGS.primaryDelay - ANIMATION_TIMINGS.mergeLead);

    // Primary direct phase — apply delta, light action-glow, impact, crit.
    schedule(() => {
      updateAnimation((state) => {
        const next = cloneAnimation(state);
        if (isSelf) applyDelta(next.selfState, actionPlanet, actionDelta * sign);
        else applyDelta(next.otherState, actionPlanet, actionDelta * sign);
        if (actionScore > 0) {
          next.runningDistance += actionScore;
          next.distanceFlashEpoch += 1;
          next.distanceFlashPlanet = actionPlanet;
        }
        next.actionPulse = isSelf
          ? { ...next.actionPulse, player: actionPlanet }
          : { ...next.actionPulse, opponent: actionPlanet };
        next.impactPlanets = {
          ...next.impactPlanets,
          [side]: addToImpact(next.impactPlanets[side], actionPlanet, receivedPolarity),
        };
        next.consumedProjections = {
          ...next.consumedProjections,
          [side]: addToFlag(next.consumedProjections[side], actionPlanet),
        };
        if (actionCrit) {
          next.critPlanets = {
            ...next.critPlanets,
            [side]: addToFlag(next.critPlanets[side], actionPlanet),
          };
        }
        return next;
      });
    }, base + ANIMATION_TIMINGS.primaryDelay);

    // Clear primary impact pulse before propagation begins.
    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        impactPlanets: {
          ...state.impactPlanets,
          [side]: removeFromImpact(state.impactPlanets[side], actionPlanet),
        },
      }));
    }, base + ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryImpactClear);

    // Clear action glow.
    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        actionPulse: isSelf
          ? { ...state.actionPulse, player: null }
          : { ...state.actionPulse, opponent: null },
      }));
    }, base + ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryGlowClear);

    // Clear crit burst.
    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        critPlanets: { ...state.critPlanets, [side]: EMPTY_PLANET_SET },
      }));
    }, base + ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryCritClear);

    // Propagation steps for this side.
    let lastCombustClearLocal = 0;
    steps.forEach((step, stepIndex) => {
      const key = aspectKey(step.source, step.target);
      const delay = base + ANIMATION_TIMINGS.propagationStart + stepIndex * ANIMATION_TIMINGS.propagationStep;
      // A "Combusts" marker shares its source→target with the hit step that
      // caused it; the hit already lights the traveling line, so the marker only
      // fires the ripple — otherwise the same aspect pulses twice.
      const lightsLine = step.note !== "Combusts";

      if (lightsLine) {
        schedule(() => {
          updateAnimation((state) => ({
            ...state,
            activePropagationKeys: {
              ...state.activePropagationKeys,
              [side]: addToFlag(state.activePropagationKeys[side], key),
            },
          }));
        }, delay);
      }

      if (step.note !== "Combusts") {
        // Slide this target's projection badge into its affliction badge,
        // arriving as the propagated delta applies.
        schedule(() => {
          updateAnimation((state) => ({
            ...state,
            mergingPlanets: {
              ...state.mergingPlanets,
              [side]: addToFlag(state.mergingPlanets[side], step.target),
            },
          }));
        }, delay + ANIMATION_TIMINGS.propagationApplyOffset - ANIMATION_TIMINGS.mergeLead);
      }

      schedule(() => {
        updateAnimation((state) => {
          const next = cloneAnimation(state);
          const targetState = isSelf ? next.selfState : next.otherState;
          if (step.note === "Combusts") {
            targetState[step.target].combusted = true;
            next.combustingPlanets = {
              ...next.combustingPlanets,
              [side]: addToFlag(next.combustingPlanets[side], step.target),
            };
          } else {
            applyDelta(targetState, step.target, step.delta);
            // Propagated testimony resolves affliction (delta stored negative) —
            // tick the distance with this planet's resolution beat.
            if (step.polarity === "Testimony") {
              next.runningDistance += Math.abs(step.delta);
              next.distanceFlashEpoch += 1;
              next.distanceFlashPlanet = step.target;
            }
            // Bloom only on non-combust hits — a combusting planet gets the
            // ripple instead, not a heal/harm pulse.
            next.impactPlanets = {
              ...next.impactPlanets,
              [side]: addToImpact(next.impactPlanets[side], step.target, step.polarity),
            };
          }
          next.consumedProjections = {
            ...next.consumedProjections,
            [side]: addToFlag(next.consumedProjections[side], step.target),
          };
          return next;
        });
      }, delay + ANIMATION_TIMINGS.propagationApplyOffset);

      if (lightsLine) {
        schedule(() => {
          updateAnimation((state) => ({
            ...state,
            activePropagationKeys: {
              ...state.activePropagationKeys,
              [side]: removeFromFlag(state.activePropagationKeys[side], key),
            },
            impactPlanets: {
              ...state.impactPlanets,
              [side]: removeFromImpact(state.impactPlanets[side], step.target),
            },
          }));
        }, delay + ANIMATION_TIMINGS.propagationClearOffset);
      }

      if (step.note === "Combusts") {
        const rippleClearAt = delay + ANIMATION_TIMINGS.propagationApplyOffset + ANIMATION_TIMINGS.combustRippleDuration;
        lastCombustClearLocal = Math.max(lastCombustClearLocal, rippleClearAt);
        schedule(() => {
          updateAnimation((state) => ({
            ...state,
            combustingPlanets: {
              ...state.combustingPlanets,
              [side]: removeFromFlag(state.combustingPlanets[side], step.target),
            },
          }));
        }, rippleClearAt);
      }
    });

    // Final-phase action-planet combust (if any).
    const finalPropagationDelay = steps.length > 0
      ? base + ANIMATION_TIMINGS.propagationStart + (steps.length - 1) * ANIMATION_TIMINGS.propagationStep + ANIMATION_TIMINGS.propagationApplyOffset
      : base + ANIMATION_TIMINGS.primaryDelay;

    if (actionCombust) {
      schedule(() => {
        updateAnimation((state) => {
          const next = cloneAnimation(state);
          if (isSelf) {
            next.selfState[actionPlanet].combusted = true;
          } else {
            next.otherState[actionPlanet].combusted = true;
          }
          next.combustingPlanets = {
            ...next.combustingPlanets,
            [side]: addToFlag(next.combustingPlanets[side], actionPlanet),
          };
          return next;
        });
      }, finalPropagationDelay);

      const actionRippleClearAt = finalPropagationDelay + ANIMATION_TIMINGS.combustRippleDuration;
      lastCombustClearLocal = Math.max(lastCombustClearLocal, actionRippleClearAt);
      schedule(() => {
        updateAnimation((state) => ({
          ...state,
          combustingPlanets: {
            ...state.combustingPlanets,
            [side]: removeFromFlag(state.combustingPlanets[side], actionPlanet),
          },
        }));
      }, actionRippleClearAt);
    }

    const propagationEnd = steps.length > 0
      ? base + ANIMATION_TIMINGS.propagationStart + (steps.length - 1) * ANIMATION_TIMINGS.propagationStep + ANIMATION_TIMINGS.propagationClearOffset
      : base + ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryCritClear;
    return Math.max(propagationEnd, lastCombustClearLocal);
  };

  // Sequential phases (MECHANICS §6): the opponent's chart resolves first — your
  // action landing on it — then your chart, the opponent's reply. Watching the
  // opponent before yourself keeps the two readable and lets a phase-1 combust
  // visibly preempt the phase-2 response.
  // Direct distance resolved per side: your action landing on the opponent's
  // chart, and theirs on yours — each scores only when its valence is testimony
  // (mirrors `turnScore`'s directResolved so the ticked total lands exactly on
  // the committed run distance).
  const otherActionScore = entry.playerValence === "Testimony" ? entry.opponentDelta : 0;
  const selfActionScore = entry.opponentValence === "Testimony" ? entry.playerDelta : 0;

  // Phase 1: your action lands on the opponent's chart. The crit is the
  // *player's* attack (playerCrit, phase1.crit); the attacker is your planet,
  // which lives on the self chart.
  const opponentPhaseEnd = schedulePhase({
    base: 0,
    side: "other",
    actionPlanet: entry.opponentPlanet,
    actionDelta: entry.opponentDelta,
    actionCrit: entry.playerCrit,
    attackerPlanet: entry.playerPlanet,
    actionCombust: entry.opponentCombust ?? false,
    sign: otherSign,
    actionScore: otherActionScore,
    steps: opponentSteps,
  });
  const selfBase = opponentPhaseEnd + ANIMATION_TIMINGS.interPhasePause;
  // Phase 2: the opponent's reply lands on your chart. The crit is the
  // *opponent's* attack (opponentCrit, phase2.crit); the attacker is the
  // opponent's planet, on the other chart.
  const playerPhaseEnd = schedulePhase({
    base: selfBase,
    side: "self",
    actionPlanet: entry.playerPlanet,
    actionDelta: entry.playerDelta,
    actionCrit: entry.opponentCrit,
    attackerPlanet: entry.opponentPlanet,
    actionCombust: entry.playerCombust ?? false,
    sign: selfSign,
    actionScore: selfActionScore,
    steps: playerSteps,
  });

  schedule(() => setAnimation(null), playerPhaseEnd + ANIMATION_TIMINGS.endOffset);
}
