import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import type { Chart, PlanetName, PlanetStats, Polarity } from "@/game/types";
import { deriveStatTable } from "@/game/combat";
import { PLANET_ROLE } from "@/game/data";
import { PLANET_GLOSS, describeStat } from "@/game/glossary";
import { VALENCE_COLOR } from "@/svg/palette";

/** When present, the panel grows the combat fan-out: two action buttons under
 *  the readout. `pending` is the armed verb (first click); a second click on it
 *  confirms. The panel owns layout; combat owns the arm/commit logic. */
export interface PlanetStatsActions {
  afflict: number;
  testify: number;
  pending: Polarity | null;
  onChoose: (v: Polarity) => void;
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
  // Tap a stat row to drop its provenance prose below the table; one open at
  // a time.
  const [openStat, setOpenStat] = useState<keyof PlanetStats | null>(null);
  const toggleStat = (k: keyof PlanetStats) => setOpenStat((c) => (c === k ? null : k));
  const contentRef = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState(height);

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
  const x0 = cx - W / 2;
  const yTop = cy - height / 2; // top fixed; study grows downward

  return (
    <foreignObject className="ps-fo" x={x0} y={yTop} width={W} height={boxH} style={{ height: `${boxH}px` }}>
      {/* Swallow clicks on the card itself (padding, gloss, read-outs) so they
          don't bubble to the combat container's clear-selection handler — only
          clicking off the panel should dismiss it. */}
      <div className="ps-card" onClick={(e) => e.stopPropagation()}>
        <div className="ps-content" ref={contentRef}>
          <div
            className={`ps-title ${onToggleStudy ? "ps-title-tap" : ""} ${study ? "is-open" : ""}`}
            onClick={onToggleStudy ? (e) => { e.stopPropagation(); onToggleStudy(); } : undefined}
          >
            {onToggleStudy && <span className="ps-tri" aria-hidden>▶</span>}
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
                    {COLS.map((c) => (
                      <th key={c.key}>{c.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr
                      key={row.key}
                      className={`ps-statrow ${openStat === row.key ? "is-open" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStat(row.key);
                      }}
                    >
                      <td className="ps-rowlabel">
                        <span className="ps-tri" aria-hidden>▶</span>
                        {row.label}
                      </td>
                      <td>{row.core}</td>
                      <td>{row.placement || ""}</td>
                      <td>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {openStat && <div className="ps-blurb">{describeStat(chart.planets[planet], openStat)}</div>}
            </div>
          ) : (
            <div className="ps-ops">
              <div className="ps-opline">
                Resolve {table.durability} · Crit {table.critPct}%
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
