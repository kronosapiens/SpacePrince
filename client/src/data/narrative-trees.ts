import type { Dignity, PlanetName } from "@/game/types";

// ── Targeting (unlock-safe) ─────────────────────────────────────────────────
// Outcomes never name a planet that may be locked. They address abstract roles
// resolved at apply-time against the unlocked set (ENCOUNTERS.md §3). The only
// explicit planet targets are uncombust-rite options, gated on that planet
// being combusted (which implies unlocked).

export type Target =
  | "allUnlocked"      // every unlocked, un-combust planet (broad small heals)
  | "mostAfflicted"    // the unlocked planet carrying the most affliction (Tend)
  | "healthiest"       // the unlocked planet with the most margin (Press absorbs)
  | "joy"              // the house's joy-planet — gated options only
  | "ruler"            // the house's ruler — gated options only
  | PlanetName;        // explicit (uncombust rite)

export type Outcome =
  | { kind: "affliction"; target: Target; delta: number } // +harm / −heal (clamped at 0)
  | { kind: "combust"; target: Target; value: boolean }
  | { kind: "uncombust"; target: Target }
  | { kind: "distance"; delta: number };

// terse constructors keep the trees readable
const D = (delta: number): Outcome => ({ kind: "distance", delta });
const A = (target: Target, delta: number): Outcome => ({ kind: "affliction", target, delta });
const UNC = (target: Target): Outcome => ({ kind: "uncombust", target });

// ── Context + conditioning ──────────────────────────────────────────────────

export interface NarrativeContext {
  joyPlanet: PlanetName | null;
  rulerPlanet: PlanetName;
  unlocked: PlanetName[];
  perPlanetState: Record<PlanetName, { affliction: number; combusted: boolean }>;
  dignities: Record<PlanetName, Dignity>;
}

/** Affliction at/above which a joy-planet's boon flattens (provisional, §6). */
const JOY_AFFLICTED_THRESHOLD = 8;

function band(d: Dignity): "strong" | "neutral" | "weak" {
  if (d === "Domicile" || d === "Exaltation") return "strong";
  if (d === "Detriment" || d === "Fall") return "weak";
  return "neutral";
}

const isUnlocked = (c: NarrativeContext, p: PlanetName) => c.unlocked.includes(p);

export function joyUnlocked(c: NarrativeContext): boolean {
  return !!c.joyPlanet && isUnlocked(c, c.joyPlanet);
}

/** Joy unlocked, lit, and not yet meaningfully harmed — the boon is live. */
export function joyPresent(c: NarrativeContext): boolean {
  if (!joyUnlocked(c)) return false;
  const s = c.perPlanetState[c.joyPlanet!];
  return !s.combusted && s.affliction < JOY_AFFLICTED_THRESHOLD;
}

/** Joy unlocked, lit, present, and dignified — the boon at its richest. */
export function joyStrong(c: NarrativeContext): boolean {
  return joyPresent(c) && band(c.dignities[c.joyPlanet!]) === "strong";
}

/** Joy unlocked but harmed or out — boon flattens, containment fails. */
export function joyAfflicted(c: NarrativeContext): boolean {
  if (!joyUnlocked(c)) return false;
  const s = c.perPlanetState[c.joyPlanet!];
  return s.combusted || s.affliction >= JOY_AFFLICTED_THRESHOLD;
}

/** Joy-planet not yet unlocked — no joy lever this run (early game). */
export function joyLocked(c: NarrativeContext): boolean {
  return !joyUnlocked(c);
}

export function rulerStrong(c: NarrativeContext): boolean {
  return isUnlocked(c, c.rulerPlanet) && band(c.dignities[c.rulerPlanet]) === "strong";
}

export function anyCombusted(c: NarrativeContext): boolean {
  return c.unlocked.some((p) => c.perPlanetState[p].combusted);
}

// ── Tree shape ──────────────────────────────────────────────────────────────

export interface Option {
  id: string;
  text: string;
  /** Optional gate; option hidden when predicate returns false. */
  visibleIf?: (ctx: NarrativeContext) => boolean;
  aside?: string | ((ctx: NarrativeContext) => string);
  /** Deterministic outcomes applied on commit. */
  outcomes?: Outcome[];
  /** Push-your-luck: rolled against the conditioning planet's luck. */
  outcomesOnSuccess?: Outcome[];
  outcomesOnFail?: Outcome[];
  /** Next node id; absent = terminal (resolves the encounter). */
  next?: string;
}

