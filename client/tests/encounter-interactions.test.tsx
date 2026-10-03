import { PlayerChartLayout } from "@/components/PlayerChartLayout";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterCombatScreen, type CommitTurnResult } from "@/screens/EncounterCombat";
import { beginCombatEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { resolveTurn } from "@/game/turn";
import { getEffectiveStats } from "@/game/combat";
import { playUISound } from "@/audio/engine";
import { NEUTRAL, VALENCE_COLOR } from "@/svg/palette";
import type { PlanetName, Polarity } from "@/game/types";
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
  act(() => container.querySelector(".necessity-opening")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(container.querySelector(".necessity-opening")).toBeNull();
}

function setup(settleOpening = true) {
  const prince = createStubPrince();
  const run = beginRun(prince.chart, 42, prince.numEncounters);
  const encounter = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: prince.numEncounters });
  encounter.sequence = ["Moon", "Mars"];
  encounter.opponentActions = ["Affliction", "Testimony"];
  encounter.opponentState.Moon.affliction = 12;
  run.encounter = encounter;
  const onCommitTurn = vi.fn((planet: PlanetName, verb: Polarity, rng: () => number): CommitTurnResult | null => {
    const result = resolveTurn(run, prince.chart, planet, verb, rng);
    return result ? { ...result, nextRun: result.run } : null;
  });
  const render = () => act(() => root.render(<PlayerChartLayout className="combat" chart={prince.chart} unlockedPlanets={[]}>
      <EncounterCombatScreen prince={prince} run={run} encounter={encounter}
    onCommitTurn={onCommitTurn} onClearEncounter={vi.fn()} devUnlockAll={false} />
    </PlayerChartLayout>));
  render();
  if (settleOpening) finishOpening();
  return { prince, run, encounter, onCommitTurn, render };
}

describe("encounter interactions", () => {
  it("skips the other chart opening without selecting or acting and retains results without replaying on turn changes", () => {
    const { encounter, render, onCommitTurn } = setup(false);
    const other = '[data-guide="chart-other"]';
    const record = encounter.necessity!.find((entry) => entry.planet === "Moon")!;
    expect(get(`${other} .necessity-opening`).textContent).toBe("");
    expect(container.querySelector(".chart-layout-chart .necessity-opening")).toBeNull();
    expect(container.querySelector(".chart-layout-chart .necessity-arc")).toBeNull();
    click(moon);
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(testimony)).toBeNull();
    expect(container.querySelector(affliction)).toBeNull();
    expect(onCommitTurn).not.toHaveBeenCalled();

    finishOpening();
    click(`${other} [data-guide="planet-other-moon"]`);
    click(`${other} [aria-label="Study Moon"]`);
    expect(get(`${other} .ps-necessity`).textContent).toBe(
      `Necessity: +${record.amount}${record.halved ? " · halved by Fortune" : ""}`,
    );
    click(moon);
    expect(container.querySelector(testimony)).not.toBeNull();
    encounter.turnIndex = 1;
    render();
    expect(container.querySelector(".necessity-opening")).toBeNull();
    expect(container.querySelector(".necessity-arc")).toBeNull();
    expect(get(`${other} .ps-necessity`).textContent).toContain(`Necessity: +${record.amount}`);
    click(moon);
    click(testimony);
    expect(onCommitTurn).toHaveBeenCalledExactlyOnceWith("Moon", "Testimony", expect.any(Function));
  });

  it("previews exact effects on hover/focus and restores a focused action when the pointer leaves", () => {
    const { prince, run, onCommitTurn } = setup();
    focus(moon);
    expect(container.querySelector('[data-guide="arc-self-moon"] .arc-diff')).not.toBeNull();
    expect(container.querySelector(".ps-card")).toBeNull();
    expect(container.querySelector(otherIncoming)).toBeNull();
    click(moon);
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
