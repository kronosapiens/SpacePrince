import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameTest } from "./game-layout";
import { useInfoCards } from "@/state/InfoCardContext";
import { loadPrince, savePrince } from "@/state/prince";
import { beginRelationalEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { beginRun, enterNode, isOver } from "@/game/run";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { eligibleNext } from "@/game/map-gen";
import { unlockedPlanets } from "@/game/unlocks";
import { TIMINGS } from "@/svg/timings";
import { playUISound } from "@/audio/engine";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn(), playUISound: vi.fn() }));
vi.mock("@/screens/MapScreen", () => ({ MapScreen: () => <div data-screen="map" /> }));
vi.mock("@/components/InfoCardHost", () => ({
  InfoCardHost: () => {
    const { current } = useInfoCards();
    return current ? <div data-card>{current.kind === "planet-intro" ? current.planet : current.runId}</div> : null;
  },
}));

const openingTiming = TIMINGS.necessity;
const perPlanet = openingTiming.reveal + openingTiming.settle;
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
const noteLabels = () => [...document.querySelectorAll(".guide-note .guide-note-label")].map((el) => el.textContent);
const click = (el: Element) => act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const advanceTime = (ms: number) => act(() => vi.advanceTimersByTime(ms));
function commit(verb = "Afflict") {
  click(get('[data-guide="planet-self-moon"]'));
  const action = Array.from(container.querySelectorAll(".ps-action")).find(el => el.textContent?.startsWith(verb))!;
  click(action);
}
function settle() {
  let steps = 0;
  while (!container.querySelector(".relational-continue") && steps++ < 200) {
    expect(container.querySelector(".relational")).not.toBeNull();
    expect(container.querySelector("[data-screen]")).toBeNull();
    act(() => vi.advanceTimersToNextTimer());
  }
  expect(container.querySelector(".relational-continue")).not.toBeNull();
}

