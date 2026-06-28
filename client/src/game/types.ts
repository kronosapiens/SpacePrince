export type ElementType = "Fire" | "Earth" | "Air" | "Water";
export type ModalityType = "Cardinal" | "Fixed" | "Mutable";

export type SignName =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type PlanetName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export type Dignity = "Domicile" | "Exaltation" | "Neutral" | "Detriment" | "Fall";

export type AspectType =
  | "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition" | "None";

export type Polarity = "Testimony" | "Affliction";

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
  /** The polarity that landed on the target. Carries the heal/harm signal
   *  even when `delta` clamps to 0 (e.g. testimony to a planet already at
   *  0 affliction); inferring from `delta` sign alone is unsafe. */
  polarity: Polarity;
  note: string;
}

export interface TurnLogEntry {
  id: string;
  turnIndex: number;
  playerPlanet: PlanetName;
  opponentPlanet: PlanetName;
  /** Valence the player chose this turn (lands on the opponent). */
  playerValence: Polarity;
  /** Valence the opponent precommitted this turn (lands on the player). */
  opponentValence: Polarity;
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
  /** Fielded planets — the roster both sides draw from, mirroring the player's
   *  unlock tier (MECHANICS §11.1). The opponent's chart still holds all seven
   *  placements; only these are sent and rendered solid. */
  roster: PlanetName[];
  sequence: PlanetName[]; // opponent's planet per turn; length is always 3
  /** Opponent's precommitted action per turn, parallel to `sequence`. Drawn
   *  stat-weighted (P(afflict) = damage / (damage + healing)) and locked at
   *  turn start, so the player always chooses with full information. */
  opponentActions: Polarity[];
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

// ── Run / Prince (STATE.md) ──────────────────────────────────────────────────

/** Append-only, in-memory log of finished maps (each carries its own per-node
 *  `outcomes`). The End-of-Run screen reads it; it is NOT persisted — a real
 *  client would read these from chain events. The in-memory replacement for the
 *  old `mapHistory`. See `STATE.md`. */
export type RunEvent = { kind: "map-completed"; map: MapState };

export interface Run {
  id: string;
  seed: number;
  /** Per-planet affliction + combust; persists across encounters and maps,
   *  resets only at run start. */
  state: SideState;
  /** Cumulative Distance — this run's score, its permanent record. */
  distance: number;
  /** The current map only; finished maps are pushed to `events`. */
  map: MapState;
  /** Maps finished this run (0..MAPS_PER_RUN); the run ends by completion at the cap. */
  mapsCompleted: number;
  encounter: EncounterState | null;
  /** No-repeat bookkeeping — active-run-only (STATE.md). */
  seenFragmentIds: string[];
  seenScenarioIds: string[];
  /** In-memory run history for the End screen; not persisted. */
  events: RunEvent[];
}

export interface BirthData {
  iso: string;
  lat: number;
  lon: number;
}

export interface Prince {
  id: string;
  position: BirthData;
  chart: Chart;
  /** Cumulative lifetime encounters; gates the unlock ramp (MECHANICS §11.1). */
  numEncounters: number;
  /** Reserved bitmap of unlocked achievements (deferred, §11.2). */
  achievements: number;
  /** Every run this Prince has played. The active run is the tail iff it is not
   *  over (STATE.md). Historical runs (incl. their Distance) are read off this. */
  runs: Run[];
}
