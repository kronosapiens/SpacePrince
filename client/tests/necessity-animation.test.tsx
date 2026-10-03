import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useNecessityAnimation, NECESSITY_ANIMATION_TIMINGS as timing } from "@/components/useNecessityAnimation";
import { blankSideState, chartRuler, seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";

const audio = vi.hoisted(() => ({ play: vi.fn(), cancel: vi.fn() }));
vi.mock("@/audio/engine", () => ({ playNecessityNote: audio.play }));

type Input = Parameters<typeof useNecessityAnimation>[0];
let result: ReturnType<typeof useNecessityAnimation>;
let root: Root;
let reducedMotion: boolean;
const chart = seededChart(7);
function Probe(props: Input) { result = useNecessityAnimation(props); return null; }
function render(input: Input) { act(() => root.render(<Probe {...input} />)); }
function advance(ms: number) { act(() => vi.advanceTimersByTime(ms)); }
function input(): Input {
  const state = blankSideState();
  state.Moon.affliction = 30;
  return { id: "map-1", chart, state, necessity: [{ planet: "Moon", amount: 6, halved: true, draw: 12 }], enabled: true, kind: "map" };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  audio.play.mockReturnValue(audio.cancel);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  reducedMotion = false;
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion, addEventListener() {}, removeEventListener() {} }));
  root = createRoot(document.createElement("div"));
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("shows revival, necessity, Fortune, then committed state without mutation", () => {
  const props = input();
  props.uncombusts = [{ planet: "Moon", chance: 0.5, success: true }];
  render(props);
  expect(result.opening?.phase).toBe("revival");
  expect(result.opening?.revived).toEqual(["Moon"]);
  expect(result.state.Moon.affliction).toBe(combustionCeiling(chart.planets.Moon));
  advance(timing.revival);
  expect(result.opening?.phase).toBe("accent");
  advance(timing.map.accent);
  expect(result.opening?.phase).toBe("necessity");
  expect(result.state.Moon.affliction).toBe(24);
  advance(timing.map.necessity);
  expect(result.opening?.phase).toBe("fortune");
  expect(result.state.Moon.affliction).toBe(24);
  expect(result.opening?.entries).toEqual(props.necessity);
  advance(timing.map.fortune);
  expect(result.opening?.phase).toBe("settle");
  expect(result.state).toEqual(props.state);
  advance(timing.map.settle);
  expect(result.active).toBe(false);
  expect(result.opening).toBeUndefined();
  expect(props.state.Moon.affliction).toBe(30);
});
it("uses encounter timings and does not restart on ordinary rerenders", () => {
  const props = { ...input(), kind: "encounter" as const };
  render(props);
  advance(timing.encounter.accent + timing.encounter.necessity);
  render({ ...props, necessity: props.necessity?.map((entry) => ({ ...entry })) });
  expect(result.opening?.phase).toBe("fortune");
  advance(timing.encounter.fortune + timing.encounter.settle);
  render({ ...props });
  expect(result.active).toBe(false);
  render({ ...props, id: "encounter-2" });
  expect(result.opening?.phase).toBe("accent");
});
it("preserves missing raw draws in old records", () => {
  const props = input();
  delete props.necessity![0]!.draw;
  render(props);
  advance(timing.map.accent + timing.map.necessity);
  expect(result.opening?.phase).toBe("fortune");
  expect(result.opening?.entries[0]?.draw).toBeUndefined();
  expect(result.state.Moon.affliction).toBe(24);
});
it("plays all seven planets in Macrobian order with progressive immutable state", () => {
  const props = input();
  props.necessity = [...PLANETS].reverse().map((planet) => ({ planet, amount: 12, draw: 24, halved: true }));
  for (const planet of PLANETS) props.state[planet].affliction = 30;
  const original = structuredClone(props);
  render(props);
  const firstSnapshot = result.state;
  for (const [index, planet] of PLANETS.entries()) {
    expect(result.opening?.phase).toBe("accent");
    expect(audio.play).toHaveBeenCalledTimes(index + 1);
    expect(audio.play).toHaveBeenLastCalledWith(chartRuler(chart), planet, 1);
    advance(timing.map.accent);
    expect(result.opening?.phase).toBe("necessity");
    expect(result.opening?.entries).toEqual([props.necessity.find((entry) => entry.planet === planet)]);
    expect(result.opening?.revived).toBeUndefined();
    for (const [otherIndex, other] of PLANETS.entries()) {
      expect(result.state[other].affliction).toBe(otherIndex < index ? 30 : 18);
    }
    advance(timing.map.necessity - 1);
    expect(result.opening?.phase).toBe("necessity");
    advance(1);
    expect(result.opening?.phase).toBe("fortune");
    expect(result.state[planet].affliction).toBe(18);
    advance(timing.map.fortune);
    expect(result.opening?.phase).toBe("settle");
    for (const [otherIndex, other] of PLANETS.entries()) {
      expect(result.state[other].affliction).toBe(otherIndex <= index ? 30 : 18);
    }
    advance(timing.map.settle);
  }
  expect(result.active).toBe(false);
  expect(result.state).toEqual(props.state);
  expect(PLANETS.map((planet) => firstSnapshot[planet].affliction)).toEqual(Array(7).fill(18));
  expect(props).toEqual(original);
  expect(audio.play.mock.calls.map((call) => call[1])).toEqual(PLANETS);
});
it("plays only recorded planets for a noncontiguous roster using encounter timings", () => {
  const props = { ...input(), kind: "encounter" as const };
  props.necessity = ["Saturn", "Venus", "Moon"].map((planet) => ({ planet: planet as "Saturn" | "Venus" | "Moon", amount: 12, halved: false }));
  for (const entry of props.necessity) props.state[entry.planet].affliction = 24;
  props.state.Mars.affliction = 9;
  render(props);
  for (const planet of ["Moon", "Venus", "Saturn"]) {
    expect(result.opening?.entries.map((entry) => entry.planet)).toEqual([planet]);
    expect(result.state.Mars.affliction).toBe(9);
    advance(timing.encounter.accent + timing.encounter.necessity);
    expect(result.opening?.phase).toBe("fortune");
    advance(timing.encounter.fortune);
    expect(result.opening?.phase).toBe("settle");
    advance(timing.encounter.settle);
  }
  expect(result.active).toBe(false);
});
it("finishes successful revivals in order before necessity and retains each restoration", () => {
  const props = input();
  props.state.Saturn.affliction = 20;
  props.uncombusts = [
    { planet: "Saturn", chance: 0.5, success: true },
    { planet: "Venus", chance: 0.5, success: false },
    { planet: "Moon", chance: 0.5, success: true },
  ];
  render(props);
  expect(result.opening).toMatchObject({ phase: "revival", entries: [], revived: ["Moon"] });
  expect(result.state.Saturn.affliction).toBe(combustionCeiling(chart.planets.Saturn));
  advance(timing.revival);
  expect(result.opening).toMatchObject({ phase: "revival", entries: [], revived: ["Saturn"] });
  expect(result.state.Moon.affliction).toBe(24);
  expect(result.state.Saturn.affliction).toBe(combustionCeiling(chart.planets.Saturn));
  advance(timing.revival);
  expect(result.opening?.phase).toBe("accent");
  expect(result.opening?.revived).toBeUndefined();
  expect(result.state.Saturn.affliction).toBe(20);
  expect(result.state.Moon.affliction).toBe(24);
});
it.each(["click", "Enter", "Escape"])("continues through %s and finishes without replaying on rerender", (gesture) => {
  const props = input();
  props.necessity!.push({ planet: "Saturn", amount: 12, halved: false });
  props.state.Saturn.affliction = 24;
  const button = document.createElement("button");
  const action = vi.fn();
  const eventType = gesture === "click" ? "click" : "keydown";
  button.addEventListener(eventType, action);
  document.body.append(button);
  render(props);
  advance(timing.map.accent + timing.map.necessity + timing.map.fortune + timing.map.settle);
  expect(result.state.Moon.affliction).toBe(30);
  expect(result.state.Saturn.affliction).toBe(12);
  const event = () => gesture === "click"
    ? new MouseEvent("click", { bubbles: true, cancelable: true })
    : new KeyboardEvent("keydown", { key: gesture, bubbles: true, cancelable: true });
  audio.cancel.mockClear();
  const gestureEvent = event();
  act(() => { button.dispatchEvent(gestureEvent); });
  expect(result.active).toBe(true);
  expect(result.state.Saturn.affliction).toBe(12);
  expect(audio.cancel).not.toHaveBeenCalled();
  expect(gestureEvent.defaultPrevented).toBe(false);
  expect(action).toHaveBeenCalledOnce();
  const notesBeforeCompletion = audio.play.mock.calls.length;
  advance(10000);
  expect(audio.play).toHaveBeenCalledTimes(notesBeforeCompletion);
  expect(audio.cancel).toHaveBeenCalledOnce();
  expect(result.active).toBe(false);
  expect(result.state).toBe(props.state);
  expect(vi.getTimerCount()).toBe(0);
  render({ ...props, necessity: [...props.necessity!] });
  expect(result.active).toBe(false);
  act(() => { button.dispatchEvent(event()); });
  expect(action).toHaveBeenCalledTimes(2);
  button.remove();
});
it("clears scheduled work when disabled and on unmount", () => {
  const props = input();
  render(props);
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  render({ ...props, enabled: false });
  expect(audio.cancel).toHaveBeenCalledOnce();
  expect(result.active).toBe(false);
  expect(result.state).toBe(props.state);
  expect(vi.getTimerCount()).toBe(0);
  render(props);
  audio.cancel.mockClear();
  act(() => root.render(null));
  expect(audio.cancel).toHaveBeenCalledOnce();
  const notesAtUnmount = audio.play.mock.calls.length;
  advance(10000);
  expect(audio.play).toHaveBeenCalledTimes(notesAtUnmount);
  expect(vi.getTimerCount()).toBe(0);
});
it.each(["disabled", "reduced motion", "no record"])("shows settled state immediately for %s", (mode) => {
  const props = input();
  if (mode === "disabled") props.enabled = false;
  if (mode === "reduced motion") reducedMotion = true;
  if (mode === "no record") props.necessity = undefined;
  render(props);
  expect(result.active).toBe(false);
  expect(result.state).toBe(props.state);
  expect(result.opening).toBeUndefined();
  expect(audio.play).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
