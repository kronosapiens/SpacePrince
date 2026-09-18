import type { PlanetName } from "@/game/types";
import { MACROBIAN_ORDER } from "@/game/data";
import { strikeMidi } from "./pitches";
import { THEMES, type ThemeName } from "./themes";
import { createScore, type ThemeSurface } from "./score";

export type { ThemeSurface } from "./score";

/**
 * The sound layer: ruler-relative impact and propagation tones, combustion
 * breaths, the star bell, and quiet UI cues (MUSIC.md, VIBES.md §Sound Design).
 *
 * Module singleton, gesture-gated: Tone.js is imported and the AudioContext
 * started on the first pointer/key gesture (`installAudioUnlock`). Every
 * public call no-ops until then — and when its gate (music/sound) is off —
 * so callers never guard.
 */

type ToneModule = typeof import("tone");

let T: ToneModule | null = null;
let initPromise: Promise<void> | null = null;

// Independent volumes: `music` is the score; `sound` is everything else —
// effects, propagation, combustion, the star bell, and UI cues.
const AUDIO_KEY = "sp:audio:v1";

// Both on for a fresh visitor; saved preferences override the defaults.
let musicVolume = 1;
let soundVolume = 1;
let musicOutput: import("tone").Gain | null = null;
let soundOutput: import("tone").Gain | null = null;
const volumeListeners = new Set<() => void>();

export function subscribeVolume(listener: () => void): () => void {
  volumeListeners.add(listener);
  return () => { volumeListeners.delete(listener); };
}

try {
  const raw = localStorage.getItem(AUDIO_KEY);
  if (raw) {
    const saved = JSON.parse(raw) as { music?: number | boolean; sound?: number | boolean };
    musicVolume = typeof saved.music === "number" ? saved.music : saved.music === false ? 0 : 1;
    soundVolume = typeof saved.sound === "number" ? saved.sound : saved.sound === false ? 0 : 1;
  }
} catch {
  /* storage unavailable — session-only defaults */
}

function persistAudio(): void {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify({ music: musicVolume, sound: soundVolume }));
  } catch {
    /* storage unavailable — session-only */
  }
  volumeListeners.forEach((listener) => listener());
}

export function getMusicVolume(): number {
  return musicVolume;
}

export function setMusicVolume(next: number): void {
  const previous = musicVolume;
  musicVolume = next;
  persistAudio();
  musicOutput?.gain.rampTo(next, 0.05);
  if (!T) return;
  if (next === 0) haltTheme(0.1);
  else if (previous === 0) applyTheme();
}

export function getSoundVolume(): number {
  return soundVolume;
}

export function setSoundVolume(next: number): void {
  soundVolume = next;
  persistAudio();
  soundOutput?.gain.rampTo(next, 0.05);
}

/** Install gesture listeners that boot the audio engine. They keep listening
 *  until the context is confirmed running — a single refused resume (stricter
 *  browsers time the gesture window tightly around a dynamic import) must not
 *  mean silence forever. */
export function installAudioUnlock(): void {
  if (typeof window === "undefined") return;
  const unlock = () => {
    ensureAudio()
      .then(() => {
        if (T && T.getContext().state === "running") {
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
        }
      })
      .catch(() => {
        /* retried on the next gesture */
      });
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

/** Boot (or re-resume) the engine. Safe to call from any gesture handler. */
export async function ensureAudio(): Promise<void> {
  if (T) {
    // Built, but a prior resume may have been refused outside a gesture —
    // retry inside this one.
    if (T.getContext().state !== "running") await T.start();
    return;
  }
  return init();
}

async function init(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const tone = await import("tone");
    await tone.start();
    T = tone;
    T.getDestination().volume.value = 0;
    musicOutput = new T.Gain(musicVolume).toDestination();
    soundOutput = new T.Gain(soundVolume).toDestination();
    // Event sounds have their own space; the score owns its mix and effects.
    reverb = new T.Reverb({ decay: 3.2, wet: 0.2 }).connect(soundOutput);
    T.getTransport().start();
    applyTheme();
  })().catch((err) => {
    initPromise = null; // let the next gesture retry from scratch
    throw err;
  });
  return initPromise;
}

// ── Instruments ──────────────────────────────────────────────────────────

let reverb: import("tone").Reverb | null = null;

type AnyInstrument = {
  triggerAttackRelease: (
    note: number | string,
    duration: number,
    time?: number,
    velocity?: number,
  ) => unknown;
};

const instruments = new Map<string, AnyInstrument>();

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Shared soft voice for impacts, propagation, and the star. */
function fxSynth(): AnyInstrument | null {
  if (!T || !reverb) return null;
  const existing = instruments.get("_fx");
  if (existing) return existing;
  const inst = new T.PolySynth(T.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.6 },
    volume: -10,
  }).connect(reverb);
  instruments.set("_fx", inst);
  return inst;
}

// ── Event playback ─────────────────────────────────────────────────────

export type UISound = "hover" | "select" | "commit" | "dismiss";

const UI_SOUNDS: Record<UISound, { note: string; duration: number; velocity: number }> = {
  hover: { note: "D6", duration: 0.025, velocity: 0.16 },
  select: { note: "A5", duration: 0.045, velocity: 0.3 },
  commit: { note: "D5", duration: 0.09, velocity: 0.4 },
  dismiss: { note: "A4", duration: 0.035, velocity: 0.24 },
};
const UI_VOLUME_DB = -18;
const UI_HOVER_COOLDOWN_S = 0.07;
let uiSynth: import("tone").PolySynth | null = null;
let lastUISoundAt = -Infinity;

