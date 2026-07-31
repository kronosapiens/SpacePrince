import { describe, expect, it } from "vitest";
import { deriveStatTable, fortuneChance } from "@/game/combat";
import { combustionCeiling } from "@/game/combust";
import { seededChart } from "@/game/chart";
import { PLANETS } from "@/game/data";
import type { PlanetStats } from "@/game/types";

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

  // Each column is already in the stat's display unit, so the headline number
  // IS the row total — there is no transform left for the player to apply.
  it("every operational read-out is exactly its row total", () => {
    for (let seed = 0; seed < 20; seed++) {
      const chart = seededChart(seed);
      for (const planet of PLANETS) {
        const placement = chart.planets[planet];
        const table = deriveStatTable(placement);
        const byKey = (k: keyof PlanetStats) =>
          table.rows.find((r) => r.key === k)!.total;
        expect(table.afflict).toBe(byKey("impact"));
        expect(table.testify).toBe(byKey("witness"));
        expect(table.resolve).toBe(byKey("durability"));
        expect(table.fortune).toBe(byKey("luck"));
      }
    }
  });

  it("read-outs still match the rules they display", () => {
    for (let seed = 0; seed < 20; seed++) {
      const chart = seededChart(seed);
      for (const planet of PLANETS) {
        const placement = chart.planets[planet];
        const table = deriveStatTable(placement);
        expect(table.resolve).toBe(combustionCeiling(placement));
        // Fortune is the same roll as fortuneChance, stated in sixtieths.
        expect(table.fortune / 60).toBeCloseTo(
          fortuneChance(placement.base.luck + placement.buffs.luck),
          10,
        );
      }
    }
  });

  // The lattice forbids rounding anywhere (MECHANICS.md, "Number model"), and
  // the display scaling introduces a ÷2 — stats are multiples of 12, so every
  // scaled cell must still land whole.
  it("every cell is a whole number", () => {
    for (let seed = 0; seed < 40; seed++) {
      const chart = seededChart(seed);
      for (const planet of PLANETS) {
        for (const row of deriveStatTable(chart.planets[planet]).rows) {
          expect(Number.isInteger(row.core)).toBe(true);
          expect(Number.isInteger(row.placement)).toBe(true);
          expect(Number.isInteger(row.total)).toBe(true);
        }
      }
    }
  });
});
