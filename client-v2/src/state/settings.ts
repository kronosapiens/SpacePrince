const SETTINGS_KEY = "sp:settings:v1";

export interface DevSettings {
  unlockAll: boolean;
  forceNarrativeHouse: number | null;
  forceCombat: boolean;
}

const DEFAULT: DevSettings = {
  unlockAll: false,
  forceNarrativeHouse: null,
  forceCombat: false,
};

export function loadDevSettings(): DevSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<DevSettings>) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveDevSettings(settings: DevSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
