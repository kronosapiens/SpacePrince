import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { DevChrome } from "@/components/DevChrome";
import { TokenScreen } from "@/screens/TokenScreen";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import * as rng from "@/game/rng";
import { createStubPrince } from "./fixtures";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });
vi.mock("@/components/DevConsole", () => ({ DevConsole: () => null }));
vi.mock("@/audio/engine", () => ({ playUISound: vi.fn() }));

it("keeps a preview stable until reroll or remount, without replacing the saved Prince", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  const saved = createStubPrince();
  savePrince(saved);
  const seed = vi.spyOn(rng, "randomSeed").mockReturnValueOnce(7).mockReturnValueOnce(42).mockReturnValueOnce(91);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const render = (key = 0) => act(() => root.render(
    <MemoryRouter initialEntries={["/token"]}>
      <PrinceStoreProvider>
        <TokenScreen key={key} />
        <DevChrome />
      </PrinceStoreProvider>
    </MemoryRouter>,
  ));
  const artwork = () => container.querySelector(".prince-artwork")!.innerHTML;

  try {
    render();
    const first = artwork();
    const firstStars = container.querySelectorAll('[aria-label="Past runs"] > g').length;
    const firstAchievements = container.querySelectorAll('[aria-label="Achievements"] > g > g').length;
    expect(container.querySelector('[aria-label="Past runs"] > g')).not.toBeNull();
    render();
    expect(artwork()).toBe(first);
    expect(seed).toHaveBeenCalledTimes(1);

    act(() => container.querySelector<HTMLButtonElement>(".token-controls button")!.click());
    const second = artwork();
    expect(second).not.toBe(first);
    expect(container.querySelectorAll('[aria-label="Past runs"] > g').length).not.toBe(firstStars);
    expect(container.querySelectorAll('[aria-label="Achievements"] > g > g').length).not.toBe(firstAchievements);
    expect(seed).toHaveBeenCalledTimes(2);
    expect(loadPrince()).toEqual(saved);

    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true })));
    expect(artwork()).toBe(second);
    expect(loadPrince()).toEqual(saved);

    render(1);
    expect(artwork()).not.toBe(second);
    expect(seed).toHaveBeenCalledTimes(3);
    expect(loadPrince()).toEqual(saved);
  } finally {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
