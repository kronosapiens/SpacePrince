import { describe, expect, it } from "vitest";
import { HOUSES } from "@/data/houses";
import { getScenario, SCENARIOS_BY_HOUSE } from "@/data/narrative-scenarios";
import { SIGNS } from "@/game/data";
import { joyPresent } from "@/game/narrative";
import { CATALOGUE_STATES, catalogueState, narrativeOutcomes } from "./narrative-catalogue-fixtures";

describe("house-specific narrative risk across all rising signs", () => {
  it("lets healthy first-run Princes purchase the offered shelter and support", () => {
    const sample = CATALOGUE_STATES.find((state) => state.name === "full-healthy-funded")!;
    for (const [id, optionId] of [
      ["labor-pisces-returned-carer", "care"],
      ["achievement-leo-procession", "arch"],
      ["achievement-virgo-clean-step", "bath"],
      ["achievement-pisces-blurred-banner", "warm"],
      ["friendship-libra-paired-tables", "move"],
      ["hidden-leo-hot-gallery", "arcade"],
      ["hidden-libra-equal-curtains", "alcove"],
      ["hidden-sagittarius-stable-room", "decline"],
    ] as const) {
      const scene = getScenario(id), state = catalogueState(scene, sample);
      const prince = { ...state.prince, numRelationalEncounters: 0 };
      const outcomes = narrativeOutcomes(prince, state.run, scene).filter(({ option }) => option.id === optionId);
      expect(outcomes.length, `${id}/${optionId}`).toBeGreaterThan(0);
      for (const outcome of outcomes) {
        expect(outcome.next.light, id).toBeLessThan(state.run.light);
        expect(outcome.after.lit, id).toContain("Moon");
        expect(outcome.next.state.Moon.tension, id).toBe(0);
      }
    }
  });

  it.each(HOUSES)("$name mixes ordinary help with committed costs in every sign", (house) => {
    // Current tuning, excluding conditional joy options; these counts are not player frequencies.
    const expected = [2, 6, 8, 12].includes(house.num) ? 2 : 1;
    for (const sign of SIGNS) {
      const pool = SCENARIOS_BY_HOUSE[house.num]!.filter((scene) => scene.sign === sign);
      for (const sample of CATALOGUE_STATES.filter((state) => state.occupancy === "empty")) {
        const costly = pool.filter((scene) => {
          const { prince, run } = catalogueState(scene, sample);
          const ordinary = narrativeOutcomes(prince, run, scene).filter(({ option }) => option.visibleIf !== joyPresent);
          expect(ordinary.length, `${scene.scenarioId}/${sample.name}`).toBeGreaterThan(0);
          return !ordinary.some((outcome) => outcome.harmless);
        });
        expect(costly.map((scene) => scene.scenarioId), `${house.num}/${sign}/${sample.name}`).toHaveLength(expected);
      }
    }
  });
});
