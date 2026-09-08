import {
  anyCombusted, joyPresent, joyStrong, rulerStrong,
  type NarrativeContext, type NarrativeScenario, type Option, type Outcome, type Target,
} from "@/game/narrative";

const L = (delta: number): Outcome => ({ kind: "light", delta });
const A = (target: Target, delta: number): Outcome => ({ kind: "affliction", target, delta });
const revive = (target: Target): Outcome => ({ kind: "uncombust", target });
const choice = (id: string, text: string, consequence: string, effects: Outcome[], extra: Partial<Pick<Option, "cost" | "visibleIf">> = {}): Option =>
  ({ id, text, result: { text: consequence, effects }, ...extra });

// A chart-conditioned offer occupies the same menu slot as its standard form.
const conditioned = (when: (ctx: NarrativeContext) => boolean, standard: Option, special: Option): Option[] => [
  { ...standard, visibleIf: (ctx) => !when(ctx) },
  { ...special, visibleIf: when },
];
const canShelter = (ctx: NarrativeContext) => rulerStrong(ctx) && anyCombusted(ctx);

// Original encounter copy informed by spec/concept/HOUSE_MATRIX.md and PLANET_MATRIX.md.
// Two scenes per house. Every option resolves immediately; the chart supplies
// the targets, and mechanical asides are derived from these effects.
export const NARRATIVE_SCENARIOS: NarrativeScenario[] = [
  {
    scenarioId: "self-still-water", house: 1, fragmentMood: "opening",
    text: "A portrait painter has given you the face she imagines a prince should have. She waits with her brush raised while you study the stranger on the canvas.",
    options: [
      ...conditioned(joyPresent,
        choice("rest", "Pay for a sitting as you are.", "She lets you lower your shoulders, and paints the face that looks back at her.", [A("chosen", -60)], { cost: 24 }),
        choice("name", "Tell her how you would introduce yourself.", "She scrapes away the borrowed expression, laughing at the name you give it.", [L(12), A("joy", -36)]),
      ),
      choice("push", "Hold the royal pose for her.", "Your neck stiffens as she finishes the likeness and counts out a model's fee.", [A("chosen", 36), L(24)]),
      choice("leave", "Let her finish from memory.", "The prince on the canvas keeps his chin raised as you leave.", []),
    ],
  },
  {
    scenarioId: "self-stake", house: 1, fragmentMood: "declaration",
    text: "A wrestling master asks you to take the stance you learned as a child. He puts a purse beside the mat and reaches for your shoulder to test it.",
    options: [
      ...conditioned(joyStrong,
        choice("strength", "Meet his weight in the old stance.", "He pays when you hold your ground, though your shoulder keeps the pressure of his hand.", [A("chosen", 48), L(36)]),
        choice("wit", "Let your stance change with his.", "You loosen your shoulders and turn his weight aside; he bows and opens the purse.", [L(24), A("chosen", -24)]),
      ),
      choice("try", "Ask him to try with his full weight.", "Your feet stay planted until he lets go, and he empties the purse into your trembling hands.", [A("chosen", 60), L(72)]),
      choice("quiet", "Step off the mat.", "He straightens the mat with his heel and waits for the next traveler.", []),
    ],
  },
  {
    scenarioId: "livelihood-coin", house: 2, fragmentMood: "warning",
    text: "A grain seller offers you the coins spilled beneath his scales. He will pay more if you can free his wagon from a mound of fallen sacks.",
    options: [
      choice("take", "Gather the loose coins.", "You count them twice before closing your purse.", [L(12)]),
      choice("pull", "Shift the sacks and free the wagon.", "The sacking rubs your wrists raw, but the seller pays enough for several days on the road.", [A("chosen", 60), L(72)]),
      choice("leave", "Leave the coins for the next traveler.", "The seller sets his scales upright and begins weighing grain again.", []),
    ],
  },
  {
    scenarioId: "livelihood-lender", house: 2, fragmentMood: "warning",
    text: "At the pawnbroker's, embroidered robes are being unpicked for their silver thread. He pays by weight, and the next buyer arrives at sunset.",
    options: [
      choice("lift", "Unpick a whole robe before sunset.", "Your fingers are swollen when he weighs the coil of silver and pays you.", [A("chosen", 60), L(48)]),
      choice("unload", "Work only the loose embroidery.", "A small coil tips the scale, and you flex your fingers while he counts out a few coins.", [A("chosen", 24), L(12)]),
      choice("leave", "Wait for less exacting work.", "The buyer leaves with the silver while you are still sitting outside.", [L(-12)]),
    ],
  },
  {
    scenarioId: "communication-letter", house: 3, fragmentMood: "longing",
    text: "At the inn, a letter from your sister waits beneath the room key. She has filled the margins with village news and crossed out the sentence that begins with your name.",
    options: [
      ...conditioned(joyPresent,
        choice("read", "Pay for the room and read by the window.", "You read the village news until the tightness under your ribs begins to ease.", [A("chosen", -48)], { cost: 24 }),
        choice("reply", "Answer in the margins.", "Your reply grows between her lines until the cramped page resembles one of your old arguments.", [L(12), A("chosen", -36)]),
      ),
      choice("carry", "Carry the inn's letters to the ferry.", "The ferryman takes the bundle and pays you while you rub the dust from your tired calves.", [A("chosen", 24), L(24)]),
      choice("leave", "Read only the greeting.", "For a moment the crowded inn sounds like the kitchen where she used to call you.", []),
    ],
  },
  {
    scenarioId: "communication-bridge", house: 3, fragmentMood: "paradox",
    text: "The footbridge has washed away on market morning. On the far bank, a woman lifts a basket above her head so her brother can see she has brought his bread.",
    options: [
      ...conditioned(joyPresent,
        choice("around", "Take his reply by the long path.", "She pays for the message while you sit on the basket's lid to rest your legs.", [A("chosen", 24), L(24)]),
        choice("listen", "Ask where they crossed as children.", "The old stepping stones are still there; brother and sister make room for you at breakfast.", [L(24), A("chosen", -24)]),
      ),
      choice("cross", "Help them lay a new footbridge.", "The first basket crosses the finished planks while they count your wages into a blistered palm.", [A("chosen", 48), L(60)]),
      choice("wait", "Leave them to call across the water.", "Their voices follow you along the bank, arguing about the price of flour.", []),
    ],
  },
  {
    scenarioId: "home-hearth", house: 4, fragmentMood: "stillness",
    text: "An elderly host turns down a bed kept ready since her son left. Around the hearth, chairs have been drawn close enough for every guest to reach the warmth.",
    options: [
      ...conditioned(canShelter,
        choice("bed", "Pay for the room left ready.", "You sleep with the shutters open, as the absent son once did.", [A("chosen", -72)], { cost: 24 }),
        choice("shelter", "Pay to shelter one who went dark.", "The room warms around the name you speak, and a familiar voice answers from within.", [revive("chosen")], { cost: 60 }),
      ),
      choice("hearth", "Pay for a place beside the others.", "Warmth reaches you from every side as the guests make room for your chair.", [A("allUnlocked", -24)], { cost: 24 }),
      choice("move", "Thank her at the threshold.", "You pull the gate shut behind you, lifting it so the old latch catches.", []),
    ],
  },
  {
    scenarioId: "home-buried", house: 4, fragmentMood: "concealment",
    text: "Your family's old house is being taken apart around the hearth. A purse is caught under the hearthstone, and your childhood blanket lies folded on the mantel.",
    options: [
      choice("take", "Lift the hearthstone and take the purse.", "You prise the purse free with scraped knuckles, then replace the stone where generations rested their feet.", [A("chosen", 48), L(48)]),
      choice("blanket", "Sit awhile under the old blanket.", "The wool still scratches your chin in the place where you used to tuck it.", [A("chosen", -36)]),
      choice("leave", "Leave the hearthstone undisturbed.", "You step over the worn threshold for the last time.", []),
    ],
  },
  {
    scenarioId: "creativity-dice", house: 5, fragmentMood: "longing",
    text: "At the festival, a child offers to paint your face with a borrowed brush. A queue of dancers waits beside the paint pots while supper is laid on long tables.",
    options: [
      ...conditioned(joyPresent,
        choice("work", "Paint faces until the dancing ends.", "The dancers leave coins beside your elbow, which aches by the time you paint the last face.", [A("chosen", 60), L(72)]),
        choice("play", "Let the child choose your face.", "She gives you enormous eyebrows, and you laugh hard enough to spoil one of them.", [A("chosen", -36), L(12)]),
      ),
      choice("meal", "Buy supper and watch the dancing.", "You loosen your boots beneath the table and eat while painted faces whirl past.", [A("chosen", -48)], { cost: 24 }),
      choice("watch", "Hand the brush back and watch.", "The child paints a mustache on her own face, checking your reaction after each stroke.", []),
    ],
  },
  {
    scenarioId: "creativity-song", house: 5, fragmentMood: "longing",
    text: "At a family feast, a child has made a song for her grandfather, but every verse follows a different tune. She holds out the fiddle as he settles into the front row.",
    options: [
      choice("finish", "Fit the verses to one tune.", "Your fingers ache by the final verse, and her grandfather asks to hear it once more.", [A("chosen", 48), L(48)]),
      ...conditioned(joyStrong,
        choice("rough", "Follow every change of tune.", "You scramble through the changes while the child sings louder to keep you with her.", [A("chosen", 24), L(24)]),
        choice("share", "Invite her grandfather to join in.", "He finds a refrain she likes, leaving you room to rest between the verses.", [A("chosen", -48), L(12)]),
      ),
      choice("sleep", "Listen from the table.", "She sings it unaccompanied, keeping time against her grandfather's knee.", []),
    ],
  },
  {
    scenarioId: "labor-field", house: 6, fragmentMood: "labor",
    text: "The last shearer has split his palm, and the flock is still waiting in the pen. The steward offers his wages to whoever finishes before the evening bell.",
    options: [
      ...conditioned(joyPresent,
        choice("alone", "Shear the rest of the flock yourself.", "Your hand has cramped around the shears by the time the steward brings your wages.", [A("chosen", 60), L(36)]),
        choice("contained", "Sharpen the shears before starting.", "The sharp blade clears the last fleece before the bell, leaving only your wrist sore.", [A("joy", 24), L(36)]),
      ),
      choice("together", "Bring the other hands back to finish together.", "You spend the day moving sheep and bundling wool, earning your pay with aches from shoulder to heel.", [A("allUnlocked", 24), L(36)]),
      choice("off", "Leave the day's work behind.", "The bell sounds while you are still close enough to smell the wool.", [L(-12)]),
    ],
  },
  {
    scenarioId: "labor-fever", house: 6, fragmentMood: "labor",
    text: "At the laundry, your hands begin to shake each time you lift a wet sheet. Beside the furnace, the keeper has set out a bowl of salve and a chair nobody is using.",
    options: [
      choice("push", "Finish the sheets before sitting down.", "The keeper puts your wages on the bench because your hands are still shaking too hard to hold them.", [A("chosen", 48), L(36)]),
      ...conditioned(joyPresent,
        choice("remedy", "Pay for the salve and a hot soak.", "You rest your hands in the basin until you can uncurl your fingers without wincing.", [A("chosen", -60)], { cost: 36 }),
        choice("contain", "Set the sheets down and take the chair.", "The keeper moves the basket out of reach, and your hands grow still in your lap.", [A("chosen", -36)]),
      ),
      choice("rest", "Give up the shift.", "You leave your apron on its peg while the next worker ties hers.", [L(-12)]),
    ],
  },
  {
    scenarioId: "relationships-stranger", house: 7, fragmentMood: "longing",
    text: "A traveler who argued with you at the last crossing has hired the only boat on this bank. They shift their bags to make a place and ask whether you can agree on a pace.",
    options: [
      choice("shift", "Accept the seat and let them row.", "Your shoulder rests against the gunwale while your old opponent rows you across.", [A("chosen", -36)]),
      choice("company", "Buy a meal to share on the crossing.", "You drift over the deepest water with the oars laid down and a bowl passing between you.", [A("allUnlocked", -12)], { cost: 12 }),
      choice("pass", "Wait for another boat.", "They push off and lift an oar in farewell once the current has taken them.", []),
    ],
  },
  {
    scenarioId: "relationships-bargain", house: 7, fragmentMood: "declaration",
    text: "At a crossroads, two porters dispute a contract: equal pay, though one carries twice the weight. They offer you a share of the work, or passage with your own bags carried for a fee.",
    options: [
      choice("carry", "Carry the disputed load to the next fork.", "They settle the bill while you ease the borrowed straps away from your shoulders.", [A("chosen", 48), L(48)]),
      ...conditioned(rulerStrong,
        choice("fair", "Pay the fee and walk beside them.", "You reach the next fork with your bags carried between them and the strain gone from one shoulder.", [A("chosen", -48)], { cost: 24 }),
        choice("help", "Rewrite the terms around a fair share.", "At the next fork they divide the fee without arguing, then lift the straps from your shoulders.", [A("chosen", -60), L(12)]),
      ),
      choice("refuse", "Decline the agreement.", "One porter folds the contract along a line already worn thin.", []),
    ],
  },
  {
    scenarioId: "transformation-inheritance", house: 8, fragmentMood: "warning",
    text: "The woman who once sheltered you has left you her strongbox. Her executor offers to force its rusted lock for a share.",
    options: [
      choice("take", "Force the lock yourself.", "The chisel bruises your palm before the lock yields, revealing coins wrapped in her handkerchief.", [A("chosen", 60), L(60)]),
      choice("share", "Give the executor a share for opening it.", "He sets aside his portion and hands you the rest in her carefully folded handkerchief.", [L(24)]),
      choice("refuse", "Leave the bequest with the executor.", "He covers her signature with blotting paper and closes the ledger.", []),
    ],
  },
  {
    scenarioId: "transformation-rite", house: 8, fragmentMood: "concealment",
    text: "At the mortuary, each lamp bears a name spoken by someone still living. Beside an unlit wick, the keeper has laid out the bowl used in the rite of return.",
    options: [
      ...conditioned(anyCombusted,
        choice("offer", "Keep the lamps alight until morning.", "The keeper pays for the vigil as you straighten your aching back beside the last lamp.", [A("chosen", 48), L(36)]),
        choice("rite", "Pay for the rite and speak the lost name.", "The dry wick catches, and the presence you called answers before you can speak again.", [revive("chosen")], { cost: 84 }),
      ),
      choice("rest", "Pay for a bed beside the lamps.", "You sleep beneath the recited names, and wake with your hands unclenched.", [A("chosen", -48)], { cost: 24 }),
      choice("leave", "Let the wick remain unlit.", "The keeper draws the curtains, leaving the names visible in lamplight.", []),
    ],
  },
  {
    scenarioId: "pilgrimage-teacher", house: 9, fragmentMood: "declaration",
    text: "In a distant school, your homeland appears at the margin of the map. The teacher asks you to explain the roads you know while a student moves the lamp to see them.",
    options: [
      ...conditioned(joyPresent,
        choice("listen", "Ask why your homeland is at the edge.", "The teacher turns the map so your country is nearest you, then turns it back for the student.", [A("chosen", -36)]),
        choice("study", "Read the roads from the student's side.", "You find the river that reaches both your homes, and the student slides the lamp between you.", [L(24), A("chosen", -48)]),
      ),
      choice("demonstrate", "Draw the route that brought you here.", "Your wrist aches by the time you reach this city; the student pins your drawing beside the map.", [A("chosen", 36), L(36)]),
      choice("move", "Leave them to their lesson.", "At the door you hear your homeland's name pronounced with an unfamiliar accent.", []),
    ],
  },
  {
    scenarioId: "pilgrimage-vigil", house: 9, fragmentMood: "declaration",
    text: "At a mountain shrine, the dawn watch faces west. The keeper pays those who stay awake through the night and rents rooms beneath the steps.",
    options: [
      ...conditioned(joyStrong,
        choice("vigil", "Keep the watch until the bell.", "Cold has stiffened your knees when sunlight touches the western peaks and the keeper brings your pay.", [A("chosen", 48), L(48)]),
        choice("light", "Show the others where dawn will appear.", "You settle the pilgrims facing the snowfields and share their blankets as the reflected light reaches you.", [L(24), A("allUnlocked", -12)]),
      ),
      choice("room", "Pay for a room beneath the steps.", "The pilgrims' footsteps cross the ceiling while you sleep, softer each time you stir.", [A("chosen", -60)], { cost: 24 }),
      choice("none", "Take the path down before the vigil.", "You hear the call to prayer halfway down the mountain.", []),
    ],
  },
  {
    scenarioId: "achievement-summit", house: 10, fragmentMood: "declaration",
    text: "The council has set a chair for you above the people who repaired the road. Beside it lies the survey you must explain before they announce your reward.",
    options: [
      choice("praise", "Defend every measure before the council.", "By the time they approve the survey, your voice is hoarse and the room knows who answered for it.", [A("chosen", 48), L(60)]),
      ...conditioned(rulerStrong,
        choice("plain", "Give the distances and name the workers.", "The clerk enters the figures and names in the public record, then pays your fee.", [L(12)]),
        choice("authority", "Set out what the road can safely carry.", "Your figures settle the room; the council approves your fee and releases you from the questioning.", [L(36), A("chosen", -24)]),
      ),
      choice("quiet", "Pay for a room and send your written report.", "You fall asleep with ink on your fingers while the clerk reads your report upstairs.", [A("chosen", -48)], { cost: 24 }),
    ],
  },
  {
    scenarioId: "achievement-monument", house: 10, fragmentMood: "stillness",
    text: "At a new bridge, the mason offers a place on the dedication stone to anyone who finishes the paving. A larger inscription is reserved for whoever completes the arch above the approach.",
    options: [
      choice("stone", "Set the last paving stone and sign the roll.", "The mason reads your name aloud as the first cart crosses.", [L(12)]),
      choice("greater", "Finish the arch and sign above it.", "Your legs shake on the ladder while the mason cuts your name into the arch above the road.", [A("chosen", 72), L(96)]),
      choice("none", "Pass beneath the scaffolding.", "Through the unfinished arch, the far bank is already visible.", []),
    ],
  },
  {
    scenarioId: "friendship-gift", house: 11, fragmentMood: "longing",
    text: "Your friends have collected money for the road and laid supper on a borrowed table. One has brought the dish you always asked for and says it will not travel well.",
    options: [
      choice("coins", "Accept the money for the road.", "Several hands have knotted the purse shut, and your friends argue cheerfully about whose knot will hold.", [L(24)]),
      ...conditioned(joyPresent,
        choice("meal", "Stay and pass the dishes around.", "Your friends serve the last helping into your bowl and carry on talking while you lean back.", [A("allUnlocked", -24)]),
        choice("care", "Let them see where the journey has hurt.", "One friend kneels to loosen your boots while another tucks a few coins beneath your plate.", [A("chosen", -72), L(12)]),
      ),
      choice("leave", "Thank them and take the road.", "A friend follows you to the corner, still finishing a story.", []),
    ],
  },
  {
    scenarioId: "friendship-favor", house: 11, fragmentMood: "declaration",
    text: "Travelers have pooled their money for a courtyard where anyone on the road can eat. They are hanging the first cooking pot when they recognize you at the gate.",
    options: [
      ...conditioned(joyStrong,
        choice("help", "Hoist the pot over the fire.", "They pay you from the common purse while you ease the strain out of your back.", [A("chosen", 36), L(36)]),
        choice("share", "Call everyone over to raise it together.", "Many hands steady the pot, leaving you a place by the fire and a share of the purse.", [L(24), A("allUnlocked", -24)]),
      ),
      choice("sit", "Sit with the friend who waves you over.", "Your friend turns a crate on its side for your aching feet and makes room on the bench.", [A("chosen", -36)]),
      choice("leave", "Wish them luck with the first supper.", "You close the gate behind you so the wind will let their fire catch.", []),
    ],
  },
  {
    scenarioId: "hidden-weight", house: 12, fragmentMood: "concealment",
    text: "Outside the city wall, an exile offers you a fee to read a letter he is forbidden to answer. His lips form the news about his daughter's wedding before you reach it.",
    options: [
      ...conditioned(joyPresent,
        choice("one", "Lend one voice for as long as he asks.", "He pays when he can finally fold the letter, but his repeated farewell has worn the voice you lent him thin.", [A("chosen", 72), L(24)]),
        choice("named", "Agree to read it once, then fold it.", "You read as far as the signature, then sit quietly until he folds the letter and pays.", [A("joy", 24), L(24)]),
      ),
      choice("spread", "Let each of your voices read a passage.", "He pays after the signature, and every voice falls quiet with a different sentence still in it.", [A("allUnlocked", 24), L(24)]),
      choice("wait", "Stay beside him without reading.", "The guards change above you while his finger moves down the page.", [L(-12)]),
    ],
  },
  {
    scenarioId: "hidden-door", house: 12, fragmentMood: "concealment",
    text: "A former prisoner has returned to find his cell sealed, with the name he carved just visible through a gap in the masonry. He offers you payment for a rubbing of the letters, or for the stone itself.",
    options: [
      ...conditioned(joyPresent,
        choice("glance", "Reach in and take a rubbing.", "You draw your scraped arm back through the gap, and he smooths the paper against his coat.", [A("chosen", 36), L(24)]),
        choice("measure", "Measure the gap before reaching in.", "The narrow rubbing comes free with only a scrape, and he traces the letters with one finger.", [A("joy", 12), L(24)]),
      ),
      choice("through", "Climb inside and free the stone.", "He takes the stone from your aching hands and turns the carved face toward the light.", [A("chosen", 60), L(72)]),
      choice("back", "Leave the inscription where it is.", "He sits beside the wall and looks again through the gap.", []),
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
