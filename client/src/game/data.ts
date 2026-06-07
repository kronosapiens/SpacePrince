import type {
  ElementType,
  ModalityType,
  PlanetBaseStats,
  PlanetName,
  SignName,
  Dignity,
  AspectType,
} from "./types";

export const SIGNS: SignName[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
];

// Macrobian descent — order in which planets unlock.
export const MACROBIAN_ORDER: PlanetName[] = [
  "Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter", "Saturn",
];

// Cumulative lifetime encounter thresholds at which each Macrobian planet unlocks.
export const MACROBIAN_THRESHOLDS = [1, 2, 4, 8, 16, 32, 64] as const;

// Even values on a roughly 1-10 scale (MECHANICS.md §2). Even base + even buffs
// keeps every magnitude whole, so the ×0.5 aspect multipliers (§9) still land
// on integers.
export const PLANET_BASE_STATS: Record<PlanetName, PlanetBaseStats> = {
  Sun:     { damage: 6, healing: 4, durability: 6, luck: 4 },
  Moon:    { damage: 2, healing: 8, durability: 2, luck: 4 },
  Mercury: { damage: 4, healing: 4, durability: 4, luck: 8 },
  Venus:   { damage: 2, healing: 8, durability: 4, luck: 6 },
  Mars:    { damage: 8, healing: 2, durability: 4, luck: 2 },
  Jupiter: { damage: 4, healing: 6, durability: 6, luck: 6 },
  Saturn:  { damage: 4, healing: 2, durability: 8, luck: 2 },
};

// Per-planet gameplay role — the one-word epithet that gives a player a quick
// read on what the planet is for. See `spec/mechanics/MECHANICS.md §2`.
export const PLANET_ROLE: Record<PlanetName, string> = {
  Sun:     "the sovereign",
  Moon:    "the healer",
  Mercury: "the fool",
  Venus:   "the lover",
  Mars:    "the warrior",
  Jupiter: "the patron",
  Saturn:  "the boundary",
};

export const SIGN_ELEMENT: Record<SignName, ElementType> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

export const SIGN_MODALITY: Record<SignName, ModalityType> = {
  Aries: "Cardinal", Taurus: "Fixed", Gemini: "Mutable", Cancer: "Cardinal",
  Leo: "Fixed", Virgo: "Mutable", Libra: "Cardinal", Scorpio: "Fixed",
  Sagittarius: "Mutable", Capricorn: "Cardinal", Aquarius: "Fixed", Pisces: "Mutable",
};

export const MODALITY_BUFFS: Record<ModalityType, PlanetBaseStats> = {
  Cardinal: { damage: 2, healing: 0, durability: 0, luck: 0 },
  Fixed:    { damage: 0, healing: 0, durability: 2, luck: 0 },
  Mutable:  { damage: 0, healing: 2, durability: 0, luck: 0 },
};

export const ELEMENT_BUFFS: Record<ElementType, PlanetBaseStats> = {
  Fire:  { damage: 2, healing: 0, durability: 0, luck: 0 },
  Earth: { damage: 0, healing: 0, durability: 2, luck: 0 },
  Water: { damage: 0, healing: 2, durability: 0, luck: 0 },
  Air:   { damage: 0, healing: 0, durability: 0, luck: 2 },
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

export const IN_SECT_LUCK_BONUS = 2;

export const ASPECT_BASE: Record<Exclude<AspectType, "None">, number> = {
  Conjunction: 1,
  Sextile: 0.5,
  Trine: 0.5,
  Square: -0.5,
  Opposition: -1,
};

// Combustion durability-offset multiplier by dignity (MECHANICS.md §10): higher
// dignity absorbs more affliction before any combustion risk. Functional
// affliction = max(0, affliction − durability × this); even durability keeps it
// whole (×2.5 and ×1.5 of an even number are integers).
export const DIGNITY_DURABILITY_MULT: Record<Dignity, number> = {
  Domicile: 3,
  Exaltation: 2.5,
  Neutral: 2,
  Detriment: 1.5,
  Fall: 1,
};

export const TIME_BUCKET_MS = 5 * 60 * 1000;

// Combat-vs-narrative split: 50/50.
export const NARRATIVE_NODE_PROB = 0.5;
