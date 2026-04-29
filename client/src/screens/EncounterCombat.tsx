import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { aspectKey, Chart } from "@/components/Chart";
import { VesicaSeam } from "@/components/VesicaSeam";
import { ROUTES } from "@/routes";
import { resolveTurn } from "@/game/turn";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { saveRun } from "@/state/run-store";
import { saveProfile } from "@/state/profile";
import { PLANETS } from "@/game/data";
import { computeProjectedEffects } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import type {
  CombatEncounter,
  NodeOutcome,
  PlanetName,
  Profile,
  RunState,
  SideState,
  TurnLogEntry,
} from "@/game/types";

interface CombatScreenProps {
  run: RunState;
  profile: Profile;
  encounter: CombatEncounter;
  setRun: (r: RunState) => void;
  setProfile: (p: Profile) => void;
  devUnlockAll: boolean;
}

export function EncounterCombatScreen(props: CombatScreenProps) {
  const { run, profile, encounter, setRun, setProfile, devUnlockAll } = props;
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();

  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);
  const [animation, setAnimation] = useState<CombatAnimationState | null>(null);
  const timeoutIds = useRef<number[]>([]);

  const opponentTurn = encounter.sequence[encounter.turnIndex] ?? null;
  const displayOpponentTurn = animation?.opponentPlanet ?? opponentTurn;
  const displayTurnIndex = animation?.turnIndex ?? encounter.turnIndex;
  const displayedRunDistance = animation?.distanceBefore ?? run.runDistance;
  const displayPlayerState = animation?.selfState ?? run.perPlanetState;
  const displayOpponentState = animation?.otherState ?? encounter.opponentState;
  const activePropagationKeys = animation?.activePropagationKeys ?? EMPTY_PROPAGATION_KEYS;

  useEffect(() => {
    setActive(displayOpponentTurn);
  }, [displayOpponentTurn, setActive]);

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((id) => window.clearTimeout(id));
      timeoutIds.current = [];
    };
  }, []);

  const playerUnlocked = useMemo(
    () => unlockedPlanets(profile.lifetimeEncounterCount, devUnlockAll),
    [profile.lifetimeEncounterCount, devUnlockAll],
  );

  const projection = useMemo(() => {
    if (animation) return null;
    if (!selected || !opponentTurn) return null;
    if (run.perPlanetState[selected].combusted) return null;
    const playerAspects = getAspects(profile.chart);
    const opponentAspects = getAspects(encounter.opponentChart);
    return computeProjectedEffects({
      playerChart: profile.chart,
      opponentChart: encounter.opponentChart,
      playerPlanet: selected,
      opponentPlanet: opponentTurn,
      playerState: run.perPlanetState,
      opponentState: encounter.opponentState,
      playerAspects,
      opponentAspects,
    });
  }, [animation, selected, opponentTurn, run.perPlanetState, encounter.opponentState, encounter.opponentChart, profile.chart]);

  const handlePlayerClick = useCallback(
    (planet: PlanetName) => {
      if (animation) return;
      if (encounter.resolved) return;
      if (!playerUnlocked.includes(planet)) return;
      if (run.perPlanetState[planet].combusted) return;
      if (selected !== planet) {
        setSelected(planet);
        return;
      }
      const rng = mulberry32((run.seed ^ encounter.turnIndex ^ Date.now()) >>> 0);
      const result = resolveTurn(run, profile.chart, planet, rng);
      if (!result) return;
      const previousRun = run;
      const previousEncounter = encounter;
      let nextRun = result.run;
      if (result.encounterEnded) {
        const nextProfile: Profile = {
          ...profile,
          lifetimeEncounterCount: profile.lifetimeEncounterCount + 1,
        };
        saveProfile(nextProfile);
        setProfile(nextProfile);
        const combusts = PLANETS.filter(
          (p) => nextRun.perPlanetState[p].combusted && !run.perPlanetState[p].combusted,
        );
        const outcome: NodeOutcome = {
          nodeId: nextRun.currentMap.currentNodeId,
          kind: "combat",
          summary: `Combat · ${result.encounter.opponentChart.name}`,
          distanceDelta: nextRun.runDistance - run.runDistance,
          combusts,
        };
        nextRun = {
          ...nextRun,
          currentMap: {
            ...nextRun.currentMap,
            outcomes: { ...nextRun.currentMap.outcomes, [outcome.nodeId]: outcome },
          },
        };
      }
      saveRun(nextRun);
      setRun(nextRun);
      startCombatAnimation({
        entry: result.log,
        previousRun,
        previousEncounter,
        setAnimation,
        timeoutIds,
      });
      setSelected(null);
    },
    [animation, encounter, profile, run, selected, playerUnlocked, setProfile, setRun],
  );

  const handleContinue = () => {
    if (animation) return;
    if (run.over) {
      navigate(ROUTES.end);
      return;
    }
    const cleared: RunState = { ...run, currentEncounter: null };
    saveRun(cleared);
    setRun(cleared);
    navigate(ROUTES.map);
  };

  return (
    <div className="combat">
      <div className="combat-side">
        <Chart
          chart={profile.chart}
          state={displayPlayerState}
          unlockedPlanets={playerUnlocked}
          selectedPlanet={selected}
          hoveredPlanet={hovered}
          inspectPlanet={selected}
          entrance="left"
          side="self"
          onPlanetClick={handlePlayerClick}
          onPlanetHover={setHovered}
          projection={projection ? { deltas: projection.self } : undefined}
          activePlanet={animation?.playerPlanet ?? null}
          activePropagationKeys={activePropagationKeys.self}
          alwaysShowAfflictionBadges
        />
        <div className="combat-side-label">SELF</div>
      </div>

      <div className="combat-seam">
        {(!encounter.resolved || animation) && displayOpponentTurn && (
          <div className="combat-opp-of-turn">
            <span className="eyebrow">ANSWER</span>
            <span
              className="combat-opp-glyph"
              style={{ color: PLANET_PRIMARY[displayOpponentTurn] }}
            >
              {PLANET_GLYPH[displayOpponentTurn]}
            </span>
            <span className="combat-opp-name">{displayOpponentTurn.toUpperCase()}</span>
          </div>
        )}
        {encounter.resolved && !animation && (
          <div className="combat-opp-of-turn is-dim">
            <span className="combat-opp-name">{run.over ? "COMBUST" : "SETTLED"}</span>
          </div>
        )}

        <div className="combat-vesica">
          <VesicaSeam planet={displayOpponentTurn ?? "Mars"} />
        </div>

        <div className="combat-turn-dots">
          {Array.from({ length: encounter.sequence.length }).map((_, i) => {
            const cls = i < displayTurnIndex ? "is-on" :
                        i === displayTurnIndex ? "is-current" : "";
            return <span key={i} className={`combat-dot ${cls}`} />;
          })}
        </div>

        <div className="combat-distance">
          <span className="eyebrow">DISTANCE</span>
          <span className="combat-distance-v">{Math.round(displayedRunDistance)}</span>
        </div>
      </div>

      <div className="combat-side">
        <Chart
          chart={encounter.opponentChart}
          state={displayOpponentState}
          activePlanet={displayOpponentTurn}
          hoveredPlanet={hoveredOpponent}
          entrance="right"
          side="other"
          onPlanetHover={setHoveredOpponent}
          projection={projection ? { deltas: projection.other } : undefined}
          passive
          activePropagationKeys={activePropagationKeys.other}
          alwaysShowAfflictionBadges
        />
        <div className="combat-side-label">OTHER</div>
      </div>

      {encounter.resolved && !animation && (
        <div className="continue-prompt">
          <button className="begin-btn" onClick={handleContinue}>
            {run.over ? "Walk back" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

const EMPTY_PROPAGATION_KEYS: {
  self: ReadonlySet<string>;
  other: ReadonlySet<string>;
} = { self: new Set(), other: new Set() };

const ANIMATION_TIMINGS = {
  primaryDelay: 200,
  propagationStart: 800,
  propagationStep: 520,
  propagationApplyOffset: 160,
  propagationClearOffset: 360,
  endOffset: 360,
} as const;

interface CombatAnimationState {
  selfState: SideState;
  otherState: SideState;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  turnIndex: number;
  distanceBefore: number;
  activePropagationKeys: {
    self: ReadonlySet<string>;
    other: ReadonlySet<string>;
  };
}

function startCombatAnimation(args: {
  entry: TurnLogEntry;
  previousRun: RunState;
  previousEncounter: CombatEncounter;
  setAnimation: Dispatch<SetStateAction<CombatAnimationState | null>>;
  timeoutIds: MutableRefObject<number[]>;
}) {
  const { entry, previousRun, previousEncounter, setAnimation, timeoutIds } = args;
  timeoutIds.current.forEach((id) => window.clearTimeout(id));
  timeoutIds.current = [];

  const updateAnimation = (fn: (state: CombatAnimationState) => CombatAnimationState) => {
    setAnimation((prev) => (prev ? fn(prev) : prev));
  };
  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutIds.current.push(id);
  };

  setAnimation({
    selfState: cloneDisplayState(previousRun.perPlanetState),
    otherState: cloneDisplayState(previousEncounter.opponentState),
    playerPlanet: entry.playerPlanet,
    opponentPlanet: entry.opponentPlanet,
    turnIndex: previousEncounter.turnIndex,
    distanceBefore: previousRun.runDistance,
    activePropagationKeys: EMPTY_PROPAGATION_KEYS,
  });

  schedule(() => {
    updateAnimation((state) => {
      const next = cloneAnimationState(state);
      const sign = entry.polarity === "Testimony" ? -1 : 1;
      applyDisplayDelta(next.selfState, entry.playerPlanet, entry.playerDelta * sign);
      applyDisplayDelta(next.otherState, entry.opponentPlanet, entry.opponentDelta * sign);
      return next;
    });
  }, ANIMATION_TIMINGS.primaryDelay);

  const propagationSteps = entry.propagation.filter((p) => p.target);
  const maxSideSteps = Math.max(
    propagationSteps.filter((p) => p.side === "self").length,
    propagationSteps.filter((p) => p.side === "other").length,
  );
  const sideIndexes = { self: 0, other: 0 };

  for (const step of propagationSteps) {
    const stepIndex = sideIndexes[step.side]++;
    const key = aspectKey(step.source, step.target);
    const delay = ANIMATION_TIMINGS.propagationStart + stepIndex * ANIMATION_TIMINGS.propagationStep;

    schedule(() => {
      updateAnimation((state) => ({
        ...state,
        activePropagationKeys: {
          ...state.activePropagationKeys,
          [step.side]: new Set([...state.activePropagationKeys[step.side], key]),
        },
      }));
    }, delay);

    schedule(() => {
      updateAnimation((state) => {
        const next = cloneAnimationState(state);
        const targetState = step.side === "self" ? next.selfState : next.otherState;
        if (step.note === "Combusts") {
          targetState[step.target].combusted = true;
        } else {
          applyDisplayDelta(targetState, step.target, step.delta);
        }
        return next;
      });
    }, delay + ANIMATION_TIMINGS.propagationApplyOffset);

    schedule(() => {
      updateAnimation((state) => {
        const nextKeys = new Set(state.activePropagationKeys[step.side]);
        nextKeys.delete(key);
        return {
          ...state,
          activePropagationKeys: {
            ...state.activePropagationKeys,
            [step.side]: nextKeys,
          },
        };
      });
    }, delay + ANIMATION_TIMINGS.propagationClearOffset);
  }

  const finalPropagationDelay =
    maxSideSteps > 0
      ? ANIMATION_TIMINGS.propagationStart +
        Math.max(0, maxSideSteps - 1) * ANIMATION_TIMINGS.propagationStep +
        ANIMATION_TIMINGS.propagationApplyOffset
      : ANIMATION_TIMINGS.primaryDelay;

  schedule(() => {
    updateAnimation((state) => {
      const next = cloneAnimationState(state);
      if (entry.playerCombust) next.selfState[entry.playerPlanet].combusted = true;
      if (entry.opponentCombust) next.otherState[entry.opponentPlanet].combusted = true;
      return next;
    });
  }, finalPropagationDelay);

  const endDelay =
    ANIMATION_TIMINGS.propagationStart +
    Math.max(0, maxSideSteps - 1) * ANIMATION_TIMINGS.propagationStep +
    ANIMATION_TIMINGS.propagationClearOffset +
    ANIMATION_TIMINGS.endOffset;
  schedule(() => setAnimation(null), endDelay);
}

function cloneDisplayState(state: SideState): SideState {
  const out = {} as SideState;
  for (const [planet, value] of Object.entries(state) as Array<[PlanetName, SideState[PlanetName]]>) {
    out[planet] = { ...value };
  }
  return out;
}

function cloneAnimationState(state: CombatAnimationState): CombatAnimationState {
  return {
    ...state,
    selfState: cloneDisplayState(state.selfState),
    otherState: cloneDisplayState(state.otherState),
  };
}

function applyDisplayDelta(state: SideState, planet: PlanetName, delta: number) {
  state[planet].affliction = Math.max(0, state[planet].affliction + delta);
}
