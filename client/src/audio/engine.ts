import type { PlanetName } from "@/game/types";
import type { Polarity } from "@/game/types";
import { SIGNATURES, gestureMidi, type Signature } from "./signatures";

/**
 * The sound layer (VIBES.md §Sound Design): per-planet tonal signatures,
 * audible propagation, combustion cutting a signature mid-phrase, and an
 * ambient hum that thins as planets go dark.
 *
 * Module singleton, gesture-gated: Tone.js is imported and the AudioContext
 * started on the first pointer/key gesture (`installAudioUnlock`). Every
 * public call no-ops until then — and when muted — so callers never guard.
 */

type ToneModule = typeof import("tone");

let T: ToneModule | null = null;
let initPromise: Promise<void> | null = null;

const SOUND_KEY = "sp:sound:v1";

let muted = loadMuted();

function loadMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "muted";
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(SOUND_KEY, next ? "muted" : "on");
  } catch {
    /* storage unavailable — session-only */
  }
  if (T) T.getDestination().mute = next;
  if (!next) applyTheme(); // re-establish the score on unmute
  else haltTheme(0.1);
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
    T.getDestination().volume.value = -4;
    T.getDestination().mute = muted;
    // Kept on the dry side — a long wet reverb smears attack transients into
    // wash, which is half of what makes synth beds read as drone.
    reverb = new T.Reverb({ decay: 3.2, wet: 0.2 }).toDestination();
    themeBus = new T.Gain(0.9).connect(reverb);
    for (const layer of LAYERS) {
      layerGains[layer] = new T.Gain(0).connect(themeBus);
    }
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
let themeBus: import("tone").Gain | null = null;

const LAYERS = ["bed", "down", "up"] as const;
type ThemeLayer = (typeof LAYERS)[number];
const layerGains: Partial<Record<ThemeLayer, import("tone").Gain>> = {};

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

function instrumentFor(planet: PlanetName): AnyInstrument | null {
  if (!T || !reverb) return null;
  const sig = SIGNATURES[planet];
  const key = planet;
  const existing = instruments.get(key);
  if (existing) return existing;

  let inst: AnyInstrument;
  const envelope = {
    attack: sig.attack,
    decay: 0.1,
    sustain: 0.7,
    release: sig.release,
  };
  switch (sig.voice) {
    case "pluck":
      inst = new T.PluckSynth({ dampening: 3200, resonance: 0.92 }).connect(reverb);
      break;
    case "strike":
      inst = new T.MembraneSynth({
        pitchDecay: 0.012,
        octaves: 2,
        envelope: { attack: sig.attack, decay: 0.25, sustain: 0, release: sig.release },
      }).connect(reverb);
      break;
    case "pad":
      inst = new T.PolySynth(T.Synth, {
        oscillator: { type: "sine" },
        envelope,
        volume: -6,
      }).connect(reverb);
      break;
    case "tone":
    default:
      inst = new T.PolySynth(T.Synth, {
        oscillator: { type: planet === "Moon" ? "triangle" : "sine" },
        envelope,
        volume: -4,
      }).connect(reverb);
      break;
  }
  instruments.set(key, inst);
  return inst;
}

/** Shared soft voice for non-planet sounds (propagation, crit, star). */
function fxSynth(): AnyInstrument | null {
  if (!T || !reverb) return null;
  const existing = instruments.get("_fx");
  if (existing) return existing;
  const inst = new T.PolySynth(T.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 0.6 },
    volume: -14,
  }).connect(reverb);
  instruments.set("_fx", inst);
  return inst;
}

// ── Signature playback ──────────────────────────────────────────────────

function playGesture(planet: PlanetName, sig: Signature, velScale: number, cutAt?: number) {
  if (!T || muted) return;
  const inst = instrumentFor(planet);
  if (!inst) return;
  const now = T.now();
  for (const note of sig.gesture) {
    if (cutAt !== undefined && note.at >= cutAt) continue; // never begins
    const dur =
      cutAt !== undefined ? Math.max(0.05, Math.min(note.dur, cutAt - note.at)) : note.dur;
    inst.triggerAttackRelease(
      midiToFreq(gestureMidi(planet, note.deg)),
      dur,
      now + note.at,
      note.vel * velScale,
    );
  }
}

