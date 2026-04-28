import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadProfile, saveProfile, clearProfile } from "@/state/profile";
import { loadRun, clearRun } from "@/state/run-store";
import { loadDevSettings, saveDevSettings, type DevSettings } from "@/state/settings";
import { unlockedPlanets } from "@/game/unlocks";
import { seededChart } from "@/game/chart";
import { randomSeed } from "@/game/rng";
import type { Profile, RunState } from "@/game/types";

export function IndexScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [settings, setSettings] = useState<DevSettings>(() => loadDevSettings());

  useEffect(() => {
    setProfile(loadProfile());
    setRun(loadRun());
  }, []);

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
            ["Mint", ROUTES.mint],
            ["Map", ROUTES.map],
            ["Encounter", ROUTES.encounter],
            ["End of Run", ROUTES.end],
            ["Chart Study", ROUTES.study],
          ] as Array<[string, string]>
        ).map(([label, to]) => (
          <div key={to} className="index-row">
            <Link className="index-link" to={to}>{label}</Link>
          </div>
        ))}
      </section>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Profile</div>
        {profile ? (
          <>
            <div className="index-row">
              <span>Name: {profile.name}</span>
              <span className="muted">{profile.id}</span>
            </div>
            <div className="index-row">
              Lifetime encounters: {profile.lifetimeEncounterCount}
              <span className="muted">
                ({unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll).length} unlocked)
              </span>
            </div>
            <div className="index-row">
              <button
                className="title-second"
                onClick={() => {
                  if (!profile) return;
                  const v = window.prompt("Set lifetimeEncounterCount", String(profile.lifetimeEncounterCount));
                  if (v == null) return;
                  const n = Math.max(0, Math.floor(Number(v)));
                  if (Number.isFinite(n)) {
                    const next = { ...profile, lifetimeEncounterCount: n };
                    saveProfile(next);
                    setProfile(next);
                  }
                }}
              >
                Set encounter count…
              </button>
              <button
                className="title-second"
                onClick={() => {
                  clearProfile();
                  clearRun();
                  setProfile(null);
                  setRun(null);
                }}
              >
                Clear profile + run
              </button>
            </div>
          </>
        ) : (
          <div className="index-row muted">No profile.</div>
        )}
        {!profile && (
          <div className="index-row">
            <button
              className="title-second"
              onClick={() => {
                const seed = randomSeed();
                const chart = seededChart(seed, "Stub Prince");
                const next: Profile = {
                  id: `stub_${seed}`,
                  name: "Stub Prince",
                  birthData: { iso: new Date().toISOString(), lat: 0, lon: 0 },
                  chart,
                  lifetimeEncounterCount: 0,
                  scarsLevel: 0,
                  createdAt: Date.now(),
                  schemaVersion: 1,
                };
                saveProfile(next);
                setProfile(next);
              }}
            >
              Create stub profile (seeded chart)
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Run</div>
        {run ? (
          <>
            <div className="index-row">Run id: <span className="muted">{run.id}</span></div>
            <div className="index-row">Distance: {run.runDistance.toFixed(1)}</div>
            <div className="index-row">
              <button
                className="title-second"
                onClick={() => {
                  clearRun();
                  setRun(null);
                }}
              >
                Clear run
              </button>
            </div>
          </>
        ) : (
          <div className="index-row muted">No run in progress.</div>
        )}
      </section>

      <section>
        <div className="t-chrome-em" style={{ marginBottom: 8 }}>Cheats</div>
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
