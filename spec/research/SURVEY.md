# Narrative encounters in FTL and Slay the Spire — what the corpora say

A reading of every text event in FTL: Faster Than Light and every event in Slay the Spire, against Space Prince's narrative encounters as they stand on 2026-09-17.
The inventories are [FTL.md](FTL.md) (289 events) and [STS.md](STS.md) (52 events); this document is the analysis.
Space Prince's own rules are in `spec/mechanics/HOUSES.md` and `spec/mechanics/ENCOUNTERS.md`, and the twenty-four authored scenes in `client/src/data/narrative-scenarios.ts`.
Everything under "Proposals" is a proposal, not a decision.

## 1. The three designs side by side

| | FTL | Slay the Spire | Space Prince today |
|---|---|---|---|
| Events authored | 289 | 52 | 24 scenes (2 per house) |
| Options per event, mean | 1.75 | 2.54 | 3 (two offers and an exit) |
| Single-option events | 43% | 8% | 0% |
| Events with a free exit | 48% | 60% | 20 of 24; four exits cost 12 Light |
| Events with a random outcome | 49% | 33% | 0% |
| Of those, odds shown to the player | 13% | 29% | — |
| Events where combat can start | 66% | 12% | 0% |
| Events with a prerequisite-gated option | 34% | 35% | 18 of 24 (joy, dignity, combustion) |
| Deterministic, fight-free, with a real choice | 5% | 54% | 100% |
| Events per run, roughly | 20–30 text events | 6–10 | about 24 of 49 encounters |
| Resources moved | hull, scrap, fuel, ammunition, crew, systems, the fleet clock | HP, gold, cards, relics, max HP, curses, potions | Light, per-planet affliction, revival |

Two things stand out before any detail.
Space Prince's shape, a deterministic fight-free decision with two or three options, describes only one FTL event in twenty but more than half of Slay the Spire.
And Space Prince already visits about as many narrative nodes per run as it has scenes, where the other two games draw a small fraction of their pool each run.

## 2. Where the tension comes from

FTL and Slay the Spire make an event tense in different ways, and the difference is the most useful thing in the corpora.

**FTL sells uncertainty.**
Half its events roll, and in seven of eight rolls the player is never told the odds.
The events people remember are the ones where the plain option loses a crew member on a hidden coin flip: Giant alien spiders, Fire on research station, Engi research station.
Its second currency is time: letting a scout escape doubles the pursuing fleet, and each `Wait` in Crystalline men buried costs a doubled-pursuit jump.
Almost every consequential decision in FTL is priced in fleet turns, with scrap as the visible economy.

**Slay the Spire sells permanence.**
Two thirds of its events are deterministic, and the button carries the whole ledger: `[Lose 7 HP] Remove a card`, `[Gain 275 Gold] Become Cursed - Regret`.
What makes the choice hard is that the cost or the gain is permanent for the run: max HP (Council of Ghosts takes half of it), a curse named for the failing (Doubt, Shame, Regret), a relic that cannot heal you again (Mind Bloom), a card you chose to burn (Bonfire Spirits).
Odds appear only where the decision is arithmetic, such as The Joust and Scrap Ooze, and are hidden where the design wants dread, such as Wheel of Change.
Face Trader prints "50% Good Face" over a real 40/40/20 split, the corpus's one misstated set of odds.

Space Prince has already chosen the second road: client honesty forbids hidden odds and the resolver is deterministic.
The corpus says that is not a handicap.
Slay the Spire's best-liked structures, Knowing Skull, Living Wall, Ancient Writing, Golden Shrine, The Nest, Vampires, are all deterministic.
Their tension is context: what the deck needs, what the next act will ask, what cannot be undone.
That is exactly the test `ENCOUNTERS.md §1.3` already sets for a scene: the player should be able to say who needs recovery, who can carry a cost, and why the Light matters now.

## 3. The shapes that recur

Every event in both games is built from a small set of shapes.
Listed here with exemplars, and with where Space Prince stands on each.

### 3.1 Safe, greedy, leave

The commonest three-way root in Slay the Spire: a certain small gain, a larger gain with a permanent cost, and a way out.
Golden Shrine (100 gold, or 275 gold and a curse, or leave) is the pure form; Big Fish, The Nest, and Forgotten Altar are variants.
FTL's version is Pirate briber: a certain bribe, or a fight whose payout ranges from nothing to a free store.
Space Prince's default scene is this root, with the chosen planet as a second axis neither game has.

### 3.2 The priced exit

Slay the Spire sometimes charges for leaving.
World of Goop's `[Leave It]` loses gold, Winding Halls' safest option costs max HP, Knowing Skull will not open the door until you pay, and at Ascension 15 The Woman in Blue's `[Leave]` starts costing HP.
FTL's equivalent is Asteroid belt distress, where abandoning the miners doubles the fleet's pursuit.
Space Prince already allows this (`ENCOUNTERS.md §5.3`) and uses it in four scenes: one in Livelihood, both in Labor, one in The Hidden.
The corpus suggests it is the natural signature of a bad place, and the only way a walk-away becomes a decision.

