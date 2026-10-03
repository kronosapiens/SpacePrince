import { expect, it, vi } from "vitest";
import { createScore } from "@/audio/score";
import type { ThemeNote, ThemeRole, ThemeSpec } from "@/audio/themes";

it("follows audible transport time relative to the score start and wraps at the loop", () => {
  let audioTime = 40;
  const transport = {
    seconds: 10.1, // Scheduling clock is 100ms ahead of audible time.
    getSecondsAtTime: vi.fn((time: number) => time - 30),
  };
  class AudioNode {
    connect() { return this; }
    dispose() {}
  }
  const starts: number[] = [];
  const tone = {
    immediate: () => audioTime,
    getTransport: () => transport,
    getDestination: () => new AudioNode(),
    Gain: AudioNode,
    Limiter: AudioNode,
    Reverb: AudioNode,
    Part: class {
      start(time: number) { starts.push(time); }
      stop() {}
      dispose() {}
    },
  } as unknown as typeof import("tone");
  const score = createScore(tone, { bpm: 120, beats: 16, bed: [], down: [], up: [] }, "map");
  expect(starts).toEqual([10.2, 10.2, 10.2]);
  expect(score.beat()).toBeNull();

  audioTime = 40.7;
  expect(score.beat()).toBeCloseTo(1);
  expect(transport.getSecondsAtTime).toHaveBeenLastCalledWith(40.7);
  audioTime = 48.7;
  expect(score.beat()).toBeCloseTo(1);
  score.dispose();
});

it("starts at the seek offset and restores held pitched notes for their remaining durations", () => {
  let audioTime = 40;
  let resume: (time: number) => void = () => {};
  const attacks = vi.fn();
  const transport = {
    seconds: 10.1,
    getSecondsAtTime: (time: number) => time - 30,
    scheduleOnce: vi.fn((callback: (time: number) => void) => { resume = callback; return 7; }),
    clear: vi.fn(),
  };
  class AudioNode {
    connect() { return this; }
    start() { return this; }
    triggerAttackRelease = attacks;
    dispose() {}
  }
  const starts: [number, number][] = [];
  const tone = {
    immediate: () => audioTime,
    getTransport: () => transport,
    getDestination: () => new AudioNode(),
    Gain: AudioNode, Limiter: AudioNode, Reverb: AudioNode, Filter: AudioNode,
    Chorus: AudioNode, PolySynth: AudioNode, MonoSynth: AudioNode,
    FeedbackDelay: AudioNode, PingPongDelay: AudioNode, MembraneSynth: AudioNode,
    Part: class {
      start(time: number, offset: number) { starts.push([time, offset]); }
      stop() {}
      dispose() {}
    },
  } as unknown as typeof import("tone");
  const spec: ThemeSpec = {
    bpm: 120, beats: 16,
    bed: [
      { t: 0, d: 8, n: "C3", role: "pad", v: 0.4 },
      { t: 2, d: 5, n: "C2", role: "bass", v: 0.5 },
      { t: 3, d: 3, n: "E4", role: "lead", v: 0.6 },
      { t: 3.5, d: 1, n: "G5", role: "arp", v: 0.3 },
      { t: 3.5, d: 1, n: "D2", role: "kick", v: 0.5 },
      { t: 0, d: 1, n: "F4", role: "lead", v: 0.4 },
      { t: 4, d: 1, n: "A4", role: "lead", v: 0.4 },
    ], down: [], up: [],
  };
  const score = createScore(tone, spec, "map", tone.getDestination(), 4);
  expect(starts).toEqual([[10.2, 2], [10.2, 2], [10.2, 2]]);
  expect(score.beat()).toBeNull();
  expect(transport.scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 10.2);
  resume(40.2);
  expect(attacks.mock.calls).toEqual([
    ["C3", 2, 40.2, 0.4], ["C2", 1.5, 40.2, 0.5],
    ["E4", 1, 40.2, 0.6], ["G5", 0.25, 40.2, 0.3],
  ]);
  audioTime = 40.7;
  expect(score.beat()).toBeCloseTo(5);
  audioTime = 46.7;
  expect(score.beat()).toBeCloseTo(1);
  score.dispose();
  expect(transport.clear).toHaveBeenCalledWith(7);
});

it("mutes role gains after their effects without restarting the score", () => {
  let played: AudioNode;
  class AudioNode {
    next: AudioNode | null = null;
    gain = { rampTo: vi.fn() };
    constructor(readonly kind: string) {}
    connect(next: AudioNode) { this.next = next; return this; }
    start() { return this; }
    triggerAttackRelease() { played = this; }
    dispose() {}
  }
  const node = (kind: string) => class extends AudioNode {
    constructor() { super(kind); }
  };
  const parts: { play: (time: number, note: ThemeNote) => void; notes: ThemeNote[] }[] = [];
  const start = vi.fn();
  const tone = {
    immediate: () => 40.7,
    getTransport: () => ({ seconds: 10.1, getSecondsAtTime: (time: number) => time - 30 }),
    getDestination: () => new AudioNode("output"),
    Gain: node("gain"), Limiter: node("limiter"), Reverb: node("room"), Filter: node("filter"),
    Chorus: node("chorus"), PolySynth: node("poly"), MonoSynth: node("mono"),
    FeedbackDelay: node("echo"), PingPongDelay: node("echo"),
    MembraneSynth: node("kick"), NoiseSynth: node("noise"),
    Part: class {
      constructor(play: (time: number, note: ThemeNote) => void, notes: ThemeNote[]) { parts.push({ play, notes }); }
      start = start;
      stop() {}
      dispose() {}
    },
  } as unknown as typeof import("tone");
  const roles: ThemeRole[] = ["lead", "bass", "pad", "arp", "kick", "snare", "hat"];
  const notes = roles.map((role): ThemeNote => ({ role, t: 0, d: 1, n: "D4", v: 0.4 }));
  const score = createScore(tone, { bpm: 120, beats: 16, bed: notes, down: [notes[0]!], up: [] }, "map");
  const gains: { role: ThemeRole; node: AudioNode }[] = [];
  for (const part of parts) {
    for (const note of part.notes) {
      part.play(0, note);
      let output = played!;
      while (output.kind !== "gain") output = output.next!;
      gains.push({ role: note.role, node: output });
      const dry = ["bass", "kick", "snare", "hat"].includes(note.role);
      expect(output.next!.kind).toBe(dry ? "gain" : "room");
    }
  }
  score.parts({ muted: ["bass", "pads"] });
  for (const { role, node } of gains) {
    expect(node.gain.rampTo).toHaveBeenLastCalledWith(role === "bass" || role === "pad" ? 0 : 1, 0.03);
  }
  score.parts({ muted: ["rhythm"] });
  for (const { role, node } of gains) {
    expect(node.gain.rampTo).toHaveBeenLastCalledWith(["kick", "snare", "hat"].includes(role) ? 0 : 1, 0.03);
  }
  expect(start).toHaveBeenCalledTimes(3);
  expect(score.beat()).toBeCloseTo(1);
  score.dispose();
});
