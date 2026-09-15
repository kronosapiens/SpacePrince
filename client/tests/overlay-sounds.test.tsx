import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideOverlay } from "@/components/GuideOverlay";
import { InfoCard } from "@/components/InfoCard";
import { DevChrome } from "@/components/DevChrome";
import { DevConsole } from "@/components/DevConsole";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { playUISound, setMusicVolume, setSoundVolume, nextTheme } from "@/audio/engine";

vi.mock("@/components/ChartTuner", () => ({ ChartTuner: () => null }));
vi.mock("@/audio/engine", () => ({
  playUISound: vi.fn(),
  currentTheme: () => "Moon",
  subscribeTheme: () => () => {},
  getMusicVolume: () => 1,
  getSoundVolume: () => 1,
  setMusicVolume: vi.fn(),
  setSoundVolume: vi.fn(),
  nextTheme: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
let frames: Map<number, FrameRequestCallback>;
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  frames = new Map();
  let frameId = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function get(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
const click = (selector: string) => act(() => get(selector).click());
const cues = () => vi.mocked(playUISound).mock.calls.map(([cue]) => cue);
const key = (value: string, repeat = false) => act(() => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: value, repeat, bubbles: true }));
});
const flushFrames = () => act(() => {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(0));
});

function Guide() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"first" | "second">("first");
  return <GuideOverlay open={open} phase={phase} phases={["first", "second"]}
    phaseLabel={{ first: "First", second: "Second" }} notes={[]}
    openLabel="Open guide" closeLabel="Close guide"
    onOpen={() => setOpen(true)} onClose={() => setOpen(false)} onPhaseChange={setPhase} />;
}

describe("overlay feedback", () => {
  it("sounds guide steps once and keeps disabled back and returned focus quiet", () => {
    act(() => root.render(<Guide />));
    expect(cues()).toEqual([]);
    click('[aria-label="Open guide"]');
    click(".guide-step:not(.is-primary)");
    expect(cues()).toEqual(["select"]);
    click(".guide-step.is-primary");
    click(".guide-step:not(.is-primary)");
    click(".guide-overlay");
    click(".guide-step.is-primary");
    expect(cues()).toEqual(["select", "select", "dismiss", "select", "dismiss"]);

    const trigger = get('[aria-label="Open guide"]');
    vi.spyOn(trigger, "matches").mockReturnValue(true);
    flushFrames();
    expect(document.activeElement).toBe(trigger);
    expect(cues()).toEqual(["select", "select", "dismiss", "select", "dismiss"]);
  });

  it("dismisses guides with Escape and ignores held Escape", () => {
    act(() => root.render(<Guide />));
    click('[aria-label="Open guide"]');
    key("Escape", true);
    expect(get('[role="dialog"]')).toBeDefined();
    expect(cues()).toEqual(["select"]);
    key("Escape");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(cues()).toEqual(["select", "dismiss"]);
  });

  it("keeps card appearance and content silent, then dismisses once by each exit", () => {
    const close = vi.fn();
    act(() => root.render(<InfoCard ariaLabel="Planet" onClose={close}><p>Details</p></InfoCard>));
    click(".info-card-stage p");
    key("Escape", true);
    expect(cues()).toEqual([]);
    click(".info-card-close");
    click(".info-card-overlay");
    key("Escape");
    expect(cues()).toEqual(["dismiss", "dismiss", "dismiss"]);
    expect(close).toHaveBeenCalledTimes(3);
  });
});

describe("developer feedback", () => {
  it("uses the same cues for shortcuts and buttons, leaving unavailable or repeated shortcuts silent", () => {
    act(() => root.render(<MemoryRouter><PrinceStoreProvider><DevChrome /></PrinceStoreProvider></MemoryRouter>));
    key("r");
    key("Escape");
    key("p", true);
    expect(cues()).toEqual([]);
    key("p");
    expect(get(".dev-pages")).toBeDefined();
    key("1");
    expect(document.querySelector(".dev-pages")).toBeNull();
    expect(cues()).toEqual(["select"]);
    key("p");
    key("Escape");
    click(".dev-keys button:first-child");
    key("d");
    key("g");
    expect(cues()).toEqual(["select", "select", "dismiss", "select", "dismiss", "select"]);
  });

  it("adjusts audio levels with sliders and disables track changes at zero music volume", () => {
    act(() => root.render(<PrinceStoreProvider><DevConsole open /></PrinceStoreProvider>));
    const adjust = (label: string, value: number) => act(() => {
      const input = get(`input[aria-label="${label} volume"]`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    adjust("Sound", 35);
    expect(setSoundVolume).toHaveBeenLastCalledWith(0.35);
    adjust("Music", 60);
    expect(setMusicVolume).toHaveBeenLastCalledWith(0.6);
    expect(get(".dev-console").textContent).toContain("Music 60%");
    adjust("Music", 0);
    click(".dev-console > .dev-chrome-button");
    expect(nextTheme).not.toHaveBeenCalled();
    expect(cues()).toEqual([]);
    adjust("Music", 20);
    click(".dev-console > .dev-chrome-button");
    expect(nextTheme).toHaveBeenCalledOnce();
  });
});
