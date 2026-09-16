import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterNarrativeScreen } from "@/screens/EncounterNarrative";
import { beginNarrativeEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { combustionCeiling } from "@/game/combust";
import { getScenario } from "@/data/narrative-scenarios";
import { createStubPrince } from "./fixtures";
import { playUISound } from "@/audio/engine";

vi.hoisted(() => {
  // Chart's optional numeric badges measure text through canvas.
  HTMLCanvasElement.prototype.getContext = () => null;
});
vi.mock("@/audio/engine", () => ({ setTheme: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn(), playUISound: vi.fn() }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
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
  run.state.Moon.affliction = 10;
  run.state.Sun.affliction = 10;
  run.state.Mars.affliction = 24;
  run.state.Venus.affliction = combustionCeiling(prince.chart.planets.Venus);
  const encounter = beginNarrativeEncounter({ run, house: scenario.house, scenarioId: id, fragmentId: "test" });
  run.encounter = encounter;
  const onCommit = vi.fn();
  const render = (nextRun = run) => {
    if (nextRun.encounter?.kind !== "narrative") throw new Error("Expected narrative encounter");
    const nextEncounter = nextRun.encounter;
    act(() => root.render(<EncounterNarrativeScreen prince={prince} run={nextRun} encounter={nextEncounter}
      onCommit={onCommit} onClearEncounter={vi.fn()} />));
  };
  render();
  return { run, onCommit, render };
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
const hoverPlanet = (planet: string) => act(() => {
  element(`[data-guide="planet-self-${planet}"]`).dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
});
const focus = (selector: string) => act(() => {
  element(selector).dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
});
const hoverOption = (index: number) => act(() => {
  element(`[data-guide="option-${index}"]`).dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
});
const leaveOption = (index: number) => act(() => {
  element(`[data-guide="option-${index}"]`).dispatchEvent(new MouseEvent("pointerout", { bubbles: true }));
});

describe("narrative chart interaction", () => {
  it("previews revival by focus and commits once on target activation", () => {
    const { run, onCommit, render } = mount("transformation-rite");
    const options = [...document.querySelectorAll(".option")].map((option) => option.textContent);
    hoverOption(1);
    expect(document.querySelector(".option.is-selected")).toBeNull();
    expect(element('[data-guide="planet-self-moon"]').closest('[role="button"]')).not.toBeNull();
    click('[data-guide="option-1"]');
    expect(document.querySelector("select")).toBeNull();
    expect(document.querySelector('[data-guide="incoming"]')).not.toBeNull();
    expect(element('[data-guide="planet-self-moon"]').closest('[role="button"]')).toBeNull();
    click('[data-guide="option-1"]');
    expect(onCommit).not.toHaveBeenCalled();
    focus('[data-guide="planet-self-venus"]');
    expect(document.querySelector('[data-guide="arc-self-venus"] .arc-diff')).not.toBeNull();
    expect(element(".ps-effect").textContent).toBe(`Testify ${run.state.Venus.affliction / 2}`);
    expect(document.querySelector(".ps-action")).toBeNull();
    expect(onCommit).not.toHaveBeenCalled();
    act(() => {
      const target = element('[data-guide="planet-self-venus"]');
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(vi.mocked(playUISound).mock.calls.filter(([cue]) => cue === "commit")).toHaveLength(1);
    const next = onCommit.mock.calls[0]![0];
    expect(next.light).toBe(36);
    expect(next.state.Venus.affliction).toBe(run.state.Venus.affliction / 2);
    render(next);
    expect([...document.querySelectorAll(".option")].map((option) => option.textContent)).toEqual(options);
    expect(element(".option.is-selected").getAttribute("data-guide")).toBe("option-1");
  });

  it("previews multiple targets and applies the activated planet without a preceding hover", () => {
    const { onCommit } = mount("home-buried");
    const aside = element('[data-guide="option-aside-2"]').textContent;
    expect(aside).toBe("Testify 36 on a chosen planet");
    click('[data-guide="option-2"]');
    hoverPlanet("moon");
    expect(element('[data-guide="option-aside-2"]').textContent).toBe(aside);
    expect(element(".ps-effect").textContent).toBe("Testify 10");
    hoverPlanet("mars");
    expect(element(".ps-name").textContent).toContain("MARS");
    expect(element(".ps-effect").textContent).toBe("Testify 24");
    expect(element('[data-guide="option-aside-2"]').textContent).toBe(aside);
    expect(onCommit).not.toHaveBeenCalled();
    click('[data-guide="planet-self-moon"]');
    const next = onCommit.mock.calls[0]![0];
    expect(next.state.Mars.affliction).toBe(24);
    expect(next.state.Moon.affliction).toBe(0);
  });

  it("keeps group healing at its authored amount while previewing and applying individual recovery", () => {
    const { run, onCommit } = mount("home-hearth");
    const aside = "Testify 24 on each lit planet · Lose 24 Light";
    expect(element('[data-guide="option-aside-2"]').textContent).toBe(aside);
    choose("sun");
    hoverOption(2);
    expect(element(".ps-name").textContent).toContain("SUN");
    expect(element(".ps-effect").textContent).toBe("Testify 10");
    expect(document.querySelector('[data-guide="arc-self-sun"] .arc-diff')).not.toBeNull();
    expect(element('[data-guide="option-aside-2"]').textContent).toBe(aside);
    expect(onCommit).not.toHaveBeenCalled();
    click('[data-guide="option-2"]');
    const next = onCommit.mock.calls[0]![0];
    expect(next.state.Sun.affliction).toBe(0);
    expect(next.state.Moon.affliction).toBe(0);
    expect(next.state.Mars.affliction).toBe(0);
    expect(next.state.Venus.affliction).toBe(run.state.Venus.affliction);
    expect(next.light).toBe(96);
  });

  it("keeps the selected target action separate from option previews", () => {
    const { onCommit } = mount("home-buried");
    click('[data-guide="option-2"]');
    hoverPlanet("moon");
    hoverOption(1);
    expect(element('.option.is-selected').getAttribute("data-guide")).toBe("option-2");
    expect(element(".ps-effect").textContent).toBe("Afflict 48");
    leaveOption(1);
    hoverPlanet("moon");
    expect(element(".ps-effect").textContent).toBe("Testify 10");
    hoverOption(1);
    choose("mars");
    expect(onCommit.mock.calls[0]![0].state.Mars.affliction).toBe(0);
    expect(onCommit.mock.calls[0]![0].light).toBe(120);
  });

  it("keeps focus previews after pointer exit and restores the selected action over the chart", () => {
    const { onCommit } = mount("home-buried");
    click('[data-guide="option-2"]');
    focus('[data-guide="option-1"]');
    hoverOption(2);
    expect(element('.option.is-preview').getAttribute("data-guide")).toBe("option-2");
    leaveOption(2);
    expect(element('.option.is-preview').getAttribute("data-guide")).toBe("option-1");
    hoverPlanet("moon");
    expect(element('.option.is-preview').getAttribute("data-guide")).toBe("option-2");
    expect(element(".ps-effect").textContent).toBe("Testify 10");
    act(() => element('[data-guide="planet-self-moon"]').dispatchEvent(new MouseEvent("mouseout", {
      bubbles: true, relatedTarget: element('[data-guide="option-1"]'),
    })));
    expect(element('.option.is-preview').getAttribute("data-guide")).toBe("option-1");
    hoverOption(2);
    focus('[data-guide="option-1"]');
    expect(element('.option.is-preview').getAttribute("data-guide")).toBe("option-1");
    hoverOption(1);
    focus('[data-guide="planet-self-mars"]');
    expect(element('.option.is-preview').getAttribute("data-guide")).toBe("option-2");
    expect(element(".ps-effect").textContent).toBe("Testify 24");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("clears target previews when changing options and cancels through Escape or background", () => {
    const { onCommit } = mount("home-buried");
    click('[data-guide="option-2"]');
    hoverPlanet("moon");
    click('[data-guide="option-1"]');
    expect(document.querySelector(".ps-effect")).toBeNull();
    expect(document.querySelector('[data-guide="incoming"]')).not.toBeNull();
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(document.querySelector(".option.is-selected")).toBeNull();
    expect(document.querySelector('[data-guide="incoming"]')).toBeNull();
    choose("mars");
    expect(element(".ps-name").textContent).toContain("MARS");
    expect(onCommit).not.toHaveBeenCalled();
    click('[data-guide="option-2"]');
    click(".narrative");
    expect(document.querySelector(".option.is-selected")).toBeNull();
  });

  it("blocks target commitment in the guide and preserves targeting when closing it", () => {
    const { onCommit } = mount("transformation-rite");
    click('[data-guide="option-1"]');
    click('[aria-label="Study this scene"]');
    focus('[data-guide="planet-self-venus"]');
    expect(element(".ps-effect").textContent).toContain("Testify");
    vi.mocked(playUISound).mockClear();
    choose("venus");
    expect(onCommit).not.toHaveBeenCalled();
    expect(playUISound).not.toHaveBeenCalled();
    click('[aria-label="Close scene guide"]');
    expect(element('[data-guide="option-1"]').getAttribute("aria-pressed")).toBe("true");
    choose("venus");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(playUISound).toHaveBeenLastCalledWith("commit");
  });

  it("commits an untargeted option on first activation and keeps its result highlighted", () => {
    const { onCommit, render } = mount("livelihood-coin");
    const aside = element('[data-guide="option-aside-1"]').textContent;
    click('[data-guide="option-1"]');
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    expect(document.querySelector(".ps-action")).toBeNull();
    expect(onCommit).toHaveBeenCalledTimes(1);
    const next = onCommit.mock.calls[0]![0];
    expect(next.light).toBe(132);
    render(next);
    expect(element(".option.is-selected").getAttribute("data-guide")).toBe("option-1");
    expect(element('[data-guide="option-aside-1"]').textContent).toBe(aside);
  });

  it("blocks untargeted commitment and its sound while the guide is open", () => {
    const { onCommit } = mount("livelihood-coin");
    click('[aria-label="Study this scene"]');
    vi.mocked(playUISound).mockClear();
    click('[data-guide="option-1"]');
    expect(onCommit).not.toHaveBeenCalled();
    expect(playUISound).not.toHaveBeenCalled();
    click('[aria-label="Close scene guide"]');
    vi.mocked(playUISound).mockClear();
    click('[data-guide="option-1"]');
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]![0].light).toBe(132);
  });
});
