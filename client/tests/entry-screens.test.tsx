import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TitleScreen } from "@/screens/TitleScreen";
import { MapScreen } from "@/screens/MapScreen";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRun } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import { eligibleNext } from "@/game/map-gen";
import { createStubPrince } from "./fixtures";
import { playUISound } from "@/audio/engine";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playUISound: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("SVGLineElement", class {});
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

function mount(screen: "title" | "map") {
  const prince = createStubPrince();
  const run = beginRun(42, prince.numEncounters);
  run.state.Moon.affliction = combustionCeiling(prince.chart.planets.Moon);
  prince.runs = [run];
  savePrince(prince);
  act(() => root.render(
    <MemoryRouter>
      <PrinceStoreProvider>{screen === "title" ? <TitleScreen /> : <MapScreen />}</PrinceStoreProvider>
    </MemoryRouter>,
  ));
  return prince;
}

function element(selector: string) {
  const found = container.querySelector(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
}
function click(target: Element) {
  act(() => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("chart inspection on entry screens", () => {
  it("keeps the returning player's chart and current health on Title instead of cycling samples", () => {
    const prince = mount("title");
    expect(element(".title .chart-svg").getAttribute("aria-label")).toBe("Stub natal chart");
    expect(element(".begin-btn").textContent).toBe("Continue");
    act(() => vi.advanceTimersByTime(6000));
    expect(element(".title .chart-svg").getAttribute("aria-label")).toBe("Stub natal chart");
    click(element('[role="button"][aria-label="Moon"]'));
    expect(element(".ps-ratio").textContent).toBe(`Resolve0/${combustionCeiling(prince.chart.planets.Moon)}`);
    expect(loadPrince()).toEqual(prince);
  });

  it("inspects knocked-out planets and retains study details without moving, while route selection still needs two taps", () => {
    const prince = mount("map");
    act(() => element('[role="button"][aria-label="Moon"]').dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    ));
    expect(element(".ps-name").textContent).toContain("MOON");
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    click(element(".ps-name .ps-tri-tap"));
    click(element('[role="button"][aria-label="Mercury"]'));
    expect(element(".ps-name").textContent).toContain("MERCURY");
    expect(container.querySelector(".ps-study")).not.toBeNull();
    expect(loadPrince()).toEqual(prince);

    const map = prince.runs[0]!.map;
    const next = eligibleNext(map.graph, map.currentNodeId, map.visitedNodeIds)[0]!;
    vi.mocked(playUISound).mockClear();
    click(element(`[data-guide="node-${next}"]`));
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"]]);
    expect(loadPrince()).toEqual(prince);
    click(element(`[data-guide="node-${next}"]`));
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"], ["commit"]]);
    const run = loadPrince()!.runs[0]!;
    expect(run.map.currentNodeId).toBe(next);
    expect(run.encounter).not.toBeNull();
  });
});