/** The planet's full signature — unlock ceremonies, mint reveal. */
export function playSignature(planet: PlanetName): void {
  playGesture(planet, SIGNATURES[planet], 1);
}

/** A verb landing: the acting planet speaks. Testimony is the gentler voicing. */
export function playVerb(planet: PlanetName, polarity: Polarity): void {
  playGesture(planet, SIGNATURES[planet], polarity === "Testimony" ? 0.8 : 1);
}

/**
 * Propagation is audible (VIBES.md): a harmonious hop resolves — a rising
 * fourth landing home — while an inverted hop (square/opposition) hangs on a
 * minor second that never settles.
 */
export function playPropagation(inverted: boolean): void {
  if (!T || muted) return;
  const fx = fxSynth();
  if (!fx) return;
  const now = T.now();
  if (inverted) {
    fx.triggerAttackRelease(midiToFreq(74), 0.5, now, 0.24); // D5
    fx.triggerAttackRelease(midiToFreq(75), 0.55, now + 0.02, 0.2); // E♭5 against it, held
  } else {
    fx.triggerAttackRelease(midiToFreq(69), 0.15, now, 0.24); // A4
    fx.triggerAttackRelease(midiToFreq(74), 0.35, now + 0.12, 0.22); // → D5, home
  }
}

/** A crit doubling through: a brief high shimmer. */
export function playCrit(): void {
  if (!T || muted) return;
  const fx = fxSynth();
  if (!fx) return;
  const now = T.now();
  fx.triggerAttackRelease(midiToFreq(86), 0.1, now, 0.26); // D6
  fx.triggerAttackRelease(midiToFreq(93), 0.16, now + 0.06, 0.2); // A6
}

/**
 * Combustion: the planet's signature cut off mid-phrase (VIBES.md — "its tonal
 * signature cuts off mid-phrase... like a candle going out"), masked by a
 * short pink-noise breath.
 */
export function playCombust(planet: PlanetName): void {
  if (!T || muted) return;
  const cutAt = 0.4;
  playGesture(planet, SIGNATURES[planet], 0.95, cutAt);
  const noiseKey = "_combust_noise";
  let noise = instruments.get(noiseKey) as import("tone").NoiseSynth | undefined;
  if (!noise && reverb) {
    noise = new T.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0 },
      volume: -18,
    }).connect(reverb);
    instruments.set(noiseKey, noise as unknown as AnyInstrument);
  }
  noise?.triggerAttackRelease(0.5, T.now() + cutAt, 0.6);
}

/** A run's star taking its place — a quiet high bell, far away. */
export function playStar(): void {
  if (!T || muted) return;
  const fx = fxSynth();
  if (!fx) return;
  const now = T.now();
  fx.triggerAttackRelease(midiToFreq(86), 1.2, now, 0.28); // D6
  fx.triggerAttackRelease(midiToFreq(81), 1.0, now + 0.18, 0.2); // A5 under it
}

// ── The score: seven planet themes, vertically mixed ─────────────────────
// Themes live in themes.ts (developed from spec/design/music-sketches).
// All three layers of the active theme run in sync on the transport; the
// surface chooses the mix (the FTL model): the map breathes the down layer,
// combat drives the up layer, narrative sits close to the bed alone.

import { THEMES, nameToMidi, type LeadVoice, type ThemeNote } from "./themes";

export type ThemeSurface = "map" | "combat" | "narrative";

const SURFACE_MIX: Record<ThemeSurface, Record<ThemeLayer, number>> = {
  map: { bed: 0.9, down: 1, up: 0 },
  narrative: { bed: 0.6, down: 0.35, up: 0 },
  combat: { bed: 1, down: 0, up: 1 },
};

const MIX_RAMP_S = 2.2; // FTL-style slow crossfade between variants
const SWAP_FADE_S = 1.1; // theme-to-theme handoff

interface StoppablePart {
  stop(): unknown;
  dispose(): unknown;
}

let desired: { planet: PlanetName; surface: ThemeSurface } | null = null;
let playing: { planet: PlanetName; parts: StoppablePart[] } | null = null;
let swapTimer: number | null = null;

/** Per-layer instrument pool, so layer gains only touch the score. */
const themeInstruments = new Map<string, AnyInstrument>();

