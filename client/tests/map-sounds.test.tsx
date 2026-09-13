import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapDiagram } from "@/components/MapDiagram";
import { MapScreen } from "@/screens/MapScreen";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { playUISound } from "@/audio/engine";
import { eligibleNext } from "@/game/map-gen";
import { beginRun } from "@/game/run";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playUISound: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
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
  vi.unstubAllGlobals();
  localStorage.clear();
});

function get(selector: string) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
function click(selector: string) {
  act(() => get(selector).dispatchEvent(new MouseEvent("click", { bubbles: true })));
}
function press(selector: string, repeat = false) {
  const event = new KeyboardEvent("keydown", { key: " ", repeat, bubbles: true, cancelable: true });
  act(() => get(selector).dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
}
function setup() {
  const prince = createStubPrince();
  const run = beginRun(42, prince.numEncounters);
  prince.runs = [run];
  savePrince(prince);
  const next = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
  return { prince, map: run.map, node: `[data-guide="node-${next}"]` };
}
const cues = () => vi.mocked(playUISound).mock.calls.map(([cue]) => cue);

describe("map feedback", () => {
  it("uses the same preview/commit cues for keyboard activation without committing on key repeat", () => {
    const { prince, node } = setup();
    act(() => root.render(<PrinceStoreProvider><MapScreen /></PrinceStoreProvider>));
    press(node);
    press(node, true);
    expect(cues()).toEqual(["select"]);
    expect(loadPrince()).toEqual(prince);
    press(node);
    expect(cues()).toEqual(["select", "commit"]);
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
  });

  it("dismisses a selected node once and leaves passive thumbnails silent", () => {
    const { map, node } = setup();
    act(() => root.render(<MapDiagram map={map} onSelectNode={vi.fn()} />));
    click(node);
    click('[data-guide="map"]');
    click('[data-guide="map"]');
    expect(cues()).toEqual(["select", "dismiss"]);
    act(() => root.render(<MapDiagram map={map} />));
    vi.mocked(playUISound).mockClear();
    click(node);
    expect(cues()).toEqual([]);
    expect(get(node).closest('[role="button"]')).toBeNull();
  });

  it("never sounds a commitment while the map guide blocks entering a node", () => {
    const { prince, node } = setup();
    act(() => root.render(<PrinceStoreProvider><MapScreen /></PrinceStoreProvider>));
    click('.screen-help-button');
    vi.mocked(playUISound).mockClear();
    click(node);
    click(node);
    expect(cues()).toEqual(["select"]);
    expect(loadPrince()).toEqual(prince);
  });
});
