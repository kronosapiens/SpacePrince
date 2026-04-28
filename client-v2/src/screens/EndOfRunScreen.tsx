import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { MapDiagram } from "@/components/MapDiagram";
import { loadProfile, saveProfile } from "@/state/profile";
import { loadRun, clearRun } from "@/state/run-store";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import type { Profile, RunState, MapState } from "@/game/types";

export function EndOfRunScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [run, setRun] = useState<RunState | null>(() => loadRun());
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { setActive } = useActivePlanet();
  void setRun;

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  // Bump scarsLevel exactly once on entry; also runs after profile loads.
  useEffect(() => {
    if (!profile || !run) return;
    if (!run.over) return;
    // Idempotent: store an "endOfRunBumped" flag in run? For now bump once per render guarded by a sentinel.
    // We use a localStorage key keyed by run id.
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

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  if (!run) return <Navigate to={ROUTES.title} replace />;

  const beginNew = () => {
    clearRun();
    navigate(ROUTES.map);
  };

  const selectedMap = allMaps[Math.min(selectedIdx, allMaps.length - 1)];

  return (
    <div className="eor">
      <div className="eor-line">The walk has ended.</div>
      <div className="eor-distance">Distance · {Math.round(run.runDistance)}</div>
      <div style={{ width: "100%", maxWidth: 720, aspectRatio: "1 / 1.1" }}>
        {selectedMap && <MapDiagram map={selectedMap} />}
      </div>
      <div className="eor-carousel">
        {allMaps.map((m, i) => (
          <button
            key={m.id}
            className={`eor-card ${i === selectedIdx ? "is-selected" : ""}`}
            onClick={() => setSelectedIdx(i)}
            type="button"
          >
            <div className="eor-card-label">Map {i + 1}</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <MapDiagram map={m} />
            </div>
          </button>
        ))}
      </div>
      <div className="eor-actions">
        <button className="eor-action" onClick={beginNew}>Begin new run</button>
        <Link to={ROUTES.title} className="eor-action">Return to title</Link>
      </div>
    </div>
  );
}
