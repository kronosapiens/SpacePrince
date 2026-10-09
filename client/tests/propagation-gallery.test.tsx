import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PropagationPhrases } from "@/components/PropagationPhrases";
import { ensureAudio, playPropagationPreview, setTheme } from "@/audio/engine";

const audio = vi.hoisted(() => ({ sound: 1, theme: null as string | null, listeners: new Set<() => void>(), cancel: vi.fn() }));
vi.mock("@/audio/engine", () => ({
  currentTheme: () => audio.theme,
  subscribeTheme: (listener: () => void) => {
    audio.listeners.add(listener);
    return () => audio.listeners.delete(listener);
  },
  subscribeVolume: () => () => {},
  getSoundVolume: () => audio.sound,
  ensureAudio: vi.fn(async () => {}),
  setTheme: vi.fn((theme: string | null) => { audio.theme = theme; audio.listeners.forEach((listener) => listener()); }),
  playPropagationPreview: vi.fn(() => audio.cancel),
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  audio.sound = 1;
  audio.theme = null;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<PropagationPhrases />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")].find((element) => element.getAttribute("aria-label") === label || element.textContent === label)!;
async function play(action = "Testify") { await act(async () => button(`Play ${action} phrase`).click()); }
function select(index: number, value: string) {
  act(() => {
    const control = container.querySelectorAll("select")[index]!;
    control.value = value;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

it("plays the selected ruler, source, and recipients and follows the audible note callbacks", async () => {
  await play();
  expect(ensureAudio).toHaveBeenCalledOnce();
  expect(setTheme).toHaveBeenCalledWith(null);
  let [notes, onNote, onEnd] = vi.mocked(playPropagationPreview).mock.calls.at(-1)!;
  expect(notes.map((note) => note.midi)).toEqual([74, 78, 81, 76]);
  act(() => onNote(1));
  expect([...container.querySelectorAll('[data-sounding="true"]')].map((note) => note.getAttribute("data-planet"))).toEqual(["Sun", "Mercury"]);
  act(() => onEnd());
  expect(container.querySelector('[data-sounding="true"]')).toBeNull();
  expect(button("Stop phrase").disabled).toBe(true);

  select(0, "Saturn");
  select(1, "Moon");
  act(() => button("Mercury").click());
  await play();
  [notes] = vi.mocked(playPropagationPreview).mock.calls.at(-1)!;
  expect(notes.map((note) => note.planet)).toEqual(["Moon", "Saturn", "Venus"]);
  expect(notes.map((note) => note.midi)).toEqual([79, 80, 87]);
});

it("cancels sound on replay, another variant, control changes, stop, and unmount", async () => {
  await play();
  await play();
  expect(audio.cancel).toHaveBeenCalledTimes(1);
  await play("Necessity");
  expect(audio.cancel).toHaveBeenCalledTimes(2);
  select(0, "Moon");
  expect(audio.cancel).toHaveBeenCalledTimes(3);
  await play();
  select(1, "Venus");
  expect(audio.cancel).toHaveBeenCalledTimes(4);
  await play();
  act(() => button("Saturn").click());
  expect(audio.cancel).toHaveBeenCalledTimes(5);
  await play();
  act(() => button("Stop phrase").click());
  expect(audio.cancel).toHaveBeenCalledTimes(6);
  await play();
  act(() => root.render(<p>Back to game</p>));
  expect(audio.cancel).toHaveBeenCalledTimes(7);
});

it("does not start a phrase after a pending unlock is stopped or replaced", async () => {
  let finishUnlock!: () => void;
  vi.mocked(ensureAudio).mockImplementationOnce(() => new Promise<void>((resolve) => { finishUnlock = resolve; }));
  await play();
  act(() => button("Stop phrase").click());
  await act(async () => finishUnlock());
  expect(playPropagationPreview).not.toHaveBeenCalled();

  vi.mocked(ensureAudio).mockImplementationOnce(() => new Promise<void>((resolve) => { finishUnlock = resolve; }));
  await play();
  await play("Necessity");
  expect(playPropagationPreview).toHaveBeenCalledOnce();
  await act(async () => finishUnlock());
  expect(playPropagationPreview).toHaveBeenCalledOnce();
});

it("shows mute and retry feedback without changing the user's sound setting", async () => {
  audio.sound = 0;
  act(() => root.render(<PropagationPhrases />));
  expect(button("Play Testify phrase").disabled).toBe(true);
  expect(container.textContent).toContain("Sound is muted");
  audio.sound = 1;
  act(() => root.render(<PropagationPhrases />));
  vi.mocked(ensureAudio).mockRejectedValueOnce(new Error("resume refused"));
  await play();
  expect(container.textContent).toContain("Audio could not start");
  await play();
  expect(playPropagationPreview).toHaveBeenCalledOnce();
});

it("waits for a selected theme to fade and cancels pending playback on navigation", async () => {
  vi.useFakeTimers();
  act(() => setTheme("Moon"));
  await play();
  expect(playPropagationPreview).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1200));
  expect(playPropagationPreview).toHaveBeenCalledOnce();
  act(() => setTheme("Venus"));
  expect(audio.cancel).toHaveBeenCalledOnce();
  await play();
  act(() => root.render(<p>Back to game</p>));
  act(() => vi.runAllTimers());
  expect(playPropagationPreview).toHaveBeenCalledOnce();
});

it("sustains by default and can compare individual plucks, clearing notes on release or a toggle change", async () => {
  const toggle = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  expect(toggle.checked).toBe(true);
  await play();
  let [, onNote, , sustain] = vi.mocked(playPropagationPreview).mock.calls.at(-1)!;
  expect(sustain).toBe(true);
  for (let index = 0; index < 4; index++) {
    act(() => onNote(index));
    expect(container.querySelectorAll('[data-sounding="true"]')).toHaveLength(index + 1);
  }
  act(() => onNote(null));
  expect(container.querySelectorAll('[data-sounding="true"]')).toHaveLength(0);

  act(() => toggle.click());
  expect(audio.cancel).toHaveBeenCalledOnce();
  expect(container.querySelectorAll('[data-sounding="true"]')).toHaveLength(0);
  expect(button("Stop phrase").disabled).toBe(true);
  await play();
  [, onNote, , sustain] = vi.mocked(playPropagationPreview).mock.calls.at(-1)!;
  expect(sustain).toBe(false);
  act(() => onNote(2));
  expect(container.querySelectorAll('[data-sounding="true"]')).toHaveLength(1);
  act(() => toggle.click());
  expect(audio.cancel).toHaveBeenCalledTimes(2);
  expect(container.querySelectorAll('[data-sounding="true"]')).toHaveLength(0);
  await play();
  [, onNote, , sustain] = vi.mocked(playPropagationPreview).mock.calls.at(-1)!;
  expect(sustain).toBe(true);
  act(() => onNote(2));
  expect(container.querySelectorAll('[data-sounding="true"]')).toHaveLength(3);
});

it("plays the phrase assigned to each action and keeps the current-order reference", async () => {
  const examples = [
    ["Current order", "Current order", [74, 78, 76, 69]],
    ["Testify", "Thirds", [74, 78, 81, 76]],
    ["Afflict", "Falling thirds", [74, 64, 69, 66]],
    ["Necessity", "Arch", [74, 76, 81, 78]],
  ] as const;
  for (const [action, variant, pitches] of examples) {
    await play(action);
    const [notes, , , sustain] = vi.mocked(playPropagationPreview).mock.calls.at(-1)!;
    expect(notes.map((note) => note.midi)).toEqual(pitches);
    expect(sustain).toBe(true);
    expect(button(`Play ${action} phrase`).closest("article")?.querySelector("h3")?.textContent)
      .toBe(action === variant ? action : `${action} · ${variant}`);
  }
});
