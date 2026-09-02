import { describe, expect, it } from "vitest";
import { RULER_RULES, logToBeats, scoreBeats, type ScoredBeat } from "@/game/score";
import { seededChart } from "@/game/chart";
import { combustionCeiling } from "@/game/combust";
import { PLANETS } from "@/game/data";
import type { ScoreCharts } from "@/game/score";
import type { TurnLogEntry } from "@/game/types";

const charts: ScoreCharts = { self: seededChart(7, "Self"), other: seededChart(99, "Other") };

const hit = (
  side: "self" | "other",
  polarity: "Testimony" | "Affliction",
  channel: "direct" | "propagated",
  magnitude: number,
): ScoredBeat => ({ kind: "hit", side, target: "Moon", polarity, magnitude, channel });

// One beat list covering every axis a rule can key on: both sides, both
// polarities, both channels, and a combust on each chart.
const BEATS: ScoredBeat[] = [
  hit("other", "Testimony", "direct", 5),
  hit("other", "Affliction", "propagated", 6),
  hit("self", "Affliction", "direct", 3),
  hit("self", "Testimony", "propagated", 4),
  { kind: "combust", side: "other", target: "Mars" },
  { kind: "combust", side: "self", target: "Saturn" },
];

const otherMarsCeiling = combustionCeiling(charts.other.planets.Mars);
const selfSaturnCeiling = combustionCeiling(charts.self.planets.Saturn);

describe("RULER_RULES — each ruler pays for what that planet values", () => {
  const expected: Record<string, number> = {
    // Your action on their chart, relief given.
    Moon: 5,
    // Relief anywhere — their chart and yours.
    Venus: 5 + 4,
    // Your action on their chart, harm dealt.
    Mars: 6,
    // Harm completed, on both charts, each worth the dying planet's ceiling.
    Saturn: otherMarsCeiling + selfSaturnCeiling,
    // Either polarity on their chart, split by channel.
    Sun: 5,
    Mercury: 6,
    // The superset of Moon, Mars, Sun and Mercury.
    Jupiter: 5 + 6,
  };

  for (const ruler of PLANETS) {
    it(`${ruler} scores ${RULER_RULES[ruler].label}`, () => {
      expect(scoreBeats(ruler, BEATS, charts)).toBe(expected[ruler]);
    });
  }

  it("every rule has a label completing \"Distance is …\"", () => {
    for (const ruler of PLANETS) expect(RULER_RULES[ruler].label.length).toBeGreaterThan(0);
  });

  it("an empty turn scores nothing under any ruler", () => {
    for (const ruler of PLANETS) expect(scoreBeats(ruler, [], charts)).toBe(0);
  });

  it("Saturn pays ceilings, not magnitudes", () => {
    expect(scoreBeats("Saturn", BEATS.filter((b) => b.kind === "hit"), charts)).toBe(0);
    expect(otherMarsCeiling % 60).toBe(0);
    expect(selfSaturnCeiling % 60).toBe(0);
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
    turnScore: 0,
  };

  it("runs phase 1 then phase 2, each direct hit → hops → the actor's own ripple", () => {
    expect(logToBeats(entry)).toEqual([
      { kind: "hit", side: "other", target: "Moon", polarity: "Affliction", magnitude: 5, channel: "direct" },
      { kind: "hit", side: "other", target: "Venus", polarity: "Affliction", magnitude: 2, channel: "propagated" },
      { kind: "combust", side: "other", target: "Venus" },
      { kind: "combust", side: "other", target: "Moon" },
      { kind: "hit", side: "self", target: "Sun", polarity: "Testimony", magnitude: 3, channel: "direct" },
      { kind: "hit", side: "self", target: "Mars", polarity: "Testimony", magnitude: 1, channel: "propagated" },
      { kind: "combust", side: "self", target: "Sun" },
    ]);
  });

  it("scores that turn per ruler", () => {
    // Their chart takes 5 affliction direct + 2 propagated; yours takes 3
    // testimony direct + 1 propagated. Venus and Moon combust on theirs, the
    // Sun on yours.
    expect(scoreBeats("Moon", logToBeats(entry), charts)).toBe(0);
    expect(scoreBeats("Venus", logToBeats(entry), charts)).toBe(4);
    expect(scoreBeats("Mars", logToBeats(entry), charts)).toBe(7);
    expect(scoreBeats("Sun", logToBeats(entry), charts)).toBe(5);
    expect(scoreBeats("Mercury", logToBeats(entry), charts)).toBe(2);
    expect(scoreBeats("Jupiter", logToBeats(entry), charts)).toBe(7);
    expect(scoreBeats("Saturn", logToBeats(entry), charts)).toBe(
      combustionCeiling(charts.other.planets.Venus)
        + combustionCeiling(charts.other.planets.Moon)
        + combustionCeiling(charts.self.planets.Sun),
    );
  });
});
