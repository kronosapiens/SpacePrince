import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterNarrativeScreen } from "@/screens/EncounterNarrative";
import { beginNarrativeEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import { getScenario } from "@/data/narrative-scenarios";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => {
  // Chart's optional numeric badges measure text through canvas.
  HTMLCanvasElement.prototype.getContext = () => null;
});
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
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
  act(() => root.unmount());
  container.remove();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mount(id: string) {
  const prince = createStubPrince();
  const scenario = getScenario(id);
  const run = { ...beginRun(42, prince.numEncounters), light: 120 };
  run.state.Moon.affliction = 24;
  run.state.Mars.affliction = 24;
  run.state.Venus.affliction = combustionCeiling(prince.chart.planets.Venus);
  const encounter = beginNarrativeEncounter({ run, house: scenario.house, scenarioId: id, fragmentId: "test" });
  run.encounter = encounter;
  const onCommit = vi.fn();
  act(() => root.render(<EncounterNarrativeScreen prince={prince} run={run} encounter={encounter}
    onCommit={onCommit} onClearEncounter={vi.fn()} />));
  return { run, onCommit };
}
const element = (selector: string) => {
  const found = document.querySelector(selector);
  if (!found) throw new Error(`Missing ${selector}`);
  return found;
};
const click = (selector: string) => act(() => {
  element(selector).dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
const choose = (planet: string) => act(() => {
  element(`[data-guide="planet-self-${planet}"]`).dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
});

describe("narrative chart interaction", () => {
  it("previews revival on an eligible planet and commits once through its readout", () => {
    const { run, onCommit } = mount("transformation-rite");
    click('[data-guide="option-1"]');
    expect(document.querySelector("select")).toBeNull();
    expect(document.querySelector('[data-guide="incoming"]')).not.toBeNull();
    expect(element('[data-guide="planet-self-moon"]').getAttribute("role")).toBeNull();
    click('[data-guide="option-1"]');
    expect(onCommit).not.toHaveBeenCalled();
    choose("venus");
    expect(document.querySelector('[data-guide="arc-self-venus"] .arc-diff')).not.toBeNull();
    expect(element(".ps-action").textContent).toBe(`Testify ${run.state.Venus.affliction / 2}`);
    expect(onCommit).not.toHaveBeenCalled();
    act(() => {
      const action = element(".ps-action");
      action.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      action.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    const next = onCommit.mock.calls[0]![0];
    expect(next.light).toBe(36);
    expect(next.state.Venus.affliction).toBe(run.state.Venus.affliction / 2);
  });

  it("holds a selected preview through hover and applies only the replacement target", () => {
    const { onCommit } = mount("home-buried");
    const aside = element('[data-guide="option-aside-2"]').textContent;
    click('[data-guide="option-2"]');
    act(() => element('[data-guide="planet-self-moon"]').dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(element('[data-guide="option-aside-2"]').textContent).toBe(aside);
    choose("moon");
    act(() => element('[data-guide="planet-self-mars"]').dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(element(".ps-name").textContent).toContain("MOON");
    expect(element(".ps-action").textContent).toBe("Testify 36");
    choose("mars");
    expect(element(".ps-name").textContent).toContain("MARS");
    expect(element('[data-guide="option-aside-2"]').textContent).toBe(aside);
    click(".ps-action");
    const next = onCommit.mock.calls[0]![0];
    expect(next.state.Mars.affliction).toBe(0);
    expect(next.state.Moon.affliction).toBe(24);
  });

  it("clears the target when changing the option or backing out of its readout", () => {
    const { onCommit } = mount("home-buried");
    click('[data-guide="option-2"]');
    choose("moon");
    click('[data-guide="option-1"]');
    expect(document.querySelector(".ps-action")).toBeNull();
    expect(document.querySelector('[data-guide="incoming"]')).not.toBeNull();
    choose("mars");
    click(".ps-card");
    expect(document.querySelector(".ps-action")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
    click(".narrative");
    expect(document.querySelector(".option.is-selected")).toBeNull();
  });

  it("blocks commitment in the guide and preserves the selection when closing it", () => {
    const { onCommit } = mount("transformation-rite");
    click('[data-guide="option-1"]');
    choose("venus");
    click('[aria-label="Study this scene"]');
    click(".ps-action");
    expect(onCommit).not.toHaveBeenCalled();
    click('[aria-label="Close scene guide"]');
    expect(element(".ps-action").getAttribute("aria-pressed")).toBe("true");
    click(".ps-action");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("confirms an untargeted option on its second tap", () => {
    const { onCommit } = mount("livelihood-coin");
    click('[data-guide="option-1"]');
    expect(document.querySelector(".ps-action")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
    click('[data-guide="option-1"]');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]![0].light).toBe(132);
  });
});
