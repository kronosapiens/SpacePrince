import { getTuning } from "@/svg/tuning";

/**
 * Pacing: how long each beat holds, in milliseconds. A turn's playback, the
 * Necessity opening, the pause before the map returns, the mint and title
 * fades, and the wait before a guide or card covers a newly arrived screen.
 * JS schedules read `timings()`; the CSS animations that must keep step
 * with them read the custom properties `applyTimings` writes on :root.
 *
 * Not here: hover and colour transitions, the breath, orbits and other ambient
 * motion, which stay in CSS.
 */
export const TIMINGS = {
  turn: {
    primaryDelay: 250,
    primaryEffectClear: 500,
    primaryGlowClear: 500,
    propagationStart: 750,
    propagationStep: 500,
    propagationApplyOffset: 250,
    /** At least `propagationTravel`, so the pulse reaches the target before
     *  its line is cleared. */
    propagationClearOffset: 500,
    /** The JS schedule and both CSS ripples. */
    combustRippleDuration: 1000,
    endOffset: 500,
    /** Pause between the opponent's resolution phase and the player's, so the
     *  two charts read sequentially rather than simultaneously. */
    interPhasePause: 250,
    propagationTravel: 500,
    effectBloom: 500,
    lightFlash: 500,
    lightPop: 500,
    actionGlow: 500,
    combust: 2000,
    /** The line naming the Other's move fades in each time it shows a new turn's move. */
    announceFade: 250,
  },
  /** Each planet's beat comes in two halves: the tension it takes appears on
   *  its arc (`reveal`), then lands on the chart as the segment fades
   *  (`settle`). The planet's accent and note span the whole beat. */
  necessity: {
    reveal: 250,
    settle: 250,
    /** The hold for each returning planet. */
    revival: 500,
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
    dimmed: 2000,
    framingFade: 500,
    titleFade: 500,
  },
  /** How long a screen is seen bare, once ready, before something covers it. */
  arrival: {
    /** A first-visit guide. */
    guide: 1000,
    /** A queued card over the map, such as a planet's introduction. */
    card: 1000,
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
    arrival: scaled(TIMINGS.arrival, all),
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
    "--m-announce-fade": turn.announceFade,
    "--m-necessity-accent": necessity.reveal + necessity.settle,
    "--m-necessity-arc": necessity.reveal,
    "--m-necessity-revival": necessity.revivalReveal,
    "--m-necessity-settle": necessity.settle,
    "--m-framing-fade": mint.framingFade,
    "--m-title-fade": mint.titleFade,
  };
  for (const [prop, ms] of Object.entries(durations)) {
    document.documentElement.style.setProperty(prop, `${ms}ms`);
  }
}
