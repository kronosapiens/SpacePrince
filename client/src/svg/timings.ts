import { getTuning } from "@/svg/tuning";

/**
 * Pacing: how long each beat holds, in milliseconds. A turn's playback, the
 * Necessity opening, the pause before the map returns, and the mint and title
 * fades. JS schedules read `timings()`; the CSS animations that must keep step
 * with them read the custom properties `applyTimings` writes on :root.
 *
 * Not here: hover and colour transitions, the breath, orbits and other ambient
 * motion, which stay in CSS.
 */
export const TIMINGS = {
  turn: {
    primaryDelay: 200,
    primaryEffectClear: 360,
    primaryGlowClear: 600,
    propagationStart: 800,
    propagationStep: 520,
    propagationApplyOffset: 230,
    /** At least `propagationTravel`, so the pulse reaches the target before
     *  its line is cleared. */
    propagationClearOffset: 500,
    /** The JS schedule and both CSS ripples. */
    combustRippleDuration: 1000,
    endOffset: 360,
    /** Pause between the opponent's resolution phase and the player's, so the
     *  two charts read sequentially rather than simultaneously. */
    interPhasePause: 240,
    propagationTravel: 460,
    effectBloom: 460,
    lightFlash: 520,
    lightPop: 420,
    actionGlow: 600,
    combust: 1800,
  },
  necessity: {
    accent: 250,
    necessity: 350,
    fortune: 250,
    settle: 150,
    /** The hold for each returning planet. */
    revival: 500,
    arcReveal: 180,
    revivalReveal: 250,
  },
  /** The pause before the map returns. */
  leave: {
    encounter: 1800,
    houseCombust: 2400,
    runEnded: 2800,
  },
  mint: {
    revealInterval: 2500,
    heldMoment: 1500,
    dimmed: 1500,
    framingFade: 400,
    titleFade: 420,
  },
} as const;

type Timings = { [G in keyof typeof TIMINGS]: Record<keyof (typeof TIMINGS)[G], number> };

function scaled<T extends Record<string, number>>(group: T, factor: number): Record<keyof T, number> {
  return Object.fromEntries(
    Object.entries(group).map(([key, ms]) => [key, Math.round(ms * factor)]),
  ) as Record<keyof T, number>;
}

/** `TIMINGS` with the tuner's duration multipliers applied. */
export function timings(): Timings {
  const tuning = getTuning();
  const all = tuning.durationScale;
  return {
    turn: scaled(TIMINGS.turn, all * tuning.turnDurationScale),
    necessity: scaled(TIMINGS.necessity, all * tuning.necessityDurationScale),
    leave: scaled(TIMINGS.leave, all),
    mint: scaled(TIMINGS.mint, all),
  };
}

/** Write the durations CSS reads onto :root. */
export function applyTimings(): void {
  const { turn, necessity, mint } = timings();
  const durations = {
    "--m-prop-travel": turn.propagationTravel,
    "--m-effect-bloom": turn.effectBloom,
    "--m-combust-ripple": turn.combustRippleDuration,
    "--m-light-flash": turn.lightFlash,
    "--m-light-pop": turn.lightPop,
    "--m-planet-active": turn.actionGlow,
    "--m-combust": turn.combust,
    "--m-necessity-accent": necessity.accent,
    "--m-necessity-arc": necessity.arcReveal,
    "--m-necessity-revival": necessity.revivalReveal,
    "--m-necessity-settle": necessity.settle,
    "--m-framing-fade": mint.framingFade,
    "--m-title-fade": mint.titleFade,
  };
  for (const [prop, ms] of Object.entries(durations)) {
    document.documentElement.style.setProperty(prop, `${ms}ms`);
  }
}
