import { PlayerChartLayout } from "@/components/PlayerChartLayout";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterNarrativeScreen } from "@/screens/EncounterNarrative";
import { beginNarrativeEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";
import { PLANETS } from "@/game/data";
import { combustionCeiling } from "@/game/combust";
import { getScenario } from "@/data/narrative-scenarios";
import { INTERACTION_SCENE } from "./narrative-fixture";
import { createStubPrince } from "./fixtures";
import { playUISound } from "@/audio/engine";

vi.hoisted(() => {
  // Chart's optional numeric badges measure text through canvas.
  HTMLCanvasElement.prototype.getContext = () => null;
});
vi.mock("@/audio/engine", () => ({ playNecessityNote: vi.fn(), setTheme: vi.fn(), playCombust: vi.fn(), playStrike: vi.fn(), playUISound: vi.fn() }));

vi.mock("@/data/narrative-scenarios", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/data/narrative-scenarios")>();
  const { INTERACTION_SCENE } = await import("./narrative-fixture");
  return { ...original, getScenario: (id: string) => id === INTERACTION_SCENE.scenarioId ? INTERACTION_SCENE : original.getScenario(id) };
});

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

function mount(id: string, prince = createStubPrince(), light = 120) {
  const scenario = getScenario(id);
  const run = { ...beginRun(prince.chart, 42, prince.numEncounters), light };
  run.state.Moon.affliction = 10;
  run.state.Sun.affliction = 10;
  run.state.Mars.affliction = 24;
  run.state.Venus.affliction = combustionCeiling(prince.chart.planets.Venus);
  const encounter = beginNarrativeEncounter({ run, house: scenario.house, scenarioId: id });
  run.encounter = encounter;
  const onCommit = vi.fn();
  const render = (nextRun = run) => {
    if (nextRun.encounter?.kind !== "narrative") throw new Error("Expected narrative encounter");
    const nextEncounter = nextRun.encounter;
    act(() => root.render(<PlayerChartLayout className="narrative" chart={prince.chart} unlockedPlanets={[]}>
      <EncounterNarrativeScreen prince={prince} run={nextRun} encounter={nextEncounter}
      onCommit={onCommit} onClearEncounter={vi.fn()} />
    </PlayerChartLayout>));
  };
  render();
  return { prince, run, onCommit, render };
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
    const { run, onCommit, render } = mount(INTERACTION_SCENE.scenarioId, createStubPrince(), 216);
    const options = [...document.querySelectorAll(".option")].map((option) => option.textContent);
    hoverOption(4);
    expect(document.querySelector(".option.is-selected")).toBeNull();
    expect(element('[data-guide="planet-self-moon"]').closest('[role="button"]')).not.toBeNull();
    click('[data-guide="option-4"]');
    expect(document.querySelector("select")).toBeNull();
    expect(document.querySelector('[data-guide="incoming"]')).not.toBeNull();
    expect(element('[data-guide="planet-self-moon"]').closest('[role="button"]')).toBeNull();
    click('[data-guide="option-4"]');
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
    expect(element(".option.is-selected").getAttribute("data-guide")).toBe("option-4");
  });

  it("previews multiple targets and applies the activated planet without a preceding hover", () => {
    const { onCommit } = mount(INTERACTION_SCENE.scenarioId);
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
    const { run, onCommit } = mount(INTERACTION_SCENE.scenarioId);
    const aside = "Testify 24 on each lit planet · Lose 24 Light";
    expect(element('[data-guide="option-aside-5"]').textContent).toBe(aside);
    choose("sun");
    hoverOption(5);
    expect(element(".ps-name").textContent).toContain("SUN");
    expect(element(".ps-effect").textContent).toBe("Testify 10");
    expect(document.querySelector('[data-guide="arc-self-sun"] .arc-diff')).not.toBeNull();
    expect(element('[data-guide="option-aside-5"]').textContent).toBe(aside);
    expect(onCommit).not.toHaveBeenCalled();
    click('[data-guide="option-5"]');
    const next = onCommit.mock.calls[0]![0];
    expect(next.state.Sun.affliction).toBe(0);
    expect(next.state.Moon.affliction).toBe(0);
    expect(next.state.Mars.affliction).toBe(0);
    expect(next.state.Venus.affliction).toBe(run.state.Venus.affliction);
    expect(next.light).toBe(96);
  });

  it("keeps the selected target action separate from option previews", () => {
    const { onCommit } = mount(INTERACTION_SCENE.scenarioId);
    click('[data-guide="option-2"]');
    hoverPlanet("sun");
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
    const { onCommit } = mount(INTERACTION_SCENE.scenarioId);
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
    const { onCommit } = mount(INTERACTION_SCENE.scenarioId);
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
    const { onCommit } = mount(INTERACTION_SCENE.scenarioId, createStubPrince(), 216);
    click('[data-guide="option-4"]');
    click('[aria-label="Study this scene"]');
    focus('[data-guide="planet-self-venus"]');
    expect(element(".ps-effect").textContent).toContain("Testify");
    vi.mocked(playUISound).mockClear();
    choose("venus");
    expect(onCommit).not.toHaveBeenCalled();
    expect(playUISound).not.toHaveBeenCalled();
    click('[aria-label="Close scene guide"]');
    expect(element('[data-guide="option-4"]').getAttribute("aria-pressed")).toBe("true");
    choose("venus");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(playUISound).toHaveBeenLastCalledWith("commit");
  });

  it("names the planets in the house and shows its terms", () => {
    const prince = createStubPrince();
    prince.chart.ascendantSign = "Libra";
    for (const planet of PLANETS) prince.chart.planets[planet].sign = "Aries";
    Object.assign(prince.chart.planets.Saturn, { sign: "Capricorn", dignity: "Domicile" });
    mount("home-capricorn-salting", prince);
    expect(element(".narrative-occupants").textContent).toBe("Saturn is in this house: the terms are better.");
    expect(element('[data-guide="option-aside-1"]').textContent).toBe("Testify 24 on a chosen planet");
  });

  it("commits an untargeted option on first activation and keeps its result highlighted", () => {
    const { onCommit, render } = mount(INTERACTION_SCENE.scenarioId);
    const aside = element('[data-guide="option-aside-3"]').textContent;
    click('[data-guide="option-3"]');
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    expect(document.querySelector(".ps-action")).toBeNull();
    expect(onCommit).toHaveBeenCalledTimes(1);
    const next = onCommit.mock.calls[0]![0];
    expect(next.light).toBe(132);
    render(next);
    expect(element(".option.is-selected").getAttribute("data-guide")).toBe("option-3");
    expect(element('[data-guide="option-aside-3"]').textContent).toBe(aside);
  });

  it("blocks untargeted commitment and its sound while the guide is open", () => {
    const { onCommit } = mount(INTERACTION_SCENE.scenarioId);
    click('[aria-label="Study this scene"]');
    vi.mocked(playUISound).mockClear();
    click('[data-guide="option-3"]');
    expect(onCommit).not.toHaveBeenCalled();
    expect(playUISound).not.toHaveBeenCalled();
    click('[aria-label="Close scene guide"]');
    vi.mocked(playUISound).mockClear();
    click('[data-guide="option-3"]');
    expect(vi.mocked(playUISound).mock.calls).toEqual([["commit"]]);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0]![0].light).toBe(132);
  });
});


