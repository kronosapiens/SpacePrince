import type { LeadVoice, ThemeNote, ThemeRole, ThemeSpec } from "./themes";

type ToneModule = typeof import("tone");
export type ThemeSurface = "map" | "combat" | "narrative";
type ThemeLayer = "bed" | "down" | "up";

const LAYERS: ThemeLayer[] = ["bed", "down", "up"];
const SURFACE_MIX: Record<ThemeSurface, Record<ThemeLayer, number>> = {
  map: { bed: 0.9, down: 1, up: 0 },
  narrative: { bed: 0.65, down: 0.4, up: 0 },
  combat: { bed: 1, down: 0.25, up: 0.85 },
};

// These names describe the lead's color; every voice is synthesized in Tone.
const LEAD_COLOR: Record<Exclude<LeadVoice, "bell">, {
  partials: number[];
  attack: number;
  cutoff: number;
  vibrato: number;
}> = {
  flute: { partials: [1, 0.12, 0.22, 0.03, 0.06], attack: 0.045, cutoff: 650, vibrato: 0.035 },
  horn: { partials: [1, 0.5, 0.3, 0.12, 0.06], attack: 0.09, cutoff: 450, vibrato: 0.025 },
  strings: { partials: [1, 0.38, 0.25, 0.18, 0.09, 0.05], attack: 0.22, cutoff: 360, vibrato: 0.065 },
};

interface Disposable { dispose(): unknown }
type PlayNote = (note: ThemeNote, time: number) => void;

