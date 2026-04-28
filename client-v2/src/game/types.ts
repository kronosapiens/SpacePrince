export type ElementType = "Fire" | "Earth" | "Air" | "Water";
export type ModalityType = "Cardinal" | "Fixed" | "Mutable";
export type Quality = "Hot" | "Cold" | "Wet" | "Dry";

export type SignName =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type PlanetName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export type Dignity = "Domicile" | "Exaltation" | "Neutral" | "Detriment" | "Fall";

export type AspectType =
  | "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition" | "None";

export type Polarity = "Testimony" | "Affliction" | "Friction";

export interface PlanetBaseStats {
  damage: number;
  healing: number;
  durability: number;
  luck: number;
}

export type PlanetStats = PlanetBaseStats;

export interface PlanetPlacement {
  planet: PlanetName;
  sign: SignName;
  eclipticLongitude?: number;
  element: ElementType;
  modality: ModalityType;
  dignity: Dignity;
  base: PlanetBaseStats;
  buffs: PlanetBaseStats;
}

export interface PlanetState {
  affliction: number;
  combusted: boolean;
}

export interface Chart {
  id: string;
  name: string;
  isDiurnal: boolean;
  ascendantSign: SignName;
  ascendantLongitude?: number;
  planets: Record<PlanetName, PlanetPlacement>;
}

export interface AspectConnection {
  from: PlanetName;
  to: PlanetName;
  aspect: Exclude<AspectType, "None">;
  multiplier: number;
}

export interface PropagationEntry {
  side: "self" | "other";
  source: PlanetName;
  target: PlanetName;
  delta: number;
  note: string;
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
  propagation: PropagationEntry[];
  turnScore: number;
  directBreakdown: {
    playerBase: number;
    friction: number;
    playerCritMultiplier: number;
    playerResult: number;
    opponentBase: number;
    opponentCritMultiplier: number;
    opponentResult: number;
  };
}

export type SideState = Record<PlanetName, PlanetState>;

// ── Encounters ────────────────────────────────────────────────────────────────

export interface CombatEncounter {
  kind: "combat";
  id: string;
  opponentChart: Chart;
  opponentState: SideState;
  sequence: PlanetName[]; // length = unlocked.length at encounter start
  turnIndex: number;
  log: TurnLogEntry[];
  resolved: boolean;
}

export interface NarrativeEncounter {
  kind: "narrative";
  id: string;
  house: number; // 1..12
  treeId: string;
  currentNodeId: string;
  visitedNodeIds: string[];
  fragmentId: string;
  resolved: boolean;
  resolutionText?: string;
}

export type EncounterState = CombatEncounter | NarrativeEncounter;

// ── Map ───────────────────────────────────────────────────────────────────────

export type Pillar = "L" | "C" | "R";
export type LayerCount = 1 | 2;
export type LayerPattern = LayerCount[];
export type EdgeType =
  | "pillar" | "horizontal" | "bookend-upper" | "bookend-lower" | "cross";

export interface MapNode {
  id: string;
  layer: number;
  pillar: Pillar;
}

export interface PositionedMapNode extends MapNode {
  x: number;
  y: number;
}

export interface MapEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface MapGraph {
  pattern: LayerPattern;
  nodes: MapNode[];
  edges: MapEdge[];
}

export type NodeContent =
  | { kind: "combat"; opponentSeed: number }
  | { kind: "narrative"; house: number };

export interface NodeOutcome {
  nodeId: string;
  kind: "combat" | "narrative";
  // free-form summary for End-of-Run inspection
  summary: string;
  distanceDelta: number;
  combusts: PlanetName[];
}

export interface MapState {
  id: string;
  seed: number;
  graph: MapGraph;
  currentNodeId: string;
  visitedNodeIds: string[];
  rolledNodes: Record<string, NodeContent>;
  lastNarrativeHouse: number | null;
  outcomes: Record<string, NodeOutcome>;
}

// ── Run / Profile ─────────────────────────────────────────────────────────────

export interface Omen {
  id: string;
  description: string;
  effect: { kind: "luck-bonus" | "damage-bonus" | "healing-bonus"; value: number; planet?: PlanetName };
  expires: "run-end" | "encounter-end" | "next-encounter";
}

export interface RunState {
  id: string;
  seed: number;
  startedAt: number;
  perPlanetState: SideState;
  runDistance: number;
  runOmens: Omen[];
  currentMap: MapState;
  mapHistory: MapState[];
  currentEncounter: EncounterState | null;
  seenFragmentIds: string[];
  loreCounters: Record<string, number>;
  lifetimeEncounterAtRunStart: number;
  over: boolean;
}

export interface BirthData {
  iso: string;
  lat: number;
  lon: number;
}

export interface Profile {
  id: string;
  name: string;
  birthData: BirthData;
  chart: Chart;
  lifetimeEncounterCount: number;
  scarsLevel: number;
  createdAt: number;
  schemaVersion: 1;
}