### 3.3 The ladder

Several rungs of the same trade on one screen, deterministic, the player picks the depth.
Sensory Stone offers one, two, or three cards for zero, five, or ten HP; FTL's Refueling station sells one, three, or six fuel at a flat rate.
It is a single decision, so it fits Space Prince's one-decision rule, and it carries most of what a repeatable draw gives without a second stage.

### 3.4 The repeatable draw

Knowing Skull is the standout: an open menu where every pick costs 10% of max HP, each repeated pick costs one more, and the exit is priced too.
Scrap Ooze prints a rising cost and a rising chance on every press.
Cursed Tome doles out lore one page at a time, and the pain rises with it.
FTL's out-of-fuel wait is the same loop against the fleet clock.
Space Prince deferred multi-stage scenes, and the removed tree design (`git show 85e7d5c`) was this shape with luck rolls.
Knowing Skull shows the shape works without any roll; if it ever returns, the deterministic form is the one to copy.

### 3.5 The gate

A third of the events in each game carry an option that exists only for players holding something.
FTL's blue options gate on crew race, system level, a weapon class, or an augment; Slay the Spire's gate on a relic, a card type, gold, or a card that deals ten damage.
They do three different jobs, and the distinction is the reusable idea:

- **Remove the risk.**
  Engi research station's scan turns a crew-death dilemma into a free pick; Plasma storm incapacitated ships' Piloting 2 deletes both bad branches and slightly lowers the prize.
- **Raise the ceiling.**
  Malfunctioning defense system pays more the more surgical the tool, six prerequisites in a ladder; Vampires trades the Blood Vial for what otherwise costs 30% of max HP.
- **Buy information only.**
  Deactivated Auto-ship's Sensors 3 tells you whether the gamble is safe and then still asks; Pirate ship selling weapon's Mind Control lets you see the weapon before paying; the Slug crew member reads minds across the Slug pool.

The third kind cannot exist in Space Prince, because nothing is hidden.
The first two are what conditioned offers already do: a benefic joy raises the ceiling, a contained malefic removes harm (`ENCOUNTERS.md §4.4`).
One difference in presentation: FTL hides an absent blue option and Slay the Spire usually shows the lock.
Tomb of Lord Red Mask prints a greyed `[Locked]` row, which is how a player learns that beating the bandits in Act 2 mattered.
Space Prince hides an absent conditioned offer.

### 3.6 The sacrifice