/** A playing theme owns its voices and effect tails, including during a fade. */
export function createScore(
  T: ToneModule, spec: ThemeSpec, surface: ThemeSurface,
  output: import("tone").ToneAudioNode = T.getDestination(),
) {
  const resources: Disposable[] = [];
  const own = <N extends Disposable>(node: N): N => {
    resources.push(node);
    return node;
  };
  const spb = 60 / spec.bpm;
  const limiter = own(new T.Limiter(-2)).connect(output);
  const master = own(new T.Gain(0)).connect(limiter);
  const gains = {} as Record<ThemeLayer, import("tone").Gain>;

  function createVoice(role: ThemeRole, dry: import("tone").Gain, room: import("tone").Reverb): PlayNote {
    if (role === "snare" || role === "hat") {
      const filter = own(new T.Filter({
        type: "highpass", frequency: role === "hat" ? 6500 : 1100, Q: 0.5,
      })).connect(dry);
      const noise = own(new T.NoiseSynth({
        noise: { type: role === "hat" ? "white" : "pink" },
        envelope: { attack: 0.003, decay: role === "hat" ? 0.045 : 0.16, sustain: 0, release: 0.06 },
        volume: role === "hat" ? -9 : -3,
      })).connect(filter);
      return (note, time) => noise.triggerAttackRelease(note.d * spb, time, note.v);
    }

    let inst;
    switch (role) {
      case "pad": {
        const chorus = own(new T.Chorus({
          frequency: 0.23, delayTime: 3.5, depth: 0.35, feedback: 0, wet: 0.25,
        })).connect(room).start();
        const filter = own(new T.Filter({ type: "lowpass", frequency: 2200, Q: 0.4 })).connect(chorus);
        inst = own(new T.PolySynth(T.Synth, {
          oscillator: { type: "fattriangle", count: 2, spread: 7 },
          envelope: { attack: 0.65, decay: 1.6, sustain: 0.45, release: 1.8 },
          volume: -3,
        })).connect(filter);
        break;
      }
      case "lead": {
        const echo = own(new T.FeedbackDelay({
          delayTime: 1.5 * spb, feedback: 0.16, wet: 0.12, maxDelay: 3,
        })).connect(room);
        if (spec.leadVoice === "bell") {
          // The bright attack fades into a rounded, sustained carrier tone.
          inst = own(new T.PolySynth(T.FMSynth, {
            harmonicity: 2.005,
            modulationIndex: 1.4,
            oscillator: { type: "sine" },
            modulation: { type: "sine" },
            envelope: { attack: 0.012, decay: 1.5, sustain: 0.55, release: 1.1 },
            modulationEnvelope: { attack: 0.002, decay: 0.18, sustain: 0.015, release: 0.12 },
            volume: 4,
          })).connect(echo);
          break;
        }
        const color = LEAD_COLOR[spec.leadVoice];
        const vibrato = own(new T.Vibrato({
          frequency: 4.6, depth: color.vibrato, maxDelay: 0.005,
        })).connect(echo);
        inst = own(new T.PolySynth(T.MonoSynth, {
          oscillator: { type: "custom", partials: color.partials },
          filter: { type: "lowpass", Q: 0.65, rolloff: -12 },
          filterEnvelope: {
            attack: color.attack * 2, decay: 0.8, sustain: 0.35, release: 0.9,
            baseFrequency: color.cutoff, octaves: 2.3,
          },
          envelope: { attack: color.attack, decay: 0.7, sustain: 0.65, release: 0.7 },
          volume: 4,
        })).connect(vibrato);
        break;
      }
      case "arp": {
        // A dotted-eighth echo answers the played notes, even though Transport
        // stays at its default BPM; score times and delays both use seconds.
        const echo = own(new T.PingPongDelay({
          delayTime: 0.75 * spb, feedback: 0.28, wet: 0.28, maxDelay: 2,
        })).connect(room);
        const filter = own(new T.Filter({ type: "lowpass", frequency: 4600, Q: 0.5 })).connect(echo);
        inst = own(new T.PolySynth(T.FMSynth, {
          harmonicity: 3.005,
          modulationIndex: 2.2,
          oscillator: { type: "sine" },
          modulation: { type: "sine" },
          envelope: { attack: 0.003, decay: 1.2, sustain: 0, release: 0.65 },
          modulationEnvelope: { attack: 0.002, decay: 0.22, sustain: 0.03, release: 0.2 },
          volume: 6,
        })).connect(filter);
        break;
      }
      case "bass":
        inst = own(new T.MonoSynth({
          oscillator: { type: "custom", partials: [1, 0.3, 0.12] },
          filter: { type: "lowpass", Q: 0.5 },
          filterEnvelope: {
            attack: 0.015, decay: 0.3, sustain: 0.2, release: 0.3,
            baseFrequency: 140, octaves: 1.6,
          },
          envelope: { attack: 0.012, decay: 0.45, sustain: 0.55, release: 0.3 },
          volume: 3,
        })).connect(dry);
        break;
      case "kick":
        inst = own(new T.MembraneSynth({
          pitchDecay: 0.025, octaves: 2.5,
          envelope: { attack: 0.003, decay: 0.28, sustain: 0, release: 0.1 },
          volume: 2,
        })).connect(dry);
        break;
    }
    return (note, time) => inst.triggerAttackRelease(note.n, note.d * spb, time, note.v);
  }

  const parts = LAYERS.map((layer) => {
    const gain = own(new T.Gain(SURFACE_MIX[surface][layer])).connect(master);
    gains[layer] = gain;
    // Effects precede the layer gain, so a muted layer also mutes its echoes.
    // Bass and percussion bypass the room to leave the low end defined.
    const room = own(new T.Reverb({ decay: 2.6, preDelay: 0.025, wet: 0.18 })).connect(gain);
    const voices = new Map<ThemeRole, PlayNote>();
    for (const note of spec[layer]) {
      if (!voices.has(note.role)) voices.set(note.role, createVoice(note.role, gain, room));
    }
    type TimedNote = ThemeNote & { time: number };
    const part = new T.Part<TimedNote>(
      (time, note) => voices.get(note.role)!(note, time),
      spec[layer].map((note) => ({ ...note, time: note.t * spb })),
    );
    part.loop = true;
    part.loopEnd = spec.beats * spb;
    return part;
  });

  // One absolute start keeps all three layers aligned, including after swaps.
  const start = T.getTransport().seconds + 0.1;
  parts.forEach((part) => part.start(start));

  return {
    mix(next: ThemeSurface, seconds: number) {
      for (const layer of LAYERS) gains[layer].gain.rampTo(SURFACE_MIX[next][layer], seconds);
    },
    fade(volume: number, seconds: number) {
      master.gain.rampTo(volume, seconds);
    },
    dispose() {
      parts.forEach((part) => { part.stop(); part.dispose(); });
      resources.reverse().forEach((node) => node.dispose());
    },
  };
}