describe("encounter advancement", () => {
  it("plays both entry-wipe openings before clearing and lets an unlock rescue the run", () => {
    const { prince, run, encounter } = entryWipe(31);
    mount(prince, false);
    const committed = structuredClone(run);
    expect(container.querySelectorAll(".necessity-opening")).toHaveLength(2);
    expect(get(".relational-turns-v").textContent).toBe(`0/${encounter.sequence.length}`);
    expect(container.querySelector(".relational-continue")).toBeNull();
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
    expect(container.querySelector(".relational-continue")).toBeNull();
    expect(loadPrince()!.runs[0]).toEqual(committed);
    advanceTime(1);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(get(".relational-turns-v").textContent).toBe(`0/${encounter.sequence.length}`);
    expect(loadPrince()!.numRelationalEncounters).toBe(31);
    expect(container.querySelector("[data-card]")).toBeNull();
    advanceTime(TIMINGS.arrival.guide);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    click(get(".relational-continue"));

    const after = loadPrince()!;
    expect(after.numRelationalEncounters).toBe(32);
    expect(after.runs[0]!.encounter).toBeNull();
    expect(after.runs[0]!.light).toBe(96);
    expect(after.runs[0]!.state.Saturn.tension).toBe(0);
    expect(isOver(after.runs[0]!, after.chart, after.numRelationalEncounters)).toBe(false);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    advanceTime(TIMINGS.arrival.card);
    expect(get("[data-card]").textContent).toBe("Saturn");
    advanceTime(5000);
    expect(loadPrince()!.numRelationalEncounters).toBe(32);
  });

  it("settles a fatal entry wipe immediately with reduced motion, clears it only once, and queues the run's star", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { prince, encounter } = entryWipe(64);
    mount(prince, false);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(get(".relational-turns-v").textContent).toBe(`0/${encounter.sequence.length}`);
    expect(container.querySelector(".ps-action")).toBeNull();
    const leave = get(".relational-continue");
    act(() => {
      leave.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      leave.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const after = loadPrince()!;
    expect(after.numRelationalEncounters).toBe(65);
    expect(after.runs[0]!.encounter).toBeNull();
    expect(after.runs[0]!.light).toBe(96);
    expect(isOver(after.runs[0]!, after.chart, after.numRelationalEncounters)).toBe(true);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(container.querySelector("[data-card]")).toBeNull();
    advanceTime(TIMINGS.arrival.card);
    expect(get("[data-card]").textContent).toBe(after.runs[0]!.id);
    advanceTime(5000);
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
  });

  it("opens a first encounter's guide a moment after its opening finishes, never during it", () => {
    const { prince, run, encounter } = relational(2);
    run.mapsCompleted = 0;
    mount(prince, false);
    const guide = () => document.querySelector('[role="dialog"]');
    const opening = Math.max(encounter.necessity?.length ?? 0, encounter.selfNecessity?.length ?? 0) * perPlanet;
    expect(opening).toBeGreaterThan(TIMINGS.arrival.guide);
    advanceTime(opening - 1);
    expect(container.querySelector(".necessity-opening")).not.toBeNull();
    expect(guide()).toBeNull();
    advanceTime(1);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    advanceTime(TIMINGS.arrival.guide - 1);
    expect(guide()).toBeNull();
    advanceTime(1);
    expect(guide()!.getAttribute("aria-label")).toBe("Read the encounter");
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

  it("waits after playback until Continue, ignoring the background and the charts, then leaves once", () => {
    const { prince } = relational();
    mount(prince);
    commit("Testify");
    const committed = loadPrince()!;
    const encounter = committed.runs[0]!.encounter!;
    expect(encounter.resolved).toBe(true);
    expect(encounter.kind === "relational" && encounter.log[0]!.propagation.length).toBeGreaterThan(0);
    expect(container.querySelector(".relational-continue")).toBeNull();
    click(get(".relational"));
    click(get('[data-guide="planet-self-moon"]'));
    expect(container.querySelector(".relational-continue")).toBeNull();
    settle();
    expect(document.activeElement).toBe(get(".relational-continue"));
    advanceTime(60_000);
    click(get(".relational"));
    click(get('[data-guide="planet-self-moon"]'));
    click(get('[data-guide="chart-other"]'));
    expect(container.querySelector('[data-screen="map"]')).toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
    vi.mocked(playUISound).mockClear();
    const leave = get(".relational-continue");
    act(() => {
      leave.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      leave.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(vi.mocked(playUISound).mock.calls).toEqual([["select"]]);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(committed.runs[0]!.light);
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
  });

  it("keeps the guide on a finished encounter with only what is still on the board, and holds Continue while it is open", () => {
    const { prince } = relational();
    mount(prince);
    commit();
    settle();
    click(get('[aria-label="Study this encounter"]'));
    expect(noteLabels()).toEqual(["Self", "Ruler and scoring"]);
    click(get(".relational-continue"));
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
    click(document.querySelector(".guide-close")!);
    click(get(".relational-continue"));
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
  });

  it("keeps an encounter open between turns", () => {
    const { prince } = relational(2);
    mount(prince);
    commit();
    act(() => vi.runAllTimers());
    expect(loadPrince()!.runs[0]!.encounter?.resolved).toBe(false);
    expect(container.querySelector(".relational")).not.toBeNull();
    expect(container.querySelector(".relational-continue")).toBeNull();
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(".necessity-arc")).toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).toMatchObject({ turnIndex: 1 });
    expect(loadPrince()!.numRelationalEncounters).toBe(64);
  });

  it("leaves a restored resolved encounter on Continue without replaying or paying again", () => {
    const { prince, run, encounter } = relational();
    encounter.resolved = true;
    encounter.turnIndex = 1;
    run.light = 96;
    mount(prince);
    // The frame that settles focus after the chorus leaves Continue holding it.
    advanceTime(100);
    expect(document.activeElement).toBe(get(".relational-continue"));
    click(get(".relational-continue"));
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(96);
    expect(loadPrince()!.numRelationalEncounters).toBe(65);
  });

  it("keeps the house guide on a finished scene with only its house note", () => {
    const prince = createStubPrince();
    const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
    run.encounter = beginNarrativeEncounter({ run, house: 4, scenarioId: "home-libra-mara" });
    run.mapsCompleted = 1;
    prince.runs = [run];
    mount(prince);
    click(get('[data-guide="option-3"]'));
    click(get('[aria-label="Study this scene"]'));
    expect(noteLabels()).toEqual(["The house"]);
  });

  it("keeps a house's scene after a choice and leaves on Continue once it has landed, without counting it", () => {
    const prince = createStubPrince({ numRelationalEncounters: 31 });
    const run = beginRun(prince.chart, 42, prince.numRelationalEncounters);
    run.encounter = beginNarrativeEncounter({ run, house: 4, scenarioId: "home-libra-mara" });
    run.mapsCompleted = 1;
    prince.runs = [run];
    mount(prince);
    const scene = get(".narrative-body p").textContent;
    click(get('[data-guide="option-3"]'));
    expect(loadPrince()!.runs[0]!.encounter?.resolved).toBe(true);
    expect(get(".narrative-body p").textContent).toBe(scene);
    expect(get('[data-guide="option-3"]').classList.contains("is-selected")).toBe(true);
    advanceTime(TIMINGS.house.choice - 1);
    expect(container.querySelector(".narrative-continue")).toBeNull();
    advanceTime(1);
    expect(document.activeElement).toBe(get(".narrative-continue"));
    advanceTime(60_000);
    click(get('[data-guide="option-3"]'));
    click(get(".narrative"));
    expect(container.querySelector('[data-screen="map"]')).toBeNull();
    click(get(".narrative-continue"));
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(0);
    expect(loadPrince()!.numRelationalEncounters).toBe(31);
    expect(container.querySelector("[data-card]")).toBeNull();
  });
});
