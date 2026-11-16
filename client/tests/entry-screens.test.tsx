import { GameTest } from "./game-layout";
import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRun, FIRST_MAP_SEED, MAPS_PER_RUN } from "@/game/run";
import { beginRelationalEncounter } from "@/game/encounter";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { PLANETS } from "@/game/data";
import { createStubPrince } from "./fixtures";
import type { Prince } from "@/game/types";
import { PRIMER_FRAMING } from "@/copy/primer";
import { playStar, playUISound, setTheme } from "@/audio/engine";
import { TIMINGS } from "@/svg/timings";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playUISound: vi.fn(), playStar: vi.fn() }));
vi.mock("@/components/AudioControls", () => ({ AudioControls: () => null }));

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
  const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
  run.state.Moon.tension = getEffectiveStatsFromPlacement(prince.chart.planets.Moon).resolve;
  prince.runs = [run];
  savePrince(prince);
  act(() => root.render(<GameTest path={screen === "title" ? "/" : "/play"} />));
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

function input(selector: string, value: string) {
  act(() => {
    const control = element(selector) as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(control, value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function finishOpening() {
  if (container.querySelector(".necessity-opening")) act(() => vi.runOnlyPendingTimers());
  expect(container.querySelector(".necessity-opening")).toBeNull();
}

function finishedMap(mapsCompleted: number) {
  const prince = createStubPrince();
  const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
  run.mapsCompleted = mapsCompleted;
  run.map.currentNodeId = TERMINAL_NODE_ID;
  run.map.visitedNodeIds.push(TERMINAL_NODE_ID);
  prince.runs = [run];
  return { prince, run };
}

function play(prince: Prince) {
  savePrince(prince);
  act(() => root.render(<GameTest path="/play" />));
}

function planetPositions() {
  return [...container.querySelectorAll('.chart-svg text')]
    .filter((text) => Object.values(PLANET_GLYPH).includes(text.textContent ?? ""))
    .map((planet) => planet.closest("g[transform]")!.getAttribute("transform"));
}

describe("entry screens", () => {
  it("finishes map revival before allowing travel and study", () => {
    const prince = createStubPrince();
    const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
    run.state.Moon.tension = getEffectiveStatsFromPlacement(prince.chart.planets.Moon).resolve / 2;
    run.map.boundary = { uncombusts: [{ planet: "Moon", chance: 0.5, success: true }], necessity: [] };
    prince.runs = [run];
    savePrince(prince);
    act(() => root.render(<GameTest path="/play" />));
    const next = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
    const node = `[data-guide="node-${next}"]`;

    expect(container.querySelector(".map-boundary")).toBeNull();
    act(() => vi.advanceTimersByTime(TIMINGS.crossing.arrive));
    expect(element(".chart-layout-chart .necessity-opening").textContent).toBe("");
    expect(container.querySelector(".necessity-revival")).not.toBeNull();
    expect(container.querySelector(".necessity-accent")).toBeNull();
    expect(container.querySelector(".necessity-arc")).toBeNull();
    expect(element('[data-guide="map"]').querySelector('[role="button"]')).toBeNull();
    click(element(node));
    act(() => element(node).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(container.querySelector(".necessity-opening")).not.toBeNull();
    expect(loadPrince()).toEqual(prince);

    finishOpening();
    expect(element(node).closest('[role="button"]')).not.toBeNull();
    expect(loadPrince()).toEqual(prince);
    click(element('[data-guide="planet-self-moon"]'));
    click(element('[aria-label="Study Moon"]'));
    expect(element(".ps-study").textContent).not.toContain("Necessity");
    click(element(node));
    expect(loadPrince()!.runs[0]!.map.currentNodeId).toBe(next);
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
  });

  it("holds travel until a planet introduction earned on the way opens, a moment after the map", () => {
    const prince = createStubPrince({ numRelationalEncounters: 0 });
    const run = beginRun(prince.chart, 42, 0);
    run.encounter = { ...beginRelationalEncounter({ run, opponentSeed: 99, lifetimeRelationalEncounterCount: 0 }), resolved: true, turnIndex: 1 };
    // Past the first map, so no first-visit guide opens.
    run.mapsCompleted = 1;
    prince.runs = [run];
    savePrince(prince);
    act(() => root.render(<GameTest path="/play" />));
    click(document.querySelector(".chorus-continue")!);
    click(element(".relational-continue"));
    expect(loadPrince()!.runs[0]!.encounter).toBeNull();
    const next = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
    const node = `[data-guide="node-${next}"]`;
    expect(element(node).closest('[role="button"]')).toBeNull();
    click(element(node));
    expect(loadPrince()!.runs[0]!.map.currentNodeId).toBe(run.map.currentNodeId);
    act(() => vi.advanceTimersByTime(TIMINGS.arrival.card - 1));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector('[role="dialog"]')!.getAttribute("aria-label")).toBe("Mercury unlocked");
    click(document.querySelector(".info-card-close")!);
    click(element(node));
    expect(loadPrince()!.runs[0]!.map.currentNodeId).toBe(next);
  });

  it("keeps one chart through a live casting preview, the ceremony, and entry to Map", () => {
    act(() => root.render(<GameTest />));
    const chart = element(".chart-svg");
    const samplePositions = planetPositions();
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(TIMINGS.mint.titleFade));
    expect(element(".chart-svg")).toBe(chart);
    expect(planetPositions()).toEqual(samplePositions);
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(TIMINGS.mint.framingFade));

    expect((element('[type="date"]') as HTMLInputElement).value).toBe("2000-01-01");
    expect((element('[type="time"]') as HTMLInputElement).value).toBe("00:00");
    expect(element(".city-input").getAttribute("placeholder")).toBe("Los Angeles, CA · United States");
    expect((element(".mint-submit") as HTMLButtonElement).disabled).toBe(false);
    click(element(".city-compass"));
    input('[placeholder="Lat"]', "4071");
    input('[placeholder="Lon"]', "-7401");
    expect(container.querySelectorAll('[data-guide^="planet-self-"]')).toHaveLength(0);
    const initialPositions = planetPositions();
    expect(initialPositions).toHaveLength(7);
    expect(initialPositions).not.toEqual(samplePositions);
    expect(loadPrince()).toBeNull();
    input('[type="date"]', "2001-01-01");
    const previewPositions = planetPositions();
    expect(previewPositions).not.toEqual(initialPositions);
    input('[type="date"]', "");
    expect(planetPositions()).toEqual(previewPositions);
    expect((element(".mint-submit") as HTMLButtonElement).disabled).toBe(true);
    input('[type="date"]', "2001-01-01");

    click(element(".mint-submit"));
    expect(planetPositions()).toEqual(previewPositions);
    for (let i = 0; i < 7; i++) {
      act(() => vi.advanceTimersByTime(TIMINGS.mint.revealInterval));
      expect(container.querySelectorAll('[data-guide^="planet-self-"]')).toHaveLength(i + 1);
      expect(element(".chart-svg")).toBe(chart);
    }
    act(() => vi.advanceTimersByTime(TIMINGS.mint.revealInterval - 1));
    expect(container.querySelectorAll('[data-guide^="planet-self-"]')).toHaveLength(7);
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelectorAll('[data-guide^="planet-self-"]')).toHaveLength(0);
    expect(container.querySelector(".planet-band.is-on")).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => vi.advanceTimersByTime(TIMINGS.mint.dimmed));
    expect(document.querySelector('[role="dialog"]')!.getAttribute("aria-label")).toBe("Moon unlocked");
    expect(container.querySelector(".begin-btn")).toBeNull();
    click(document.querySelector(".info-card-close")!);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelectorAll('[data-guide^="planet-self-"]')).toHaveLength(1);
    expect(container.querySelector('[data-guide="planet-self-moon"]')).not.toBeNull();
    expect(container.querySelector(".planet-band.is-on")).toBeNull();
    expect(loadPrince()).toBeNull();
    const settledPositions = planetPositions();
    click(element(".begin-btn"));
    expect(element(".map-screen .chart-svg")).toBe(chart);
    expect(planetPositions()).toEqual(settledPositions);
    const minted = loadPrince()!;
    expect(minted.position).toMatchObject({ lat: 40.71, lon: -74.01 });
    expect(minted.runs).toHaveLength(1);
    const first = minted.runs[0]!;
    expect(first.map.seed).toBe(FIRST_MAP_SEED);
    expect(first.state).toEqual(beginRun(minted.chart, first.seed, minted.numRelationalEncounters).state);
    expect(first.state.Moon.tension).toBe(0);
    expect(first.map.boundary!.necessity).toEqual([]);
    expect(container.querySelector(".map-boundary")).toBeNull();
    expect(container.querySelector(".map-screen .chart-svg .necessity-opening")).toBeNull();
    expect(container.querySelector(".necessity-title")).toBeNull();
    // A new Prince's first map opens its guide by itself, a moment after arriving.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => vi.advanceTimersByTime(TIMINGS.arrival.guide));
    expect(document.querySelector('[role="dialog"]')!.getAttribute("aria-label")).toBe("Read the map");
    click(document.querySelector(".guide-close")!);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    finishOpening();
    click(element('[role="button"][aria-label="Moon"]'));
    expect(element(".ps-name").textContent).toContain("MOON");
  });

  it("keeps the saved chart and an open inspection when continuing from Title to Map", () => {
    mount("title");
    const chart = element(".chart-svg");
    click(element('[role="button"][aria-label="Moon"]'));
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(TIMINGS.mint.titleFade));
    expect(element(".map-screen .chart-svg")).toBe(chart);
    finishOpening();
    expect(element(".ps-name").textContent).toContain("MOON");
  });

  it("selects Main on Title and keeps that selection through Prince creation", () => {
    act(() => root.render(<GameTest />));
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
    expect(element(".ps-ratio").textContent).toBe(`Resolve0/${getEffectiveStatsFromPlacement(prince.chart.planets.Moon).resolve}`);
    expect(loadPrince()).toEqual(prince);
  });

  it("inspects knocked-out planets safely and enters a route on its first click", () => {
    const prince = mount("map");
    finishOpening();
    act(() => element('[role="button"][aria-label="Moon"]').dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    ));
    expect(element(".ps-name").textContent).toContain("MOON");
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    click(element('[aria-label="Study Moon"]'));
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
    const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
    for (const planet of PLANETS) {
      run.state[planet].tension = getEffectiveStatsFromPlacement(prince.chart.planets[planet]).resolve;
    }
    run.light = 96;
    const next = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
    prince.runs = [run];
    savePrince(prince);
    act(() => root.render(<GameTest path="/play" />));

    expect(element(".map-screen .chart-svg").getAttribute("aria-label")).toBe("Stub natal chart");
    expect(element(".begin-btn").textContent).toBe("New Run");
    const map = element('[data-guide="map"]');
    expect(map.querySelector('[role="button"]')).toBeNull();
    expect(map.querySelector(".invite-ring")).toBeNull();
    const node = element(`[data-guide="node-${next}"]`);
    click(node);
    act(() => node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(loadPrince()).toEqual(prince);
    finishOpening();
    click(element('[role="button"][aria-label="Moon"]'));
    expect(element(".ps-ratio").textContent).toBe(`Resolve0/${getEffectiveStatsFromPlacement(prince.chart.planets.Moon).resolve}`);

    vi.mocked(playUISound).mockClear();
    click(element(".begin-btn"));
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    const restarted = loadPrince()!;
    expect({ ...restarted, runs: prince.runs }).toEqual(prince);
    expect(restarted.runs).toHaveLength(2);
    expect(restarted.runs[0]).toEqual(run);
    const fresh = restarted.runs[1]!;
    expect(fresh.map.seed).not.toBe(FIRST_MAP_SEED);
    expect(fresh.state).toEqual(beginRun(prince.chart, fresh.seed, prince.numRelationalEncounters).state);
    expect(fresh.state.Moon.tension).toBe(0);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(element('[data-guide="map"]').querySelector('[role="button"]')).not.toBeNull();
    finishOpening();
    expect(restarted.runs[1]!.light).toBe(0);
    expect(container.querySelector(".begin-btn")).toBeNull();
    expect(element(".map-index-v").textContent).toBe("I");
    expect(element('[data-guide="map"]').querySelector('[role="button"]')).not.toBeNull();
  });

  it("finishes the seventh map in place, opens its star's card once, offers New Run when it closes, and at once after reload", () => {
    const { prince, run } = finishedMap(MAPS_PER_RUN - 1);
    savePrince(prince);
    // Effects run twice here, as in development.
    act(() => root.render(<StrictMode><GameTest path="/play" /></StrictMode>));

    const completed = loadPrince()!;
    expect(completed.runs[0]).toEqual({ ...run, mapsCompleted: MAPS_PER_RUN });
    expect(element(".map-index-v").textContent).toBe("VII");
    expect(container.querySelector(".begin-btn")).toBeNull();
    act(() => vi.advanceTimersByTime(TIMINGS.arrival.card - 1));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(document.querySelector('[role="dialog"]')!.classList).toContain("prince-modal");
    expect(container.querySelector(".begin-btn")).toBeNull();
    click(document.querySelector(".info-card-close")!);
    expect(element(".begin-btn").textContent).toBe("New Run");
    act(() => vi.advanceTimersByTime(60_000));
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    act(() => root.unmount());
    root = createRoot(container);
    act(() => root.render(<GameTest path="/play" />));
    expect(loadPrince()).toEqual(completed);
    expect(element(".map-index-v").textContent).toBe("VII");
    expect(element(".begin-btn").textContent).toBe("New Run");
    act(() => vi.advanceTimersByTime(60_000));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("brings the ended run's star in with its ring and bell above the run's Light, neither of which Inspect Prince shows", () => {
    const { prince, run } = finishedMap(MAPS_PER_RUN - 1);
    run.light = 96;
    play(prince);
    act(() => vi.advanceTimersByTime(TIMINGS.arrival.card));
    const card = document.querySelector(".prince-modal")!;
    expect(card.querySelectorAll(".run-star-arrive .run-star-ring")).toHaveLength(1);
    expect(card.querySelector(".prince-light")!.textContent).toBe("Light96");
    act(() => vi.advanceTimersByTime(TIMINGS.runEnd.starDelay - 1));
    expect(playStar).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(playStar).toHaveBeenCalledTimes(1);

    click(document.querySelector(".info-card-close")!);
    click(element('[aria-label="Open settings"]'));
    click([...document.querySelectorAll(".settings-menu-button")].find((button) => button.textContent === "Inspect Prince")!);
    const inspected = document.querySelector(".prince-modal")!;
    expect(inspected.querySelectorAll('[aria-label="Past runs"] > g')).toHaveLength(1);
    expect(inspected.querySelector(".run-star-arrive, .run-star-ring, .prince-light")).toBeNull();
  });

  it("keeps a finished map that is not the seventh, with its numeral and Continue, across a reload", () => {
    const { prince } = finishedMap(0);
    play(prince);
    const unchanged = () => {
      expect(loadPrince()).toEqual(prince);
      expect(element(".map-index-v").textContent).toBe("I");
      expect(element(".begin-btn").textContent).toBe("Continue");
      expect(document.activeElement).not.toBe(element(".begin-btn"));
      expect(container.querySelector(".instruction")).toBeNull();
    };
    unchanged();
    act(() => vi.advanceTimersByTime(60_000));
    unchanged();
    act(() => root.unmount());
    root = createRoot(container);
    act(() => root.render(<GameTest path="/play" />));
    unchanged();
  });

  it("crosses once, after the finished map closes, and the next map arrives with its numeral", () => {
    const { prince, run } = finishedMap(0);
    play(prince);
    vi.mocked(playUISound).mockClear();
    click(element(".begin-btn"));
    click(element(".begin-btn"));
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    expect(element(".map-content").classList).toContain("anim-crossing-close");
    act(() => vi.advanceTimersByTime(TIMINGS.crossing.close - 1));
    expect(loadPrince()).toEqual(prince);
    expect(element(".map-index-v").textContent).toBe("I");

    act(() => vi.advanceTimersByTime(1));
    const crossed = loadPrince()!.runs[0]!;
    expect(crossed.mapsCompleted).toBe(1);
    expect(crossed.map.id).not.toBe(run.map.id);
    expect(element(".map-index-v").textContent).toBe("II");
    expect(element(".map-content").classList).toContain("anim-crossing-arrive");
    expect(container.querySelector(".begin-btn")).toBeNull();
    // No planet returns, so nothing is held.
    expect(element('[data-guide="map"]').querySelector('[role="button"]')).not.toBeNull();
    act(() => vi.advanceTimersByTime(60_000));
    expect(loadPrince()!.runs[0]).toEqual(crossed);
  });

  it("keeps a returning planet combusted until the next map has arrived, then returns it", () => {
    const { prince, run } = finishedMap(1);
    const resolve = getEffectiveStatsFromPlacement(prince.chart.planets.Moon).resolve;
    run.state.Moon.tension = resolve;
    // Fortune of 120 or more makes the Moon's return certain.
    run.gains.Moon.luck = 120;
    play(prince);
    const moonCombusted = () => !!container.querySelector('.anim-combust > [data-guide="planet-self-moon"]');
    const travel = () => element('[data-guide="map"]').querySelector('[role="button"]');
    expect(moonCombusted()).toBe(true);
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(TIMINGS.crossing.close));
    expect(loadPrince()!.runs[0]!.state.Moon.tension).toBe(resolve / 2);

    expect(element(".map-index-v").textContent).toBe("III");
    act(() => vi.advanceTimersByTime(TIMINGS.crossing.arrive - 1));
    expect(moonCombusted()).toBe(true);
    expect(container.querySelector(".necessity-revival")).toBeNull();
    expect(travel()).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelector(".necessity-revival")).not.toBeNull();
    act(() => vi.advanceTimersByTime(TIMINGS.necessity.revival));
    expect(moonCombusted()).toBe(false);
    expect(travel()).not.toBeNull();
  });

  it("holds Continue while the map's guide is open", () => {
    const { prince } = finishedMap(1);
    play(prince);
    click(element('[aria-label="Study this map"]'));
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(TIMINGS.crossing.close));
    expect(loadPrince()).toEqual(prince);
    click(document.querySelector(".guide-close")!);
    click(element(".begin-btn"));
    act(() => vi.advanceTimersByTime(TIMINGS.crossing.close));
    expect(loadPrince()!.runs[0]!.mapsCompleted).toBe(2);
  });
});
