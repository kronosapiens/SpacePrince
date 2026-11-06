# Slay the Spire — event inventory

Every event in Slay the Spire, with its options, exact costs and rewards, odds, and gating.
Compiled 2026-09-17 as research for Space Prince's narrative encounters; the cross-game analysis is in [SURVEY.md](SURVEY.md) and the FTL inventory in [FTL.md](FTL.md).
Source: the Slay the Spire fandom wiki, one page per event plus the pages for Events, Unknown Location, Ascension, and Neow, read through the wiki's MediaWiki API because direct fetches were refused.
Setups are paraphrased; anything in quotation marks is the game's own text.
Ascension 15 changes are given in parentheses where the wiki records them.

## Coverage

- 52 events: 14 shared across Acts 1–3, 2 shared by two acts, 12 in Act 1 including Neow's opening choice, 16 in Act 2, 8 in Act 3.
- Act 4 has no events; it is a fixed corridor of rest site, merchant, elite, and boss.
- The wiki does not publish map-generation weights, so the share of "?" nodes per act is described qualitatively in the structural notes.
- The wiki states the once-per-run draw rule only for the shrine subclass; in practice each act draws without replacement.
- Odds the wiki does not publish are marked "odds hidden": the Wheel of Change's wedge weights, Dead Adventurer's loot order, and the rarity split of random relics.

## Tag vocabulary

Each event carries tags from a fixed list shared with the FTL inventory, so the two corpora can be compared.

- `no-choice`: one option only.
- `trade`: pay a known cost for a known gain.
- `gamble`: the outcome is random; `(odds-shown)` when the game prints the odds, `(odds-hidden)` when it does not.
- `gated`: an option appears only with a prerequisite (relic, gold, card, character).
- `fight`: combat is forced; `optional-fight` when it can be avoided.
- `chain`: a multi-screen event, or one that sets up another.
- `push-your-luck`: a repeatable draw with escalating risk.
- `sacrifice`: give up a persistent asset for a gain.
- `gift`: free gain with no cost.
- `tax`: forced loss with no gain.
- `walk-away`: an option to leave with no effect exists.
- `delayed`: a consequence lands later.
- `moral`: the choice is framed as ethical with asymmetric payoff.

## Shared pool — Common (all of Acts 1, 2, 3)

### A Note For Yourself
- Where: Acts 1–3.
  Appearance conditions are unusual: **cannot appear at Ascension 15 or higher at all**; at Ascension 14 or lower the player must already have beaten that Ascension level on the chosen character; outside Ascension Mode it can appear regardless of whether the player has ever won.
- Setup: A loose brick in a pillar hides a folded note and a card.
  The note reads "The Heart awaits."
  It is in your own handwriting.
- Choices:
  1. `[Take and Give]` → Receive the card you stored on a previous run, and store a card from your current deck in its place.
     The very first time a save file sees this event, the stored card is Iron Wave.
  2. `[Ignore]` → Nothing happens.
- Resources: card (add / remove — a swap), "later event" (the stored card persists across runs, which is the closest thing in the game to a true cross-run flag)
- Tags: `trade`, `walk-away`, `delayed`, `gated`
- Notes worth keeping: stored cards persist across runs *and across characters*, so it is the only way to put an Ironclad card in a Defect deck.
  Upgrades persist.
  Ritual Dagger / Genetic Algorithm reset to base values; Searing Blow keeps its upgrade count.
  Bottled cards cannot be stored (storing removes the card).
  Curses from this event bypass Omamori.

### Bonfire Spirits
- Where: Acts 1–3.
  No prerequisite.
- Setup: Purple fire spirits dance around a bonfire, tossing bones and fragments in.
  They turn to you expectantly.
- Choices:
  1. `[Offer]` → Choose any card in your deck; it is removed, and the reward scales with the offered card's rarity:
     - Curse → gain relic Spirit Poop (a joke relic; −1 to final score)
     - Basic card (Strike/Defend/Bash/Neutralize/Zap/Eruption/Dualcast/Survivor/Vigilance) → nothing
     - Common **or** Special card (Pride, J.A.X., etc.) → heal 5 HP
     - Uncommon card → heal to full HP
     - Rare card → heal to full HP **and** +10 max HP
- Resources: HP, max HP, card (remove), relic (gain)
- Tags: `no-choice` (single option), `sacrifice`, `trade`
- Note: Pride counts as Special, not Curse, so it heals 5 instead of giving Spirit Poop.

### The Divine Fountain
- Where: Acts 1–3.
  **Only appears if you have at least one removable Curse in your deck.**
- Setup: Shimmering water flows endlessly from a fountain in the wall.
- Choices:
  1. `[Drink]` → Remove **all** Curses from your deck.
  2. `[Leave]` → Nothing happens.
- Resources: card (remove)
- Tags: `gift`, `walk-away`, `gated`
- Note: Necronomicurse, Curse of the Bell and Ascender's Bane are unremovable and are not cleansed.
  Leaving is a real choice with Du-Vu Doll or a Pain/Rupture build.

### Duplicator
- Where: Acts 1–3.
  Classified as a "shrine" — rarer, at most once per act.
- Setup: A decorated altar to some ancient entity.
- Choices:
  1. `[Pray]` → Duplicate any one card in your deck (you choose).
  2. `[Leave]` → Nothing happens.
- Resources: card (duplicate)
- Tags: `gift`, `walk-away`
- Note: an upgraded card copies upgraded.
  Ritual Dagger / Genetic Algorithm copy their accumulated value.
  A Bottled card's Bottled status does **not** copy.

### Golden Shrine
- Where: Acts 1–3.
  Shrine.
- Setup: An elaborate shrine to an ancient spirit.
- Choices:
  1. `[Pray]` → Gain 100 Gold.
     **(Ascension 15+: 50 Gold)**
  2. `[Desecrate]` → Gain 275 Gold.
     Become Cursed — Regret.
  3. `[Leave]` → Nothing happens.
- Resources: gold, curse
- Tags: `gift`, `trade`, `walk-away`, `moral`
- Note: the A15 nerf halves only the safe option; Desecrate stays at 275, sharpening the temptation.

### Lab
- Where: Acts 1–3.
- Setup: A room of test tubes, beakers, flasks, forceps, stirring rods, goggles, pipets and a rare spiral tube of glass.
  "Why do you know the name of all these tools?"
- Choices:
  1. `[Search]` → Obtain 3 random Potions.
     **(Ascension 15+: 2 Potions)**
- Resources: potion
- Tags: `no-choice`, `gift`

