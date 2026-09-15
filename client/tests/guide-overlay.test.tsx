import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideOverlay } from "@/components/GuideOverlay";
import { chartShape, PLANET_REACH } from "@/components/chart-guide";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mount() {
  const onGameClick = vi.fn();
  const onClose = vi.fn();
  function Tutorial() {
    const [open, setOpen] = useState(false);
    const [phase, setPhase] = useState("first");
    return (
      <div onClick={onGameClick}>
        <div data-guide="target">Game content</div>
        <GuideOverlay
          open={open}
          phase={phase}
          phases={["first", "second", "third"]}
          phaseLabel={{ first: "First", second: "Second", third: "Third" }}
          notes={[{ key: "note", anchor: "target", placement: "bottom", label: "Note", body: "Explanation" }]}
          openLabel="Open guide"
          closeLabel="Close guide"
          onOpen={() => { setPhase("first"); setOpen(true); }}
          onClose={() => { onClose(); setOpen(false); }}
          onPhaseChange={setPhase}
        />
      </div>
    );
  }
  act(() => root.render(<Tutorial />));
  click(".screen-help-button");
  return { onGameClick, onClose };
}

function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  act(() => element.click());
}
const phase = () => document.querySelector('[role="dialog"]')?.getAttribute("aria-label");

describe("guide placement", () => {
  it("keeps planets clear only while their chart is highlighted", () => {
    vi.stubGlobal("innerWidth", 1600);
    vi.stubGlobal("innerHeight", 1200);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(132);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.dataset.guide === "target") return new DOMRect(700, 300, 200, 44);
      if (this.dataset.guide === "wheel-self") return new DOMRect(500, 100, 1000, 1000);
      if (this.dataset.guide === "planet-self-mars") return new DOMRect(780, 420, 40, 40);
      return new DOMRect();
    });
    function Tutorial() {
      const [step, setStep] = useState("chart");
      return <>
        <div data-guide="target" />
        <div data-guide="wheel-self"><div data-guide="planet-self-mars" /></div>
        <GuideOverlay
          open phase={step} phases={["chart", "read"]} phaseLabel={{ chart: "Chart", read: "Read" }}
          notes={[{
            key: "note", anchor: "target", placement: "bottom", label: "Note", body: "Explanation",
            spotlights: step === "chart" ? ["target", "wheel-self"] : ["target"],
          }]}
          shapes={{
            measure: ["wheel-self", "planet-self-mars"],
            shape: (id, rects) => chartShape(id, rects, () => PLANET_REACH),
          }}
          openLabel="Open guide" closeLabel="Close guide"
          onOpen={() => {}} onClose={() => {}} onPhaseChange={setStep}
        />
      </>;
    }
    act(() => root.render(<Tutorial />));
    const noteTop = () => Number.parseFloat(document.querySelector<HTMLElement>(".guide-note")!.style.top);
    expect(noteTop() + 132).toBeLessThan(300);
    click(".guide-step.is-primary");
    expect(noteTop()).toBeGreaterThan(344);
    expect(noteTop()).toBeLessThan(440);
  });

  it.each([0, 45, 90, -45])("connects to the aspect midpoint at %s degrees and places the note beside its rotated bounds", (angle) => {
    vi.stubGlobal("innerWidth", 1600);
    vi.stubGlobal("innerHeight", 1000);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(132);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return this.dataset.guide === "aspect" ? new DOMRect(300, 150, 600, 600) : new DOMRect();
    });
    act(() => root.render(<>
      <div data-guide="aspect" />
      <GuideOverlay
        open phase="chart" phases={["chart"]} phaseLabel={{ chart: "Chart" }}
        notes={[{ key: "aspect", anchor: "aspect", placement: "right", label: "Aspects", body: "Explanation" }]}
        shapes={{ shape: () => ({ rect: { x: 300, y: 443, width: 600, height: 14, angle }, radius: 7 }) }}
        openLabel="Open guide" closeLabel="Close guide"
        onOpen={() => {}} onClose={() => {}} onPhaseChange={() => {}}
      />
    </>));

    const points = document.querySelector(".guide-leader")!.getAttribute("points")!.split(" ").map(p => p.split(",").map(Number));
    expect(points).toHaveLength(2);
    expect(points[0]).toEqual([600, 450]);
    const note = document.querySelector<HTMLElement>(".guide-note")!;
    const left = Number.parseFloat(note.style.left);
    const top = Number.parseFloat(note.style.top);
    const [endX, endY] = points[1]!;
    expect(endX).toBeGreaterThanOrEqual(left);
    expect(endX).toBeLessThanOrEqual(left + 320);
    expect(endY).toBeGreaterThanOrEqual(top);
    expect(endY).toBeLessThanOrEqual(top + 132);
    expect(endX === left || endX === left + 320 || endY === top || endY === top + 132).toBe(true);
    if (angle === 0) expect(points[1]).toEqual([600, 415]);
    if (angle === 90) expect(left).toBeCloseTo(635);
  });

  it("takes a nearby slide before a larger move around the same obstacle", () => {
    vi.stubGlobal("innerWidth", 1600);
    vi.stubGlobal("innerHeight", 1000);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(132);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return this.dataset.guide === "target" ? new DOMRect(700, 90, 200, 44) : new DOMRect();
    });
    act(() => root.render(<>
      <div data-guide="target" />
      <div data-guide="chart" />
      <GuideOverlay
        open phase="chart" phases={["chart"]} phaseLabel={{ chart: "Chart" }}
        notes={[{ key: "note", anchor: "target", spotlights: ["target", "chart"], placement: "bottom", label: "Note", body: "Explanation" }]}
        shapes={{ shape: (id) => id === "chart" ? {
          rect: { x: 0, y: 0, width: 1600, height: 1000 }, radius: 0, lift: true,
          obstacles: [
            { x: 940, y: 250, width: 120, height: 120 },
            { x: 200, y: 18, width: 500, height: 130 },
            { x: 910, y: 18, width: 500, height: 130 },
          ],
        } : undefined }}
        openLabel="Open guide" closeLabel="Close guide"
        onOpen={() => {}} onClose={() => {}} onPhaseChange={() => {}}
      />
    </>));
    const note = document.querySelector<HTMLElement>(".guide-note")!;
    expect(Number.parseFloat(note.style.left)).toBe(612);
    expect(Number.parseFloat(note.style.top)).toBe(167.5);
  });

  it("stops avoiding an area when the next screen no longer highlights it", () => {
    vi.stubGlobal("innerWidth", 1600);
    vi.stubGlobal("innerHeight", 1000);
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(132);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.dataset.guide === "target") return new DOMRect(700, 300, 200, 44);
      if (this.dataset.guide === "background") return new DOMRect(650, 360, 300, 160);
      return new DOMRect();
    });
    function Tutorial() {
      const [step, setStep] = useState("first");
      return <>
        <div data-guide="target">Target</div>
        <div data-guide="background">Background</div>
        <GuideOverlay
          open phase={step} phases={["first", "second"]}
          phaseLabel={{ first: "First", second: "Second" }}
          notes={[{
            key: "note", anchor: "target", placement: "bottom", label: "Note", body: "Explanation",
            spotlights: step === "first" ? ["target", "background"] : ["target"],
          }]}
          shapes={{ measure: ["background"] }}
          openLabel="Open guide" closeLabel="Close guide"
          onOpen={() => {}} onClose={() => {}} onPhaseChange={setStep}
        />
      </>;
    }
    act(() => root.render(<Tutorial />));
    const note = () => document.querySelector<HTMLElement>(".guide-note")!;
    expect(Number.parseFloat(note().style.top) + 132).toBeLessThan(300);
    expect(document.querySelectorAll(".guide-ring")).toHaveLength(2);

    click(".guide-step.is-primary");
    expect(Number.parseFloat(note().style.top)).toBeGreaterThan(360);
    expect(Number.parseFloat(note().style.left) + 160).toBeCloseTo(800.5);
    expect(document.querySelectorAll(".guide-ring")).toHaveLength(1);
  });
});

