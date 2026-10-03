import type { ThemeNote, ThemeRole, ThemeSpec } from "./themes";
import { roleAudible, type MusicPartState } from "./music-parts";
import { BELL_VOICE } from "./voices";

type ToneModule = typeof import("tone");
export type ThemeSurface = "map" | "combat" | "narrative";
type ThemeLayer = "bed" | "down" | "up";

const LAYERS: ThemeLayer[] = ["bed", "down", "up"];
const SURFACE_MIX: Record<ThemeSurface, Record<ThemeLayer, number>> = {
  map: { bed: 0.9, down: 1, up: 0 },
  narrative: { bed: 0.65, down: 0.4, up: 0 },
  combat: { bed: 1, down: 0.25, up: 0.85 },
};

/** The written notes heard in a surface's arrangement. */
export function surfaceNotes(spec: ThemeSpec, surface: ThemeSurface): ThemeNote[] {
  return LAYERS.flatMap((layer) => SURFACE_MIX[surface][layer] > 0 ? spec[layer] : []);
}

interface Disposable { dispose(): unknown }
type PlayNote = (note: ThemeNote, time: number) => void;

/** A playing theme owns its voices and effect tails, including during a fade. */
export function createScore(
  T: ToneModule, spec: ThemeSpec, surface: ThemeSurface,
  output: import("tone").ToneAudioNode = T.getDestination(),
  startBeat = 0,
) {
  const resources: Disposable[] = [];
  const own = <N extends Disposable>(node: N): N => {
    resources.push(node);
    return node;
  };
  const spb = 60 / spec.bpm;
  const offset = startBeat % spec.beats;
  const heldNotes: ((time: number) => void)[] = [];
  const limiter = own(new T.Limiter(-2)).connect(output);
  const master = own(new T.Gain(0)).connect(limiter);
  const gains = {} as Record<ThemeLayer, import("tone").Gain>;
  const voiceGains: { role: ThemeRole; gain: import("tone").Gain }[] = [];

  function createVoice(role: ThemeRole, output: import("tone").Gain): PlayNote {
    if (role === "snare" || role === "hat") {
      const filter = own(new T.Filter({
        type: "highpass", frequency: role === "hat" ? 6500 : 1100, Q: 0.5,
      })).connect(output);
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
        })).connect(output).start();
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
        })).connect(output);
        inst = own(new T.PolySynth(T.FMSynth, {
          ...BELL_VOICE,
          volume: 4,
        })).connect(echo);
        break;
      }
      case "arp": {
        // A dotted-eighth echo answers the played notes, even though Transport
        // stays at its default BPM; score times and delays both use seconds.
        const echo = own(new T.PingPongDelay({
          delayTime: 0.75 * spb, feedback: 0.28, wet: 0.28, maxDelay: 2,
        })).connect(output);
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
        })).connect(output);
        break;
      case "kick":
        inst = own(new T.MembraneSynth({
          pitchDecay: 0.025, octaves: 2.5,
          envelope: { attack: 0.003, decay: 0.28, sustain: 0, release: 0.1 },
          volume: 2,
        })).connect(output);
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
      if (!voices.has(note.role)) {
        const dry = note.role === "bass" || note.role === "kick" || note.role === "snare" || note.role === "hat";
        const voiceGain = own(new T.Gain(1)).connect(dry ? gain : room);
        voiceGains.push({ role: note.role, gain: voiceGain });
        voices.set(note.role, createVoice(note.role, voiceGain));
      }
      if (note.t < offset && note.t + note.d > offset
        && note.role !== "kick" && note.role !== "snare" && note.role !== "hat") {
        heldNotes.push((time) => voices.get(note.role)!({ ...note, d: note.t + note.d - offset }, time));
      }
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
  const transport = T.getTransport();
  const start = transport.seconds + 0.1;
  parts.forEach((part) => part.start(start, offset * spb));
  // Part offsets skip earlier attacks; restore only notes still held here.
  const resume = heldNotes.length ? transport.scheduleOnce((time) => {
    heldNotes.forEach((play) => play(time));
  }, start) : null;

  return {
    beat(): number | null {
      // Transport.seconds includes lookahead; visuals follow the audio clock now.
      const elapsed = T.getTransport().getSecondsAtTime(T.immediate()) - start;
      return elapsed < 0 ? null : (offset + elapsed / spb) % spec.beats;
    },
    mix(next: ThemeSurface, seconds: number) {
      for (const layer of LAYERS) gains[layer].gain.rampTo(SURFACE_MIX[next][layer], seconds);
    },
    parts(state: MusicPartState) {
      for (const { role, gain } of voiceGains) gain.gain.rampTo(roleAudible(state, role) ? 1 : 0, 0.03);
    },
    fade(volume: number, seconds: number) {
      master.gain.rampTo(volume, seconds);
    },
    dispose() {
      if (resume !== null) transport.clear(resume);
      parts.forEach((part) => { part.stop(); part.dispose(); });
      resources.reverse().forEach((node) => node.dispose());
    },
  };
}
