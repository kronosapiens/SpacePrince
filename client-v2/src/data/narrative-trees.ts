import type { Omen, PlanetName } from "@/game/types";
import { HOUSES, type HouseDef } from "./houses";

export type Outcome =
  | { kind: "affliction"; planet: PlanetName; delta: number }       // positive = harm; negative = heal
  | { kind: "combust"; planet: PlanetName; value: boolean }
  | { kind: "uncombust"; planet: PlanetName }                        // explicit
  | { kind: "distance"; delta: number }                              // earn/spend
  | { kind: "omen"; omen: Omen }
  | { kind: "lore"; id: string };

export interface NarrativeContext {
  joyPlanet: PlanetName | null;
  joyAffliction: number;
  joyCombusted: boolean;
  rulerPlanet: PlanetName;
  perPlanetState: Record<PlanetName, { affliction: number; combusted: boolean }>;
}

export interface Option {
  id: string;
  text: string;
  /** Optional gate; option is hidden if predicate returns false. */
  visibleIf?: (ctx: NarrativeContext) => boolean;
  /** Sub-text shown beneath the option label. */
  aside?: string | ((ctx: NarrativeContext) => string);
  /** Outcomes applied immediately on commit (deterministic). */
  outcomes?: Outcome[];
  /** Outcomes applied if the luck check fails (push-your-luck rung); rolled against joy-planet luck. */
  outcomesOnFail?: Outcome[];
  /** Outcomes applied if the luck check succeeds. Used together with outcomesOnFail. */
  outcomesOnSuccess?: Outcome[];
  /** Next node id; absent = terminal (resolves the encounter). */
  next?: string;
}

export interface TreeNode {
  id: string;
  text: string;
  options: Option[];
}

export interface NarrativeTree {
  house: number;
  rootId: string;
  /** Suggested mood for the chorus fragment selection. */
  fragmentMood?: import("./chorus").Mood;
  nodes: Record<string, TreeNode>;
}

// ── Joy-conditioning helpers ──

function joyCleanlyPlaced(ctx: NarrativeContext): boolean {
  if (!ctx.joyPlanet) return false;
  return !ctx.joyCombusted && ctx.joyAffliction < 4;
}

function joyAfflicted(ctx: NarrativeContext): boolean {
  if (!ctx.joyPlanet) return false;
  return ctx.joyCombusted || ctx.joyAffliction >= 4;
}

function someoneCombusted(ctx: NarrativeContext): boolean {
  return Object.values(ctx.perPlanetState).some((s) => s.combusted);
}

// ── Trees ──

const tree1_self: NarrativeTree = {
  house: 1,
  rootId: "root",
  fragmentMood: "opening",
  nodes: {
    root: {
      id: "root",
      text:
        "The hour-marker stands at the door. You return to yourself before walking on.",
      options: [
        {
          id: "settle",
          text: "Sit a moment with the chart you are.",
          aside: "Cost: 2 Distance · Heal 2 affliction across all unbusted planets.",
          outcomes: [
            { kind: "distance", delta: -2 },
            { kind: "affliction", planet: "Mercury", delta: -2 },
          ],
        },
        {
          id: "press",
          text: "Press into your strongest line.",
          aside: "Mercury (joy here) speaks if it can.",
          visibleIf: (c) => !!c.joyPlanet && !c.joyCombusted,
          outcomes: [
            { kind: "distance", delta: 1 },
            { kind: "affliction", planet: "Mercury", delta: -1 },
            { kind: "lore", id: "house_1_pressed" },
          ],
        },
        {
          id: "wager",
          text: "Stake your name on the next encounter.",
          next: "stake",
        },
      ],
    },
    stake: {
      id: "stake",
      text: "Saying it aloud is the first cost. The world is waiting to hear.",
      options: [
        {
          id: "speak",
          text: "Speak.",
          aside: "Gain 4 Distance now. Mercury takes 3 affliction.",
          outcomes: [
            { kind: "distance", delta: 4 },
            { kind: "affliction", planet: "Mercury", delta: 3 },
          ],
        },
        {
          id: "withdraw",
          text: "Hold the word back.",
          aside: "Free.",
          outcomes: [],
        },
      ],
    },
  },
};

