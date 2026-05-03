import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { VesicaSeam } from "@/components/VesicaSeam";
import { ROUTES } from "@/routes";
import { hashString, mulberry32 } from "@/game/rng";
import { PLANETS, SIGNS, SIGN_ELEMENT } from "@/game/data";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { computeProjectedEffects, type ProjectedEffect } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { getPolarity } from "@/game/combat";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import {
  EMPTY_PLANET_SET,
  EMPTY_PROPAGATION_KEYS,
  useCombatAnimation,
} from "@/components/useCombatAnimation";
import type {
  CombatEncounter,
  PlanetName,
  Polarity,
  Profile,
  RunState,
  SignName,
  TurnLogEntry,
} from "@/game/types";

/** Outcome of a committed combat turn — feeds the animation playback. */
export interface CommitTurnResult {
  log: TurnLogEntry;
  nextRun: RunState;
  encounter: CombatEncounter;
  encounterEnded: boolean;
  runEnded: boolean;
}

interface CombatScreenProps {
  run: RunState;
  profile: Profile;
  encounter: CombatEncounter;
  /** Resolves a turn; returns null if the click was rejected (e.g. encounter
   *  resolved). Persistence + lifetime-bump + outcome construction happen
   *  inside the implementation (real or dev). */
  onCommitTurn: (planet: PlanetName, rng: () => number) => CommitTurnResult | null;
  /** Clear `run.currentEncounter` and return to the map. */
  onClearEncounter: () => void;
  devUnlockAll: boolean;
}

export function EncounterCombatScreen(props: CombatScreenProps) {
  const { run, profile, encounter, onCommitTurn, onClearEncounter, devUnlockAll } = props;
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();

  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);
  const { animation, start: startAnimation, skip: skipAnimation } = useCombatAnimation();

  const opponentTurn = encounter.sequence[encounter.turnIndex] ?? null;
  const displayOpponentTurn = animation?.opponentPlanet ?? opponentTurn;
  const displayTurnIndex = animation?.turnIndex ?? encounter.turnIndex;
  const displayedRunDistance = animation?.distanceBefore ?? run.runDistance;
  const displayPlayerState = animation?.selfState ?? run.perPlanetState;
  const displayOpponentState = animation?.otherState ?? encounter.opponentState;
  const activePropagationKeys = animation?.activePropagationKeys ?? EMPTY_PROPAGATION_KEYS;
  const actionPulsePlayer = animation?.actionPulse.player ?? null;
  const actionPulseOpponent = animation?.actionPulse.opponent ?? null;
  const impactPlayer = animation?.impactPlanets.self ?? EMPTY_PLANET_SET;
  const impactOpponent = animation?.impactPlanets.other ?? EMPTY_PLANET_SET;
  const critPlayer = animation?.critPlanets.self ?? EMPTY_PLANET_SET;
  const critOpponent = animation?.critPlanets.other ?? EMPTY_PLANET_SET;
  const combustingPlayer = animation?.combustingPlanets.self ?? EMPTY_PLANET_SET;
  const combustingOpponent = animation?.combustingPlanets.other ?? EMPTY_PLANET_SET;
  const animationEpoch = animation?.epoch ?? encounter.turnIndex;

  useEffect(() => {
    setActive(displayOpponentTurn);
  }, [displayOpponentTurn, setActive]);

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

  // Per-sign polarity tints on the player's rim — at a glance, which of my
  // signs would resolve as Testimony / Affliction against the opponent's
  // current turn. The mirror on the opponent chart is the same matchup
  // commuted, so it adds no new info; we don't render it there.
  const selfSignPolarities = useMemo<Partial<Record<SignName, Polarity>>>(() => {
    if (!displayOpponentTurn) return {};
    const oppElement = encounter.opponentChart.planets[displayOpponentTurn].element;
    const out: Partial<Record<SignName, Polarity>> = {};
    for (const sign of SIGNS) out[sign] = getPolarity(SIGN_ELEMENT[sign], oppElement);
    return out;
  }, [displayOpponentTurn, encounter.opponentChart]);

  // Projection-deltas to actually display, per side. Pre-commit: the live
  // projection. Mid-animation: the snapshot captured at commit, with each
  // planet filtered out as its impact pulse fires (see useCombatAnimation).
  const displayProjection = useMemo(() => {
    const filterConsumed = (
      deltas: Partial<Record<PlanetName, ProjectedEffect>>,
      consumed: ReadonlySet<PlanetName>,
    ): Partial<Record<PlanetName, ProjectedEffect>> | undefined => {
      const out: Partial<Record<PlanetName, ProjectedEffect>> = {};
      let any = false;
      for (const planet of PLANETS) {
        const v = deltas[planet];
        if (v === undefined) continue;
        if (consumed.has(planet)) continue;
        out[planet] = v;
        any = true;
      }
      return any ? out : undefined;
    };
    if (animation?.projectedDeltas) {
      return {
        self: filterConsumed(animation.projectedDeltas.self, animation.consumedProjections.self),
        other: filterConsumed(animation.projectedDeltas.other, animation.consumedProjections.other),
      };
    }
    return {
      self: projection?.self,
      other: projection?.other,
    };
  }, [animation, projection]);

  const handlePlayerClick = useCallback(
    (planet: PlanetName) => {
      if (animation) {
        skipAnimation();
        setSelected(null);
        return;
      }
      if (encounter.resolved) return;
      if (!playerUnlocked.includes(planet)) return;
      if (run.perPlanetState[planet].combusted) return;
      if (selected !== planet) {
        setSelected(planet);
        return;
      }
      // Deterministic per (run, encounter, turn) — same seed produces the
      // same fight every time, which is the point of `/encounter/<seed>`.
      const rng = mulberry32(
        (run.seed ^ encounter.turnIndex ^ hashString(encounter.id)) >>> 0,
      );
      const previousRun = run;
      const previousEncounter = encounter;
      // Snapshot the projection so the badges can persist through the
      // animation rather than vanishing all at once. The hook clears each
      // planet's projection as that planet's impact pulse fires.
      const projectionSnapshot = projection
        ? { self: { ...projection.self }, other: { ...projection.other } }
        : null;
      const committed = onCommitTurn(planet, rng);
      if (!committed) return;
      startAnimation({
        entry: committed.log,
        previousRun,
        previousEncounter,
        projectedDeltas: projectionSnapshot,
      });
      setSelected(null);
    },
    [animation, encounter, run, selected, playerUnlocked, onCommitTurn, skipAnimation, startAnimation, projection],
  );

  const handleContinue = useCallback(() => {
    if (animation) return;
    if (run.over) {
      navigate(ROUTES.end);
      return;
    }
    onClearEncounter();
    navigate(ROUTES.map);
  }, [animation, run.over, onClearEncounter, navigate]);

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
          projection={displayProjection.self ? { deltas: displayProjection.self } : undefined}
          activePlanet={animation?.playerPlanet ?? null}
          activePropagationKeys={activePropagationKeys.self}
          actionPulsePlanet={actionPulsePlayer}
          impactPlanets={impactPlayer}
          critPlanets={critPlayer}
          combustingPlanets={combustingPlayer}
          animationEpoch={animationEpoch}
          signPolarities={selfSignPolarities}
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
          projection={displayProjection.other ? { deltas: displayProjection.other } : undefined}
          passive
          activePropagationKeys={activePropagationKeys.other}
          actionPulsePlanet={actionPulseOpponent}
          impactPlanets={impactOpponent}
          critPlanets={critOpponent}
          combustingPlanets={combustingOpponent}
          animationEpoch={animationEpoch}
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