// ── Sampled voices: the actual GM soundbank ─────────────────────────────────
// The sketches were auditioned through FluidR3_GM; the same bank's per-note
// renders are vendored under public/soundfont (see its README). Samplers load
// async on first use; until a sampler's buffers arrive, the synth patch below
// stands in, so the score never waits on the network. Percussion stays
// synthesized — the kit punches better than GM drums at this scale.

const GM_BY_ROLE: Partial<Record<ThemeNote["role"], string>> = {
  pad: "string_ensemble_1",
  arp: "orchestral_harp",
  bass: "contrabass",
};

const GM_BY_LEAD: Record<LeadVoice, string> = {
  horn: "french_horn",
  flute: "flute",
  strings: "string_ensemble_1",
};

const GM_VOLUME: Record<string, number> = {
  string_ensemble_1: -6,
  orchestral_harp: -1,
  contrabass: -1,
  french_horn: -3,
  flute: -3,
};

/** Sampled every tritone, C and Gb per octave — Sampler shifts the rest. */
const SAMPLE_NOTES = ["C1", "Gb1", "C2", "Gb2", "C3", "Gb3", "C4", "Gb4", "C5", "Gb5", "C6", "Gb6"];

const samplers = new Map<string, { sampler: import("tone").Sampler; loaded: boolean }>();

function samplerFor(gm: string, layer: ThemeLayer, bus: import("tone").Gain): AnyInstrument | null {
  if (!T) return null;
  const key = `${layer}:${gm}`;
  let entry = samplers.get(key);
  if (!entry) {
    const urls: Record<string, string> = {};
    for (const n of SAMPLE_NOTES) urls[n] = `${n}.mp3`;
    const holder: { sampler: import("tone").Sampler; loaded: boolean } = {
      loaded: false,
      sampler: new T.Sampler({
        urls,
        baseUrl: `/soundfont/${gm}/`,
        release: gm === "orchestral_harp" || gm === "contrabass" ? 0.3 : 0.9,
        volume: GM_VOLUME[gm] ?? -8,
        onload: () => {
          holder.loaded = true;
        },
      }).connect(bus),
    };
    entry = holder;
    samplers.set(key, entry);
  }
  return entry.loaded ? (entry.sampler as unknown as AnyInstrument) : null;
}

function themeInstrument(
  layer: ThemeLayer,
  role: ThemeNote["role"],
  leadVoice: LeadVoice,
): AnyInstrument | null {
  if (!T) return null;
  const bus = layerGains[layer];
  if (!bus) return null;
  // Prefer the sampled GM voice; fall back to the synth patch until loaded.
  const gm = role === "lead" ? GM_BY_LEAD[leadVoice] : GM_BY_ROLE[role];
  if (gm) {
    const sampled = samplerFor(gm, layer, bus);
    if (sampled) return sampled;
  }
  const key = `${layer}:${role}`;
  const existing = themeInstruments.get(key);
  if (existing) return existing;
  let inst: AnyInstrument;
  switch (role) {
    // Timbre note: the MIDI sketches auditioned through General MIDI
    // instruments — percussive attacks, rich harmonics, natural decay. Pure
    // sine/triangle waves at high sustain read as drone regardless of the
    // harmony, so every pitched role here either evolves (FM) or decays
    // (pluck, filtered mono bass). Notes bloom and recede; nothing holds a
    // steady state.
    case "pad":
      inst = new T.PolySynth(T.FMSynth, {
        harmonicity: 1.007, // a hair off unison — slow beating keeps the chord alive
        modulationIndex: 6,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.35, decay: 1.6, sustain: 0.3, release: 1.8 },
        modulationEnvelope: { attack: 0.5, decay: 1.2, sustain: 0.4, release: 1.5 },
        volume: -14,
      }).connect(bus);
      break;
    case "lead":
      inst = new T.PolySynth(T.FMSynth, {
        harmonicity: 2,
        modulationIndex: 4, // reedy, horn-adjacent — closer to the sketches' GM voices
        envelope: { attack: 0.04, decay: 0.4, sustain: 0.4, release: 0.4 },
        modulationEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.4 },
        volume: -12,
      }).connect(bus);
      break;
    case "bass":
      inst = new T.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { type: "lowpass", Q: 1 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.25,
          sustain: 0.4,
          release: 0.3,
          baseFrequency: 110,
          octaves: 2.2,
        },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.25 },
        volume: -9,
      }).connect(bus);
      break;
    case "arp":
      // Karplus-Strong — an actual plucked string, like the sketches' harp.
      inst = new T.PluckSynth({
        attackNoise: 1.4,
        dampening: 3800,
        resonance: 0.95,
        volume: -10,
      }).connect(bus);
      break;
    case "kick":
      inst = new T.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
        volume: -9,
      }).connect(bus);
      break;
    case "snare":
      inst = new T.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
        volume: -16,
      }).connect(bus);
      break;
    case "hat":
    default:
      inst = new T.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
        volume: -22,
      }).connect(bus);
      break;
  }
  themeInstruments.set(key, inst);
  return inst;
}

