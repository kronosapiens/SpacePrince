import type { ThemeRole } from "./themes";

export const MUSIC_PARTS = [
  { id: "melody", label: "Melody", sound: "Bell", roles: ["lead"] },
  { id: "bass", label: "Bass", sound: "Synth", roles: ["bass"] },
  { id: "pads", label: "Harmony", sound: "Pad", roles: ["pad"] },
  { id: "arpeggios", label: "Arpeggios", sound: "Pluck", roles: ["arp"] },
  { id: "rhythm", label: "Percussion", sound: "Drums", roles: ["kick", "snare", "hat"] },
] as const;

export type MusicPart = typeof MUSIC_PARTS[number]["id"];
export interface MusicPartState {
  muted: readonly MusicPart[];
}
export const ALL_MUSIC_PARTS: MusicPartState = { muted: [] };
const ROLE_PART = Object.fromEntries(
  MUSIC_PARTS.flatMap((part) => part.roles.map((role) => [role, part.id])),
) as Record<ThemeRole, MusicPart>;

export function roleAudible(state: MusicPartState, role: ThemeRole): boolean {
  return !state.muted.includes(ROLE_PART[role]);
}
