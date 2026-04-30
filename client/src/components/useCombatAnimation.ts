import { useCallback, useEffect, useRef, useState } from "react";
import { aspectKey } from "@/components/Chart";
import type {
  CombatEncounter,
  PlanetName,
  RunState,
  SideState,
  TurnLogEntry,
} from "@/game/types";

// ── Timing constants ────────────────────────────────────────────────────
// JS-side schedule cadence. These are independent of CSS keyframe durations
// except for `combustRippleDuration`, which must be ≥ the CSS ripple duration
// (currently `combust-ripple 1000ms` in motion.css) so the schedule waits long
// enough for the ripple to play out.

export const ANIMATION_TIMINGS = {
  primaryDelay: 200,
  primaryImpactClear: 360,
  primaryGlowClear: 600,
  primaryCritClear: 720,
  propagationStart: 800,
  propagationStep: 520,
  propagationApplyOffset: 160,
  propagationClearOffset: 360,
  combustRippleDuration: 1000,
  endOffset: 360,
} as const;

// ── Types ───────────────────────────────────────────────────────────────

interface FlagPair<T> {
  self: ReadonlySet<T>;
  other: ReadonlySet<T>;
}

export type ProjectionDeltas = Partial<Record<PlanetName, number>>;

export interface CombatAnimationState {
  selfState: SideState;
  otherState: SideState;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  turnIndex: number;
  distanceBefore: number;
  activePropagationKeys: FlagPair<string>;
  actionPulse: { player: PlanetName | null; opponent: PlanetName | null };
  impactPlanets: FlagPair<PlanetName>;
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
  epoch: number;
}

export const EMPTY_PROPAGATION_KEYS: FlagPair<string> = {
  self: new Set(),
  other: new Set(),
};
export const EMPTY_PLANET_SET: ReadonlySet<PlanetName> = new Set();

// ── Hook ────────────────────────────────────────────────────────────────

export interface CombatAnimationApi {
  /** Snapshot of in-flight animation, or null when idle. */
  animation: CombatAnimationState | null;
  /** Begin choreographing a turn — call after the turn is committed (so
   *  display falls back to the new committed state when animation ends). */
  start(args: {
    entry: TurnLogEntry;
    previousRun: RunState;
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
      previousRun: RunState;
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
  previousRun: RunState;
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
    selfState: cloneSide(previousRun.perPlanetState),
    otherState: cloneSide(previousEncounter.opponentState),
    playerPlanet: entry.playerPlanet,
    opponentPlanet: entry.opponentPlanet,
    turnIndex: previousEncounter.turnIndex,
    distanceBefore: previousRun.runDistance,
    activePropagationKeys: EMPTY_PROPAGATION_KEYS,
    actionPulse: { player: null, opponent: null },
    impactPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    critPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    combustingPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    projectedDeltas,
    consumedProjections: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    epoch: previousEncounter.turnIndex,
  });

  // Direct phase: apply deltas + light up action-glow, impact pulses, crit bursts.
  schedule(() => {
    updateAnimation((state) => {
      const next = cloneAnimation(state);
      const sign = entry.polarity === "Testimony" ? -1 : 1;
      applyDelta(next.selfState, entry.playerPlanet, entry.playerDelta * sign);
      applyDelta(next.otherState, entry.opponentPlanet, entry.opponentDelta * sign);
      next.actionPulse = {
        player: entry.playerPlanet,
        opponent: entry.opponentPlanet,
      };
      next.impactPlanets = {
        self: addToFlag(next.impactPlanets.self, entry.playerPlanet),
        other: addToFlag(next.impactPlanets.other, entry.opponentPlanet),
      };
      next.consumedProjections = {
        self: addToFlag(next.consumedProjections.self, entry.playerPlanet),
        other: addToFlag(next.consumedProjections.other, entry.opponentPlanet),
      };
      next.critPlanets = {
        self: entry.playerCrit
          ? addToFlag(next.critPlanets.self, entry.playerPlanet)
          : next.critPlanets.self,
        other: entry.opponentCrit
          ? addToFlag(next.critPlanets.other, entry.opponentPlanet)
          : next.critPlanets.other,
      };
      return next;
    });
  }, ANIMATION_TIMINGS.primaryDelay);

  // Clear primary impact pulse before propagation begins so propagation
  // pulses on the same planet replay cleanly.
  schedule(() => {
    updateAnimation((state) => ({
      ...state,
      impactPlanets: {
        self: removeFromFlag(state.impactPlanets.self, entry.playerPlanet),
        other: removeFromFlag(state.impactPlanets.other, entry.opponentPlanet),
      },
    }));
  }, ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryImpactClear);

  // Clear action glow.
  schedule(() => {
    updateAnimation((state) => ({
      ...state,
      actionPulse: { player: null, opponent: null },
    }));
  }, ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryGlowClear);

  // Clear crit burst.
  schedule(() => {
    updateAnimation((state) => ({
      ...state,
      critPlanets: { self: EMPTY_PLANET_SET, other: EMPTY_PLANET_SET },
    }));
  }, ANIMATION_TIMINGS.primaryDelay + ANIMATION_TIMINGS.primaryCritClear);

