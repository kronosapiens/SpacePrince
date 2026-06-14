import { type CSSProperties, type ReactNode, useId, useState } from "react";
import type { Chart, PlanetName, Polarity } from "@/game/types";
import { deriveStatTable, type StatRow } from "@/game/combat";
import { PLANET_ROLE } from "@/game/data";
import { DERIVATION_GLOSS, PLANET_GLOSS } from "@/game/glossary";
import { VALENCE_COLOR } from "@/svg/palette";

/** When present, the panel grows a row of two action buttons under the stats:
 *  the combat fan-out. Both verbs are always lit in their valence color.
 *  `pending` is the armed verb (first-clicked) — it gets an extra emphasis;
 *  a second click on it confirms. The panel owns its layout; combat owns the
 *  arm/commit logic via `onChoose`. */
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
  /** Reserved (closed) panel height, from `panelHeightFor` — kept in sync with
   *  the chart's anti-centroid placement. Study mode anchors this box's *top*
   *  and grows downward from it, so opening study never moves the panel. */
  height: number;
  actions?: PlanetStatsActions;
  /** Study mode on — the box drops open to reveal the gloss + stat table
   *  (spec/design/SCREENS.md §3.6.1), and the action buttons clear to make room. */
  study?: boolean;
  /** When provided, the panel shows the study "i" toggle in its top-right. */
  onToggleStudy?: () => void;
}

// Exported so Chart.tsx's anti-centroid placement can size its rect-vs-planet
// collision search.
export const PLANET_STATS_PANEL_W = 420;
export const PLANET_STATS_PANEL_H = 120;
export const PLANET_STATS_PANEL_ACTION_H = 196;
/** Open (study) heights — compact by default; the box grows to the blurb height
 *  when a concept is drilled into, then shrinks back when it's dismissed. */
export const PLANET_STATS_PANEL_OPEN_H = 308;
export const PLANET_STATS_PANEL_OPEN_BLURB_H = 412;
const W = PLANET_STATS_PANEL_W;
const ACTION_EXTRA = PLANET_STATS_PANEL_ACTION_H - PLANET_STATS_PANEL_H;

/** Closed-panel height — used both for the chart's placement reserve and for the
 *  panel's fixed top. Study grows the box down to `PLANET_STATS_PANEL_OPEN_H`. */
export function panelHeightFor({ actions }: { actions: boolean }): number {
  return actions ? PLANET_STATS_PANEL_H + ACTION_EXTRA : PLANET_STATS_PANEL_H;
}

const BTN_W = 165;
const BTN_H = 48;
const BTN_GAP = 22;
const PAD_X = 26;

