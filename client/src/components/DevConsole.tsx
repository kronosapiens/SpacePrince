import { useState } from "react";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useResetAll } from "@/state/store-actions";
import { unlockedPlanets } from "@/game/unlocks";
import { isOver, starField } from "@/game/run";
import { loadDevSettings, saveDevSettings } from "@/state/settings";

const UNLOCK_MAX = 36; // Saturn unlocks at 32 (MACROBIAN thresholds); a little headroom.

/**
 * Dev-only console (rendered only under `import.meta.env.DEV`). Lets you drive
 * the *real* continuous game: flip out of the ephemeral preview mode, scrub the
 * Prince's unlock tier live, and reset. State mutations go through the Prince
 * store, so the chart fills in on the anchor as you drag. Not production UI —
 * styled inline.
 */
export function DevConsole() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const resetAll = useResetAll();
  const [collapsed, setCollapsed] = useState(true);
  // Read once on mount; toggling reloads so the screen switch takes effect.
  const [liveGame] = useState(() => !loadDevSettings().devModeActive);

  const toggleLiveGame = () => {
    const s = loadDevSettings();
    saveDevSettings({ ...s, devModeActive: !s.devModeActive });
    window.location.reload();
  };

  const unlocked = prince ? unlockedPlanets(prince.numEncounters) : [];
  const stars = prince ? starField(prince) : [];
  const runOver = prince && run ? isOver(run, prince.numEncounters) : false;

  return (
    <div style={panel}>
      <button style={header} onClick={() => setCollapsed((c) => !c)} type="button">
        <span aria-hidden>{collapsed ? "▸" : "▾"}</span> Dev
      </button>
      {!collapsed && (
        <div style={body}>
          <label style={row}>
            <input type="checkbox" checked={liveGame} onChange={toggleLiveGame} />
            Live game <span style={muted}>(reloads)</span>
          </label>

          {prince ? (
            <>
              <div style={{ ...row, flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                <div>
                  Unlock: <strong>{prince.numEncounters}</strong> enc ·{" "}
                  <strong>{unlocked.length}</strong> planet{unlocked.length === 1 ? "" : "s"}
                </div>
                <input
                  type="range"
                  min={0}
                  max={UNLOCK_MAX}
                  value={Math.min(prince.numEncounters, UNLOCK_MAX)}
                  onChange={(e) =>
                    dispatch({ kind: "setEncounters", count: Number(e.target.value) })
                  }
                />
                <div style={muted}>{unlocked.join(" · ") || "(none)"}</div>
              </div>

              <div style={muted}>
                Stars: {stars.length} · Run #{prince.runs.length}
                {run ? ` · dist ${Math.round(run.distance)} · maps ${run.mapsCompleted}` : " · no run"}
                {runOver ? " · OVER" : ""}
              </div>

              <button style={btn} onClick={resetAll} type="button">
                Reset Prince
              </button>
            </>
          ) : (
            <div style={muted}>No Prince — mint one from the Title.</div>
          )}
        </div>
      )}
    </div>
  );
}

const panel: React.CSSProperties = {
  position: "fixed",
  left: 12,
  bottom: 12,
  zIndex: 9999,
  font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#ddd",
  background: "rgba(20,20,24,0.92)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 6,
  maxWidth: 240,
};
const header: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "6px 10px",
  background: "transparent",
  border: "none",
  color: "#ddd",
  cursor: "pointer",
  font: "inherit",
};
const body: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "4px 10px 10px",
};
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6 };
const muted: React.CSSProperties = { color: "#888", fontSize: 11 };
const btn: React.CSSProperties = {
  padding: "4px 8px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 4,
  color: "#ddd",
  cursor: "pointer",
  font: "inherit",
};