const tree2_livelihood: NarrativeTree = {
  house: 2,
  rootId: "root",
  fragmentMood: "warning",
  nodes: {
    root: {
      id: "root",
      text:
        "The Gate of Hades. Always narrow. Always demanding. You have come back hungry.",
      options: [
        {
          id: "labor",
          text: "Labor honestly. Take what you can carry.",
          aside: "Gain 3 Distance. Mars (effort) takes 2 affliction.",
          outcomes: [
            { kind: "distance", delta: 3 },
            { kind: "affliction", planet: "Mars", delta: 2 },
          ],
        },
        {
          id: "borrow",
          text: "Borrow against tomorrow.",
          aside: "Gain 5 Distance now. Saturn takes 4 affliction.",
          outcomes: [
            { kind: "distance", delta: 5 },
            { kind: "affliction", planet: "Saturn", delta: 4 },
          ],
        },
        {
          id: "leave",
          text: "Leave the gate empty-handed.",
          aside: "Lose 1 Distance.",
          outcomes: [{ kind: "distance", delta: -1 }],
        },
      ],
    },
  },
};

const tree3_communication: NarrativeTree = {
  house: 3,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "A neighbor speaks; a sibling answers. Some letters arrive folded.",
      options: [
        {
          id: "listen",
          text: "Listen at length.",
          aside: "Heal 2 affliction on Moon (joy). +1 Distance.",
          visibleIf: joyCleanlyPlaced,
          outcomes: [
            { kind: "affliction", planet: "Moon", delta: -2 },
            { kind: "distance", delta: 1 },
          ],
        },
        {
          id: "interrupt",
          text: "Interrupt with what you came to say.",
          aside: "+3 Distance. +2 affliction on Moon.",
          outcomes: [
            { kind: "distance", delta: 3 },
            { kind: "affliction", planet: "Moon", delta: 2 },
          ],
        },
        {
          id: "carry",
          text: "Carry the message further.",
          next: "messenger",
        },
      ],
    },
    messenger: {
      id: "messenger",
      text: "The mouth speaks the message; the message changes a little in the speaking.",
      options: [
        {
          id: "exact",
          text: "Render it exactly.",
          aside: "+2 Distance.",
          outcomes: [{ kind: "distance", delta: 2 }],
        },
        {
          id: "soften",
          text: "Soften the harder lines.",
          aside: "+4 Distance. +1 affliction on Mercury.",
          outcomes: [
            { kind: "distance", delta: 4 },
            { kind: "affliction", planet: "Mercury", delta: 1 },
          ],
        },
      ],
    },
  },
};

const tree4_home: NarrativeTree = {
  house: 4,
  rootId: "root",
  fragmentMood: "stillness",
  nodes: {
    root: {
      id: "root",
      text: "The hidden foundation. The midnight room. The names beneath the floor.",
      options: [
        {
          id: "rest",
          text: "Rest here.",
          aside: "Heal 2 affliction on Moon and Saturn. -1 Distance.",
          outcomes: [
            { kind: "affliction", planet: "Moon", delta: -2 },
            { kind: "affliction", planet: "Saturn", delta: -2 },
            { kind: "distance", delta: -1 },
          ],
        },
        {
          id: "remember",
          text: "Remember the dead.",
          aside: "+2 Distance.",
          outcomes: [
            { kind: "distance", delta: 2 },
            { kind: "lore", id: "house_4_dead_remembered" },
          ],
        },
        {
          id: "leave",
          text: "Leave the door open behind you.",
          next: "open_door",
        },
      ],
    },
    open_door: {
      id: "open_door",
      text: "Something steps in that you are not sure you invited.",
      options: [
        {
          id: "accept",
          text: "Accept the visitor.",
          aside: "+5 Distance. +3 affliction on Saturn.",
          outcomes: [
            { kind: "distance", delta: 5 },
            { kind: "affliction", planet: "Saturn", delta: 3 },
          ],
        },
        {
          id: "shut",
          text: "Shut the door.",
          aside: "Free.",
          outcomes: [],
        },
      ],
    },
  },
};

const tree5_creativity: NarrativeTree = {
  house: 5,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "The house of pleasure. Children playing. A song you cannot quite finish.",
      options: [
        {
          id: "play",
          text: "Play a while.",
          aside: "Heal 3 affliction on Venus (joy). -1 Distance.",
          visibleIf: joyCleanlyPlaced,
          outcomes: [
            { kind: "affliction", planet: "Venus", delta: -3 },
            { kind: "distance", delta: -1 },
          ],
        },
        {
          id: "dim_pleasure",
          text: "The pleasure is dimmer than you remember.",
          visibleIf: joyAfflicted,
          aside: "+1 Distance. +1 affliction on Venus.",
          outcomes: [
            { kind: "distance", delta: 1 },
            { kind: "affliction", planet: "Venus", delta: 1 },
          ],
        },
        {
          id: "wager",
          text: "Wager what you can spare.",
          next: "wager",
        },
      ],
    },
    wager: {
      id: "wager",
      text: "Children's games are still games. The dice are still dice.",
      options: [
        {
          id: "bet_small",
          text: "Bet small.",
          aside: "+2 Distance.",
          outcomes: [{ kind: "distance", delta: 2 }],
        },
        {
          id: "bet_large",
          text: "Bet what would hurt to lose.",
          aside: "Luck check on Venus: gain 6 Distance on success, +4 affliction on Venus on fail.",
          outcomesOnSuccess: [{ kind: "distance", delta: 6 }],
          outcomesOnFail: [{ kind: "affliction", planet: "Venus", delta: 4 }],
        },
      ],
    },
  },
};

