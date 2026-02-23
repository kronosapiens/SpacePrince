import { describe, expect, it } from "vitest";
import { resolveTurn, createInitialPlanetState, generateChart } from "../src/game/logic";
import { getPolarity, getProjectedPair } from "../src/game/combat";
import {
  PLANETS,
  PLANET_BASE_STATS,
  PLANET_SECT,
  SIGNS,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  ELEMENT_BUFFS,
  MODALITY_BUFFS,
} from "../src/game/data";
import { roundDisplay } from "../src/lib/format";

function addStats(a: { damage: number; healing: number; durability: number; luck: number }, b: { damage: number; healing: number; durability: number; luck: number }) {
  return {
    damage: a.damage + b.damage,
    healing: a.healing + b.healing,
    durability: a.durability + b.durability,
    luck: a.luck + b.luck,
  };
}

function placement(
  planet: (typeof PLANETS)[number],
  sign: keyof typeof SIGN_ELEMENT,
  dignity = "Neutral",
  isDiurnal = false
) {
  const element = SIGN_ELEMENT[sign];
  const modality = SIGN_MODALITY[sign];
  const buffs = addStats(ELEMENT_BUFFS[element], MODALITY_BUFFS[modality]);
  const chartSect = isDiurnal ? "Day" : "Night";
  const planetSect =
    PLANET_SECT[planet] === "Flexible" ? (isDiurnal ? "Day" : "Night") : PLANET_SECT[planet];
  if (planetSect === chartSect) {
    buffs.durability += 1;
  }
  return {
    planet,
    sign,
    element,
    modality,
    dignity,
    base: PLANET_BASE_STATS[planet],
    buffs,
  };
}

function buildChart(
  overrides: Partial<Record<(typeof PLANETS)[number], { sign: keyof typeof SIGN_ELEMENT; dignity?: string }>> = {},
  isDiurnal = false
) {
  const planets = {} as Record<(typeof PLANETS)[number], ReturnType<typeof placement>>;
  for (const planet of PLANETS) {
    planets[planet] = placement(planet, "Taurus", "Neutral", isDiurnal);
  }
  for (const [planet, config] of Object.entries(overrides) as Array<
    [(typeof PLANETS)[number], { sign: keyof typeof SIGN_ELEMENT; dignity?: string }]
  >) {
    planets[planet] = placement(planet, config.sign, config.dignity ?? "Neutral", isDiurnal);
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

function signDistance(a: keyof typeof SIGN_ELEMENT, b: keyof typeof SIGN_ELEMENT) {
  const ai = SIGNS.indexOf(a);
  const bi = SIGNS.indexOf(b);
  const delta = Math.abs(ai - bi);
  return Math.min(delta, SIGNS.length - delta);
}

function angularDistanceDegrees(a: number, b: number) {
  const delta = Math.abs(a - b);
  return Math.min(delta, 360 - delta);
}

describe("game logic", () => {
  it("getPolarity matches quality-based rules", () => {
    expect(getPolarity("Fire", "Fire")).toBe("Testimony");
    expect(getPolarity("Fire", "Air")).toBe("Friction");
    expect(getPolarity("Fire", "Earth")).toBe("Friction");
    expect(getPolarity("Fire", "Water")).toBe("Affliction");
    expect(getPolarity("Earth", "Air")).toBe("Affliction");
  });

  it("resolveTurn applies affliction magnitude without modality multipliers", () => {
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
    expect(entry.opponentDelta).toBe(6);
    expect(entry.playerDelta).toBe(2);
    expect(entry.turnScore).toBe(26);
    expect(updated.score).toBe(26);
    expect(updated.playerState.Mars.affliction).toBe(2);
    expect(updated.opponentState.Moon.affliction).toBe(6);
  });

  it("seeded combat snapshot keeps preview and resolved direct effects aligned", () => {
    const playerChart = buildChart({
      Mars: { sign: "Aries", dignity: "Domicile" },
      Moon: { sign: "Cancer", dignity: "Neutral" },
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

    const preview = getProjectedPair(playerChart, opponentChart, "Mars", "Moon", false, false);
    const updated = resolveTurn(run, playerChart, "Mars", () => 0.99);
    const entry = updated.log[0];

    expect({
      preview: {
        polarity: preview.polarity,
        self: roundDisplay(preview.selfDelta),
        other: roundDisplay(preview.otherDelta),
      },
      direct: {
        polarity: entry.polarity,
        self: roundDisplay(entry.playerDelta),
        other: roundDisplay(entry.opponentDelta),
      },
      propagation: entry.propagation.map((prop) => ({
        side: prop.side,
        target: prop.target,
        delta: roundDisplay(prop.delta),
        note: prop.note,
      })),
      score: roundDisplay(entry.turnScore),
    }).toMatchInlineSnapshot(`
      {
        "direct": {
          "other": 6,
          "polarity": "Affliction",
          "self": 2,
        },
        "preview": {
          "other": 6,
          "polarity": "Affliction",
          "self": 2,
        },
        "propagation": [
          {
            "delta": 0,
            "note": "Square inverts (no effect)",
            "side": "self",
            "target": "Moon",
          },
          {
            "delta": 3,
            "note": "Sextile flows",
            "side": "other",
            "target": "Sun",
          },
          {
            "delta": 3,
            "note": "Sextile flows",
            "side": "other",
            "target": "Mercury",
          },
          {
            "delta": 3,
            "note": "Sextile flows",
            "side": "other",
            "target": "Venus",
          },
          {
            "delta": 3,
            "note": "Sextile flows",
            "side": "other",
            "target": "Mars",
          },
          {
            "delta": 3,
            "note": "Sextile flows",
            "side": "other",
            "target": "Jupiter",
          },
          {
            "delta": 3,
            "note": "Sextile flows",
            "side": "other",
            "target": "Saturn",
          },
        ],
        "score": 26,
      }
    `);
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

  it("square propagation inverts affliction into testimony", () => {
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
    expect(propagationToMoon?.delta).toBe(-1);
    expect(updated.playerState.Moon.affliction).toBe(5);
  });

  it("exaltation combust chance is reduced but does not have a one-time save", () => {
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
    expect(afterFirst.playerState.Mars.combusted).toBe(true);
    expect(afterFirst.playerState.Mars.exaltationSaveUsed).toBe(false);
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

  it("generateChart keeps Mercury and Venus plausibly near the Sun", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const chart = generateChart(seed);
      const sunSign = chart.planets.Sun.sign;
      const mercurySign = chart.planets.Mercury.sign;
      const venusSign = chart.planets.Venus.sign;
      const sunLongitude = chart.planets.Sun.eclipticLongitude;
      const mercuryLongitude = chart.planets.Mercury.eclipticLongitude;
      const venusLongitude = chart.planets.Venus.eclipticLongitude;
      expect(sunLongitude).toBeDefined();
      expect(mercuryLongitude).toBeDefined();
      expect(venusLongitude).toBeDefined();
      expect(signDistance(sunSign, mercurySign)).toBeLessThanOrEqual(1);
      expect(signDistance(sunSign, venusSign)).toBeLessThanOrEqual(2);
      expect(angularDistanceDegrees(sunLongitude ?? 0, mercuryLongitude ?? 0)).toBeLessThanOrEqual(28);
      expect(angularDistanceDegrees(sunLongitude ?? 0, venusLongitude ?? 0)).toBeLessThanOrEqual(47);
    }
  });
});
