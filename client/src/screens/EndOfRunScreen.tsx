import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { MapDiagram } from "@/components/MapDiagram";
import { StarField } from "@/components/StarField";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useStartRun } from "@/state/store-actions";
import { playStar } from "@/audio/engine";
import { earnedBits } from "@/game/achievements";
import { finishedRuns, MAPS_PER_RUN } from "@/game/run";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { RULERSHIP } from "@/game/data";
import { HOUSES } from "@/data/houses";
import { seededChart } from "@/game/chart";
import { TERMINAL_NODE_ID } from "@/game/map-gen";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import type { MapState, PlanetName } from "@/game/types";

export function EndOfRunScreen() {
  const prince = usePrince();
  const run = useActiveRun();
  const startRun = useStartRun();
  const dispatch = usePrinceDispatch();
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();

  const isSample = !!prince?.sample;

  // Achievements accrue at run end (idempotent OR — a reload re-derives the
  // same bits). Quiet marks; Chart Study is where they're read. A sample
  // keeps nothing.
  useEffect(() => {
    if (!run || isSample) return;
    const bits = earnedBits(run);
    if (bits) dispatch({ kind: "earnAchievements", bits });
  }, [run, isSample, dispatch]);

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  // The inscription (SCREENS §6.1): the finished run's star takes its place in
  // the field. The bell sounds as the bloom peaks (~55% of the 1800ms motion).
  useEffect(() => {
    const t = window.setTimeout(() => playStar(), 990);
    return () => window.clearTimeout(t);
  }, []);

  // The finished run keeps only its current map; prior maps live in the
  // event log (STATE.md), persisted for the tail run so the rainbow survives
  // reload. Onchain, a real client would read these from chain events.
  const allMaps: MapState[] = useMemo(() => {
    if (!run) return [];
    return [...run.events.map((e) => e.map), run.map];
  }, [run]);

  // Encounters resolved this run = one NodeOutcome recorded per resolved node.
  const totalEncounters = useMemo(
    () => allMaps.reduce((n, m) => n + Object.keys(m.outcomes).length, 0),
    [allMaps],
  );

  if (!prince || !run) return null;

  // Begin new run: a fresh run on the same Prince (SCREENS §6.3). Afflictions
  // and combusts reset; numEncounters, unlocks, and the run record persist —
  // that's the lifetime layer.
  const beginNew = () => startRun();
  const returnToTitle = () => navigate(ROUTES.title);
  // The sample's conversion beat (FREE.md): the end of the free map lands as
  // loss, and the way forward is casting a chart of one's own.
  const castOwn = () => dispatch({ kind: "clear" });

  // Completion and combustion land on the same surface with different weight
  // (SCREENS §3.8): a combust-out arrives through a slower fade — the
  // acknowledgment register, not a punishment screen.
  const completed = run.mapsCompleted >= MAPS_PER_RUN;

  const starRuns = finishedRuns(prince.runs, prince.numEncounters);

  if (isSample) {
    // Nothing kept: no star, no journal — the record was never theirs.
    return (
      <EndOfRunView
        runDistance={run.distance}
        numMaps={allMaps.length}
        totalEncounters={totalEncounters}
        allMaps={allMaps}
        entryClass="anim-surface-in"
        conversionLine="This Prince vanishes when you leave. Cast your own to keep it — and everything after."
        onBegin={castOwn}
        beginLabel="Cast Your Chart"
        onReturn={returnToTitle}
      />
    );
  }

  return (
    <EndOfRunView
      runDistance={run.distance}
      numMaps={allMaps.length}
      totalEncounters={totalEncounters}
      allMaps={allMaps}
      starRuns={starRuns}
      inscribingRunId={run.id}
      entryClass={completed ? "anim-surface-in" : "anim-eor-combust-in"}
      journal={starRuns.map((r) => ({
        id: r.id,
        distance: r.distance,
        mapsCompleted: r.mapsCompleted,
      }))}
      onBegin={beginNew}
      beginLabel="New Run"
      onReturn={returnToTitle}
    />
  );
}

interface EndOfRunViewProps {
  runDistance: number;
  numMaps: number;
  totalEncounters: number;
  allMaps: MapState[];
  /** All finished runs, the just-ended one included — the whole sky. */
  starRuns?: ReadonlyArray<{ id: string; seed: number; distance: number }>;
  /** The just-ended run: its star blooms into place on arrival. */
  inscribingRunId?: string | null;
  /** Entry motion — completion fades in normally; a combust-out arrives slower. */
  entryClass?: string;
  /** The run journal (SCREENS §6.4): one quiet line per finished run,
   *  newest last — reads as the lifetime unrolling. */
  journal?: Array<{ id: string; distance: number; mapsCompleted: number }>;
  /** Free-tier conversion beat (FREE.md): the loss line above the actions. */
  conversionLine?: string;
  onBegin: () => void;
  beginLabel: string;
  onReturn?: () => void;
}

// Crossfade timing. The rainbow dims to ~0 over CROSSFADE_MS, layout snaps
// while invisible, then fades back over the same duration. Total ~2x.
const CROSSFADE_MS = 200;

