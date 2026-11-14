import { describe, expect, it } from "vitest";
import { logToBeats, scoreBeats, turnLight, type ScoreTurn, type ScoredBeat } from "@/game/score";
import { blankSideState, seededChart } from "@/game/chart";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
import { PLANETS } from "@/game/data";
import type { PlanetName, SideState, TurnLogEntry } from "@/game/types";

const self = seededChart(7, "Self");
const other = seededChart(99, "Other");

// By default the acting Moon is the only fielded planet, so it has both the
// least and the most remaining Resolve and the Moon's and the Sun's rules both count.
const turn = (over: Partial<ScoreTurn> = {}): ScoreTurn => ({
  self,
  other,
  selfState: blankSideState(),
  roster: ["Moon"],
  playerPlanet: "Moon",
  opponentAction: "Testimony",
  ...over,
});

const hit = (
  side: "self" | "other",
  polarity: "Testimony" | "Affliction",
  magnitude: number,
): ScoredBeat => ({ kind: "hit", side, target: "Moon", polarity, magnitude });

// One beat list covering each side and polarity, plus a combust on each chart.
// Powers of two make each admitted set unique.
const BEATS: ScoredBeat[] = [
  hit("other", "Testimony", 1),
  hit("other", "Affliction", 2),
  hit("self", "Testimony", 4),
  hit("self", "Affliction", 8),
  { kind: "combust", side: "other", target: "Mars" },
  { kind: "combust", side: "self", target: "Saturn" },
];

const otherMarsResolve = getEffectiveStatsFromPlacement(other.planets.Mars).resolve;

describe("RULER_RULES — each ruler counts what that planet values", () => {
  const expected: Record<PlanetName, number> = {
    // Every hit on the Other's chart, doubled: the acting planet has the least
    // remaining Resolve.
    Moon: 2 * (1 + 2),
    // Hits on the Other contrary to its announced Testimony.
    Mercury: 2,
    // Testimony hits on the Other.
    Venus: 1,
    // Every hit on the Other's chart, doubled: the acting planet has the most
    // remaining Resolve.
    Sun: 2 * (1 + 2),
    // Affliction hits on the Other.
    Mars: 2,
    // Hits on the Other in accord with its announced Testimony.
    Jupiter: 1,
    // The Other's planet going dark, at its full Resolve.
    Saturn: otherMarsResolve,
  };

  for (const ruler of PLANETS) {
    it(`${ruler} counts its beats on the Other's chart`, () => {
      expect(scoreBeats(ruler, BEATS, turn())).toBe(expected[ruler]);
    });
  }

  it("Accord and Contrary follow the Other's announced action", () => {
    expect(scoreBeats("Jupiter", BEATS, turn({ opponentAction: "Affliction" }))).toBe(2);
    expect(scoreBeats("Mercury", BEATS, turn({ opponentAction: "Affliction" }))).toBe(1);
  });

  it("nothing on the player's chart counts under any ruler", () => {
    const own = BEATS.filter((b) => b.side === "self");
    for (const ruler of PLANETS) expect(scoreBeats(ruler, own, turn())).toBe(0);
  });

  it("an empty turn scores nothing under any ruler", () => {
    for (const ruler of PLANETS) expect(scoreBeats(ruler, [], turn())).toBe(0);
  });

  it("Saturn counts combust markers at full Resolve, not hits", () => {
    expect(scoreBeats("Saturn", BEATS.filter((b) => b.kind === "hit"), turn())).toBe(0);
    expect(otherMarsResolve % 12).toBe(0);
  });
});

