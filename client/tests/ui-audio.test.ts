import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tone = vi.hoisted(() => ({
  state: "running",
  time: 1,
  createSynth: vi.fn(),
  trigger: vi.fn(),
  voices: [] as { trigger: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn>; release: number }[],
  previewVoices: [] as { dispose: ReturnType<typeof vi.fn> }[],
  reverbs: [] as { dispose: ReturnType<typeof vi.fn> }[],
  reverbReady: Promise.resolve(),
}));

vi.mock("tone", () => {
  class AudioNode {
    gain = { rampTo: vi.fn() };
    dispose = vi.fn();
    connect() { return this; }
    toDestination() { return this; }
  }
  class PolySynth extends AudioNode {
    constructor(...args: unknown[]) {
      super();
      tone.createSynth(...args);
      tone.previewVoices.push(this);
    }
    triggerAttackRelease = tone.trigger;
  }
  class Synth extends AudioNode {
    triggerAttackRelease = vi.fn();
    dispose = vi.fn();
    constructor(options: { envelope: { release: number } }) {
      super();
      tone.voices.push({ trigger: this.triggerAttackRelease, dispose: this.dispose, release: options.envelope.release });
    }
  }
  return {
    start: vi.fn(async () => {}),
    getContext: () => ({ state: tone.state }),
    getDestination: () => ({ volume: { value: 0 } }),
    getTransport: () => ({ start: vi.fn() }),
    now: () => tone.time,
    immediate: () => tone.time - 0.1,
    Reverb: class extends AudioNode {
      ready = tone.reverbReady;
      constructor() { super(); tone.reverbs.push(this); }
    },
    Gain: AudioNode,
    Synth,
    FMSynth: class extends Synth {},
    PolySynth,
  };
});

let engine: typeof import("@/audio/engine");

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  localStorage.clear();
  tone.state = "running";
  tone.time = 1;
  tone.voices = [];
  tone.previewVoices = [];
  tone.reverbs = [];
  tone.reverbReady = Promise.resolve();
  engine = await import("@/audio/engine");
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  localStorage.clear();
});

describe("UI audio", () => {
  it("drops feedback before unlock and while suspended without replaying it later", async () => {
    engine.playUISound("hover");
    await engine.ensureAudio();
    expect(tone.createSynth).not.toHaveBeenCalled();
    expect(tone.trigger).not.toHaveBeenCalled();

    tone.state = "suspended";
    engine.playUISound("hover");
    engine.playUISound("commit");
    expect(tone.createSynth).not.toHaveBeenCalled();

    tone.state = "running";
    engine.playUISound("hover");
    expect(tone.trigger).toHaveBeenCalledTimes(1);
  });

  it("uses the sound setting independently of music", async () => {
    await engine.ensureAudio();
    engine.setMusicVolume(0);
    engine.playUISound("select");
    expect(tone.trigger).toHaveBeenCalledTimes(1);

    engine.setSoundVolume(0);
    engine.setMusicVolume(1);
    engine.playUISound("commit");
    expect(tone.trigger).toHaveBeenCalledTimes(1);

    engine.setSoundVolume(1);
    engine.playUISound("commit");
    expect(tone.trigger).toHaveBeenCalledTimes(2);
  });

  it("limits hover ticks without swallowing selection, commitment, or dismissal", async () => {
    await engine.ensureAudio();
    engine.playUISound("hover");
    tone.time += 0.02;
    engine.playUISound("hover");
    expect(tone.trigger).toHaveBeenCalledTimes(1);

    engine.playUISound("select");
    engine.playUISound("commit");
    engine.playUISound("dismiss");
    expect(tone.trigger).toHaveBeenCalledTimes(4);

    tone.time += 0.1;
    engine.playUISound("hover");
    expect(tone.trigger).toHaveBeenCalledTimes(5);
    expect(tone.createSynth).toHaveBeenCalledTimes(1);
  });

  it("avoids an extra hover tick when a clicked control is replaced under the pointer", async () => {
    await engine.ensureAudio();
    engine.playUISound("commit");
    tone.time += 0.02;
    engine.playUISound("hover");
    expect(tone.trigger).toHaveBeenCalledTimes(1);
    tone.time += 0.1;
    engine.playUISound("hover");
    expect(tone.trigger).toHaveBeenCalledTimes(2);
  });
});

