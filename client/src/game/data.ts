import type {
  ElementType,
  ModalityType,
  PlanetBaseStats,
  PlanetName,
  SignName,
  Quality,
} from "./types";

export const SIGNS: SignName[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const PLANETS: PlanetName[] = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
];

export const PLANET_ORDER_UNLOCK: PlanetName[] = [
  "Moon",
  "Mercury",
  "Venus",
  "Sun",
  "Mars",
  "Jupiter",
  "Saturn",
];

export const PLANET_BASE_STATS: Record<PlanetName, PlanetBaseStats> = {
  Sun: { damage: 3, healing: 2, durability: 3, luck: 2 },
  Moon: { damage: 1, healing: 4, durability: 1, luck: 2 },
  Mercury: { damage: 2, healing: 2, durability: 2, luck: 4 },
  Venus: { damage: 1, healing: 4, durability: 2, luck: 3 },
  Mars: { damage: 4, healing: 1, durability: 2, luck: 1 },
  Jupiter: { damage: 2, healing: 3, durability: 3, luck: 3 },
  Saturn: { damage: 2, healing: 1, durability: 4, luck: 1 },
};

export const SIGN_ELEMENT: Record<SignName, ElementType> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

export const SIGN_MODALITY: Record<SignName, ModalityType> = {
  Aries: "Cardinal",
  Taurus: "Fixed",
  Gemini: "Mutable",
  Cancer: "Cardinal",
  Leo: "Fixed",
  Virgo: "Mutable",
  Libra: "Cardinal",
  Scorpio: "Fixed",
  Sagittarius: "Mutable",
  Capricorn: "Cardinal",
  Aquarius: "Fixed",
  Pisces: "Mutable",
};

export const ELEMENT_QUALITIES: Record<ElementType, [Quality, Quality]> = {
  Fire: ["Hot", "Dry"],
  Air: ["Hot", "Wet"],
  Water: ["Cold", "Wet"],
  Earth: ["Cold", "Dry"],
};

export const MODALITY_BUFFS: Record<ModalityType, PlanetBaseStats> = {
  Cardinal: { damage: 1, healing: 0, durability: 0, luck: 0 },
  Fixed: { damage: 0, healing: 0, durability: 1, luck: 0 },
  Mutable: { damage: 0, healing: 1, durability: 0, luck: 0 },
};

export const ELEMENT_BUFFS: Record<ElementType, PlanetBaseStats> = {
  Fire: { damage: 1, healing: 0, durability: 0, luck: 0 },
  Earth: { damage: 0, healing: 0, durability: 1, luck: 0 },
  Water: { damage: 0, healing: 1, durability: 0, luck: 0 },
  Air: { damage: 0, healing: 0, durability: 0, luck: 1 },
};

export const RULERSHIP: Record<SignName, PlanetName> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

export const EXALTATIONS: Partial<Record<PlanetName, SignName>> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mercury: "Virgo",
  Venus: "Pisces",
  Mars: "Capricorn",
  Jupiter: "Cancer",
  Saturn: "Libra",
};

export const PLANET_SECT: Record<PlanetName, "Day" | "Night" | "Flexible"> = {
  Sun: "Day",
  Jupiter: "Day",
  Saturn: "Day",
  Moon: "Night",
  Venus: "Night",
  Mars: "Night",
  Mercury: "Flexible",
};

export const PLANET_UNLOCK_COSTS: Record<PlanetName, number> = {
  Moon: 0,
  Mercury: 1,
  Venus: 2,
  Sun: 4,
  Mars: 8,
  Jupiter: 16,
  Saturn: 32,
};

export const MAX_ENCOUNTERS = 3;
export const COMBUST_LIMIT = 4;
