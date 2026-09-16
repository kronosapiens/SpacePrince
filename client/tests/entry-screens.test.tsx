import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TitleScreen } from "@/screens/TitleScreen";
import { StartScreen } from "@/screens/StartScreen";
import { MapScreen } from "@/screens/MapScreen";
import { PlaySurface } from "@/screens/PlaySurface";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { PLANETS } from "@/game/data";
import { createStubPrince } from "./fixtures";
import { PRIMER_FRAMING } from "@/copy/primer";
import { playUISound, setTheme } from "@/audio/engine";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playUISound: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
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

describe("entry screens", () => {
  it("selects Main on Title and keeps that selection through Prince creation", () => {
    act(() => root.render(
      <MemoryRouter>
        <PrinceStoreProvider>
          <Routes>
            <Route path="/" element={<TitleScreen />} />
            <Route path="/play" element={<StartScreen />} />
          </Routes>
        </PrinceStoreProvider>
      </MemoryRouter>,
    ));
    expect(vi.mocked(setTheme).mock.calls).toEqual([["Main"]]);
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(500));
    const framing = element(".mint-framing");
    expect(framing.querySelectorAll("p").length).toBe(PRIMER_FRAMING.length);
    const firstBold = PRIMER_FRAMING.join(" ").match(/\*\*(.+?)\*\*/)?.[1];
    expect(framing.querySelector("strong")?.textContent).toBe(firstBold);
    expect(framing.textContent).not.toContain("**");
    expect(vi.mocked(setTheme).mock.calls).toEqual([["Main"], ["Main"]]);
  });

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

  it("inspects knocked-out planets safely and enters a route on its first click", () => {
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
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    const run = loadPrince()!.runs[0]!;
    expect(run.map.currentNodeId).toBe(next);
    expect(run.encounter).not.toBeNull();
  });

  it("keeps a combusted run inspectable on a passive map and starts again on the same Prince", () => {
    const prince = createStubPrince();
    const run = beginRun(42, prince.numEncounters);
    for (const planet of PLANETS) {
      run.state[planet].affliction = combustionCeiling(prince.chart.planets[planet]);
    }
    run.light = 96;
    const next = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
    prince.runs = [run];
    savePrince(prince);
    act(() => root.render(<PrinceStoreProvider><PlaySurface /></PrinceStoreProvider>));

    expect(element(".map-screen .chart-svg").getAttribute("aria-label")).toBe("Stub natal chart");
    expect(element(".begin-btn").textContent).toBe("New Run");
    const map = element('[data-guide="map"]');
    expect(map.querySelector('[role="button"]')).toBeNull();
    expect(map.querySelector(".invite-ring")).toBeNull();
    const node = element(`[data-guide="node-${next}"]`);
    click(node);
    act(() => node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(loadPrince()).toEqual(prince);
    click(element('[role="button"][aria-label="Moon"]'));
    expect(element(".ps-ratio").textContent).toBe(`Resolve0/${combustionCeiling(prince.chart.planets.Moon)}`);

    vi.mocked(playUISound).mockClear();
    click(element(".begin-btn"));
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    const restarted = loadPrince()!;
    expect({ ...restarted, runs: prince.runs }).toEqual(prince);
    expect(restarted.runs).toHaveLength(2);
    expect(restarted.runs[0]).toEqual(run);
    expect(restarted.runs[1]!.state).toEqual(beginRun(0).state);
    expect(restarted.runs[1]!.light).toBe(0);
    expect(container.querySelector(".begin-btn")).toBeNull();
    expect(element(".map-index-v").textContent).toBe("I");
    expect(element('[data-guide="map"]').querySelector('[role="button"]')).not.toBeNull();
  });

  it("finishes the seventh map in place and keeps that completed map after reload", () => {
    const prince = createStubPrince();
    const run = beginRun(42, prince.numEncounters);
    run.mapsCompleted = MAPS_PER_RUN - 1;
    run.map.currentNodeId = TERMINAL_NODE_ID;
    run.map.visitedNodeIds.push(TERMINAL_NODE_ID);
    prince.runs = [run];
    savePrince(prince);
    act(() => root.render(<PrinceStoreProvider><PlaySurface /></PrinceStoreProvider>));

    const completed = loadPrince()!;
    expect(completed.runs[0]).toEqual({ ...run, mapsCompleted: MAPS_PER_RUN });
    expect(element(".map-index-v").textContent).toBe("VII");
    expect(element(".begin-btn").textContent).toBe("New Run");
    act(() => root.unmount());
    root = createRoot(container);
    act(() => root.render(<PrinceStoreProvider><PlaySurface /></PrinceStoreProvider>));
    expect(loadPrince()).toEqual(completed);
    expect(element(".map-index-v").textContent).toBe("VII");
    expect(element(".begin-btn").textContent).toBe("New Run");
  });
});
