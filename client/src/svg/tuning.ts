import { useSyncExternalStore } from "react";
import { CHART_STYLE } from "@/svg/chart-style";
import { ACTIVE_HALO_R, INVITE_HALO_R } from "@/svg/viewbox";

/**
 * Live overrides for the chart knobs that can only be judged in motion —
 * concentric radii that are read against each other, breath swings that are
 * read against the clock. The DevConsole drives these at runtime so a value
 * gets picked by looking rather than by arithmetic; whatever a session settles
 * on is then written back into `viewbox.ts` / `chart-style.ts` by hand.
 *
 * The committed tokens are the defaults, so this is an override layer and never
 * a second source of truth. Nothing outside the dev console calls `setTuning`,
 * so production renders the defaults and the store never notifies.
 *
 * A knob earns its place by being unsettled. The concentric radii (disc 24, arc
 * 30, ring 36), the two stroke widths (arc 4, ring 3), the symbol ratio, the
 * breath period and the ring swing all came off this list once their values
 * stopped moving — their consumers read the tokens directly now, which is also
 * how you can tell at the call site that a number is decided. Put one back the
 * moment it is in question again; that costs a field, a default and a row.
 *
 * What is left is the light: the two halo radii, the arc's opacities, and the
 * invite glow's floor and swing — plus the diff's own glow and stroke, which
 * are the two channels still being pushed to make a preview read.
 *
 * The motion knobs aren't here: their consumers are CSS animations, so
 * `motion.css` stays authoritative and the console overrides them as inline
 * custom properties on :root (see `MOTION_KNOBS`).
 */
export interface ChartTuning {
  inviteHaloR: number;
  activeHaloR: number;
  /** The whole-ceiling track behind the arc. */
  arcTrack: number;
  /** The span the planet can still absorb. */
  arcRemaining: number;
  /** Drop-shadow radius on the projection diff — how hard a preview burns. */
  arcDiffGlow: number;
  /** The diff's own stroke, wider than the arc's so it gains area. */
  arcDiffStroke: number;
  /** The numeric affliction / projection badges. Off — the arc replaced them.
   *  Scaffolding: the toggle exists to put them back for a moment while the
   *  arc is still being trusted. Deleting the badges deletes this too. */
  showBadges: boolean;
  /** Every soft light on the surface at once — the colour-field blooms, both
   *  planet halos, the drop-shadows under the interaction ring and the arc's
   *  diff, and the screen's active-planet tint. Off puts the whole UI on pure
   *  void, which is the only way to see what the line work is doing on its own.
   *  Scaffolding, like the badges above. */
  showGlow: boolean;
}

/** The keys the slider list can drive — every knob whose value is a number. */
type NumericKey = {
  [K in keyof ChartTuning]: ChartTuning[K] extends number ? K : never;
}[keyof ChartTuning];

export const TUNING_DEFAULTS: ChartTuning = {
  inviteHaloR: INVITE_HALO_R,
  activeHaloR: ACTIVE_HALO_R,
  arcTrack: CHART_STYLE.afflictionArc.trackOpacity,
  arcRemaining: CHART_STYLE.afflictionArc.remainingOpacity,
  arcDiffGlow: CHART_STYLE.afflictionArc.diffGlow,
  arcDiffStroke: CHART_STYLE.afflictionArc.diffStroke,
  showBadges: false,
  showGlow: true,
};

/** Slider ranges for the console. Bounds are generous rather than safe — the
 *  point is to find out where a value stops working, which means being able to
 *  push it past that. */
export const TUNING_KNOBS: ReadonlyArray<{
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "inviteHaloR", label: "Invite halo r", min: 24, max: 120, step: 1 },
  { key: "activeHaloR", label: "Active halo r", min: 30, max: 160, step: 1 },
  { key: "arcTrack", label: "Arc track", min: 0, max: 1, step: 0.02 },
  { key: "arcRemaining", label: "Arc remaining", min: 0, max: 1, step: 0.02 },
  { key: "arcDiffGlow", label: "Arc diff glow", min: 0, max: 16, step: 0.5 },
  { key: "arcDiffStroke", label: "Arc diff stroke", min: 1, max: 10, step: 0.5 },
];

/** The `motion.css` custom properties the console can override. `suffix` is
 *  what CSS needs appended to the raw number (a duration needs its unit). */
export const MOTION_KNOBS: ReadonlyArray<{
  prop: string;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
}> = [
  { prop: "--invite-glow-min", label: "Glow floor", min: 0, max: 1, step: 0.02, suffix: "" },
  { prop: "--invite-glow-range", label: "Glow swing", min: 0, max: 1, step: 0.02, suffix: "" },
];

/** The value `motion.css` declares, before any console override. */
export function readMotionKnob(prop: string): number {
  const declared = getComputedStyle(document.documentElement).getPropertyValue(prop);
  return Number.parseFloat(declared);
}

export function setMotionKnob(prop: string, value: number, suffix: string): void {
  document.documentElement.style.setProperty(prop, `${value}${suffix}`);
}

/** Drop every inline override so the stylesheet's own values take back over. */
export function resetMotionKnobs(): void {
  for (const knob of MOTION_KNOBS) {
    document.documentElement.style.removeProperty(knob.prop);
  }
}

let current: ChartTuning = TUNING_DEFAULTS;
const listeners = new Set<() => void>();

export function getTuning(): ChartTuning {
  return current;
}

export function setTuning(patch: Partial<ChartTuning>): void {
  current = { ...current, ...patch };
  for (const listener of listeners) listener();
}

export function resetTuning(): void {
  current = TUNING_DEFAULTS;
  for (const listener of listeners) listener();
}

export function subscribeTuning(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTuning(): ChartTuning {
  return useSyncExternalStore(subscribeTuning, getTuning, getTuning);
}
