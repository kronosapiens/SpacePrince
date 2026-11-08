import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/narrative-scenarios";
import { PILOT_SCENES, PILOT_STATES, pilotOutcomes, pilotState } from "./narrative-pilot-fixtures";

describe("Leo-rising narrative pilot", () => {
  it("makes two Twelfth-house draws and one Eleventh-house draw costly without joy or favorable occupants", () => {
    for (const sample of PILOT_STATES.filter((state) =>
      ["first-healthy-penniless", "first-near-combustion-penniless", "four-wounded-funded", "full-wounded-without-joy", "adverse-wounded-without-joy"].includes(state.name))) {
      const costly: string[] = [];
      for (const scene of PILOT_SCENES) {
        const { prince, run } = pilotState(scene, sample);
        const outcomes = pilotOutcomes(prince, run, scene);
        expect(outcomes.length, `${sample.name}/${scene.scenarioId}`).toBeGreaterThan(0);
        if (!outcomes.some((outcome) => outcome.harmless)) costly.push(scene.scenarioId);
      }
      expect(costly.sort(), sample.name).toEqual([
        "friendship-gemini-copy-table", "hidden-cancer-island-room", "hidden-cancer-seawall",
      ]);
    }
  });

  it("offers stronger paid work and relief in the Twelfth while retaining ordinary Eleventh-house gifts", () => {
    const sample = PILOT_STATES.find((state) => state.name === "four-wounded-funded")!;
    const outcomes = PILOT_SCENES.flatMap((scene) => {
      const { prince, run } = pilotState(scene, sample);
      return pilotOutcomes(prince, run, scene).map((outcome) => ({
        house: scene.house, light: outcome.next.light - run.light,
      }));
    });
    const bestReward = (house: number) => Math.max(...outcomes.filter((row) => row.house === house).map((row) => row.light));
    expect(bestReward(12)).toBeGreaterThan(bestReward(11));

    const cupboard = getScenario("hidden-cancer-locked-cupboard");
    const letters = getScenario("friendship-gemini-three-letters");
    const wounded = { ...sample, condition: "near combustion" as const };
    const choices = (scene: typeof cupboard) => {
      const { prince, run } = pilotState(scene, wounded);
      return pilotOutcomes(prince, run, scene);
    };
    const cupboardRest = choices(cupboard).find((row) => row.option.id === "drink" && row.selection.chosen === "Moon")!;
    const lettersRest = choices(letters).find((row) => row.option.id === "room" && row.selection.chosen === "Moon")!;
    expect(cupboardRest.after.remaining.Moon).toBeGreaterThan(lettersRest.after.remaining.Moon!);
    expect(choices(letters).some((row) => row.harmless && row.option.id === "money")).toBe(true);
  });

  it("keeps the chart-conditioned ways through instead of treating authored costs as guaranteed losses", () => {
    const harmless = (id: string, name: string) => {
      const scene = getScenario(id);
      const { prince, run } = pilotState(scene, PILOT_STATES.find((state) => state.name === name)!);
      return pilotOutcomes(prince, run, scene).filter((row) => row.harmless).map((row) => row.option.id);
    };
    expect(harmless("friendship-gemini-copy-table", "full-wounded-with-joy")).toContain("rotate");
    expect(harmless("friendship-gemini-copy-table", "favorable-wounded-without-joy").length).toBeGreaterThan(0);
    expect(harmless("hidden-cancer-island-room", "full-wounded-with-joy")).toContain("interval");
    expect(harmless("hidden-cancer-seawall", "full-wounded-with-joy")).toEqual([]);
    const seawall = getScenario("hidden-cancer-seawall");
    const { prince, run } = pilotState(seawall, { name: "favorable-joy", tier: 32, condition: "injured", light: 120, occupancy: "favorable", joy: true });
    expect(pilotOutcomes(prince, run, seawall).filter((row) => row.harmless).map((row) => row.option.id)).toContain("lee");
  });
});