// Table column right-edges (relative to x0). Numbers are right-aligned to these;
// the row label sits at the left padding.
// Four equal columns (label + Core/Place/Total), text centered in each. The
// inner panel spans leftX..rightX (368 wide → 92 per column); these are the
// centers of the three numeric columns. The label column centers at x0+72.
const LABEL_CX = 72;
const COLS: Array<{
  key: "core" | "placement" | "total";
  header: string;
  cx: number;
  concept?: keyof typeof DERIVATION_GLOSS;
}> = [
  { key: "core", header: "Core", cx: 164, concept: "core" },
  { key: "placement", header: "Place", cx: 256, concept: "placement" },
  { key: "total", header: "Total", cx: 348 },
];

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
  // Which column's concept blurb is open (one tap deeper than the table).
  const [openConcept, setOpenConcept] = useState<keyof typeof DERIVATION_GLOSS | null>(null);
  const rawId = useId();
  const clipId = `study-clip-${rawId.replace(/:/g, "")}`;

  const table = deriveStatTable(chart.planets[planet]);
  const x0 = cx - W / 2;
  const yTop = cy - height / 2; // top is fixed; study grows the bottom downward
  const open = study;
  const boxH = open
    ? openConcept
      ? PLANET_STATS_PANEL_OPEN_BLURB_H
      : PLANET_STATS_PANEL_OPEN_H
    : height;

  return (
    <g className="planet-stats">
      <defs>
        <clipPath id={clipId}>
          <rect
            className="planet-stats-cliprect"
            x={x0} y={yTop} width={W} rx={14}
            height={boxH} style={{ height: `${boxH}px` }}
          />
        </clipPath>
      </defs>

      <rect
        className="planet-stats-bg"
        x={x0} y={yTop} width={W} rx={14}
        height={boxH} style={{ height: `${boxH}px` }}
      />

      {onToggleStudy && (
        <g
          className={`planet-stats-i ${open ? "is-on" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStudy();
          }}
        >
          <circle className="planet-stats-i-ring" cx={x0 + W - 24} cy={yTop + 24} r={11} />
          <text className="planet-stats-i-label" x={x0 + W - 24} y={yTop + 24} textAnchor="middle">
            i
          </text>
        </g>
      )}

      {/* Title — the one element fixed across both states. */}
      <PanelTitle planet={planet} cx={cx} y={yTop + 40} />

      {/* Closed operational read-outs (Light · Crit + the action fan-out). All
          four collapse into the table as study drops open — afflict/testify are
          the Dmg/Heal totals; Light and Crit derive from Dur and Luck. */}
      <g
        className="planet-stats-closed"
        style={{ opacity: open ? 0 : 1, pointerEvents: open ? "none" : "auto" }}
      >
        <text className="planet-stats-row" x={cx} y={yTop + 78} textAnchor="middle">
          Resolve {table.durability} · Crit {table.critPct}%
        </text>
        {actions && <ActionButtons cx={cx} y={yTop + 146} actions={actions} />}
      </g>

      {/* Study extension — clipped to the animated box, fades in as it opens. */}
      <g
        className="planet-stats-ext"
        clipPath={`url(#${clipId})`}
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      >
        <StudyExtension
          planet={planet}
          rows={table.rows}
          cx={cx}
          x0={x0}
          yTop={yTop}
          openConcept={openConcept}
          onOpenConcept={setOpenConcept}
        />
      </g>
    </g>
  );
}

/** The drop-down content: the symbolic gloss, the underlying-stat table, and
 *  (one tap deeper) a column's concept blurb. Laid out top-down with a y cursor,
 *  below the operational header. */
function StudyExtension({
  planet,
  rows,
  cx,
  x0,
  yTop,
  openConcept,
  onOpenConcept,
}: {
  planet: PlanetName;
  rows: StatRow[];
  cx: number;
  x0: number;
  yTop: number;
  openConcept: keyof typeof DERIVATION_GLOSS | null;
  onOpenConcept: (k: keyof typeof DERIVATION_GLOSS | null) => void;
}) {
  const leftX = x0 + PAD_X;
  const rightX = x0 + W - PAD_X;
  const toggle = (k: keyof typeof DERIVATION_GLOSS) =>
    onOpenConcept(openConcept === k ? null : k);

  const els: ReactNode[] = [];
  let y = yTop + 84;

  // Symbolic gloss — the meaning, leading the drop-down.
  for (const line of wrapText(PLANET_GLOSS[planet], 40)) {
    els.push(
      <text key={`gloss-${y}`} className="planet-stats-gloss" x={cx} y={y} textAnchor="middle">
        {line}
      </text>,
    );
    y += 24;
  }
  // Equal breathing room above and below the gloss: the gap to the title above
  // is 44 (center-to-center); match it below before the table.
  y += 20;

  // Table header.
  const headerY = y;
  for (const col of COLS) {
    const headerProps = { className: "planet-stats-col", x: x0 + col.cx, y: headerY, textAnchor: "middle" as const };
    els.push(
      col.concept ? (
        <g
          key={`h-${col.key}`}
          className={`planet-stats-coltap ${openConcept === col.concept ? "is-open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggle(col.concept!);
          }}
        >
          <text {...headerProps}>{col.header}</text>
        </g>
      ) : (
        <text key={`h-${col.key}`} {...headerProps}>{col.header}</text>
      ),
    );
  }
  // Gridlines — hairline, drawn before the text so the numbers sit on top. The
  // header underline is a touch stronger to set the headers off from the rows.
  const ROW_H = 28;
  const underlineY = headerY + 12;
  const firstRowY = headerY + 36;
  const gridTop = headerY - 18;
  const gridBottom = firstRowY + (rows.length - 1) * ROW_H + 14;
  for (const vx of [118, 210, 302]) {
    els.push(<line key={`v-${vx}`} className="planet-stats-grid" x1={x0 + vx} y1={gridTop} x2={x0 + vx} y2={gridBottom} />);
  }
  els.push(<line key="rule" className="planet-stats-divider" x1={leftX} y1={underlineY} x2={rightX} y2={underlineY} />);
  for (let i = 0; i < rows.length; i++) {
    const hy = firstRowY + 14 + i * ROW_H;
    els.push(<line key={`h-${i}`} className="planet-stats-grid" x1={leftX} y1={hy} x2={rightX} y2={hy} />);
  }

  // Stat rows.
  y = firstRowY;
  for (const row of rows) {
    els.push(
      <text key={`l-${row.key}`} className="planet-stats-rowlabel" x={x0 + LABEL_CX} y={y} textAnchor="middle">
        {row.label}
      </text>,
    );
    for (const col of COLS) {
      const txt = cellText(row, col.key);
      if (txt === "") continue;
      els.push(
        <text key={`${row.key}-${col.key}`} className="planet-stats-cell" x={x0 + col.cx} y={y} textAnchor="middle">
          {txt}
        </text>,
      );
    }
    y += ROW_H;
  }

  // Concept blurb — one tap deeper. Real text wrapping via <foreignObject>: an
  // HTML <div> reflows to the panel width instead of guessing line breaks by
  // character count (SVG <text> has no auto-wrap). This is client-panel chrome,
  // not the on-chain SVG artifact, so the HTML-in-SVG is fine here.
  if (openConcept) {
    y += 8;
    els.push(<line key="div2" className="planet-stats-divider" x1={leftX} y1={y} x2={rightX} y2={y} />);
    y += 12;
    els.push(
      <foreignObject key="blurb" x={leftX} y={y} width={rightX - leftX} height={84}>
        <div className="planet-stats-blurb-fo">{DERIVATION_GLOSS[openConcept].blurb}</div>
      </foreignObject>,
    );
  }

  return <>{els}</>;
}

function PanelTitle({ planet, cx, y }: { planet: PlanetName; cx: number; y: number }) {
  return (
    <text className="planet-stats-title" x={cx} y={y} textAnchor="middle">
      <tspan>{planet.toUpperCase()},</tspan>
      <tspan className="planet-stats-epithet"> {PLANET_ROLE[planet].toUpperCase()}</tspan>
    </text>
  );
}

function ActionButtons({ cx, y, actions }: { cx: number; y: number; actions: PlanetStatsActions }) {
  const defs: Array<{ v: Polarity; label: string; value: number; dx: number }> = [
    { v: "Affliction", label: "Afflict", value: actions.afflict, dx: -(BTN_W + BTN_GAP) / 2 },
    { v: "Testimony", label: "Testify", value: actions.testify, dx: (BTN_W + BTN_GAP) / 2 },
  ];
  return (
    <>
      {defs.map((d) => (
        <g
          key={d.v}
          className={`panel-action ${actions.pending === d.v ? "is-on" : ""}`}
          transform={`translate(${cx + d.dx}, ${y})`}
          style={{ "--action-c": VALENCE_COLOR[d.v] } as CSSProperties}
          onClick={(e) => {
            e.stopPropagation();
            actions.onChoose(d.v);
          }}
        >
          <rect
            className="panel-action-bg"
            x={-BTN_W / 2} y={-BTN_H / 2} width={BTN_W} height={BTN_H} rx={BTN_H / 2}
          />
          <text className="panel-action-label" x={0} y={0} textAnchor="middle">
            {d.label} {d.value}
          </text>
        </g>
      ))}
    </>
  );
}

/** Core and total show plainly; placement hides its zeros. No sign — there are
 *  no debuffs in the current iteration, so every buff is a positive. */
function cellText(row: StatRow, col: "core" | "placement" | "total"): string {
  switch (col) {
    case "core":
      return String(row.core);
    case "placement":
      return row.placement !== 0 ? String(row.placement) : "";
    case "total":
      return String(row.total);
  }
}

/** Greedy word-wrap for SVG <text> (no native wrapping). */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