### Match and Keep!
- Where: Acts 1–3.
- Setup: A gremlin madly shuffles cards on a table.
  "Twelve cards!
  Match them to keep them!
  Five tries, no do-overs."
- Choices:
  1. `[Play]` (forced) → A 12-card memory game, 6 pairs, 5 attempts.
     Every pair you match is added to your deck whether you want it or not.
     The six pairs are:
     - 1 pair of Basic colored cards (Bash / Neutralize / Zap / Eruption, matching your character)
     - 1 pair of Common colored cards
     - 1 pair of Uncommon colored cards
     - 1 pair of Rare colored cards
     - 1 pair of a random Curse
     - 1 pair of Uncommon Colorless cards — **replaced by a second pair of Curses at Ascension 15+** (which may duplicate the first curse)
- Resources: card (add), curse
- Tags: `no-choice`, `push-your-luck`, `gamble (odds-hidden)`
- Note: you can opt out by deliberately flipping the same two cards five times.
  Flipping two cards blind matches at 1/11.

### Ominous Forge
- Where: Acts 1–3.
- Setup: A small hut with a dusty forge whose furnace still roars.
  "You feel on edge..."
- Choices:
  1. `[Forge]` → Upgrade a card of your choice.
     (Requires an upgradable card.)
  2. `[Rummage]` → Obtain relic Warped Tongs.
     Become Cursed — Pain.
  3. `[Leave]` → Nothing happens.
- Resources: card (upgrade), relic (gain), curse
- Tags: `gift`, `trade`, `walk-away`, `gated`

### Purifier
- Where: Acts 1–3.
  Shrine.
- Setup: An elaborate shrine to a forgotten spirit.
- Choices:
  1. `[Pray]` → Remove a card from your deck.
  2. `[Leave]` → Nothing happens.
- Resources: card (remove)
- Tags: `gift`, `walk-away`

### Transmogrifier
- Where: Acts 1–3.
  Shrine.
- Setup: An elaborate shrine to a forgotten spirit (same art family as Purifier / Upgrade Shrine).
- Choices:
  1. `[Pray]` → Transform a card (remove it, gain a random card of the same rarity).
  2. `[Leave]` → Nothing happens.
- Resources: card (transform)
- Tags: `gift`, `walk-away`, `gamble (odds-hidden)`

### Upgrade Shrine
- Where: Acts 1–3.
  Shrine.
- Setup: An elaborate shrine to a forgotten spirit.
- Choices:
  1. `[Pray]` → Upgrade a card.
     (Only available if you have an upgradeable card.)
  2. `[Leave]` → Nothing happens.
- Resources: card (upgrade)
- Tags: `gift`, `walk-away`, `gated`

### We Meet Again!
- Where: Acts 1–3.
- Setup: A cheery, disheveled man called Ranwid greets you like an old friend.
  You have never met him.
  He wants a gift.
- Choices:
  1. `[Give Potion]` → Lose one specific potion (randomly chosen and shown to you).
     Receive a random relic.
     `[requires: at least 1 potion]`
  2. `[Give Gold]` → Lose a randomly chosen amount, minimum 50, capped at your current gold or 150 whichever is lower.
     Receive a random relic.
     `[requires: at least 50 gold]`
  3. `[Give Card]` → Lose one specific card (randomly chosen and shown).
     Receive a random relic.
     `[requires: a valid card — not a Curse, not a Basic card, not Bottled]`
  4. `[Attack]` → Nothing happens.
     Ranwid runs away.
- Resources: potion, gold, card (remove), relic (gain)
- Tags: `trade`, `gated`, `walk-away`, `gamble (odds-hidden)`
- Note: the price is shown, the reward is not — the relic is a random Common / Uncommon / Rare and is not revealed before you commit.

### Wheel of Change
- Where: Acts 1–3.
  Shrine (once per act at most).
- Setup: A dapper, cheery gremlin with a prize wheel.
  "It's time to spin the wheel!
  Are you R E A D Y ?
  Of course you are!"
- Choices:
  1. `[Play]` (forced — **there is no option to avoid playing**) → the wheel lands on one of six wedges:
     - Gold → 100 gold in Act 1 / 200 in Act 2 / 300 in Act 3
     - Chest → a random Common / Uncommon / Rare relic (excludes Bottled Flame, Bottled Lightning, Bottled Tornado, Whetstone)
     - Heal → heal to full HP
     - Curse → become Cursed — Decay
     - Remove → remove a card from your deck
     - Damage → take damage equal to 10% of max HP **(Ascension 15+: 15%)**
     - Odds: the wheel art shows six wedges but the wiki gives no weights — odds hidden.
       The wedge labels themselves are the tell: four read `[Prize!]` and two read `[Prize?]`.
- Multi-stage: yes, lightly — the spin resolves, then a second screen for the card-removal or relic-reward wedge.
- Resources: gold, relic (gain), HP, curse, card (remove)
- Tags: `no-choice`, `gamble (odds-hidden)`, `push-your-luck`
- Note: one of the few events that can kill you outright, and the only one where you have no say in the matter.

### The Woman in Blue
- Where: Acts 1–3.
  **Only appears if you have at least 50 gold.**
- Setup: An arm pulls you out of the dark into a small shop.
  A pale woman in sharp clothes gestures at a wall of potions.
  "Buy a potion.
  Now!"
- Choices:
  1. `[Buy 1 Potion]` → Lose 20 Gold, gain 1 potion.
  2. `[Buy 2 Potions]` → Lose 30 Gold, gain 2 potions.
  3. `[Buy 3 Potions]` → Lose 40 Gold, gain 3 potions.
  4. `[Leave]` → Nothing happens.
     **(Ascension 15+: lose HP equal to 5% of max HP)**
- Resources: gold, potion, HP
- Tags: `trade`, `gated`, `walk-away`, `tax` (at A15 the walk-away becomes a tax)
- Note: you pick the *quantity*, not the potions; a random selection is then offered and you may skip them.
  Cheaper per potion than the Merchant.

---

## Shared pool — Semi-common (some but not all of Acts 1–3)

### Designer In-Spire
- Where: **Acts 2 and 3 only.**
  Will not appear if you would die to the `[Punch]` option and cannot afford any other option.
- Setup: A colorful shop under a banner reading "IN-SPIRE".
  A man in ridiculous clothing bars the door, insults your appearance, then grudgingly points at a price list.
- Choices:
  1. `[Adjustments]` → Lose 40 Gold **(A15: 50)**.
     The service offered is one of two, chosen randomly and shown before you buy: upgrade a card of your choice, or upgrade 2 random cards.
  2. `[Clean Up]` → Lose 60 Gold **(A15: 75)**.
     One of two, shown: remove a card, or transform 2 cards.
  3. `[Full Service]` → Lose 90 Gold **(A15: 110)**.
     Remove a card, then upgrade a random card.
  4. `[Punch]` → Lose 3 HP **(A15: 5 HP)**.
     The designer faints.
