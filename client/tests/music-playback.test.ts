import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEMES } from "@/audio/themes";

const createScore = vi.hoisted(() => vi.fn(() => ({
  mix: vi.fn(), parts: vi.fn(), fade: vi.fn(), dispose: vi.fn(), beat: vi.fn<() => number | null>(() => 12.5),
})));
const gains = vi.hoisted(() => [] as { gain: { rampTo: ReturnType<typeof vi.fn> } }[]);
const clock = vi.hoisted(() => ({ context: "running", transport: "started" }));

vi.mock("@/audio/score", () => ({ createScore }));
vi.mock("tone", () => ({
  start: vi.fn(async () => {}),
  getContext: () => ({ state: clock.context, lookAhead: 0.1 }),
  getDestination: () => ({ volume: { value: 0 } }),
  getTransport: () => ({ start: vi.fn(), state: clock.transport }),
  Gain: class {
    gain = { rampTo: vi.fn() };
    constructor() { gains.push(this); }
    toDestination() { return this; }
  },
  Reverb: class { connect() { return this; } },
}));

let engine: typeof import("@/audio/engine");

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  gains.length = 0;
  clock.context = "running";
  clock.transport = "started";
  vi.useFakeTimers();
  localStorage.clear();
  engine = await import("@/audio/engine");
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  localStorage.clear();
});

