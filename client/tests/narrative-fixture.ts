import { A, L, revival, scene, trade } from "@/data/narrative/shared";

// Stable offers for interaction and resolver tests, independent of authored prose.
export const INTERACTION_SCENE = scene("fixture-narrative", 4, "Libra", "A household offers work, rest, and a place by the fire.", [
  trade("work", "Carry the wood.", [A("chosen", 48), L(48)]),
  trade("rest", "Sit by the fire.", [A("chosen", -36)]),
  trade("gift", "Accept the gift.", [L(12)]),
  revival("Set another place."),
  trade("share", "Share the supper.", [A("allUnlocked", -24)], { cost: 24 }),
]);
