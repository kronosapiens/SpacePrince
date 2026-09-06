import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { isOver } from "@/game/run";
import { spawn, type SpawnKind } from "@/state/dev-spawn";
import { DevConsole } from "@/components/DevConsole";
import type { Prince, Run } from "@/game/types";

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
  { label: "End of Run", kind: "end" },
];

/** Dev chrome (gated to dev builds by App): three keys, and a small legend for
 *  them in the lower-left whose words are buttons too. `d` opens the console,
 *  `r` re-rolls the current surface — spawning a fresh real game there — and
 *  `p` lists the surfaces, where a digit picks one. Nothing else sits on the
 *  screen, so the game is seen as it is. The play surfaces all live at /play,
 *  so the current surface is read from state, not the URL. */
export function DevChrome() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = usePrinceDispatch();
  const prince = usePrince();
  const run = useActiveRun();
  const [pagesOpen, setPagesOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);

  useEffect(() => {
    setPagesOpen(false);
  }, [location.pathname]);

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
    if (page.kind === "title") navigate(ROUTES.title);
    else if (page.kind === "mint") {
      dispatch({ kind: "clear" }); // no active run → PlaySurface shows mint
      navigate(ROUTES.play);
    } else launch(page.kind);
  };

  const regenerate = () => {
    if (regenKind) launch(regenKind);
  };

  // The list and the console share the corner, so opening one shuts the other.
  const togglePages = () => {
    setConsoleOpen(false);
    setPagesOpen((v) => !v);
  };
  const toggleConsole = () => {
    setPagesOpen(false);
    setConsoleOpen((v) => !v);
  };

  // The key handler reads the latest state and actions through a ref, so it
  // is bound once rather than on every render.
  const latest = useRef({ pagesOpen, go, regenerate, togglePages, toggleConsole });
  latest.current = { pagesOpen, go, regenerate, togglePages, toggleConsole };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      // Typing — the city picker, the console's own fields — is not a shortcut.
      if ((event.target as Element | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const { pagesOpen, go, regenerate, togglePages, toggleConsole } = latest.current;
      if (event.key === "d") toggleConsole();
      else if (event.key === "r") regenerate();
      else if (event.key === "p") togglePages();
      else if (event.key === "Escape") setPagesOpen(false);
      else if (pagesOpen && /^[1-6]$/.test(event.key)) {
        const page = PAGES[Number(event.key) - 1];
        if (page) go(page);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div className="dev-keys" aria-label="Dev shortcuts">
        <button type="button" onClick={toggleConsole} aria-expanded={consoleOpen}>
          <kbd>d</kbd>dev
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={regenerate} disabled={!regenKind}>
          <kbd>r</kbd>regenerate
        </button>
        <span aria-hidden>·</span>
        <button type="button" onClick={togglePages} aria-expanded={pagesOpen}>
          <kbd>p</kbd>page
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
  end: "End of Run",
};

/** Which surface is showing — mirrors PlaySurface's derivation for /play. */
function currentSurface(pathname: string, prince: Prince | null, run: Run | null): Surface {
  if (pathname === ROUTES.index) return "index";
  if (pathname !== ROUTES.play) return "title";
  if (!prince || !run) return "mint";
  if (run.encounter) return run.encounter.kind === "narrative" ? "narrative" : "combat";
  if (isOver(run, prince.chart, prince.numEncounters)) return "end";
  return "map";
}
