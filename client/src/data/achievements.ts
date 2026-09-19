/** Candidate numbers match spec/research/ACHIEVEMENTS.md; bit 0 is candidate 1.
 * These describe the visual baseline, not implemented earning conditions. */
export const ACHIEVEMENTS = [
  { id: 1, category: "Milestones", condition: "Complete the first map." },
  { id: 2, category: "Milestones", condition: "Unlock all seven planets." },
  { id: 3, category: "Milestones", condition: "Complete a map after one of your planets combusts during it." },
  { id: 4, category: "Milestones", condition: "Revive a planet, then act with it in a later chart encounter." },
  { id: 5, category: "Milestones", condition: "Complete the first seven-map run." },
  { id: 6, category: "Mastery", condition: "Complete a run without any of your planets combusting." },
  { id: 7, category: "Mastery", condition: "With all seven planets already unlocked, fall to one lit planet and recover to all seven lit within the same run." },
  { id: 8, category: "Mastery", condition: "Complete a map in which you acted with each of the seven planets." },
  { id: 9, category: "Mastery", condition: "With one Testify action, reduce affliction on its direct target and combust another Other planet through a hard aspect." },
  { id: 10, category: "Mastery", condition: "Under Saturn’s rule, earn Light from combustion on both charts in one turn, with at least one of your planets still lit afterward." },
  { id: 11, category: "Exploration", condition: "Visit all twelve houses across the Prince’s lifetime." },
  { id: 12, category: "Exploration", condition: "Earn Light under each of the seven encounter rulers across runs." },
  { id: 13, category: "Exploration", condition: "Complete a map with the canonical Sephirot pattern." },
  { id: 14, category: "Exploration", condition: "Resolve the same house scene on separate visits: once with its joy-planet combusted, and once by taking an option enabled by that planet’s presence." },
  { id: 15, category: "Exploration", condition: "Take a Mars-conditioned offer in Labor and a Saturn-conditioned offer in The Hidden, across any runs." },
  { id: 16, category: "Consequential choices", condition: "Accept permanent combustion of a planet for the run, then complete that run." },
  { id: 17, category: "Consequential choices", condition: "Accept a run-long Resolve reduction for a benefit; then complete a later chart encounter in which that planet acts and remains lit, with the reduction still in effect." },
  { id: 18, category: "Consequential choices", condition: "Accept a run-long stat trade that weakens one planet to improve another; then complete a chart encounter using both, with both still lit and the trade still in effect." },
  { id: 19, category: "Consequential choices", condition: "Choose recovery over an available Light reward in a house; in the next chart encounter, earn Light on a turn acted by a planet that the choice actually restored." },
  { id: 20, category: "Consequential choices", condition: "Through house effects, make Mars’s testimony stat exceed its affliction stat; while that remains true, act with Mars to earn Light from applied testimony on the Other’s chart." },
] as const;

export type Achievement = (typeof ACHIEVEMENTS)[number];

export function achievementBit(id: Achievement["id"]): number {
  return 1 << (id - 1);
}

export const ALL_ACHIEVEMENTS = ACHIEVEMENTS.reduce((mask, { id }) => mask | achievementBit(id), 0);