/**
 * Point the score at a planet's theme for a surface (null = fade to silence).
 * Same planet, new surface → the layers crossfade in place; a new planet
 * fades the bus, swaps the parts, and fades back in.
 */
export function setTheme(planet: PlanetName | null, surface: ThemeSurface = "map"): void {
  desired = planet ? { planet, surface } : null;
  if (!T || muted) return;
  applyTheme();
}

function applyTheme(): void {
  if (!T || !themeBus || muted) return;
  if (swapTimer !== null) {
    window.clearTimeout(swapTimer);
    swapTimer = null;
  }
  if (!desired) {
    haltTheme(SWAP_FADE_S);
    return;
  }
  const { planet, surface } = desired;
  if (playing && playing.planet === planet) {
    rampMix(surface, MIX_RAMP_S);
    themeBus.gain.rampTo(0.9, MIX_RAMP_S);
    return;
  }
  if (playing) {
    // Fade the old theme out, then hand off.
    themeBus.gain.rampTo(0, SWAP_FADE_S);
    swapTimer = window.setTimeout(() => {
      swapTimer = null;
      stopParts();
      startParts(planet, surface);
    }, SWAP_FADE_S * 1000 + 50);
    return;
  }
  startParts(planet, surface);
}

function startParts(planet: PlanetName, surface: ThemeSurface): void {
  if (!T || !themeBus) return;
  const spec = THEMES[planet];
  const spb = 60 / spec.bpm;
  const loopEnd = spec.beats * spb;
  const layers: Array<[ThemeLayer, ThemeNote[]]> = [
    ["bed", spec.bed],
    ["down", spec.down],
    ["up", spec.up],
  ];
  // Tone.Part's event type wants a `time` field on the event object itself.
  type TimedNote = ThemeNote & { time: number };
  const parts = layers.map(([layer, notes]) => {
    const part = new T!.Part<TimedNote>(
      (time, note) => {
        const inst = themeInstrument(layer, note.role, spec.leadVoice);
        if (!inst) return;
        if (note.role === "snare" || note.role === "hat") {
          // NoiseSynth is unpitched: (duration, time, velocity).
          (inst as unknown as import("tone").NoiseSynth).triggerAttackRelease(
            note.d * spb,
            time,
            note.v,
          );
        } else {
          inst.triggerAttackRelease(midiToFreq(nameToMidi(note.n)), note.d * spb, time, note.v);
        }
      },
      notes.map((note) => ({ ...note, time: note.t * spb })),
    );
    part.loop = true;
    part.loopEnd = loopEnd;
    part.start("+0.05");
    return part;
  });
  playing = { planet, parts };
  // Enter at the surface's mix; snap layer gains before the bus fades in.
  rampMix(surface, 0.01);
  themeBus.gain.rampTo(0.9, SWAP_FADE_S);
}

function rampMix(surface: ThemeSurface, rampS: number): void {
  const mix = SURFACE_MIX[surface];
  for (const layer of LAYERS) {
    layerGains[layer]?.gain.rampTo(mix[layer], rampS);
  }
}

function stopParts(): void {
  if (!playing) return;
  for (const part of playing.parts) {
    part.stop();
    part.dispose();
  }
  playing = null;
}

function haltTheme(fadeS: number): void {
  if (!T || !themeBus) {
    playing = null;
    return;
  }
  themeBus.gain.rampTo(0, fadeS);
  const held = playing;
  playing = null;
  window.setTimeout(() => {
    if (held) {
      for (const part of held.parts) {
        part.stop();
        part.dispose();
      }
    }
  }, fadeS * 1000 + 100);
}