export interface TreeNode {
  id: string;
  text: string;
  options: Option[];
}

export interface NarrativeTree {
  /** Stable id; the unit of the no-repeat rule (§8). */
  scenarioId: string;
  house: number;
  rootId: string;
  fragmentMood?: import("./chorus").Mood;
  nodes: Record<string, TreeNode>;
}

// resolve target → concrete planets at apply-time (combust/uncombust handle
// explicit planets directly; this is for affliction effects)
export function resolveTargets(target: Target, ctx: NarrativeContext): PlanetName[] {
  const alive = ctx.unlocked.filter((p) => !ctx.perPlanetState[p].combusted);
  const aff = (p: PlanetName) => ctx.perPlanetState[p].affliction;
  switch (target) {
    case "allUnlocked":
      return alive;
    case "mostAfflicted":
      return alive.length ? [alive.reduce((a, b) => (aff(b) > aff(a) ? b : a))] : [];
    case "healthiest":
      return alive.length ? [alive.reduce((a, b) => (aff(b) < aff(a) ? b : a))] : [];
    case "joy":
      return ctx.joyPlanet && alive.includes(ctx.joyPlanet) ? [ctx.joyPlanet] : [];
    case "ruler":
      return alive.includes(ctx.rulerPlanet) ? [ctx.rulerPlanet] : [];
    default:
      return [target as PlanetName]; // explicit
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SCENARIOS — 2 per house, distinct facets, kind-templated (ENCOUNTERS.md §7).
// Register: concrete but generic (§9). Numbers are provisional bands (§6).
// ════════════════════════════════════════════════════════════════════════════

// ── House 1 · Self · double-anchored (ruler Mars, joy Mercury) · recovery ──

const self_stillWater: NarrativeTree = {
  scenarioId: "self-still-water",
  house: 1,
  rootId: "root",
  fragmentMood: "opening",
  nodes: {
    root: {
      id: "root",
      text: "Still water at the side of the road. The face looking back is yours, a little more worn than you remember.",
      options: [
        { id: "rest", text: "Stop and gather yourself.", aside: "−1 Distance · heal 2 where it's needed most", outcomes: [D(-1), A("allUnlocked", -2)] },
        { id: "name", text: "Say your own name like you mean it.", visibleIf: joyPresent, aside: "+1 Distance · heal 3 on Mercury", outcomes: [D(1), A("joy", -3)] },
        { id: "borrowed", text: "Try to say your name; it comes out borrowed.", visibleIf: joyAfflicted, aside: "+1 Distance · +1 affliction on Mercury", outcomes: [D(1), A("joy", 1)] },
        { id: "push", text: "Don't look too long. Keep walking.", aside: "+2 Distance · +2 affliction (you push past yourself)", outcomes: [D(2), A("healthiest", 2)] },
      ],
    },
  },
};

const self_stake: NarrativeTree = {
  scenarioId: "self-stake",
  house: 1,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "At the crossroads, others are placing loud bets on themselves. You could put something down too.",
      options: [
        { id: "name", text: "Stake your name on the road ahead.", visibleIf: joyUnlocked, aside: "+4 Distance · +3 affliction on Mercury", outcomes: [D(4), A("joy", 3)] },
        { id: "strength", text: "Stake your strength instead.", aside: "+3 Distance · +3 affliction", outcomes: [D(3), A("healthiest", 3)] },
        { id: "quiet", text: "Keep your name to yourself.", aside: "Nothing ventured.", outcomes: [] },
      ],
    },
  },
};

// ── House 2 · Livelihood · pure bad place (ruler Venus, no joy) · scarcity ──

