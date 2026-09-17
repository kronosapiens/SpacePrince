import { PlayerChartLayout } from "@/components/PlayerChartLayout";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chart, type ChartProps } from "@/components/Chart";
import { ChartInspection } from "@/components/ChartInspection";
import { EncounterCombatScreen } from "@/screens/EncounterCombat";
import { playUISound } from "@/audio/engine";
import { beginCombatEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playStrike: vi.fn(), playCombust: vi.fn(), playUISound: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function get(selector: string) {
  const el = container.querySelector(selector);
  if (!el) throw new Error(`Missing ${selector}`);
  return el;
}
const click = (selector: string) => act(() => get(selector).dispatchEvent(new MouseEvent("click", { bubbles: true })));
const hover = (selector: string, pointerType = "mouse") => act(() => {
  const event = new MouseEvent("pointerover", { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  get(selector).dispatchEvent(event);
});
const cues = () => vi.mocked(playUISound).mock.calls.map(([cue]) => cue);
const moon = '[data-guide="planet-self-moon"]';

function renderChart(props: Partial<ChartProps> = {}) {
  act(() => root.render(<Chart chart={createStubPrince().chart} side="self"
    onPlanetClick={vi.fn()} onPlanetHover={vi.fn()} {...props} />));
}

describe("chart feedback", () => {
  it("ticks for pointer hover, but not touch, passive charts, locked planets, or unavailable targets", () => {
    renderChart();
    hover(moon, "touch");
    expect(cues()).toEqual([]);
    hover(moon);
    expect(cues()).toEqual(["hover"]);
    vi.mocked(playUISound).mockClear();
    renderChart({ passive: true });
    hover(moon);
    renderChart({ interactionPlanets: new Set(["Mars"]) });
    hover(moon);
    renderChart({ unlockedPlanets: ["Mars"] });
    hover('.chart-svg');
    expect(container.querySelector(`${moon}[role="button"]`)).toBeNull();
    expect(cues()).toEqual([]);
  });

  it("selects and dismisses by keyboard without retriggering or scrolling on key repeat", () => {
    act(() => root.render(<ChartInspection chart={createStubPrince().chart} unlockedPlanets={["Moon"]} />));
    const press = (repeat = false) => {
      const event = new KeyboardEvent("keydown", { key: " ", repeat, bubbles: true, cancelable: true });
      act(() => get(moon).dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
    };
    press();
    press(true);
    expect(cues()).toEqual(["select"]);
    expect(get(moon).closest('[role="button"]')?.getAttribute("aria-pressed")).toBe("true");
    press();
    expect(cues()).toEqual(["select", "dismiss"]);
    expect(container.querySelector(".ps-card")).toBeNull();
    click(".chart-inspection");
    expect(cues()).toEqual(["select", "dismiss"]);
  });

  it("sounds study disclosures and clears hover when an inspection is dismissed", () => {
    act(() => root.render(<ChartInspection chart={createStubPrince().chart} unlockedPlanets={["Moon"]} />));
    act(() => get(moon).dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    click(moon);
    click('[aria-label="Study Moon"]');
    expect(get('[aria-label="Study Moon"]').getAttribute("aria-expanded")).toBe("true");
    click('[aria-label="Explain Core"]');
    click('[aria-label="Explain Core"]');
    click(".chart-inspection");
    expect(cues()).toEqual(["select", "select", "select", "dismiss", "dismiss"]);
    expect(container.querySelector(".ps-card")).toBeNull();
  });

  it("keeps a rejected first activation silent and leaves inspection available", () => {
    const prince = createStubPrince();
    const run = beginRun(42, prince.numEncounters);
    const encounter = beginCombatEncounter({ run, opponentSeed: 99, lifetimeEncounterCount: prince.numEncounters });
    run.encounter = encounter;
    const onCommitTurn = vi.fn(() => null);
    act(() => root.render(<PlayerChartLayout className="combat" chart={prince.chart} unlockedPlanets={[]}>
      <EncounterCombatScreen prince={prince} run={run} encounter={encounter}
      onCommitTurn={onCommitTurn} onClearEncounter={vi.fn()} devUnlockAll={false} />
    </PlayerChartLayout>));
    click(moon);
    click('[data-guide="action-testimony"]');
    expect(onCommitTurn).toHaveBeenCalledTimes(1);
    expect(cues()).toEqual(["select"]);
    click(moon);
    expect(cues()).toEqual(["select"]);
    expect(get('[data-guide="action-testimony"]').hasAttribute("aria-pressed")).toBe(false);
    click(".combat");
    expect(cues()).toEqual(["select", "dismiss"]);
    expect(container.querySelector(".ps-card")).toBeNull();
  });
});
