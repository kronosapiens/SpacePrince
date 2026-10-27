import { pickWeighted } from "@/game/rng";
import type { Policy } from "./play";

/** Uniform among the legal choices: route, (planet, verb), then a narrative
 *  option and one of its selections. */
export const randomPolicy: Policy = {
  route: (play, _run, nodeIds) => pickWeighted(nodeIds, play.rng),
  combat: (play, _run, actions) => pickWeighted(actions, play.rng),
  narrative: (play, _run, options) => {
    const { option, selections } = pickWeighted(options, play.rng);
    return { optionId: option.id, selection: pickWeighted(selections, play.rng) };
  },
};

export const POLICIES = { random: randomPolicy } satisfies Record<string, Policy>;
export type Strategy = keyof typeof POLICIES;