- Resources: gold, card (upgrade / remove / transform), HP
- Tags: `trade`, `gated`, `walk-away`, `moral`
- Note: options grey out for insufficient gold or insufficient cards.
  If none of the three services is available, `[Punch]` becomes the only way out — the walk-away is a small tax.

### Face Trader
- Where: **Acts 1 and 2 only.**
- Setup: What looks like a statue holding masks turns out to be a gaunt, barely-breathing man with six arms.
  "Face.
  Let me touch?
  Maybe trade?"
- Choices:
  1. `[Touch]` → Lose HP equal to 10% of max HP.
     Gain 75 Gold **(A15: 50 Gold)**.
  2. `[Trade]` → Receive one of five event-exclusive relics.
     The button advertises "50% Good Face. 50% Bad Face" but the **actual odds are 40% good / 40% bad / 20% neutral**:
     - Face of Cleric — +1 max HP after each combat (good)
     - Ssserpent Head — gain 50 Gold on entering any ? room (good)
     - Cultist Headpiece — no mechanical effect (neutral)
     - Gremlin Visage — start each combat with 1 Weak (bad)
     - N'loth's Hungry Face — the next non-boss chest you open is empty (bad)
  3. `[Leave]` → Nothing happens.
- Resources: HP, gold, relic (gain)
- Tags: `trade`, `gamble (odds-shown)` — but the shown odds are *wrong*, which is worth noting as a design specimen; `walk-away`
- Note: N'loth's Hungry Face can deny the Sapphire Key and lock you out of Act 4.

---

## Act 1 — The Exordium

### Neow's Blessing
- Where: Act 1, floor 0 — the fixed opening room of every run.
  Not a ? node; it always happens.
- Setup: Neow, a six-eyed whale-like creature, meets you at the foot of the Spire.
  "Hello...
  Again..."
  She blesses adventurers according to their previous run's success.
- Choices:
  - **If you failed to reach the Act 1 boss last run, only two options are offered:**
    1. `Max HP +8/6/7/7` (Ironclad / Silent / Defect / Watcher)
    2. `Enemies in the next three combats will have 1 HP` → relic Neow's Lament
  - **If you reached the Act 1 boss, four options are offered, one drawn from each slot:**
    1. **Card slot** — one of: remove a card / transform a card / upgrade a card / choose 1 of 3 random class cards / choose 1 of 3 uncommon Colorless cards / obtain a random rare card
    2. **Non-card slot** — one of: Max HP +8/6/7/7 / relic Neow's Lament / a random common relic / 100 Gold / 3 random potions
    3. **Risk-reward slot** — one drawback paired with one larger reward:
       - Drawbacks: lose max HP (8/7/7/7 by character) · take damage equal to `floor(current HP / 10) * 3` · obtain a Curse · lose all gold
       - Rewards: remove 2 cards · transform 2 cards · gain 250 gold · choose a rare card · choose a rare Colorless card · obtain a random rare relic · Max HP +16/12/14/14
       - Forbidden pairings: Curse never pairs with "remove 2 cards"; "lose all gold" never pairs with "gain 250 gold"; "lose max HP" never pairs with "+max HP"
    4. **Fixed fourth option, always the same** — replace your starter relic with a random Boss relic
- Resources: HP, max HP, gold, card (add / remove / upgrade / transform), relic (gain / lose), potion, curse
- Tags: `gift`, `trade`, `sacrifice`, `gamble (odds-hidden)`, `gated`, `moral`
- Ascension notes: the risk-reward damage figure is computed from *current* HP, so Ascension 6 (start at 90% HP) and Ascension 14 (reduced max HP) both shrink it.
  Neow cannot remove Ascender's Bane.
- Design note: this is the game's thesis statement — the run's first decision is a four-way read of your own deck's future, before you have a deck.

### Big Fish
- Where: Act 1 only.
- Setup: A banana, a donut and a box dangle on strings from holes in the ceiling.
  There is quiet cackling from above.
- Choices:
  1. `[Banana]` → Heal 1/3 of max HP (rounded down).
  2. `[Donut]` → Max HP +5 (and healed for the same amount, as all max HP gains are).
  3. `[Box]` → Receive a random Common / Uncommon / Rare relic.
     Become Cursed — Regret.
- Resources: HP, max HP, relic (gain), curse
- Tags: `trade`, `gamble (odds-hidden)` (the relic identity is unknown), `moral`
- Note: no walk-away — you must take one of the three.

### The Cleric
- Where: Act 1 only.
  **Only appears with 35 gold or more.**
- Setup: A strange blue humanoid in a golden helm approaches grinning.
  "Hello friend!
  I am Cleric!
  Are you interested in my services?!"
- Choices:
  1. `[Heal]` → Lose 35 Gold.
     Heal 25% of max HP.
  2. `[Purify]` → Lose 50 Gold **(A15: 75 Gold)**.
     Remove a card from your deck.
  3. `[Leave]` → Nothing happens.
- Resources: gold, HP, card (remove)
- Tags: `trade`, `gated`, `walk-away`

### Dead Adventurer
- Where: Act 1 only.
  **Only appears on floor 7 and above.**
- Setup: A dead adventurer on the floor.
  His pants have been stolen.
  His possessions are intact — and the wounds tell you which elite killed him.
- Choices:
  1. `[Search]` → Draw one item from the loot table (30 Gold / a random relic / nothing — each occurs at most once per event).
     **25% chance (A15: 35%) that the elite returns and you must fight.**
     Each subsequent Search raises the elite chance by a further 25%.
  2. `[Escape]` → End the search with no penalty; you keep everything found so far.
- Multi-stage: yes — up to three Search rounds, each a fresh roll against a rising ambush chance.
  Three clean searches end the event with a success message.
- Which elite is telegraphed by the opening prose:
  - "...eviscerated and chopped by giant claws." → Lagavulin — and **it does not start asleep here**; it opens with Siphon Soul, which makes this far deadlier than the normal fight.
  - "...scoured by flames." → 3 Sentries
  - "...gouged and trampled by a horned beast." → Gremlin Nob
- If the fight happens, defeating the elite grants whatever loot you had not yet found plus 25–35 gold (but no extra relic if Search already produced one).
- Resources: gold, relic (gain), HP (via the fight)
- Tags: `push-your-luck`, `optional-fight`, `gamble (odds-shown)`, `walk-away`
- Note: Preserved Insect, Sling of Courage and Slaver's Collar all fire on this fight; Black Star does not.

