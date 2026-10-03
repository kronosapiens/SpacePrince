import type { ThemeRole } from "./themes";

export const MUSIC_PARTS = [
  { id: "melody", label: "Melody", roles: ["lead"] },
  { id: "bass", label: "Bass", roles: ["bass"] },
  { id: "pads", label: "Pads", roles: ["pad"] },
  { id: "arpeggios", label: "Arpeggios", roles: ["arp"] },
  { id: "rhythm", label: "Rhythm", roles: ["kick", "snare", "hat"] },
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
