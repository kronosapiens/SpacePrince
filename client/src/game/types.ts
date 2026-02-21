export type ElementType = "Fire" | "Earth" | "Air" | "Water";
export type ModalityType = "Cardinal" | "Fixed" | "Mutable";
export type Quality = "Hot" | "Cold" | "Wet" | "Dry";

export type SignName =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type PlanetName =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn";

export type Dignity = "Domicile" | "Exaltation" | "Neutral" | "Detriment" | "Fall";

export type AspectType = "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition" | "None";

export type Polarity = "Testimony" | "Affliction" | "Friction";

export interface PlanetBaseStats {
  damage: number;
  healing: number;
  durability: number;
  luck: number;
}

export interface PlanetStats extends PlanetBaseStats {
  damage: number;
  healing: number;
  durability: number;
  luck: number;
}

export interface PlanetPlacement {
  planet: PlanetName;
  sign: SignName;
  element: ElementType;
  modality: ModalityType;
  dignity: Dignity;
  base: PlanetBaseStats;
  buffs: PlanetBaseStats;
}

export interface PlanetState {
  affliction: number;
  combusted: boolean;
  exaltationSaveUsed: boolean;
}

export interface Chart {
  id: string;
  name: string;
  isDiurnal: boolean;
  ascendantSign?: SignName;
  planets: Record<PlanetName, PlanetPlacement>;
}

export interface AspectConnection {
  from: PlanetName;
  to: PlanetName;
  aspect: Exclude<AspectType, "None">;
  multiplier: number;
  sameSect: boolean;
}

export interface TurnLogEntry {
  id: string;
  turnIndex: number;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  polarity: Polarity;
  playerDelta: number;
  opponentDelta: number;
  playerCrit: boolean;
  opponentCrit: boolean;
  playerCombust?: boolean;
  opponentCombust?: boolean;
  propagation: Array<{
    target: PlanetName;
    delta: number;
    note: string;
  }>;
  turnAffliction: number;
  turnTestimony: number;
  turnScore: number;
}

export interface EncounterState {
  id: string;
  index: number;
  opponentChart: Chart;
  sequence: PlanetName[];
  turnIndex: number;
  completed: boolean;
}

export interface RunState {
  id: string;
  seed: number;
  encounterIndex: number;
  encounters: EncounterState[];
  unlockedPlanets: PlanetName[];
  playerState: Record<PlanetName, PlanetState>;
  opponentState: Record<PlanetName, PlanetState>;
  log: TurnLogEntry[];
  totalAffliction: number;
  totalTestimony: number;
  score: number;
  over: boolean;
  victory: boolean;
}
