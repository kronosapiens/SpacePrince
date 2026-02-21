import { describe, expect, it } from "vitest";
import { resolveTurn, getPolarity, createInitialPlanetState } from "../src/game/logic";
import {
  PLANETS,
  PLANET_BASE_STATS,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  ELEMENT_BUFFS,
  MODALITY_BUFFS,
} from "../src/game/data";

function addStats(a: { damage: number; healing: number; durability: number; luck: number }, b: { damage: number; healing: number; durability: number; luck: number }) {
  return {
    damage: a.damage + b.damage,
    healing: a.healing + b.healing,
    durability: a.durability + b.durability,
    luck: a.luck + b.luck,
  };
}

function placement(planet: (typeof PLANETS)[number], sign: keyof typeof SIGN_ELEMENT, dignity = "Neutral") {
  const element = SIGN_ELEMENT[sign];
  const modality = SIGN_MODALITY[sign];
  return {
    planet,
    sign,
    element,
    modality,
    dignity,
    base: PLANET_BASE_STATS[planet],
    buffs: addStats(ELEMENT_BUFFS[element], MODALITY_BUFFS[modality]),
  };
}

function buildChart(
  overrides: Partial<Record<(typeof PLANETS)[number], { sign: keyof typeof SIGN_ELEMENT; dignity?: string }>> = {},
  isDiurnal = false
) {
  const planets = {} as Record<(typeof PLANETS)[number], ReturnType<typeof placement>>;
  for (const planet of PLANETS) {
    planets[planet] = placement(planet, "Taurus", "Neutral");
  }
  for (const [planet, config] of Object.entries(overrides) as Array<
    [(typeof PLANETS)[number], { sign: keyof typeof SIGN_ELEMENT; dignity?: string }]
  >) {
    planets[planet] = placement(planet, config.sign, config.dignity ?? "Neutral");
  }
  return { id: "chart", name: "Chart", isDiurnal, planets };
}

function makeRun({
  sequence,
  opponentChart,
  playerState,
  opponentState,
}: {
  sequence: (typeof PLANETS)[number][];
  opponentChart: ReturnType<typeof buildChart>;
  playerState: ReturnType<typeof createInitialPlanetState>;
  opponentState: ReturnType<typeof createInitialPlanetState>;
}) {
  return {
    id: "run",
    seed: 1,
    encounterIndex: 0,
    encounters: [
      {
        id: "enc_0",
        index: 0,
        opponentChart,
        sequence,
        turnIndex: 0,
        completed: false,
      },
    ],
    unlockedPlanets: [...PLANETS],
    playerState,
    opponentState,
    log: [],
    totalAffliction: 0,
    totalTestimony: 0,
    score: 0,
    over: false,
    victory: false,
  };
}

function setAffliction(
  state: ReturnType<typeof createInitialPlanetState>,
  planet: (typeof PLANETS)[number],
  affliction: number,
  combusted = false,
  exaltationSaveUsed = false
) {
  state[planet] = { affliction, combusted, exaltationSaveUsed };
}