describe("narrative Resolve previews", () => {
  it.each([false, true])("shows final capacity and Resolve before a gain commits (free: %s)", (free) => {
    const prince = createStubPrince();
    prince.chart.ascendantSign = "Libra";
    for (const planet of PLANETS) prince.chart.planets[planet].sign = "Aries";
    if (free) Object.assign(prince.chart.planets.Saturn, { sign: "Capricorn", dignity: "Domicile" });
    const { run, onCommit, render } = mount("home-capricorn-salting", prince);
    const ceiling = combustionCeiling(prince.chart.planets.Moon);
    const remaining = ceiling - run.state.Moon.affliction;
    const arc = () => element('[data-guide="arc-self-moon"]');
    const trackBefore = arc().firstElementChild!.getAttribute("d");
    click('[data-guide="option-2"]');
    focus('[data-guide="planet-self-moon"]');
    expect(element(".ps-ratio").textContent).toBe(`Resolve${remaining}/${ceiling}→ ${remaining + (free ? 12 : 0)}/${ceiling + 12}`);
    expect(arc().firstElementChild!.getAttribute("d")).not.toBe(trackBefore);
    expect(arc().querySelector(".arc-diff") !== null).toBe(free);
    expect(run.gains.Moon.resolve).toBe(0);
    choose("moon");
    const next = onCommit.mock.calls[0]![0];
    expect(next.gains.Moon.resolve).toBe(12);
    expect(next.state.Moon.affliction).toBe(run.state.Moon.affliction + (free ? 0 : 12));
    render(next);
    expect(arc().querySelector(".arc-diff")).toBeNull();
  });
});
