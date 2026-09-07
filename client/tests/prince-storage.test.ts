import { beforeEach, describe, expect, it } from "vitest";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { loadPrince, savePrince } from "@/state/prince";
import { getScenario } from "@/data/narrative-scenarios";
import { beginNarrativeEncounter } from "@/game/encounter";
import { resolveNarrative } from "@/game/narrative";
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
    run.encounter = beginNarrativeEncounter({ run, house: 2, scenarioId: scenario.scenarioId, fragmentId: "fragment" });
    prince.runs = [run];
    savePrince(prince);
    const restored = loadPrince()!;
    expect(restored.runs[0]!.encounter).toEqual(run.encounter);
    const resolved = resolveNarrative(restored.runs[0]!, restored, scenario, "take", {}, () => 0)!;
    savePrince({ ...restored, runs: [resolved] });
    const reloaded = loadPrince()!;
    expect(reloaded.runs[0]!.encounter).toEqual(resolved.encounter);
    expect(reloaded.runs[0]!.light).toBe(12);
    expect(resolveNarrative(reloaded.runs[0]!, reloaded, scenario, "take", {}, () => 0)).toBeNull();
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
