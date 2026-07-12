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
  if (!next) applyAmbient(); // re-establish the hum on unmute
  else stopAmbientVoices(0.1);
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
    reverb = new T.Reverb({ decay: 4.5, wet: 0.3 }).toDestination();
    ambientBus = new T.Gain(0.0).connect(reverb);
    ambientBus.gain.value = 1;
    applyAmbient();
  })().catch((err) => {
    initPromise = null; // let the next gesture retry from scratch
    throw err;
  });
  return initPromise;
}

// ── Instruments ──────────────────────────────────────────────────────────

let reverb: import("tone").Reverb | null = null;
let ambientBus: import("tone").Gain | null = null;

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

// ── Ambient bed ──────────────────────────────────────────────────────────
// Not a drone. Two layers: a low pedal whose amplitude moves on a very slow
// LFO (the floor, barely there), and one generative figure per lit planet —
// quiet notes drawn from its own mode at its own register, on staggered
// non-harmonic periods (SIGNATURES[planet].breath). The bed never repeats
// exactly, and a combusted planet's figure audibly drops out ("silences
// where voices used to be", VIBES.md).
//
// Timing uses Math.random deliberately: this is ephemeral presentation
// texture, not game state — nothing derivable or replayable hangs on it.

interface BreathVoice {
  timer: number;
}

const ambientVoices = new Map<PlanetName, BreathVoice>();
let ambientSpec: PlanetName[] | null = null;
let pedal: {
  osc: import("tone").Oscillator;
  gain: import("tone").Gain;
  lfo: import("tone").LFO;
} | null = null;

const AMBIENT_RAMP_S = 1.6;
const PEDAL_MIDI = 38; // D2 — the shared tonic floor

/**
 * Set the ambient bed to these planets' figures (null = fade to silence — the
 * map between encounters "lets it breathe", SCREENS.md §4.6).
 */
export function setAmbient(planets: PlanetName[] | null): void {
  ambientSpec = planets ? [...planets] : null;
  if (!T || muted) return;
  applyAmbient();
}

function applyAmbient(): void {
  if (!T || !ambientBus || muted) return;
  const want = new Set(ambientSpec ?? []);
  if (want.size > 0) startPedal();
  else stopPedal(AMBIENT_RAMP_S);
  for (const [planet, voice] of ambientVoices) {
    if (!want.has(planet)) {
      window.clearTimeout(voice.timer);
      ambientVoices.delete(planet);
    }
  }
  for (const planet of want) {
    if (!ambientVoices.has(planet)) startBreath(planet);
  }
}

function startBreath(planet: PlanetName): void {
  const spec = SIGNATURES[planet].breath;
  const voice: BreathVoice = { timer: 0 };
  ambientVoices.set(planet, voice);
  const tick = () => {
    if (!T || muted || ambientVoices.get(planet) !== voice) return;
    const inst = instrumentFor(planet);
    if (inst) {
      const now = T.now();
      const deg = spec.degs[Math.floor(Math.random() * spec.degs.length)]!;
      inst.triggerAttackRelease(midiToFreq(gestureMidi(planet, deg)), spec.dur, now, spec.vel);
      if (spec.dyad) {
        inst.triggerAttackRelease(
          midiToFreq(gestureMidi(planet, deg + 2)),
          spec.dur,
          now + 0.03,
          spec.vel * 0.8,
        );
      }
    }
    voice.timer = window.setTimeout(tick, spec.periodS * 1000 * (0.75 + Math.random() * 0.5));
  };
  // Staggered entry — planets don't all speak the moment a surface opens.
  voice.timer = window.setTimeout(tick, (0.5 + Math.random()) * 0.4 * spec.periodS * 1000);
}

function startPedal(): void {
  if (!T || !ambientBus || pedal) return;
  const gain = new T.Gain(0).connect(ambientBus);
  const osc = new T.Oscillator({ frequency: midiToFreq(PEDAL_MIDI), type: "sine" }).connect(gain);
  // The pedal itself breathes: a very slow amplitude drift between near-silence
  // and quiet, so even the floor is never static.
  const lfo = new T.LFO({ frequency: 0.05, min: 0.012, max: 0.05 });
  lfo.phase = 270; // start at the quiet end and rise
  lfo.connect(gain.gain);
  osc.start();
  lfo.start();
  pedal = { osc, gain, lfo };
}

function stopPedal(rampS: number): void {
  if (!pedal) return;
  const held = pedal;
  pedal = null;
  held.lfo.stop();
  held.lfo.disconnect();
  held.gain.gain.rampTo(0, rampS);
  setTimeout(() => {
    held.osc.stop();
    held.osc.dispose();
    held.gain.dispose();
    held.lfo.dispose();
  }, rampS * 1000 + 200);
}

function stopAmbientVoices(rampS: number): void {
  for (const [planet, voice] of ambientVoices) {
    window.clearTimeout(voice.timer);
    ambientVoices.delete(planet);
  }
  stopPedal(rampS);
}
