import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameTest } from "./game-layout";
import { useInfoCards } from "@/state/InfoCardContext";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRelationalEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { beginRun, enterNode, isOver } from "@/game/run";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { PLANETS } from "@/game/data";
import { eligibleNext } from "@/game/map-gen";
import { unlockedPlanets } from "@/game/unlocks";
import { TIMINGS } from "@/svg/timings";
import { playCombust, playUISound } from "@/audio/engine";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn(), playUISound: vi.fn() }));
vi.mock("@/screens/MapScreen", () => ({ MapScreen: () => <div data-screen="map" /> }));
vi.mock("@/components/InfoCardHost", () => ({
  InfoCardHost: () => {
    const { current } = useInfoCards();
    return current ? <div data-intro>{current.planet}</div> : null;
  },
}));

const openingTiming = TIMINGS.necessity;
const perPlanet = openingTiming.accent + openingTiming.necessity + openingTiming.fortune + openingTiming.settle;
let root: Root | null;
let container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("SVGLineElement", class {});
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root?.unmount());
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function relational(turns = 1, count = 64) {
  const prince = createStubPrince({ numRelationalEncounters: count });
  const run = beginRun(prince.chart, 42, count);
  const encounter = beginRelationalEncounter({ run, opponentSeed: 99, lifetimeRelationalEncounterCount: count });
  encounter.sequence = Array.from({ length: turns }, () => "Moon");
  encounter.opponentActions = Array.from({ length: turns }, () => "Testimony");
  run.encounter = encounter;
  // Past the first map, so the encounter's guide doesn't open by itself.
  run.mapsCompleted = 1;
  prince.runs = [run];
  return { prince, run, encounter };
}
function entryWipe(count: number) {
  const prince = createStubPrince({ numRelationalEncounters: count });
  prince.chart.planets.Moon.base.luck = 0;
  prince.chart.planets.Moon.buffs.luck = 0;
  let run = beginRun(prince.chart, 42, count);
  for (const planet of unlockedPlanets(count)) {
    run.state[planet].tension = getEffectiveStatsFromPlacement(prince.chart.planets[planet]).resolve;
  }
  run.state.Moon.tension -= 6;
  run.light = 96;
  const nodeId = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
  run.map.rolledNodes[nodeId] = { kind: "relational", opponentSeed: 99 };
  run = enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: count });
  const encounter = run.encounter!;
  if (encounter.kind !== "relational") throw new Error("Expected a chart encounter");
  expect(encounter).toMatchObject({ resolved: true, turnIndex: 0, log: [] });
  expect(isOver(run, prince.chart, count)).toBe(true);
  prince.runs = [run];
  return { prince, run, encounter };
}
function mount(prince: ReturnType<typeof createStubPrince>, settleOpening = true) {
  savePrince(prince);
  act(() => root!.render(<GameTest path="/play" />));
  click(document.querySelector(".chorus-continue")!);
  if (settleOpening && container.querySelector(".necessity-opening")) {
    act(() => vi.runOnlyPendingTimers());
    expect(container.querySelector(".necessity-opening")).toBeNull();
  }
}
const get = (selector: string) => {
  const el = container.querySelector(selector);
  if (!el) throw new Error(`Missing ${selector}`);
  return el;
};
const click = (el: Element) => act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const advanceTime = (ms: number) => act(() => vi.advanceTimersByTime(ms));
function commit(verb = "Afflict") {
  click(get('[data-guide="planet-self-moon"]'));
  const action = Array.from(container.querySelectorAll(".ps-action")).find(el => el.textContent?.startsWith(verb))!;
  click(action);
}
function settle() {
  let steps = 0;
  while (!container.querySelector(".relational.is-resolved") && steps++ < 200) {
    expect(container.querySelector(".relational")).not.toBeNull();
    expect(container.querySelector("[data-screen]")).toBeNull();
    act(() => vi.advanceTimersToNextTimer());
  }
  expect(container.querySelector(".relational.is-resolved")).not.toBeNull();
}

