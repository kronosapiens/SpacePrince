import { useSyncExternalStore } from "react";
import { CHART_STYLE } from "@/svg/chart-style";
import {
  ACTIVE_HALO_R,
  AFFLICTION_ARC_R,
  INTERACTION_RING_R,
  INVITE_HALO_R,
  PLANET_R_REST,
} from "@/svg/viewbox";

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
 * The motion knobs aren't here: their consumers are CSS animations, so
 * `motion.css` stays authoritative and the console overrides them as inline
 * custom properties on :root (see `MOTION_KNOBS`).
 */
export interface ChartTuning {
  /** Planet disc radius. */
  discR: number;
  /** Affliction arc radius — inside the ring. */
  arcR: number;
  /** Interaction ring radius — invite / hover / select. */
  ringR: number;
  inviteHaloR: number;
  activeHaloR: number;
  arcStroke: number;
  /** The whole-ceiling track behind the arc. */
  arcTrack: number;
  /** The span the planet can still absorb. */
  arcRemaining: number;
  ringStroke: number;
  /** Planet symbol size as a multiple of the disc radius. */
  symbolRatio: number;
  /** The numeric affliction / projection badges. Off — the arc replaced them.
   *  Scaffolding: the toggle exists to put them back for a moment while the
   *  arc is still being trusted. Deleting the badges deletes this too. */
  showBadges: boolean;
}

/** The keys the slider list can drive — every knob whose value is a number. */
type NumericKey = {
  [K in keyof ChartTuning]: ChartTuning[K] extends number ? K : never;
}[keyof ChartTuning];

export const TUNING_DEFAULTS: ChartTuning = {
  discR: PLANET_R_REST,
  arcR: AFFLICTION_ARC_R,
  ringR: INTERACTION_RING_R,
  inviteHaloR: INVITE_HALO_R,
  activeHaloR: ACTIVE_HALO_R,
  arcStroke: CHART_STYLE.afflictionArc.stroke,
  arcTrack: CHART_STYLE.afflictionArc.trackOpacity,
  arcRemaining: CHART_STYLE.afflictionArc.remainingOpacity,
  ringStroke: CHART_STYLE.interactionRing.stroke,
  symbolRatio: CHART_STYLE.planet.symbolRatio,
  showBadges: false,
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
  { key: "discR", label: "Disc r", min: 12, max: 40, step: 1 },
  { key: "arcR", label: "Arc r", min: 16, max: 52, step: 1 },
  { key: "ringR", label: "Ring r", min: 20, max: 60, step: 1 },
  { key: "inviteHaloR", label: "Invite halo r", min: 24, max: 120, step: 1 },
  { key: "activeHaloR", label: "Active halo r", min: 30, max: 160, step: 1 },
  { key: "arcStroke", label: "Arc stroke", min: 1, max: 10, step: 0.5 },
  { key: "arcTrack", label: "Arc track", min: 0, max: 1, step: 0.02 },
  { key: "arcRemaining", label: "Arc remaining", min: 0, max: 1, step: 0.02 },
  { key: "ringStroke", label: "Ring stroke", min: 0.5, max: 10, step: 0.5 },
  { key: "symbolRatio", label: "Symbol ratio", min: 0.5, max: 1.6, step: 0.02 },
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
  { prop: "--breath-period", label: "Breath period", min: 0.5, max: 8, step: 0.1, suffix: "s" },
  { prop: "--invite-glow-min", label: "Glow floor", min: 0, max: 1, step: 0.02, suffix: "" },
  { prop: "--invite-glow-range", label: "Glow swing", min: 0, max: 1, step: 0.02, suffix: "" },
  { prop: "--invite-ring-swing", label: "Ring swing", min: 0, max: 0.3, step: 0.01, suffix: "" },
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
