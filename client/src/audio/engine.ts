import type { PlanetName } from "@/game/types";
import { strikeMidi } from "./pitches";
import { THEMES, type ThemeName } from "./themes";
import { createScore, type ThemeSurface } from "./score";
import { ALL_MUSIC_PARTS, type MusicPart, type MusicPartState } from "./music-parts";
import { BELL_VOICE, PLANET_VOICE } from "./voices";

export type { ThemeSurface } from "./score";

/**
 * The sound layer: ruler-relative effect and propagation tones, combustion
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
let disposed = false;
const unlockCleanups = new Set<() => void>();

// Independent volumes: `music` is the score; `sound` is everything else —
// effects, propagation, combustion, the star bell, and UI cues.
const AUDIO_KEY = "sp:audio:v1";

// Both on for a fresh visitor, music at half; saved preferences override the defaults.
const DEFAULT_MUSIC_VOLUME = 0.5;
let musicVolume = DEFAULT_MUSIC_VOLUME;
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
    musicVolume = typeof saved.music === "number" ? saved.music : saved.music === false ? 0 : DEFAULT_MUSIC_VOLUME;
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
export function installAudioUnlock(): () => void {
  if (typeof window === "undefined" || disposed) return () => {};
  const cleanup = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    unlockCleanups.delete(cleanup);
  };
  const unlock = () => {
    ensureAudio()
      .then(() => {
        if (T && T.getContext().state === "running") {
          cleanup();
        }
      })
      .catch(() => {
        /* retried on the next gesture */
      });
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  unlockCleanups.add(cleanup);
  return cleanup;
}