const livelihood_coin: NarrativeTree = {
  scenarioId: "livelihood-coin",
  house: 2,
  rootId: "root",
  fragmentMood: "warning",
  nodes: {
    root: {
      id: "root",
      text: "At the foot of a dead tree, half-buried, a single gold coin. The ground around it looks recently turned.",
      options: [
        { id: "take", text: "Take the one coin and go.", aside: "+2 Distance", outcomes: [D(2)] },
        { id: "dig", text: "Dig for the rest.", next: "dig" },
      ],
    },
    dig: {
      id: "dig",
      text: "The deeper you go, the more it costs your back. There may be nothing more down there.",
      options: [
        { id: "stop", text: "Stop while you're ahead.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "keep", text: "Keep digging.", aside: "Luck (Venus): +6 Distance, or +4 affliction", outcomesOnSuccess: [D(6)], outcomesOnFail: [A("healthiest", 4)] },
      ],
    },
  },
};

const livelihood_debt: NarrativeTree = {
  scenarioId: "livelihood-debt",
  house: 2,
  rootId: "root",
  fragmentMood: "warning",
  nodes: {
    root: {
      id: "root",
      text: "A lender offers you everything you need now, on terms written in a hand too small to read.",
      options: [
        { id: "borrow", text: "Borrow against tomorrow.", aside: "+5 Distance · +4 affliction (the debt comes due)", outcomes: [D(5), A("healthiest", 4)] },
        { id: "little", text: "Take only what you can repay.", aside: "+2 Distance · +1 affliction", outcomes: [D(2), A("healthiest", 1)] },
        { id: "leave", text: "Walk away hungry.", aside: "−1 Distance", outcomes: [D(-1)] },
      ],
    },
  },
};

// ── House 3 · Communication · benefic joy (ruler Mercury, joy Moon) ──

const communication_letter: NarrativeTree = {
  scenarioId: "communication-letter",
  house: 3,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "A letter is waiting for you. You don't recognize the handwriting.",
      options: [
        { id: "read", text: "Read it slowly, start to finish.", aside: "−1 Distance · heal 2 where it's needed most", outcomes: [D(-1), A("mostAfflicted", -2)] },
        { id: "reply", text: "Write back before you sleep.", visibleIf: joyPresent, aside: "+1 Distance · heal 3 on the Moon", outcomes: [D(1), A("joy", -3)] },
        { id: "stuck", text: "Start a reply; nothing comes.", visibleIf: joyAfflicted, aside: "+1 Distance · +1 affliction on the Moon", outcomes: [D(1), A("joy", 1)] },
        { id: "carry", text: "Carry word of your own down the road.", next: "carry" },
      ],
    },
    carry: {
      id: "carry",
      text: "Someone asks you to pass a message to a man you'll meet ahead.",
      options: [
        { id: "exact", text: "Repeat it word for word.", aside: "+2 Distance", outcomes: [D(2)] },
        { id: "own", text: "Tell it the way you'd say it.", aside: "Luck (Moon): +5 Distance, or +3 affliction", outcomesOnSuccess: [D(5)], outcomesOnFail: [A("healthiest", 3)] },
      ],
    },
  },
};

const communication_bridge: NarrativeTree = {
  scenarioId: "communication-bridge",
  house: 3,
  rootId: "root",
  fragmentMood: "paradox",
  nodes: {
    root: {
      id: "root",
      text: "A traveler going the other way says the bridge ahead is washed out. He might be lying.",
      options: [
        { id: "trust", text: "Trust him; take the long way around.", aside: "+1 Distance", outcomes: [D(1)] },
        { id: "press", text: "Press on to the bridge anyway.", aside: "Luck (Moon): +5 Distance, or +3 affliction", outcomesOnSuccess: [D(5)], outcomesOnFail: [A("healthiest", 3)] },
        { id: "send", text: "Ask him to carry word back the way you came.", visibleIf: joyPresent, aside: "+1 Distance · heal 2 on the Moon", outcomes: [D(1), A("joy", -2)] },
      ],
    },
  },
};

// ── House 4 · Home · pure angular IC (ruler Moon, no joy) · rest ──

const home_hearth: NarrativeTree = {
  scenarioId: "home-hearth",
  house: 4,
  rootId: "root",
  fragmentMood: "stillness",
  nodes: {
    root: {
      id: "root",
      text: "A house with a lit window, the door unlocked. You could rest here a night.",
      options: [
        { id: "sleep", text: "Sleep, and leave at dawn.", aside: "−1 Distance · heal 3 across all", outcomes: [D(-1), A("allUnlocked", -3)] },
        { id: "deep", text: "Let the house hold you longer.", visibleIf: rulerStrong, aside: "−2 Distance · heal 5 across all", outcomes: [D(-2), A("allUnlocked", -5)] },
        { id: "move", text: "Don't trust an open door. Move on.", aside: "+1 Distance", outcomes: [D(1)] },
      ],
    },
  },
};

