/** Selected candidate numbers match spec/research/ACHIEVEMENTS.md; bit 0 is candidate 1.
 * These describe the visual baseline, not implemented earning conditions. */
export const ACHIEVEMENTS = [
  { id: 1, category: "Milestones", condition: "Complete the first map." },
  { id: 2, category: "Milestones", condition: "Unlock all seven planets." },
  { id: 5, category: "Milestones", condition: "Complete the first seven-map run." },
  { id: 6, category: "Mastery", condition: "Complete a run without any of your planets combusting." },
  { id: 8, category: "Mastery", condition: "Complete a map in which you acted with each of the seven planets." },
  { id: 9, category: "Mastery", condition: "With one Testify action, reduce affliction on its direct target and combust another Other planet through a hard aspect." },
  { id: 11, category: "Exploration", condition: "Visit all twelve houses across the Prince’s lifetime." },
  { id: 12, category: "Exploration", condition: "Earn Light under each of the seven encounter rulers across runs." },
  { id: 14, category: "Exploration", condition: "Resolve the same house scene on separate visits: once with its joy-planet combusted, and once by taking an option enabled by that planet’s presence." },
  { id: 16, category: "Consequential choices", condition: "Accept permanent combustion of a planet for the run, then complete that run." },
  { id: 19, category: "Consequential choices", condition: "Choose recovery over an available Light reward in a house; in the next chart encounter, earn Light on a turn acted by a planet that the choice actually restored." },
  { id: 20, category: "Consequential choices", condition: "Through house effects, make Mars’s testimony stat exceed its affliction stat; while that remains true, act with Mars to earn Light from applied testimony on the Other’s chart." },
] as const;

export type Achievement = (typeof ACHIEVEMENTS)[number];
export type AchievementCategory = Achievement["category"];

/** Region order in the artwork: each category owns one run of slots. */
export const ACHIEVEMENT_CATEGORIES: readonly AchievementCategory[] = [
  "Milestones", "Mastery", "Exploration", "Consequential choices",
];

export function achievementBit(id: Achievement["id"]): number {
  return 1 << (id - 1);
}
