# House matrix

A reference for writing Space Prince's narrative encounters across all twelve houses.
Topical sources consulted on 2026-09-07; house geometry added on 2026-10-07.
Use alongside the [planet and sign matrix](PLANET_MATRIX.md) and [encounter authoring spec](../mechanics/ENCOUNTERS.md).
The [house and planet matrix](HOUSE_PLANET_MATRIX.md) develops all 84 placements into wants, possible expressions, and scene seeds, with selected sign variations.

## Using this reference

**Source notes** summarize the linked readings; **editorial direction, stakes, motifs, and scene seeds** are original writing material.
The seeds and worked examples are writing reference material; current encounter copy lives in the [scenario data](../../client/src/data/narrative-scenarios.ts).
Choose a house's human situation first, then use the planetary reference to shape the voice or a chart-conditioned approach.
The house should remain recognizable when its heading is removed.
The [encounter lookup model](../mechanics/HOUSES.md#3-chart-conditioning-model) groups the references by House, Sign, Planet, their placements, and current run state.

Houses, signs, and planets have distinct jobs in this reference: situation, manner, and agency.
This is our authoring convention, informed by the distinction discussed in [The Astrology Podcast, episode 231, opening discussion of houses and signs](https://theastrologypodcast.com/transcripts/ep-231-transcript-significations-of-the-twelve-houses-part-1-houses-1-6/).
Do not construct a house by simply transferring the corresponding sign's personality traits.

## Sources used

- **Wikipedia contributors:** [House (astrology)](https://en.wikipedia.org/wiki/House_(astrology)), especially the twelve individual house sections.
  A core reference for the breadth of each house's contemporary meanings, with a direct section link in every entry below.
  At consultation, the article carried an AI-generated-text notice; the themes used here are checked against the other readings, and its book attributions are not treated as verified quotations.
- **Deborah Houlding, Skyscript:** twelve individually linked house essays, under “Main Rulerships” and “Associated Planets.”
  These accessible extracts from the first edition of *The Houses: Temples of the Sky* supply traditional topics, concrete associations, and planetary joys.
  Her [Angular, Succedent and Cadent](https://www.skyscript.co.uk/horary1d.html) explains the separate question of potency.
- **Firmicus Maternus:** [*Mathesis* II.15–19](https://penelope.uchicago.edu/Thayer/L/Roman/Texts/Firmicus_Maternus/Mathesis/2%2A.html).
  Direct historical basis for the house groups and their relationship to the Ascendant; see the qualifications in [ASTROLOGY.md](ASTROLOGY.md#favorable-and-unfavorable-houses).
- **Cafe Astrology:** [The Houses of the Horoscope](https://cafeastrology.com/houses.html), under the corresponding ordinal house headings.
  Used for contemporary psychological interpretations and differences in emphasis.
  Attribution is to the publisher.
- **Chris Brennan, Kelly Surtees, and Austin Coppock, The Astrology Podcast:** [episode 231 transcript, houses 1–6](https://theastrologypodcast.com/transcripts/ep-231-transcript-significations-of-the-twelve-houses-part-1-houses-1-6/) and [episode 233 transcript, houses 7–12](https://theastrologypodcast.com/transcripts/ep-233-transcript-significations-of-the-twelve-houses-part-2-houses-7-12/).
  Used for the opening house/sign distinction and the Fifth and Twelfth discussions, including differences among the speakers.

The relevant passages above were accessible and read.
Other books and historical authors cited by these pages were not independently consulted.
Wikipedia's citations sometimes overlap with our other sources; agreement here does not establish independent consensus.
These are astrological interpretations used as literary material, not claims about what causes a person's circumstances.

## House structure

This reference is indexed by **House number**.
Topics, diurnal position, angularity, relationship to the Ascendant, favorability, joy assignment, and fixed game ruler are all attributes of that House.
Selecting VI therefore selects its cadency, aversion, Mars joy, and Mercury game ruler together; those attributes do not vary independently across charts.
The chart determines which Sign and Planets are associated with VI, and run state determines their current condition.

**Historical basis:** angularity distinguishes angular, succedent, and cadent houses by their position relative to the four angles.
It concerns potency, separately from favorability.
Firmicus distinguishes the angles, the other favorable places III/V/IX/XI, and the averse places II/VI/VIII/XII; his treatment also allows qualifications and exceptions.
The table below records the fixed whole-sign relationships, not aspects from planets elsewhere in an individual chart.

**Game interpretation:** distinguish the uses of these House attributes when composing its situation:

- **Angularity:** where authority lies, what the Prince can directly affect, and what conditions his agency.
  It supplies narrative emphasis, with no automatic economic multiplier.
- **Favorability:** what support is available and what burdens ordinary options ask him to bear.
  It informs economic composition within the [shared balance requirements](../mechanics/ENCOUNTERS.md#45-housesign-economic-balance), without guaranteeing outcomes or assigning an emotional mood.

The applications below are revisable writing directions, not further historical claims or requirements that every scene follow one formula.
An angular Fourth-house scene can be private, a cadent Ninth-house scene generous, and an averse Second-house scene abundant.
Dignity comes from the Planet–Sign pairing; joy availability combines the House's joy assignment with that Planet's current condition, as described in [chart conditioning](../mechanics/ENCOUNTERS.md#4-chart-conditioning).
Additional aspects from planets elsewhere and precise distance from an angle are deferred.

## Game correspondences

Names, joys, and fixed rulers below match [the house data](../../client/src/data/houses.ts).
The joy assignments are also documented in the linked Skyscript entries.
The fixed ruler column follows the game's natural-zodiac convention; it is separate from the chart's occupants, planetary joy, and a ruler calculated from an actual house cusp.
The geometry columns record traditional classifications; names, fixed rulers, and questions serve the game.
The First contains the Ascendant and is the origin of these relationships, rather than an aspect to itself.

| House | Game name | Angularity | Relation to Ascendant | Joy | Fixed game ruler | Authoring question |
| --- | --- | --- | --- | --- | --- | --- |
| [I](#i--self) | Self | Angular | Origin | Mercury | Mars | How do I arrive as myself? |
| [II](#ii--livelihood) | Livelihood | Succedent | Aversion | — | Venus | What do I need to keep going? |
| [III](#iii--communication) | Communication | Cadent | Sextile | Moon | Mercury | What passes between people who know each other? |
| [IV](#iv--home) | Home | Angular | Square | — | Moon | Where can I set down what I carry? |
| [V](#v--creativity) | Creativity | Succedent | Trine | Venus | Sun | What would I make or enjoy for its own sake? |
| [VI](#vi--labor) | Labor | Cadent | Aversion | Mars | Mercury | Whose body pays for the necessary work? |
| [VII](#vii--relationships) | Relationships | Angular | Opposition | — | Venus | What terms can two people live with? |
| [VIII](#viii--transformation) | Transformation | Succedent | Aversion | — | Mars | What becomes mine when someone else is gone? |
| [IX](#ix--pilgrimage) | Pilgrimage | Cadent | Trine | Sun | Jupiter | What changes when the familiar world is no longer the measure? |
| [X](#x--achievement) | Achievement | Angular | Square | — | Saturn | What am I willing to answer for in public? |
| [XI](#xi--friendship) | Friendship | Succedent | Sextile | Jupiter | Saturn | What becomes possible because others want it too? |
| [XII](#xii--the-hidden) | The Hidden | Cadent | Aversion | Saturn | Jupiter | What remains of a life that others cannot see? |

Mars and Saturn containing a smaller burden in their joy houses is the game's adaptation, not a claim that all traditions interpret joy this way.
Use the existing [conditioning rules](../mechanics/ENCOUNTERS.md#4-chart-conditioning), including their unlock, affliction, and dignity requirements.

## I — Self

**Source notes**

- [Wikipedia, First House](https://en.wikipedia.org/wiki/House_(astrology)#First_House_(House_of_Self)): identity, appearance, outward presence.
- [Houlding, First House](https://www.skyscript.co.uk/1.html): bodily life and vitality, personal expression, and the person initiating an encounter; Mercury's joy.
- [Cafe Astrology, First House](https://cafeastrology.com/houses.html): self-image and the first response to experience.

**Editorial direction:** make the Prince present as a particular person, with a body and a way of introducing himself.
Let his own gesture establish the terms on which he is met.
**Stakes:** being recognized; choosing how to appear; admitting that a once-familiar image no longer fits.
**Motifs:** a portrait sitting, a basin at face height, a name awaiting an answer, clothes fitted to the body standing there.

**Scene seed A:** A painter has sketched you as you stood before the journey: shoulders square, eyes untroubled.
You are sitting in front of her now, and she has not yet lifted her brush.

**Scene seed B:** A wrestling master asks you to show the stance you learned as a child.
Your feet remember it before you decide whether it still suits you.

**Game fit:** `self-still-water` can distinguish attending to oneself from maintaining a demanding pose; `self-stake` can distinguish force from an approach discovered through Mercury.
Keep the attention on embodied identity; the Tenth concerns what an audience makes of it.
Options can distinguish exertion from attending to the body without rewarding angularity itself.

## II — Livelihood

**Source notes**

- [Wikipedia, Second House](https://en.wikipedia.org/wiki/House_(astrology)#Second_House_(House_of_Value)): possessions, resources, self-worth.
- [Houlding, Second House](https://www.skyscript.co.uk/2.html): income, goods, material support, and losses; movable possessions are distinguished from Fourth-house land and buildings.
- [Cafe Astrology, Second House](https://cafeastrology.com/houses.html): security and value expressed through resources.

**Editorial direction:** put a usable resource within reach and make the effort of securing it tangible.
A seller's terms can constrain acquisition while leaving a meaningful choice about what to keep available.
**Stakes:** enough for today; reserves for scarcity; accepting a smaller return that leaves strength intact.
**Motifs:** grain measures, a repaired boot sole, a purse counted twice, provisions too heavy for their owner.

**Scene seed A:** A grain seller pays you a handful of coin for sweeping beneath his scales.
The spilled grain under the wagon is yours too, if you can lift the axle clear.

**Scene seed B:** A widow is selling the winter stores she can no longer carry to her new lodging.
She has priced each sack, but offers a different price for moving the whole stack before rain reaches it.

**Game fit:** `livelihood-coin` preserves a modest gain beside a costly larger one; `livelihood-lender` makes the strain of earning visible.
The central question is sufficiency, not whether wanting money reveals a moral flaw.
Price the particular means of acquisition; shared aversion does not require the same offers as the Eighth.

## III — Communication

**Source notes**

- [Wikipedia, Third House](https://en.wikipedia.org/wiki/House_(astrology)#Third_House_(House_of_Sharing)): siblings, communication, nearby life.
- [Houlding, Third House](https://www.skyscript.co.uk/3.html): relatives and neighbors, repeated short journeys, letters, messengers, and reports; the Moon's joy.
- [Cafe Astrology, Third House](https://cafeastrology.com/houses.html): everyday learning and exchanges with nearby people.

**Editorial direction:** give a familiar connection a small interruption that can be resolved here.
Help can arrive through an exchange whose completion depends on another person.
**Stakes:** being understood by someone close; preserving an ordinary exchange; discovering how much was carried by a daily habit.
**Motifs:** a sibling's recognizable handwriting, a ferry signal, a neighbor's spare latch, a message worn thin by folding.

**Scene seed A:** A ferryman asks you to read a letter from his sister, who lives within sight on the opposite bank.
He laughs at the opening line, then asks you to read it again more slowly.

**Scene seed B:** The footbridge has washed away on market morning.
Across the stream, two neighbors are trying to exchange a basket and a piece of news neither will shout.

**Game fit:** `communication-letter` can offer recovery through an understood message or an immediate errand; `communication-bridge` can turn local familiarity into the Moon's easier crossing.
Keep journeys close and relationships specific; the Ninth asks what distance changes.
Ordinary assistance can be useful before the joy condition improves its terms.

## IV — Home

**Source notes**

- [Wikipedia, Fourth House](https://en.wikipedia.org/wiki/House_(astrology)#Fourth_House_(House_of_Home_and_Family)): family, roots, home, emotional security.
- [Houlding, Fourth House](https://www.skyscript.co.uk/4.html): ancestry, land, buildings, and the beginning or ending of a matter, with a traditional paternal association.
- [Cafe Astrology, Fourth House](https://cafeastrology.com/houses.html): private security, nurturing, and familial conditioning.

**Difference to preserve:** Cafe Astrology associates the Fourth with the maternal parent, unlike Houlding's paternal emphasis.
Write the actual household relationship without treating either assignment as universal.

**Editorial direction:** make shelter carry a history, including histories the Prince did not choose.
Establish who can set the household terms; the authority can be intimate and private.
**Stakes:** belonging without explanation; accepting inherited care; deciding what remains when a household ends.
**Motifs:** heights marked on a doorframe, a familiar hearthstone, a family well, the last bed in an emptied house.

**Scene seed A:** An elderly host turns down a bed that has stood ready since her son left.
She asks only that you leave the shutters as he liked them.

**Scene seed B:** A house is being dismantled around the hearth where three generations cooked.
Under its loose stone lies a blanket folded around the key to a door already gone.

**Game fit:** `home-hearth` supports individual or shared shelter and the existing conditional revival; `home-buried` can connect recovery or salvage to the end of a household.
Revival here is the game's fantasy of being welcomed back, not a sourced promise about this house.
Shelter can offer recovery on different immediate terms without making private authority a bonus.

## V — Creativity

**Source notes**

- [Wikipedia, Fifth House](https://en.wikipedia.org/wiki/House_(astrology)#Fifth_House_(House_of_Pleasure)): children, romance, creativity, recreation.
- [Houlding, Fifth House](https://www.skyscript.co.uk/5.html): pleasure, courtship, gifts, children, celebrations, performance, and games; Venus's joy.
- [Cafe Astrology, Fifth House](https://cafeastrology.com/houses.html): individual expression and the enjoyment of creating.

**Difference to preserve:** in [episode 231's Fifth-house discussion](https://theastrologypodcast.com/transcripts/ep-231-transcript-significations-of-the-twelve-houses-part-1-houses-1-6/), Brennan distinguishes older associations with children from later emphases on pleasure and creativity.
Coppock's discussion extends creative activity beyond making art.
Our scenes should leave room for play, affection, and participation alongside craft.

**Editorial direction:** let making or enjoying something matter before it becomes useful or impressive.
Give him room to sustain an occasion, join in, or enjoy what others have made.
**Stakes:** showing an imperfect creation; making someone delighted; joining in without needing to excel.
**Motifs:** a child composing a song, festival masks drying on a line, an invitation to dance, a ribbon given without ceremony.

**Scene seed A:** The festival masks have been painted for every face except your own.
A child offers you her brush while the first dancers gather in the square.

**Scene seed B:** At a family feast, a child has made a song for her grandfather, but every verse follows a different tune.
She holds out the fiddle as he settles into the front row.

**Game fit:** `creativity-dice` can contrast effort, recovery, and Venus's invitation to play; `creativity-song` can make creative participation the decision itself.
Keep public rank for the Tenth and shared civic aims for the Eleventh.
Ordinary participation can bring pleasure or relief without concealing a compulsory burden.

### Worked example: the child's song

Use seed B with the existing `creativity-song` effects.
The identifiers below are retained for comparison; labels and consequences are original proposed copy.

| Option ID | Action | Immediate consequence | Existing effects |
| --- | --- | --- | --- |
| `finish` | Fit the verses to one tune | Your fingers ache by the final verse, and her grandfather asks to hear it once more. | Chosen affliction +48; Light +48 |
| `rough` | Follow every change of tune | You scramble through the changes while the child sings louder to keep you with her. | Chosen affliction +24; Light +24 |
| `sleep` | Listen from the table | She sings it unaccompanied, keeping time against her grandfather's knee. | No change |

With `joyStrong` (Venus), `share` replaces `rough`:

| Option ID | Action | Immediate consequence | Existing effects |
| --- | --- | --- | --- |
| `share` | Invite her grandfather to join in | He finds a refrain she likes, leaving you room to rest between the verses. | Chosen affliction −48; Light +12 |

The relief comes through an easier way to participate in the scene.
Declining still permits an ordinary, affectionate outcome.

## VI — Labor

**Source notes**

- [Wikipedia, Sixth House](https://en.wikipedia.org/wiki/House_(astrology)#Sixth_House_(House_of_Health_and_Service)): health, routine, work, service.
- [Houlding, Sixth House](https://www.skyscript.co.uk/6.html): illness, those providing care, subordinate labor, and small animals; Mars's joy.
- [Cafe Astrology, Sixth House](https://cafeastrology.com/houses.html): habits and service as daily practice.

**Difference to preserve:** Houlding emphasizes hardship and dependency; Cafe Astrology also allows satisfaction in useful daily work.
Service need not be humiliating, and illness need not become a lesson about character.

**Editorial direction:** show the conditions of necessary work and who has the power to change them.
A limited say over the task can still leave meaningful choices about method, effort, or care.
**Stakes:** finishing without exhaustion; receiving care while work remains; refusing an unreasonable demand.
**Motifs:** blunted shears, a ration bell, a washing bench, a stable hand tending a lame animal after the shift.

**Scene seed A:** The last shearer has split his palm, and the flock is still waiting in the pen.
The steward offers his wages to whoever finishes before the evening bell.

**Scene seed B:** At the laundry, a worker keeps losing her grip on the wet sheets.
The wash is already paid for, and the keeper has set a chair beside the furnace where the cloth dries.

**Game fit:** `labor-field` makes concentrated or distributed toil concrete; `labor-fever` distinguishes pushing on, paid care, and a limited respite.
Mars's conditioned approach should change a tool, method, or boundary that reduces the burden.
Charge for the work or care at hand; cadency supplies no additional penalty.

## VII — Relationships

**Source notes**

- [Wikipedia, Seventh House](https://en.wikipedia.org/wiki/House_(astrology)#Seventh_House_(House_of_Balance)): partnership, agreements, known opponents.
- [Houlding, Seventh House](https://www.skyscript.co.uk/7.html): spouses, business partners, contracts, negotiations, and openly opposed parties.
- [Cafe Astrology, Seventh House](https://cafeastrology.com/houses.html): compromise and interdependence in one-to-one relationships.

**Editorial direction:** place another person's stated needs across from the Prince's own.
Make each party capable of changing the immediate agreement.
**Stakes:** accepting help without surrendering agency; negotiating a fair share; remaining in relation through disagreement.
**Motifs:** two signatures on one contract, a shared oar, a boundary stone, a rival who keeps an agreement.

**Scene seed A:** A rival traveler has hired the only boat across the inlet.
They leave the second oar beside you and ask whether you can agree on a pace.

**Scene seed B:** Two partners are dividing their caravan at a crossroads.
Both want the easier cart, and each offers to pay you to take the other's place at its shafts.

**Game fit:** `relationships-stranger` can make accepted assistance a negotiated meeting; `relationships-bargain` can offer carrying, paying, or a fairer arrangement through the strong ruler.
The other person's position should be intelligible even when it inconveniences the player.
Let the options redistribute immediate effort or payment between the parties.

## VIII — Transformation

**Source notes**

- [Wikipedia, Eighth House](https://en.wikipedia.org/wiki/House_(astrology)#Eighth_House_(House_of_Transformation)): shared resources, death, intimacy, transformation.
- [Houlding, Eighth House](https://www.skyscript.co.uk/8.html): death, fear, bereavement, inheritance, and other people's money, including financial obligations.
- [Cafe Astrology, Eighth House](https://cafeastrology.com/houses.html): shared power and resources; change through intimacy.

**Difference to preserve:** Houlding cautions against making death and loss automatically signify beneficial growth.
Our title “Transformation” should leave space for a loss that remains a loss.

**Editorial direction:** make the transfer or ending concrete before giving it a symbolic meaning.
An ending can leave him a choice about what to accept or relinquish even when he cannot reverse it.
**Stakes:** accepting what a death leaves behind; separating an inheritance from its burden; wanting a particular presence returned.
**Motifs:** a disputed will, a dead person's account book, an unclaimed funeral lamp, property divided in front of witnesses.

**Scene seed A:** Your name appears in a stranger's will beside a locked strongbox.
The executor offers to open it for a share, or hand over the box with its rusted lock intact.

**Scene seed B:** At the mortuary, each lamp bears a name spoken by someone still living.
The keeper leaves one wick unlit and asks whom you came to remember.

**Game fit:** `transformation-inheritance` preserves the choice between taking the strain or sharing the return; `transformation-rite` gives the existing revival a specific absence to answer.
Keep debts inside an immediate settlement; later obligations require mechanics the game does not have.
A return may accompany the ending without compensating emotionally for the loss.

## IX — Pilgrimage

**Source notes**

- [Wikipedia, Ninth House](https://en.wikipedia.org/wiki/House_(astrology)#Ninth_House_(House_of_Purpose)): distant travel, philosophy, higher learning.
- [Houlding, Ninth House](https://www.skyscript.co.uk/9.html): pilgrimage, foreign places, religious practice, study, books, dreams, and divination; the Sun's joy.
- [Cafe Astrology, Ninth House](https://cafeastrology.com/houses.html): belief and meaning sought beyond familiar experience.

**Editorial direction:** let a distant place or practice resist the Prince's existing account of the world.
Guidance can be readily available while authority over the unfamiliar setting belongs to others.
**Stakes:** being willing to learn; testing a conviction; taking part before fully understanding.
**Motifs:** a map centered on another city, pilgrims washing dust from their feet, an unfamiliar observance, two translations of one passage.

**Scene seed A:** In a distant school, your homeland appears at the margin of the map.
The teacher asks you to explain the roads you know while a student moves the lamp to see them.

**Scene seed B:** At a mountain shrine, the pilgrims keep watch facing away from the sunrise.
An attendant offers you a place among them and a room if you would rather sleep.

**Game fit:** `pilgrimage-teacher` offers study or demonstration; `pilgrimage-vigil` offers participation, rest, or the Sun's less exhausting understanding of the practice.
Give a teacher a subject and an observance an action; avoid interchangeable pronouncements of wisdom.
Receiving ordinary help need not depend on mastering the practice or accepting its beliefs.

## X — Achievement

**Source notes**

- [Wikipedia, Tenth House](https://en.wikipedia.org/wiki/House_(astrology)#Tenth_House_(House_of_Enterprise)): career, reputation, public standing.
- [Houlding, Tenth House](https://www.skyscript.co.uk/10.html): profession, recognition, command, public authority, and those who enforce decisions.
- [Cafe Astrology, Tenth House](https://cafeastrology.com/houses.html): responsibility, contribution, and one's position in society.

**Difference to preserve:** Houlding associates the Tenth with the mother; Cafe Astrology gives it a paternal emphasis.
Neither assignment is needed to write public responsibility.

**Editorial direction:** show what becomes visible when work acquires a name, a title, or an audience.
Establish whose decision has public force and how the Prince can exercise or answer it.
**Stakes:** receiving deserved recognition; accepting scrutiny; choosing the scale of an undertaking.
**Motifs:** a seal of office, scaffolding left up for an unveiling, a public ledger, a name cut into finished stone.

**Scene seed A:** The council has set a chair for you above the people who repaired the road.
Beside it lies the survey you must explain before they announce your reward.

**Scene seed B:** A mason has left room for one more name on the bridge's dedication stone.
There is also an unfinished arch, for anyone who wants a larger inscription.

**Game fit:** `achievement-summit` can separate recognition, capable authority, and a quiet recovery; `achievement-monument` makes greater public distinction cost greater effort.
Honor can be welcome and deserved without requiring a warning about vanity.
Public weight changes what the choice means, with prices still governed by the shared economy.

## XI — Friendship

**Source notes**

- [Wikipedia, Eleventh House](https://en.wikipedia.org/wiki/House_(astrology)#Eleventh_House_(House_of_Blessings)): friendship, community, collective hopes.
- [Houlding, Eleventh House](https://www.skyscript.co.uk/11.html): friends, supporters, benefactors, encouragement, and hopes; Jupiter's joy.
- [Cafe Astrology, Eleventh House](https://cafeastrology.com/houses.html): groups and the aims people hold in common.

**Editorial direction:** allow support to arrive because someone remembers, welcomes, or shares a purpose with the Prince.
Give that backing a concrete use in the present undertaking.
**Stakes:** accepting generosity; having a place in an undertaking; discovering that help need not be purchased.
**Motifs:** a chair pulled into a circle, a purse collected by several hands, a friend's recommendation, a banner mended in company.

**Scene seed A:** Friends have collected enough for your next stretch of road and spread supper on a borrowed table.
One has brought the dish you used to ask for and says it will not travel well.

**Scene seed B:** A group of travelers is preparing a common meal in a courtyard they have hired together.
They move their bundles to make room for yours before asking whether you can stay to help.

**Game fit:** `friendship-gift` preserves money or shared recovery as real gifts; `friendship-favor` lets assistance and Jupiter's stronger welcome ease the whole chart.
Do not conceal a future debt inside generosity when the game records none.
Individual and shared assistance can be ordinary alternatives before Jupiter adds an option.

## XII — The Hidden

**Source notes**

- [Wikipedia, Twelfth House](https://en.wikipedia.org/wiki/House_(astrology)#Twelfth_House_(House_of_Sacrifice)): seclusion, private life, unconscious experience.
- [Houlding, Twelfth House](https://www.skyscript.co.uk/12.html): confinement, banishment, persecution, secret hostility, and places of isolation; Saturn's joy.
- [Cafe Astrology, Twelfth House](https://cafeastrology.com/houses.html): retreat, release, and what remains out of view.

**Difference to preserve:** [episode 233's Twelfth-house discussion](https://theastrologypodcast.com/transcripts/ep-233-transcript-significations-of-the-twelve-houses-part-2-houses-7-12/) distinguishes imposed isolation from chosen withdrawal.
Surtees includes attending to others' suffering; Coppock compares monastic and prison cells and discusses useful solitude.
Brennan includes hidden enemies, while Coppock prefers locating enemies in the Sixth and emphasizing self-undoing here.
These are attributed differences, not a combined universal definition.

**Editorial direction:** put a particular life behind the concealment, and establish who controls access to it.
The Prince can change a bounded part of the situation without acquiring power over the whole confinement.
**Stakes:** being remembered after exclusion; keeping company with an absence; limiting how much sorrow one takes on.
**Motifs:** a visitor's bench outside a locked cell, a letter that cannot be answered, a retreat bell, a name scratched where nobody reads it.

**Scene seed A:** Outside the city wall, an exile unfolds a letter that he is forbidden to answer.
He asks you to read it aloud once more, though he mouths every word before you speak.

**Scene seed B:** A former prisoner has returned to find his cell sealed, with the name he carved just visible through a gap in the masonry.
He offers you payment for a rubbing of the letters, or for the stone itself.

**Game fit:** `hidden-weight` can make the cost of attending to an excluded life specific; `hidden-door` can center a remnant of confinement instead of an unspecified prize.
Saturn's alternative should establish a workable limit within the situation.
Tie burdens to the specific action or obstacle, leaving room for wanted solitude and relief.
The letter belongs here because its recipient is barred from answering, not simply because it contains a secret.

### Worked example: the carved name

Use seed B with the existing `hidden-door` effects.

| Option ID | Action | Immediate consequence | Existing effects |
| --- | --- | --- | --- |
| `glance` | Reach in and take a rubbing | You draw your scraped arm back through the gap, and he smooths the paper against his coat. | Chosen affliction +36; Light +24 |
| `through` | Climb inside and free the stone | He takes the stone from your aching hands and turns the carved face toward the light. | Chosen affliction +60; Light +72 |
| `back` | Leave the inscription where it is | He sits beside the wall and looks again through the gap. | No change |

With `joyPresent` (Saturn), `measure` replaces `glance`:

| Option ID | Action | Immediate consequence | Existing effects |
| --- | --- | --- | --- |
| `measure` | Measure the gap before reaching in | The narrow rubbing comes free with only a scrape, and he traces the letters with one finger. | Joy affliction +12; Light +24 |

The smaller burden remains scoped to Saturn by the existing resolver.
The objects change hands within this encounter and create no inventory or later obligation.

## Applying the matrix to scenario copy

For new encounter designs, use the [composition guidance](../mechanics/ENCOUNTERS.md#46-composing-and-revising-a-scenario) to identify what each influence contributes.
For copy revisions that preserve current mechanics:

1. Read the house's source notes and choose one specific human stake.
   Use its structural character to establish agency, support, and burdens.
2. Establish it through a person, place, or object the player can picture.
3. Map actions and immediate consequences onto the existing scenario's effects and predicates.
4. Use [PLANET_MATRIX.md](PLANET_MATRIX.md) for the planetary voice behind a current joy or ruler option.
   New occupant approaches draw on [HOUSE_PLANET_MATRIX.md](HOUSE_PLANET_MATRIX.md) under the encounter spec.
5. Read the prompt without its house heading and check that its situation still carries the intended meaning.

The worked examples preserve their current effect values; the other seeds are starting points, not complete option specifications.
When revising copy, preserve scenario IDs, amounts, costs, targets, predicates, and at most three visible choices unless a separate mechanics change is agreed.
Keep the existing valid exit at zero Light and with only the Moon unlocked.
The [scenario data](../../client/src/data/narrative-scenarios.ts) and [resolver](../../client/src/game/narrative.ts) remain authoritative for those details.

Avoid promises of future rewards, tracked relationships, persistent possessions, or random wagers.
Keep the numerical explanation in the generated aside and make the consequence describe what just happened.
An encounter can end in delight, irritation, relief, or an unresolved feeling; it does not need to announce a lesson.
