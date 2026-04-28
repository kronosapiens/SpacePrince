import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { generateSeedHash } from "@/state/dev-state";

interface Page {
  label: string;
  path: string;
}

const PAGES: Page[] = [
  { label: "Title", path: ROUTES.title },
  { label: "Start", path: ROUTES.start },
  { label: "Map", path: ROUTES.map },
  { label: "Encounter", path: ROUTES.encounter },
  { label: "Narrative", path: ROUTES.narrative },
  { label: "End of Run", path: ROUTES.end },
];

/** Floating "Page" dropdown in the upper-right corner. Lets the user jump
 *  to any of the 7 screens. Useful while iterating on the design — visible
 *  whenever dev mode is on (which is the default). */
export function PageDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const current = detectCurrentPage(location.pathname);
  const canRefresh = isRefreshablePage(current.path);

  const handleRefresh = () => {
    if (!canRefresh) return;
    navigate(`${current.path}/${generateSeedHash()}`);
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
        <span className="page-dropdown-current">{current.label}</span>
        <span className="page-dropdown-caret" aria-hidden>▾</span>
      </button>
      {open && (
        <ul className="page-dropdown-list" role="menu">
          {PAGES.map((p) => (
            <li key={p.path} role="menuitem">
              <button
                type="button"
                className={`page-dropdown-item ${p.path === current.path ? "is-current" : ""}`}
                onClick={() => {
                  setOpen(false);
                  navigate(p.path);
                }}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {canRefresh && (
        <button
          type="button"
          className="page-refresh-button"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      )}
    </div>
  );
}

function detectCurrentPage(pathname: string): Page {
  if (pathname === "/") return PAGES[0]!;
  const first = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  return PAGES.find((p) => p.path === first) ?? PAGES[0]!;
}

function isRefreshablePage(path: string): boolean {
  return path === ROUTES.map || path === ROUTES.encounter || path === ROUTES.narrative;
}
