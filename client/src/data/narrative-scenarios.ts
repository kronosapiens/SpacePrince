import {
  anyCombusted, joyPresent, joyStrong, rulerStrong,
  type NarrativeContext, type NarrativeScenario, type Option, type Outcome, type Target,
} from "@/game/narrative";

const L = (delta: number): Outcome => ({ kind: "light", delta });
const A = (target: Target, delta: number): Outcome => ({ kind: "affliction", target, delta });
const transfer = (amount: number): Outcome => ({ kind: "transfer", amount });
const revive = (target: Target): Outcome => ({ kind: "uncombust", target });
const sacrifice = (target: Target): Outcome => ({ kind: "combust", target });
const choice = (id: string, text: string, consequence: string, effects: Outcome[], extra: Partial<Pick<Option, "cost" | "visibleIf">> = {}): Option =>
  ({ id, text, result: { text: consequence, effects }, ...extra });
const wager = (id: string, text: string, win: string, reward: Outcome[], loss: string, risk: Outcome[], cost = 0): Option =>
  ({ id, text, cost, result: { text: win, effects: reward }, failure: { text: loss, effects: risk } });

// A chart-conditioned offer occupies the same menu slot as its standard form.
const conditioned = (when: (ctx: NarrativeContext) => boolean, standard: Option, special: Option): Option[] => [
  { ...standard, visibleIf: (ctx) => !when(ctx) },
  { ...special, visibleIf: when },
];
const canShelter = (ctx: NarrativeContext) => rulerStrong(ctx) && anyCombusted(ctx);