Giving up something persistent for a gain.
In FTL it is almost always a crew member: Slaver (hostile) asks for one outright and closes the Clone Bay loophole in text; Crystalline cache will take your entire fuel stock for a weapon.
In Slay the Spire it is max HP, a relic (N'loth), or a chosen card, and the largest swings in the game are sacrifices: Council of Ghosts, Mind Bloom, Vampires.
Space Prince defers "deliberate sacrifice", but affliction landing exactly on a ceiling already combusts the planet (`ENCOUNTERS.md §2`), so the mechanic needs no new rule, only a scene that offers it plainly.

### 3.7 The chain

FTL has thirty chains and twenty-four quest markers; a marker is a promise redeemed a few beacons later, and the Rock bride defers its moral choice a whole jump so you learn what the cargo objects only at the destination.
Slay the Spire has four: Golden Idol feeds Forgotten Altar and The Moai Head, Masked Bandits feeds Tomb of Lord Red Mask, and A Note For Yourself reaches across runs.
Both need stored narrative state, which `STATE.md` rules out.
Space Prince's answer is already in the design: the chart is the memory.
Afflict Venus past the joy threshold in a Creativity scene and the next Creativity scene loses its joy offer; combust Saturn and The Hidden loses its containment.
That is a delayed consequence without a flag, and it is the one thing here neither reference game can do.

### 3.8 The moral frame

About a fifth of each corpus frames a choice as ethical, and the payoff is asymmetric by design.
FTL's rule is that heroism is a wide distribution and the bribe is certain, with occasional inversions (keeping your word in Settlement mercenary work pays four times what breaking it does).
Slay the Spire names the curse after the failing, so the cost is legible as a moral cost.
Space Prince's register forbids martial and adversarial language, and its scenes are already quiet and humane; the moral weight lives in which planet carries the burden.

### 3.9 The pure gift

A quarter of Slay the Spire's events cost nothing: Living Wall (remove, transform, or upgrade a card, pick one), Ancient Writing, the shrines.
The choice is *which* benefit, and that is enough.
Space Prince's Tend family with a chosen target is this shape; Friendship's Jupiter offer is its clearest instance.

## 4. Pools, pacing, and repetition

FTL stocks each sector from themed lists and flags nearly every event unique per sector, so a run of roughly sixty beacons sees the same ten fight intros many times and each set piece once.
Its race sectors differ mechanically, not only in prose: Mantis events threaten crew, Rock events gate on equipment and punish trespass, Slug events attack information, Lanius events turn on translation.
Slay the Spire draws each act without replacement from an act pool plus a shared pool, so a run touches six to ten of fifty-two events and a fifty-two-event catalogue stays fresh for many runs.
Its acts also scale: Act 1 trades small gold and HP, Act 2 trades relics and curses, Act 3 offers 999 gold and full-deck upgrades.

Space Prince's numbers are different in kind.
A map has seven encounters, half roll narrative, and a full run is seven maps, so a run visits about twenty-four narrative nodes against a pool of twenty-four scenes.
The no-repeat rule (`ENCOUNTERS.md §8`) is exhausted within roughly one run and recycling begins.
Chart conditioning is the multiplier the reference games lack: the same scene reads differently with Venus lit or dark, exalted or in fall.
It does not change the prompt text, so a recycled scene is recognised even when its offers differ.
Map number changes nothing in a scene; `spec/ROADMAP.md` already notes that map 7 plays like map 1.

## 5. Surface and register

FTL's options are prose sentences and its consequences are narrated afterwards; costs are discovered.
Slay the Spire's options are a bracketed ledger followed by a two-word verb, and nothing is discovered after committing.
Space Prince splits the two: prose options with a fixed aside showing the authored amounts, and a planet preview showing the actual change.
That is the Slay the Spire convention with the ledger moved beside the option, and the corpus says it is the legibility winner; nothing here argues for changing it.

One small convention worth noting.
Slay the Spire's option labels are sayable in two or three words (`[Embrace Madness]`, `[How do I leave?]`, `[I am Rich]`), and its Ascension pass sharpens temptation by shrinking the safe option rather than the greedy one: Golden Shrine's `[Pray]` halves to 50 while `[Desecrate]` stays at 275.
Balance is deferred in Space Prince, but that is the direction to shrink from when the time comes.

## 6. What the corpora argue against

- **Hidden-odds gambles.**
  FTL's hallmark and its most resented pattern; client honesty forbids it anyway.
- **Quest chains with stored flags.**
  The felt effect, a consequence that lands later, is already delivered through the chart.
- **Combat as an event outcome.**
  Two thirds of FTL's events can start a fight; Space Prince's map already separates the two node types, and the one-decision scene should stay fight-free.
- **A second currency.**
  FTL's fleet clock is what makes its decisions bite, but Space Prince's run already ramps through the barrage and the finite seven maps, and `ENCOUNTERS.md §11` rules out a new run currency.

## 7. Proposals

Each is tied to a finding above and to an existing constraint, and none is decided.

1. **Deepen the pool or slow the draw.**
   Twenty-four scenes against about twenty-four narrative nodes per run is the largest gap between Space Prince and either reference (§4).
   `STATE.md` reserves headroom for eight scenarios per house; the alternative is a lower narrative-node share so each run sees fewer.
   The cheapest multiplier is one that changes what the player reads, not only what is offered.
2. **Scale scene amounts with map number.**
   Both games scale by depth and Space Prince's barrage already does (`MECHANICS.md §11.3`); scenes could ride the same `mapsCompleted` step on the lattice, so a Press on map 6 stakes more and a Tend heals more.
3. **Show the lock.**
   When a conditioned offer is absent, the aside could say what would have revealed it ("with Venus lit", "with Mercury in domicile"), as Tomb of Lord Red Mask does.
   It teaches the chart, which is the accessibility goal, and stays inside the three-option limit because it is a note, not a row.
   Against it: `ENCOUNTERS.md §4.3` deliberately hides failed predicates.
4. **Offer sacrifice plainly.**
   The biggest moments in Slay the Spire are sacrifices, and Space Prince's rules already allow an option to combust a chosen planet.
   A scene that says so, for a large Light gain, un-defers "deliberate sacrifice" without new state or new outcome kinds.
5. **Use the ladder.**
   One or two houses could offer three depths of the same trade to a chosen planet in one decision (§3.3), which gives the push-your-luck feel Knowing Skull has without a second stage or a roll.
6. **Price the exit in every bad place.**
   Four scenes charge to leave, but neither Transformation scene does, and one scene each in Livelihood and The Hidden still exits free.
   The corpus says a free exit in the darkest houses is the odd one out.

What was not proposed: information as a reward (revealing the adversary chart at a chosen upcoming combat node, FTL's map reveal) is the one novel reward type the corpora suggest, but it needs a new outcome kind and a stored revealed flag, which `STATE.md` would have to accept first.
