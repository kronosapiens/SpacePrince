import { PlayerChartLayout } from "@/components/PlayerChartLayout";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterCombatScreen } from "@/screens/EncounterCombat";
import { beginCombatEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { getEffectiveStats } from "@/game/combat";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import { NECESSITY_ANIMATION_TIMINGS as openingTiming } from "@/components/useNecessityAnimation";
import { playUISound } from "@/audio/engine";
import { NEUTRAL, VALENCE_COLOR } from "@/svg/palette";
import type { NecessityEntry, PlanetName, Polarity } from "@/game/types";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playStrike: vi.fn(), playCombust: vi.fn(), playUISound: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
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
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const moon = '[data-guide="planet-self-moon"]';
const mars = '[data-guide="planet-self-mars"]';
const testimony = '[data-guide="action-testimony"]';
const affliction = '[data-guide="action-affliction"]';
const otherIncoming = '[data-guide="chart-other"] [data-guide="incoming"]';
const get = (selector: string) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
};
const click = (selector: string) => act(() => get(selector).dispatchEvent(new MouseEvent("click", { bubbles: true })));
const focus = (selector: string) => act(() => {
  const element = get(selector);
  (element.closest('[role="button"]') as HTMLElement | null ?? element as HTMLElement).focus();
});
const hover = (selector: string) => act(() => get(selector).dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
const leave = (selector: string) => act(() => get(selector).dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })));

function finishOpening() {
  if (container.querySelector(".necessity-opening")) act(() => vi.runOnlyPendingTimers());
  expect(container.querySelector(".necessity-opening")).toBeNull();
}

function setup(settleOpening = true, openingCounts?: { self: number; other: number; combustSelf?: PlanetName; blocked?: boolean }, devAnimationControls = false) {
  const prince = createStubPrince();
  const run = beginRun(prince.chart, 42, prince.numEncounters);
  const encounter = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: prince.numEncounters });
  encounter.sequence = ["Moon", "Mars"];
  encounter.opponentActions = ["Affliction", "Testimony"];
  encounter.opponentState.Moon.affliction = 12;
  if (openingCounts) {
    const entries = (count: number): NecessityEntry[] => PLANETS.slice(0, count).map((planet) => openingCounts.blocked === undefined
      ? { planet, amount: 12, draw: 24, halved: true }
      : { planet, amount: openingCounts.blocked ? 0 : 12, draw: 12, blocked: openingCounts.blocked });
    encounter.selfNecessity = entries(openingCounts.self);
    encounter.necessity = entries(openingCounts.other);
    for (const entry of encounter.selfNecessity) run.state[entry.planet].affliction = 30;
    for (const entry of encounter.necessity) encounter.opponentState[entry.planet].affliction = 30;
    if (openingCounts.combustSelf) {
      const planet = openingCounts.combustSelf;
      run.state[planet].affliction = combustionCeiling(prince.chart.planets[planet]);
    }
  }
  run.encounter = encounter;
  const onCommitTurn = vi.fn((planet: PlanetName, verb: Polarity, rng: () => number) =>
    resolveTurn(run, prince.chart, planet, verb, rng));
  const render = () => act(() => root.render(<PlayerChartLayout className="combat" chart={prince.chart} unlockedPlanets={[]}>
      <EncounterCombatScreen prince={prince} run={run} encounter={encounter}
    onCommitTurn={onCommitTurn} onClearEncounter={vi.fn()} devUnlockAll={false} devAnimationControls={devAnimationControls} />
    </PlayerChartLayout>));
  render();
  if (settleOpening) finishOpening();
  return { prince, run, encounter, onCommitTurn, render };
}

