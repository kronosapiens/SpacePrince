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
import { setTheme, setMusicVolume } from "@/audio/engine";
import type { ThemeName } from "@/audio/themes";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
const audio = vi.hoisted(() => ({
  theme: null as ThemeName | null,
  listeners: new Set<() => void>(),
}));
vi.mock("@/components/ChartTuner", () => ({ ChartTuner: () => null }));
vi.mock("@/audio/engine", () => ({
  playUISound: vi.fn(),
  currentTheme: () => audio.theme,
  subscribeTheme: (listener: () => void) => {
    audio.listeners.add(listener);
    return () => audio.listeners.delete(listener);
  },
  setTheme: vi.fn((theme: ThemeName | null) => {
    audio.theme = theme;
    audio.listeners.forEach((listener) => listener());
  }),
  subscribeVolume: () => () => {},
  getMusicVolume: () => 0,
  getSoundVolume: () => 0,
  setMusicVolume: vi.fn(),
  setSoundVolume: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  audio.theme = null;
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

it("selects each theme while preserving mute and can stop the selection", () => {
  act(() => root.render(<MemoryRouter><GalleryScreen /></MemoryRouter>));
  for (const theme of ["Main", ...PLANETS]) {
    const button = container.querySelector<HTMLButtonElement>(`[aria-label="Play ${theme} theme"]`)!;
    act(() => button.click());
    expect(setTheme).toHaveBeenLastCalledWith(theme);
    expect(button.getAttribute("aria-pressed")).toBe("true");
  }
  expect(setMusicVolume).not.toHaveBeenCalled();
  const stop = container.querySelector<HTMLButtonElement>('.gallery-music-stop')!;
  act(() => stop.click());
  expect(setTheme).toHaveBeenLastCalledWith(null);
  expect(stop.disabled).toBe(true);
});
