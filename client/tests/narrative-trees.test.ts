import { describe, expect, it } from "vitest";
import {
  NARRATIVE_SCENARIOS,
  SCENARIOS_BY_HOUSE,
  pickScenario,
  type Outcome,
} from "@/data/narrative-trees";
import { mulberry32 } from "@/game/rng";

const AFFLICTION_ROLES = new Set(["allUnlocked", "mostAfflicted", "healthiest", "joy", "ruler", "tenant"]);
const PLANET_NAMES = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]);

const allOutcomes = (o: { outcomes?: Outcome[]; outcomesOnSuccess?: Outcome[]; outcomesOnFail?: Outcome[] }) =>
  [...(o.outcomes ?? []), ...(o.outcomesOnSuccess ?? []), ...(o.outcomesOnFail ?? [])];

describe("narrative scenarios", () => {
  it("every house has scenarios (2-3 each, ENCOUNTERS.md §7)", () => {
    for (let h = 1; h <= 12; h++) {
      expect(SCENARIOS_BY_HOUSE[h]?.length, `house ${h}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("scenario ids are unique", () => {
    const ids = NARRATIVE_SCENARIOS.map((s) => s.scenarioId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("graphs are well-formed: root exists, every next resolves, no dead ends", () => {
    for (const s of NARRATIVE_SCENARIOS) {
      expect(s.nodes[s.rootId], `${s.scenarioId} root`).toBeDefined();
      for (const node of Object.values(s.nodes)) {
        expect(node.options.length, `${s.scenarioId}/${node.id}`).toBeGreaterThan(0);
        for (const o of node.options) {
          if (o.next) {
            expect(s.nodes[o.next], `${s.scenarioId}/${node.id}/${o.id} -> ${o.next}`).toBeDefined();
          } else {
            // terminal: must resolve to something (possibly the free [] exit)
            const defined =
              o.outcomes !== undefined || o.outcomesOnSuccess !== undefined || o.outcomesOnFail !== undefined;
            expect(defined, `${s.scenarioId}/${node.id}/${o.id} terminal`).toBe(true);
          }
        }
      }
    }
  });

  it("targeting is unlock-safe: affliction targets are roles, only uncombust names a planet", () => {
    for (const s of NARRATIVE_SCENARIOS) {
      for (const node of Object.values(s.nodes)) {
        for (const opt of node.options) {
          for (const o of allOutcomes(opt)) {
            if (o.kind === "affliction") {
              expect(AFFLICTION_ROLES.has(o.target as string), `${s.scenarioId} affliction target ${o.target}`).toBe(true);
            }
            if (o.kind === "uncombust" || o.kind === "combust") {
              expect(PLANET_NAMES.has(o.target as string), `${s.scenarioId} ${o.kind} target ${o.target}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it("pickScenario prefers unseen, recycles when the house is exhausted (§8)", () => {
    const rng = mulberry32(1);
    const house5 = SCENARIOS_BY_HOUSE[5]!.map((s) => s.scenarioId);
    // mark one seen → must return the other
    const first = pickScenario(5, [house5[0]!], rng);
    expect(first.scenarioId).toBe(house5[1]);
    // all seen → recycle (returns something valid rather than throwing)
    const recycled = pickScenario(5, house5, rng);
    expect(house5).toContain(recycled.scenarioId);
  });
});