const home_buried: NarrativeTree = {
  scenarioId: "home-buried",
  house: 4,
  rootId: "root",
  fragmentMood: "concealment",
  nodes: {
    root: {
      id: "root",
      text: "Beneath the floorboards, your family left something hidden. Taking it means disturbing what rests.",
      options: [
        { id: "leave", text: "Leave it buried.", aside: "Nothing taken.", outcomes: [] },
        { id: "take", text: "Take what's yours.", aside: "+4 Distance · +3 affliction", outcomes: [D(4), A("healthiest", 3)] },
        { id: "open", text: "Pull up the whole floor.", next: "open" },
      ],
    },
    open: {
      id: "open",
      text: "The boards come up one by one. There's more down there than you were left.",
      options: [
        { id: "enough", text: "Take what you uncovered and stop.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "all", text: "Take all of it.", aside: "Luck (Moon): +6 Distance, or +4 affliction", outcomesOnSuccess: [D(6)], outcomesOnFail: [A("healthiest", 4)] },
      ],
    },
  },
};

// ── House 5 · Creativity · benefic joy (ruler Sun, joy Venus) · play (2-rung) ──

const creativity_dice: NarrativeTree = {
  scenarioId: "creativity-dice",
  house: 5,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "Children are throwing dice in the dust. They wave you over to play.",
      options: [
        { id: "play", text: "Play a round, just for the joy of it.", visibleIf: joyPresent, aside: "+1 Distance · heal 3 on Venus", outcomes: [D(1), A("joy", -3)] },
        { id: "hollow", text: "Play, but the game has lost its taste.", visibleIf: joyAfflicted, aside: "+1 Distance", outcomes: [D(1)] },
        { id: "bet", text: "Put real stakes on the table.", next: "bet1" },
        { id: "watch", text: "Only watch.", aside: "Nothing wagered.", outcomes: [] },
      ],
    },
    bet1: {
      id: "bet1",
      text: "The dice are warm in your hand. You're up, for now.",
      options: [
        { id: "small", text: "Take a small, sure win.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "push", text: "Push for the big throw.", next: "bet2" },
      ],
    },
    bet2: {
      id: "bet2",
      text: "Everything on one roll. The children go quiet.",
      options: [
        { id: "throw", text: "Throw.", aside: "Luck (Venus): +8 Distance, or +6 affliction on Venus", outcomesOnSuccess: [D(8)], outcomesOnFail: [A("joy", 6)] },
      ],
    },
  },
};

const creativity_song: NarrativeTree = {
  scenarioId: "creativity-song",
  house: 5,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "A tune you can't quite finish keeps circling in your head. Working it out would cost you the evening.",
      options: [
        { id: "finish", text: "Stay up and finish it.", visibleIf: joyUnlocked, aside: "+4 Distance · +3 affliction on Venus", outcomes: [D(4), A("joy", 3)] },
        { id: "finish_alt", text: "Stay up and finish it.", visibleIf: joyLocked, aside: "+4 Distance · +3 affliction", outcomes: [D(4), A("healthiest", 3)] },
        { id: "rough", text: "Make something rough but done.", aside: "+2 Distance · +1 affliction", outcomes: [D(2), A("healthiest", 1)] },
        { id: "let", text: "Let it go unfinished.", aside: "Nothing made.", outcomes: [] },
      ],
    },
  },
};

// ── House 6 · Labor · contained malefic (ruler Mercury, joy Mars) · toil ──

const labor_field: NarrativeTree = {
  scenarioId: "labor-field",
  house: 6,
  rootId: "root",
  fragmentMood: "labor",
  nodes: {
    root: {
      id: "root",
      text: "A field that has to be cleared by dusk. The work is honest, and it will take something out of you.",
      options: [
        { id: "contained", text: "Let Mars do the job it's made for.", visibleIf: joyPresent, aside: "+3 Distance · +1 affliction on Mars (scoped)", outcomes: [D(3), A("joy", 1)] },
        { id: "spill", text: "Force it through; something gives.", visibleIf: joyAfflicted, aside: "+2 Distance · +4 affliction on Mars · +2 elsewhere", outcomes: [D(2), A("joy", 4), A("healthiest", 2)] },
        { id: "usual", text: "Take the work at the usual cost.", aside: "+2 Distance · +3 affliction", outcomes: [D(2), A("healthiest", 3)] },
        { id: "off", text: "Walk off the job.", aside: "−1 Distance", outcomes: [D(-1)] },
      ],
    },
  },
};