describe("encounter interactions", () => {
  it.each(["self", "other"] as const)("waits for the longer %s opening before allowing the first action", (longer) => {
    const counts = { self: longer === "self" ? 2 : 1, other: longer === "other" ? 2 : 1 };
    const { run, encounter, render, onCommitTurn } = setup(false, counts);
    const committed = structuredClone({ self: run.state, other: encounter.opponentState });
    expect(container.querySelectorAll(".necessity-opening")).toHaveLength(2);
    click(moon);
    expect(container.querySelector(testimony)).toBeNull();
    const perPlanet = Object.values(openingTiming.encounter).reduce((a, b) => a + b, 0);
    act(() => vi.advanceTimersByTime(perPlanet));
    expect(container.querySelectorAll(".necessity-opening")).toHaveLength(1);
    expect(container.querySelector(`[data-guide="chart-${longer}"] .necessity-opening`)).not.toBeNull();
    render();
    click(moon);
    expect(container.querySelector(testimony)).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(perPlanet));
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect({ self: run.state, other: encounter.opponentState }).toEqual(committed);
    expect(get('[data-guide="opponent-move"]').textContent).toContain("Moon");
    render();
    expect(container.querySelector(".necessity-opening")).toBeNull();
    click(moon);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledExactlyOnceWith("Moon", "Testimony", expect.any(Function));
  });

  it("shows both committed charts immediately with reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { onCommitTurn } = setup(false, { self: 2, other: 2, blocked: true });
    expect(container.querySelector(".necessity-opening")).toBeNull();
    click(moon);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledOnce();
  });

  it("shows then blocks every incoming arc while both openings finish before actions resume", () => {
    const { run, encounter, render, onCommitTurn } = setup(false, { self: 7, other: 7, blocked: true });
    const committed = structuredClone({ self: run.state, other: encounter.opponentState });
    expect(container.querySelectorAll(".necessity-opening")).toHaveLength(2);
    click(moon);
    expect(container.querySelector(testimony)).toBeNull();
    act(() => vi.advanceTimersByTime(openingTiming.encounter.accent));
    expect(container.querySelectorAll(".necessity-arc")).toHaveLength(2);
    act(() => vi.advanceTimersByTime(openingTiming.encounter.necessity));
    expect(container.querySelector(".necessity-arc")).toBeNull();
    expect(container.querySelectorAll(".necessity-opening")).toHaveLength(2);
    render();
    expect(container.querySelector(".necessity-arc")).toBeNull();
    const perPlanet = Object.values(openingTiming.encounter).reduce((a, b) => a + b, 0);
    act(() => vi.advanceTimersByTime(7 * perPlanet - openingTiming.encounter.accent - openingTiming.encounter.necessity - 1));
    click(moon);
    expect(container.querySelector(testimony)).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect({ self: run.state, other: encounter.opponentState }).toEqual(committed);
    click(moon);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledOnce();
  });

  it("still shows half the raw arc for a saved halved Fortune result", () => {
    setup(false, { self: 1, other: 1 });
    const arc = '[data-guide="arc-self-moon"] .necessity-arc path';
    act(() => vi.advanceTimersByTime(openingTiming.encounter.accent));
    const raw = get(arc).getAttribute("d");
    act(() => vi.advanceTimersByTime(openingTiming.encounter.necessity));
    const half = get(arc).getAttribute("d");
    expect(half).not.toBe(raw);
    act(() => vi.advanceTimersByTime(openingTiming.encounter.fortune));
    expect(get(arc).getAttribute("d")).toBe(half);
  });

  it("shows an entry death when its sweep settles and only allows surviving planets to act", () => {
    const { run, prince, onCommitTurn } = setup(false, { self: 1, other: 2, combustSelf: "Moon", blocked: false });
    expect(get(moon).closest(".anim-combust")).toBeNull();
    act(() => vi.advanceTimersByTime(openingTiming.encounter.accent));
    const arc = get('[data-guide="arc-self-moon"]');
    const trackEnd = arc.querySelector("path")!.getAttribute("d")!.split(" ").slice(-2);
    expect(arc.querySelector(".necessity-arc path")!.getAttribute("d")!.split(" ").slice(-2)).toEqual(trackEnd);
    act(() => vi.advanceTimersByTime(openingTiming.encounter.necessity + openingTiming.encounter.fortune));
    expect(get(moon).closest(".anim-combust")).not.toBeNull();
    expect(run.state.Moon.affliction).toBe(combustionCeiling(prince.chart.planets.Moon));
    click(moon);
    expect(container.querySelector(testimony)).toBeNull();
    finishOpening();
    expect(get(moon).closest('[role="button"]')).toBeNull();
    click(moon);
    expect(container.querySelector(testimony)).toBeNull();
    click(mars);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledExactlyOnceWith("Mars", "Testimony", expect.any(Function));
  });

  it("does not replay either opening after a temporary dev animation", () => {
    const { run, encounter, onCommitTurn } = setup(true, { self: 1, other: 1 }, true);
    const committed = structuredClone({ self: run.state, other: encounter.opponentState });
    click(".anim-console-header");
    click(".anim-console-btn.is-primary");
    act(() => vi.runAllTimers());
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect({ self: run.state, other: encounter.opponentState }).toEqual(committed);
    expect(encounter.turnIndex).toBe(0);
    expect(onCommitTurn).not.toHaveBeenCalled();
    click(moon);
    expect(container.querySelector(testimony)).not.toBeNull();
  });

  it("finishes the other chart opening before allowing actions without replaying on turn changes", () => {
    const { encounter, render, onCommitTurn } = setup(false);
    const other = '[data-guide="chart-other"]';
    expect(get(`${other} .necessity-opening`).textContent).toBe("");
    expect(container.querySelector(".chart-layout-chart .necessity-opening")).toBeNull();
    expect(container.querySelector(".chart-layout-chart .necessity-arc")).toBeNull();
    click(moon);
    act(() => get(moon).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(container.querySelector(".necessity-opening")).not.toBeNull();
    expect(container.querySelector(testimony)).toBeNull();
    expect(container.querySelector(affliction)).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();

    finishOpening();
    click(`${other} [data-guide="planet-other-moon"]`);
    click(`${other} [aria-label="Study Moon"]`);
    expect(get(`${other} .ps-study`).textContent).not.toContain("Necessity");
    click(moon);
    expect(container.querySelector(testimony)).not.toBeNull();
    encounter.turnIndex = 1;
    render();
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(".necessity-arc")).toBeNull();
    click(moon);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledExactlyOnceWith("Moon", "Testimony", expect.any(Function));
  });

  it("previews exact effects on hover/focus and restores a focused action when the pointer leaves", () => {
    const { prince, run, onCommitTurn } = setup();
    hover(moon);
    expect(get('[data-guide="chart-self"] .ps-name').textContent).toContain("MOON");
    expect(container.querySelector(".ps-actions")).toBeNull();
    leave(moon);
    expect(container.querySelector(".ps-card")).toBeNull();

    focus(moon);
    expect(container.querySelector('[data-guide="arc-self-moon"] .arc-diff')).not.toBeNull();
    expect(get('[data-guide="chart-self"] .ps-name').textContent).toContain("MOON");
    hover(mars);
    expect(get('[data-guide="chart-self"] .ps-name').textContent).toContain("MARS");
    leave(mars);
    expect(get('[data-guide="chart-self"] .ps-name').textContent).toContain("MOON");
    expect(container.querySelector(".ps-actions")).toBeNull();
    expect(container.querySelector(otherIncoming)).toBeNull();

    click(moon);
    hover(mars);
    focus(mars);
    expect(get('[data-guide="chart-self"] .ps-name').textContent).toContain("MOON");
    expect(container.querySelector(testimony)).not.toBeNull();
    expect(container.querySelector(affliction)).not.toBeNull();
    leave(mars);
    expect(get('[data-guide="chart-self"] .ps-name').textContent).toContain("MOON");
    hover(affliction);
    focus(testimony);
    expect(get(testimony).classList.contains("is-previewed")).toBe(true);
    const expected = resolveTurn(run, prince.chart, "Moon", "Testimony", () => 0)!;
    expect(get(".combat-light-delta").textContent).toBe(`+${expected.log.lightGain}`);
    expect(get(otherIncoming).querySelectorAll(".invite-ring circle").length)
      .toBe(getEffectiveStats(prince.chart, "Moon").testimony / 12);
    hover(affliction);
    expect(get(affliction).classList.contains("is-previewed")).toBe(true);
    leave(affliction);
    expect(get(testimony).classList.contains("is-previewed")).toBe(true);
    expect(get(".combat-light-delta").textContent).toBe(`+${expected.log.lightGain}`);
    act(() => (get(testimony) as HTMLElement).blur());
    expect(container.querySelector(otherIncoming)).toBeNull();
    expect(container.querySelector(".combat-light-delta")).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();
  });

  it("shows one neutral ring while inspecting the other chart and restores its announced actor on dismissal", () => {
    const { onCommitTurn } = setup();
    const other = '[data-guide="chart-other"]';
    const ring = () => get(`${other} circle.invite-ring`);
    const actor = get(`${other} [data-guide="planet-other-moon"]`).closest('[role="button"]')!;
    const inspected = get(`${other} [data-guide="planet-other-mars"]`).closest('[role="button"]')!;
    expect(actor.contains(ring())).toBe(true);
    expect(ring().getAttribute("stroke")).toBe(VALENCE_COLOR.Affliction);

    click(`${other} [data-guide="planet-other-mars"]`);
    expect(container.querySelectorAll(`${other} circle.invite-ring`)).toHaveLength(1);
    expect(inspected.contains(ring())).toBe(true);
    expect(ring().getAttribute("stroke")).toBe(NEUTRAL.mist);
    expect(get(`${other} .ps-name`).textContent).toContain("MARS");

    click(`${other} [data-guide="planet-other-mars"]`);
    expect(container.querySelectorAll(`${other} circle.invite-ring`)).toHaveLength(1);
    expect(actor.contains(ring())).toBe(true);
    expect(ring().getAttribute("stroke")).toBe(VALENCE_COLOR.Affliction);
    expect(container.querySelector(`${other} .ps-card`)).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();
  });

  it("commits the activated verb once even when another verb is being previewed", () => {
    const { onCommitTurn } = setup();
    click(moon);
    hover(affliction);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledExactlyOnceWith("Moon", "Testimony", expect.any(Function));
    expect(onCommitTurn.mock.results[0]?.value?.log.playerValence).toBe("Testimony");
    expect(container.querySelector(".ps-actions")).toBeNull();
    expect(vi.mocked(playUISound).mock.calls.filter(([cue]) => cue === "commit")).toHaveLength(1);
    click(".combat");
    expect(onCommitTurn).toHaveBeenCalledTimes(1);
  });

  it("clears action previews on planet, study, and turn changes", () => {
    const { encounter, render, onCommitTurn } = setup();
    click(moon);
    hover(affliction);
    click(mars);
    expect(container.querySelector(".combat-light-delta")).toBeNull();
    hover(testimony);
    click('[aria-label="Study Mars"]');
    expect(container.querySelector(".combat-light-delta")).toBeNull();
    click('[aria-label="Study Mars"]');
    hover(testimony);
    encounter.turnIndex = 1;
    render();
    expect(container.querySelector(".combat-light-delta")).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();
  });

  it("keeps guide demonstrations safe and restores inspection and study without an action preview", () => {
    const { onCommitTurn } = setup();
    click(moon);
    click('[aria-label="Study Moon"]');
    click('[aria-label="Study this encounter"]');
    click(".guide-step.is-primary");
    click(".guide-step.is-primary");
    expect(get(testimony).classList.contains("is-previewed")).toBe(true);
    click(affliction);
    click(affliction);
    expect(get(affliction).classList.contains("is-previewed")).toBe(true);
    expect(onCommitTurn).not.toHaveBeenCalled();
    expect(vi.mocked(playUISound).mock.calls.some(([cue]) => cue === "commit")).toBe(false);
    click(".guide-close");
    expect(get('[aria-label="Study Moon"]').getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(".combat-light-delta")).toBeNull();
    expect(container.querySelector(otherIncoming)).toBeNull();
    click('[aria-label="Study Moon"]');
    expect(container.querySelector(".ps-action.is-previewed")).toBeNull();
  });
});
