import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameTest } from "./game-layout";
import { createStubPrince } from "./fixtures";
import { beginRun, enterNode } from "@/game/run";
import { eligibleNext } from "@/game/map-gen";
import { combustionCeiling } from "@/game/combust";
import { loadPrince, savePrince } from "@/state/prince";
import { saveDevSettings } from "@/state/settings";
import { CHORUS, chorusRuler } from "@/copy/chorus";
import { playNecessityNote, setTheme } from "@/audio/engine";
import type { Prince, Run } from "@/game/types";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playUISound: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn() }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "requestAnimationFrame", "cancelAnimationFrame"] });
  vi.setSystemTime(new Date("2026-11-07T12:00:00Z"));
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
function withoutChorus(run: Run) {
  const { chorus: _, ...encounter } = run.encounter!;
  return { ...run, encounter };
}

describe("chorus entry", () => {
  it.each(["relational", "narrative"] as const)("commits %s once, holds its lifecycle, and persists Continue", (kind) => {
    const { prince, run, nodeId } = setup(kind);
    const expected = enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: prince.numRelationalEncounters });
    mount(prince);
    const chart = document.querySelector(".chart-layout-chart .chart-svg");
    click(`[data-guide="node-${nodeId}"]`);
    const committed = current();
    expect(withoutChorus(committed)).toEqual(expected);
    const ruler = chorusRuler(committed.encounter!);
    expect(CHORUS[ruler].some((p) => p.text === committed.encounter!.chorus!.text)).toBe(true);
    expect(document.querySelector(".chorus-name")!.textContent).toBe(ruler);
    expect(document.querySelector(".chorus-passage")!.textContent).toBe(committed.encounter!.chorus!.text);
    const source = document.querySelector<HTMLAnchorElement>(".chorus-attribution a")!;
    expect(source.href).toBe(committed.encounter!.chorus!.source_url);
    expect(source.target).toBe("_blank");
    expect(setTheme).toHaveBeenLastCalledWith(ruler, kind);
    expect(document.querySelector(".chart-layout-chart .chart-svg")).toBe(chart);
    expect(document.querySelector('.chart-layout-chart [role="button"]')).toBeNull();
    expect(document.querySelector(".chorus-modal")!.contains(document.activeElement)).toBe(true);
    act(() => vi.advanceTimersByTime(60_000));
    expect(current()).toEqual(committed);
    expect(document.querySelector(".necessity-opening, .guide-overlay, .relational-foot, .narrative-column")).toBeNull();
    expect(playNecessityNote).not.toHaveBeenCalled();
    reload();
    expect(current()).toEqual(committed);
    expect(document.querySelector(".chorus-passage")!.textContent).toBe(committed.encounter!.chorus!.text);
    click(".chorus-continue");
    expect(current()).toEqual(expected);
    expect(document.querySelector(".chorus-modal")).toBeNull();
    expect(document.querySelector(kind === "relational" ? ".relational-foot" : ".narrative-column")).not.toBeNull();
    reload();
    expect(current().encounter).not.toHaveProperty("chorus");
    expect(document.querySelector(".chorus-modal")).toBeNull();
  });

  it.each(["close", "backdrop", "Escape"])("%s reveals the committed encounter without applying entry again", (method) => {
    const { prince, nodeId } = setup("narrative");
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    const expected = withoutChorus(current());
    if (method === "Escape") act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    else click(method === "close" ? ".info-card-close" : ".chorus-modal");
    expect(current()).toEqual(expected);
    expect(document.querySelector(".chorus-modal")).toBeNull();
    expect(document.querySelector(".narrative-column")).not.toBeNull();
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
    expect(current().encounter).toMatchObject({ kind: "narrative", house: 8, chorus: expect.any(Object) });
    act(() => root.unmount());
    root = createRoot(container);
    saveDevSettings({ unlockAll: true, forceRelational: true, forceNarrativeHouse: null });
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    expect(current().encounter).toMatchObject({ kind: "relational", chorus: expect.any(Object) });
  });

  it("keeps a roster wiped on entry behind the chorus, then plays and advances", () => {
    const prince = createStubPrince({ numRelationalEncounters: 0 });
    const { run, nodeId } = setup("relational", prince);
    run.state.Moon.affliction = combustionCeiling(prince.chart.planets.Moon) - 1;
    // Find a deterministic ordinary entry where Necessity combusts the last planet.
    for (let seed = 0; seed < 100; seed++) {
      run.map.seed = seed;
      if (enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: 0 }).encounter!.resolved) break;
    }
    mount(prince);
    click(`[data-guide="node-${nodeId}"]`);
    expect(current().encounter).toMatchObject({ resolved: true, chorus: expect.any(Object) });
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

  it("resumes an existing save without a chorus field normally", () => {
    const { prince, run, nodeId } = setup("narrative");
    prince.runs = [enterNode({ run, chart: prince.chart, nodeId, lifetimeRelationalEncounterCount: 64 })];
    mount(prince);
    expect(document.querySelector(".chorus-modal")).toBeNull();
    expect(document.querySelector(".narrative-column")).not.toBeNull();
  });
});
