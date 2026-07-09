import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CHART_SIZE } from "@/svg/viewbox";
import type { AspectType, Chart, PlanetName, PlanetStats, Polarity } from "@/game/types";
import { deriveStatTable } from "@/game/combat";
import { getAspects } from "@/game/aspects";
import { PLANET_ROLE } from "@/game/data";
import { ASPECT_GLOSS, COLUMN_GLOSS, PLANET_GLOSS, describeStat } from "@/game/glossary";
import { ASPECT_COLOR, VALENCE_COLOR } from "@/svg/palette";

/** When present, the panel grows the combat fan-out: two action buttons under
 *  the readout. `pending` is the armed verb (first click); a second click on it
 *  confirms. The panel owns layout; combat owns the arm/commit logic. */
export interface PlanetStatsActions {
  afflict: number;
  testify: number;
  pending: Polarity | null;
  onChoose: (v: Polarity) => void;
  /** Clear the armed verb without dismissing the panel — fired when a click
   *  lands on the card but off the action buttons. */
  onClearPending: () => void;
}

interface PlanetStatsPanelProps {
  chart: Chart;
  planet: PlanetName;
  /** Panel center, in chart viewBox units. */
  cx: number;
  cy: number;
  /** Closed reserved height (from `panelHeightFor`) — fixes the panel's top, so
   *  study mode grows the box downward without moving it. The live height is
   *  measured from content; this is the placement reserve and first-paint value. */
  height: number;
  actions?: PlanetStatsActions;
  /** Study mode on — the card drops open to the gloss + stat table. */
  study?: boolean;
  /** When provided, the panel shows the study "i" toggle. */
  onToggleStudy?: () => void;
}

// Exported so Chart.tsx's anti-centroid placement can size its rect-vs-planet
// collision search and reserve the box's top.
export const PLANET_STATS_PANEL_W = 420;
export const PLANET_STATS_PANEL_H = 120;
export const PLANET_STATS_PANEL_ACTION_H = 196;
const W = PLANET_STATS_PANEL_W;
const ACTION_EXTRA = PLANET_STATS_PANEL_ACTION_H - PLANET_STATS_PANEL_H;

/** Closed-panel height — the placement reserve and the panel's fixed top. */
export function panelHeightFor({ actions }: { actions: boolean }): number {
  return actions ? PLANET_STATS_PANEL_H + ACTION_EXTRA : PLANET_STATS_PANEL_H;
}

const COLS: Array<{ key: "core" | "placement" | "total"; header: string }> = [
  { key: "core", header: "Core" },
  { key: "placement", header: "Place" },
  { key: "total", header: "Total" },
];

/** Everything the shared blurb area can explain: a stat row's provenance,
 *  what the Core / Place column means, or one of the planet's aspects. */
type BlurbKey = keyof PlanetStats | "core" | "placement" | `aspect:${string}`;

const HARMONIOUS: ReadonlySet<AspectType> = new Set(["Conjunction", "Sextile", "Trine"]);

/** The stats panel — an HTML card inside a `<foreignObject>`, so the browser's
 *  layout engine handles columns, gridlines, spacing, and text wrapping (rather
 *  than hand-computed SVG coordinates). This is client study chrome, not the
 *  on-chain SVG artifact, so HTML-in-SVG is fine here (see STYLE.md). */
