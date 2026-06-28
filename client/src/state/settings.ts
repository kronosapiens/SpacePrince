const SETTINGS_KEY = "sp:settings:v1";

export interface DevSettings {
  /** Reveal every planet on charts regardless of the run's unlock tier. */
  unlockAll: boolean;
  /** Force the next rolled node to a narrative of this house (dev steering). */
  forceNarrativeHouse: number | null;
  /** Force the next rolled node to combat (dev steering). */
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

/** Listen for changes to dev settings (other components may toggle them). */
export function onDevSettingsChange(handler: () => void): () => void {
  const listener = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY) handler();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
