import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { Chart } from "@/components/Chart";
import { HelpButton } from "@/components/HelpButton";
import { PlanetBands } from "@/components/PlanetBands";
import { hashString, mulberry32 } from "@/game/rng";
import { resolveTurn } from "@/game/turn";
import { isOver } from "@/game/run";
import { PLANETS, RULERSHIP } from "@/game/data";
import { setTheme } from "@/audio/engine";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { computeProjectedEffects, type ProjectedEffect } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { directAmount, getEffectiveStats } from "@/game/combat";
import { isCombusted, wouldCombust } from "@/game/combust";
import { PLANET_PRIMARY, VALENCE_COLOR } from "@/svg/palette";
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
  Prince,
  Run,
  TurnLogEntry,
} from "@/game/types";

/** Outcome of a committed combat turn — feeds the animation playback. */
export interface CommitTurnResult {
  log: TurnLogEntry;
  nextRun: Run;
  encounter: CombatEncounter;
  encounterEnded: boolean;
  runEnded: boolean;
}

interface CombatScreenProps {
  run: Run;
  prince: Prince;
  encounter: CombatEncounter;
  /** Resolves a turn; returns null if the click was rejected (e.g. encounter
   *  resolved). Persistence + lifetime-bump + outcome construction happen
   *  inside the implementation (real or dev). */
  onCommitTurn: (planet: PlanetName, valence: Polarity, rng: () => number) => CommitTurnResult | null;
  /** Clear `run.currentEncounter` and return to the map. */
  onClearEncounter: () => void;
  devUnlockAll: boolean;
  /** Dev only: show the animation console — fire any gesture on demand
   *  (planet, valence, forced combust) without playing real turns. */
  devAnimationControls?: boolean;
}

