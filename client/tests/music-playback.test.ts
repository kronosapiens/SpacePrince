import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEMES } from "@/audio/themes";

const createScore = vi.hoisted(() => vi.fn(() => ({
  mix: vi.fn(), fade: vi.fn(), dispose: vi.fn(),
})));
const gains = vi.hoisted(() => [] as { gain: { rampTo: ReturnType<typeof vi.fn> } }[]);

vi.mock("@/audio/score", () => ({ createScore }));
vi.mock("tone", () => ({
  start: vi.fn(async () => {}),
  getContext: () => ({ state: "running" }),
  getDestination: () => ({ volume: { value: 0 } }),
  getTransport: () => ({ start: vi.fn() }),
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
  it("starts Main after audio unlock, carries it into creation, then hands off to a planet", async () => {
    engine.setTheme("Main");
    engine.setMusicVolume(1);
    expect(createScore).not.toHaveBeenCalled();
    await engine.ensureAudio();
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Main, "map", gains[0]);
    const main = createScore.mock.results[0]!.value;

    engine.setTheme("Main");
    expect(createScore).toHaveBeenCalledTimes(1);
    expect(main.dispose).not.toHaveBeenCalled();

    engine.setTheme("Moon", "map");
    expect(main.fade).toHaveBeenLastCalledWith(0, expect.any(Number));
    vi.runAllTimers();
    expect(main.dispose).toHaveBeenCalledOnce();
    expect(createScore).toHaveBeenCalledTimes(2);
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Moon, "map", gains[0]);
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
    expect(createScore).toHaveBeenLastCalledWith(expect.anything(), THEMES.Venus, "combat", gains[0]);
    expect(engine.currentTheme()).toBe("Venus");
  });

  it("cancels a pending planet swap on mute and disposes only the old score after a quick restart", async () => {
    await engine.ensureAudio();
    engine.setTheme("Moon");
    expect(createScore).not.toHaveBeenCalled();
    engine.setMusicVolume(1);
    const old = createScore.mock.results[0]!.value;

    engine.setTheme("Saturn");
    engine.setMusicVolume(0);
    engine.setMusicVolume(1);
    const resumed = createScore.mock.results[1]!.value;
    vi.runAllTimers();

    expect(createScore).toHaveBeenCalledTimes(2);
    expect(old.dispose).toHaveBeenCalledOnce();
    expect(resumed.dispose).not.toHaveBeenCalled();
    expect(engine.currentTheme()).toBe("Saturn");
  });

  it("restores saved levels and reads the previous checkbox settings", async () => {
    localStorage.setItem("sp:audio:v1", JSON.stringify({ music: true, sound: false }));
    vi.resetModules();
    engine = await import("@/audio/engine");
    expect(engine.getMusicVolume()).toBe(1);
    expect(engine.getSoundVolume()).toBe(0);

    engine.setMusicVolume(0.35);
    engine.setSoundVolume(0.8);
    vi.resetModules();
    engine = await import("@/audio/engine");
    expect(engine.getMusicVolume()).toBe(0.35);
    expect(engine.getSoundVolume()).toBe(0.8);
  });
});
