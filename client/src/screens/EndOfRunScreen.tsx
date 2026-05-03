import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/routes";
import { MapDiagram } from "@/components/MapDiagram";
import { useProfile } from "@/state/ProfileStore";
import { useRun, useRunDispatch } from "@/state/RunStore";
import { useBumpScars } from "@/state/store-actions";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { loadDevSettings } from "@/state/settings";
import {
  generateSeedHash,
  makeDevEndState,
  seedFromHash,
} from "@/state/dev-state";
import { RULERSHIP } from "@/game/data";
import { HOUSES } from "@/data/houses";
import { seededChart } from "@/game/chart";
import { TERMINAL_NODE_ID } from "@/game/map-gen";
import { NEUTRAL, PLANET_PRIMARY } from "@/svg/palette";
import type { MapState, PlanetName } from "@/game/types";

export function EndOfRunScreen() {
  const settings = loadDevSettings();
  if (settings.devModeActive) return <DevEndOfRunScreen />;
  return <NormalEndOfRunScreen />;
}

function NormalEndOfRunScreen() {
  const navigate = useNavigate();
  const profile = useProfile();
  const run = useRun();
  const dispatchRun = useRunDispatch();
  const bumpScars = useBumpScars();
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  useEffect(() => {
    if (!profile || !run) return;
    if (!run.over) return;
    bumpScars(run.id);
  }, [profile, run, bumpScars]);

  const allMaps: MapState[] = useMemo(() => {
    if (!run) return [];
    return [...run.mapHistory, run.currentMap];
  }, [run]);

  const totalEncounters = useMemo(() => {
    if (!run || !profile) return 0;
    return profile.lifetimeEncounterCount - run.lifetimeEncounterAtRunStart;
  }, [run, profile]);

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  if (!run) return <Navigate to={ROUTES.title} replace />;

  const beginNew = () => {
    dispatchRun({ type: "run/clear" });
    navigate(ROUTES.map);
  };

  return (
    <EndOfRunView
      runDistance={run.runDistance}
      numMaps={allMaps.length}
      totalEncounters={totalEncounters}
      allMaps={allMaps}
      onBegin={beginNew}
      beginLabel="New Game"
    />
  );
}

/** Hash-driven End of Run preview. Each URL hash maps to a deterministic
 *  collection of completed maps + aggregate stats so designers can iterate
 *  on the screen at varying fullness. */
function DevEndOfRunScreen() {
  const navigate = useNavigate();
  const { seed: seedHash } = useParams<{ seed?: string }>();
  const { setActive } = useActivePlanet();

  useEffect(() => { setActive(null); }, [setActive]);

  useEffect(() => {
    if (!seedHash) {
      navigate(`${ROUTES.end}/${generateSeedHash()}`, { replace: true });
    }
  }, [seedHash, navigate]);

  const seed = seedHash ? seedFromHash(seedHash) : 0;
  const end = useMemo(() => makeDevEndState(seed), [seed]);

  if (!seedHash) return null;

  return (
    <EndOfRunView
      runDistance={end.runDistance}
      numMaps={end.numMaps}
      totalEncounters={end.totalEncounters}
      allMaps={end.allMaps}
      onBegin={() => navigate(ROUTES.title)}
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
