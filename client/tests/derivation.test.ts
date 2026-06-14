import { describe, expect, it } from "vitest";
import { deriveStatTable } from "@/game/combat";
import { combustionCeiling } from "@/game/combust";
import { seededChart } from "@/game/chart";
import { PLANETS } from "@/game/data";

// The study table teaches the derivation, so it must be honest: core + placement
// has to sum back to each row's total, across every chart, and the operational
// read-outs must match the rules they translate.
describe("deriveStatTable", () => {
  it("core + placement sums to each row total, every placement", () => {
    for (let seed = 0; seed < 40; seed++) {
      const chart = seededChart(seed);
      for (const planet of PLANETS) {
        for (const row of deriveStatTable(chart.planets[planet]).rows) {
          expect(row.core + row.placement).toBe(row.total);
        }
      }
    }
  });

  it("operational read-outs translate the totals", () => {
    for (let seed = 0; seed < 20; seed++) {
      const chart = seededChart(seed);
      for (const planet of PLANETS) {
        const placement = chart.planets[planet];
        const table = deriveStatTable(placement);
        const byKey = (k: "damage" | "healing" | "luck") =>
          table.rows.find((r) => r.key === k)!.total;
        expect(table.afflict).toBe(byKey("damage"));
        expect(table.testify).toBe(byKey("healing"));
        expect(table.critPct).toBe(byKey("luck") * 5);
        expect(table.durability).toBe(combustionCeiling(placement));
      }
    }
  });
});
