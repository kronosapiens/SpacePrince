import { useState, useSyncExternalStore } from "react";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { useInfoCards } from "@/state/InfoCardContext";
import { remirrorCombat } from "@/state/dev-spawn";
import { unlockedPlanets } from "@/game/unlocks";
import { MACROBIAN_THRESHOLDS } from "@/game/data";
import {
  currentTheme,
  isMusicEnabled,
  isSoundEnabled,
  setMusicEnabled,
  setSoundEnabled,
  shuffleTheme,
  subscribeTheme,
} from "@/audio/engine";

/**
 * Dev-only console (rendered only under `import.meta.env.DEV`). Three zones:
 * a 7-stop slider that scrubs the Prince's planet-unlock tier (one stop per
 * planet, snapping to its Macrobian threshold); audio gates (music = score,
 * sound = everything else) plus a random Change Track hop; and a Delete Prince
 * button. Prince mutations go through the store, so the chart fills in on the
 * anchor as you drag, and a live combat re-mirrors so the opponent re-fields
 * to match. Screen-spawning ("Regenerate") lives in the Page dropdown. Not
 * production UI.
 */
export function DevConsole() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const { enqueueCard } = useInfoCards();
  const [collapsed, setCollapsed] = useState(true);
  const [music, setMusic] = useState(isMusicEnabled());
  const [sound, setSound] = useState(isSoundEnabled());
  // Which theme the score is pointed at — retargets whenever a surface mounts,
  // so the label subscribes to the engine rather than reading once per render.
  const track = useSyncExternalStore(subscribeTheme, currentTheme);
  const canChangeTrack = !!track && music;

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
    <div className="dev-console">
      <button
        type="button"
        className="page-dropdown-button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="page-dropdown-eyebrow">Dev</span>
        <span className={`page-dropdown-caret${collapsed ? "" : " is-open"}`} aria-hidden>
          ▾
        </span>
      </button>
      {!collapsed && (
        <div className="dev-console-panel">
          {prince ? (
            <div className="dev-console-block">
              <div>
                Planets <strong>{unlocked.length} / 7</strong>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={Math.min(Math.max(unlocked.length, 1), 7)}
                onChange={(e) => setPlanets(Number(e.target.value))}
              />
              <div>{unlocked.join(" · ") || "(none)"}</div>
              {/* Queues the top unlocked planet's introduction (shows on
                  map/end — the stable surfaces). Scrub the slider to pick. */}
              <button
                type="button"
                className="dev-chrome-button"
                disabled={unlocked.length === 0}
                onClick={() => {
                  const planet = unlocked.at(-1);
                  if (planet) enqueueCard({ kind: "planet-intro", planet });
                }}
              >
                Intro Card{unlocked.length ? ` · ${unlocked.at(-1)}` : ""}
              </button>
            </div>
          ) : (
            <div>No Prince — mint one from the Title.</div>
          )}
          <div className="dev-console-divider" />
          <div className="dev-console-row">
            <label className="dev-console-check">
              <input
                type="checkbox"
                checked={music}
                onChange={(e) => {
                  setMusicEnabled(e.target.checked);
                  setMusic(e.target.checked);
                }}
              />
              Music
            </label>
            <label className="dev-console-check">
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked);
                  setSound(e.target.checked);
                }}
              />
              Sound
            </label>
          </div>
          <button
            type="button"
            className="dev-chrome-button"
            disabled={!canChangeTrack}
            onClick={shuffleTheme}
          >
            {track ? `Track · ${track}` : "Change Track"}
          </button>
          {prince && (
            <>
              <div className="dev-console-divider" />
              <button
                type="button"
                className="dev-chrome-button is-danger"
                onClick={() => dispatch({ kind: "clear" })}
              >
                Delete Prince
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
