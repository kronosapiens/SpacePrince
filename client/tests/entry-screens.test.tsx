import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TitleScreen } from "@/screens/TitleScreen";
import { StartScreen } from "@/screens/StartScreen";
import { MapScreen } from "@/screens/MapScreen";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRun } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import { eligibleNext } from "@/game/map-gen";
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
