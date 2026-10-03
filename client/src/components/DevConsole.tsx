import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { remirrorCombat } from "@/state/dev-spawn";
import { unlockedPlanets } from "@/game/unlocks";
import { UNLOCK_THRESHOLDS } from "@/game/data";
import { playUISound } from "@/audio/engine";
import { ChartTuner } from "@/components/ChartTuner";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

/** Dev-only unlock tier, chart tuning, and Prince reset. Opened with `d`;
 *  screen-spawning and re-rolling live in DevChrome. */
export function DevConsole({ open }: { open: boolean }) {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const unlocked = prince ? unlockedPlanets(prince.numEncounters) : [];

  // Set the unlock tier from a planet count (1–7): jump to that planet's
  // Macrobian threshold. A live combat is re-mirrored so the opponent re-fields
  // to the new tier alongside the player (Moon v Moon, 2v2, …).
  const setPlanets = (n: number) => {
    const count = UNLOCK_THRESHOLDS[n - 1] ?? 0;
    dispatch({ kind: "setEncounters", count });
    if (run?.encounter?.kind === "combat") {
      dispatch({
        kind: "commitRun",
        run: { ...run, encounter: remirrorCombat(run.encounter, count, run.seed) },
      });
    }
  };

  if (!open) return null;

  return (
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
        </div>
      ) : (
        <div>No Prince — mint one from the Title.</div>
      )}
      <div className="dev-console-divider" />
      <ChartTuner />
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
  );
}