const labor_fever: NarrativeTree = {
  scenarioId: "labor-fever",
  house: 6,
  rootId: "root",
  fragmentMood: "labor",
  nodes: {
    root: {
      id: "root",
      text: "A fever you can't shake. You can push through the day's work or lie down and lose it.",
      options: [
        { id: "push", text: "Push through, sick as you are.", aside: "+3 Distance · +4 affliction", outcomes: [D(3), A("healthiest", 4)] },
        { id: "sweat", text: "Let Mars sweat it out of you.", visibleIf: joyStrong, aside: "+1 Distance · heal 2 on Mars", outcomes: [D(1), A("joy", -2)] },
        { id: "lie", text: "Lie down until it passes.", aside: "−2 Distance · heal 3 where it's needed most", outcomes: [D(-2), A("mostAfflicted", -3)] },
      ],
    },
  },
};

// ── House 7 · Relationships · pure angular DSC (ruler Venus, no joy) ──

const relationships_stranger: NarrativeTree = {
  scenarioId: "relationships-stranger",
  house: 7,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "A stranger on the road falls into step beside you. You can't tell yet if they mean well.",
      options: [
        { id: "friend", text: "Treat them as a friend.", aside: "+1 Distance · heal 1 across all", outcomes: [D(1), A("allUnlocked", -1)] },
        { id: "rival", text: "Treat them as a rival.", next: "duel" },
        { id: "pass", text: "Pass without a word.", aside: "Nothing exchanged.", outcomes: [] },
      ],
    },
    duel: {
      id: "duel",
      text: "Guards up, both of you. The road narrows.",
      options: [
        { id: "back", text: "Step back from it.", aside: "−1 Distance", outcomes: [D(-1)] },
        { id: "through", text: "See it through.", aside: "Luck (Venus): +5 Distance, or +3 affliction", outcomesOnSuccess: [D(5)], outcomesOnFail: [A("healthiest", 3)] },
      ],
    },
  },
};

const relationships_bargain: NarrativeTree = {
  scenarioId: "relationships-bargain",
  house: 7,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "Someone offers you a deal. It's good for you, and you suspect it's bad for them.",
      options: [
        { id: "better", text: "Take the better end.", aside: "+4 Distance · +2 affliction", outcomes: [D(4), A("healthiest", 2)] },
        { id: "both", text: "Strike a deal that's good for both.", visibleIf: rulerStrong, aside: "+3 Distance · heal 2 across all", outcomes: [D(3), A("allUnlocked", -2)] },
        { id: "fair", text: "Split it down the middle.", aside: "+2 Distance · heal 1 across all", outcomes: [D(2), A("allUnlocked", -1)] },
        { id: "refuse", text: "Refuse to deal.", aside: "Nothing struck.", outcomes: [] },
      ],
    },
  },
};

// ── House 8 · Transformation · pure bad place (ruler Mars, no joy) · zero-sum ──

