import { beforeEach, describe, expect, it } from "vitest";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { loadPrince, savePrince } from "@/state/prince";
import { getScenario } from "@/data/narrative-scenarios";
import { beginRelationalEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { resolveNarrative } from "@/game/narrative";
import { getEffectiveStatsFromPlacement } from "@/game/relational";
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

  it("starts fresh instead of loading the retired house-only catalogue", () => {
    localStorage.setItem("sp:prince:v4", JSON.stringify({ runs: [{ encounter: { scenarioId: "livelihood-coin" } }] }));
    expect(loadPrince()).toBeNull();
    expect(localStorage.getItem("sp:prince:v4")).toBeNull();
  });

  it("discards counts that included narrative encounters and the old encounter kinds", () => {
    localStorage.setItem("sp:prince:v5", JSON.stringify({ numEncounters: 32, runs: [] }));
    expect(loadPrince()).toBeNull();
    expect(localStorage.getItem("sp:prince:v5")).toBeNull();
  });

  it("restores an unresolved scene and keeps a resolved result from paying twice", () => {
    const prince = createStubPrince();
    const run = beginRun(prince.chart, 7, prince.numRelationalEncounters);
    const scenario = getScenario("home-libra-mara");
    run.state.Moon.tension = 0;
    run.encounter = beginNarrativeEncounter({ run, house: 4, scenarioId: scenario.scenarioId });
    prince.runs = [run];
    savePrince(prince);
    const restored = loadPrince()!;
    expect(restored.runs[0]!.encounter).toEqual(run.encounter);
    const resolved = resolveNarrative(restored.runs[0]!, restored, scenario, "name", { chosen: "Moon" })!;
    savePrince({ ...restored, runs: [resolved] });
    const reloaded = loadPrince()!;
    expect(reloaded.runs[0]!.encounter).toEqual(resolved.encounter);
    expect(reloaded.runs[0]!.light).toBe(96);
    expect(resolveNarrative(reloaded.runs[0]!, reloaded, scenario, "name", { chosen: "Moon" })).toBeNull();
  });

  it("rebuilds saved player and opponent stats without changing run progress", () => {
    const prince = createStubPrince();
    const run = beginRun(prince.chart, 7, prince.numRelationalEncounters);
    run.light = 72;
    run.state.Moon.tension = 24;
    run.encounter = beginRelationalEncounter({
      run, opponentSeed: 8, lifetimeRelationalEncounterCount: prince.numRelationalEncounters,
    });
    prince.runs = [run];

    // Simulate a saved chart whose cached stats lack the current field names.
    // Sect luck is saved because individual planet longitudes are not.
    const raw = JSON.stringify(prince, (key, value) =>
      key === "base" || key === "buffs" ? { luck: value.luck } : value,
    );
    localStorage.setItem("sp:prince:v7", raw);

    const restored = loadPrince()!;
    expect(restored).toEqual(prince);
    savePrince(restored);
    expect(loadPrince()).toEqual(prince);
  });

  it("caps saved tension at the current Resolve on both charts", () => {
    const prince = createStubPrince();
    const run = beginRun(prince.chart, 7, prince.numRelationalEncounters);
    run.light = 72;
    const encounter = beginRelationalEncounter({
      run, opponentSeed: 8, lifetimeRelationalEncounterCount: prince.numRelationalEncounters,
    });
    run.state.Moon.tension = 180;
    encounter.opponentState.Moon.tension = 180;
    run.encounter = encounter;
    prince.runs = [run];
    savePrince(prince);

    const restored = loadPrince()!;
    const savedRun = restored.runs[0]!;
    expect(savedRun.state.Moon.tension).toBe(getEffectiveStatsFromPlacement(restored.chart.planets.Moon).resolve);
    const savedEncounter = savedRun.encounter;
    if (savedEncounter?.kind !== "relational") throw new Error("Expected a saved relational encounter");
    expect(savedEncounter.opponentState.Moon.tension)
      .toBe(getEffectiveStatsFromPlacement(savedEncounter.opponentChart.planets.Moon).resolve);
    expect(savedRun.light).toBe(72);
  });

  it("round-trips historical and active Light state", () => {
    const prince = createStubPrince();
    const historical = { ...beginRun(prince.chart, 6), light: 36, mapsCompleted: MAPS_PER_RUN };
    const active = { ...beginRun(prince.chart, 7), light: 72 };
    prince.runs = [historical, active];

    savePrince(prince);

    const raw = localStorage.getItem("sp:prince:v7");
    expect(raw).toContain('"light":36');
    expect(raw).toContain('"light":72');
    expect(raw).not.toContain('"distance"');
    expect(loadPrince()).toEqual(prince);
  });
});
