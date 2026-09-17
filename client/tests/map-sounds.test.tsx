import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapDiagram } from "@/components/MapDiagram";
import { GameTest } from "./game-layout";
import { loadPrince, savePrince } from "@/state/prince";
import { playUISound } from "@/audio/engine";
import { buildMapGraph, eligibleNext } from "@/game/map-gen";
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
function press(selector: string, key: string, repeat = false) {
  const event = new KeyboardEvent("keydown", { key, repeat, bubbles: true, cancelable: true });
  act(() => get(selector).dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
}
function setup() {
  const prince = createStubPrince();
  const run = beginRun(42, prince.numEncounters);
  prince.runs = [run];
  savePrince(prince);
  const next = eligibleNext(run.map.graph, run.map.currentNodeId, run.map.visitedNodeIds)[0]!;
  return { prince, map: run.map, next, node: `[data-guide="node-${next}"]` };
}
const cues = () => vi.mocked(playUISound).mock.calls.map(([cue]) => cue);

describe("map feedback", () => {
  it.each(["Enter", " "])("travels on the first %j activation and ignores key repeat", (key) => {
    const { prince, node, next } = setup();
    act(() => root.render(<GameTest path="/play" />));
    press(node, key, true);
    expect(cues()).toEqual([]);
    expect(loadPrince()).toEqual(prince);
    press(node, key);
    expect(cues()).toEqual(["commit"]);
    expect(loadPrince()!.runs[0]!.map.currentNodeId).toBe(next);
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
  });

  it("travels on the first click with one commit cue", () => {
    const { node, next } = setup();
    act(() => root.render(<GameTest path="/play" />));
    click(node);
    expect(cues()).toEqual(["commit"]);
    expect(loadPrince()!.runs[0]!.map.currentNodeId).toBe(next);
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
  });

  it("previews a route on hover or focus, preserving focus when the pointer leaves", () => {
    const { map } = setup();
    map.graph = buildMapGraph(42, { forced: [2, 1, 1, 1, 1] });
    const node = '[data-guide="node-2L"]';
    const onSelectNode = vi.fn();
    act(() => root.render(<MapDiagram map={map} onSelectNode={onSelectNode} />));
    const control = get(node).closest('[role="button"]')!;
    const previewedRoute = () => container.querySelector('line[stroke-opacity="0.75"]');
    const ring = () => control.querySelector('.invite-ring')!;
    expect(previewedRoute()).toBeNull();
    act(() => control.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(previewedRoute()).not.toBeNull();
    expect(ring().classList.contains("anim-invite-ring")).toBe(false);
    act(() => control.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
    expect(previewedRoute()).toBeNull();
    act(() => control.dispatchEvent(new FocusEvent("focusin", { bubbles: true })));
    expect(previewedRoute()).not.toBeNull();
    act(() => control.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    act(() => control.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
    expect(previewedRoute()).not.toBeNull();
    expect(ring().classList.contains("anim-invite-ring")).toBe(false);
    const other = [...container.querySelectorAll('[role="button"]')].find((el) => el !== control)!;
    act(() => other.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(ring().classList.contains("anim-invite-ring")).toBe(false);
    act(() => other.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
    act(() => control.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    expect(previewedRoute()).toBeNull();
    expect(ring().classList.contains("anim-invite-ring")).toBe(true);
    expect(onSelectNode).not.toHaveBeenCalled();
  });

  it("leaves background clicks and passive thumbnails silent", () => {
    const { map, node } = setup();
    const onSelectNode = vi.fn();
    act(() => root.render(<MapDiagram map={map} onSelectNode={onSelectNode} />));
    click(node);
    expect(onSelectNode).toHaveBeenCalledOnce();
    expect(get(node).closest('[role="button"]')?.hasAttribute("aria-pressed")).toBe(false);
    click('[data-guide="map"]');
    expect(cues()).toEqual([]);
    act(() => root.render(<MapDiagram map={map} />));
    click(node);
    expect(onSelectNode).toHaveBeenCalledOnce();
    expect(cues()).toEqual([]);
    expect(get(node).closest('[role="button"]')).toBeNull();
  });

  it("never sounds a commitment while the map guide blocks entering a node", () => {
    const { prince, node } = setup();
    act(() => root.render(<GameTest path="/play" />));
    click('.screen-help-button');
    vi.mocked(playUISound).mockClear();
    click(node);
    press(node, "Enter");
    expect(cues()).toEqual([]);
    expect(loadPrince()).toEqual(prince);
  });
});