const tree6_labor: NarrativeTree = {
  house: 6,
  rootId: "root",
  fragmentMood: "labor",
  nodes: {
    root: {
      id: "root",
      text: "Bad Fortune's house. Mars works the iron. The day has not yet ended.",
      options: [
        {
          id: "contained",
          text: "Mars carries the load. The malefic is honestly employed.",
          visibleIf: joyCleanlyPlaced,
          aside: "+3 Distance. Heal 1 affliction on Mars.",
          outcomes: [
            { kind: "distance", delta: 3 },
            { kind: "affliction", planet: "Mars", delta: -1 },
          ],
        },
        {
          id: "uncontained",
          text: "Mars is loose. The work cuts what it touches.",
          visibleIf: joyAfflicted,
          aside: "+1 Distance. +3 affliction on Mars and Mercury.",
          outcomes: [
            { kind: "distance", delta: 1 },
            { kind: "affliction", planet: "Mars", delta: 3 },
            { kind: "affliction", planet: "Mercury", delta: 3 },
          ],
        },
        {
          id: "rest",
          text: "Step aside and rest.",
          aside: "-1 Distance.",
          outcomes: [{ kind: "distance", delta: -1 }],
        },
      ],
    },
  },
};

const tree7_relationships: NarrativeTree = {
  house: 7,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "The threshold of the other. Whoever it is, they look at you back.",
      options: [
        {
          id: "ally",
          text: "Treat them as ally.",
          aside: "Heal 1 affliction on Venus and Sun. +1 Distance.",
          outcomes: [
            { kind: "affliction", planet: "Venus", delta: -1 },
            { kind: "affliction", planet: "Sun", delta: -1 },
            { kind: "distance", delta: 1 },
          ],
        },
        {
          id: "opponent",
          text: "Treat them as opponent.",
          next: "duel",
        },
        {
          id: "cross",
          text: "Cross without speaking.",
          aside: "Free.",
          outcomes: [],
        },
      ],
    },
    duel: {
      id: "duel",
      text: "A door that swings both ways. You raise your guard; they raise theirs.",
      options: [
        {
          id: "win",
          text: "Win clean.",
          aside: "Luck check on Mars: gain 5 Distance on success, +3 affliction on Mars on fail.",
          outcomesOnSuccess: [{ kind: "distance", delta: 5 }],
          outcomesOnFail: [{ kind: "affliction", planet: "Mars", delta: 3 }],
        },
        {
          id: "withdraw",
          text: "Withdraw.",
          aside: "-2 Distance.",
          outcomes: [{ kind: "distance", delta: -2 }],
        },
      ],
    },
  },
};

