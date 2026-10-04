import type { ThemeRole } from "./themes";

/**
 * Audio calibration; the ordinary planet strike is the listening reference.
 * Values marked DB use decibels; other volumes and gains multiply amplitude.
 * Velocities and wet amounts range from 0 to 1.
 * Written note dynamics in themes.ts and voice timbres also shape perceived loudness.
 * Tone's FMSynth internal -10 dB carrier gain is already included.
 */

// User settings, before calibration; saved preferences override these defaults.
export const DEFAULT_MUSIC_VOLUME = 0.5;
export const DEFAULT_SOUND_VOLUME = 1;
export const MASTER_VOLUME_DB = 0;

// Music output trim follows the score's limiter and multiplies the user setting.
export const MUSIC_OUTPUT_DB = -12;
export const MUSIC_OUTPUT_GAIN = 10 ** (MUSIC_OUTPUT_DB / 20);
export const SCORE_VOLUME = 0.9;
export const SCORE_LIMITER_DB = -2; // Threshold in dBFS.

// Event instruments and note velocities.
export const FX_VOLUME_DB = -10; // Planet strikes, necessity notes and the star bell.
export const UI_VOLUME_DB = -18;
export const COMBUST_VOLUME_DB = -14;
export const STRIKE_VELOCITY = 0.24; // Shared by strikes and necessity notes.
export const COMBUST_VELOCITY = 0.6;
export const STAR_VELOCITIES = { upper: 0.28, lower: 0.2 };
export const UI_VELOCITIES = {
  hover: 0.16,
  select: 0.3,
  commit: 0.4,
  dismiss: 0.24,
};

// Instrument gains in dB, before written note dynamics and the surface mix.
export const MUSIC_VOLUME_DB: Record<ThemeRole, number> = {
  pad: -3,
  lead: 4,
  bass: 3,
  arp: 6,
  kick: 2,
  snare: -3,
  hat: -9,
};

export type ThemeSurface = "map" | "combat" | "narrative";
export type ThemeLayer = "bed" | "down" | "up";

// Linear layer gains; zero leaves the layer silent on that surface.
export const SURFACE_MIX: Record<ThemeSurface, Record<ThemeLayer, number>> = {
  map: { bed: 0.9, down: 1, up: 0 },
  narrative: { bed: 0.65, down: 0.4, up: 0 },
  combat: { bed: 1, down: 0.25, up: 0.85 },
};

// Wet fractions: zero is dry, one is fully processed.
export const SOUND_REVERB_WET = 0.2;
export const SCORE_REVERB_WET = 0.18;
export const PAD_CHORUS_WET = 0.25;
export const LEAD_DELAY_WET = 0.12;
export const ARP_DELAY_WET = 0.28;
