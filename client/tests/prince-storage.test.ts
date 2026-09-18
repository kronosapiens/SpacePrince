import { beforeEach, describe, expect, it } from "vitest";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { loadPrince, savePrince } from "@/state/prince";
import { getScenario } from "@/data/narrative-scenarios";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { resolveNarrative } from "@/game/narrative";
import { combustionCeiling } from "@/game/combust";
import { createStubPrince } from "./fixtures";

describe("Prince storage", () => {
  beforeEach(() => localStorage.clear());

  it("discards pre-Light v2 state", () => {
    localStorage.setItem("sp:prince:v2", JSON.stringify({ runs: [{ distance: 42 }] }));

    expect(loadPrince()).toBeNull();
    expect(localStorage.getItem("sp:prince:v2")).toBeNull();
  });

  it("discards v3 tree state without migrating alpha Princes", () => {
    localStorage.setItem("sp:prince:v3", JSON.stringify({ runs: [{ encounter: { treeId: "old", currentNodeId: "step-two" } }] }));
    expect(loadPrince()).toBeNull();
    expect(localStorage.getItem("sp:prince:v3")).toBeNull();
  });

  it("restores an unresolved scene and keeps a resolved result from paying twice", () => {
    const prince = createStubPrince();
    const run = beginRun(7, prince.numEncounters);
    const scenario = getScenario("livelihood-coin");
    run.encounter = beginNarrativeEncounter({ run, house: 2, scenarioId: scenario.scenarioId });
    prince.runs = [run];
    savePrince(prince);
    const restored = loadPrince()!;
    expect(restored.runs[0]!.encounter).toEqual(run.encounter);
    const resolved = resolveNarrative(restored.runs[0]!, restored, scenario, "take", {})!;
    savePrince({ ...restored, runs: [resolved] });
    const reloaded = loadPrince()!;
    expect(reloaded.runs[0]!.encounter).toEqual(resolved.encounter);
    expect(reloaded.runs[0]!.light).toBe(12);
    expect(resolveNarrative(reloaded.runs[0]!, reloaded, scenario, "take", {})).toBeNull();
  });

  it("rebuilds saved player and opponent stats without changing run progress", () => {
    const prince = createStubPrince();
    const run = beginRun(7, prince.numEncounters);
    run.light = 72;
    run.state.Moon.affliction = 24;
    run.encounter = beginCombatEncounter({
      run, opponentSeed: 8, lifetimeEncounterCount: prince.numEncounters,
    });
    prince.runs = [run];

    // Simulate a saved chart whose cached stats lack the current field names.
    // Sect luck is saved because individual planet longitudes are not.
    const raw = JSON.stringify(prince, (key, value) =>
      key === "base" || key === "buffs" ? { luck: value.luck } : value,
    );
    localStorage.setItem("sp:prince:v4", raw);

    const restored = loadPrince()!;
    expect(restored).toEqual(prince);
    savePrince(restored);
    expect(loadPrince()).toEqual(prince);
  });

  it("caps saved affliction at the current Resolve on both charts", () => {
    const prince = createStubPrince();
    const run = beginRun(7, prince.numEncounters);
    run.light = 72;
    const encounter = beginCombatEncounter({
      run, opponentSeed: 8, lifetimeEncounterCount: prince.numEncounters,
    });
    run.state.Moon.affliction = 180;
    encounter.opponentState.Moon.affliction = 180;
    run.encounter = encounter;
    prince.runs = [run];
    savePrince(prince);

    const restored = loadPrince()!;
    const savedRun = restored.runs[0]!;
    expect(savedRun.state.Moon.affliction).toBe(combustionCeiling(restored.chart.planets.Moon));
    const savedEncounter = savedRun.encounter;
    if (savedEncounter?.kind !== "combat") throw new Error("Expected a saved combat encounter");
    expect(savedEncounter.opponentState.Moon.affliction)
      .toBe(combustionCeiling(savedEncounter.opponentChart.planets.Moon));
    expect(savedRun.light).toBe(72);
  });

  it("round-trips historical and active v4 Light state", () => {
    const historical = { ...beginRun(6), light: 36, mapsCompleted: MAPS_PER_RUN };
    const active = { ...beginRun(7), light: 72 };
    const prince = createStubPrince({ runs: [historical, active] });

    savePrince(prince);

    const raw = localStorage.getItem("sp:prince:v4");
    expect(raw).toContain('"light":36');
    expect(raw).toContain('"light":72');
    expect(raw).not.toContain('"distance"');
    expect(loadPrince()).toEqual(prince);
  });
});
