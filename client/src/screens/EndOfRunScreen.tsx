import { useEffect, useMemo, useRef, useState } from "react";
import { MapDiagram } from "@/components/MapDiagram";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
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
  const dispatch = usePrinceDispatch();
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  // The finished run keeps only its current map; prior maps live in the
  // in-memory event log (STATE.md). Reconstruct the full sequence for the
  // rainbow. (After a reload `events` is empty, so only the last map shows —
  // accepted: a real client would read these from chain events.)
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

  // New Game clears the finished Prince; PlaySurface then opens on mint
  // (a fresh Prince per run, matching the current design).
  const beginNew = () => dispatch({ kind: "clear" });

  return (
    <EndOfRunView
      runDistance={run.distance}
      numMaps={allMaps.length}
      totalEncounters={totalEncounters}
      allMaps={allMaps}
      onBegin={beginNew}
      beginLabel="New Game"
    />
  );
}

interface EndOfRunViewProps {
  runDistance: number;
  numMaps: number;
  totalEncounters: number;
  allMaps: MapState[];
  onBegin: () => void;
  beginLabel: string;
}

// Crossfade timing. The rainbow dims to ~0 over CROSSFADE_MS, layout snaps
// while invisible, then fades back over the same duration. Total ~2x.
const CROSSFADE_MS = 200;

function EndOfRunView({
  runDistance,
  numMaps,
  totalEncounters,
  allMaps,
  onBegin,
  beginLabel,
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
    <div className="eor">
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

      <div className="eor-actions">
        <button className="begin-btn" onClick={onBegin}>{beginLabel}</button>
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
