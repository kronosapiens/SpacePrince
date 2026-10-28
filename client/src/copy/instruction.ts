/** Instruction copy — the one line at the top of each gameplay screen naming
 *  the player's next step. Each screen picks the entry for its current step
 *  and shows nothing while no input is waited on (openings, resolution, a
 *  finished run) or while its guide is open.
 *  Register: a plain imperative naming the thing to click. */

export const INSTRUCTION = {
  encounter: {
    planet: "Choose a planet to respond",
    verb: "Choose Afflict or Testify",
  },
  narrative: {
    option: "Choose an action",
    target: "Choose a planet",
  },
  map: {
    node: "Choose where to go next",
  },
} as const;
