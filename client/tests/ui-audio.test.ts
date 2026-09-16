import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tone = vi.hoisted(() => ({
  state: "running",
  time: 1,
  createSynth: vi.fn(),
  trigger: vi.fn(),
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
  return {
    start: vi.fn(async () => {}),
    getContext: () => ({ state: tone.state }),
    getDestination: () => ({ volume: { value: 0 } }),
    getTransport: () => ({ start: vi.fn() }),
    now: () => tone.time,
    Reverb: AudioNode,
    Gain: AudioNode,
    Synth: class {},
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
