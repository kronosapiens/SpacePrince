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

export const PLANETS: PlanetName[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
];

// Macrobian descent — order in which planets unlock.
export const MACROBIAN_ORDER: PlanetName[] = [
  "Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter", "Saturn",
];

// Cumulative lifetime encounter thresholds at which each Macrobian planet
// unlocks. The Moon is present from the first encounter (threshold 0, since the
// count starts at 0 and increments after each encounter); each subsequent
// planet unlocks at 2^i encounters.
export const MACROBIAN_THRESHOLDS = [0, 1, 2, 4, 8, 16, 32] as const;

// Multiples of 12 on a 12-48 scale (MECHANICS.md §2, the sexagesimal lattice).
// 12-lattice base + 12-lattice buffs keeps every effective stat divisible by
// every circle-fraction aspect denominator (§9), so magnitudes stay integer.
export const PLANET_BASE_STATS: Record<PlanetName, PlanetBaseStats> = {
  Sun:     { impact: 36, witness: 24, durability: 36, luck: 24 },
  Moon:    { impact: 12, witness: 48, durability: 12, luck: 24 },
  Mercury: { impact: 24, witness: 24, durability: 24, luck: 48 },
  Venus:   { impact: 12, witness: 48, durability: 24, luck: 36 },
  Mars:    { impact: 48, witness: 12, durability: 24, luck: 12 },
  Jupiter: { impact: 24, witness: 36, durability: 36, luck: 36 },
  Saturn:  { impact: 24, witness: 12, durability: 48, luck: 12 },
};

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
  Cardinal: { impact: 12, witness: 0, durability: 0, luck: 0 },
  Fixed:    { impact: 0, witness: 0, durability: 12, luck: 0 },
  Mutable:  { impact: 0, witness: 12, durability: 0, luck: 0 },
};

export const ELEMENT_BUFFS: Record<ElementType, PlanetBaseStats> = {
  Fire:  { impact: 12, witness: 0, durability: 0, luck: 0 },
  Earth: { impact: 0, witness: 0, durability: 12, luck: 0 },
  Water: { impact: 0, witness: 12, durability: 0, luck: 0 },
  Air:   { impact: 0, witness: 0, durability: 0, luck: 12 },
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
