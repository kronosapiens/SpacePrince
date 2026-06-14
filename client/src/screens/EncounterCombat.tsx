import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { VesicaSeam } from "@/components/VesicaSeam";
import { ROUTES } from "@/routes";
import { hashString, mulberry32 } from "@/game/rng";
import { resolveTurn } from "@/game/turn";
import { PLANETS } from "@/game/data";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { computeProjectedEffects, type ProjectedEffect } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { getEffectiveStats } from "@/game/combat";
import { PLANET_PRIMARY, VALENCE_COLOR } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import type { PlanetStatsActions } from "@/components/PlanetStatsPanel";
import {
  EMPTY_IMPACT_MAP,
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
  onCommitTurn: (planet: PlanetName, valence: Polarity, rng: () => number) => CommitTurnResult | null;
  /** Clear `run.currentEncounter` and return to the map. */
  onClearEncounter: () => void;
  devUnlockAll: boolean;
  /** Dev only: show the animation console — fire any gesture on demand
   *  (planet, valence, forced crit/combust) without playing real turns. */
  devAnimationControls?: boolean;
}

export function EncounterCombatScreen(props: CombatScreenProps) {
  const { run, profile, encounter, onCommitTurn, onClearEncounter, devUnlockAll } = props;
  const devAnimationControls = props.devAnimationControls ?? false;
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();

  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  // Study mode (the inspect "i") — sticky across inspections, so a learner can
  // sweep the chart without re-toggling. Commit-safe: a pure display flag.
  const [study, setStudy] = useState(false);
  // Desktop-only: which action button the pointer is over. Drives the live
  // projection preview. Null on touch (no hover) — both buttons still render
  // lit and the projection falls back to the planet's default verb.
  const [pendingAction, setPendingAction] = useState<Polarity | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);
  const { animation, start: startAnimation, skip: skipAnimation } = useCombatAnimation();

  const opponentTurn = encounter.sequence[encounter.turnIndex] ?? null;
  const displayOpponentTurn = animation?.opponentPlanet ?? opponentTurn;
  const displayTurnIndex = animation?.turnIndex ?? encounter.turnIndex;
  // Opponent's precommitted verb. `opponentAction` is this turn's (feeds the
  // live projection); `displayOpponentAction` follows the animation's turn
  // index — its slot isn't overwritten on advance, so it reads correctly
  // both pre-commit and mid-playback.
  const opponentAction: Polarity = encounter.opponentActions[encounter.turnIndex] ?? "Affliction";
  const displayOpponentAction = encounter.opponentActions[displayTurnIndex] ?? null;
  // Magnitude of the opponent's precommitted verb (its effective damage/healing),
  // shown next to the verb in the seam — e.g. "AFFLICTS 5".
  const displayOpponentAmount =
    displayOpponentTurn && displayOpponentAction
      ? getEffectiveStats(encounter.opponentChart, displayOpponentTurn)[
          displayOpponentAction === "Testimony" ? "healing" : "damage"
        ]
      : null;
  const displayedRunDistance = animation?.runningDistance ?? run.runDistance;
  const distanceFlashEpoch = animation?.distanceFlashEpoch ?? 0;
  // Tint each distance flash with the color of the planet resolving on that
  // beat, so the number flashes through the wave's planets rather than one hue.
  const distanceFlashColor = animation?.distanceFlashPlanet
    ? PLANET_PRIMARY[animation.distanceFlashPlanet]
    : null;
  const displayPlayerState = animation?.selfState ?? run.perPlanetState;
  const displayOpponentState = animation?.otherState ?? encounter.opponentState;
  const activePropagationKeys = animation?.activePropagationKeys ?? EMPTY_PROPAGATION_KEYS;
  const actionPulsePlayer = animation?.actionPulse.player ?? null;
  const actionPulseOpponent = animation?.actionPulse.opponent ?? null;
  const impactPlayer = animation?.impactPlanets.self ?? EMPTY_IMPACT_MAP;
  const impactOpponent = animation?.impactPlanets.other ?? EMPTY_IMPACT_MAP;
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


  // Selection wins over hover — locks the panel to the selected planet so
  // mousing around the chart doesn't blow the read away. The panel (with its
  // action buttons) shows for either.
  const inspected = selected ?? hovered;

  // The valence the live projection reflects: the button being hovered, else
  // the inspected planet's stronger verb (its natural default). The default
  // keeps the projection meaningful on touch, where there's no hover.
  const previewValence: Polarity | null = (() => {
    if (!inspected) return null;
    if (pendingAction) return pendingAction;
    const eff = getEffectiveStats(profile.chart, inspected);
    return eff.damage >= eff.healing ? "Affliction" : "Testimony";
  })();

  const projection = useMemo(() => {
    if (animation) return null;
    if (!inspected || !opponentTurn || !previewValence) return null;
    if (run.perPlanetState[inspected].combusted) return null;
    const playerAspects = getAspects(profile.chart);
    const opponentAspects = getAspects(encounter.opponentChart);
    return computeProjectedEffects({
      playerChart: profile.chart,
      opponentChart: encounter.opponentChart,
      playerPlanet: inspected,
      opponentPlanet: opponentTurn,
      playerValence: previewValence,
      opponentValence: opponentAction,
      playerState: run.perPlanetState,
      opponentState: encounter.opponentState,
      playerAspects,
      opponentAspects,
    });
  }, [animation, inspected, previewValence, opponentTurn, opponentAction, run.perPlanetState, encounter.opponentState, encounter.opponentChart, profile.chart]);

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

  // Click/tap a planet to select it — keeps the panel sticky (the commit path
  // on touch, where there's no hover). Hover shows the same panel transiently.
  const handlePlayerClick = useCallback(
    (planet: PlanetName) => {
      if (animation) {
        skipAnimation();
        setSelected(null);
        setPendingAction(null);
        return;
      }
      if (encounter.resolved) return;
      if (!playerUnlocked.includes(planet)) return;
      if (run.perPlanetState[planet].combusted) return;
      setSelected(planet);
      setPendingAction(null);
    },
    [animation, encounter.resolved, run.perPlanetState, playerUnlocked, skipAnimation],
  );

  // Hover previews a planet; clear the armed action so its projection shows the default verb.
  const handlePlayerHover = useCallback((planet: PlanetName | null) => {
    setHovered(planet);
    setPendingAction(null);
  }, []);

  // Commit the chosen action for a specific planet (the one whose panel is open).
  const handleCommit = useCallback(
    (planet: PlanetName, action: Polarity) => {
      if (animation || encounter.resolved || !opponentTurn) return;
      if (run.perPlanetState[planet].combusted) return;
      // Deterministic per (run, encounter, turn) — same seed produces the
      // same fight every time, which is the point of `/encounter/<seed>`.
      const rng = mulberry32(
        (run.seed ^ encounter.turnIndex ^ hashString(encounter.id)) >>> 0,
      );
      const previousRun = run;
      const previousEncounter = encounter;
      // Snapshot the projection for the *chosen* action so the badges shown
      // during playback match the committed turn (the live projection previews
      // the planet's default verb, which may differ from what was clicked).
      const projectionSnapshot = computeProjectedEffects({
        playerChart: profile.chart,
        opponentChart: encounter.opponentChart,
        playerPlanet: planet,
        opponentPlanet: opponentTurn,
        playerValence: action,
        opponentValence: opponentAction,
        playerState: run.perPlanetState,
        opponentState: encounter.opponentState,
        playerAspects: getAspects(profile.chart),
        opponentAspects: getAspects(encounter.opponentChart),
      });
      const committed = onCommitTurn(planet, action, rng);
      if (!committed) return;
      startAnimation({
        entry: committed.log,
        previousRun,
        previousEncounter,
        projectedDeltas: projectionSnapshot,
      });
      setSelected(null);
      setHovered(null);
      setPendingAction(null);
    },
    [animation, encounter, run, opponentTurn, opponentAction, profile.chart, onCommitTurn, startAnimation],
  );

  // Dev console: fire any gesture on demand. Resolves a real turn (so deltas and
  // propagation match the charts) but as a fresh single-turn snapshot, then
  // overrides the crit/combust flags the scheduler reads — so a combust flare is
  // viewable on turn 0 without grinding affliction. Non-committal: nothing is
  // dispatched, so it replays from the same baseline every time.
  const fireDevAnimation = useCallback(
    (cfg: {
      playerPlanet: PlanetName;
      opponentPlanet: PlanetName;
      valence: Polarity;
      crit: boolean;
      combust: boolean;
    }) => {
      if (animation) skipAnimation();
      const devEncounter: CombatEncounter = {
        ...encounter,
        sequence: [cfg.opponentPlanet],
        opponentActions: [cfg.valence],
        turnIndex: 0,
        resolved: false,
      };
      const devRun: RunState = { ...run, currentEncounter: devEncounter };
      const rng = mulberry32((run.seed ^ hashString(cfg.opponentPlanet)) >>> 0);
      const result = resolveTurn(devRun, profile.chart, cfg.playerPlanet, cfg.valence, rng);
      if (!result) return;
      const entry: TurnLogEntry = { ...result.log };
      // opponentCrit / opponentCombust = the player's action landing on the
      // target planet (phase 1) — that's the gesture you're evaluating.
      if (cfg.crit) entry.opponentCrit = true;
      if (cfg.combust) entry.opponentCombust = true;
      startAnimation({
        entry,
        previousRun: devRun,
        previousEncounter: devEncounter,
        projectedDeltas: null,
      });
    },
    [animation, skipAnimation, encounter, run, profile.chart, startAnimation],
  );

  // The action fan-out rides the bottom of the stats panel — local to the
  // planet. Shown for the inspected planet (hover or select) when committable.
  const playerActions: PlanetStatsActions | undefined =
    inspected && !animation && !encounter.resolved && !run.perPlanetState[inspected].combusted
      ? {
          afflict: getEffectiveStats(profile.chart, inspected).damage,
          testify: getEffectiveStats(profile.chart, inspected).healing,
          pending: pendingAction,
          // First click/tap arms the action (and previews its spread); a second
          // on the same action confirms. Uniform across pointer and touch.
          onChoose: (v) =>
            pendingAction === v ? handleCommit(inspected, v) : setPendingAction(v),
        }
      : undefined;

  // Clicking anywhere outside a planet glyph clears the selection. Planet
  // and continue-button clicks stopPropagation, so they don't reach this
  // handler. Skipped during animation so an in-flight resolution doesn't
  // get its selection state mid-flight.
  const handleClearSelection = useCallback(() => {
    if (animation) return;
    if (selected !== null) {
      setSelected(null);
      setPendingAction(null);
    }
  }, [animation, selected]);

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
    <div className="combat" onClick={handleClearSelection}>
      <div className="combat-side">
        <Chart
          chart={profile.chart}
          state={displayPlayerState}
          unlockedPlanets={playerUnlocked}
          selectedPlanet={selected}
          hoveredPlanet={hovered}
          entrance="left"
          side="self"
          onPlanetClick={handlePlayerClick}
          onPlanetHover={handlePlayerHover}
          projection={displayProjection.self ? { deltas: displayProjection.self } : undefined}
          activePlanet={animation?.playerPlanet ?? null}
          activePropagationKeys={activePropagationKeys.self}
          actionPulsePlanet={actionPulsePlayer}
          impactPlanets={impactPlayer}
          critPlanets={critPlayer}
          combustingPlanets={combustingPlayer}
          animationEpoch={animationEpoch}
          statsPanelPlanet={inspected}
          statsPanelActions={playerActions}
          statsPanelReserveActions
          statsPanelStudy={study}
          onToggleStudy={() => setStudy((s) => !s)}
        />
        <div className="combat-side-label">SELF</div>
      </div>

      <div className="combat-seam">
        {(!encounter.resolved || animation) && displayOpponentTurn && (
          <div className="combat-opp-of-turn">
            <span
              className="combat-opp-glyph"
              style={{ color: PLANET_PRIMARY[displayOpponentTurn] }}
            >
              {PLANET_GLYPH[displayOpponentTurn]}
            </span>
            <SeamName>{displayOpponentTurn.toUpperCase()}</SeamName>
            {displayOpponentAction && (
              <span
                className="combat-opp-action"
                style={{ color: VALENCE_COLOR[displayOpponentAction] }}
              >
                {displayOpponentAction === "Testimony" ? "TESTIFIES" : "AFFLICTS"}
                {displayOpponentAmount != null && (
                  <span className="combat-opp-amount">{displayOpponentAmount}</span>
                )}
              </span>
            )}
          </div>
        )}
        {encounter.resolved && !animation && (
          <div className="combat-opp-of-turn is-dim">
            <SeamName>{run.over ? "COMBUST" : "SETTLED"}</SeamName>
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
          <span
            className="combat-distance-v"
            style={
              distanceFlashColor
                ? ({ "--flash-color": distanceFlashColor } as CSSProperties)
                : undefined
            }
          >
            {distanceFlashEpoch > 0 && (
              <span
                key={distanceFlashEpoch}
                className="combat-distance-flash anim-distance-flash"
                aria-hidden
              />
            )}
            <span
              key={`n-${distanceFlashEpoch}`}
              className={
                distanceFlashEpoch > 0
                  ? "combat-distance-n anim-distance-pop"
                  : "combat-distance-n"
              }
            >
              {Math.round(displayedRunDistance)}
            </span>
          </span>
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

      {devAnimationControls && (
        <DevAnimationPanel
          playerPlanets={playerUnlocked}
          opponentPlanets={PLANETS}
          animating={animation !== null}
          onFire={fireDevAnimation}
          onSkip={skipAnimation}
        />
      )}
    </div>
  );
}

