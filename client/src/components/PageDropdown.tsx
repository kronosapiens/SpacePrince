import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { isOver } from "@/game/run";
import { spawn, type SpawnKind } from "@/state/dev-spawn";
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

/** Floating "Page" dropdown (dev chrome; gated to dev builds by App). Jumps to
 *  any surface — spawning a fresh real game where one is needed — and re-rolls
 *  the current one. The play surfaces all live at /play, so the current surface
 *  is read from state, not the URL. */
export function PageDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = usePrinceDispatch();
  const prince = usePrince();
  const run = useActiveRun();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Carry the current unlock tier across re-rolls so you can pin it and spin.
  const tier = prince?.numEncounters;
  const surface = currentSurface(location.pathname, prince, run);
  // Regenerate re-rolls the current surface when it's a spawnable game screen.
  const regenKind: SpawnKind | null =
    surface === "map" || surface === "combat" || surface === "narrative" || surface === "end"
      ? surface
      : null;

  const launch = (kind: SpawnKind) => {
    dispatch({ kind: "mint", prince: spawn(kind, { tier }) });
    navigate(ROUTES.play);
  };

  const go = (page: Page) => {
    setOpen(false);
    if (page.kind === "title") navigate(ROUTES.title);
    else if (page.kind === "mint") {
      dispatch({ kind: "clear" }); // no active run → PlaySurface shows mint
      navigate(ROUTES.play);
    } else launch(page.kind);
  };

  return (
    <div className="page-dropdown" ref={ref}>
      <button
        type="button"
        className="page-dropdown-button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="page-dropdown-eyebrow">Page</span>
        <span className="page-dropdown-current">{SURFACE_LABEL[surface]}</span>
        <span className="page-dropdown-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="page-dropdown-list" role="menu">
          {PAGES.map((p) => (
            <li key={p.label} role="menuitem">
              <button type="button" className="page-dropdown-item" onClick={() => go(p)}>
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {regenKind && (
        <button type="button" className="page-refresh-button" onClick={() => launch(regenKind)}>
          Regenerate
        </button>
      )}
    </div>
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
  if (isOver(run, prince.numEncounters)) return "end";
  return "map";
}
