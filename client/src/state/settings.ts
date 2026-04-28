const SETTINGS_KEY = "sp:settings:v1";

export interface DevSettings {
  /** When true, the normal game-state machine is suspended:
   *  /map, /encounter, /narrative each render fresh random state on visit;
   *  navigation is unrestricted; encounters expose a Skip affordance. */
  devModeActive: boolean;
  unlockAll: boolean;
  forceNarrativeHouse: number | null;
  forceCombat: boolean;
}

const DEFAULT: DevSettings = {
  // Default true while we're iterating on screens & flows. Can be toggled off
  // from the Index screen's cheats panel for normal gameplay.
  devModeActive: true,
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

/** Listen for changes to dev settings (other components may toggle them). */
export function onDevSettingsChange(handler: () => void): () => void {
  const listener = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) handler();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
