import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { spawn, type SpawnKind } from "@/state/dev-spawn";

interface Page {
  label: string;
  kind: "nav" | SpawnKind;
  to?: string;
}

// Title/Start are plain navigation; the rest spawn a fresh real game positioned
// at that screen (see dev-spawn). "Regenerate" re-rolls the current screen kind.
const PAGES: Page[] = [
  { label: "Title", kind: "nav", to: ROUTES.title },
  { label: "Start", kind: "nav", to: ROUTES.start },
  { label: "Map", kind: "map" },
  { label: "Encounter", kind: "combat" },
  { label: "Narrative", kind: "narrative" },
  { label: "End of Run", kind: "end" },
];

/** Floating "Page" dropdown in the upper-right corner. Jumps to any screen —
 *  spawning a fresh real game where one is needed — and re-rolls the current
 *  screen. Dev chrome; gated to dev builds by its caller (App). */
export function PageDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = usePrinceDispatch();
  const prince = usePrince();
  const run = useActiveRun();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Carry the current unlock tier across re-rolls so you can pin it and spin.
  const tier = prince?.numEncounters;
  const encKind = run?.encounter?.kind ?? null;
  const currentKind = detectKind(location.pathname, encKind);

  const launch = (kind: SpawnKind) => {
    const { prince: p, route } = spawn(kind, { tier });
    dispatch({ kind: "mint", prince: p });
    navigate(route);
  };

  const go = (page: Page) => {
    setOpen(false);
    if (page.kind === "nav") navigate(page.to!);
    else launch(page.kind);
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
        <span className="page-dropdown-current">{currentLabel(location.pathname, encKind)}</span>
        <span className="page-dropdown-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="page-dropdown-list" role="menu">
          {PAGES.map((p) => (
            <li key={p.label} role="menuitem">
              <button
                type="button"
                className="page-dropdown-item"
                onClick={() => go(p)}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {currentKind && (
        <button
          type="button"
          className="page-refresh-button"
          onClick={() => launch(currentKind)}
        >
          Regenerate
        </button>
      )}
    </div>
  );
}

/** The spawn kind to re-roll for the current screen, or null (Title/Start/Index). */
function detectKind(pathname: string, encKind: string | null): SpawnKind | null {
  const first = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  if (first === ROUTES.map) return "map";
  if (first === ROUTES.end) return "end";
  if (first === ROUTES.encounter) return encKind === "narrative" ? "narrative" : "combat";
  return null;
}

function currentLabel(pathname: string, encKind: string | null): string {
  const kind = detectKind(pathname, encKind);
  if (kind === "map") return "Map";
  if (kind === "end") return "End of Run";
  if (kind === "combat") return "Encounter";
  if (kind === "narrative") return "Narrative";
  if (pathname === ROUTES.start) return "Start";
  if (pathname === ROUTES.index) return "Index";
  return "Title";
}
