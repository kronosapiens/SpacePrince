import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { isOver } from "@/game/run";
import { spawn, type SpawnKind } from "@/state/dev-spawn";
import { DevConsole } from "@/components/DevConsole";
import gridStyles from "@/style/dev-grid.css?raw";
import type { Prince, Run } from "@/game/types";
import { playUISound } from "@/audio/engine";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

type Surface = "title" | "index" | "mint" | "map" | "combat" | "narrative" | "end";

interface Page {
  label: string;
  kind: "title" | "mint" | SpawnKind;
}

// Title is plain navigation; Mint clears to the chart-creation surface; the rest
// spawn a fresh real game positioned at that surface (see dev-spawn). Everything
// but Title lands on /play, where PlaySurface derives the screen from state.
const PAGES: Page[] = [
  { label: "Title", kind: "title" },
  { label: "Mint", kind: "mint" },
  { label: "Map", kind: "map" },
  { label: "Encounter", kind: "combat" },
  { label: "Narrative", kind: "narrative" },
  { label: "Finished Map", kind: "end" },
];

/** Dev chrome (gated to dev builds by App): four keys, and a small legend for
 *  them in the lower-left whose words are buttons too. `d` opens the console,
 *  `r` re-rolls the current surface — spawning a fresh real game there — and
 *  `p` lists the surfaces, where a digit picks one; `g` outlines layout boxes.
 *  The play surfaces all live at /play,
 *  so the current surface is read from state, not the URL. */
export function DevChrome() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = usePrinceDispatch();
  const prince = usePrince();
  const run = useActiveRun();
  const [pagesOpen, setPagesOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [gridOn, setGridOn] = useState(false);

  useEffect(() => {
    setPagesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dev-grid", gridOn);
    return () => document.documentElement.classList.remove("dev-grid");
  }, [gridOn]);

  // Carry the current unlock tier across re-rolls so you can pin it and spin.
  const tier = prince?.numEncounters;
  const surface = currentSurface(location.pathname, prince, run);

  // Re-rolling applies to the spawnable game screens only.
  const regenKind: SpawnKind | null =
    surface === "map" || surface === "combat" || surface === "narrative" || surface === "end"
      ? surface
      : null;

  const launch = (kind: SpawnKind) => {
    dispatch({ kind: "mint", prince: spawn(kind, { tier }) });
    navigate(ROUTES.play);
  };

  const go = (page: Page) => {
    setPagesOpen(false);
    if (page.kind === "title" && surface === "title") return;
    playUISound(page.kind === "title" ? "select" : "commit");
    if (page.kind === "title") navigate(ROUTES.title);
    else if (page.kind === "mint") {
      dispatch({ kind: "clear" }); // no active run → PlaySurface shows mint
      navigate(ROUTES.play);
    } else launch(page.kind);
  };

  const regenerate = () => {
    if (!regenKind) return;
    playUISound("commit");
    launch(regenKind);
  };

  // The list and the console share the corner, so opening one shuts the other.
  const togglePages = () => {
    playUISound(pagesOpen ? "dismiss" : "select");
    setConsoleOpen(false);
    setPagesOpen((v) => !v);
  };
  const toggleConsole = () => {
    playUISound(consoleOpen ? "dismiss" : "select");
    setPagesOpen(false);
    setConsoleOpen((v) => !v);
  };
  const toggleGrid = () => {
    playUISound("select");
    setGridOn((v) => !v);
  };

  // The key handler reads the latest state and actions through a ref, so it
  // is bound once rather than on every render.
  const latest = useRef({ pagesOpen, go, regenerate, togglePages, toggleConsole, toggleGrid });
  latest.current = { pagesOpen, go, regenerate, togglePages, toggleConsole, toggleGrid };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      // Typing — the city picker, the console's own fields — is not a shortcut.
      if ((event.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const { pagesOpen, go, regenerate, togglePages, toggleConsole, toggleGrid } = latest.current;
      if (event.key === "d") toggleConsole();
      else if (event.key === "r") regenerate();
      else if (event.key === "p") togglePages();
      else if (event.key.toLowerCase() === "g") toggleGrid();
      else if (event.key === "Escape" && pagesOpen) togglePages();
      else if (pagesOpen && /^[1-6]$/.test(event.key)) {
        const page = PAGES[Number(event.key) - 1];
        if (page) go(page);
      }
    };
    // Grid inspection also works inside modals, which stop bubbling shortcuts.
    const onGridKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "g") onKeyDown(event);
    };
    const onOtherKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "g") onKeyDown(event);
    };
    window.addEventListener("keydown", onGridKeyDown, true);
    window.addEventListener("keydown", onOtherKeyDown);
    return () => {
      window.removeEventListener("keydown", onGridKeyDown, true);
      window.removeEventListener("keydown", onOtherKeyDown);
    };
  }, []);

  return (
    <>
      {gridOn && <style>{gridStyles}</style>}
      <div className="dev-keys" aria-label="Dev shortcuts">
        <button type="button" onClick={toggleConsole} onPointerEnter={playHoverSound} onFocus={playFocusSound} aria-expanded={consoleOpen}>
          <kbd>d</kbd>dev
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={regenerate} onPointerEnter={playHoverSound} onFocus={playFocusSound} disabled={!regenKind}>
          <kbd>r</kbd>regenerate
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={togglePages} onPointerEnter={playHoverSound} onFocus={playFocusSound} aria-expanded={pagesOpen}>
          <kbd>p</kbd>page
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={toggleGrid} onPointerEnter={playHoverSound} onFocus={playFocusSound} aria-pressed={gridOn}>
          <kbd>g</kbd>grid
        </button>
      </div>
      {pagesOpen && (
        <ul className="dev-pages" role="menu">
          {PAGES.map((p, i) => (
            <li key={p.label} role="menuitem">
              <button
                type="button"
                className={`dev-page${SURFACE_LABEL[surface] === p.label ? " is-current" : ""}`}
                onClick={() => go(p)}
                onPointerEnter={playHoverSound}
                onFocus={playFocusSound}
              >
                <kbd>{i + 1}</kbd>{p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <DevConsole open={consoleOpen} />
    </>
  );
}

const SURFACE_LABEL: Record<Surface, string> = {
  title: "Title",
  index: "Index",
  mint: "Mint",
  map: "Map",
  combat: "Encounter",
  narrative: "Narrative",
  end: "Finished Map",
};

/** Which surface is showing, distinguishing finished maps for dev re-rolls. */
function currentSurface(pathname: string, prince: Prince | null, run: Run | null): Surface {
  if (pathname === ROUTES.index) return "index";
  if (pathname !== ROUTES.play) return "title";
  if (!prince || !run) return "mint";
  if (run.encounter) return run.encounter.kind === "narrative" ? "narrative" : "combat";
  if (isOver(run, prince.chart, prince.numEncounters)) return "end";
  return "map";
}