  const propagationSteps = entry.propagation.filter((p) => p.target);
  const maxSideSteps = Math.max(
    propagationSteps.filter((p) => p.side === "self").length,
    propagationSteps.filter((p) => p.side === "other").length,
  );
  const sideIndexes = { self: 0, other: 0 };
  let lastCombustClear = 0;

  for (const step of propagationSteps) {
    const stepIndex = sideIndexes[step.side]++;
    const key = aspectKey(step.source, step.target);
    const delay =
      ANIMATION_TIMINGS.propagationStart +
      stepIndex * ANIMATION_TIMINGS.propagationStep;

    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        activePropagationKeys: {
          ...state.activePropagationKeys,
          [step.side]: new Set([
            ...state.activePropagationKeys[step.side],
            key,
          ]),
        },
      }));
    }, delay);

    schedule(() => {
      updateAnimation((state) => {
        const next = cloneAnimation(state);
        const targetState =
          step.side === "self" ? next.selfState : next.otherState;
        if (step.note === "Combusts") {
          targetState[step.target].combusted = true;
          next.combustingPlanets = {
            ...next.combustingPlanets,
            [step.side]: addToFlag(
              next.combustingPlanets[step.side],
              step.target,
            ),
          };
        } else {
          applyDelta(targetState, step.target, step.delta);
        }
        next.impactPlanets = {
          ...next.impactPlanets,
          [step.side]: addToFlag(next.impactPlanets[step.side], step.target),
        };
        next.consumedProjections = {
          ...next.consumedProjections,
          [step.side]: addToFlag(next.consumedProjections[step.side], step.target),
        };
        return next;
      });
    }, delay + ANIMATION_TIMINGS.propagationApplyOffset);

    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        activePropagationKeys: {
          ...state.activePropagationKeys,
          [step.side]: removeFromFlag(
            state.activePropagationKeys[step.side],
            key,
          ),
        },
        impactPlanets: {
          ...state.impactPlanets,
          [step.side]: removeFromFlag(
            state.impactPlanets[step.side],
            step.target,
          ),
        },
      }));
    }, delay + ANIMATION_TIMINGS.propagationClearOffset);

    if (step.note === "Combusts") {
      const rippleClearAt =
        delay +
        ANIMATION_TIMINGS.propagationApplyOffset +
        ANIMATION_TIMINGS.combustRippleDuration;
      lastCombustClear = Math.max(lastCombustClear, rippleClearAt);
      schedule(() => {
        updateAnimation((state) => ({
          ...state,
          combustingPlanets: {
            ...state.combustingPlanets,
            [step.side]: removeFromFlag(
              state.combustingPlanets[step.side],
              step.target,
            ),
          },
        }));
      }, rippleClearAt);
    }
  }

  const finalPropagationDelay =
    maxSideSteps > 0
      ? ANIMATION_TIMINGS.propagationStart +
        Math.max(0, maxSideSteps - 1) * ANIMATION_TIMINGS.propagationStep +
        ANIMATION_TIMINGS.propagationApplyOffset
      : ANIMATION_TIMINGS.primaryDelay;

  // Final-phase combust on action planets.
  schedule(() => {
    updateAnimation((state) => {
      const next = cloneAnimation(state);
      if (entry.playerCombust) {
        next.selfState[entry.playerPlanet].combusted = true;
        next.combustingPlanets = {
          ...next.combustingPlanets,
          self: addToFlag(next.combustingPlanets.self, entry.playerPlanet),
        };
      }
      if (entry.opponentCombust) {
        next.otherState[entry.opponentPlanet].combusted = true;
        next.combustingPlanets = {
          ...next.combustingPlanets,
          other: addToFlag(
            next.combustingPlanets.other,
            entry.opponentPlanet,
          ),
        };
      }
      return next;
    });
  }, finalPropagationDelay);

  if (entry.playerCombust || entry.opponentCombust) {
    const finalRippleClearAt =
      finalPropagationDelay + ANIMATION_TIMINGS.combustRippleDuration;
    lastCombustClear = Math.max(lastCombustClear, finalRippleClearAt);
    schedule(() => {
      updateAnimation((state) => {
        const next = cloneAnimation(state);
        if (entry.playerCombust) {
          next.combustingPlanets = {
            ...next.combustingPlanets,
            self: removeFromFlag(
              next.combustingPlanets.self,
              entry.playerPlanet,
            ),
          };
        }
        if (entry.opponentCombust) {
          next.combustingPlanets = {
            ...next.combustingPlanets,
            other: removeFromFlag(
              next.combustingPlanets.other,
              entry.opponentPlanet,
            ),
          };
        }
        return next;
      });
    }, finalRippleClearAt);
  }

  const propagationEnd =
    ANIMATION_TIMINGS.propagationStart +
    Math.max(0, maxSideSteps - 1) * ANIMATION_TIMINGS.propagationStep +
    ANIMATION_TIMINGS.propagationClearOffset +
    ANIMATION_TIMINGS.endOffset;
  const endDelay = Math.max(
    propagationEnd,
    lastCombustClear + ANIMATION_TIMINGS.endOffset,
  );
  schedule(() => setAnimation(null), endDelay);
}