describe("encounter advancement", () => {
  it("plays both entry-wipe openings before clearing and lets an unlock rescue the run", () => {
    const { prince, run, encounter } = entryWipe(31);
    mount(prince, false);
    const committed = structuredClone(run);
    expect(container.querySelectorAll(".necessity-opening")).toHaveLength(2);
    expect(get(".relational-turns-v").textContent).toBe(`0/${encounter.sequence.length}`);
    expect(container.querySelector(".relational.is-resolved")).toBeNull();
    expect(container.querySelector(".ps-action")).toBeNull();
    expect(container.querySelector('[data-guide="incoming"]')).toBeNull();
    click(get(".relational"));
    expect(loadPrince()!.numRelationalEncounters).toBe(31);

    advanceTime(perPlanet);
    expect(container.querySelector('[data-guide="chart-self"] .necessity-opening')).toBeNull();
    expect(container.querySelector('[data-guide="chart-other"] .necessity-opening')).not.toBeNull();
    act(() => root!.render(<GameTest path="/play" />));
    expect(container.querySelector('[data-guide="chart-self"] .necessity-opening')).toBeNull();
    click(get(".relational"));
    advanceTime((encounter.necessity!.length - 1) * perPlanet - 1);
    expect(container.querySelector(".relational.is-resolved")).toBeNull();
    expect(loadPrince()!.runs[0]).toEqual(committed);
    advanceTime(1);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(".relational.is-resolved")).not.toBeNull();
    expect(get(".relational-turns-v").textContent).toBe(`0/${encounter.sequence.length}`);
    advanceTime(2799);
    expect(loadPrince()!.numRelationalEncounters).toBe(31);
    expect(container.querySelector("[data-intro]")).toBeNull();
    advanceTime(1);

    const after = loadPrince()!;
    expect(after.numRelationalEncounters).toBe(32);
    expect(after.runs[0]!.encounter).toBeNull();
    expect(after.runs[0]!.light).toBe(96);
    expect(after.runs[0]!.state.Saturn.tension).toBe(0);
    expect(isOver(after.runs[0]!, after.chart, after.numRelationalEncounters)).toBe(false);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(get("[data-intro]").textContent).toBe("Saturn");
    advanceTime(5000);
    expect(loadPrince()!.numRelationalEncounters).toBe(32);
  });

  it("settles a fatal entry wipe immediately with reduced motion and clears it only once", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { prince, encounter } = entryWipe(64);
    mount(prince, false);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(".relational.is-resolved")).not.toBeNull();
    expect(get(".relational-turns-v").textContent).toBe(`0/${encounter.sequence.length}`);
    expect(container.querySelector(".ps-action")).toBeNull();
    const surface = get(".relational");
    act(() => {
      surface.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      surface.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const after = loadPrince()!;
    expect(after.numRelationalEncounters).toBe(65);
    expect(after.runs[0]!.encounter).toBeNull();
    expect(after.runs[0]!.light).toBe(96);
    expect(isOver(after.runs[0]!, after.chart, after.numRelationalEncounters)).toBe(true);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(container.querySelector("[data-intro]")).toBeNull();
    advanceTime(5000);
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
  });

  it("sounds selection and commitment separately, and leaves repeated selection silent", () => {
    const { prince } = relational(2);
    mount(prince);
    vi.mocked(playUISound).mockClear();
    const planet = get('[data-guide="planet-self-moon"]');
    click(planet);
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"]]);
    click(planet);
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"]]);
    const action = get('[data-guide="action-testimony"]');
    click(action);
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"], ["commit"]]);
  });

  it("waits for the full propagation playback and final pause before returning to the map", () => {
    const { prince } = relational();
    mount(prince);
    commit("Testify");
    const committed = loadPrince()!;
    const encounter = committed.runs[0]!.encounter!;
    expect(encounter.resolved).toBe(true);
    expect(encounter.kind === "relational" && encounter.log[0]!.propagation.length).toBeGreaterThan(0);
    expect(container.querySelector(".relational.is-resolved")).toBeNull();
    expect(container.querySelector('[aria-label="Study this encounter"]')).toBeNull();
    expect(container.querySelector(".relational-continue")).toBeNull();
    click(get(".relational"));
    click(get('[data-guide="planet-self-moon"]'));
    expect(container.querySelector(".relational.is-resolved")).toBeNull();
    settle();
    expect(loadPrince()!.numRelationalEncounters).toBe(64);
    vi.mocked(playUISound).mockClear();
    advanceTime(1799);
    expect(container.querySelector('[data-screen="map"]')).toBeNull();
    advanceTime(1);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(committed.runs[0]!.light);
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
    expect(playUISound).not.toHaveBeenCalled();
  });

  it("lets a tap on the final chart skip the pause and advances only once", () => {
    const { prince } = relational(1, 0);
    mount(prince);
    commit();
    expect(container.querySelector("[data-intro]")).toBeNull();
    settle();
    const planet = get('[data-guide="planet-self-moon"]');
    vi.mocked(playUISound).mockClear();
    act(() => {
      planet.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      planet.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"]]);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(get("[data-intro]").textContent).toBe("Mercury");
    expect(loadPrince()!.numRelationalEncounters).toBe(1);
  });

  it("keeps an encounter open between turns", () => {
    const { prince } = relational(2);
    mount(prince);
    commit();
    act(() => vi.runAllTimers());
    expect(loadPrince()!.runs[0]!.encounter?.resolved).toBe(false);
    expect(container.querySelector(".relational")).not.toBeNull();
    expect(container.querySelector(".relational.is-resolved")).toBeNull();
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(".necessity-arc")).toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).toMatchObject({ turnIndex: 1 });
    expect(loadPrince()!.numRelationalEncounters).toBe(64);
  });

  it("finishes run-ending combustion playback before returning to the map", () => {
    const { prince, run, encounter } = relational();
    for (const planet of PLANETS) run.state[planet].tension = getEffectiveStatsFromPlacement(prince.chart.planets[planet]).resolve;
    run.state.Moon.tension -= 12;
    encounter.opponentActions = ["Affliction"];
    mount(prince);
    commit("Testify");
    settle();
    expect(playCombust).toHaveBeenCalled();
    advanceTime(2799);
    expect(container.querySelector("[data-screen]")).toBeNull();
    advanceTime(1);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
  });

  it("advances a restored resolved encounter without replaying or paying again", () => {
    const { prince, run, encounter } = relational();
    encounter.resolved = true;
    encounter.turnIndex = 1;
    run.light = 96;
    mount(prince);
    advanceTime(1800);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(96);
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
  });

  it("cancels a pending exit when the screen unmounts", () => {
    const { prince, encounter } = relational();
    encounter.resolved = true;
    mount(prince);
    act(() => root!.unmount());
    root = null;
    advanceTime(5000);
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
    expect(loadPrince()!.numRelationalEncounters).toBe(64);
  });

  it("advances a narrative encounter without counting it or unlocking a planet", () => {
    const prince = createStubPrince({ numRelationalEncounters: 31 });
    const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
    run.encounter = beginNarrativeEncounter({ run, house: 4, scenarioId: "home-libra-mara" });
    run.mapsCompleted = 1;
    prince.runs = [run];
    mount(prince);
    click(get('[data-guide="option-3"]'));
    expect(container.querySelector(".narrative.is-resolved")).not.toBeNull();
    advanceTime(1799);
    expect(container.querySelector('[data-screen="map"]')).toBeNull();
    advanceTime(1);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(0);
    expect(loadPrince()!.numRelationalEncounters).toBe(31);
    expect(container.querySelector("[data-intro]")).toBeNull();
    advanceTime(5000);
    expect(loadPrince()!.numRelationalEncounters).toBe(31);
  });
});