function EndOfRunView({
  runDistance,
  numMaps,
  totalEncounters,
  allMaps,
  starRuns,
  inscribingRunId,
  entryClass,
  journal,
  conversionLine,
  onBegin,
  beginLabel,
  onReturn,
}: EndOfRunViewProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [fadingIdxs, setFadingIdxs] = useState<Set<number>>(new Set());
  const timeoutRef = useRef<number | null>(null);
  const currentCardIdx =
    selectedIdx !== null ? Math.min(selectedIdx, allMaps.length - 1) : null;

  // Cancel any pending transition timer on unmount so we don't setState
  // after the component is gone.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const selectCard = (i: number) => {
    if (transitioning) return;
    // Clicking the currently-selected card deselects it (returns to
    // uniform small layout); clicking any other card selects it.
    const next = i === currentCardIdx ? null : i;
    // Only the outgoing + incoming cards crossfade; neighbors stay put.
    const fading = new Set<number>();
    if (currentCardIdx !== null) fading.add(currentCardIdx);
    if (next !== null) fading.add(next);

    setTransitioning(true);
    setFadingIdxs(fading);
    timeoutRef.current = window.setTimeout(() => {
      setSelectedIdx(next);
      // Two rAFs: let React commit the new layout, then trigger fade-back.
      // Without this the browser may batch the size-class swap and the
      // opacity-back into one frame, which un-hides the layout snap.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setFadingIdxs(new Set());
          setTransitioning(false);
        });
      });
    }, CROSSFADE_MS);
  };

  return (
    <div className={["eor", entryClass ?? ""].filter(Boolean).join(" ")}>
      {starRuns && <StarField runs={starRuns} inscribingRunId={inscribingRunId} />}
      <div className="eor-counts">
        <div>
          <span className="eor-big">{Math.round(runDistance).toLocaleString()}</span>
          <span className="eyebrow">DISTANCE</span>
        </div>
        <div>
          <span className="eor-big">{numMaps}</span>
          <span className="eyebrow">MAPS</span>
        </div>
        <div>
          <span className="eor-big">{totalEncounters}</span>
          <span className="eyebrow">ENCOUNTERS</span>
        </div>
      </div>

      <div className="eor-rainbow">
        {allMaps.map((m, i) => {
          // Tint = the terminal node's ruler color, so the card glow extends
          // the same color as the highlighted "you ended here" halo inside.
          const tintPlanet = terminalRuler(m);
          const tintColor = tintPlanet ? PLANET_PRIMARY[tintPlanet] : NEUTRAL.bone;
          const isCurrent = i === currentCardIdx;
          const isFading = fadingIdxs.has(i);
          return (
            <button
              key={m.id}
              className={`eor-card ${isCurrent ? "is-current" : ""} ${isFading ? "is-fading" : ""}`}
              onClick={() => selectCard(i)}
              type="button"
            >
              <div
                className="eor-card-tint"
                style={{
                  background: `radial-gradient(50% 50% at 50% 50%, ${tintColor}26, transparent 70%)`,
                }}
              />
              <div className={`eor-card-map ${isCurrent ? "is-current" : ""}`}>
                <MapDiagram map={m} />
              </div>
              <div className="eor-card-label eyebrow">
                MAP {romanNumeral(i + 1)}
              </div>
            </button>
          );
        })}
      </div>

      {conversionLine && (
        <div className="eor-conversion anim-fragment-in">{conversionLine}</div>
      )}

      {journal && journal.length > 1 && (
        <div className="eor-journal">
          <span className="eyebrow">RUNS</span>
          {journal.map((r, i) => (
            <div
              key={r.id}
              className={`eor-journal-row ${r.id === inscribingRunId ? "is-current" : ""}`}
            >
              <span className="eor-journal-n">{romanNumeral(i + 1)}</span>
              <span>{Math.round(r.distance).toLocaleString()} distance</span>
              <span>
                {r.mapsCompleted} {r.mapsCompleted === 1 ? "map" : "maps"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="eor-actions">
        <button className="begin-btn" onClick={onBegin}>{beginLabel}</button>
        {onReturn && (
          <button className="begin-btn begin-btn-ghost" onClick={onReturn} type="button">
            Return to Title
          </button>
        )}
      </div>
    </div>
  );
}

/** Mirror of MapDiagram's `ruler` helper for the terminal node. Combat nodes
 *  derive from the opponent's chart-ruler; narrative nodes from the house ruler. */
function terminalRuler(map: MapState): PlanetName | null {
  const content = map.rolledNodes[TERMINAL_NODE_ID];
  if (!content) return null;
  if (content.kind === "narrative") return HOUSES[content.house - 1]!.ruler;
  const chart = seededChart(content.opponentSeed, "");
  return RULERSHIP[chart.ascendantSign];
}

function romanNumeral(n: number): string {
  if (n <= 0) return "I";
  const numerals: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let v = n;
  let out = "";
  for (const [k, s] of numerals) {
    while (v >= k) { out += s; v -= k; }
  }
  return out;
}
