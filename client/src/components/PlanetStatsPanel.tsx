import type { CSSProperties } from "react";
import type { Chart, PlanetName, Polarity } from "@/game/types";
import { getEffectiveStats } from "@/game/combat";
import { PLANET_ROLE } from "@/game/data";
import { VALENCE_COLOR } from "@/svg/palette";

/** When present, the panel grows a row of two action buttons under the stats:
 *  the combat fan-out. Both verbs are always lit in their valence color, so
 *  touch reads the same as pointer. `pending` (the hovered verb, desktop only)
 *  gets an extra emphasis and drives the caller's projection preview.
 *  The panel owns its own layout; combat owns the logic. */
export interface PlanetStatsActions {
  afflict: number;
  testify: number;
  pending: Polarity | null;
  onChoose: (v: Polarity) => void;
  onPreview: (v: Polarity) => void;
}

interface PlanetStatsPanelProps {
  chart: Chart;
  planet: PlanetName;
  /** Panel center, in chart viewBox units. */
  cx: number;
  cy: number;
  actions?: PlanetStatsActions;
}

// Exported so Chart.tsx's anti-centroid placement can size its rect-vs-planet
// collision search. Kept modest so the placement has room to dodge stelliums
// (same-sign planets cluster toward the center); the bigger chart scale carries
// the on-screen size. Two heights: stats-only, and the taller action variant.
export const PLANET_STATS_PANEL_W = 420;
export const PLANET_STATS_PANEL_H = 120;
export const PLANET_STATS_PANEL_ACTION_H = 196;
const W = PLANET_STATS_PANEL_W;
const H = PLANET_STATS_PANEL_H;
const ACTION_H = PLANET_STATS_PANEL_ACTION_H;

const BTN_W = 165;
const BTN_H = 48;
const BTN_GAP = 22;

export function PlanetStatsPanel({ chart, planet, cx, cy, actions }: PlanetStatsPanelProps) {
  const eff = getEffectiveStats(chart, planet);
  const panelH = actions ? ACTION_H : H;
  const x0 = cx - W / 2;
  const y0 = cy - panelH / 2;
  // Stats-only panel keeps its centered layout; the action variant lays out
  // from the top so the button row has room beneath the stat line.
  const titleY = actions ? y0 + 40 : cy - 16;
  const rowY = actions ? y0 + 78 : cy + 18;
  return (
    <g className="planet-stats">
      <rect className="planet-stats-bg" x={x0} y={y0} width={W} height={panelH} rx={14} />
      <text className="planet-stats-title" x={cx} y={titleY} textAnchor="middle">
        <tspan>{planet.toUpperCase()},</tspan>
        <tspan className="planet-stats-epithet"> {PLANET_ROLE[planet].toUpperCase()}</tspan>
      </text>
      <text className="planet-stats-row" x={cx} y={rowY} textAnchor="middle">
        Dmg {eff.damage} · Heal {eff.healing} · Dur {eff.durability} · Luck {eff.luck}
      </text>
      {actions && <ActionButtons cx={cx} y={y0 + 146} actions={actions} />}
    </g>
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
          onMouseEnter={() => actions.onPreview(d.v)}
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