export function EncounterCombatScreen(props: CombatScreenProps) {
  const { run, prince, encounter, onCommitTurn, onClearEncounter, devUnlockAll } = props;
  const devAnimationControls = props.devAnimationControls ?? false;
  const { setActive } = useActivePlanet();

  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  // Study mode (the inspect "i") — sticky across inspections, so a learner can
  // sweep the chart without re-toggling. Commit-safe: a pure display flag.
  const [study, setStudy] = useState(false);
  // The armed verb — first click on an action button arms it, a second
  // commits. Identical on pointer and touch.
  const [pendingAction, setPendingAction] = useState<Polarity | null>(null);
  // The verb under the pointer in the panel — the free desktop preview while
  // nothing is armed. Once a verb is armed it holds, matching the planet axis:
  // commitment makes hover inert, and only a click switches. Never part of the
  // commit gesture.
  const [hoveredAction, setHoveredAction] = useState<Polarity | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);
  const { animation, start: startAnimation, skip: skipAnimation } = useCombatAnimation();

  // `over` is derived (STATE.md): the run ended once every fielded planet combust.
  const runEnded = isOver(run, prince.chart, prince.numEncounters);

  const opponentTurn = encounter.sequence[encounter.turnIndex] ?? null;
  const displayOpponentTurn = animation?.opponentPlanet ?? opponentTurn;
  const displayTurnIndex = animation?.turnIndex ?? encounter.turnIndex;
  // Opponent's precommitted verb. `opponentAction` is this turn's (feeds the
  // live projection); `displayOpponentAction` follows the animation's turn
  // index — its slot isn't overwritten on advance, so it reads correctly
  // both pre-commit and mid-playback.
  const opponentAction: Polarity = encounter.opponentActions[encounter.turnIndex] ?? "Affliction";
  const displayOpponentAction = encounter.opponentActions[displayTurnIndex] ?? null;
  // Magnitude of the precommitted verb, for the announce line.
  const displayOpponentAmount =
    displayOpponentTurn && displayOpponentAction
      ? directAmount(
          getEffectiveStats(encounter.opponentChart, displayOpponentTurn),
          displayOpponentAction,
        )
      : null;
  const settled = encounter.resolved && !animation;
  const displayedRunDistance = animation?.runningDistance ?? run.distance;
  const distanceFlashEpoch = animation?.distanceFlashEpoch ?? 0;
  // Tint each distance flash with the color of the planet resolving on that
  // beat, so the number flashes through the wave's planets rather than one hue.
  const distanceFlashColor = animation?.distanceFlashPlanet
    ? PLANET_PRIMARY[animation.distanceFlashPlanet]
    : null;
  const displayPlayerState = animation?.selfState ?? run.state;
  const displayOpponentState = animation?.otherState ?? encounter.opponentState;
  const activePropagationKeys = animation?.activePropagationKeys ?? EMPTY_PROPAGATION_KEYS;
  const actionPulsePlayer = animation?.actionPulse.player ?? null;
  const actionPulseOpponent = animation?.actionPulse.opponent ?? null;
  const impactPlayer = animation?.impactPlanets.self ?? EMPTY_IMPACT_MAP;
  const impactOpponent = animation?.impactPlanets.other ?? EMPTY_IMPACT_MAP;
  const combustingPlayer = animation?.combustingPlanets.self ?? EMPTY_PLANET_SET;
  const combustingOpponent = animation?.combustingPlanets.other ?? EMPTY_PLANET_SET;
  const mergingPlayer = animation?.mergingPlanets.self ?? EMPTY_PLANET_SET;
  const mergingOpponent = animation?.mergingPlanets.other ?? EMPTY_PLANET_SET;
  const animationEpoch = animation?.epoch ?? encounter.turnIndex;
  // The edge bands' bright level: every planet taking an effect on this beat,
  // whether it blooms (impact) or combusts (ripple).
  const struckSelf = useMemo(
    () => new Set([...impactPlayer.keys(), ...combustingPlayer]),
    [impactPlayer, combustingPlayer],
  );
  const struckOther = useMemo(
    () => new Set([...impactOpponent.keys(), ...combustingOpponent]),
    [impactOpponent, combustingOpponent],
  );

  useEffect(() => {
    setActive(displayOpponentTurn);
  }, [displayOpponentTurn, setActive]);

  const playerUnlocked = useMemo(
    () => unlockedPlanets(prince.numEncounters, devUnlockAll),
    [prince.numEncounters, devUnlockAll],
  );

  // The score (MUSIC.md): combat plays the opponent's theme at the up mix —
  // the theme follows the encounter's identity (its chart ruler), stable for
  // the whole fight, not the per-turn active planet.
  const opponentRuler = RULERSHIP[encounter.opponentChart.ascendantSign];
  useEffect(() => {
    setTheme(opponentRuler, "combat");
  }, [opponentRuler]);

  // The panel (with its action buttons) is click-only: hovering the chart
  // highlights a planet but never pops the panel, so nothing modal flickers as
  // the mouse moves. Tap a planet to inspect, tap to commit.
  const inspected = selected;

  // The projection badges, though, are hover-free on desktop (SCREENS.md §3.6:
  // hover is the tap-preview's information at no cost). Selection wins, and
  // wholly: while the panel is up, hover is inert on both charts (the
  // `hoveredPlanet` props gate on `selected`) — otherwise a stray hover paints
  // one planet's aspect lines under another planet's projection chips, a false
  // composite. Browsing previews freely; considering holds one candidate's
  // complete truth until a tap switches or clears. Touch, with no hover, keeps
  // the tap-only flow.
  const previewPlanet = selected ?? hovered;

  // One rule governs the preview: verb-dependent information appears only
  // while a verb is indicated — armed in the panel, or hovered while nothing
  // is armed (armed wins, like selection wins on the planet axis). The
  // defensive read is verb-free and appears everywhere. With no verb the
  // valence input is an inert placeholder — only the self side is displayed
  // then, and with modelPreemption off that side doesn't depend on the
  // player's verb: the blow is shown landing.
  const indicatedVerb = pendingAction ?? hoveredAction;
  const projection = useMemo(() => {
    if (animation) return null;
    if (!previewPlanet || !opponentTurn) return null;
    if (isCombusted(prince.chart.planets[previewPlanet], run.state[previewPlanet])) return null;
    const playerAspects = getAspects(prince.chart);
    const opponentAspects = getAspects(encounter.opponentChart);
    return computeProjectedEffects({
      playerChart: prince.chart,
      opponentChart: encounter.opponentChart,
      playerPlanet: previewPlanet,
      opponentPlanet: opponentTurn,
      playerValence: indicatedVerb ?? "Affliction",
      opponentValence: opponentAction,
      playerState: run.state,
      opponentState: encounter.opponentState,
      playerAspects,
      opponentAspects,
      roster: encounter.roster,
      modelPreemption: !!indicatedVerb,
    });
  }, [animation, previewPlanet, indicatedVerb, opponentTurn, opponentAction, run.state, encounter.opponentState, encounter.opponentChart, encounter.roster, prince.chart]);

  // Ambient combust warnings (choice-independent, afflict turns only):
  // self — candidates that combust if they catch the incoming blow;
  // other — the opponent's actor, when some candidate could combust it first.
  // Both render as the amber badge treatment (Chart `warningPlanets`).
  const combustWarnings = useMemo(() => {
    if (animation || encounter.resolved || !opponentTurn) return null;
    if (opponentAction !== "Affliction") return null;
    const incoming = getEffectiveStats(encounter.opponentChart, opponentTurn).impact;
    const candidates = playerUnlocked.filter(
      (p) => !isCombusted(prince.chart.planets[p], run.state[p]),
    );
    const self = new Set(
      candidates.filter((p) => wouldCombust(prince.chart.planets[p], run.state[p], incoming)),
    );
    const maxAnswer = Math.max(
      0,
      ...candidates.map((p) => getEffectiveStats(prince.chart, p).impact),
    );
    const other = wouldCombust(
      encounter.opponentChart.planets[opponentTurn],
      encounter.opponentState[opponentTurn],
      maxAnswer,
    )
      ? new Set([opponentTurn])
      : null;
    return { self: self.size > 0 ? self : null, other };
  }, [animation, encounter, opponentTurn, opponentAction, playerUnlocked, run.state, prince.chart]);

  // The warnings stay conservative under any preview — their meaning is "dies
  // if the blow lands," which holds. An armed afflict that preempts tells its
  // own story through the exact projection: their actor shows the kill and no
  // incoming chips appear.
  const selfWarnings = combustWarnings?.self ?? null;
  const otherWarnings = combustWarnings?.other ?? null;

  // Projection-deltas to actually display, per side. Pre-commit: the live
  // projection, and nothing at all until a planet is under consideration.
  // Mid-animation: the snapshot captured at commit, with each planet filtered
  // out as its impact pulse fires (see useCombatAnimation).
  //
  // Rejected: the precommit drawn on every candidate at rest (SCREENS.md
  // §3.5.1). It is determined information and it made the seven-way comparison
  // parallel, but the resting menu and the focused preview were the same mark
  // answering different questions, so focusing read as six threats vanishing.
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

  // What each chart is about to take, drawn at its own centre (Chart
  // `incoming`). Yours is live from the top of the turn: their precommit is
  // drawn and its magnitude already fixed. Theirs waits for an indicated verb —
  // the same gate the projection above uses, and for the same reason, since
  // until you indicate one your outgoing amount isn't determined and a number
  // would assert a decision you haven't made. Both follow the animation rather
  // than clearing at commit, so the mark rides its own resolution — and that is
  // the phase the number earns its place in, since the panel closed at commit
  // and took the only other statement of your outgoing figure with it.
  const incomingSelf =
    !settled && displayOpponentAction && displayOpponentAmount != null
      ? { verb: displayOpponentAction, amount: displayOpponentAmount }
      : null;
  const outgoingPlanet = animation?.playerPlanet ?? previewPlanet;
  const outgoingVerb = animation?.playerValence ?? indicatedVerb;
  const incomingOther =
    !settled && outgoingPlanet && outgoingVerb
      ? {
          verb: outgoingVerb,
          amount: directAmount(getEffectiveStats(prince.chart, outgoingPlanet), outgoingVerb),
        }
      : null;

  // Click/tap a planet to select it — this is the only way the panel opens, and
  // it stays put (the commit path) until commit or another planet is clicked.
  const handlePlayerClick = useCallback(
    (planet: PlanetName) => {
      if (animation) {
        skipAnimation();
        setSelected(null);
        setPendingAction(null);
        setHoveredAction(null);
        return;
      }
      if (encounter.resolved) return;
      if (!playerUnlocked.includes(planet)) return;
      if (isCombusted(prince.chart.planets[planet], run.state[planet])) return;
      setSelected(planet);
      setPendingAction(null);
      setHoveredAction(null);
    },
    [animation, encounter.resolved, run.state, playerUnlocked, skipAnimation],
  );

  const handlePlayerHover = useCallback((planet: PlanetName | null) => {
    setHovered(planet);
  }, []);

  // Commit the chosen action for a specific planet (the one whose panel is open).
  const handleCommit = useCallback(
    (planet: PlanetName, action: Polarity) => {
      if (animation || encounter.resolved || !opponentTurn) return;
      if (isCombusted(prince.chart.planets[planet], run.state[planet])) return;
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
        playerChart: prince.chart,
        opponentChart: encounter.opponentChart,
        playerPlanet: planet,
        opponentPlanet: opponentTurn,
        playerValence: action,
        opponentValence: opponentAction,
        playerState: run.state,
        opponentState: encounter.opponentState,
        playerAspects: getAspects(prince.chart),
        opponentAspects: getAspects(encounter.opponentChart),
        roster: encounter.roster,
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
      setHoveredAction(null);
    },
    [animation, encounter, run, opponentTurn, opponentAction, prince.chart, onCommitTurn, startAnimation],
  );

  // Dev console: fire any gesture on demand. Resolves a real turn (so deltas and
  // propagation match the charts) but as a fresh single-turn snapshot, then
  // overrides the combust flag the scheduler reads — so a combust flare is
  // viewable on turn 0 without grinding affliction. Non-committal: nothing is
  // dispatched, so it replays from the same baseline every time.
  const fireDevAnimation = useCallback(
    (cfg: {
      playerPlanet: PlanetName;
      opponentPlanet: PlanetName;
      valence: Polarity;
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
      const devRun: Run = { ...run, encounter: devEncounter };
      const rng = mulberry32((run.seed ^ hashString(cfg.opponentPlanet)) >>> 0);
      const result = resolveTurn(devRun, prince.chart, cfg.playerPlanet, cfg.valence, rng);
      if (!result) return;
      const entry: TurnLogEntry = { ...result.log };
      // opponentCombust = the player's action landing on the target planet
      // (phase 1) — that's the gesture you're evaluating.
      if (cfg.combust) entry.opponentCombust = true;
      startAnimation({
        entry,
        previousRun: devRun,
        previousEncounter: devEncounter,
        projectedDeltas: null,
      });
    },
    [animation, skipAnimation, encounter, run, prince.chart, startAnimation],
  );

  // The action fan-out rides the bottom of the stats panel — local to the
  // planet. Shown for the inspected planet (hover or select) when committable.
  const playerActions: PlanetStatsActions | undefined =
    inspected && !animation && !encounter.resolved &&
    !isCombusted(prince.chart.planets[inspected], run.state[inspected])
      ? {
          afflict: getEffectiveStats(prince.chart, inspected).impact,
          testify: getEffectiveStats(prince.chart, inspected).witness,
          pending: pendingAction,
          // First click/tap arms the action (and previews its spread); a second
          // on the same action confirms. Uniform across pointer and touch.
          onChoose: (v) =>
            pendingAction === v ? handleCommit(inspected, v) : setPendingAction(v),
          onClearPending: () => setPendingAction(null),
          onHoverAction: setHoveredAction,
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
      setHoveredAction(null);
    }
  }, [animation, selected]);

  const handleContinue = useCallback(() => {
    if (animation) return;
    // Clear the encounter; PlaySurface then shows End (run over) or Map.
    onClearEncounter();
  }, [animation, onClearEncounter]);

  return (
    <div className="combat" onClick={handleClearSelection}>
      {/* The mint's bands, struck per resolution beat — self down the left edge,
          other down the right, matching the two charts. */}
      <PlanetBands className="combat-bands is-self" on={animation?.consumedProjections.self} current={struckSelf} />
      <PlanetBands className="combat-bands is-other" on={animation?.consumedProjections.other} current={struckOther} />
      <HelpButton screen="combat" />
      {/* Run- and encounter-level state, lifted out of the centre column so the
          two charts can have the room. Nothing here is chart data — Distance is
          the run's score, the pips are where we are in this encounter — so it
          reads as chrome without becoming a HUD sitting over the wheels. */}
      <div className="combat-topbar">
        <div className="combat-readouts">
          {/* Position in the encounter's turn sequence. Unlike Distance this has
              a real denominator — the sequence length — so a fraction states it
              exactly rather than inventing a ceiling. Live, the numerator is the
              turn being answered; settled, it is the turns actually taken, so an
              encounter that ended early (every opposing planet combust before
              the sequence ran out) reads 2 of 3 rather than 3 of 3.
              Rejected: a row of pips, filled per turn spent and ringed on the
              current one. They separated spent / current / remaining, which a
              fraction cannot, but at three turns that distinction bought little
              and cost the strip a second visual language — the pips carried no
              baseline of their own, so they could not sit with the type beside
              them. */}
          <div className="combat-turns">
            <span className="eyebrow">TURNS</span>
            <span className="combat-turns-v">
              {settled
                ? displayTurnIndex
                : Math.min(displayTurnIndex + 1, encounter.sequence.length)}
              <span className="combat-turns-sep">/</span>
              {encounter.sequence.length}
            </span>
          </div>
          {/* The score, plainly. Distance is an unbounded sum, so the numeral is
              the one rendering that invents nothing: no denominator, no ceiling,
              nothing to decode. It reads the same here as on the narrative
              screen and as the star it becomes at end of run.
              Rejected: the doublings track (a tick per doubling banked plus a
              bar for the run at the current one, `game/distance.ts`). It also
              implied no ceiling, but it stated the score in a code that had to
              be learned before it said anything, and the bar read as progress
              toward a maximum regardless — the exact misread it was built to
              avoid. */}
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
              {/* The per-beat gain pulse — the only feedback that Distance moved
                  during resolution, tinted by the planet resolving on it. */}
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
        {/* One slot for what is happening and what is next: the turn's
            precommit while it is being answered, the way out once it is not.
            The sentence is the caption that teaches the marks — the ring's
            colour and the bites on the candidates say the same thing wordlessly,
            and nothing else says which of them is Saturn. */}
        <div className="combat-announce">
          {settled ? (
            <button className="begin-btn" onClick={handleContinue}>
              {runEnded ? "Walk back" : "Continue"}
            </button>
          ) : (
            displayOpponentTurn && displayOpponentAction && (
              <p className="combat-announce-line">
                <span style={{ color: PLANET_PRIMARY[displayOpponentTurn] }}>
                  {displayOpponentTurn}
                </span>{" "}
                <span style={{ color: VALENCE_COLOR[displayOpponentAction] }}>
                  {displayOpponentAction === "Testimony" ? "testifies" : "afflicts"}
                  {displayOpponentAmount != null && ` ${displayOpponentAmount}`}
                </span>
              </p>
            )
          )}
        </div>
      </div>

      <div className="combat-side">
        <Chart
          chart={prince.chart}
          state={displayPlayerState}
          unlockedPlanets={playerUnlocked}
          selectedPlanet={selected}
          hoveredPlanet={selected ? null : hovered}
          entrance="left"
          side="self"
          onPlanetClick={handlePlayerClick}
          onPlanetHover={handlePlayerHover}
          projection={displayProjection.self ? { deltas: displayProjection.self } : undefined}
          activePlanet={animation?.playerPlanet ?? null}
          activePropagationKeys={activePropagationKeys.self}
          actionPulsePlanet={actionPulsePlayer}
          impactPlanets={impactPlayer}
          combustingPlanets={combustingPlayer}
          mergingPlanets={mergingPlayer}
          warningPlanets={selfWarnings ?? undefined}
          incoming={incomingSelf}
          animationEpoch={animationEpoch}
          statsPanelPlanet={inspected}
          statsPanelActions={playerActions}
          statsPanelReserveActions
          statsPanelStudy={study}
          onToggleStudy={() => setStudy((s) => !s)}
          inviteInteraction={!animation && !encounter.resolved && !selected}
          ringVerb={selected ? indicatedVerb : null}
        />
        <div className="combat-side-label">SELF</div>
      </div>

      <div className="combat-side">
        <Chart
          chart={encounter.opponentChart}
          state={displayOpponentState}
          unlockedPlanets={encounter.roster}
          activePlanet={displayOpponentTurn}
          ringVerb={displayOpponentAction}
          hoveredPlanet={selected ? null : hoveredOpponent}
          entrance="right"
          side="other"
          onPlanetHover={setHoveredOpponent}
          // Offense chips need an indicated verb (or committed playback) —
          // selection alone hasn't chosen one, so this side would assert an
          // outcome of a decision not yet made. Until then the preview is the
          // defensive (self) side only.
          projection={
            (indicatedVerb || animation) && displayProjection.other
              ? { deltas: displayProjection.other }
              : undefined
          }
          passive
          activePropagationKeys={activePropagationKeys.other}
          actionPulsePlanet={actionPulseOpponent}
          impactPlanets={impactOpponent}
          combustingPlanets={combustingOpponent}
          mergingPlanets={mergingOpponent}
          warningPlanets={otherWarnings ?? undefined}
          incoming={incomingOther}
          animationEpoch={animationEpoch}
        />
        <div className="combat-side-label">OTHER</div>
      </div>

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
    valence: Polarity; combust: boolean;
  }) => void;
  onSkip: () => void;
}) {
  const [playerPlanet, setPlayerPlanet] = useState<PlanetName>(playerPlanets[0] ?? "Sun");
  const [opponentPlanet, setOpponentPlanet] = useState<PlanetName>(opponentPlanets[0] ?? "Sun");
  const [valence, setValence] = useState<Polarity>("Affliction");
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
              <button className={`anim-console-seg${valence === "Testimony" ? " is-on" : ""}`} onClick={() => setValence("Testimony")}>Testify</button>
              <button className={`anim-console-seg${valence === "Affliction" ? " is-on" : ""}`} onClick={() => setValence("Affliction")}>Afflict</button>
            </div>
          </div>
          <div className="anim-console-checks">
            <label className="anim-console-check"><input type="checkbox" checked={combust} onChange={(e) => setCombust(e.target.checked)} />Combust</label>
          </div>
          <div className="anim-console-actions">
            <button className="anim-console-btn is-primary" onClick={() => onFire({ playerPlanet, opponentPlanet, valence, combust })}>Fire</button>
            <button className="anim-console-btn" disabled={!animating} onClick={onSkip}>Skip</button>
          </div>
        </>
      )}
    </div>
  );
}
