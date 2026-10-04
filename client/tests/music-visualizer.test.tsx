import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { seekTheme, toggleMusicPart } from "@/audio/engine";
import { ALL_MUSIC_PARTS, type MusicPartState } from "@/audio/music-parts";
import { MusicVisualizer } from "@/components/MusicVisualizer";

const audio = vi.hoisted(() => ({
  beat: 16 as number | null,
  parts: { muted: [] } as MusicPartState,
  listeners: new Set<() => void>(),
}));
vi.mock("@/audio/engine", () => ({
  themeBeat: () => audio.beat,
  seekTheme: vi.fn((_theme: string, beat: number) => { audio.beat = Math.max(0, Math.min(128, beat)); }),
  getMusicParts: () => audio.parts,
  subscribeMusicParts: (listener: () => void) => {
    audio.listeners.add(listener);
    return () => audio.listeners.delete(listener);
  },
  toggleMusicPart: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
let frame: FrameRequestCallback;

beforeEach(() => {
  vi.clearAllMocks();
  audio.beat = 16;
  audio.parts = ALL_MUSIC_PARTS;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("maps clicks and drag previews to score time, committing only on release", () => {
  act(() => root.render(<MusicVisualizer theme="Main" />));
  const plot = container.querySelector<SVGSVGElement>('[role="slider"]')!;
  plot.getBoundingClientRect = () => ({ left: 100, width: 1000 } as DOMRect);
  plot.setPointerCapture = vi.fn();
  plot.releasePointerCapture = vi.fn();
  const pointer = (type: string, beat: number) => act(() => {
    const event = new MouseEvent(type, { bubbles: true, clientX: 100 + 48 + beat / 128 * 932, button: 0 });
    Object.defineProperty(event, "pointerId", { value: 1 });
    plot.dispatchEvent(event);
    frame(0);
  });

  pointer("pointerdown", 64);
  expect(seekTheme).not.toHaveBeenCalled();
  expect(plot.getAttribute("aria-valuenow")).toBe("48");
  pointer("pointerup", 64);
  expect(seekTheme).toHaveBeenLastCalledWith("Main", 64);
  pointer("pointerdown", 32);
  pointer("pointermove", 96);
  expect(seekTheme).toHaveBeenCalledTimes(1);
  expect(Number(plot.querySelector(".music-playhead")!.getAttribute("x1"))).toBe(747);
  pointer("pointerup", 96);
  expect(seekTheme).toHaveBeenLastCalledWith("Main", 96);

  audio.beat = null;
  frame(0);
  pointer("pointerdown", 48);
  pointer("pointerup", 48);
  expect(plot.getAttribute("aria-disabled")).toBe("true");
  expect(seekTheme).toHaveBeenCalledTimes(2);
});

it("seeks with arrows and Home / End, and disables keyboard seeking when silent", () => {
  act(() => root.render(<MusicVisualizer theme="Main" />));
  const plot = container.querySelector<SVGSVGElement>('[role="slider"]')!;
  const key = (key: string) => act(() => plot.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
  key("Home");
  expect(seekTheme).toHaveBeenLastCalledWith("Main", 0);
  key("ArrowRight");
  key("ArrowRight");
  expect(audio.beat).toBeCloseTo(10 * 80 / 60);
  key("ArrowLeft");
  expect(audio.beat).toBeCloseTo(5 * 80 / 60);
  key("End");
  expect(seekTheme).toHaveBeenLastCalledWith("Main", 128);
  audio.beat = null;
  key("Home");
  expect(seekTheme).toHaveBeenCalledTimes(5);
});

it("offers the available parts as toggles and dims only the detailed score when parts are muted", () => {
  act(() => root.render(<><MusicVisualizer theme="Main" /><MusicVisualizer theme="Main" overview /></>));
  const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>(".music-part")].find((node) => node.querySelector(".music-part-role")?.textContent === label);
  const setParts = (parts: MusicPartState) => act(() => {
    audio.parts = parts;
    audio.listeners.forEach((listener) => listener());
  });
  const opacity = (selector: string) => Number(container.querySelector(selector)!.getAttribute("opacity"));
  expect([...container.querySelectorAll(".music-part")].map((node) => [
    node.querySelector(".music-part-role")?.textContent,
    node.querySelector(".music-part-sound")?.textContent,
  ])).toEqual([
    ["Melody", "Bell"], ["Bass", "Synth"], ["Harmony", "Pad"], ["Arpeggios", "Pluck"], ["Percussion", "Drums"],
  ]);
  act(() => button("Bass")!.click());
  expect(toggleMusicPart).toHaveBeenCalledWith("bass");
  setParts({ muted: ["bass"] });
  expect(button("Bass")!.getAttribute("aria-pressed")).toBe("false");
  expect(opacity('.music-score [data-role="bass"]')).toBeCloseTo(0.12);
  expect(opacity('.music-overview [data-role="bass"]')).toBe(0.8);
  act(() => button("Harmony")!.click());
  expect(toggleMusicPart).toHaveBeenCalledWith("pads");
  setParts({ muted: ["bass", "pads"] });
  expect(button("Melody")!.getAttribute("aria-pressed")).toBe("true");
  expect(opacity('.music-score [data-role="lead"]')).toBe(1);
  expect(opacity('.music-score [data-role="pad"]')).toBeLessThan(0.1);
  expect(seekTheme).not.toHaveBeenCalled();

  act(() => root.render(<MusicVisualizer theme="Moon" />));
  expect(button("Percussion")).toBeUndefined();
  expect(button("Arpeggios")).toBeDefined();
  expect(container.textContent).not.toContain("Low notes below");
});