describe("necessity audio", () => {
  it("uses the ruler mode and target register with release inside the duration", async () => {
    const { strikeMidi } = await import("@/audio/pitches");
    const { PLANETS } = await import("@/game/data");
    await engine.ensureAudio();
    engine.setMusicVolume(0);
    for (const planet of PLANETS) {
      engine.playNecessityNote("Saturn", planet, 0.95);
      const voice = tone.voices[tone.voices.length - 1]!;
      expect(voice.trigger).toHaveBeenCalledExactlyOnceWith(
        440 * 2 ** ((strikeMidi("Saturn", planet) - 69) / 12),
        0.95 - voice.release, 0.9, 0.24,
      );
      vi.advanceTimersByTime(949);
      expect(voice.dispose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(voice.dispose).toHaveBeenCalledOnce();
    }
  });

  it("cancels only its own voice and clears scheduled disposal", async () => {
    await engine.ensureAudio();
    engine.playStrike("Sun", "Mars");
    const cancel = engine.playNecessityNote("Sun", "Moon", 0.95);
    const first = tone.voices[0]!;
    engine.playNecessityNote("Sun", "Venus", 0.95);
    const second = tone.voices[1]!;
    cancel();
    cancel();
    expect(first.dispose).toHaveBeenCalledOnce();
    expect(second.dispose).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    engine.playStrike("Sun", "Mars");
    expect(tone.createSynth).toHaveBeenCalledOnce();
    expect(tone.trigger).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(950);
    expect(first.dispose).toHaveBeenCalledOnce();
    expect(second.dispose).toHaveBeenCalledOnce();
  });

  it("returns safe cancellation without queuing muted, locked, or suspended notes", async () => {
    engine.playNecessityNote("Sun", "Moon", 0.95)();
    await engine.ensureAudio();
    tone.state = "suspended";
    engine.playNecessityNote("Sun", "Moon", 0.95)();
    tone.state = "running";
    engine.setSoundVolume(0);
    engine.playNecessityNote("Sun", "Moon", 0.95)();
    engine.setSoundVolume(1);
    vi.runAllTimers();
    expect(tone.voices).toHaveLength(0);
  });
});

describe("propagation preview audio", () => {
  it("schedules the phrase at encounter levels, aligns highlights, and disposes its private effects", async () => {
    await engine.ensureAudio();
    const onNote = vi.fn();
    const onEnd = vi.fn();
    engine.playPropagationPreview([{ planet: "Sun", midi: 74, at: 0.2 }, { planet: "Saturn", midi: 81, at: 1.03 }], onNote, onEnd);
    await Promise.resolve();
    expect(tone.createSynth.mock.calls[0]![1].envelope.sustain).toBe(0);
    expect(tone.trigger).toHaveBeenNthCalledWith(1, 440 * 2 ** ((74 - 69) / 12), 0.35, 1.2, 0.24);
    expect(tone.trigger.mock.calls[1]).toEqual([880, 0.35, expect.closeTo(2.03), 0.24]);
    vi.advanceTimersByTime(299);
    expect(onNote).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onNote).toHaveBeenLastCalledWith(0);
    vi.advanceTimersByTime(830);
    expect(onNote).toHaveBeenLastCalledWith(1);
    vi.runAllTimers();
    expect(onNote).toHaveBeenLastCalledWith(null);
    expect(onEnd).toHaveBeenCalledOnce();
    expect(tone.previewVoices[0]!.dispose).toHaveBeenCalledOnce();
    expect(tone.reverbs[1]!.dispose).toHaveBeenCalledOnce();
    expect(tone.reverbs[0]!.dispose).not.toHaveBeenCalled();
  });

  it("holds all seven plucks at a restrained sustain and releases them together", async () => {
    const { propagationPhrase } = await import("@/audio/propagation-phrases");
    const { PLANETS } = await import("@/game/data");
    const { PLANET_VOICE } = await import("@/audio/voices");
    await engine.ensureAudio();
    const notes = propagationPhrase("Sun", "Sun", PLANETS, "Thirds");
    const onNote = vi.fn();
    const onEnd = vi.fn();
    engine.playPropagationPreview(notes, onNote, onEnd, true);
    await Promise.resolve();
    expect(tone.createSynth.mock.calls[0]![1]).toEqual({
      ...PLANET_VOICE,
      envelope: { ...PLANET_VOICE.envelope, sustain: 0.2 },
      volume: -10,
    });
    expect(tone.trigger).toHaveBeenCalledTimes(7);
    for (const [index, note] of notes.entries()) {
      const [frequency, duration, start, velocity] = tone.trigger.mock.calls[index]!;
      expect(frequency).toBe(440 * 2 ** ((note.midi - 69) / 12));
      expect(start).toBeCloseTo(1 + note.at);
      expect(start + duration).toBeCloseTo(1 + notes.at(-1)!.at + 0.8);
      expect(velocity).toBe(0.24);
    }
    const releaseMs = (0.1 + notes.at(-1)!.at + 0.8) * 1000;
    vi.advanceTimersByTime(releaseMs - 10);
    expect(onNote).toHaveBeenLastCalledWith(6);
    vi.advanceTimersByTime(20);
    expect(onNote).toHaveBeenLastCalledWith(null);
    expect(onEnd).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onEnd).toHaveBeenCalledOnce();
    expect(tone.previewVoices[0]!.dispose).toHaveBeenCalledOnce();
    engine.playStrike("Sun", "Moon");
    expect(tone.createSynth.mock.calls[1]![1].envelope.sustain).toBe(0);
  });

  it("cancels pending reverb readiness and scheduled playback without touching encounter audio", async () => {
    await engine.ensureAudio();
    engine.playStrike("Sun", "Moon");
    const onNote = vi.fn();
    const onEnd = vi.fn();
    let ready!: () => void;
    tone.reverbReady = new Promise<void>((resolve) => { ready = resolve; });
    const notes = [{ planet: "Sun" as const, midi: 74, at: 0.2 }];
    const pending = engine.playPropagationPreview(notes, onNote, onEnd, true);
    pending();
    ready();
    await Promise.resolve();
    expect(tone.trigger).toHaveBeenCalledTimes(1);

    const cancel = engine.playPropagationPreview(notes, onNote, onEnd, true);
    await Promise.resolve();
    expect(tone.trigger).toHaveBeenCalledTimes(2);
    cancel();
    cancel();
    vi.runAllTimers();
    expect(onNote).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    expect(tone.previewVoices[0]!.dispose).not.toHaveBeenCalled();
    expect(tone.previewVoices[1]!.dispose).toHaveBeenCalledOnce();
    expect(tone.previewVoices[2]!.dispose).toHaveBeenCalledOnce();
    expect(tone.reverbs[0]!.dispose).not.toHaveBeenCalled();
  });
});