const tree8_transformation: NarrativeTree = {
  house: 8,
  rootId: "root",
  fragmentMood: "warning",
  nodes: {
    root: {
      id: "root",
      text: "Idle. The house of inheritance. Someone's ledger closes; someone's opens.",
      options: [
        {
          id: "inherit",
          text: "Take what is offered.",
          aside: "+5 Distance. Add 4 affliction on Saturn.",
          outcomes: [
            { kind: "distance", delta: 5 },
            { kind: "affliction", planet: "Saturn", delta: 4 },
          ],
        },
        {
          id: "release",
          text: "Refuse the gift.",
          aside: "Free.",
          outcomes: [],
        },
        {
          id: "rite",
          text: "Perform the rite that lifts a combust.",
          visibleIf: someoneCombusted,
          aside: "Lose 6 Distance · uncombust one planet of the wager.",
          next: "rite",
        },
      ],
    },
    rite: {
      id: "rite",
      text: "The rite asks for a name to bring back. Choose with care.",
      options: [
        {
          id: "moon",
          text: "Call back the Moon.",
          visibleIf: (c) => c.perPlanetState.Moon.combusted,
          aside: "-6 Distance. Uncombust Moon.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Moon" },
          ],
        },
        {
          id: "mercury",
          text: "Call back Mercury.",
          visibleIf: (c) => c.perPlanetState.Mercury.combusted,
          aside: "-6 Distance. Uncombust Mercury.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Mercury" },
          ],
        },
        {
          id: "venus",
          text: "Call back Venus.",
          visibleIf: (c) => c.perPlanetState.Venus.combusted,
          aside: "-6 Distance. Uncombust Venus.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Venus" },
          ],
        },
        {
          id: "sun",
          text: "Call back the Sun.",
          visibleIf: (c) => c.perPlanetState.Sun.combusted,
          aside: "-6 Distance. Uncombust Sun.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Sun" },
          ],
        },
        {
          id: "mars",
          text: "Call back Mars.",
          visibleIf: (c) => c.perPlanetState.Mars.combusted,
          aside: "-6 Distance. Uncombust Mars.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Mars" },
          ],
        },
        {
          id: "jupiter",
          text: "Call back Jupiter.",
          visibleIf: (c) => c.perPlanetState.Jupiter.combusted,
          aside: "-6 Distance. Uncombust Jupiter.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Jupiter" },
          ],
        },
        {
          id: "saturn",
          text: "Call back Saturn.",
          visibleIf: (c) => c.perPlanetState.Saturn.combusted,
          aside: "-6 Distance. Uncombust Saturn.",
          outcomes: [
            { kind: "distance", delta: -6 },
            { kind: "uncombust", planet: "Saturn" },
          ],
        },
        {
          id: "abandon",
          text: "Abandon the rite.",
          aside: "Free.",
          outcomes: [],
        },
      ],
    },
  },
};

const tree9_pilgrimage: NarrativeTree = {
  house: 9,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "Theos. The far country. The teacher you have not yet heard.",
      options: [
        {
          id: "study",
          text: "Sit and study.",
          aside: "Heal 2 affliction on Sun (joy). +1 Distance.",
          visibleIf: joyCleanlyPlaced,
          outcomes: [
            { kind: "affliction", planet: "Sun", delta: -2 },
            { kind: "distance", delta: 1 },
            { kind: "lore", id: "house_9_studied" },
          ],
        },
        {
          id: "wander",
          text: "Wander without aim.",
          aside: "+2 Distance. +1 affliction on Sun.",
          outcomes: [
            { kind: "distance", delta: 2 },
            { kind: "affliction", planet: "Sun", delta: 1 },
          ],
        },
        {
          id: "vow",
          text: "Take a vow at the threshold.",
          next: "vow",
        },
      ],
    },
    vow: {
      id: "vow",
      text: "Vows are gates. They cost going through; they cost going back.",
      options: [
        {
          id: "keep",
          text: "Keep the vow.",
          aside: "+4 Distance.",
          outcomes: [{ kind: "distance", delta: 4 }],
        },
        {
          id: "break",
          text: "Break the vow.",
          aside: "+2 Distance. +3 affliction on Sun.",
          outcomes: [
            { kind: "distance", delta: 2 },
            { kind: "affliction", planet: "Sun", delta: 3 },
          ],
        },
      ],
    },
  },
};

const tree10_achievement: NarrativeTree = {
  house: 10,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "Mesouranema. The visible summit. A crowd you did not call.",
      options: [
        {
          id: "speak",
          text: "Speak from the summit.",
          aside: "+3 Distance. +1 affliction on Sun.",
          outcomes: [
            { kind: "distance", delta: 3 },
            { kind: "affliction", planet: "Sun", delta: 1 },
          ],
        },
        {
          id: "step_back",
          text: "Step back from the light.",
          aside: "Heal 2 affliction on Saturn. -1 Distance.",
          outcomes: [
            { kind: "affliction", planet: "Saturn", delta: -2 },
            { kind: "distance", delta: -1 },
          ],
        },
        {
          id: "build",
          text: "Build something visible.",
          next: "build",
        },
      ],
    },
    build: {
      id: "build",
      text: "What stands at noon casts the longest shadow.",
      options: [
        {
          id: "modest",
          text: "Build modestly.",
          aside: "+2 Distance.",
          outcomes: [{ kind: "distance", delta: 2 }],
        },
        {
          id: "monument",
          text: "Build a monument.",
          aside: "Luck check on Saturn: gain 7 Distance on success, +5 affliction on Saturn on fail.",
          outcomesOnSuccess: [{ kind: "distance", delta: 7 }],
          outcomesOnFail: [{ kind: "affliction", planet: "Saturn", delta: 5 }],
        },
      ],
    },
  },
};