describe("guide navigation", () => {
  it("navigates with arrow keys, ignores repeats, and closes after the final step", () => {
    const { onGameClick, onClose } = mount();
    const arrow = (key: string, repeat = false) => {
      const event = new KeyboardEvent("keydown", { key, repeat, bubbles: true, cancelable: true });
      act(() => document.querySelector<HTMLElement>(".guide-bar")!.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
    };
    arrow("ArrowLeft");
    expect(phase()).toBe("First");
    arrow("ArrowRight");
    expect(phase()).toBe("Second");
    arrow("ArrowRight", true);
    expect(phase()).toBe("Second");
    arrow("ArrowLeft", true);
    expect(phase()).toBe("Second");
    arrow("ArrowLeft");
    expect(phase()).toBe("First");
    arrow("ArrowRight");
    arrow("ArrowRight");
    expect(phase()).toBe("Third");
    arrow("ArrowRight");
    expect(phase()).toBeUndefined();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onGameClick).not.toHaveBeenCalled();
  });

  it("advances on the background or explanation and closes on the final step without clicking the game", () => {
    const { onGameClick, onClose } = mount();
    expect(phase()).toBe("First");
    click(".guide-overlay");
    expect(phase()).toBe("Second");
    click(".guide-mobile-entry");
    expect(phase()).toBe("Third");
    click(".guide-overlay");
    expect(phase()).toBeUndefined();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onGameClick).not.toHaveBeenCalled();
  });

  it("keeps toolbar navigation from also advancing the backdrop", () => {
    const { onGameClick, onClose } = mount();
    click(".guide-step:disabled");
    click(".guide-bar");
    expect(phase()).toBe("First");
    click(".guide-step.is-primary");
    expect(phase()).toBe("Second");
    click(".guide-step:not(.is-primary)");
    expect(phase()).toBe("First");
    click(".guide-step.is-primary");
    click(".guide-step.is-primary");
    expect(phase()).toBe("Third");
    expect(document.querySelector(".guide-step.is-primary")?.textContent).toBe("Close");
    click(".guide-step.is-primary");
    expect(phase()).toBeUndefined();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onGameClick).not.toHaveBeenCalled();
  });

  it("can close early with the close button or Escape and restarts when reopened", () => {
    const { onGameClick, onClose } = mount();
    click(".guide-overlay");
    click(".guide-close");
    expect(phase()).toBeUndefined();
    click(".screen-help-button");
    expect(phase()).toBe("First");
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(phase()).toBeUndefined();
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onGameClick).not.toHaveBeenCalled();
  });
});
