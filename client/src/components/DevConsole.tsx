import { useState } from "react";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { remirrorCombat } from "@/state/dev-spawn";
import { unlockedPlanets } from "@/game/unlocks";
import { MACROBIAN_THRESHOLDS } from "@/game/data";

/**
 * Dev-only console (rendered only under `import.meta.env.DEV`). Two controls:
 * a 7-stop slider that scrubs the Prince's planet-unlock tier (one stop per
 * planet, snapping to its Macrobian threshold) and a Delete Prince button.
 * Mutations go through the Prince store, so the chart fills in on the anchor as
 * you drag, and a live combat re-mirrors so the opponent re-fields to match.
 * Screen-spawning ("Regenerate") lives in the Page dropdown. Not production UI.
 */
export function DevConsole() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const [collapsed, setCollapsed] = useState(true);

  const unlocked = prince ? unlockedPlanets(prince.numEncounters) : [];

  // Set the unlock tier from a planet count (1–7): jump to that planet's
  // Macrobian threshold. A live combat is re-mirrored so the opponent re-fields
  // to the new tier alongside the player (Moon v Moon, 2v2, …).
  const setPlanets = (n: number) => {
    const count = MACROBIAN_THRESHOLDS[n - 1] ?? 0;
    dispatch({ kind: "setEncounters", count });
    if (run?.encounter?.kind === "combat") {
      dispatch({
        kind: "commitRun",
        run: { ...run, encounter: remirrorCombat(run.encounter, count, run.seed) },
      });
    }
  };

  return (
    <div style={panel}>
      <button style={header} onClick={() => setCollapsed((c) => !c)} type="button">
        <span aria-hidden>{collapsed ? "▸" : "▾"}</span> Dev
      </button>
      {!collapsed && (
        <div style={body}>
          {prince ? (
            <>
              <div style={{ ...row, flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                <div>
                  Planets: <strong>{unlocked.length}</strong> / 7
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={Math.min(Math.max(unlocked.length, 1), 7)}
                  onChange={(e) => setPlanets(Number(e.target.value))}
                />
                <div style={muted}>{unlocked.join(" · ") || "(none)"}</div>
              </div>
              <button
                style={dangerBtn}
                type="button"
                onClick={() => dispatch({ kind: "clear" })}
              >
                Delete Prince
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
  top: 12,
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
const dangerBtn: React.CSSProperties = {
  padding: "5px 8px",
  background: "transparent",
  border: "1px solid rgba(220,90,90,0.5)",
  borderRadius: 4,
  color: "#e88",
  cursor: "pointer",
  font: "inherit",
  textAlign: "center",
};