const tree11_friendship: NarrativeTree = {
  house: 11,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "Agathos Daimon. A friend arrives carrying something for you.",
      options: [
        {
          id: "accept",
          text: "Accept the gift.",
          aside: "Heal 3 affliction on Jupiter. +2 Distance.",
          visibleIf: joyCleanlyPlaced,
          outcomes: [
            { kind: "affliction", planet: "Jupiter", delta: -3 },
            { kind: "distance", delta: 2 },
          ],
        },
        {
          id: "noone",
          text: "There is no one at the door.",
          visibleIf: joyAfflicted,
          aside: "Lose 1 Distance.",
          outcomes: [{ kind: "distance", delta: -1 }],
        },
        {
          id: "ask",
          text: "Ask for more than the gift.",
          next: "ask_more",
        },
      ],
    },
    ask_more: {
      id: "ask_more",
      text: "The friend pauses. Their hands are not infinite.",
      options: [
        {
          id: "name_it",
          text: "Name what you need.",
          aside: "+4 Distance. +2 affliction on Jupiter.",
          outcomes: [
            { kind: "distance", delta: 4 },
            { kind: "affliction", planet: "Jupiter", delta: 2 },
          ],
        },
        {
          id: "withdraw",
          text: "Withdraw the request.",
          aside: "Free.",
          outcomes: [],
        },
      ],
    },
  },
};

const tree12_hidden: NarrativeTree = {
  house: 12,
  rootId: "root",
  fragmentMood: "concealment",
  nodes: {
    root: {
      id: "root",
      text: "Kakos Daimon. The unseen weight. The exile you carry without naming.",
      options: [
        {
          id: "contained",
          text: "Saturn carries the weight. Costs are scoped, legible, real.",
          visibleIf: joyCleanlyPlaced,
          aside: "+2 Distance. +1 affliction on Saturn.",
          outcomes: [
            { kind: "distance", delta: 2 },
            { kind: "affliction", planet: "Saturn", delta: 1 },
          ],
        },
        {
          id: "uncontained",
          text: "The weight is unsupervised. It costs more than it should.",
          visibleIf: joyAfflicted,
          aside: "+1 Distance. +4 affliction on Saturn.",
          outcomes: [
            { kind: "distance", delta: 1 },
            { kind: "affliction", planet: "Saturn", delta: 4 },
          ],
        },
        {
          id: "speak_name",
          text: "Name the unseen thing.",
          next: "name",
        },
      ],
    },
    name: {
      id: "name",
      text: "The name does not banish. It clarifies.",
      options: [
        {
          id: "carry",
          text: "Carry the named thing.",
          aside: "+3 Distance.",
          outcomes: [
            { kind: "distance", delta: 3 },
            { kind: "lore", id: "house_12_named" },
          ],
        },
        {
          id: "release",
          text: "Release it without resolution.",
          aside: "Free.",
          outcomes: [],
        },
      ],
    },
  },
};

export const NARRATIVE_TREES: Record<number, NarrativeTree> = {
  1: tree1_self,
  2: tree2_livelihood,
  3: tree3_communication,
  4: tree4_home,
  5: tree5_creativity,
  6: tree6_labor,
  7: tree7_relationships,
  8: tree8_transformation,
  9: tree9_pilgrimage,
  10: tree10_achievement,
  11: tree11_friendship,
  12: tree12_hidden,
};

export function getTree(house: number): NarrativeTree {
  const t = NARRATIVE_TREES[house];
  if (!t) throw new Error(`No narrative tree for house ${house}`);
  return t;
}

export function getTreeNode(tree: NarrativeTree, nodeId: string): TreeNode {
  const n = tree.nodes[nodeId];
  if (!n) throw new Error(`No node ${nodeId} in tree for house ${tree.house}`);
  return n;
}

export function getTreeForHouse(house: HouseDef): NarrativeTree {
  return getTree(house.num);
}

// Resolve aside text whether it's a literal string or a function of context.
export function resolveAside(option: Option, ctx: NarrativeContext): string | undefined {
  if (option.aside === undefined) return undefined;
  if (typeof option.aside === "string") return option.aside;
  return option.aside(ctx);
}

// Filter options by visibility predicate.
export function visibleOptions(node: TreeNode, ctx: NarrativeContext): Option[] {
  return node.options.filter((o) => (o.visibleIf ? o.visibleIf(ctx) : true));
}

void HOUSES; // re-export keep-around (unused locally but consumers may import)