/** Opponent label at constant width. An invisible "MERCURY" sizer reserves the
 *  widest planet name's width so the seam — and thus the two wheels — never
 *  shifts horizontally as the name changes each turn. The visible label centres
 *  over the reserved space. */
function SeamName({ children }: { children: string }) {
  return (
    <span className="combat-opp-name">
      <span className="combat-opp-name-sizer" aria-hidden>
        MERCURY
      </span>
      <span className="combat-opp-name-text">{children}</span>
    </span>
  );
}

// ─── Dev animation console ────────────────────────────────────────────────
// Fires a chosen gesture through the real resolver (see `fireDevAnimation`).
// Styled like the Page picker — `.anim-console-*` classes in layout.css.

function DevAnimationPanel({
  playerPlanets, opponentPlanets, animating, onFire, onSkip,
}: {
  playerPlanets: PlanetName[];
  opponentPlanets: PlanetName[];
  animating: boolean;
  onFire: (cfg: {
    playerPlanet: PlanetName; opponentPlanet: PlanetName;
    valence: Polarity; crit: boolean; combust: boolean;
  }) => void;
  onSkip: () => void;
}) {
  const [playerPlanet, setPlayerPlanet] = useState<PlanetName>(playerPlanets[0] ?? "Sun");
  const [opponentPlanet, setOpponentPlanet] = useState<PlanetName>(opponentPlanets[0] ?? "Sun");
  const [valence, setValence] = useState<Polarity>("Affliction");
  const [crit, setCrit] = useState(false);
  const [combust, setCombust] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="anim-console" onClick={(e) => e.stopPropagation()}>
      <button className="anim-console-header" onClick={() => setCollapsed((c) => !c)}>
        <span className="anim-console-caret" aria-hidden>{collapsed ? "▸" : "▾"}</span>
        <span>Animation Console</span>
      </button>
      {collapsed ? null : (
        <>
          <label className="anim-console-row">
            <span className="anim-console-label">Player</span>
            <select className="anim-console-select" value={playerPlanet} onChange={(e) => setPlayerPlanet(e.target.value as PlanetName)}>
              {playerPlanets.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="anim-console-row">
            <span className="anim-console-label">Target</span>
            <select className="anim-console-select" value={opponentPlanet} onChange={(e) => setOpponentPlanet(e.target.value as PlanetName)}>
              {opponentPlanets.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <div className="anim-console-row">
            <span className="anim-console-label">Verb</span>
            <div className="anim-console-segs">
              <button className={`anim-console-seg${valence === "Affliction" ? " is-on" : ""}`} onClick={() => setValence("Affliction")}>Afflict</button>
              <button className={`anim-console-seg${valence === "Testimony" ? " is-on" : ""}`} onClick={() => setValence("Testimony")}>Testify</button>
            </div>
          </div>
          <div className="anim-console-checks">
            <label className="anim-console-check"><input type="checkbox" checked={crit} onChange={(e) => setCrit(e.target.checked)} />Crit</label>
            <label className="anim-console-check"><input type="checkbox" checked={combust} onChange={(e) => setCombust(e.target.checked)} />Combust</label>
          </div>
          <div className="anim-console-actions">
            <button className="anim-console-btn is-primary" onClick={() => onFire({ playerPlanet, opponentPlanet, valence, crit, combust })}>Fire</button>
            <button className="anim-console-btn" disabled={!animating} onClick={onSkip}>Skip</button>
          </div>
        </>
      )}
    </div>
  );
}
