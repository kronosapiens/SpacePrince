import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chart } from "@/components/Chart";
import { PLANETS } from "@/game/data";
import { combustionCeiling } from "@/game/combust";
import { eligibleNext } from "@/game/map-gen";
import { beginRun } from "@/game/run";
import { loadPrince, savePrince } from "@/state/prince";
import { createStubPrince } from "./fixtures";
import { GameTest } from "./game-layout";
import { AFFLICTION_ARC_R } from "@/svg/viewbox";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({
  setTheme: vi.fn(), playUISound: vi.fn(), playStrike: vi.fn(), playCombust: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("SVGLineElement", class {});
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function element(selector: string) {
  const found = container.querySelector(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
}
function click(selector: string) {
  act(() => element(selector).dispatchEvent(new MouseEvent("click", { bubbles: true })));
}
function playerChart() {
  return element(".chart-layout-chart .chart-svg");
}
function planetPositions() {
  return [...playerChart().querySelectorAll('[data-guide^="planet-self-"]')]
    .map((planet) => planet.closest("g[transform]")!.getAttribute("transform"));
}

describe("shared player chart", () => {
  it("keeps the same wheel through combat, narrative choices, and both returns to Map", () => {
    const prince = createStubPrince();
    const run = beginRun(42, prince.numEncounters);
    const combatNode = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
    const narrativeNode = eligibleNext(run.map.graph, combatNode, [...run.map.visitedNodeIds, combatNode])[0]!;
    run.map.rolledNodes[combatNode] = { kind: "combat", opponentSeed: 99 };
    run.map.rolledNodes[narrativeNode] = { kind: "narrative", house: 2 };
    run.seenScenarioIds = ["livelihood-coin"];
    prince.runs = [run];
    savePrince(prince);
    act(() => root.render(<GameTest path="/play" />));

    const chart = playerChart();
    const positions = planetPositions();
    const expectStableChart = () => {
      expect(playerChart()).toBe(chart);
      expect(planetPositions()).toEqual(positions);
    };

    click(`[data-guide="node-${combatNode}"]`);
    expectStableChart();
    expect(element('[data-guide="chart-other"] .chart-svg')).not.toBe(chart);
    expect(container.querySelectorAll(".chart-svg")).toHaveLength(2);
    click('[data-guide="planet-self-moon"]');
    click('[data-guide="action-testimony"]');
    const combat = loadPrince()!.runs[0]!.encounter;
    expect(combat?.kind).toBe("combat");
    if (combat?.kind !== "combat") throw new Error("Expected combat encounter");
    expect(combat.log).toHaveLength(1);
    expect(combat.log[0]).toMatchObject({ playerPlanet: "Moon", playerValence: "Testimony" });
    expect(combat.resolved).toBe(true);
    expectStableChart();

    act(() => vi.runOnlyPendingTimers());
    expect(element(".combat").classList.contains("is-resolved")).toBe(true);
    expectStableChart();
    click(".chart-layout-chart");
    expect(element(".map-content")).toBeDefined();
    expect(container.querySelectorAll(".chart-svg")).toHaveLength(1);
    expectStableChart();
    const afterCombat = loadPrince()!;
    expect(afterCombat.runs[0]!.map.outcomes[combatNode]?.kind).toBe("combat");
    expect(afterCombat.numEncounters).toBe(prince.numEncounters + 1);

    click(`[data-guide="node-${narrativeNode}"]`);
    expectStableChart();
    expect(element('[data-guide="option-2"]').textContent).toContain("Work only the loose embroidery.");
    click('[data-guide="option-2"]');
    expect(loadPrince()!.runs[0]!.encounter?.resolved).toBe(false);
    const target = PLANETS.find((planet) => afterCombat.runs[0]!.state[planet].affliction === 0)!;
    click(`[data-guide="planet-self-${target.toLowerCase()}"]`);
    const afterNarrative = loadPrince()!.runs[0]!;
    expect(afterNarrative.encounter?.resolved).toBe(true);
    expect(afterNarrative.state[target].affliction).toBe(24);
    expect(afterNarrative.light).toBe(afterCombat.runs[0]!.light + 12);
    expect(element(".narrative").classList.contains("is-resolved")).toBe(true);
    expectStableChart();

    click(".chart-layout-chart");
    expect(element(".map-content")).toBeDefined();
    expect(container.querySelector(".narrative-column")).toBeNull();
    expectStableChart();
    expect(loadPrince()!.runs[0]!.encounter).toBeNull();
    expect(loadPrince()!.numEncounters).toBe(prince.numEncounters + 2);
    click(`[data-guide="planet-self-${target.toLowerCase()}"]`);
    const ceiling = combustionCeiling(prince.chart.planets[target]);
    expect(element(".ps-ratio").textContent).toBe(`Resolve${ceiling - 24}/${ceiling}`);
    expect(container.querySelector(".ps-actions")).toBeNull();
  });

  it("switches Title samples without interpolating planet positions", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValue(0.9);
    const frame = vi.spyOn(window, "requestAnimationFrame");
    act(() => root.render(<GameTest />));
    const chart = playerChart();
    const positions = planetPositions();
    frame.mockClear();

    act(() => vi.advanceTimersByTime(3000));

    expect(playerChart()).toBe(chart);
    expect(planetPositions()).not.toEqual(positions);
    expect(frame).not.toHaveBeenCalled();
  });
});

describe("affliction arcs", () => {
  it("uses two degrees per point for capacity, remaining Resolve, and projections", () => {
    const chart = createStubPrince().chart;
    chart.planets.Moon.base.resolve = 180;
    chart.planets.Moon.buffs.resolve = 0;
    const arc = '[data-guide="arc-self-moon"]';
    act(() => root.render(<Chart chart={chart} side="self"
      projection={{ deltas: { Moon: { delta: 180, polarity: "Affliction" } } }} />));

    // Full capacity, remaining Resolve, and a lethal preview all fill the circle.
    expect(container.querySelectorAll(`${arc} > circle`)).toHaveLength(2);
    expect(element(`${arc} .arc-diff circle`)).toBeDefined();
    expect(element(arc).querySelector("path")).toBeNull();

    act(() => root.render(<Chart chart={chart} side="self"
      state={{ Moon: { affliction: 90 } }}
      projection={{ deltas: { Moon: { delta: 45, polarity: "Affliction" } } }} />));

    // 90 remaining points sweep a semicircle from noon to the combustion anchor.
    const coordinates = (selector: string) => element(selector).getAttribute("d")!
      .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!.map(Number);
    const remaining = coordinates(`${arc} > path`);
    expect(remaining[0]).toBeCloseTo(0);
    expect(remaining[1]).toBeCloseTo(-AFFLICTION_ARC_R);
    expect(remaining[7]).toBeCloseTo(0);
    expect(remaining[8]).toBeCloseTo(AFFLICTION_ARC_R);

    // A 45-point preview covers the first quarter-circle of that remaining span.
    const projected = coordinates(`${arc} .arc-diff path`);
    expect(projected[0]).toBeCloseTo(0);
    expect(projected[1]).toBeCloseTo(-AFFLICTION_ARC_R);
    expect(projected[7]).toBeCloseTo(-AFFLICTION_ARC_R);
    expect(projected[8]).toBeCloseTo(0);
  });
});
