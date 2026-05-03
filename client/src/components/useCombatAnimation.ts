import { useCallback, useEffect, useRef, useState } from "react";
import { aspectKey } from "@/components/Chart";
import type { ProjectedEffect } from "@/game/projections";
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
  /** Pause between the player's resolution phase and the opponent's, so the
   *  two charts read sequentially rather than simultaneously. */
  interPhasePause: 240,
} as const;

// ── Types ───────────────────────────────────────────────────────────────

interface FlagPair<T> {
  self: ReadonlySet<T>;
  other: ReadonlySet<T>;
}

export type ProjectionDeltas = Partial<Record<PlanetName, ProjectedEffect>>;

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

  const sign = entry.polarity === "Testimony" ? -1 : 1;
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
    actionCombust: boolean;
    steps: typeof propagationSteps;
  }): number => {
    const { base, side, actionPlanet, actionDelta, actionCrit, actionCombust, steps } = args;
    const isSelf = side === "self";

    // Primary direct phase — apply delta, light action-glow, impact, crit.
    schedule(() => {
      updateAnimation((state) => {
        const next = cloneAnimation(state);
        if (isSelf) applyDelta(next.selfState, actionPlanet, actionDelta * sign);
        else applyDelta(next.otherState, actionPlanet, actionDelta * sign);
        next.actionPulse = isSelf
          ? { ...next.actionPulse, player: actionPlanet }
          : { ...next.actionPulse, opponent: actionPlanet };
        next.impactPlanets = {
          ...next.impactPlanets,
          [side]: addToFlag(next.impactPlanets[side], actionPlanet),
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
          [side]: removeFromFlag(state.impactPlanets[side], actionPlanet),
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

      schedule(() => {
        updateAnimation((state) => ({
          ...state,
          activePropagationKeys: {
            ...state.activePropagationKeys,
            [side]: addToFlag(state.activePropagationKeys[side], key),
          },
        }));
      }, delay);

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
          }
          next.impactPlanets = {
            ...next.impactPlanets,
            [side]: addToFlag(next.impactPlanets[side], step.target),
          };
          next.consumedProjections = {
            ...next.consumedProjections,
            [side]: addToFlag(next.consumedProjections[side], step.target),
          };
          return next;
        });
      }, delay + ANIMATION_TIMINGS.propagationApplyOffset);

      schedule(() => {
        updateAnimation((state) => ({
          ...state,
          activePropagationKeys: {
            ...state.activePropagationKeys,
            [side]: removeFromFlag(state.activePropagationKeys[side], key),
          },
          impactPlanets: {
            ...state.impactPlanets,
            [side]: removeFromFlag(state.impactPlanets[side], step.target),
          },
        }));
      }, delay + ANIMATION_TIMINGS.propagationClearOffset);

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

  // Sequential phases: player chart resolves first, then opponent.
  const playerPhaseEnd = schedulePhase({
    base: 0,
    side: "self",
    actionPlanet: entry.playerPlanet,
    actionDelta: entry.playerDelta,
    actionCrit: entry.playerCrit,
    actionCombust: entry.playerCombust ?? false,
    steps: playerSteps,
  });
  const opponentBase = playerPhaseEnd + ANIMATION_TIMINGS.interPhasePause;
  const opponentPhaseEnd = schedulePhase({
    base: opponentBase,
    side: "other",
    actionPlanet: entry.opponentPlanet,
    actionDelta: entry.opponentDelta,
    actionCrit: entry.opponentCrit,
    actionCombust: entry.opponentCombust ?? false,
    steps: opponentSteps,
  });

  schedule(() => setAnimation(null), opponentPhaseEnd + ANIMATION_TIMINGS.endOffset);
}
