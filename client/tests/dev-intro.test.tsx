import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DevConsole } from "@/components/DevConsole";
import { InfoCardHost } from "@/components/InfoCardHost";
import { InfoCardProvider, useInfoCards } from "@/state/InfoCardContext";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { PLANET_INTRODUCTIONS } from "@/copy/planet-introductions";
import { createStubPrince } from "./fixtures";

vi.mock("@/components/ChartTuner", () => ({ ChartTuner: () => null }));
vi.mock("@/audio/engine", () => ({
  currentTheme: () => null,
  subscribeTheme: () => () => {},
  isMusicEnabled: () => false,
  isSoundEnabled: () => false,
  setMusicEnabled: vi.fn(),
  setSoundEnabled: vi.fn(),
  shuffleTheme: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function QueueProbe() {
  const { current, enqueueCard } = useInfoCards();
  return <button data-queue onClick={() => enqueueCard({ kind: "planet-intro", planet: "Mercury" })}>
    {current?.planet ?? "empty"}
  </button>;
}

function render(open = true, showHost = false) {
  act(() => root.render(
    <PrinceStoreProvider>
      <InfoCardProvider>
        <DevConsole open={open} />
        <QueueProbe />
        {showHost && <InfoCardHost />}
      </InfoCardProvider>
    </PrinceStoreProvider>,
  ));
}

function click(selector: string) {
  const element = document.querySelector(selector);
  expect(element).not.toBeNull();
  act(() => element!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("dev planet introduction preview", () => {
  it("opens without the gameplay host and leaves the Prince and unlock queue untouched", () => {
    const prince = createStubPrince({ numEncounters: 4 });
    savePrince(prince);
    render();
    click(".dev-console-block .dev-chrome-button");
    expect(document.querySelector('[role="dialog"]')?.getAttribute("aria-label")).toBe("Sun unlocked");
    expect(document.querySelector(".planet-intro-portrait")?.textContent)
      .toBe(PLANET_INTRODUCTIONS.Sun[prince.chart.planets.Sun.sign]);
    expect(document.querySelector("[data-queue]")?.textContent).toBe("empty");
    expect(loadPrince()).toEqual(prince);

    // Hiding the toolbar must not hide the modal being inspected.
    render(false);
    expect(document.querySelector(".dev-console")).toBeNull();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    render(false, true);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("previews the current tier without replacing or dismissing an earned introduction", () => {
    savePrince(createStubPrince({ numEncounters: 8 }));
    render();
    click("[data-queue]");
    click(".dev-console-block .dev-chrome-button");
    expect(document.querySelector(".planet-intro-name")?.textContent).toBe("Mars");
    click(".info-card-close");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelector("[data-queue]")?.textContent).toBe("Mercury");

    render(false, true);
    expect(document.querySelector(".planet-intro-name")?.textContent).toBe("Mercury");
    click(".info-card-close");
    expect(document.querySelector("[data-queue]")?.textContent).toBe("empty");
  });
});