const transformation_inheritance: NarrativeTree = {
  scenarioId: "transformation-inheritance",
  house: 8,
  rootId: "root",
  fragmentMood: "warning",
  nodes: {
    root: {
      id: "root",
      text: "A death you barely knew leaves you something. Taking it means stepping into their place.",
      options: [
        { id: "take", text: "Take the inheritance.", aside: "+5 Distance · +4 affliction", outcomes: [D(5), A("healthiest", 4)] },
        { id: "all", text: "Take everything they left.", next: "claim" },
        { id: "refuse", text: "Refuse it.", aside: "Nothing inherited.", outcomes: [] },
      ],
    },
    claim: {
      id: "claim",
      text: "There's more, but it's bound up with what they owed.",
      options: [
        { id: "clean", text: "Take the clean part.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "debts", text: "Take all of it, debts and all.", aside: "Luck (Mars): +8 Distance, or +6 affliction", outcomesOnSuccess: [D(8)], outcomesOnFail: [A("healthiest", 6)] },
      ],
    },
  },
};

const transformation_rite: NarrativeTree = {
  scenarioId: "transformation-rite",
  house: 8,
  rootId: "root",
  fragmentMood: "concealment",
  nodes: {
    root: {
      id: "root",
      text: "At a low altar, you're told a dark thing: what has gone out can be called back, for a price.",
      options: [
        { id: "rite", text: "Perform the rite.", visibleIf: anyCombusted, next: "rite" },
        { id: "offer", text: "Offer something of yourself to the dark.", aside: "+4 Distance · +4 affliction", outcomes: [D(4), A("healthiest", 4)] },
        { id: "leave", text: "Leave the dead where they are.", aside: "Nothing called.", outcomes: [] },
      ],
    },
    rite: {
      id: "rite",
      text: "The rite asks for a name to bring back. Choose with care.",
      options: [
        { id: "moon", text: "Call back the Moon.", visibleIf: (c) => c.perPlanetState.Moon.combusted, aside: "−7 Distance · uncombust the Moon", outcomes: [D(-7), UNC("Moon")] },
        { id: "mercury", text: "Call back Mercury.", visibleIf: (c) => c.perPlanetState.Mercury.combusted, aside: "−7 Distance · uncombust Mercury", outcomes: [D(-7), UNC("Mercury")] },
        { id: "venus", text: "Call back Venus.", visibleIf: (c) => c.perPlanetState.Venus.combusted, aside: "−7 Distance · uncombust Venus", outcomes: [D(-7), UNC("Venus")] },
        { id: "sun", text: "Call back the Sun.", visibleIf: (c) => c.perPlanetState.Sun.combusted, aside: "−7 Distance · uncombust the Sun", outcomes: [D(-7), UNC("Sun")] },
        { id: "mars", text: "Call back Mars.", visibleIf: (c) => c.perPlanetState.Mars.combusted, aside: "−7 Distance · uncombust Mars", outcomes: [D(-7), UNC("Mars")] },
        { id: "jupiter", text: "Call back Jupiter.", visibleIf: (c) => c.perPlanetState.Jupiter.combusted, aside: "−7 Distance · uncombust Jupiter", outcomes: [D(-7), UNC("Jupiter")] },
        { id: "saturn", text: "Call back Saturn.", visibleIf: (c) => c.perPlanetState.Saturn.combusted, aside: "−7 Distance · uncombust Saturn", outcomes: [D(-7), UNC("Saturn")] },
        { id: "abandon", text: "Abandon the rite.", aside: "Nothing called.", outcomes: [] },
      ],
    },
  },
};

// ── House 9 · Pilgrimage · benefic joy (ruler Jupiter, joy Sun) · wisdom ──

const pilgrimage_teacher: NarrativeTree = {
  scenarioId: "pilgrimage-teacher",
  house: 9,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "An old traveler shares your fire and, unasked, begins to teach.",
      options: [
        { id: "listen", text: "Sit and listen till morning.", aside: "+1 Distance · heal 2 where it's needed most", outcomes: [D(1), A("mostAfflicted", -2)] },
        { id: "study", text: "Study what the light shows you.", visibleIf: joyPresent, aside: "+2 Distance · heal 3 on the Sun", outcomes: [D(2), A("joy", -3)] },
        { id: "wont", text: "Listen, but the lesson won't take.", visibleIf: joyAfflicted, aside: "+1 Distance", outcomes: [D(1)] },
        { id: "move", text: "Move on at first light.", aside: "+1 Distance", outcomes: [D(1)] },
      ],
    },
  },
};

const pilgrimage_vow: NarrativeTree = {
  scenarioId: "pilgrimage-vow",
  house: 9,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "At a shrine on the far road, you can make a vow. Vows cost to keep, and cost to break.",
      options: [
        { id: "keep", text: "Make the vow, and mean to keep it.", aside: "+4 Distance · +2 affliction", outcomes: [D(4), A("healthiest", 2)] },
        { id: "maybe", text: "Make it, knowing you may break it.", next: "vow" },
        { id: "none", text: "Make no vow.", aside: "Nothing sworn.", outcomes: [] },
      ],
    },
    vow: {
      id: "vow",
      text: "The road ahead will test it. It always does.",
      options: [
        { id: "hold", text: "Hold to it.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "break", text: "Break it when it suits you.", aside: "Luck (Sun): +5 Distance, or +4 affliction on the Sun", outcomesOnSuccess: [D(5)], outcomesOnFail: [A("joy", 4)] },
      ],
    },
  },
};

// ── House 10 · Achievement · pure angular MC (ruler Saturn, no joy) · summit ──

