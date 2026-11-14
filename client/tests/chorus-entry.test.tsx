import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameTest } from "./game-layout";
import { createStubPrince } from "./fixtures";
import { beginRun, enterNode, isOver } from "@/game/run";
import { getScenario } from "@/data/narrative-scenarios";
import { PILOT_SCENES, pilotState } from "./narrative-pilot-fixtures";
import { eligibleNext } from "@/game/map-gen";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { randomSeed } from "@/game/rng";
import { loadPrince, savePrince } from "@/state/prince";
import { saveDevSettings } from "@/state/settings";
import { CHORUS, chorusRuler } from "@/copy/chorus";
import { playNecessityNote, setTheme } from "@/audio/engine";
import type { Prince } from "@/game/types";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playUISound: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn() }));
vi.mock("@/game/rng", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/game/rng")>(), randomSeed: vi.fn(),
}));
const ENTRY_SEED = 7;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(randomSeed).mockReturnValue(ENTRY_SEED);
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "requestAnimationFrame", "cancelAnimationFrame"] });
  vi.setSystemTime(new Date("2026-11-07T12:00:00Z"));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("SVGLineElement", class {});
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
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
function click(selector: string) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}
function current() { return loadPrince()!.runs.at(-1)!; }
function setup(kind: "relational" | "narrative", prince = createStubPrince(), seed = 42) {
  const run = beginRun(prince.chart, seed, prince.numRelationalEncounters);
  run.map.boundary = undefined;
  const nodeId = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
  run.map.rolledNodes[nodeId] = kind === "relational" ? { kind, opponentSeed: 99 } : { kind, house: 4 };
  prince.runs = [run];
  return { prince, run, nodeId };
}
function mount(prince: Prince) {
  savePrince(prince);
  act(() => root.render(<GameTest path="/play" />));
  if (document.querySelector(".guide-close")) click(".guide-close");
}
function reload() {
  act(() => root.unmount());
  root = createRoot(container);
  act(() => root.render(<GameTest path="/play" />));
}
describe("chorus entry", () => {
  it.each(["relational", "narrative"] as const)("commits %s once and holds its lifecycle without storing presentation state", (kind) => {
    const { prince, run, nodeId } = setup(kind);
    const expected = enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: prince.numRelationalEncounters, encounterIdSeed: ENTRY_SEED });
    mount(prince);
    // GameLayout draws a decorative title chart on each mount, independently of entry.
    expect(randomSeed).toHaveBeenCalledTimes(1);
    vi.mocked(randomSeed).mockClear();
    const chart = document.querySelector(".chart-layout-chart .chart-svg");
    click(`[data-guide="node-${nodeId}"]`);
    const committed = current();
    expect(randomSeed).toHaveBeenCalledTimes(1);
    expect(committed).toEqual(expected);
    expect(committed.encounter).not.toHaveProperty("chorus");
    const ruler = chorusRuler(committed.encounter!);
    const passage = CHORUS[ruler].find((p) => p.text === document.querySelector(".chorus-passage")!.textContent)!;
    expect(passage).toBeDefined();
    expect(document.querySelector(".chorus-name")!.textContent).toBe(ruler);
    const source = document.querySelector<HTMLAnchorElement>(".chorus-attribution a")!;
    expect(source.href).toBe(passage.source_url);
    expect(source.target).toBe("_blank");
    expect(setTheme).toHaveBeenLastCalledWith(ruler, kind);
    expect(document.querySelector(".chart-layout-chart .chart-svg")).toBe(chart);
    expect(document.querySelector('.chart-layout-chart [role="button"]')).toBeNull();
    expect(document.querySelector(".chorus-modal")!.contains(document.activeElement)).toBe(true);
    act(() => vi.advanceTimersByTime(60_000));
    expect(current()).toEqual(committed);
    expect(document.querySelector(".necessity-opening, .guide-overlay, .relational-foot, .narrative-column")).toBeNull();
    expect(playNecessityNote).not.toHaveBeenCalled();
    click(".chorus-continue");
    expect(current()).toEqual(expected);
    expect(document.querySelector(".chorus-modal")).toBeNull();
    expect(document.querySelector(kind === "relational" ? ".relational-foot" : ".narrative-column")).not.toBeNull();
    act(() => root.render(<GameTest path="/play" />));
    expect(document.querySelector(".chorus-modal")).toBeNull();
    expect(randomSeed).toHaveBeenCalledTimes(1);
  });

  it.each(["relational", "narrative"] as const)("keeps %s gameplay while passage selection changes on reload", (kind) => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      const { prince, nodeId } = setup(kind);
      mount(prince);
      vi.mocked(randomSeed).mockClear();
      click(`[data-guide="node-${nodeId}"]`);
      const committed = current();
      const pool = CHORUS[chorusRuler(committed.encounter!)];
      expect(document.querySelector(".chorus-passage")!.textContent).toBe(pool[0]!.text);
      random.mockReturnValue(0.999);
      vi.mocked(randomSeed).mockReturnValue(999);
      act(() => root.render(<GameTest path="/play" />));
      expect(document.querySelector(".chorus-passage")!.textContent).toBe(pool[0]!.text);
      reload();
      expect(document.querySelector(".chorus-passage")!.textContent).toBe(pool.at(-1)!.text);
      expect(current()).toEqual(committed);
      expect(randomSeed).toHaveBeenCalledTimes(2); // Entry plus the reloaded layout's sample chart.
      click(".chorus-continue");
      expect(current()).toEqual(committed);
      random.mockReturnValue(0);
      reload();
      expect(document.querySelector(".chorus-passage")!.textContent).toBe(pool[0]!.text);
      expect(current()).toEqual(committed);
      expect(randomSeed).toHaveBeenCalledTimes(3);
    } finally {
      random.mockRestore();
    }
  });

  it.each((["relational", "narrative"] as const).flatMap((kind) =>
    ["close", "backdrop", "Escape"].map((method) => ({ kind, method })),
  ))("$method reveals the committed $kind encounter without applying entry again", ({ kind, method }) => {
    const { prince, nodeId } = setup(kind);
    mount(prince);
    vi.mocked(randomSeed).mockClear();
    click(`[data-guide="node-${nodeId}"]`);
    const expected = current();
    if (method === "Escape") act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    else click(method === "close" ? ".info-card-close" : ".chorus-modal");
    expect(current()).toEqual(expected);
    expect(document.querySelector(".chorus-modal")).toBeNull();
    expect(document.querySelector(kind === "relational" ? ".relational-foot" : ".narrative-column")).not.toBeNull();
    expect(randomSeed).toHaveBeenCalledTimes(1);
  });

  it("contains keyboard focus and places it on the encounter when no guide opens", () => {
    const { prince, nodeId, run } = setup("narrative");
    prince.runs = [beginRun(prince.chart, 1, 64), run]; // Established Prince: no first-sight guide.
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    const stage = document.querySelector<HTMLElement>(".info-card-stage")!;
    act(() => stage.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true })));
    expect(document.activeElement).toBe(document.querySelector(".chorus-continue"));
    act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })));
    expect(document.activeElement).toBe(document.querySelector(".info-card-close"));
    click(".chorus-continue");
    act(() => vi.runOnlyPendingTimers());
    expect(document.activeElement).toBe(document.querySelector(".chart-layout"));
  });

  it("preserves both development force controls through real map entry", () => {
    const { prince, nodeId } = setup("relational");
    saveDevSettings({ unlockAll: true, forceRelational: false, forceNarrativeHouse: 8 });
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    expect(current().encounter).toMatchObject({ kind: "narrative", house: 8 });
    act(() => root.unmount());
    root = createRoot(container);
    saveDevSettings({ unlockAll: true, forceRelational: true, forceNarrativeHouse: null });
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    expect(current().encounter).toMatchObject({ kind: "relational" });
  });

  it("keeps a roster wiped on entry behind the chorus, then plays and advances", () => {
    const prince = createStubPrince({ numRelationalEncounters: 0 });
    const { run, nodeId } = setup("relational", prince);
    run.state.Moon.tension = getEffectiveStatsFromPlacement(prince.chart.planets.Moon).resolve - 1;
    // Find a deterministic ordinary entry where Necessity combusts the last planet.
    for (let seed = 0; seed < 100; seed++) {
      if (enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: 0, encounterIdSeed: seed }).encounter!.resolved) {
        vi.mocked(randomSeed).mockReturnValue(seed);
        break;
      }
    }
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    expect(current().encounter).toMatchObject({ resolved: true });
    act(() => vi.advanceTimersByTime(60_000));
    expect(current().encounter).not.toBeNull();
    expect(loadPrince()!.numRelationalEncounters).toBe(0);
    expect(document.querySelector(".necessity-opening")).toBeNull();
    click(".chorus-continue");
    expect(document.querySelector(".necessity-opening")).not.toBeNull();
    act(() => vi.runOnlyPendingTimers());
    act(() => vi.runOnlyPendingTimers());
    expect(current().encounter).toBeNull();
    expect(loadPrince()!.numRelationalEncounters).toBe(1);
  });

  it("shows a chorus for an existing encounter save before resuming", () => {
    const { prince, run, nodeId } = setup("narrative");
    prince.runs = [enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: 64 })];
    mount(prince);
    vi.mocked(randomSeed).mockClear();
    expect(document.querySelector(".chorus-modal")).not.toBeNull();
    expect(document.querySelector(".narrative-column")).toBeNull();
    click(".chorus-continue");
    expect(document.querySelector(".narrative-column")).not.toBeNull();
    expect(randomSeed).not.toHaveBeenCalled();
  });

  it("keeps a fatal pilot choice's full reward through the chorus and normal run-ended map flow", () => {
    const scene = getScenario("hidden-cancer-seawall");
    const { prince, run } = pilotState(scene, {
      name: "first-near-combustion-penniless", tier: 0, condition: "near combustion", light: 0,
    });
    const nodeId = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
    run.encounter = null;
    run.mapsCompleted = 1;
    run.map.boundary = undefined;
    run.map.rolledNodes[nodeId] = { kind: "narrative", house: 12 };
    run.seenScenarioIds = PILOT_SCENES.filter((s) => s.house === 12 && s !== scene).map((s) => s.scenarioId);
    prince.runs = [run];
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    expect(current().encounter).toMatchObject({ scenarioId: scene.scenarioId, resolved: false });
    expect(current().state).toEqual(run.state);
    click(".chorus-continue");
    const evening = scene.options.find((option) => option.id === "evening")!;
    const row = [...document.querySelectorAll(".option")].find((el) => el.textContent?.includes(evening.text))!;
    act(() => row.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    act(() => document.querySelector('[data-guide="planet-self-moon"]')!
      .dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(document.querySelector(".ps-effect")!.textContent).toBe("Afflict 1");
    expect(current().light).toBe(0);
    click('[data-guide="planet-self-moon"]');
    expect(current()).toMatchObject({ light: 144, encounter: { resolved: true } });
    expect(current().map.outcomes[nodeId]).toMatchObject({ lightDelta: 144, combusts: ["Moon"] });
    expect(isOver(current(), prince.chart, 0)).toBe(true);
    act(() => vi.advanceTimersByTime(2800));
    expect(current().encounter).toBeNull();
    expect(current().light).toBe(144);
    expect(loadPrince()!.numRelationalEncounters).toBe(0);
    expect(document.querySelector(".begin-btn")!.textContent).toBe("New Run");
    reload();
    expect(current().encounter).toBeNull();
    expect(current().light).toBe(144);
    expect(document.querySelector(".chorus-modal")).toBeNull();
  });
});