describe("music playback", () => {
  it("reports the selected score's position only while that score can be heard", async () => {
    engine.setTheme("Main");
    expect(engine.themeBeat("Main")).toBeNull();
    await engine.ensureAudio();
    const main = createScore.mock.results[0]!.value;
    main.beat.mockReturnValueOnce(null); // Scheduled, but not yet started.
    expect(engine.themeBeat("Main")).toBeNull();
    expect(engine.themeBeat("Main")).toBe(12.5);

    engine.setTheme("Moon");
    expect(engine.themeBeat("Moon")).toBeNull();
    expect(engine.themeBeat("Main")).toBeNull();
    vi.runAllTimers();
    expect(engine.themeBeat("Moon")).toBe(12.5);

    engine.setMusicVolume(0);
    expect(engine.themeBeat("Moon")).toBeNull();
    engine.setMusicVolume(0.5);
    expect(engine.themeBeat("Moon")).toBe(12.5);
    clock.context = "suspended";
    expect(engine.themeBeat("Moon")).toBeNull();
    clock.context = "running";
    clock.transport = "stopped";
    expect(engine.themeBeat("Moon")).toBeNull();
    clock.transport = "started";
    engine.setTheme(null);
    expect(engine.themeBeat("Moon")).toBeNull();
  });

  it("starts Main after audio unlock, carries it into creation, then hands off to a planet", async () => {
    engine.setTheme("Main");
    engine.setMusicVolume(1);
    expect(createScore).not.toHaveBeenCalled();
    await engine.ensureAudio();
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Main, "map", gains[0], undefined);
    const main = createScore.mock.results[0]!.value;

    engine.setTheme("Main");
    expect(createScore).toHaveBeenCalledTimes(1);
    expect(main.dispose).not.toHaveBeenCalled();

    engine.setTheme("Moon", "map");
    expect(main.fade).toHaveBeenLastCalledWith(0, expect.any(Number));
    vi.runAllTimers();
    expect(main.dispose).toHaveBeenCalledOnce();
    expect(createScore).toHaveBeenCalledTimes(2);
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Moon, "map", gains[0], undefined);
  });

  it("keeps the phrase running when the mix or volume changes", async () => {
    await engine.ensureAudio();
    engine.setTheme("Mercury", "map");
    engine.setMusicVolume(1);
    const score = createScore.mock.results[0]!.value;

    engine.setTheme("Mercury", "combat");
    expect(score.mix).toHaveBeenLastCalledWith("combat", expect.any(Number));
    engine.setTheme("Mercury", "narrative");
    expect(score.mix).toHaveBeenLastCalledWith("narrative", expect.any(Number));
    engine.setMusicVolume(0.4);
    engine.setSoundVolume(0.7);
    expect(gains[0]!.gain.rampTo).toHaveBeenLastCalledWith(0.4, expect.any(Number));
    expect(gains[1]!.gain.rampTo).toHaveBeenLastCalledWith(0.7, expect.any(Number));
    expect(createScore).toHaveBeenCalledTimes(1);
    expect(score.dispose).not.toHaveBeenCalled();
  });

  it("fades out the old planet and plays the latest selection", async () => {
    await engine.ensureAudio();
    engine.setTheme("Moon");
    engine.setMusicVolume(1);
    const moon = createScore.mock.results[0]!.value;

    engine.setTheme("Mars");
    vi.advanceTimersByTime(400);
    engine.setTheme("Venus", "combat");
    expect(moon.fade).toHaveBeenLastCalledWith(0, expect.any(Number));
    expect(createScore).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    engine.setMusicVolume(0.3);
    vi.advanceTimersByTime(200);

    expect(moon.dispose).toHaveBeenCalledOnce();
    expect(createScore).toHaveBeenCalledTimes(2);
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Venus, "combat", gains[0], undefined);
    expect(engine.currentTheme()).toBe("Venus");
  });

  it("plays music and sound for a fresh visitor", () => {
    expect(engine.getMusicVolume()).toBe(0.5);
    expect(engine.getSoundVolume()).toBe(1);
  });

  it("changes parts without resetting time and retains the choices through seeking and theme changes", async () => {
    engine.setTheme("Main");
    await engine.ensureAudio();
    const original = createScore.mock.results[0]!.value;
    engine.toggleMusicPart("bass");
    engine.toggleMusicPart("pads");
    expect(engine.getMusicParts()).toEqual({ muted: ["bass", "pads"] });
    expect(original.parts).toHaveBeenLastCalledWith(engine.getMusicParts());
    expect(engine.themeBeat("Main")).toBe(12.5);
    expect(createScore).toHaveBeenCalledTimes(1);
    engine.toggleMusicPart("bass");
    expect(engine.getMusicParts()).toEqual({ muted: ["pads"] });

    engine.seekTheme("Main", 40);
    vi.runAllTimers();
    const sought = createScore.mock.results[1]!.value;
    expect(sought.parts).toHaveBeenCalledWith(engine.getMusicParts());
    expect(sought.parts.mock.invocationCallOrder[0]).toBeLessThan(sought.fade.mock.invocationCallOrder[0]!);
    engine.setTheme("Moon");
    vi.runAllTimers();
    expect(engine.getMusicParts()).toEqual({ muted: ["pads"] });
    expect(createScore.mock.results[2]!.value.parts).toHaveBeenCalledWith(engine.getMusicParts());
    engine.setMusicVolume(0);
    vi.runAllTimers();
    engine.setMusicVolume(0.5);
    expect(createScore.mock.results[3]!.value.parts).toHaveBeenCalledWith(engine.getMusicParts());

    engine.resetMusicParts();
    expect(engine.getMusicParts()).toEqual({ muted: [] });
    expect(createScore.mock.results[3]!.value.parts).toHaveBeenLastCalledWith({ muted: [] });
  });

  it("seeks to the latest requested position while preserving the selected mix", async () => {
    engine.setTheme("Main");
    engine.seekTheme("Main", 20);
    expect(createScore).not.toHaveBeenCalled();
    await engine.ensureAudio();
    engine.seekTheme("Main", 20);
    expect(engine.themeBeat("Main")).toBe(20);
    vi.advanceTimersByTime(50);
    engine.seekTheme("Main", 40);
    vi.runAllTimers();
    expect(createScore).toHaveBeenCalledTimes(2);
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Main, "map", gains[0], 40);
    const resumed = createScore.mock.results[1]!.value;
    resumed.beat.mockReturnValueOnce(null);
    expect(engine.themeBeat("Main")).toBe(40);
    expect(engine.themeBeat("Main")).toBe(12.5);

    engine.seekTheme("Main", 60);
    engine.setTheme("Moon");
    engine.seekTheme("Moon", 80);
    vi.runAllTimers();
    expect(createScore).toHaveBeenCalledTimes(3);
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Moon, "map", gains[0], undefined);
    engine.seekTheme("Moon", 20);
    engine.setMusicVolume(0);
    engine.seekTheme("Moon", 40);
    vi.runAllTimers();
    expect(createScore).toHaveBeenCalledTimes(3);
    expect(engine.themeBeat("Moon")).toBeNull();
  });

  it.each(["stop", "mute"])("finishes the old score before starting another after a quick %s and restart", async (action) => {
    await engine.ensureAudio();
    engine.setTheme("Moon");
    const old = createScore.mock.results[0]!.value;

    engine.setTheme("Saturn");
    if (action === "mute") {
      engine.setMusicVolume(0);
      engine.setMusicVolume(1);
    } else {
      engine.setTheme(null);
      engine.setTheme("Saturn");
    }
    expect(createScore).toHaveBeenCalledTimes(1);
    vi.runAllTimers();

    const resumed = createScore.mock.results[1]!.value;
    expect(createScore).toHaveBeenCalledTimes(2);
    expect(old.dispose).toHaveBeenCalledOnce();
    expect(old.dispose.mock.invocationCallOrder[0]).toBeLessThan(createScore.mock.invocationCallOrder[1]!);
    expect(resumed.dispose).not.toHaveBeenCalled();
    expect(engine.currentTheme()).toBe("Saturn");
  });

  it("restores saved levels and reads the previous checkbox settings", async () => {
    localStorage.setItem("sp:audio:v1", JSON.stringify({ music: true, sound: false }));
    vi.resetModules();
    engine = await import("@/audio/engine");
    expect(engine.getMusicVolume()).toBe(0.5);
    expect(engine.getSoundVolume()).toBe(0);

    engine.setMusicVolume(0.35);
    engine.setSoundVolume(0.8);
    vi.resetModules();
    engine = await import("@/audio/engine");
    expect(engine.getMusicVolume()).toBe(0.35);
    expect(engine.getSoundVolume()).toBe(0.8);
  });
});
