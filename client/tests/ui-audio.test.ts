import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tone = vi.hoisted(() => ({
  state: "running",
  time: 1,
  createSynth: vi.fn(),
  trigger: vi.fn(),
  voices: [] as { trigger: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn>; release: number }[],
}));

vi.mock("tone", () => {
  class AudioNode {
    gain = { rampTo: vi.fn() };
    connect() { return this; }
    toDestination() { return this; }
  }
  class PolySynth extends AudioNode {
    constructor(...args: unknown[]) {
      super();
      tone.createSynth(...args);
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
    Reverb: AudioNode,
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
