import { useState } from "react";
import { PrinceArtwork } from "@/components/PrinceArtwork";
import { ACHIEVEMENTS, achievementBit } from "@/data/achievements";
import { seededChart } from "@/game/chart";
import { UNLOCK_THRESHOLDS } from "@/game/data";
import { mulberry32, randomSeed } from "@/game/rng";
import { beginRun, MAPS_PER_RUN } from "@/game/run";
import type { Prince } from "@/game/types";
import "@/style/token.css";

function randomPrince(): Prince {
  const seed = randomSeed();
  const rng = mulberry32(seed);
  const chart = seededChart(seed);
  const numEncounters = UNLOCK_THRESHOLDS[UNLOCK_THRESHOLDS.length - 1]!;
  const starCount = Math.floor(rng() * 241);
  const achievementCount = Math.floor(rng() * (ACHIEVEMENTS.length + 1));
  const remaining = [...ACHIEVEMENTS];
  let achievements = 0;
  for (let i = 0; i < achievementCount; i++) {
    const [achievement] = remaining.splice(Math.floor(rng() * remaining.length), 1);
    achievements |= achievementBit(achievement!.id);
  }
  // Only the completed runs' Light is drawn; their unused map and state can be shared.
  const run = beginRun(chart, seed, numEncounters);
  return {
    id: `preview_${seed}`,
    position: { iso: "2000-01-01T00:00:00Z", lat: 0, lon: 0 },
    chart,
    numEncounters,
    achievements,
    runs: Array.from({ length: starCount }, (_, index) => ({
      ...run,
      id: `preview_${seed}_run_${index}`,
      mapsCompleted: MAPS_PER_RUN,
      light: 12 * Math.floor(2 ** (rng() * 10)),
    })),
  };
}

export function TokenScreen() {
  const [prince, setPrince] = useState(randomPrince);
  const achievementCount = ACHIEVEMENTS.filter((achievement) =>
    (prince.achievements & achievementBit(achievement.id)) !== 0,
  ).length;

  return (
    <main className="token-screen">
      <header className="token-header">
        <p className="eyebrow">Space Prince · NFT preview</p>
        <h1>The Prince</h1>
      </header>
      <figure className="token-artwork">
        <PrinceArtwork prince={prince} />
        <figcaption aria-live="polite" aria-atomic="true">
          {prince.runs.length} Light {prince.runs.length === 1 ? "star" : "stars"}
          <span aria-hidden="true"> · </span>
          {achievementCount} {achievementCount === 1 ? "achievement" : "achievements"}
        </figcaption>
      </figure>
      <footer className="token-controls">
        <button type="button" onClick={() => setPrince(randomPrince())}>Generate another</button>
        <p>Or refresh for a new chart and history.</p>
      </footer>
    </main>
  );
}