describe("the Moon and the Sun count the acting planet by its remaining Resolve", () => {
  /** The player's side with each named planet at that much remaining Resolve;
   *  the rest are combusted. */
  const stateWith = (remaining: Partial<Record<PlanetName, number>>): SideState => {
    const state = blankSideState();
    for (const p of PLANETS) {
      state[p].tension = getEffectiveStatsFromPlacement(self.planets[p]).resolve - (remaining[p] ?? 0);
    }
    return state;
  };
  const doubled = 2 * (1 + 2);
  const score = (
    ruler: "Moon" | "Sun",
    playerPlanet: PlanetName,
    left: Partial<Record<PlanetName, number>>,
    roster: PlanetName[] = ["Mercury", "Venus", "Mars"],
  ) => scoreBeats(ruler, BEATS, turn({ playerPlanet, roster, selfState: stateWith(left) }));

  const spread = { Mercury: 2, Venus: 3, Mars: 5 };

  it("the Moon doubles every hit on the Other when the acting planet has the least", () => {
    expect(score("Moon", "Mercury", spread)).toBe(doubled);
  });

  it("the Sun doubles every hit on the Other when the acting planet has the most", () => {
    expect(score("Sun", "Mars", spread)).toBe(doubled);
  });

  it("the turn generates nothing when another lit planet has less, or more", () => {
    expect(score("Moon", "Venus", spread)).toBe(0);
    expect(score("Moon", "Mars", spread)).toBe(0);
    expect(score("Sun", "Venus", spread)).toBe(0);
    expect(score("Sun", "Mercury", spread)).toBe(0);
  });

  it("planets tied for least, or for most, all count", () => {
    const tied = { Mercury: 2, Venus: 2, Mars: 5, Jupiter: 5 };
    const roster: PlanetName[] = ["Mercury", "Venus", "Mars", "Jupiter"];
    expect(score("Moon", "Mercury", tied, roster)).toBe(doubled);
    expect(score("Moon", "Venus", tied, roster)).toBe(doubled);
    expect(score("Sun", "Mars", tied, roster)).toBe(doubled);
    expect(score("Sun", "Jupiter", tied, roster)).toBe(doubled);
  });

  it("a combusted planet is not compared", () => {
    // The fielded Moon is combusted, with no remaining Resolve; Mercury is still the least.
    expect(score("Moon", "Mercury", spread, ["Moon", "Mercury", "Venus", "Mars"])).toBe(doubled);
  });

  it("a planet outside the roster is not compared", () => {
    // Unfielded Jupiter has less than Mercury and unfielded Saturn more than Mars.
    const left = { ...spread, Jupiter: 1, Saturn: 6 };
    expect(score("Moon", "Mercury", left)).toBe(doubled);
    expect(score("Sun", "Mars", left)).toBe(doubled);
  });
});

describe("logToBeats — the order the UI replays", () => {
  const entry: TurnLogEntry = {
    id: "turn_test",
    turnIndex: 0,
    playerPlanet: "Sun",
    opponentPlanet: "Moon",
    playerValence: "Affliction",
    opponentValence: "Testimony",
    playerDelta: 3,
    opponentDelta: 5,
    playerCombust: true,
    opponentCombust: true,
    propagation: [
      { side: "other", source: "Moon", target: "Venus", delta: 2, polarity: "Affliction", note: "Square flows" },
      { side: "other", source: "Moon", target: "Venus", delta: 0, polarity: "Affliction", note: "Combusts" },
      { side: "self", source: "Sun", target: "Mars", delta: -1, polarity: "Testimony", note: "Trine flows" },
    ],
    lightGain: 0,
  };

  it("runs phase 1 then phase 2, each direct hit → hops → the actor's own ripple", () => {
    expect(logToBeats(entry)).toEqual([
      { kind: "hit", side: "other", target: "Moon", polarity: "Affliction", magnitude: 5 },
      { kind: "hit", side: "other", target: "Venus", polarity: "Affliction", magnitude: 2 },
      { kind: "combust", side: "other", target: "Venus" },
      { kind: "combust", side: "other", target: "Moon" },
      { kind: "hit", side: "self", target: "Sun", polarity: "Testimony", magnitude: 3 },
      { kind: "hit", side: "self", target: "Mars", polarity: "Testimony", magnitude: 1 },
      { kind: "combust", side: "self", target: "Sun" },
    ]);
  });

  it("scores that turn per ruler", () => {
    // Their chart takes 5 Affliction direct + 2 propagated, against an announced
    // Testimony; Venus and the Moon combust on theirs. Your chart's 3 + 1
    // Testimony and the Sun's combust count for nothing. The acting Sun is the
    // only fielded planet, so it has both the least and the most remaining Resolve.
    const light = (ruler: PlanetName) =>
      turnLight(entry, ruler, { self, other, selfState: blankSideState(), roster: ["Sun"] });
    expect(light("Moon")).toBe(14);
    expect(light("Mercury")).toBe(7);
    expect(light("Venus")).toBe(0);
    expect(light("Sun")).toBe(14);
    expect(light("Mars")).toBe(7);
    expect(light("Jupiter")).toBe(0);
    expect(light("Saturn")).toBe(
      getEffectiveStatsFromPlacement(other.planets.Venus).resolve + getEffectiveStatsFromPlacement(other.planets.Moon).resolve,
    );
  });
});