/** Boot (or re-resume) the engine. Safe to call from any gesture handler. */
export async function ensureAudio(): Promise<void> {
  if (disposed) return;
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
    if (disposed) return;
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
  dispose: () => unknown;
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

const FX_VOLUME_DB = -10;

/** Cached voices for encounter strikes and the star. */
function fxSynth(kind: "planet" | "star"): AnyInstrument | null {
  if (!T || !reverb) return null;
  const key = `_fx_${kind}`;
  const existing = instruments.get(key);
  if (existing) return existing;
  const voice = kind === "planet" ? PLANET_VOICE : BELL_VOICE;
  const inst = new T.PolySynth(T.FMSynth, { ...voice, volume: FX_VOLUME_DB }).connect(reverb);
  instruments.set(key, inst);
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

/**
 * A strike is audible (MUSIC.md, "The strike grid"): the struck planet rings
 * its degree in the ruler's mode, in the shared octave, so the
 * whole encounter sounds in one mode.
 */
export function playStrike(ruler: PlanetName, target: PlanetName): void {
  if (!T || soundVolume === 0) return;
  const fx = fxSynth("planet");
  if (!fx) return;
  const now = T.now();
  const n = strikeMidi(ruler, target);
  fx.triggerAttackRelease(midiToFreq(n), 0.35, now, 0.24);
}

/** One planetary note; its release fits inside the visual cadence. */
export function playNecessityNote(ruler: PlanetName, target: PlanetName, durationSeconds: number): () => void {
  if (!T || !soundOutput || soundVolume === 0 || T.getContext().state !== "running") return () => {};
  const release = Math.min(0.15, durationSeconds / 2);
  // A dedicated, dry voice can be silenced without cutting other effects or leaving a reverb tail.
  const voice = new T.FMSynth({
    ...PLANET_VOICE,
    volume: FX_VOLUME_DB,
    envelope: { ...PLANET_VOICE.envelope, release },
  }).connect(soundOutput);
  // Match the visual accent and disposal timer without the score's scheduling lookahead.
  voice.triggerAttackRelease(midiToFreq(strikeMidi(ruler, target)), durationSeconds - release, T.immediate(), 0.24);
  let disposed = false;
  const cancel = () => {
    window.clearTimeout(timer);
    if (disposed) return;
    disposed = true;
    voice.dispose();
  };
  const timer = window.setTimeout(cancel, durationSeconds * 1000);
  return cancel;
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
  const fx = fxSynth("star");
  if (!fx) return;
  const now = T.now();
  fx.triggerAttackRelease(midiToFreq(86), 1.2, now, 0.28); // D6
  fx.triggerAttackRelease(midiToFreq(81), 1.0, now + 0.18, 0.2); // A5 under it
}

// ── The score ───────────────────────────────────────────────────────────

const MIX_RAMP_S = 2.2;
const SWAP_FADE_S = 1.1;
const SEEK_FADE_S = 0.04;
const SCORE_VOLUME = 0.9;

let desired: { theme: ThemeName; surface: ThemeSurface } | null = null;
let playing: { theme: ThemeName; score: ReturnType<typeof createScore>; seekBeat?: number } | null = null;
let swapTimer: number | null = null;
const themeListeners = new Set<() => void>();
let musicParts = ALL_MUSIC_PARTS;
const partListeners = new Set<() => void>();

export function getMusicParts(): MusicPartState {
  return musicParts;
}

export function subscribeMusicParts(listener: () => void): () => void {
  partListeners.add(listener);
  return () => partListeners.delete(listener);
}

function setMusicParts(next: MusicPartState): void {
  musicParts = next;
  playing?.score.parts(next);
  for (const listener of partListeners) listener();
}

export function toggleMusicPart(part: MusicPart): void {
  const muted = musicParts.muted.includes(part)
    ? musicParts.muted.filter((value) => value !== part) : [...musicParts.muted, part];
  setMusicParts({ muted });
}

export function resetMusicParts(): void {
  setMusicParts(ALL_MUSIC_PARTS);
}

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

/** Loop position; a committed seek stays still until the new audio starts. */
export function themeBeat(theme: ThemeName): number | null {
  if (!T || musicVolume === 0 || desired?.theme !== theme || playing?.theme !== theme
    || T.getContext().state !== "running" || T.getTransport().state !== "started") return null;
  if (swapTimer !== null && playing.seekBeat !== undefined) return playing.seekBeat;
  return playing.score.beat() ?? playing.seekBeat ?? null;
}

/** Replace this score at a loop position without moving the shared transport. */
export function seekTheme(theme: ThemeName, beat: number): void {
  if (themeBeat(theme) === null) return;
  const target = Math.max(0, Math.min(beat, THEMES[theme].beats));
  const surface = desired!.surface;
  cancelSwap();
  playing!.seekBeat = target;
  playing!.score.fade(0, SEEK_FADE_S);
  swapTimer = window.setTimeout(() => {
    swapTimer = null;
    playing?.score.dispose();
    startScore(theme, surface, target);
  }, (SEEK_FADE_S + T!.getContext().lookAhead) * 1000 + 20);
}

export function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

function cancelSwap(): void {
  if (playing) delete playing.seekBeat;
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

function startScore(theme: ThemeName, surface: ThemeSurface, seekBeat?: number): void {
  if (!T) return;
  const score = createScore(T, THEMES[theme], surface, musicOutput!, seekBeat);
  score.parts(musicParts);
  playing = { theme, score, seekBeat };
  score.fade(SCORE_VOLUME, seekBeat === undefined ? SWAP_FADE_S : SEEK_FADE_S);
}

function haltTheme(fadeS: number): void {
  cancelSwap();
  if (!playing) return;
  playing.score.fade(0, fadeS);
  // Keep ownership through the fade so a new selection cannot overlap it.
  swapTimer = window.setTimeout(() => {
    swapTimer = null;
    playing?.score.dispose();
    playing = null;
  }, fadeS * 1000 + 100);
}

function disposeAudio(): void {
  if (disposed) return;
  disposed = true;
  cancelSwap();
  playing?.score.dispose();
  playing = null;
  for (const cleanup of unlockCleanups) cleanup();
  for (const instrument of instruments.values()) instrument.dispose();
  instruments.clear();
  uiSynth?.dispose();
  reverb?.dispose();
  musicOutput?.dispose();
  soundOutput?.dispose();
  T = null;
}

if (import.meta.hot?.data) {
  // Updates can propagate to a React boundary without disposing this module.
  // Retire the previous engine whenever this module is evaluated again.
  import.meta.hot.data.disposeAudio?.();
  import.meta.hot.data.disposeAudio = disposeAudio;
  import.meta.hot.dispose(disposeAudio);
}
