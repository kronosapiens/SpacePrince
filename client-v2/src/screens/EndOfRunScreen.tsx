import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { MapDiagram } from "@/components/MapDiagram";
import { loadProfile, saveProfile } from "@/state/profile";
import { loadRun, clearRun } from "@/state/run-store";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { MACROBIAN_ORDER, PLANETS } from "@/game/data";
import { PLANET_PRIMARY } from "@/svg/palette";
import type { Profile, RunState, MapState } from "@/game/types";

export function EndOfRunScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [run] = useState<RunState | null>(() => loadRun());
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  useEffect(() => {
    if (!profile || !run) return;
    if (!run.over) return;
    const key = `sp:end_bump:${run.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const next: Profile = { ...profile, scarsLevel: profile.scarsLevel + 1 };
    saveProfile(next);
    setProfile(next);
  }, [profile, run]);

  const allMaps: MapState[] = useMemo(() => {
    if (!run) return [];
    return [...run.mapHistory, run.currentMap];
  }, [run]);

  const totalEncounters = useMemo(() => {
    if (!run || !profile) return 0;
    return profile.lifetimeEncounterCount - run.lifetimeEncounterAtRunStart;
  }, [run, profile]);

  const totalCombust = useMemo(() => {
    if (!run) return 0;
    return PLANETS.filter((p) => run.perPlanetState[p].combusted).length;
  }, [run]);

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  if (!run) return <Navigate to={ROUTES.title} replace />;

  const beginNew = () => {
    clearRun();
    navigate(ROUTES.map);
  };

  // Visible cards: show up to 7 maps (drop oldest if more, current always centered).
  const visibleCount = Math.min(7, allMaps.length);
  const cards = allMaps.slice(-visibleCount);
  const currentCardIdx = Math.min(selectedIdx, cards.length - 1);

  return (
    <div className="eor">
      <div className="eor-top">
        <div className="eor-caption">The world remembers.</div>
        <div className="eor-counts">
          <div>
            <span className="eor-big">{Math.round(run.runDistance).toLocaleString()}</span>
            <span className="eyebrow">DISTANCE</span>
          </div>
          <div>
            <span className="eor-big">{allMaps.length}</span>
            <span className="eyebrow">MAPS</span>
          </div>
          <div>
            <span className="eor-big">{totalEncounters}</span>
            <span className="eyebrow">ENCOUNTERS</span>
          </div>
          <div>
            <span className="eor-big">{totalCombust}</span>
            <span className="eyebrow">COMBUST</span>
          </div>
        </div>
      </div>

      <div className="eor-rainbow">
        {cards.map((m, i) => {
          const tintPlanet = MACROBIAN_ORDER[i % MACROBIAN_ORDER.length]!;
          const isCurrent = i === currentCardIdx;
          return (
            <button
              key={m.id}
              className={`eor-card ${isCurrent ? "is-current" : ""}`}
              onClick={() => setSelectedIdx(i)}
              type="button"
            >
              <div
                className="eor-card-tint"
                style={{
                  background: `radial-gradient(50% 50% at 50% 50%, ${PLANET_PRIMARY[tintPlanet]}26, transparent 70%)`,
                }}
              />
              <div className={`eor-card-map ${isCurrent ? "is-current" : ""}`}>
                <MapDiagram map={m} />
              </div>
              <div
                className="eor-card-label"
                style={{ color: PLANET_PRIMARY[tintPlanet] }}
              >
                MAP {i + 1} · {tintPlanet.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>

      <div className="eor-actions">
        <Link to={ROUTES.title} className="begin-btn begin-btn-ghost">Return to Title</Link>
        <button className="begin-btn" onClick={beginNew}>Begin a New Run</button>
      </div>
    </div>
  );
}
