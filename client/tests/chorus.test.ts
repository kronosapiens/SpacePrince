import { describe, expect, it } from "vitest";
import { CHORUS, chorusRuler, selectChorusPassage } from "@/copy/chorus";
import { PLANETS } from "@/game/data";
import { HOUSES } from "@/data/houses";
import { seededChart, chartRuler } from "@/game/chart";
import { beginRelationalEncounter } from "@/game/encounter";
import { beginRun } from "@/game/run";

describe("planetary chorus", () => {
  it("imports a nonempty, attributed catalogue for every planet", () => {
    for (const planet of PLANETS) {
      expect(CHORUS[planet].length).toBeGreaterThan(0);
      for (const passage of CHORUS[planet]) {
        for (const field of [passage.text, passage.author, passage.source]) expect(field.trim()).not.toBe("");
        expect(new URL(passage.source_url).protocol).toMatch(/^https?:$/);
      }
    }
  });

  it("selects uniformly, permits repeats, and snapshots only presentation fields", () => {
    for (const planet of PLANETS) {
      const pool = CHORUS[planet];
      pool.forEach((passage, i) => {
        const draw = () => (i + 0.5) / pool.length;
        const selected = selectChorusPassage(planet, draw);
        expect(selected.text).toBe(passage.text);
        expect(selected).not.toBe(passage);
        expect(selected).not.toHaveProperty("moods");
        expect(selectChorusPassage(planet, draw)).toEqual(selected);
      });
    }
  });

  it("uses the other's chart ruler and each house's fixed ruler", () => {
    const chart = seededChart(7, "Self");
    const encounter = beginRelationalEncounter({ run: beginRun(chart, 42, 64), opponentSeed: 99, lifetimeRelationalEncounterCount: 64 });
    expect(chorusRuler(encounter)).toBe(chartRuler(encounter.opponentChart));
    HOUSES.forEach((house, i) => expect(chorusRuler({ kind: "narrative", id: "test", house: i + 1, scenarioId: "test", resolved: false })).toBe(house.ruler));
  });
});
