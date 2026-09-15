import { useState, useSyncExternalStore } from "react";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { PlanetIntroCard } from "@/components/PlanetIntroCard";
import type { PlanetName } from "@/game/types";
import { remirrorCombat } from "@/state/dev-spawn";
import { unlockedPlanets } from "@/game/unlocks";
import { MACROBIAN_THRESHOLDS } from "@/game/data";
import {
  currentTheme,
  getMusicVolume,
  getSoundVolume,
  playUISound,
  setMusicVolume,
  setSoundVolume,
  nextTheme,
  subscribeTheme,
} from "@/audio/engine";
import { ChartTuner } from "@/components/ChartTuner";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

/**
 * Dev-only console (rendered only under `import.meta.env.DEV`). Three zones:
 * a 7-stop slider that scrubs the Prince's planet-unlock tier (one stop per
 * planet, snapping to its Macrobian threshold); audio volumes (music = score,
 * sound = everything else) plus a sequential Change Track button; and a Delete Prince
 * button. Prince mutations go through the store, so the chart fills in on the
 * anchor as you drag, and a live combat re-mirrors so the opponent re-fields
 * to match. Opened with `d`; screen-spawning and re-rolling live in DevChrome.
 * Not production UI.
 */
export function DevConsole({ open }: { open: boolean }) {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const [introPlanet, setIntroPlanet] = useState<PlanetName | null>(null);
  const [music, setMusic] = useState(getMusicVolume);
  const [sound, setSound] = useState(getSoundVolume);
  // Which theme the score is pointed at — retargets whenever a surface mounts,
  // so the label subscribes to the engine rather than reading once per render.
  const track = useSyncExternalStore(subscribeTheme, currentTheme);
  const canChangeTrack = !!track && music > 0;

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
    <>
      {prince && introPlanet && (
        <PlanetIntroCard key={introPlanet} chart={prince.chart} planet={introPlanet} onClose={() => setIntroPlanet(null)} />
      )}
      {open && (
        <div className="dev-console">
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
                onPointerEnter={playHoverSound}
                onFocus={playFocusSound}
                onChange={(e) => setPlanets(Number(e.target.value))}
              />
              <div>{unlocked.join(" · ") || "(none)"}</div>
              {/* Preview immediately on any surface. Scrub the slider to pick. */}
              <button
                type="button"
                className="dev-chrome-button"
                disabled={unlocked.length === 0}
                onPointerEnter={playHoverSound}
                onFocus={playFocusSound}
                onClick={() => {
                  const planet = unlocked.at(-1);
                  if (planet && planet !== introPlanet) {
                    playUISound("select");
                    setIntroPlanet(planet);
                  }
                }}
              >
                Intro Card{unlocked.length ? ` · ${unlocked.at(-1)}` : ""}
              </button>
            </div>
          ) : (
            <div>No Prince — mint one from the Title.</div>
          )}
          <div className="dev-console-divider" />
          <ChartTuner />
          <div className="dev-console-divider" />
          <div className="dev-console-block">
            <label className="dev-tuner-knob">
              <span>Music <strong>{Math.round(music * 100)}%</strong></span>
              <input
                type="range"
                aria-label="Music volume"
                min={0}
                max={100}
                step={1}
                value={Math.round(music * 100)}
                onPointerEnter={playHoverSound}
                onFocus={playFocusSound}
                onChange={(e) => {
                  const volume = Number(e.target.value) / 100;
                  setMusicVolume(volume);
                  setMusic(volume);
                }}
              />
            </label>
            <label className="dev-tuner-knob">
              <span>Sound <strong>{Math.round(sound * 100)}%</strong></span>
              <input
                type="range"
                aria-label="Sound volume"
                min={0}
                max={100}
                step={1}
                value={Math.round(sound * 100)}
                onPointerEnter={playHoverSound}
                onFocus={playFocusSound}
                onChange={(e) => {
                  const volume = Number(e.target.value) / 100;
                  setSoundVolume(volume);
                  setSound(volume);
                }}
              />
            </label>
          </div>
          <button
            type="button"
            className="dev-chrome-button"
            disabled={!canChangeTrack}
            onPointerEnter={playHoverSound}
            onFocus={playFocusSound}
            onClick={() => {
              if (!canChangeTrack) return;
              playUISound("select");
              nextTheme();
            }}
          >
            {track ? `Track · ${track === "Main" ? "Main Theme" : track}` : "Change Track"}
          </button>
          {prince && (
            <>
              <div className="dev-console-divider" />
              <button
                type="button"
                className="dev-chrome-button is-danger"
                onPointerEnter={playHoverSound}
                onFocus={playFocusSound}
                onClick={() => {
                  playUISound("commit");
                  dispatch({ kind: "clear" });
                }}
              >
                Delete Prince
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
