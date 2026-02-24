import test from "node:test";
import assert from "node:assert/strict";
import { createAstronomyEngineProvider } from "../src/providers.astronomy-engine.js";
import { angularDifferenceDegrees } from "../src/math/angles.js";

const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

test("astronomy-engine provider returns valid longitudes", () => {
  const provider = createAstronomyEngineProvider();
  const t = Date.UTC(2026, 1, 24, 12, 0, 0);
  for (const planet of planets) {
    const lon = provider.getLongitude(planet, t);
    assert.ok(Number.isFinite(lon), `${planet} finite`);
    assert.ok(lon >= 0 && lon < 360, `${planet} in [0,360)`);
  }
});

test("astronomy-engine provider keeps Mercury/Venus near Sun", () => {
  const provider = createAstronomyEngineProvider();
  const t = Date.UTC(2026, 1, 24, 12, 0, 0);
  const sun = provider.getLongitude("Sun", t);
  const mercury = provider.getLongitude("Mercury", t);
  const venus = provider.getLongitude("Venus", t);
  assert.ok(Math.abs(angularDifferenceDegrees(sun, mercury)) <= 35);
  assert.ok(Math.abs(angularDifferenceDegrees(sun, venus)) <= 60);
});