/** Brief, dry cues; sweeping across targets never queues a trail of ticks. */
export function playUISound(cue: UISound): void {
  if (!T || soundVolume === 0 || T.getContext().state !== "running") return;
  const now = T.now();
  // A clicked control can be replaced under the pointer during navigation.
  if (cue === "hover" && now - lastUISoundAt < UI_HOVER_COOLDOWN_S) return;
  lastUISoundAt = now;
  uiSynth ??= new T.PolySynth(T.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.003, decay: 0.055, sustain: 0.12, release: 0.045 },
    volume: UI_VOLUME_DB,
  }).connect(soundOutput!);
  const sound = UI_SOUNDS[cue];
  uiSynth.triggerAttackRelease(sound.note, sound.duration, now, sound.velocity);
}

export type StrikeShape = "landing" | "flows" | "inverts";

/**
 * A strike is audible (MUSIC.md, "The strike grid"): the struck planet rings
 * its degree in the ruler's mode, at the planet's register, so the
 * whole encounter sounds in one mode. A harmonious hop approaches that note
 * from a fourth below and lands; an inverted hop (square/opposition) hangs a
 * minor second against it that never settles.
 */
export function playStrike(ruler: PlanetName, target: PlanetName, shape: StrikeShape): void {
  if (!T || soundVolume === 0) return;
  const fx = fxSynth();
  if (!fx) return;
  const now = T.now();
  const n = strikeMidi(ruler, target);
  if (shape === "inverts") {
    fx.triggerAttackRelease(midiToFreq(n), 0.5, now, 0.24);
    fx.triggerAttackRelease(midiToFreq(n + 1), 0.55, now + 0.02, 0.2); // ♭2 against it, held
  } else if (shape === "flows") {
    fx.triggerAttackRelease(midiToFreq(n - 5), 0.15, now, 0.24); // a fourth below
    fx.triggerAttackRelease(midiToFreq(n), 0.35, now + 0.12, 0.22); // → home
  } else {
    fx.triggerAttackRelease(midiToFreq(n), 0.35, now, 0.24);
  }
}

/** A short pink-noise breath accompanies the combustion strike. */
export function playCombust(): void {
  if (!T || soundVolume === 0) return;
  const noiseKey = "_combust_noise";
  let noise = instruments.get(noiseKey) as import("tone").NoiseSynth | undefined;
  if (!noise && reverb) {
    noise = new T.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
      volume: -14,
    }).connect(reverb);
    instruments.set(noiseKey, noise as unknown as AnyInstrument);
  }
  noise?.triggerAttackRelease(0.5, T.now() + 0.4, 0.6);
}

/** A run's star taking its place — a quiet high bell, far away. */
export function playStar(): void {
  if (!T || soundVolume === 0) return;
  const fx = fxSynth();
  if (!fx) return;
  const now = T.now();
  fx.triggerAttackRelease(midiToFreq(86), 1.2, now, 0.28); // D6
  fx.triggerAttackRelease(midiToFreq(81), 1.0, now + 0.18, 0.2); // A5 under it
}

// ── The score ───────────────────────────────────────────────────────────

const MIX_RAMP_S = 2.2;
const SWAP_FADE_S = 1.1;
const SCORE_VOLUME = 0.9;
const THEME_ORDER: ThemeName[] = ["Main", ...MACROBIAN_ORDER];

let desired: { theme: ThemeName; surface: ThemeSurface } | null = null;
let playing: { theme: ThemeName; score: ReturnType<typeof createScore> } | null = null;
let swapTimer: number | null = null;
const themeListeners = new Set<() => void>();

/** Change the mix in place for the same theme; fade between different themes. */
export function setTheme(theme: ThemeName | null, surface: ThemeSurface = "map"): void {
  desired = theme ? { theme, surface } : null;
  for (const listener of themeListeners) listener();
  if (T && musicVolume > 0) applyTheme();
}

/** The theme selected by the surface, even when music is disabled. */
export function currentTheme(): ThemeName | null {
  return desired?.theme ?? null;
}

export function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

/** Dev audition: cycle through Main and the planets in Macrobian order. */
export function nextTheme(): void {
  const cur = desired;
  if (!cur) return;
  const next = THEME_ORDER[(THEME_ORDER.indexOf(cur.theme) + 1) % THEME_ORDER.length]!;
  setTheme(next, cur.surface);
}

function cancelSwap(): void {
  if (swapTimer === null) return;
  window.clearTimeout(swapTimer);
  swapTimer = null;
}

function applyTheme(): void {
  if (!T || musicVolume === 0) return;
  cancelSwap();
  if (!desired) {
    haltTheme(SWAP_FADE_S);
    return;
  }
  const { theme, surface } = desired;
  if (playing?.theme === theme) {
    playing.score.mix(surface, MIX_RAMP_S);
    playing.score.fade(SCORE_VOLUME, MIX_RAMP_S);
  } else if (playing) {
    playing.score.fade(0, SWAP_FADE_S);
    swapTimer = window.setTimeout(() => {
      swapTimer = null;
      playing?.score.dispose();
      startScore(theme, surface);
    }, SWAP_FADE_S * 1000 + 50);
  } else {
    startScore(theme, surface);
  }
}

function startScore(theme: ThemeName, surface: ThemeSurface): void {
  if (!T) return;
  const score = createScore(T, THEMES[theme], surface, musicOutput!);
  playing = { theme, score };
  score.fade(SCORE_VOLUME, SWAP_FADE_S);
}

function haltTheme(fadeS: number): void {
  cancelSwap();
  const held = playing;
  playing = null;
  if (!held) return;
  held.score.fade(0, fadeS);
  // A quick off/on gets a separate score, so this tail cannot enter its mix.
  window.setTimeout(() => held.score.dispose(), fadeS * 1000 + 100);
}
