import { beforeEach, describe, expect, it } from "vitest";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import { loadPrince, savePrince } from "@/state/prince";
import { createStubPrince } from "./fixtures";

describe("Prince storage", () => {
  beforeEach(() => localStorage.clear());

  it("discards pre-Light v2 state", () => {
    localStorage.setItem("sp:prince:v2", JSON.stringify({ runs: [{ distance: 42 }] }));

    expect(loadPrince()).toBeNull();
    expect(localStorage.getItem("sp:prince:v2")).toBeNull();
  });

  it("round-trips historical and active v3 Light state", () => {
    const historical = { ...beginRun(6), light: 36, mapsCompleted: MAPS_PER_RUN };
    const active = { ...beginRun(7), light: 72 };
    const prince = createStubPrince({ runs: [historical, active] });

    savePrince(prince);

    const raw = localStorage.getItem("sp:prince:v3");
    expect(raw).toContain('"light":36');
    expect(raw).toContain('"light":72');
    expect(raw).not.toContain('"distance"');
    expect(loadPrince()).toEqual(prince);
  });
});