const achievement_summit: NarrativeTree = {
  scenarioId: "achievement-summit",
  house: 10,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "A crowd you didn't gather waits to hear you speak from the high place.",
      options: [
        { id: "praise", text: "Speak, and take the praise.", aside: "+4 Distance · +2 affliction", outcomes: [D(4), A("healthiest", 2)] },
        { id: "plain", text: "Speak plainly, and briefly.", aside: "+2 Distance", outcomes: [D(2)] },
        { id: "quiet", text: "Step back into the quiet.", aside: "−1 Distance · heal 2 where it's needed most", outcomes: [D(-1), A("mostAfflicted", -2)] },
      ],
    },
  },
};

const achievement_monument: NarrativeTree = {
  scenarioId: "achievement-monument",
  house: 10,
  rootId: "root",
  fragmentMood: "stillness",
  nodes: {
    root: {
      id: "root",
      text: "You could build something here that outlasts you. The bigger it is, the more it asks.",
      options: [
        { id: "stone", text: "Lay a single, modest stone.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "raise", text: "Raise a monument.", next: "build" },
        { id: "none", text: "Build nothing.", aside: "Nothing raised.", outcomes: [] },
      ],
    },
    build: {
      id: "build",
      text: "What stands at noon throws the longest shadow.",
      options: [
        { id: "finish", text: "Finish it as planned.", aside: "+4 Distance", outcomes: [D(4)] },
        { id: "greater", text: "Make it greater still.", aside: "Luck (Saturn): +8 Distance, or +6 affliction", outcomesOnSuccess: [D(8)], outcomesOnFail: [A("healthiest", 6)] },
      ],
    },
  },
};

// ── House 11 · Friendship · benefic joy (ruler Saturn, joy Jupiter) · gift ──

const friendship_gift: NarrativeTree = {
  scenarioId: "friendship-gift",
  house: 11,
  rootId: "root",
  fragmentMood: "longing",
  nodes: {
    root: {
      id: "root",
      text: "A friend you haven't seen in years is waiting at the gate, holding something for you.",
      options: [
        { id: "take", text: "Take the gift, and the company.", visibleIf: joyPresent, aside: "+2 Distance · heal 3 on Jupiter", outcomes: [D(2), A("joy", -3)] },
        { id: "noone", text: "There is no one at the gate.", visibleIf: joyAfflicted, aside: "−1 Distance", outcomes: [D(-1)] },
        { id: "sit", text: "Sit and catch up first.", aside: "+1 Distance · heal 2 across all", outcomes: [D(1), A("allUnlocked", -2)] },
        { id: "hurry", text: "Take it and hurry on.", aside: "+2 Distance", outcomes: [D(2)] },
      ],
    },
  },
};

const friendship_favor: NarrativeTree = {
  scenarioId: "friendship-favor",
  house: 11,
  rootId: "root",
  fragmentMood: "declaration",
  nodes: {
    root: {
      id: "root",
      text: "An ally offers to call in favors on your behalf. It will work, but you will owe.",
      options: [
        { id: "all", text: "Ask for everything you need.", visibleIf: joyUnlocked, aside: "+4 Distance · +2 affliction on Jupiter", outcomes: [D(4), A("joy", 2)] },
        { id: "all_alt", text: "Ask for everything you need.", visibleIf: joyLocked, aside: "+4 Distance · +2 affliction", outcomes: [D(4), A("healthiest", 2)] },
        { id: "little", text: "Ask for just a little.", aside: "+2 Distance", outcomes: [D(2)] },
        { id: "none", text: "Owe no one.", aside: "Nothing asked.", outcomes: [] },
      ],
    },
  },
};

// ── House 12 · The Hidden · contained malefic (ruler Jupiter, joy Saturn) ──
// Saturn unlocks last, so joyLocked is the common case — the weight has no
// custodian and runs uncontained.

const hidden_weight: NarrativeTree = {
  scenarioId: "hidden-weight",
  house: 12,
  rootId: "root",
  fragmentMood: "concealment",
  nodes: {
    root: {
      id: "root",
      text: "Something has been following you for miles. You can't see it, but you can feel its weight.",
      options: [
        { id: "named", text: "Carry it, and name it plainly.", visibleIf: joyPresent, aside: "+2 Distance · +1 affliction on Saturn (scoped)", outcomes: [D(2), A("joy", 1)] },
        { id: "unnamed", text: "Carry it unnamed; it grows heavier.", visibleIf: (c) => joyAfflicted(c) || joyLocked(c), aside: "+1 Distance · +4 affliction · +2 elsewhere", outcomes: [D(1), A("healthiest", 4), A("mostAfflicted", 2)] },
        { id: "down", text: "Set down what you can.", aside: "−2 Distance · heal 2 where it's needed most", outcomes: [D(-2), A("mostAfflicted", -2)] },
      ],
    },
  },
};

const hidden_door: NarrativeTree = {
  scenarioId: "hidden-door",
  house: 12,
  rootId: "root",
  fragmentMood: "concealment",
  nodes: {
    root: {
      id: "root",
      text: "A door stands open to somewhere you're not supposed to go. No one would know.",
      options: [
        { id: "glance", text: "Take a glance, and a little with it.", aside: "+2 Distance · +2 affliction", outcomes: [D(2), A("healthiest", 2)] },
        { id: "through", text: "Step through quietly.", next: "exile" },
        { id: "back", text: "Turn back.", aside: "Nothing taken.", outcomes: [] },
      ],
    },
    exile: {
      id: "exile",
      text: "The unseen keeps its own accounting, and it is not in your favor.",
      options: [
        { id: "what", text: "Take what you came for.", aside: "+3 Distance", outcomes: [D(3)] },
        { id: "deeper", text: "Go deeper.", aside: "Luck (Saturn): +6 Distance, or +5 affliction", outcomesOnSuccess: [D(6)], outcomesOnFail: [A("healthiest", 5)] },
      ],
    },
  },
};

// ── Registry + selection ────────────────────────────────────────────────────

export const NARRATIVE_SCENARIOS: NarrativeTree[] = [
  self_stillWater, self_stake,
  livelihood_coin, livelihood_debt,
  communication_letter, communication_bridge,
  home_hearth, home_buried,
  creativity_dice, creativity_song,
  labor_field, labor_fever,
  relationships_stranger, relationships_bargain,
  transformation_inheritance, transformation_rite,
  pilgrimage_teacher, pilgrimage_vow,
  achievement_summit, achievement_monument,
  friendship_gift, friendship_favor,
  hidden_weight, hidden_door,
];

export const SCENARIOS_BY_HOUSE: Record<number, NarrativeTree[]> = NARRATIVE_SCENARIOS.reduce(
  (acc, s) => {
    (acc[s.house] ??= []).push(s);
    return acc;
  },
  {} as Record<number, NarrativeTree[]>,
);

const SCENARIOS_BY_ID: Record<string, NarrativeTree> = Object.fromEntries(
  NARRATIVE_SCENARIOS.map((s) => [s.scenarioId, s]),
);

/** Look up by scenarioId; falls back to a house's first scenario (old saves). */
export function getScenario(scenarioId: string, fallbackHouse?: number): NarrativeTree {
  const s = SCENARIOS_BY_ID[scenarioId];
  if (s) return s;
  if (fallbackHouse && SCENARIOS_BY_HOUSE[fallbackHouse]?.[0]) {
    return SCENARIOS_BY_HOUSE[fallbackHouse][0]!;
  }
  throw new Error(`No scenario ${scenarioId}`);
}

/**
 * Pick a scenario for a house, honoring the no-repeat rule (§8): prefer one
 * whose id is unseen this run; if the house is exhausted, recycle (the caller
 * handles cross-house exhaustion via house re-roll).
 */
export function pickScenario(
  house: number,
  seenScenarioIds: ReadonlyArray<string>,
  rng: () => number,
): NarrativeTree {
  const all = SCENARIOS_BY_HOUSE[house] ?? [];
  if (all.length === 0) throw new Error(`No scenarios for house ${house}`);
  const seen = new Set(seenScenarioIds);
  const fresh = all.filter((s) => !seen.has(s.scenarioId));
  const pool = fresh.length > 0 ? fresh : all;
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]!;
}

export function getTreeNode(tree: NarrativeTree, nodeId: string): TreeNode {
  const n = tree.nodes[nodeId];
  if (!n) throw new Error(`No node ${nodeId} in scenario ${tree.scenarioId}`);
  return n;
}

export function resolveAside(option: Option, ctx: NarrativeContext): string | undefined {
  if (option.aside === undefined) return undefined;
  return typeof option.aside === "string" ? option.aside : option.aside(ctx);
}

export function visibleOptions(node: TreeNode, ctx: NarrativeContext): Option[] {
  return node.options.filter((o) => (o.visibleIf ? o.visibleIf(ctx) : true));
}
