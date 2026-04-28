import type { Profile } from "@/game/types";

const PROFILE_KEY = "sp:profile:v1";

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

export function bumpEncounterCount(profile: Profile, delta = 1): Profile {
  return { ...profile, lifetimeEncounterCount: profile.lifetimeEncounterCount + delta };
}
