# Slay the Spire — achievement inventory

Audited 2026-09-18 for Space Prince's proposed achievement system.
The comparison is in [ACHIEVEMENTS.md](ACHIEVEMENTS.md); the narrative-event inventory remains in [STS.md](STS.md).

## Coverage and sources

All **46 achievements** in the original Slay the Spire, including the Watcher.
This excludes Slay the Spire 2, the board game, mods, and run-score bonuses that are not achievements.
Names were checked against the [official Steam catalogue](https://steamcommunity.com/stats/646570/achievements/).
Conditions are paraphrased from that catalogue and the [achievement reference](https://slay-the-spire.fandom.com/wiki/Achievements), retrieved through its MediaWiki API where direct pages were unavailable.
The latter supplies hidden descriptions; Steam supplies the three Ascension achievements omitted from that wiki's table at retrieval.
The [community achievement guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2077110546) independently distinguishes ordinary completion from the Ending.

The grouping and design observations below are this audit's analysis.
An ordinary win requires clearing Act 3; an Ending completion requires defeating the Heart in Act 4.
Do not silently strengthen every victory condition into a Heart requirement.

## Boss milestones — 9

Each recognizes defeating the named boss, rather than an additional restriction on the fight.
The boss mappings are also listed in the [community guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2077110546).

| Achievement | Boss |
|---|---|
| The Guardian | The Guardian |
| The Ghost | Hexaghost |
| The Boss | Slime Boss |
| The Champion | The Champ |
| The Automaton | Bronze Automaton |
| The Collector | The Collector |
| The Crow | Awakened One |
| The Shapes | Donu and Deca |
| The Time Eater | Time Eater |

## Completion and difficulty — 13

| Achievement | Earning condition | Scope |
|---|---|---|
| Ruby | Win as Ironclad. | Run |
| Emerald | Win as Silent. | Run |
| Sapphire | Win as Defect. | Run |
| Amethyst | Win as Watcher. | Run |
| Ruby+ | Defeat the Heart as Ironclad. | Run |
| Emerald+ | Defeat the Heart as Silent. | Run |
| Sapphire+ | Defeat the Heart as Defect. | Run |
| Amethyst+ | Defeat the Heart as Watcher. | Run |
| The End? | Defeat the Heart with Ironclad, Silent, and Defect. | Lifetime |
| Ascend 0 | Gain access to Ascension. | Progression |
| Ascend 10 | Win at Ascension 10. | Run |
| Ascend 20 | Win at Ascension 20. | Run |
| My Lucky Day | Finish a Daily Climb successfully. | Run |

The End? still names the original three characters; Watcher's Heart completion has its own mark.
Ascension advances per character, and an Act 4 loss does not undo a qualifying Act 3 clear.
See the [achievement reference](https://slay-the-spire.fandom.com/wiki/Achievements) and [Ascension rules](https://slay-the-spire.fandom.com/wiki/Ascension).

## Combat feats — 19

These predicates are checked within one combat, including some boss combats.
They do not impose an additional requirement to complete the subsequent run.

| Achievement | Earning condition | What it draws attention to |
|---|---|---|
| Shrug It Off | End a victorious combat at exactly one HP. | Survival at the margin |
| Purity | Reduce hand, draw pile, and discard pile to at most three cards combined. | Temporary deck reduction |
| Come At Me | Win a combat while playing no Attack cards. | Other damage sources |
| The Pact | Exhaust twenty cards within one combat. | Exhaust as a usable resource |
| Adrenaline | Hold at least nine Energy during a turn. | Energy accumulation |
| Powerful | Sustain at least ten buffs during combat. | Combining effects |
| Jaxxed | Reach at least fifty Strength in combat. | Offensive scaling |
| Impervious | Accumulate at least 99 Block in combat. | Defensive scaling |
| Barricaded | Accumulate 999 Block in combat. | Extreme defensive scaling |
| Catalyst | Raise one enemy's Poison to at least 99. | Compounding an effect |
| Plague | Defeat three enemies through Poison in one combat. | Applying a strategy across targets |
| Ninja | Play ten Shivs within one turn. | Repeated generated attacks |
| Infinity | Play twenty-five cards within one turn. | Sustaining a card sequence |
| Focused | Reach at least twenty-five Focus in combat. | Orb scaling |
| Neon | Channel nine Plasma orbs within one turn. | Repeated orb generation |
| You Are Nothing | Defeat a boss on the opening turn. | Immediate execution |
| Ooh Donut! | Kill Donu using Feed. | A particular card and target |
| Perfect | Defeat a boss without taking damage. | Preventing incoming damage |
| The Transient | Kill the Transient before its automatic disappearance. | Exceeding an encounter's usual demand |

The underlying thresholds are in the [Steam catalogue](https://steamcommunity.com/stats/646570/achievements/) and [achievement reference](https://slay-the-spire.fandom.com/wiki/Achievements).
Individual references corroborate [Adrenaline](https://www.slaythespire.gg/achievements/Adrenaline), [Barricaded](https://www.slaythespire.gg/achievements/Barricaded), [Catalyst](https://www.slaythespire.gg/achievements/Catalyst), and [Neon](https://www.slaythespire.gg/achievements/Neon).

Two semantic details matter for comparison:

- Come At Me forbids playing the Attack card type; it does not forbid dealing damage.
- Purity concerns the cards remaining in combat piles, not the size of the permanent deck.

The wiki also notes that self-inflicted HP loss need not invalidate Perfect.
Conditions should therefore distinguish game-defined damage from every possible reduction of HP.
See the [achievement notes](https://slay-the-spire.fandom.com/wiki/Achievements).

## Restricted victories — 4

| Achievement | Earning condition | Restriction |
|---|---|---|
| Minimalist | Win with at most five cards in the deck. | Deck size at completion |
| Who Needs Relics? | Win with only one relic. | Relic count at completion |
| Speed Climber | Win before twenty minutes elapse. | Completion time |
| Common Sense | Win with no uncommon or rare cards in the deck. | Card rarity at completion |

These descriptions concern the winning state or completion time.
For example, Minimalist does not require starting with five cards or never having a larger deck.
Common Sense is a rarity restriction, not a requirement that every card literally have Common rarity; Basic cards are allowed.
See the [Steam catalogue](https://steamcommunity.com/stats/646570/achievements/) and [Common Sense reference](https://www.slaythespire.gg/achievements/Common_Sense).

## Completion of the catalogue — 1

| Achievement | Earning condition | Scope |
|---|---|---|
| Eternal One | Earn every other achievement. | Lifetime |

See [Eternal One](https://www.slaythespire.gg/achievements/Eternal_One).

## How the achievements relate to progression

Achievements themselves do not award cards, relics, or permanent stat increases; the [achievement reference](https://slay-the-spire.fandom.com/wiki/Achievements) describes them as contributing to save completion.
Cards and relics enter the available pools through a separate, character-specific progression based on accumulated run score, often described as experience.
See the [unlock overview](https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/) and an example [character unlock table](https://slay-the-spire.fandom.com/wiki/Ironclad#Unlocks).

Some achievements recognize conditions that also advance other systems.
Ascend 0 recognizes access to Ascension, and further clears open higher difficulty for that character.
This is different from earning a tactical achievement such as Catalyst and receiving a new card because of it.
The [Ascension rules](https://slay-the-spire.fandom.com/wiki/Ascension) describe that separate progression.

## Design observations

- **A run can contain several independent accomplishments.**
  Nineteen combat feats plus nine boss milestones give 28 of 46 predicates scoped to a single combat or a moment within it.
  Some of those combats also end an act or run, but their predicates do not add a subsequent completion requirement.
- **Many numbers describe a functioning strategy.**
  Energy, Poison, Focus, repeated cards, and Exhaust each point toward a different way to build a run.
  These are not persistent increases to the character's starting stats.
- **Recognition can teach a surprising distinction.**
  Winning without Attack cards demonstrates alternative damage; reducing combat piles differs from permanently removing cards.
- **Constraints can create another reason to play after a first victory.**
  Minimalist and Who Needs Relics? change acquisition decisions throughout a run.
  Whether Space Prince's equivalent remains interesting is a playtesting question.
- **There is no achievement explicitly requiring a named narrative-event choice.**
  Events can enable the conditions, but the catalogue primarily recognizes combat outcomes and completed builds.
- **Extreme thresholds can reward waiting after the fight is effectively solved.**
  That is a plausible incentive of predicates such as 999 Block, not a measured claim about player behavior.