describe("game logic", () => {
  it("getPolarity matches quality-based rules", () => {
    expect(getPolarity("Fire", "Fire")).toBe("Testimony");
    expect(getPolarity("Fire", "Air")).toBe("Friction");
    expect(getPolarity("Fire", "Earth")).toBe("Friction");
    expect(getPolarity("Fire", "Water")).toBe("Affliction");
    expect(getPolarity("Earth", "Air")).toBe("Affliction");
  });

  it("resolveTurn applies affliction magnitude with modality multipliers", () => {
    const playerChart = buildChart({
      Mars: { sign: "Aries", dignity: "Domicile" },
    });
    const opponentChart = buildChart({
      Moon: { sign: "Cancer", dignity: "Domicile" },
    });

    const playerState = createInitialPlanetState();
    const opponentState = createInitialPlanetState();
    const run = makeRun({
      sequence: ["Moon"],
      opponentChart,
      playerState,
      opponentState,
    });

    const updated = resolveTurn(run, playerChart, "Mars", () => 0.99);
    const entry = updated.log[0];

    expect(entry.polarity).toBe("Affliction");
    expect(entry.opponentDelta).toBe(8);
    expect(entry.playerDelta).toBe(3);
    expect(entry.turnAffliction).toBe(11);
    expect(entry.turnTestimony).toBe(0);
    expect(entry.turnScore).toBe(11);
    expect(updated.totalAffliction).toBe(11);
    expect(updated.totalTestimony).toBe(0);
    expect(updated.score).toBe(11);
    expect(updated.playerState.Mars.affliction).toBe(3);
    expect(updated.opponentState.Moon.affliction).toBe(8);
  });

  it("testimony healing clamps at zero affliction", () => {
    const playerChart = buildChart({
      Moon: { sign: "Aries", dignity: "Neutral" },
    });
    const opponentChart = buildChart({
      Sun: { sign: "Aries", dignity: "Neutral" },
    });

    const playerState = createInitialPlanetState();
    const opponentState = createInitialPlanetState();
    setAffliction(playerState, "Moon", 1);
    setAffliction(opponentState, "Sun", 1);

    const run = makeRun({
      sequence: ["Sun"],
      opponentChart,
      playerState,
      opponentState,
    });

    const updated = resolveTurn(run, playerChart, "Moon", () => 0.99);
    const entry = updated.log[0];

    expect(entry.polarity).toBe("Testimony");
    expect(entry.playerDelta).toBe(1);
    expect(entry.opponentDelta).toBe(1);
    expect(updated.playerState.Moon.affliction).toBe(0);
    expect(updated.opponentState.Sun.affliction).toBe(0);
  });

  it("square propagation inverts affliction into testimony with same-sect scaling", () => {
    const playerChart = buildChart({
      Mars: { sign: "Aries", dignity: "Domicile" },
      Moon: { sign: "Cancer", dignity: "Neutral" },
    });
    const opponentChart = buildChart({
      Moon: { sign: "Cancer", dignity: "Domicile" },
    });

    const playerState = createInitialPlanetState();
    const opponentState = createInitialPlanetState();
    setAffliction(playerState, "Moon", 6);

    const run = makeRun({
      sequence: ["Moon"],
      opponentChart,
      playerState,
      opponentState,
    });

    const updated = resolveTurn(run, playerChart, "Mars", () => 0.99);
    const propagationToMoon = updated.log[0].propagation.find((p) => p.target === "Moon");

    expect(propagationToMoon).toBeDefined();
    expect(propagationToMoon?.delta).toBe(-2);
    expect(updated.playerState.Moon.affliction).toBe(4);
  });

  it("exaltation save prevents first fatal combustion then consumes", () => {
    const playerChart = buildChart({
      Mars: { sign: "Capricorn", dignity: "Exaltation" },
    });
    const opponentChart = buildChart({
      Mars: { sign: "Aries", dignity: "Domicile" },
    });

    const playerState = createInitialPlanetState();
    const opponentState = createInitialPlanetState();
    setAffliction(playerState, "Mars", 30);

    const run = makeRun({
      sequence: ["Mars", "Mars"],
      opponentChart,
      playerState,
      opponentState,
    });

    const afterFirst = resolveTurn(run, playerChart, "Mars", () => 0);
    expect(afterFirst.playerState.Mars.combusted).toBe(false);
    expect(afterFirst.playerState.Mars.exaltationSaveUsed).toBe(true);

    const afterSecond = resolveTurn(afterFirst, playerChart, "Mars", () => 0);
    expect(afterSecond.playerState.Mars.combusted).toBe(true);
  });

  it("combusted planets do not receive direct effects", () => {
    const playerChart = buildChart({
      Mars: { sign: "Aries", dignity: "Domicile" },
    });
    const opponentChart = buildChart({
      Moon: { sign: "Cancer", dignity: "Neutral" },
    });

    const playerState = createInitialPlanetState();
    const opponentState = createInitialPlanetState();
    setAffliction(opponentState, "Moon", 9, true);

    const run = makeRun({
      sequence: ["Moon"],
      opponentChart,
      playerState,
      opponentState,
    });

    const updated = resolveTurn(run, playerChart, "Mars", () => 0.99);
    expect(updated.opponentState.Moon.affliction).toBe(9);
    expect(updated.log[0].opponentDelta).toBe(0);
  });

  it("combusted planets are skipped as propagation targets", () => {
    const playerChart = buildChart({
      Mars: { sign: "Aries", dignity: "Domicile" },
      Moon: { sign: "Cancer", dignity: "Neutral" },
    });
    const opponentChart = buildChart({
      Moon: { sign: "Cancer", dignity: "Neutral" },
    });

    const playerState = createInitialPlanetState();
    const opponentState = createInitialPlanetState();
    setAffliction(playerState, "Moon", 5, true);

    const run = makeRun({
      sequence: ["Moon"],
      opponentChart,
      playerState,
      opponentState,
    });

    const updated = resolveTurn(run, playerChart, "Mars", () => 0.99);
    const propagatedToMoon = updated.log[0].propagation.find((p) => p.target === "Moon");
    expect(propagatedToMoon).toBeUndefined();
    expect(updated.playerState.Moon.affliction).toBe(5);
  });
});
