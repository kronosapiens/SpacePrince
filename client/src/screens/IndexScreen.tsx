import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useResetAll } from "@/state/store-actions";
import { loadDevSettings, saveDevSettings, type DevSettings } from "@/state/settings";
import { unlockedPlanets } from "@/game/unlocks";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Prince } from "@/game/types";

export function IndexScreen() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const resetAll = useResetAll();
  const [settings, setSettings] = useState<DevSettings>(() => loadDevSettings());

  const update = (next: DevSettings) => {
    setSettings(next);
    saveDevSettings(next);
  };

  return (
    <div className="index-screen">
      <h1>Index</h1>
      <p className="muted t-display-italic">Dev navigation + cheats. Hidden in production builds.</p>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Routes</div>
        {(
          [
            ["Title", ROUTES.title],
            ["Start", ROUTES.start],
            ["Map", ROUTES.map],
            ["Encounter (Combat)", ROUTES.encounter],
            ["Narrative", ROUTES.narrative],
            ["End of Run", ROUTES.end],
          ] as Array<[string, string]>
        ).map(([label, to]) => (
          <div key={to} className="index-row">
            <Link className="index-link" to={to}>{label}</Link>
          </div>
        ))}
      </section>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Prince</div>
        {prince ? (
          <>
            <div className="index-row">
              <span>{prince.chart.name}</span>
              <span className="muted">{prince.id}</span>
            </div>
            <div className="index-row">
              Lifetime encounters: {prince.numEncounters}
              <span className="muted">
                ({unlockedPlanets(prince.numEncounters, settings.unlockAll).length} unlocked)
              </span>
            </div>
            <div className="index-row">
              Runs: {prince.runs.length}
            </div>
            <div className="index-row">
              <button
                className="title-second"
                onClick={() => {
                  if (!prince) return;
                  const v = window.prompt("Set numEncounters", String(prince.numEncounters));
                  if (v == null) return;
                  const n = Math.max(0, Math.floor(Number(v)));
                  if (Number.isFinite(n)) {
                    dispatch({ kind: "setEncounters", count: n });
                  }
                }}
              >
                Set encounter count…
              </button>
              <button
                className="title-second"
                onClick={resetAll}
              >
                Reset Prince (all runs)
              </button>
            </div>
          </>
        ) : (
          <div className="index-row muted">No Prince.</div>
        )}
        {!prince && (
          <div className="index-row">
            <button
              className="title-second"
              onClick={() => {
                const seed = randomSeed();
                const chart = seededChart(seed, "Stub Prince");
                const next: Prince = {
                  id: `stub_${seed}`,
                  position: { iso: new Date().toISOString(), lat: 0, lon: 0 },
                  chart,
                  numEncounters: 0,
                  achievements: 0,
                  runs: [],
                };
                dispatch({ kind: "mint", prince: next });
              }}
            >
              Create stub Prince (seeded chart)
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Active run</div>
        {run ? (
          <>
            <div className="index-row">Run id: <span className="muted">{run.id}</span></div>
            <div className="index-row">Distance: {run.distance.toFixed(1)}</div>
            <div className="index-row">Maps completed: {run.mapsCompleted}</div>
          </>
        ) : (
          <div className="index-row muted">No run in progress.</div>
        )}
      </section>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Cheats</div>
        <div className="index-cheat" style={{ borderBottom: "1px solid var(--smoke)", paddingBottom: 12, marginBottom: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={settings.devModeActive}
              onChange={(e) => update({ ...settings, devModeActive: e.target.checked })}
            />
            <strong>Dev mode</strong> — suspend game state; /map, /encounter, /narrative show ephemeral random state
          </label>
        </div>
        <div className="index-cheat">
          <label>
            <input
              type="checkbox"
              checked={settings.unlockAll}
              onChange={(e) => update({ ...settings, unlockAll: e.target.checked })}
            />
            Unlock all planets
          </label>
        </div>
        <div className="index-cheat">
          <label>
            <input
              type="checkbox"
              checked={settings.forceCombat}
              onChange={(e) =>
                update({ ...settings, forceCombat: e.target.checked, forceNarrativeHouse: null })
              }
            />
            Force combat (no narrative)
          </label>
        </div>
        <div className="index-cheat">
          <label>Force narrative house</label>
          <select
            value={settings.forceNarrativeHouse ?? ""}
            onChange={(e) =>
              update({
                ...settings,
                forceNarrativeHouse: e.target.value === "" ? null : Number(e.target.value),
                forceCombat: e.target.value === "" ? settings.forceCombat : false,
              })
            }
          >
            <option value="">(none)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>House {n}</option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
