import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaySurface } from "@/screens/PlaySurface";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { InfoCardProvider, useInfoCards } from "@/state/InfoCardContext";
import { loadPrince, savePrince } from "@/state/prince";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { playCombust } from "@/audio/engine";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn() }));
vi.mock("@/screens/MapScreen", () => ({ MapScreen: () => <div data-screen="map" /> }));
vi.mock("@/screens/EndOfRunScreen", () => ({ EndOfRunScreen: () => <div data-screen="end" /> }));
vi.mock("@/components/InfoCardHost", () => ({
  InfoCardHost: () => {
    const { current } = useInfoCards();
    return current ? <div data-intro>{current.planet}</div> : null;
  },
}));

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

function combat(turns = 1, count = 64) {
  const prince = createStubPrince({ numEncounters: count });
  const run = beginRun(42, count);
  const encounter = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: count });
  encounter.sequence = Array.from({ length: turns }, () => "Moon");
  encounter.opponentActions = Array.from({ length: turns }, () => "Testimony");
  run.encounter = encounter;
  prince.runs = [run];
  return { prince, run, encounter };
}
function mount(prince: ReturnType<typeof createStubPrince>) {
  savePrince(prince);
  act(() => root!.render(<PrinceStoreProvider><InfoCardProvider><PlaySurface /></InfoCardProvider></PrinceStoreProvider>));
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
  click(action);
}
function settle() {
  let steps = 0;
  while (!container.querySelector(".combat.is-resolved") && steps++ < 200) {
    expect(container.querySelector(".combat")).not.toBeNull();
    expect(container.querySelector("[data-screen]")).toBeNull();
    act(() => vi.advanceTimersToNextTimer());
  }
  expect(container.querySelector(".combat.is-resolved")).not.toBeNull();
}

describe("encounter advancement", () => {
  it("waits for the full propagation playback and final pause before returning to the map", () => {
    const { prince } = combat();
    mount(prince);
    commit("Testify");
    const committed = loadPrince()!;
    const encounter = committed.runs[0]!.encounter!;
    expect(encounter.resolved).toBe(true);
    expect(encounter.kind === "combat" && encounter.log[0]!.propagation.length).toBeGreaterThan(0);
    expect(container.querySelector(".combat.is-resolved")).toBeNull();
    expect(container.querySelector('[aria-label="Study this encounter"]')).toBeNull();
    expect(container.querySelector(".combat-continue")).toBeNull();
    click(get(".combat"));
    click(get('[data-guide="planet-self-moon"]'));
    expect(container.querySelector(".combat.is-resolved")).toBeNull();
    settle();
    expect(loadPrince()!.numEncounters).toBe(64);
    advanceTime(1799);
    expect(container.querySelector('[data-screen="map"]')).toBeNull();
    advanceTime(1);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.encounter).toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(committed.runs[0]!.light);
    expect(loadPrince()!.numEncounters).toBe(65);
  });

  it("lets a tap on the final chart skip the pause and advances only once", () => {
    const { prince } = combat(1, 0);
    mount(prince);
    commit();
    expect(container.querySelector("[data-intro]")).toBeNull();
    settle();
    const planet = get('[data-guide="planet-self-moon"]');
    act(() => {
      planet.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      planet.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    advanceTime(5000);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(get("[data-intro]").textContent).toBe("Mercury");
    expect(loadPrince()!.numEncounters).toBe(1);
  });

  it("keeps an encounter open between turns", () => {
    const { prince } = combat(2);
    mount(prince);
    commit();
    act(() => vi.runAllTimers());
    expect(loadPrince()!.runs[0]!.encounter?.resolved).toBe(false);
    expect(container.querySelector(".combat")).not.toBeNull();
    expect(container.querySelector(".combat.is-resolved")).toBeNull();
    expect(loadPrince()!.numEncounters).toBe(64);
  });

  it("finishes combustion playback and advances to the end-of-run screen", () => {
    const { prince, run, encounter } = combat();
    for (const planet of PLANETS) run.state[planet].affliction = combustionCeiling(prince.chart.planets[planet]);
    run.state.Moon.affliction -= 12;
    encounter.opponentActions = ["Affliction"];
    mount(prince);
    commit("Testify");
    settle();
    expect(playCombust).toHaveBeenCalled();
    advanceTime(2799);
    expect(container.querySelector("[data-screen]")).toBeNull();
    advanceTime(1);
    expect(container.querySelector('[data-screen="end"]')).not.toBeNull();
    expect(loadPrince()!.numEncounters).toBe(65);
  });

  it("advances a restored resolved encounter without replaying or paying again", () => {
    const { prince, run, encounter } = combat();
    encounter.resolved = true;
    encounter.turnIndex = 1;
    run.light = 96;
    mount(prince);
    advanceTime(1800);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(96);
    expect(loadPrince()!.numEncounters).toBe(65);
  });

  it("cancels a pending exit when the screen unmounts", () => {
    const { prince, encounter } = combat();
    encounter.resolved = true;
    mount(prince);
    act(() => root!.unmount());
    root = null;
    advanceTime(5000);
    expect(loadPrince()!.runs[0]!.encounter).not.toBeNull();
    expect(loadPrince()!.numEncounters).toBe(64);
  });

  it("preserves narrative auto-advance through the same exit path", () => {
    const prince = createStubPrince();
    const run = beginRun(42, prince.numEncounters);
    run.encounter = beginNarrativeEncounter({ run, house: 2, scenarioId: "livelihood-coin", fragmentId: "test" });
    prince.runs = [run];
    mount(prince);
    click(get('[data-guide="option-1"]'));
    click(get('[data-guide="option-1"]'));
    expect(container.querySelector(".narrative.is-resolved")).not.toBeNull();
    advanceTime(1799);
    expect(container.querySelector('[data-screen="map"]')).toBeNull();
    advanceTime(1);
    expect(container.querySelector('[data-screen="map"]')).not.toBeNull();
    expect(loadPrince()!.runs[0]!.light).toBe(12);
    expect(loadPrince()!.numEncounters).toBe(65);
  });
});
