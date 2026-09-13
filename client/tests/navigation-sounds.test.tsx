import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CityPicker } from "@/components/CityPicker";
import { TitleScreen } from "@/screens/TitleScreen";
import { StartScreen } from "@/screens/StartScreen";
import { EndOfRunScreen } from "@/screens/EndOfRunScreen";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { playUISound } from "@/audio/engine";
import { beginRun } from "@/game/run";
import { createStubPrince } from "./fixtures";

vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playUISound: vi.fn() }));
vi.mock("@/components/Chart", () => ({ Chart: () => null }));
vi.mock("@/components/PlanetBands", () => ({ PlanetBands: () => null }));
vi.mock("@/components/MapDiagram", () => ({ MapDiagram: () => null }));
vi.mock("@/assets/cities.json", () => ({ default: [
  ["New York", "NY", "US", 40.7, -74, 8000000, "America/New_York"],
  ["Newcastle", "England", "GB", 55, -1.6, 300000, "Europe/London"],
] }));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function render(screen: ReactNode) {
  act(() => root.render(<MemoryRouter><PrinceStoreProvider>{screen}</PrinceStoreProvider></MemoryRouter>));
}

function get(selector: string) {
  const element = container.querySelector(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

const click = (selector: string) => act(() => get(selector).dispatchEvent(new MouseEvent("click", { bubbles: true })));
const cues = () => vi.mocked(playUISound).mock.calls.map(([cue]) => cue);
function hover(selector: string, pointerType = "mouse") {
  act(() => {
    const event = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    get(selector).dispatchEvent(event);
  });
}

function type(selector: string, value: string) {
  act(() => {
    const input = get(selector) as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function key(value: string) {
  act(() => get(".city-input").dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true })));
}

describe("navigation feedback", () => {
  it("ticks on Begin hover and sounds navigation once during the title fade", () => {
    render(<TitleScreen />);
    hover(".begin-btn", "touch");
    hover(".begin-btn");
    click(".begin-btn");
    click(".begin-btn");
    expect(cues()).toEqual(["hover", "select"]);
    expect(loadPrince()).toBeNull();
  });

  it("uses a commitment cue when Begin creates a run for an existing Prince", () => {
    savePrince(createStubPrince());
    render(<TitleScreen />);
    click(".begin-btn");
    click(".begin-btn");
    expect(cues()).toEqual(["commit"]);
    expect(loadPrince()!.runs).toHaveLength(1);
  });

  it("keeps invalid casts silent and distinguishes the framing step from casting and starting", () => {
    render(<StartScreen />);
    click(".begin-btn");
    click(".begin-btn");
    act(() => vi.advanceTimersByTime(400));
    click(".mint-submit");
    expect(cues()).toEqual(["select"]);

    click(".city-compass");
    type('[placeholder="Lat"]', "4070");
    type('[placeholder="Lon"]', "-7400");
    expect(cues()).toEqual(["select", "select"]);
    click(".mint-submit");
    expect(cues()).toEqual(["select", "select", "commit"]);
    for (let i = 0; i < 7; i++) act(() => vi.advanceTimersByTime(2500));
    act(() => vi.advanceTimersByTime(1500));
    act(() => vi.advanceTimersByTime(1500));
    click(".begin-btn");
    expect(cues()).toEqual(["select", "select", "commit", "commit"]);
    expect(loadPrince()!.runs).toHaveLength(1);
  });

  it("sounds end-map toggles only when accepted and commits New Run", () => {
    savePrince(createStubPrince({ runs: [beginRun(42, 64)] }));
    render(<EndOfRunScreen />);
    click(".eor-card");
    hover(".eor-card");
    click(".eor-card");
    expect(cues()).toEqual(["dismiss"]);
    act(() => vi.advanceTimersByTime(250));
    click(".eor-card");
    click(".begin-btn");
    expect(cues()).toEqual(["dismiss", "select", "commit"]);
    expect(loadPrince()!.runs).toHaveLength(2);
  });
});

describe("city feedback", () => {
  async function search() {
    const onChange = vi.fn();
    act(() => root.render(<CityPicker lat={0} lon={0} tz="" onChange={onChange} />));
    await act(async () => {
      get(".city-input").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await vi.dynamicImportSettled();
    });
    type(".city-input", "Ne");
    return onChange;
  }

  it("keeps typing and bounded arrow presses silent, then sounds result changes and selection", async () => {
    const onChange = await search();
    expect(cues()).toEqual([]);
    key("ArrowUp");
    key("ArrowDown");
    key("ArrowDown");
    key("ArrowUp");
    key("Enter");
    expect(cues()).toEqual(["hover", "hover", "select"]);
    expect(onChange).toHaveBeenCalledWith(40.7, -74, "America/New_York");
    expect(container.querySelector(".city-results")).toBeNull();
  });

  it("ignores touch hover and secondary clicks, and selects each pointer result once", async () => {
    const onChange = await search();
    hover(".city-row", "touch");
    act(() => get(".city-row").dispatchEvent(new MouseEvent("mousedown", { button: 2, bubbles: true })));
    expect(cues()).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
    hover(".city-row");
    act(() => get(".city-row").dispatchEvent(new MouseEvent("mousedown", { button: 0, bubbles: true })));
    expect(cues()).toEqual(["hover", "select"]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("dismisses visible results once and sounds manual toggles without sounding coordinate edits", async () => {
    await search();
    key("Escape");
    key("Escape");
    act(() => document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(cues()).toEqual(["dismiss"]);
    type(".city-input", "New");
    act(() => document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(cues()).toEqual(["dismiss", "dismiss"]);
    click(".city-compass");
    type('[placeholder="Lat"]', "4070");
    type('[placeholder="Lon"]', "-7400");
    click(".city-compass");
    expect(cues()).toEqual(["dismiss", "dismiss", "select", "dismiss"]);
  });

  it("lets an outside action carry its own cue while dismissing city results", async () => {
    await search();
    const button = document.createElement("button");
    button.onclick = () => playUISound("commit");
    document.body.append(button);
    try {
      act(() => {
        button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        button.click();
      });
      expect(cues()).toEqual(["commit"]);
      expect(container.querySelector(".city-results")).toBeNull();
    } finally {
      button.remove();
    }
  });
});
