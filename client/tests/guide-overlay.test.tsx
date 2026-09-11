import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuideOverlay } from "@/components/GuideOverlay";

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

describe("guide navigation", () => {
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