### Golden Idol
- Where: Act 1 only.
- Setup: An inconspicuous pedestal holds a shining gold idol.
  "You sure don't see any traps nearby."
- Choices:
  1. `[Take]` → Obtain relic Golden Idol (+25% gold from combats), then a boulder trap triggers and you must pick an escape:
     - `[Outrun]` → Become Cursed — Injury
     - `[Smash]` → Take damage equal to 25% of max HP **(A15: 35%)**
     - `[Hide]` → Lose 8% of max HP **(A15: 10%)** — a permanent max HP loss, not damage
  2. `[Leave]` → Nothing happens.
- Multi-stage: yes — a two-screen event; taking the idol always forces the second choice.
- Resources: relic (gain), curse, HP, max HP
- Tags: `chain`, `trade`, `sacrifice`, `walk-away`, `delayed`
- Note: the Golden Idol is itself a key that unlocks later events — Forgotten Altar (Act 2) trades it for Bloody Idol, The Moai Head (Act 3) trades it for 333 gold.
  So this is also a `chain` in the cross-act sense.

### Hypnotizing Colored Mushrooms
- Where: Act 1 only.
  **Only appears on floor 7 and above.**
- Setup: A corridor full of hypnotizing colored mushrooms.
  You can't identify them and you want to leave, but you feel oddly compelled to eat one.
- Choices:
  1. `[Stomp]` → Fight 3 Fungi Beasts.
     The fight **always** rewards relic Odd Mushroom (event-exclusive), plus the usual gold and card reward.
  2. `[Eat]` → Heal 25% of HP.
     Become Cursed — Parasite.
- Resources: HP, relic (gain), curse, gold + card (via combat rewards)
- Tags: `optional-fight`, `trade`, `sacrifice`
- Note: no walk-away.
  Both options cost something.

### Living Wall
- Where: Act 1 only.
- Setup: You hit a dead end; walls slam down and trap you.
  Three faces materialize and each demands a different thing: "Forget what you know, and I'll let you go." / "I require change to see a new space." / "If you want to pass me, then you must grow."
- Choices:
  1. `[Forget]` → Remove a card from your deck.
  2. `[Change]` → Transform a card.
  3. `[Grow]` → Upgrade a card.
- Resources: card (remove / transform / upgrade)
- Tags: `gift`, `no-choice` in the sense that there is no bad branch — three free benefits, pick one
- Note: the purest "free choice" event in the game.
  No cost, no walk-away, no randomness on the Forget/Grow branches.

### Scrap Ooze
- Where: Act 1 only.
- Setup: A slime creature that ate too much scrap metal.
  You can see glints of something magical inside its opening.
  The acid and sharp objects will hurt.
- Choices:
  1. `[Reach Inside]` → Lose 3 HP **(A15: 5 HP)**, 25% chance to find a relic.
     If you fail you may repeat: each subsequent reach costs **1 more HP** and has **+10% chance**.
     (So: 3 HP/25%, 4 HP/35%, 5 HP/45%, …)
  2. `[Leave]` → Nothing happens.
- Multi-stage: repeatable — the same screen, escalating each time.
- Resources: HP, relic (gain)
- Tags: `push-your-luck`, `gamble (odds-shown)`, `walk-away`
- Note: the cleanest push-your-luck in the game — both the cost and the odds are printed on the button and both move every press.

### Shining Light
- Where: Act 1 only.
- Setup: A shimmering mass of light fills the room.
  Its warm glow and enchanting patterns invite you in.
- Choices:
  1. `[Enter]` → Upgrade 2 **random** cards.
     Take damage equal to 20% of max HP **(A15: 30%)**.
  2. `[Leave]` → Nothing happens.
- Resources: HP, card (upgrade)
- Tags: `trade`, `gamble (odds-hidden)` (which two cards is random), `walk-away`

### The Ssssserpent
- Where: Act 1 only.
- Setup: An enormous serpent rises from a hole in the floor and asks a question: "The most fulfilling of lives is that in which you can buy anything!
  Do you agree?"
- Choices:
  1. `[Agree]` → Receive 175 Gold **(A15: 150 Gold)**.
     Become Cursed — Doubt.
  2. `[Disagree]` → Nothing happens.
     The serpent stares at you with extreme disappointment.
- Resources: gold, curse
- Tags: `trade`, `walk-away`, `moral`
- Note: one of very few events where the *framing* is explicitly a moral test and the mechanical cost is a Curse named for the moral failing.

### World of Goop
- Where: Act 1 only.
- Setup: You fall into a puddle of slime goop.
  Climbing out, some of your gold is missing — and you can see it in the puddle, mixed with gold from earlier unfortunates.
- Choices:
  1. `[Gather Gold]` → Gain 75 Gold.
     Lose 11 HP.
  2. `[Leave It]` → Lose a random amount of gold between 20 and 50 **(A15: between 35 and 75)**.
     Capped at your current gold.
- Resources: gold, HP
- Tags: `trade`, `tax`, `gamble (odds-hidden)` (the amount lost on Leave It is a random roll)
- Note: there is no clean exit — walking away is itself the tax.
  A nice structural inversion of the usual "leave = nothing happens".

### Wing Statue
- Where: Act 1 only.
- Setup: A large blue wing-shaped statue among the boulders, with gold spilling from its cracks.
  Maybe there is more inside.
- Choices:
  1. `[Pray]` → Remove a card from your deck.
     Lose 7 HP.
  2. `[Destroy]` → Gain 50–80 Gold.
     `[requires: a card in your deck that deals 10 or more damage per hit]` — the wiki lists the eligible cards per character (e.g. Ironclad Heavy Blade, Bludgeon, Uppercut; Silent Backstab, Die Die Die; Defect Hyperbeam, Meteor Strike; Watcher Brilliance, Lesson Learned).
  3. `[Leave]` → Nothing happens.
- Resources: HP, card (remove), gold
- Tags: `trade`, `gated`, `walk-away`
- Note: the `[Destroy]` gate is the most unusual prerequisite in the game — it reads your *deck's damage profile*, not an item you hold.

---

## Act 2 — The City

### Ancient Writing
- Where: Act 2 only.
  Internal name "Back to Basics".
- Setup: A wall covered in the writing of Ancients.
  As you strain at the glyphs they begin to glow and the message becomes clear.
