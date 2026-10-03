/** The melody's bell: a bright attack fading into a rounded, sustained tone. */
export const BELL_VOICE = {
  harmonicity: 2.005,
  modulationIndex: 1.4,
  oscillator: { type: "sine" as const },
  modulation: { type: "sine" as const },
  envelope: { attack: 0.012, decay: 1.5, sustain: 0.55, release: 1.1 },
  modulationEnvelope: { attack: 0.002, decay: 0.18, sustain: 0.015, release: 0.12 },
};
