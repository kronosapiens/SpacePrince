import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DevChrome } from "@/components/DevChrome";
import GalleryScreen from "@/screens/GalleryScreen";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { PLANET_INTRODUCTIONS } from "@/copy/planet-introductions";
import { PLANETS } from "@/game/data";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/components/ChartTuner", () => ({ ChartTuner: () => null }));
vi.mock("@/audio/engine", () => ({
  playUISound: vi.fn(),
  currentTheme: () => null,
  subscribeTheme: () => () => {},
  subscribeVolume: () => () => {},
  getMusicVolume: () => 0,
  getSoundVolume: () => 0,
  setMusicVolume: vi.fn(),
  setSoundVolume: vi.fn(),
  nextTheme: vi.fn(),
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

function key(value: string) {
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true })));
}

it("opens locked planet previews from dev navigation without changing the saved Prince", () => {
  const prince = createStubPrince({ numEncounters: 0 });
  savePrince(prince);
  act(() => root.render(
    <MemoryRouter>
      <PrinceStoreProvider>
        <Routes>
          <Route path="/" element={<p>Game</p>} />
          <Route path="/gallery" element={<GalleryScreen />} />
        </Routes>
        <DevChrome />
      </PrinceStoreProvider>
    </MemoryRouter>,
  ));
  key("p");
  key("7");
  expect(container.querySelector("h1")?.textContent).toBe("Design gallery");
  for (const planet of PLANETS) {
    expect(container.querySelector(`button[aria-label="Preview ${planet} reveal"]`)).not.toBeNull();
  }

  const sign = container.querySelector("select")!;
  act(() => {
    sign.value = "Aries";
    sign.dispatchEvent(new Event("change", { bubbles: true }));
  });
  act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Preview Saturn reveal"]')!.click());
  expect(document.querySelector(".planet-intro-portrait")?.textContent).toBe(PLANET_INTRODUCTIONS.Saturn.Aries);
  key("Escape");
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(container.querySelector("h1")?.textContent).toBe("Design gallery");
  key("r");
  expect(loadPrince()).toEqual(prince);
});