- Choices:
  1. `[Elegance]` → Remove a card from your deck.
     ("The answer was elegance.
     Of course.")
  2. `[Simplicity]` → Upgrade **all** Strikes and Defends in your deck.
     ("The truth is always simple.")
- Resources: card (remove / upgrade)
- Tags: `gift`
- Note: no cost, no walk-away, no randomness — a pure two-way deck-philosophy question.
  Simplicity scales with how many basics you kept; Elegance scales with how thin you already are.

### Augmenter
- Where: Act 2 only.
  Internal name "Drug Dealer".
- Setup: A man with an eyepatch and a devilish grin.
  "Interested in advancing science?
  I can make you stronger than any training or blessing."
- Choices:
  1. `[Test J.A.X]` → Obtain the card J.A.X.
  2. `[Become Test Subject]` → Choose and Transform 2 cards in your deck.
  3. `[Ingest Mutagens]` → Obtain relic Mutagenic Strength (start each combat with 3 Strength, lost at end of first turn).
- Resources: card (add / transform), relic (gain)
- Tags: `gift`
- Note: another all-upside three-way.
  Transforming a Curse yields another Curse.

### The Colosseum
- Where: Act 2 only, and **only in the top half of the act**.
- Setup: You are knocked unconscious and wake in a stadium packed with Slavers and Cultists.
  An armored giant in a golden crown bellows "WE NOW BEGIN THE 4200TH COMBAT!!!!"
- Choices:
  - **Stage 1 (forced):**
    1. `[Fight]` → Combat vs. Blue Slaver + Red Slaver.
       Not optional.
       (A Smoke Bomb potion counts as finishing this fight and advances you to stage 2.)
  - **Stage 2 (after winning):**
    1. `[COWARDICE]` → Escape through the breach in the wall.
       No penalty.
    2. `[VICTORY]` → Combat vs. Taskmaster + Gremlin Nob.
       Reward: **100 gold, 1 rare relic AND 1 uncommon relic**, plus a standard card selection.
- Multi-stage: yes — a forced fight, then a genuine stay-or-run decision with a big pot.
- Resources: HP (via combat), gold, relic (gain ×2), card (add)
- Tags: `chain`, `fight` (stage 1), `optional-fight` (stage 2), `push-your-luck`, `walk-away`
- Note: Preserved Insect / Sling of Courage / Slaver's Collar fire on the stage-2 fight; Black Star does not.

### Council of Ghosts
- Where: Act 2 only.
- Setup: Thick black smoke billows from the ground and walls, coalescing into three masked forms.
  "Another puppet of Neow I think." / "AGREED!
  SHE ALWAYS MAKES THE FUNNEST TOYS!" / "Would you like a taste of our power?"
- Choices:
  1. `[Accept]` → Receive 5 Apparition cards **(Ascension 15+: 3)**.
     Lose 50% of max HP.
  2. `[Refuse]` → Nothing happens.
- Resources: max HP, card (add)
- Tags: `sacrifice`, `trade`, `walk-away`, `moral`
- Note: the largest single max-HP price in the game.
  Apparition grants Intangible but is Ethereal unupgraded; Toxic Egg upgrades all copies gained here.

### Cursed Tome
- Where: Act 2 only.
- Setup: An open giant book in an abandoned temple, riddled with cryptic writing that morphs into script you can read.
  It turns out to be about an Ancient named Neow.
- Choices:
  1. `[Read]` → free, then an escalating four-screen ladder:
     - `[Continue]` → Lose 1 HP (you learn Neow was exiled to the bottom of the Spire)
     - `[Continue]` → Lose 2 HP (she blesses outsiders, seeking vengeance)
     - `[Continue]` → Lose 3 HP (the resurrected remember only fragments, cursed to fight forever)
     - then either `[Take]` → Obtain the book.
       Lose a further 10 HP **(A15: 15 HP)**.
       The relic is randomly Enchiridion, Nilry's Codex, or Necronomicon.
     - or `[Stop]` → Lose 3 HP and leave with nothing.
  2. `[Leave]` → Nothing happens.
- Multi-stage: yes — four sequential screens with a rising HP toll; the prose doles out lore one page at a time and the pain rises with it.
- Total cost to take the book: **16 HP (A15: 21 HP)**; 12 / 17 with Tungsten Rod.
- Resources: HP, relic (gain)
- Tags: `chain`, `push-your-luck`, `trade`, `walk-away`, `gamble (odds-hidden)` (which of the three books is random)
- Note: the clearest example in the game of paying HP for narrative, then paying more for the payoff.

### Forgotten Altar
- Where: Act 2 only.
- Setup: An altar to a forgotten god, holding an ornate female statue with arms outstretched.
  She calls out, demanding sacrifice.
- Choices:
  1. `[Offer: Golden Idol]` → Lose relic Golden Idol, obtain relic Bloody Idol.
     `[requires: Golden Idol]`
  2. `[Sacrifice]` → Gain 5 Max HP.
     Lose 25% of current HP **(A15: 35%)**.
  3. `[Desecrate]` → Become Cursed — Decay.
- Resources: relic (gain / lose), max HP, HP, curse
- Tags: `gated`, `trade`, `sacrifice`, `moral`
- Note: no clean walk-away — Desecrate is the "leave" and it costs a Curse.
  The Golden Idol option is the cross-act payoff of the Act 1 event.

### The Joust
- Where: Act 2 only.
- Setup: Two knights face off on a narrow bridge.
  One is settling the score with the murderer of his beloved pet, Noodles.
  "Fellow witness, why don't you bet on who you think will emerge victorious?"
- Choices: **There is no option to avoid betting.**
  1. `[Murderer]` → Bet 50 Gold.
     **70%**: win 100 Gold (net +50). 30%: lose the 50.
  2. `[Owner]` → Bet 50 Gold.
     **30%**: win 250 Gold (net +200). 70%: lose the 50.
- Resources: gold
- Tags: `no-choice` (you must bet), `gamble (odds-shown)`
- Note: the odds are printed on the buttons.
  EV favors Owner (+25 vs. +20), which the wiki spells out; most players take the safe side anyway.
  With Ectoplasm (can't gain gold) the bet is a guaranteed 50-gold loss.

### Knowing Skull
- Where: Act 2 only.
  **Only appears if you have 13 or more HP.**
- Setup: A large skull on an ornate pedestal bursts into flame and turns to face you.
  "WHAT IS IT YOU SEEK?
  WHAT IS IT YOU OFFER?"
  The door behind you slams shut.
- Choices (each costs 10% of max HP, minimum 6 HP; **each time a given reward is selected its cost rises by 1 HP**):
  1. `[Riches?]` → Obtain 90 Gold.
  2. `[Success?]` → Obtain a random Uncommon Colorless card.
  3. `[A Pick Me Up?]` → Obtain a Potion.
  4. `[How do I leave?]` → End the event — and this also costs HP.
- Multi-stage: yes — a repeatable menu.
  Rewards may be taken as many times as you can pay for.
  **The event does not end until you pay to leave.**
- Resources: HP, gold, card (add), potion
- Tags: `push-your-luck`, `trade`, `tax` (leaving costs HP too)
- Note: structurally the most interesting event in the game — an open-ended HP-to-resource exchange where even the exit is priced.
  Bloody Idol heals 5 on each `[Riches?]`; Tungsten Rod shaves 1 HP off every price.

### The Library
- Where: Act 2 only.
- Setup: An abandoned ornate building with a torn-off plaque reading "THE LIBRARY".
  Countless scrolls, manuscripts, books, and a comfy chair.
- Choices:
  1. `[Read]` → Choose **1 of 20 cards** to add to your deck.
     All are your class color and unupgraded (unless you hold Toxic / Molten / Frozen Egg).
  2. `[Sleep]` → Heal 33% of max HP **(A15: 20%)**.
- Multi-stage: lightly — `[Read]` opens a 20-card grid, and once opened you cannot go back to `[Sleep]`.
- Resources: card (add), HP
- Tags: `gift`, `trade`
- Note: the card pool respects the current rare-rarity counter but does not reset it.
  `[Sleep]` is not a campfire rest: Regal Pillow does not boost it, Dream Catcher does not fire, Coffee Dripper does not block it.

### Masked Bandits
- Where: Act 2 only.
- Setup: A group of bandits in large red masks blocks the way.
  Romeo: "Hello, pay up to pass... a reasonable fee of ALL your gold will do!
  Heh heh!"
- Choices:
  1. `[Pay]` → Lose **all** of your gold.
     Skip the fight.
  2. `[Fight!]` → Combat vs. Pointy (30 HP), Romeo (35–39 HP), and Bear (38–42 HP).
     Victory rewards a card selection, 25–35 gold, and relic **Red Mask**.
- Resources: gold, HP (via combat), relic (gain), card (add)
- Tags: `optional-fight`, `trade`, `tax`
- Note: none of the elite-triggering relics (Preserved Insect, Sling of Courage, Slaver's Collar, Black Star) fire on this fight.
  Ranwid in *We Meet Again!* references these bandits as "mask wearing hoodlums".

### The Mausoleum
- Where: Act 2 only.
- Setup: A gem-studded sarcophagus in a circular tomb, with black fog seeping from its sides.
- Choices:
  1. `[Open Coffin]` → Obtain a random relic.
     **50% chance (Ascension 15+: 100%)** to become Cursed — Writhe.
  2. `[Leave]` → Nothing happens.
- Resources: relic (gain), curse
- Tags: `gamble (odds-shown)`, `walk-away`
- Note: A15 turns the gamble into a flat trade — a clean example of the A15 design move.
  Omamori found *in* the coffin does not block the coffin's own curse; Darkstone Periapt does grant its max HP immediately.

### The Nest
- Where: Act 2 only.
- Setup: A line of hooded figures files into an unassuming cathedral.
  You join it and find yourself surrounded by Cultists chanting "MURDER!!
  MURDER MURDER!!" and "CAW CAW CAAAAAWWW!"
  They ignore you.
  You eye a donation box.
- Choices:
  1. `[Smash and Grab]` → Obtain 99 Gold **(Ascension 15+: 50 Gold)**.
  2. `[Stay in Line]` → Obtain the card Ritual Dagger.
     Lose 6 HP.
- Resources: gold, HP, card (add)
- Tags: `trade`, `gift`, `moral`
- Note: the A15 nerf (was 150, patched to 99, then 50 at A15) is one of the explicitly documented Ascension balance passes.

### N'loth
- Where: Act 2 only.
- Setup: A hunched creature with tentacles scrounging through trash.
  "N'loth hungry.
  Feed N'loth."
- Choices:
  1. `[Offer]` → Give up **one of two randomly chosen relics you own** (the game picks the two candidates; you pick which of the two).
     Obtain relic N'loth's Gift.
  2. `[Leave]` → Nothing happens.
- Resources: relic (gain / lose)
- Tags: `sacrifice`, `trade`, `walk-away`, `gamble (odds-hidden)` (which two of your relics are offered up)
- Note: the only event that takes a relic you already own.
  Relics whose effect fired on pickup (Old Coin, Mango, Maw Bank, Calling Bell, Tiny House) can be fed for free.

### Old Beggar
- Where: Act 2 only.
  **Only appears with 75 gold or more.**
- Setup: An old beggar cloaked in fur reaches out.
  "Spare some coin, child?"
  If you pay, he throws off the cloak — he is the Cleric from Act 1.
- Choices:
  1. `[Offer Gold]` → Lose 75 Gold.
     Remove a card from your deck.
  2. `[Leave]` → Nothing happens.
     ("You will never make a difference...
     You never do.")
- Resources: gold, card (remove)
- Tags: `trade`, `gated`, `walk-away`, `moral`
- Note: cheapest guaranteed card removal in the game at that point in a run.

### Pleading Vagrant
- Where: Act 2 only.
  Internal name was "Addicted".
- Setup: A shrouded figure approaches while you sneak past his group.
  "Got anything for me friend?
  Please... maybe some Coin?
  I just need somewhere to stay, I have treasures I can trade..."
- Choices:
  1. `[Give 85 Gold]` → Obtain a random relic.
     `[requires: 85 gold]`
  2. `[Rob]` → Obtain a random relic.
     Become Cursed — Shame.
     ("Have you no shame?
     HAVE YOU NO SHAAAAAME?!")
  3. `[Leave]` → Nothing happens.
- Resources: gold, relic (gain), curse
- Tags: `trade`, `gated`, `walk-away`, `moral`
- Note: the two paying options give the *same* reward — the choice is purely whether you pay in gold or in conscience.
  The curse is named for the act.

### Vampires(?)
- Where: Act 2 only.
- Setup: Hooded figures mid-ritual in an unlit street turn to you in unison.
  The tallest bares fangs and extends a pale hand.
  The greeting is character-specific: "Join us brother" (Ironclad) / "Join us sister" (Silent, Watcher) / "Join us broken one" (Defect).
- Choices:
  1. `[Offer: Blood Vial]` → Lose relic Blood Vial.
     Remove **all** Strikes.
     Receive 5 Bite cards.
     `[requires: relic Blood Vial]`
  2. `[Accept]` → Remove all Strikes.
     Receive 5 Bites.
     Lose 30% of max HP.
  3. `[Refuse]` → Nothing happens.
- Resources: relic (lose), card (remove / add), max HP
- Tags: `gated`, `sacrifice`, `trade`, `walk-away`
- Note: you get exactly 5 Bites regardless of how many Strikes were removed, so the deal is best with a full Strike count.
  The gated option turns a 30%-max-HP price into a relic you may no longer want — one of the game's better prerequisite designs.
  Molten Egg upgrades all 5 Bites.

---

## Act 3 — The Beyond

### Falling
- Where: Act 3 only.
- Setup: Hopping from one floating shape to another on the way up, you slip and begin to fall.
  In free fall you consider your options.
- Choices:
  1. `[Land]` → Lose a **random Skill** from your deck.
     ("Land safely with your greatest techniques.")
  2. `[Channel]` → Lose a **random Power**.
     ("Channel a Power to survive the fall.")
  3. `[Strike]` → Lose a **random Attack**.
     ("Strike at the wall to hang on to it.")
  - Each option is offered only if you have a card of that type; Bottled cards are excluded from the pool.
    If your deck is nothing but Bottled cards, only `[Land]` appears and it removes nothing ("You seem to fall as slow as a feather").
- Resources: card (remove)
- Tags: `sacrifice`, `gamble (odds-hidden)` (you choose the *type*, not the card), `gated`
- Note: a rare event that is pure loss, with the only agency being which category of your deck takes the hit.
  In practice often a free removal of a Strike or a dead Skill.

### Mind Bloom
- Where: Act 3 only.
- Setup: Your thoughts start to feel very real.
  Imaginings of monsters and riches manifest.
  "The sensation is quickly fleeting.
  What do you do?"
- Choices:
  1. `[I am War]` → Fight a **boss from Act 1** (randomly chosen).
     Reward: a rare relic, normal combat rewards, and 50 gold **(A15: 25 gold)**.
  2. `[I am Awake]` → **Upgrade all cards** in your deck.
     Obtain relic Mark of the Bloom (you can no longer heal, at all, for the rest of the run).
  3. **Third option depends on floor:**
     - On floors 35–40: `[I am Rich]` → Gain 999 Gold.
       Become Cursed — **2× Normality**.
     - On floor 41 and above: `[I am Healthy]` → Heal to full HP.
       Become Cursed — Doubt.
- Resources: HP, gold, card (upgrade), relic (gain), curse
- Tags: `optional-fight`, `trade`, `sacrifice`, `gamble (odds-hidden)`, `moral`
- Note: the game's biggest single-screen swings, and the only event whose option set changes by floor within its own act.
  Pantograph and Slaver's Collar treat `[I am War]` as a real boss fight.
  Mark of the Bloom is a permanent, unremovable downside — the purest `sacrifice` in the game.

### The Moai Head
- Where: Act 3 only.
- Setup: An enormous stone head juts from a wall that, unlike everything else in the Beyond, does not shift.
  Its mouth gapes, teeth stained red.
  Pictographs on the surface show people throwing themselves in and being devoured.
  "Why would anyone do that?"
- Choices:
  1. `[Jump Inside]` → Heal to full HP.
     Lose 12.5% of max HP **(A15: a flat 18 max HP)**.
  2. `[Offer: Golden Idol]` → Receive 333 Gold.
     Lose relic Golden Idol.
     `[requires: Golden Idol]`
  3. `[Leave]` → Nothing happens.
- Resources: HP, max HP, gold, relic (lose)
- Tags: `trade`, `sacrifice`, `gated`, `walk-away`
- Note: the third and final stop on the Golden Idol chain (Act 1 acquire → Act 2 Bloody Idol → Act 3 cash out).

### Mysterious Sphere
- Where: Act 3 only.
- Setup: A bony sphere juts from the terrain, surrounding a mysterious glowing object.
  Sentries are watching it.
- Choices:
  1. `[Open Sphere]` → Fight 2 Orb Walkers.
     Reward: **1 rare relic**, 45–55 Gold, a card choice, and possibly a potion.
  2. `[Leave]` → Nothing happens.
     ("No need to be greedy.")
- Multi-stage: the fight is the second screen, but there is no branching decision after it.
- Resources: HP (via combat), relic (gain), gold, card (add), potion
- Tags: `optional-fight`, `trade`, `walk-away`
- Note: despite being a hard fight it is **not** flagged as an Elite, so Preserved Insect / Sling of Courage / Slaver's Collar / Black Star all do nothing.

### Secret Portal
- Where: Act 3 only.
  **Will not appear unless at least 13 minutes 20 seconds of real time have elapsed in the run.**
- Setup: A stone entrance filled with a swirling magical portal is set into one of the living walls of the Beyond.
  You aren't sure where it leads.
- Choices:
  1. `[Enter the Portal]` → Immediately travel to the Act 3 **boss**, skipping every remaining floor.
  2. `[Leave]` → Nothing happens.
- Resources: none directly — it moves you through the map (skipping all remaining rewards, rest sites, shops and elites)
- Tags: `gated`, `walk-away`, `sacrifice` (you give up the rest of the act)
- Note: the only event gated on **wall-clock time**, and the only one that edits the map.
  It exists to serve speedrunning.

### Sensory Stone
- Where: Act 3 only.
- Setup: A glowing tesseract spins and shifts in the air.
  You touch it; a sharp pain flows through you, followed by vivid flashes of a distant memory.
  "...whose memories are these?"
- Choices (all three buttons are labelled `[Recall]`, differing only in their bracketed cost/reward):
  1. `[Recall]` → Add 1 Colorless card to your deck.
     No cost.
  2. `[Recall]` → Add 2 Colorless cards.
     Take 5 damage.
  3. `[Recall]` → Add 3 Colorless cards.
     Take 10 damage.
- Resources: HP, card (add)
- Tags: `trade`
- Note: each addition is a normal 3-card reward screen, so Question Card and Busted Crown change the choice count, Singing Bowl offers +2 max HP instead, and you may skip.
  Prismatic Shard does nothing (the cards are already specified colorless).
  The four memory vignettes — FEAR, TRIUMPH, CONFUSION, SERENITY — are the backstories of the Ironclad, Silent, Defect and Watcher, and the one you see is random regardless of who you are playing.

### Tomb of Lord Red Mask
- Where: Act 3 only.
- Setup: An ornamented tomb across a floating path, with a slot for gold coins and a scratched-out inscription above it.
- Choices:
  - **If you hold relic Red Mask:**
    1. `[Don the Red Mask]` → Gain 222 Gold.
    2. `[Leave]` → Nothing happens.
  - **If you do not:**
    1. `[Locked]` → greyed out and unselectable.
       `[requires: relic Red Mask]`
    2. `[Offer: X Gold]` → Lose **all** your gold.
       Obtain relic Red Mask.
       (Note: "Take from others as I have taken from you!")
    3. `[Leave]` → Nothing happens.
- Resources: gold, relic (gain)
- Tags: `gated`, `trade`, `walk-away`, `chain`
- Note: pairs with Masked Bandits in Act 2 — beating the bandits rather than paying them gets you the Red Mask, which turns this event into free gold.
  The game **shows you the locked option** rather than hiding it, which is how a player learns the Act 2 event mattered.

### Winding Halls
- Where: Act 3 only.
- Setup: The walls and ground shift inexplicably; you keep losing your way, and whispering voices in the back of your head aren't helping.
  "You need to change something, and soon.
  That's what the voices say anyway, and why would they lie?"
- Choices:
  1. `[Embrace Madness]` → Receive 2 Madness cards.
     Lose HP equal to 12.5% of max HP **(A15: 18%)**.
  2. `[Press On]` → Become Cursed — Writhe.
     Heal 25% of max HP **(A15: 20%)**.
  3. `[Retrace Your Steps]` → Lose 5% of max HP.
- Resources: HP, max HP, card (add), curse
- Tags: `trade`, `tax` (every option costs something), `sacrifice`
- Note: no free exit — the "safe" option is still a permanent max HP loss.
  HP percentages here round *normally*, unlike Wheel of Change which rounds down.

---


## Structural notes

**The "?" node roll.**
A "?" node is a lottery whose most likely prize is an event.
On the first "?" of an act: **Monster 10%, Shop 3%, Treasure 2%, Event if nothing else hits** — so 85% event.
Each outcome carries its own ratcheting counter: every "?" without a monster adds 10% to monster, without a shop adds 3%, without treasure adds 2%.
Hitting an outcome resets only that counter.
Four shopless rooms make the fifth a 15% shop, and a long event streak eventually forces a fight.
Two relics rewrite the table: **Tiny Chest** makes every 4th "?" a treasure room, **Juzu Bracelet** removes regular monster fights from "?" rooms entirely — converting combat risk into more events.
**Ssserpent Head** pays 50 gold per "?" entered, changing the node's routing value without touching the roll.

**Pools and repetition.**
Pools are per-act: 12 events exclusive to Act 1 (plus Neow at floor 0), 16 to Act 2, 8 to Act 3, and 16 shared — 14 available in any of the first three acts, plus Designer In-Spire (Acts 2–3) and Face Trader (Acts 1–2).
The wiki states the once-per-run draw rule only for the "shrine" subclass (Wheel of Change "is considered a Shrine, which means that it's rarer and can appear once every act"), but in practice each act draws without replacement.
This is why a 52-event catalogue stays fresh: a full run touches maybe six to ten.

**How many "?" nodes.**
Acts 1–3 are 15-floor maps plus boss.
Three floors are fixed — floor 1 monster, floor 9 treasure, floor 15 rest site (16 and 17 are boss and boss chest) — leaving 12 rolled rows.
The wiki does not publish the generation weights, so the exact share is a gap; observationally a map shows a handful of "?" nodes and one chosen path touches one to three.
Act 4 is not a map: a fixed corridor of rest site, merchant, elite, boss, with no "?" nodes and no events.

**Costs on the button, odds sometimes.**
The strongest legibility convention is that the option button carries the ledger, in bracketed clauses before the prose: `[Lose 7 HP] Remove a card`, `[Lose 40 Gold] Upgrade a card`, `[Gain 275 Gold] Become Cursed - Regret`.
Both halves of a trade sit on the button, so no price is discovered after committing.
Odds appear when the decision should be arithmetic — The Joust prints 70% and 30% beside its bets, Scrap Ooze prints both the rising HP cost and the rising percentage on every press, Dead Adventurer prints the ambush chance, The Mausoleum its 50%.
Odds are hidden where the design wants dread: Wheel of Change shows six wedges and no weights (four labelled `[Prize!]`, two `[Prize?]`, which is the only signal), Cursed Tome won't say which of three books you get, We Meet Again! names the price exactly and the reward not at all.
Face Trader is the outright liar — the button advertises "50% Good Face. 50% Bad Face" while the real split is 40/40/20.

**Gating.**
Options appear, grey out, or vanish on state the player already holds, and the game usually *shows* the lock rather than hiding it, so the lock teaches.
Gold gates whole events (Woman in Blue needs 50 to appear, The Cleric 35, Old Beggar 75; Knowing Skull needs 13 HP) and single options (Pleading Vagrant's 85).
Relics gate the best branches: Forgotten Altar and The Moai Head read Golden Idol, Vampires(?) reads Blood Vial, Tomb of Lord Red Mask prints a `[Locked]` row when you lack the Red Mask you could have won in Act 2.
Deck state gates too — Upgrade Shrine needs an upgradable card, The Divine Fountain only appears with a removable Curse, Falling offers only the card types you own, and Wing Statue's `[Destroy]` requires a card dealing 10+ damage per hit, the one prerequisite that reads your deck's damage profile rather than an item.

**Ascension.**
A15's whole content is "unfavorable events".
The pattern is that it nerfs the *safe* option, not the risky one: Golden Shrine's `[Pray]` halves to 50 while `[Desecrate]` stays at 275; Lab drops 3 potions to 2; The Library's `[Sleep]` falls 33% → 20%.
Sometimes it deletes a gamble by making the bad outcome certain (Mausoleum 50% → 100%), sometimes it taxes the exit (Woman in Blue's `[Leave]` starts costing 5% max HP).
Ascension also reaches events indirectly — Neow's risk-reward damage scales off current HP, so A6 and A14 both shrink it.

**Register.**
Terse, second-person, present tense, with a deadpan that undercuts every grand gesture.
Four buttons verbatim: `[Take and Give]`, `[How do I leave?]`, `[Embrace Madness]`, `[I am Rich]`.
Two lines of prose — Ominous Forge: "*The smithing tools are covered with dust, yet a fire roars inside the furnace.
You feel on edge...*"; Designer In-Spire: "*The services seem fine, but you would rather punch this smug man in his smug face.*" The Lab closes its setup with the register in one sentence: "*Why do you know the name of all these tools?
It doesn't matter, you take a look around.*"

**Count inventoried per act**
- Shared, common (Acts 1–3): **14**
- Shared, semi-common: **2** (Designer In-Spire, Face Trader)
- Act 1 — The Exordium: **12** (including Neow's Blessing)
- Act 2 — The City: **16**
- Act 3 — The Beyond: **8**
- Act 4 — The Ending: **0** (no "?" nodes exist)
- **Total: 52**
