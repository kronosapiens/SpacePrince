import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsMenu } from "@/components/SettingsMenu";
import { DevChrome } from "@/components/DevChrome";
import { PrinceStoreProvider } from "@/state/PrinceStore";
import { loadPrince, savePrince } from "@/state/prince";
import { getMusicVolume, getSoundVolume, setMusicVolume, setSoundVolume } from "@/audio/engine";
import { createStubPrince } from "./fixtures";
import { beginRun } from "@/game/run";

vi.hoisted(() => { HTMLCanvasElement.prototype.getContext = () => null; });

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  setMusicVolume(1);
  setSoundVolume(1);
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

function get<T extends HTMLElement = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
const click = (selector: string) => act(() => get(selector).click());
function LocationProbe() {
  return <span data-location>{useLocation().pathname}</span>;
}

function mount() {
  act(() => root.render(<PrinceStoreProvider><SettingsMenu /></PrinceStoreProvider>));
  const trigger = get('[aria-label="Open settings"]');
  trigger.focus();
  click('[aria-label="Open settings"]');
  return trigger;
}

describe("settings menu", () => {
  it.each(["/", "/play"])("re-rolls the Prince inside its preview from %s without navigating or closing it", (path) => {
    const prince = createStubPrince({ numEncounters: 4, runs: [beginRun(1, 4)] });
    savePrince(prince);
    act(() => root.render(
      <MemoryRouter initialEntries={[path]}>
        <PrinceStoreProvider>
          <SettingsMenu />
          <DevChrome />
          <LocationProbe />
        </PrinceStoreProvider>
      </MemoryRouter>,
    ));
    click('[aria-label="Open settings"]');
    click(".prince-inspect-button");
    const preview = get(".prince-modal");

    act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true })));

    const rerolled = loadPrince()!;
    expect(rerolled.id).not.toBe(prince.id);
    expect(rerolled.numEncounters).toBe(prince.numEncounters);
    expect(get(".prince-modal")).toBe(preview);
    expect(get("[data-location]").textContent).toBe(path);
    expect(preview.querySelectorAll('[aria-label="Past runs"] > g')).toHaveLength(rerolled.runs.length - 1);
  });

  it("adjusts independent saved audio levels and reflects changes made outside the menu", () => {
    mount();
    const adjust = (label: string, value: number) => act(() => {
      const input = get(`input[aria-label="${label} volume"]`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    adjust("Sound", 35);
    adjust("Music", 0);
    expect(getSoundVolume()).toBe(0.35);
    expect(getMusicVolume()).toBe(0);
    expect(JSON.parse(localStorage.getItem("sp:audio:v1")!)).toEqual({ sound: 0.35, music: 0 });
    click('[aria-label="Close settings"]');
    click('[aria-label="Open settings"]');
    expect(get<HTMLInputElement>('[aria-label="Sound volume"]').value).toBe("35");
    expect(get<HTMLInputElement>('[aria-label="Music volume"]').value).toBe("0");
    act(() => setMusicVolume(0.6));
    expect(get<HTMLInputElement>('[aria-label="Music volume"]').value).toBe("60");
  });

  it("inspects and dismisses the saved Prince without changing it", () => {
    const prince = createStubPrince();
    savePrince(prince);
    const trigger = mount();
    click(".prince-inspect-button");
    const dialog = get('[role="dialog"]');
    expect(dialog.getAttribute("aria-label")).toBe("Prince");
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialog.querySelector(".chart-svg")?.getAttribute("aria-label")).toBe(`${prince.chart.name} natal chart`);
    expect(dialog.querySelectorAll('[role="button"]')).toHaveLength(0);
    expect(dialog.querySelectorAll('[data-achievement]')).toHaveLength(12);
    click('[aria-label="Close prince"]');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    click('[aria-label="Open settings"]');
    expect(get('[role="dialog"]').getAttribute("aria-label")).toBe("Settings");
    act(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(loadPrince()).toEqual(prince);
  });

  it("dismisses the dropdown with Escape and the gear, with inspection disabled before creation", () => {
    const trigger = mount();
    expect(get<HTMLButtonElement>(".prince-inspect-button").disabled).toBe(true);
    const escapeBehind = vi.fn();
    window.addEventListener("keydown", escapeBehind);
    try {
      const key = (value: string) => act(() => {
        document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));
      });
      expect(get('[role="dialog"]').getAttribute("aria-modal")).toBeNull();
      key("Escape");
      expect(escapeBehind).not.toHaveBeenCalled();
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      click('[aria-label="Open settings"]');
      click('[aria-label="Close settings"]');
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    } finally {
      window.removeEventListener("keydown", escapeBehind);
    }
  });
});
