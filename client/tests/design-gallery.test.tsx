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
import { resetMusicParts, setTheme, setMusicVolume } from "@/audio/engine";
import { ALL_MUSIC_PARTS } from "@/audio/music-parts";
import { THEMES, type ThemeName } from "@/audio/themes";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
const audio = vi.hoisted(() => ({
  theme: null as ThemeName | null,
  listeners: new Set<() => void>(),
}));
vi.mock("@/components/ChartTuner", () => ({ ChartTuner: () => null }));
vi.mock("@/audio/engine", () => ({
  playUISound: vi.fn(),
  themeBeat: () => null,
  seekTheme: vi.fn(),
  getMusicParts: () => ALL_MUSIC_PARTS,
  subscribeMusicParts: () => () => {},
  resetMusicParts: vi.fn(),
  toggleMusicPart: vi.fn(),
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
  expect(container.querySelectorAll(".music-overview")).toHaveLength(8);
  let bassY: string | null = null;
  for (const theme of ["Main", ...PLANETS] as const) {
    const button = container.querySelector<HTMLButtonElement>(`[aria-label="Play ${theme} theme"]`)!;
    act(() => button.click());
    expect(setTheme).toHaveBeenLastCalledWith(theme);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    const plot = container.querySelector(".music-score")!;
    const spec = THEMES[theme];
    expect(plot.getAttribute("aria-label")).toContain(`${theme} map arrangement`);
    expect(plot.querySelectorAll(".music-score-note")).toHaveLength(spec.bed.length + spec.down.length);
    // Every theme begins with D2: its height stays fixed when the theme changes.
    const bass = plot.querySelector('[data-role="bass"]')!;
    bassY ??= bass.getAttribute("y1");
    expect(bass.getAttribute("y1")).toBe(bassY);
    const melody = plot.querySelector('[data-role="lead"]')!;
    const note = spec.bed.find((note) => note.role === "lead")!;
    const plotWidth = 932;
    expect(Number(melody.getAttribute("x1"))).toBeCloseTo(48 + note.t / spec.beats * plotWidth);
    expect(Number(melody.getAttribute("x2")) - Number(melody.getAttribute("x1"))).toBeCloseTo(note.d / spec.beats * plotWidth);
    expect(plot.querySelectorAll('[data-role="hat"]')).toHaveLength(theme === "Main" ? spec.bed.filter((note) => note.role === "hat").length : 0);
  }
  expect(setMusicVolume).not.toHaveBeenCalled();
  const stop = container.querySelector<HTMLButtonElement>('.gallery-music-stop')!;
  act(() => stop.click());
  expect(setTheme).toHaveBeenLastCalledWith(null);
  expect(stop.disabled).toBe(true);
  expect(container.querySelector(".music-score")).toBeNull();
});

it("uses the map arrangement for a theme carried into the gallery", () => {
  audio.theme = "Moon";
  act(() => root.render(<MemoryRouter><GalleryScreen /></MemoryRouter>));
  expect(setTheme).toHaveBeenCalledWith("Moon", "map");
  act(() => root.render(<p>Back to game</p>));
  expect(resetMusicParts).toHaveBeenCalledOnce();
});
