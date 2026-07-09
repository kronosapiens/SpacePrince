import { describe, expect, it } from "vitest";
import {
  conditioningPlanet,
  dignityNudge,
  resolveTargets,
  tenantPresent,
  tradeKind,
  type NarrativeContext,
  type Outcome,
} from "@/data/narrative-trees";
import { buildNarrativeContext } from "@/game/narrative";
import { beginRun } from "@/game/run";
import { blankSideState } from "@/game/chart";
import { PLANETS, SIGNS } from "@/game/data";
import { createStubPrince } from "./fixtures";
import type { Dignity, PlanetName } from "@/game/types";

const D = (delta: number): Outcome => ({ kind: "distance", delta });
const A = (target: "tenant" | "healthiest" | "mostAfflicted", delta: number): Outcome => ({
  kind: "affliction",
  target,
  delta,
});

function ctxWith(overrides: Partial<NarrativeContext> = {}): NarrativeContext {
  const dignities = {} as Record<PlanetName, Dignity>;
  for (const p of PLANETS) dignities[p] = "Neutral";
  return {
    joyPlanet: null,
    rulerPlanet: "Sun",
    unlocked: [...PLANETS],
    perPlanetState: blankSideState(),
    dignities,
    tenants: [],
    ...overrides,
  };
}

describe("trade classification (ENCOUNTERS §1.2)", () => {
  it("gain-for-affliction is a press; spend-for-heal is a tend", () => {
    expect(tradeKind([D(3), A("healthiest", 2)])).toBe("press");
    expect(tradeKind([D(-1), A("mostAfflicted", -2)])).toBe("tend");
  });

  it("pure gains, boons, and wager payoffs are not trades", () => {
    expect(tradeKind([D(3)])).toBeNull(); // pure gain (wager success shape)
    expect(tradeKind([D(1), A("mostAfflicted", -3)])).toBeNull(); // boon: gain + heal
    expect(tradeKind([A("healthiest", 4)])).toBeNull(); // wager fail shape
  });
});

describe("dignity nudge (ENCOUNTERS §1.4)", () => {
  const press = [D(3), A("healthiest", 2)];
  const tend = [D(-2), A("mostAfflicted", -2)];

  it("a Strong conditioning planet shifts trades one point favorable", () => {
    const ctx = ctxWith({ dignities: { ...ctxWith().dignities, Sun: "Domicile" } });
    expect(dignityNudge(press, ctx)).toBe(1);
    expect(dignityNudge(tend, ctx)).toBe(1); // tend costs one less
  });

  it("a Weak conditioning planet shifts trades one point unfavorable", () => {
    const ctx = ctxWith({ dignities: { ...ctxWith().dignities, Sun: "Fall" } });
    expect(dignityNudge(press, ctx)).toBe(-1);
    expect(dignityNudge(tend, ctx)).toBe(-1);
  });

  it("neutral dignity and non-trades take no nudge", () => {
    expect(dignityNudge(press, ctxWith())).toBe(0);
    const strong = ctxWith({ dignities: { ...ctxWith().dignities, Sun: "Exaltation" } });
    expect(dignityNudge([D(3)], strong)).toBe(0);
  });

  it("the joy conditions when unlocked; otherwise the ruler", () => {
    expect(conditioningPlanet(ctxWith({ joyPlanet: "Venus" }))).toBe("Venus");
    expect(conditioningPlanet(ctxWith({ joyPlanet: "Venus", unlocked: ["Moon"] }))).toBe("Sun");
    expect(conditioningPlanet(ctxWith({ joyPlanet: null }))).toBe("Sun");
  });
});

describe("house tenants (whole-sign)", () => {
  it("buildNarrativeContext finds the planets in the Prince's own house", () => {
    const prince = createStubPrince({ seed: 7 });
    const run = beginRun(1);
    const ascIdx = SIGNS.indexOf(prince.chart.ascendantSign);
    // Pick a house we can verify directly against the chart.
    const house = 4;
    const houseSign = SIGNS[(ascIdx + house - 1) % 12]!;
    const expected = PLANETS.filter((p) => prince.chart.planets[p].sign === houseSign);
    const ctx = buildNarrativeContext({
      prince,
      run,
      house,
      joyPlanet: null,
      rulerPlanet: "Moon",
      unlocked: [...PLANETS],
    });
    expect(ctx.tenants).toEqual(expected);
  });

  it("tenant target resolves to lit tenants only; combusted tenants don't gate", () => {
    const state = blankSideState();
    state.Mars = { affliction: 3, combusted: true };
    const ctx = ctxWith({ tenants: ["Mars", "Venus"], perPlanetState: state });
    expect(resolveTargets("tenant", ctx)).toEqual(["Venus"]);
    expect(tenantPresent(ctx)).toBe(true);

    state.Venus = { affliction: 0, combusted: true };
    expect(tenantPresent(ctxWith({ tenants: ["Mars", "Venus"], perPlanetState: state }))).toBe(false);
  });

  it("an untenanted house gates tenant options off", () => {
    expect(tenantPresent(ctxWith())).toBe(false);
    expect(resolveTargets("tenant", ctxWith())).toEqual([]);
  });
});
