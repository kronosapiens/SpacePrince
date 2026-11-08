# Writing narrative scenes

The maintained guide for the house–sign scene catalogue: how a scene is developed, how its choices are composed, and how drafts are compared.
The [prose and voice guide](VOICE.md) sets the Gibran-inspired tone through passages from *The Prophet* and instructions for adapting their techniques.
The catalogue holds 720 scenes, five for each of the 144 house–sign pairs, in the [house modules](../../client/src/data/narrative) assembled by [narrative-scenarios.ts](../../client/src/data/narrative-scenarios.ts).
Each scene's one-line brief, with its source reasoning, sits in the [briefs](#briefs) beside this file.
Economic terms, eligibility, and resolution are specified in [ENCOUNTERS.md](../mechanics/ENCOUNTERS.md); the references a scene draws on are grouped in [HOUSES.md §3](../mechanics/HOUSES.md#3-chart-conditioning-model).
The [narrative voice research](../research/NARRATIVE_VOICE.md) retains the source comparisons and reader feedback behind the guidance.
The catalogue is complete; this guide serves revisions, replacements, and additions, and its prices follow the balancing work tracked in [issue #12](https://github.com/kronosapiens/SpacePrince/issues/12).

## Authoring workflow

1. Develop a [brief](#plan-variety-with-briefs) from the house and sign references, identifying the people, their concern or pleasure, and possible participation.
2. Draft the scene and possible actions using the source passages and instructions in [VOICE.md](VOICE.md).
   Keep the situation understandable without the author's explanation.
3. [Review the prose](#review-the-prose) before assigning prices or mechanical effects.
   Use [comparisons](#review-through-comparisons) when a writing question remains unresolved.
4. [Compose the economic offers](#choices-and-economics) from the participation the scene supports.
5. Review the integrated scene and choices, then validate their resolution under [ENCOUNTERS.md](../mechanics/ENCOUNTERS.md#10-validation).
   If an economic change alters the fiction, return it to prose review.

## Develop the scene and participation together

Use the selected [house and sign references](../mechanics/HOUSES.md#3-chart-conditioning-model) to establish a particular situation.
Give someone an understandable concern or feeling: Mara wants to be addressed by name; a brother wants one sausage for the dark.
Include a few possible directions for participation.
These are enough to assess the scene without enumerating every action or assembling a finished menu.

Ask what makes participating a meaningful decision.
Most decision encounters need something unresolved: a demand, competing wants, an opportunity with conditions, or a reason different forms of participation matter.
Pleasure can contain tension without becoming a quarrel.
Avoid making every encounter a moral confrontation.
Let the situation determine the number of choices; an additional character needs a purpose beyond supplying another option.

Keep the Prince's motive open during this pass.
Other characters can express wants directly; the Prince's eventual drive and the player's experience remain distinct under [DRIVES.md](DRIVES.md).

## Let the sign describe the house's people and places

Under whole-sign houses a Prince always meets the same sign in each house, so the sign makes that house the Prince's own.
Following the [sign notes](../research/SIGN_NOTES.md#how-a-sign-qualifies-a-house), the sign describes the people, places, season, and manner of the house's affairs, not the Prince.
In the House IV test, Libra gave a household arguing over courtesy, Capricorn the longest night and the winter stores, Leo a father's harvest title, and Pisces a flooded house that keeps taking people in.
Each changed who was present and what they wanted, not only the backdrop.

A sign's planets of dignity and debility often name its tensions: Capricorn's Saturn, Mars, Moon, and Jupiter map onto thrift, labor, comfort, and generosity deferred.
Use them as a source of situations, not as a checklist.

## Characters

Names are for flavor.
Each scene's relationships stand alone: a Prince's rising sign selects a pool of 60 scenes, and they need not agree on who that Prince's mother or brother is.
Write so a scene does not depend on the Prince having exactly one of anyone.
Villains, antagonists, and epic stakes are out of register; the people in a scene want ordinary things for understandable reasons.

## Voice and length

Use [VOICE.md](VOICE.md) for prose style, imagery, rhythm, and reflection.
For house scenes:

- Aim for **30–50 words in one paragraph**, excluding participation notes; reconsider anything above 60.
  Shorter scenes need no padding, and necessary context can justify an exception.
  The [selected FTL and Slay the Spire openings](../research/NARRATIVE_VOICE.md#opening-length-comparison) inform this target without establishing a corpus average.
- Avoid generic reassurance, unsupported predictions, prescribed responses, and assumptions about the Prince's personality.
  The encounter's sign is not necessarily the Prince's Sun sign.
- Keep mechanics out of the prose; amounts and costs belong in the option's aside ([ENCOUNTERS.md §9](../mechanics/ENCOUNTERS.md#9-prose-and-mechanical-copy)).

## Review the prose

Read the scene and possible participation before its drafting rationale.
Apply [VOICE.md](VOICE.md) while checking:

- What is happening, and what matters to the people here?
- What does each response change, and is that understandable without interpreting a metaphor?
- What does the imagery or reflection add to the reader's understanding?
- Do the sentences flow when read aloud, and does the dialogue suit the speaker?
- Does the Prince retain room to respond without accepting an assigned motive or feeling?

Across a batch, check for repeated situations, sentence shapes, and uniformly wise or solemn speakers.
Revise unclear situations before polishing their cadence.

## Choices and economics

Once the scene and participation are convincing, turn the participation into choices.
A developed option is **choice narration and economic effect**; there is no separate outcome narration.
Use the [encounter economy and eligibility rules](../mechanics/ENCOUNTERS.md) and the going rates in [economy.ts](../../client/src/data/economy.ts).

- **Compose a small set of choices.**
  Trades exchange Light, affliction, recovery, or run-long stat gains.
  Gifts and mutually exclusive benefits need no matching payment: choosing one can mean forgoing another.
  Include a valid way through at zero Light and every unlock tier; it may be a gift, an exit, or a harmful or fatal choice.
  A compulsory cost follows from the situation already entered, rather than a penalty invented for declining an optional offer.
- **Vary the decision.**
  Use the [choice structures in ENCOUNTERS.md §1.2](../mechanics/ENCOUNTERS.md#12-choice-families): choose a benefit, commitment size, payment, or concentrated versus distributed effects.
  Their example amounts are provisional; let the situation justify the offers.
  Compare recovery with Resolve's immediate capacity, group effects with actual lit recipients, and costs after occupant terms.
  Keep the whole visible menu within five choices, including joy and revival, and use at most one independently chosen planet per option.
- **The house guides the terms.**
  Houses that aspect the Ascendant generally offer milder, more dependable benefits and occasional unavoidable costs; II, VI, VIII, and XII can carry more entry risk and greater potential benefits.
  Use the going rates as a reference and compare opportunities across the house–sign pool and representative run states.
  Do not require the same surplus from every choice.
  Count harmless choices across the whole menu, including free benefits and Light losses clamped at zero.
  Compare complete outcomes: recovery or Resolve can offset a nominal affliction payment, and joy or favorable occupants may remove a cost.
  Value recovery at 2 Light per point and affliction taken at 3, as in [ENCOUNTERS.md §6](../mechanics/ENCOUNTERS.md#6-provisional-amounts).
- **The fiction justifies each exchange.**
  Revise the fiction if it does not support the proposed exchange.
  A disagreement alone does not justify affliction; leaving shelter, hard work, or a cold floor can.
  An obvious response should not disappear solely to manufacture a cost.
- **Joy houses add a joy choice.**
  In the seven houses with a joy, each scene also writes one choice for its joyful planet, shown when that planet is present under [ENCOUNTERS.md §4.1](../mechanics/ENCOUNTERS.md#41-planetary-joys).
  It offers better terms than the scene's trades, or an exchange they lack, in that planet's manner.
  It can change the action, benefit, or recipients as well as the price.
- **Revival where a return fits.**
  Add a revival choice where the house supports a return; every House IV scene has one.
  It costs the flat revival price and appears only when a planet is combusted.
- **Planets in the house are not written.**
  Their effect on existing costs is computed under [ENCOUNTERS.md §4.2](../mechanics/ENCOUNTERS.md#42-occupants-and-dignity); write scenes that work for any occupant.

Options may deliberately offer unequal economic value when the difference gives the player a meaningful reason to sacrifice an advantage.
The morally troubling choice may be the economically strongest one, as when letting Mara's correction pass buys a cheap supper.
Make the advantage being surrendered clear, and let the player decide whether refusing it is worth the cost.
Avoid automatically compensating that refusal with another reward, or making every decent act expensive.

## Plan variety with briefs

Before writing prose, give each scene a one-line brief: who is there, which side of the sign drives it (season, trade, place, or manner), its register (gift, pleasure, dilemma, burden, or quarrel), and its economic choices.
Review the briefs down each house and across each sign before writing, to catch repetition such as every Capricorn scene turning on thrift.
Five scenes in one house–sign pair should differ in people, register, and economic decisions.
Mix the choice structures where the fiction supports them; there is no requirement to assign one scene to each structure.
Apply the [authoring workflow](#authoring-workflow) to each batch.
Review across batches for repeated situations and economic menus, and playtest several rising signs so coverage is not judged from one Prince alone.

## Review through comparisons

Use comparisons when a question about the scene or voice remains unresolved.
Compare a small number of scenes before expanding a change.
Show the scene and possible participation without an explanation of why the writing is supposed to work.

1. Establish whether the situation holds interest and whether participation matters.
   If neither version does, revise the situation before comparing sentence polish.
2. Compare two constructions that test an unresolved writing question.
   Keep the circumstances and participation directions steady where possible, and identify when the comparison changes more than wording.
   Avoid retesting an accepted preference through nearly identical examples.
3. Invite **A, B, both, or neither**, with a reason or the detail that decided it.
   Distinguish the reader's feedback from our interpretation and proposed revision.
   Mixed judgments can preserve a useful feature of the less-preferred version.
4. Revise and test the lesson on a fresh scene, including a different emotional register.
   Keep only feedback useful to the next iteration.
   A model's approval does not establish the reader's preference or readiness to generate at scale.

The [research record](../research/NARRATIVE_VOICE.md#scene-development-feedback) retains the reader feedback from catalogue development.

## House IV worked examples

House IV aspects the Ascendant, so its offers generally favor the Prince.
The gains below measure each offer against its exit at the going rates in [ENCOUNTERS.md §6](../mechanics/ENCOUNTERS.md#6-provisional-amounts): recovery at 2 Light per point, affliction taken at 3.
The scenes deliberately offer different values and do not establish balance across signs.
Newer scenes also use the [expanded choice structures](../mechanics/ENCOUNTERS.md#12-choice-families), including gifts whose tradeoff is the benefit forgone.
House IV has no joy.
Every scene adds a revival choice for 180 Light when a planet is combusted.

### IV / Libra — Mara

**Brief:** an uncle and the woman who raised you; Libra's courtesy and fairness; dilemma; a cheap recovery or affliction for Light.

> At supper, your uncle calls for “the girl.”
> The woman who taught you to tie your shoes sets down the bread.
> “My name is Mara,” she says.

| Choice | Effect | Gain |
| --- | --- | --- |
| Let it pass, and finish your supper. | Pay 24 Light: recover 24 on a chosen planet | +24 |
| Tell your uncle her name, and leave his table. | Take 24 affliction on a chosen planet: +96 Light | +24 |
| Thank Mara by name. | Exit | 0 |
| *If a planet is combusted:* Ask Mara to set another place. | Pay 180 Light: revive a chosen planet | |

The comfortable choice is the bargain, and the decent middle course takes nothing.
Leaving costs the supper and a night on the road rather than the disagreement itself.

### IV / Capricorn — the sausage

**Brief:** a mother and a brother; the longest night and the winter stores; dilemma; a cheap recovery or affliction for Resolve.

> It is the longest night, and your mother is salting the whole pig for spring.
> Your brother comes in red from the cold, holding up one sausage he kept back.
> “Just one,” he says, “for the dark.”
> Your mother doesn't look up.
> “Ask him what we eat in March.”

| Choice | Effect | Gain |
| --- | --- | --- |
| Cook it with him at the hearth. | Pay 24 Light: recover 24 on a chosen planet | +24 |
| Take the knife and salt with your mother until dawn. | Take 12 affliction on a chosen planet: +12 Resolve on it | +24 |
| Hang it with the rest. | Exit | 0 |
| *If a planet is combusted:* Bring whoever's out in the cold to the fire. | Pay 180 Light: revive a chosen planet | |

An earlier direction, promising your mother your own share in March, was dropped because the game cannot track the promise.

**With planets in the house**, under [ENCOUNTERS.md §4.2](../mechanics/ENCOUNTERS.md#42-occupants-and-dignity):

| In the Fourth | Cook | Salt | Revive |
| --- | --- | --- | --- |
| Empty | Pay 24, recover 24 (+24) | Take 12, +12 Resolve (+24) | 180 |
| Mercury, neutral | Pay 24, recover 24 (+24) | Take 12, +12 Resolve (+24) | 180 |
| Saturn, domicile | Recover 24, free (+48) | +12 Resolve, free (+60) | 156 |
| Moon, detriment | Pay 48, recover 24 (0) | Take 24, +12 Resolve (−12) | 204 |
| Saturn and Moon | As Mercury | As Mercury | 180 |

### IV / Leo — the harvest wrestle

**Brief:** a father and the farmhands; Leo's harvest and pride; pleasure with a challenge; affliction for Afflict or a larger sum of Light.

> Every harvest, your father wrestles the strongest hand on the farm, and every harvest he wins.
> This year his knee is strapped, and the farmhands are looking at you.
> He is already rolling up his sleeves.
> “Well?” he says.
> “Someone has to lose to me.”

| Choice | Effect | Gain |
| --- | --- | --- |
| Wrestle him in earnest. | Take 12 affliction on a chosen planet: +12 Afflict on it | 0 |
| Take his place against the strongest hand. | Take 36 affliction on a chosen planet: +132 Light | +24 |
| Wrestle, and let him win. | Exit | 0 |
| *If a planet is combusted:* Save a place at the harvest table for the one who's been away. | Pay 180 Light: revive a chosen planet | |

The Afflict trade comes out even at the going rates.
An early risk was drift toward House V's games; the father's injury and title keep it a household matter.

### IV / Pisces — the flood

**Brief:** an aunt, a fisherman's widow and her boys; Pisces' water and open house; dilemma; affliction for Fortune or Light for recovery across the chart.

> The river is over the mill-race again, and your aunt has taken in another family: a fisherman's widow and her boys, asleep by the stove.
> That makes eleven under this roof.
> “They could have your bed,” she says, already apologizing, “just until the water goes down.”

| Choice | Effect | Gain |
| --- | --- | --- |
| Give them your bed. | Take 12 affliction on a chosen planet: +6 Fortune on it | 0 |
| Offer the barn loft instead. | Pay 48 Light: recover 12 on every lit planet | −24 to +120 |
| Tell your aunt the house is full. | Exit | 0 |
| *If a planet is combusted:* Make room for one more. | Pay 180 Light: revive a chosen planet | |

The loft's gain depends on how many planets are lit: −24 with one, +48 with four, and +120 with seven, assuming each receives the full recovery.

## Briefs

One line per scene: who is there, which side of the sign drives it, its register, and its economic choices, with the house's source rationale at the top of each file.
The briefs precede pricing; the finished prose and offers are in the runtime house modules.
Every brief id matches a scene id in the catalogue (all 720 checked on 2026-11-05).

- [House I · Self](briefs/house-01.md)
- [House II · Livelihood](briefs/house-02.md)
- [House III · Communication](briefs/house-03.md)
- [House IV · Home](briefs/house-04.md)
- [House V · Creativity](briefs/house-05.md)
- [House VI · Labor](briefs/house-06.md)
- [House VII · Relationships](briefs/house-07.md)
- [House VIII · Transformation](briefs/house-08.md)
- [House IX · Pilgrimage](briefs/house-09.md)
- [House X · Achievement](briefs/house-10.md)
- [House XI · Friendship](briefs/house-11.md)
- [House XII · The Hidden](briefs/house-12.md)