// Two scenes per house. Every option resolves immediately; the chart supplies
// the targets, and mechanical asides are derived from these effects.
export const NARRATIVE_SCENARIOS: NarrativeScenario[] = [
  {
    scenarioId: "self-still-water", house: 1, fragmentMood: "opening",
    text: "Still water at the side of the road. The face looking back is yours, a little more worn than you remember.",
    options: [
      ...conditioned(joyPresent,
        choice("rest", "Attend to what hurts.", "The water settles, and your reflection settles with it.", [A("chosen", -60)], { cost: 24 }),
        choice("name", "Say your own name like you mean it.", "For once, the name and the face belong together.", [L(12), A("joy", -36)]),
      ),
      choice("push", "Leave the reflection behind.", "The road takes your weight; the water keeps your face.", [A("chosen", 36), L(24)]),
      choice("leave", "Watch until the ripples pass.", "The face is still yours when the water clears.", []),
    ],
  },
  {
    scenarioId: "self-stake", house: 1, fragmentMood: "declaration",
    text: "At a crossroads, travelers test how long they can hold a stone at arm's length. A purse lies beside the stone.",
    options: [
      ...conditioned(joyStrong,
        choice("strength", "Hold it until the counting ends.", "Your arm trembles long after the purse is yours.", [A("chosen", 48), L(36)]),
        choice("wit", "Show them a better grip.", "The weight has not changed, but everyone holds it differently.", [L(24), A("chosen", -24)]),
      ),
      wager("try", "Try for the longest count.", "They lose count before you lower the stone.", [L(72)], "The stone falls before the last voice stops.", [A("chosen", 60)]),
      choice("quiet", "Let someone else lift it.", "You leave before the next count begins.", []),
    ],
  },
  {
    scenarioId: "livelihood-coin", house: 2, fragmentMood: "warning",
    text: "At the foot of a dead tree, a coin catches the light. Roots grip something larger underneath.",
    options: [
      choice("take", "Take the loose coin.", "One coin comes away cleanly; the roots keep the rest.", [L(12)]),
      wager("pull", "Pull once, with everything you have.", "The root breaks, spilling the buried coins.", [L(72)], "The root holds, and something in you gives.", [A("chosen", 60)]),
      choice("leave", "Leave it in the ground.", "You brush the soil back over the coin.", []),
    ],
  },
  {
    scenarioId: "livelihood-lender", house: 2, fragmentMood: "warning",
    text: "A lender's cart is stuck in a rut. They offer payment for lifting it, and count the coins where you can see them.",
    options: [
      choice("lift", "Lift the loaded cart.", "The cart rolls free, and the lender counts out every coin.", [A("chosen", 60), L(48)]),
      choice("unload", "Unload it before lifting.", "It takes longer, but you leave with steadier hands.", [A("chosen", 24), L(12)]),
      choice("leave", "Buy a meal and keep walking.", "The meal is small, but it gets you down the road.", [L(-12)]),
    ],
  },
  {
    scenarioId: "communication-letter", house: 3, fragmentMood: "longing",
    text: "A letter waits at the inn. You recognize the name on the envelope, but not the handwriting.",
    options: [
      ...conditioned(joyPresent,
        choice("read", "Take a room and read it slowly.", "By the last page, something you have carried loosens.", [A("chosen", -48)], { cost: 24 }),
        choice("reply", "Write back before you sleep.", "The reply comes easily, as though the conversation never stopped.", [L(12), A("chosen", -36)]),
      ),
      choice("carry", "Pay for postage with an errand.", "Your feet ache, but two letters leave in the morning.", [A("chosen", 24), L(24)]),
      choice("leave", "Fold it away for another day.", "The envelope fits inside your coat.", []),
    ],
  },
  {
    scenarioId: "communication-bridge", house: 3, fragmentMood: "paradox",
    text: "A traveler says the bridge ahead has washed out. Across the water, another traveler beckons.",
    options: [
      ...conditioned(joyPresent,
        choice("around", "Take the long way around.", "You reach the far bank with wet boots and tired legs.", [A("chosen", 24), L(24)]),
        choice("listen", "Listen for the shallow crossing.", "Beneath the shouting, you hear water running over stones.", [L(24), A("chosen", -24)]),
      ),
      wager("cross", "Try the remaining planks.", "The last plank holds until you step onto the bank.", [L(60)], "A plank turns, and the current throws you against a pier.", [A("chosen", 48)]),
      choice("wait", "Wait by the bank.", "The travelers tire of beckoning before you tire of waiting.", []),
    ],
  },
  {
    scenarioId: "home-hearth", house: 4, fragmentMood: "stillness",
    text: "A house with a lit window and an unlocked door. There is one bed, and room for everyone around the hearth.",
    options: [
      ...conditioned(canShelter,
        choice("bed", "Give the bed to the one who needs it.", "Behind the closed door, one sleeper finally rests.", [A("chosen", -72)], { cost: 24 }),
        choice("shelter", "Ask the house to shelter what went dark.", "A cold room warms, and someone stirs inside it.", [revive("chosen")], { cost: 60 }),
      ),
      choice("hearth", "Gather everyone around the fire.", "No one sleeps deeply, but everyone leaves warmer.", [A("allUnlocked", -24)], { cost: 24 }),
      choice("move", "Keep to the road.", "The window stays lit behind you.", []),
    ],
  },
  {
    scenarioId: "home-buried", house: 4, fragmentMood: "concealment",
    text: "Your family left a box beneath the floorboards. Beside it lies a blanket you remember.",
    options: [
      choice("take", "Pry the box out.", "The box comes free with a splinter of the old floor.", [A("chosen", 48), L(48)]),
      choice("blanket", "Wrap the blanket around someone tired.", "It smells of a room you thought you had forgotten.", [A("chosen", -36)]),
      choice("leave", "Put the boards back.", "The house keeps what was left to it.", []),
    ],
  },
  {
    scenarioId: "creativity-dice", house: 5, fragmentMood: "longing",
    text: "Travelers throw dice in the dust. They offer you a seat and name the stake for a single throw.",
    options: [
      ...conditioned(joyPresent,
        wager("dare", "Stake an evening's work instead.", "They carry your winnings while you finish laughing.", [L(72)], "You spend the evening clearing everyone else's table.", [A("chosen", 60)]),
        choice("play", "Play without keeping score.", "For a little while, every throw is funny.", [A("chosen", -36), L(12)]),
      ),
      wager("bet", "Put your coins beside the dice.", "The dice stop together, and the pot is pushed toward you.", [L(84)], "The dice stop apart; your coins stay on the cloth.", [], 24),
      choice("watch", "Only watch.", "You learn the shape of the game without joining it.", []),
    ],
  },
  {
    scenarioId: "creativity-song", house: 5, fragmentMood: "longing",
    text: "A tune keeps circling in your head. Finishing it will take the evening; leaving it unfinished might let you sleep.",
    options: [
      choice("finish", "Stay up and finish it.", "At dawn, the last phrase finally finds its place.", [A("chosen", 48), L(48)]),
      ...conditioned(joyStrong,
        choice("rough", "Make something rough but done.", "The tune has an awkward ending, and an ending is enough.", [A("chosen", 24), L(24)]),
        choice("share", "Let someone else find the ending.", "A second voice takes the phrase somewhere you could not.", [A("chosen", -48), L(12)]),
      ),
      choice("sleep", "Let it go unfinished.", "The tune fades before you do.", []),
    ],
  },
  {
    scenarioId: "labor-field", house: 6, fragmentMood: "labor",
    text: "A field must be cleared by dusk. The overseer pays for finished rows and has left too few tools.",
    options: [
      ...conditioned(joyPresent,
        choice("alone", "Set one pair of hands to work.", "One worker carries the whole day's ache.", [A("chosen", 60), L(36)]),
        choice("contained", "Give Mars the sharpest tool.", "The work ends at the edge of the row, where it belongs.", [A("joy", 24), L(36)]),
      ),
      choice("together", "Work the rows together.", "The field is clear; everyone carries a little of it away.", [A("allUnlocked", 24), L(36)]),
      choice("off", "Walk off the job.", "The uncut rows disappear behind you.", [L(-12)]),
    ],
  },
  {
    scenarioId: "labor-fever", house: 6, fragmentMood: "labor",
    text: "A fever hangs over the camp. There is work to do, a remedy for sale, and no promise that rest will be enough.",
    options: [
      choice("push", "Work through the fever.", "The work is done, though the shaking has not stopped.", [A("chosen", 48), L(36)]),
      ...conditioned(joyPresent,
        choice("remedy", "Buy the remedy for one patient.", "One cup empties, and one breathing rhythm eases.", [A("chosen", -60)], { cost: 36 }),
        choice("contain", "Contain the burden in one place.", "The fever gathers in one place, leaving the rest of the camp quiet.", [transfer(36)]),
      ),
      choice("rest", "Lose the day's wages and rest.", "The day passes without asking anything more of you.", [L(-12)]),
    ],
  },
  {
    scenarioId: "relationships-stranger", house: 7, fragmentMood: "longing",
    text: "A stranger falls into step beside you. They notice how unevenly you carry your bags.",
    options: [
      choice("shift", "Move a burden to another shoulder.", "The pace changes when the weight changes hands.", [transfer(36)]),
      choice("company", "Share food and a little of the road.", "You part at the fork with less to carry.", [A("allUnlocked", -12)], { cost: 12 }),
      choice("pass", "Keep your own pace.", "Your steps fall out of time, then out of earshot.", []),
    ],
  },
  {
    scenarioId: "relationships-bargain", house: 7, fragmentMood: "declaration",
    text: "Two porters offer a bargain: coin for carrying their load, or help redistributing yours.",
    options: [
      choice("carry", "Take their load for the next mile.", "They count the coins while you ease the straps off.", [A("chosen", 48), L(48)]),
      ...conditioned(rulerStrong,
        choice("fair", "Pay them to carry one of your bags.", "One shoulder lifts as the bag changes hands.", [A("chosen", -48)], { cost: 24 }),
        choice("exchange", "Arrange an exchange everyone can bear.", "The heaviest bag finds the shoulder that can carry it.", [transfer(60), L(12)]),
      ),
      choice("refuse", "Carry on as you are.", "The porters turn back to their argument.", []),
    ],
  },
  {
    scenarioId: "transformation-inheritance", house: 8, fragmentMood: "warning",
    text: "Someone you barely knew has left you a sealed chest. The keeper warns you that opening it takes more than a key.",
    options: [
      choice("take", "Break the seal.", "The chest opens, leaving its mark on the hand that opened it.", [A("chosen", 60), L(60)]),
      choice("surrender", "Give the keeper one of your lights.", "One light goes out; the keeper leaves the whole chest at your feet.", [sacrifice("chosen"), L(96)]),
      choice("refuse", "Leave the chest closed.", "The keeper writes another name beside yours.", []),
    ],
  },
  {
    scenarioId: "transformation-rite", house: 8, fragmentMood: "concealment",
    text: "At a low altar, a keeper offers to call back what has gone dark. The price is coin, or another living flame.",
    options: [
      choice("rite", "Pay for the name you want returned.", "A voice answers from the place where you stopped listening.", [revive("chosen")], { cost: 84, visibleIf: anyCombusted }),
      choice("exchange", "Offer one flame for another.", "As one flame lowers, another catches.", [sacrifice("chosen"), revive("recipient")], { visibleIf: anyCombusted }),
      choice("offer", "Offer a little of your strength.", "The keeper gathers what you leave on the stone.", [A("chosen", 48), L(36)], { visibleIf: (ctx) => !anyCombusted(ctx) }),
      choice("leave", "Leave the altar untouched.", "The keeper does not call after you.", []),
    ],
  },
  {
    scenarioId: "pilgrimage-teacher", house: 9, fragmentMood: "declaration",
    text: "An old traveler shares your fire and begins to teach. There is time for one lesson before the road calls again.",
    options: [
      ...conditioned(joyPresent,
        choice("listen", "Ask about the thing you cannot set down.", "The answer is smaller than you expected, and easier to carry.", [A("chosen", -36)]),
        choice("study", "Study what the fire shows you.", "In the shifting light, a familiar pattern becomes clear.", [L(24), A("chosen", -48)]),
      ),
      choice("demonstrate", "Learn by doing it yourself.", "Your hands remember what the explanation could not hold.", [A("chosen", 36), L(36)]),
      choice("move", "Thank the traveler and leave.", "The lesson continues for whoever sits down next.", []),
    ],
  },
  {
    scenarioId: "pilgrimage-vigil", house: 9, fragmentMood: "declaration",
    text: "At a wayside shrine, candles must be tended until dawn. The keeper offers food for the vigil and a quiet room for those who cannot stay awake.",
    options: [
      ...conditioned(joyStrong,
        choice("vigil", "Keep the candles burning until dawn.", "You hand over the last candle as the sun reaches the doorway.", [A("chosen", 48), L(48)]),
        choice("light", "Tend them by the light you already carry.", "You notice every guttering wick before it goes dark.", [L(24), A("allUnlocked", -12)]),
      ),
      choice("room", "Pay for the quiet room.", "You wake to a room already full of morning.", [A("chosen", -60)], { cost: 24 }),
      choice("none", "Continue through the night.", "The candles shrink to a line of light behind you.", []),
    ],
  },
  {
    scenarioId: "achievement-summit", house: 10, fragmentMood: "declaration",
    text: "A crowd waits to hear you speak from the high place. You can give them a few words, or everything you have.",
    options: [
      choice("praise", "Speak until every face turns toward you.", "The crowd remembers your words; your throat remembers the crowd.", [A("chosen", 48), L(60)]),
      ...conditioned(rulerStrong,
        choice("plain", "Speak plainly, and briefly.", "A few people nod, and that is enough.", [L(12)]),
        choice("authority", "Give them the few words that matter.", "The silence after your last word belongs to you.", [L(36), A("chosen", -24)]),
      ),
      choice("quiet", "Leave the platform and find a quiet room.", "Above you, another voice takes up the space.", [A("chosen", -48)], { cost: 24 }),
    ],
  },
  {
    scenarioId: "achievement-monument", house: 10, fragmentMood: "stillness",
    text: "A foundation waits on the hill. One stone would mark your passage; a monument would ask much more.",
    options: [
      choice("stone", "Lay a single stone.", "It is small enough that someone else can build beside it.", [L(12)]),
      wager("greater", "Set the highest stone in place.", "The last stone holds, visible from the road below.", [L(96)], "The stone tips, dragging the scaffold with it.", [A("chosen", 72)]),
      choice("none", "Leave the hill as it is.", "The empty foundation catches the afternoon shade.", []),
    ],
  },
  {
    scenarioId: "friendship-gift", house: 11, fragmentMood: "longing",
    text: "An old friend waits at the gate with a parcel. Inside are coins and enough food to share.",
    options: [
      choice("coins", "Take the coins for the road.", "Your friend closes your hand around them before you can refuse.", [L(24)]),
      ...conditioned(joyPresent,
        choice("meal", "Share the food with everyone.", "The parcel is empty before the stories are finished.", [A("allUnlocked", -24)]),
        choice("care", "Ask for help where it hurts most.", "Your friend notices what you could not bring yourself to ask.", [A("chosen", -72), L(12)]),
      ),
      choice("leave", "Stay only long enough to say thank you.", "Your friend watches until you turn the corner.", []),
    ],
  },
  {
    scenarioId: "friendship-favor", house: 11, fragmentMood: "declaration",
    text: "A friend is packing up a stall. They can pay for help moving it, or stay a little longer to help you.",
    options: [
      ...conditioned(joyStrong,
        choice("help", "Carry the heaviest crate.", "Your friend presses the payment into your aching palm.", [A("chosen", 36), L(36)]),
        choice("share", "Find a way to carry it together.", "The work divides cleanly, and you finish with time to spare.", [L(24), A("allUnlocked", -24)]),
      ),
      choice("sit", "Ask them to sit with someone tired.", "For once, the conversation requires no effort.", [A("chosen", -36)]),
      choice("leave", "Wish them well and go.", "They wave from behind the last stack of crates.", []),
    ],
  },
  {
    scenarioId: "hidden-weight", house: 12, fragmentMood: "concealment",
    text: "Something unseen has followed you for miles. At an empty tollhouse, it finally names a price for passing.",
    options: [
      ...conditioned(joyPresent,
        choice("one", "Let one shoulder take the weight.", "The pressure lifts everywhere except the place you chose.", [A("chosen", 72), L(24)]),
        choice("named", "Let Saturn name and carry it.", "The weight acquires an edge, and stays within it.", [A("joy", 24), L(24)]),
      ),
      choice("spread", "Let it settle across the whole company.", "No one is crushed, but no one walks freely.", [A("allUnlocked", 24), L(24)]),
      choice("wait", "Wait until the weight passes.", "Whatever followed you loses patience first.", [L(-12)]),
    ],
  },
  {
    scenarioId: "hidden-door", house: 12, fragmentMood: "concealment",
    text: "A door stands open to a room full of covered objects. A narrow gap offers a way in without touching the door.",
    options: [
      ...conditioned(joyPresent,
        choice("glance", "Reach for what lies closest.", "You pull your hand back with a prize and a dark bruise.", [A("chosen", 36), L(24)]),
        choice("measure", "Let Saturn measure the opening.", "You take only what passes cleanly through the gap.", [A("joy", 12), L(24)]),
      ),
      wager("through", "Slip through the gap.", "You leave with something the room has not yet missed.", [L(72)], "The gap closes around you before you can turn.", [A("chosen", 60)]),
      choice("back", "Turn back.", "The door remains open after you have gone.", []),
    ],
  },
];

export const SCENARIOS_BY_HOUSE: Record<number, NarrativeScenario[]> = {};
for (const scenario of NARRATIVE_SCENARIOS) (SCENARIOS_BY_HOUSE[scenario.house] ??= []).push(scenario);
const SCENARIOS_BY_ID = new Map(NARRATIVE_SCENARIOS.map((s) => [s.scenarioId, s]));

export function getScenario(scenarioId: string): NarrativeScenario {
  const scenario = SCENARIOS_BY_ID.get(scenarioId);
  if (!scenario) throw new Error(`No scenario ${scenarioId}`);
  return scenario;
}

export function pickScenario(house: number, seenScenarioIds: readonly string[], rng: () => number): NarrativeScenario {
  const all = SCENARIOS_BY_HOUSE[house] ?? [];
  if (!all.length) throw new Error(`No scenarios for house ${house}`);
  const fresh = all.filter((s) => !seenScenarioIds.includes(s.scenarioId));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(rng() * pool.length)] ?? pool[0]!;
}