export function PlanetStatsPanel({
  chart,
  planet,
  cx,
  cy,
  height,
  actions,
  study = false,
  onToggleStudy,
}: PlanetStatsPanelProps) {
  // Tap a disclosure triangle — a stat row's (provenance) or a Core/Place
  // column head's (what the column means) — to drop prose below the table;
  // one open at a time.
  const [openKey, setOpenKey] = useState<BlurbKey | null>(null);
  const toggleKey = (k: BlurbKey) => setOpenKey((c) => (c === k ? null : k));
  const contentRef = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState(height);
  // The height transition is suppressed until the first paint lands, so the
  // panel snaps into being on the initial click rather than growing in. Once
  // ready, later height changes (the study + stat drop-downs) animate.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // Auto-size the box to its content — no hand-tuned height constants. The
  // foreignObject animates between measured heights (the drop-down), and the
  // card clips its content to that height so it reveals/conceals downward.
  // +2 covers the card's 1px top+bottom border.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setBoxH(el.offsetHeight + 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });

  const table = deriveStatTable(chart.planets[planet]);
  // The inspected planet's web, for the study aspects block — the vocabulary
  // behind the red/green lines (SCREENS §3.6.1 extension: aspects join planets
  // in the study layer).
  const aspects = getAspects(chart).filter((a) => a.from === planet);
  const x0 = cx - W / 2;
  // Top fixed; study grows downward — unless the grown box would run off the
  // chart's bottom edge (SVG clips at the viewBox), in which case the panel
  // slides up just enough to stay visible. `y` animates alongside `height`.
  const EDGE_MARGIN = 10;
  const yTop = Math.min(cy - height / 2, CHART_SIZE - EDGE_MARGIN - boxH);

  return (
    <foreignObject className={`ps-fo ${ready ? "is-ready" : ""}`} x={x0} y={yTop} width={W} height={boxH} style={{ height: `${boxH}px` }}>
      {/* Swallow clicks on the card itself (padding, gloss, read-outs) so they
          don't bubble to the combat container's clear-selection handler — only
          clicking off the panel should dismiss it. A card click does un-arm a
          pending verb, though: backing out of a choice shouldn't require
          leaving the panel. */}
      <div
        className="ps-card"
        onClick={(e) => {
          e.stopPropagation();
          if (actions?.pending) actions.onClearPending();
        }}
      >
        <div className="ps-content" ref={contentRef}>
          {/* The disclosure triangle alone is the toggle target (here and on
              rows/column heads below) — the surrounding text stays inert so
              stray clicks fall through to the card's un-arm/deselect swallow. */}
          <div className={`ps-title ${study ? "is-open" : ""}`}>
            {onToggleStudy && (
              <span
                className="ps-tri ps-tri-tap"
                aria-hidden
                onClick={(e) => { e.stopPropagation(); onToggleStudy(); }}
              >▶</span>
            )}
            {planet.toUpperCase()}
            <span className="ps-epithet">{PLANET_ROLE[planet].toUpperCase()}</span>
          </div>

          {study ? (
            <div className="ps-study">
              <div className="ps-gloss">{PLANET_GLOSS[planet]}</div>
              <table className="ps-table">
                <thead>
                  <tr>
                    <th aria-hidden />
                    {COLS.map(({ key, header }) =>
                      key === "total" ? (
                        <th key={key}>{header}</th>
                      ) : (
                        <th key={key} className={`ps-colhead ${openKey === key ? "is-open" : ""}`}>
                          <span
                            className="ps-tri ps-tri-tap"
                            aria-hidden
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleKey(key);
                            }}
                          >▶</span>
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.key} className={`ps-statrow ${openKey === row.key ? "is-open" : ""}`}>
                      <td className="ps-rowlabel">
                        <span
                          className="ps-tri ps-tri-tap"
                          aria-hidden
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleKey(row.key);
                          }}
                        >▶</span>
                        {row.label}
                      </td>
                      <td>{row.core}</td>
                      <td>{row.placement || ""}</td>
                      <td>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {aspects.length > 0 && (
                <div className="ps-aspects">
                  {aspects.map((a) => {
                    const key: BlurbKey = `aspect:${a.aspect}:${a.to}`;
                    return (
                      <div
                        key={key}
                        className={`ps-aspectrow ${openKey === key ? "is-open" : ""}`}
                      >
                        <span
                          className="ps-tri ps-tri-tap"
                          aria-hidden
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleKey(key);
                          }}
                        >▶</span>
                        <span
                          className="ps-aspectname"
                          style={{
                            color: HARMONIOUS.has(a.aspect)
                              ? ASPECT_COLOR.harmony
                              : ASPECT_COLOR.tension,
                          }}
                        >
                          {a.aspect.toUpperCase()}
                        </span>
                        <span className="ps-aspectother">{a.to.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {openKey && (
                <div className="ps-blurb">
                  {openKey === "core" || openKey === "placement"
                    ? COLUMN_GLOSS[openKey]
                    : typeof openKey === "string" && openKey.startsWith("aspect:")
                      ? ASPECT_GLOSS[openKey.split(":")[1] as Exclude<AspectType, "None">]
                      : describeStat(chart.planets[planet], openKey as keyof PlanetStats)}
                </div>
              )}
            </div>
          ) : (
            <div className="ps-ops">
              <div className="ps-opline">
                Resolve {table.durability} · Crit {table.critPct}
              </div>
              {actions && (
                <div className="ps-actions">
                  {(
                    [
                      { v: "Affliction" as Polarity, label: "Afflict", value: actions.afflict },
                      { v: "Testimony" as Polarity, label: "Testify", value: actions.testify },
                    ]
                  ).map((a) => (
                    <button
                      type="button"
                      key={a.v}
                      className={`ps-action ${actions.pending === a.v ? "is-on" : ""}`}
                      style={{ "--vc": VALENCE_COLOR[a.v] } as CSSProperties}
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.onChoose(a.v);
                      }}
                    >
                      {a.label} {a.value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </foreignObject>
  );
}
