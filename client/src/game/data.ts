import type {
  ElementType,
  ModalityType,
  PlanetBaseStats,
  PlanetName,
  SignName,
  AspectType,
} from "./types";

export const SIGNS: SignName[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Macrobian order — also the order in which planets unlock.
export const PLANETS: PlanetName[] = [
  "Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter", "Saturn",
];

// Cumulative lifetime encounter thresholds at which each Macrobian planet
// unlocks. The Moon is present from the first encounter (threshold 0, since the
// count starts at 0 and increments after each encounter); each subsequent
// planet unlocks at 2^i encounters.
export const UNLOCK_THRESHOLDS = [0, 1, 2, 4, 8, 16, 32] as const;

// Per-planet gameplay role — the one-word epithet that gives a player a quick
// read on what the planet is for. See `spec/mechanics/MECHANICS.md §2`.
export const PLANET_ROLE: Record<PlanetName, string> = {
  Sun:     "the sovereign",
  Moon:    "the healer",
  Mercury: "the shifter",
  Venus:   "the lover",
  Mars:    "the warrior",
  Jupiter: "the patron",
  Saturn:  "the boundary",
};

// Unscaled base stats for tuning. Chart derivation multiplies these by 12
// before adding placement buffs, keeping aspect magnitudes whole.
export const PLANET_BASE_STATS: Record<PlanetName, PlanetBaseStats> = {
  Sun:     { affliction: 3, testimony: 3, resolve: 8,  luck: 2 }, // total 16
  Moon:    { affliction: 1, testimony: 4, resolve: 4,  luck: 3 }, // total 12
  Mercury: { affliction: 2, testimony: 2, resolve: 6,  luck: 4 }, // total 14
  Venus:   { affliction: 1, testimony: 4, resolve: 6,  luck: 1 }, // total 12
  Mars:    { affliction: 4, testimony: 1, resolve: 6,  luck: 1 }, // total 12
  Jupiter: { affliction: 2, testimony: 3, resolve: 7,  luck: 3 }, // total 15
  Saturn:  { affliction: 3, testimony: 1, resolve: 10, luck: 1 }, // total 15
};

export const SIGN_ELEMENT: Record<SignName, ElementType> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

export const ELEMENT_BUFFS: Record<ElementType, PlanetBaseStats> = {
  Fire:  { affliction: 12, testimony: 0, resolve: 0, luck: 0 },
  Earth: { affliction: 0, testimony: 0, resolve: 12, luck: 0 },
  Water: { affliction: 0, testimony: 12, resolve: 0, luck: 0 },
  Air:   { affliction: 0, testimony: 0, resolve: 0, luck: 12 },
};

export const SIGN_MODALITY: Record<SignName, ModalityType> = {
  Aries: "Cardinal", Taurus: "Fixed", Gemini: "Mutable", Cancer: "Cardinal",
  Leo: "Fixed", Virgo: "Mutable", Libra: "Cardinal", Scorpio: "Fixed",
  Sagittarius: "Mutable", Capricorn: "Cardinal", Aquarius: "Fixed", Pisces: "Mutable",
};

export const MODALITY_BUFFS: Record<ModalityType, PlanetBaseStats> = {
  Cardinal: { affliction: 12, testimony: 0, resolve: 0, luck: 0 },
  Fixed:    { affliction: 0, testimony: 0, resolve: 12, luck: 0 },
  Mutable:  { affliction: 0, testimony: 12, resolve: 0, luck: 0 },
};

export const RULERSHIP: Record<SignName, PlanetName> = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

export const EXALTATIONS: Partial<Record<PlanetName, SignName>> = {
  Sun: "Aries", Moon: "Taurus", Mercury: "Virgo", Venus: "Pisces",
  Mars: "Capricorn", Jupiter: "Cancer", Saturn: "Libra",
};

export const PLANET_SECT: Record<PlanetName, "Day" | "Night" | "Flexible"> = {
  Sun: "Day", Jupiter: "Day", Saturn: "Day",
  Moon: "Night", Venus: "Night", Mars: "Night",
  Mercury: "Flexible",
};

export const IN_SECT_LUCK_BONUS = 12;

// Circle fractions (MECHANICS.md §9): each aspect's share of the 360° circle,
// negative where the aspect inverts valence. Exact rationals — every `den`
// divides every effective stat, so propagation magnitudes are integers.
export const ASPECT_BASE: Record<Exclude<AspectType, "None">, { num: number; den: number }> = {
  Conjunction: { num: 1, den: 1 },
  Sextile:     { num: 1, den: 6 },
  Square:      { num: -1, den: 4 },
  Trine:       { num: 1, den: 3 },
  Opposition:  { num: -1, den: 2 },
};

export const TIME_BUCKET_MS = 5 * 60 * 1000;

// Combat-vs-narrative split: 50/50.
export const NARRATIVE_NODE_PROB = 0.5;
