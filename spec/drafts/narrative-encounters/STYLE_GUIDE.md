# Working guide for narrative encounters

**Status: method for the house–sign catalogue, 2026-10-13.**
The working unit is a short scene for one house and sign, with a small set of choices.
The initial catalogue target is 720 scenes: five for each of the 144 house–sign pairs.

Keep the evolving workflow and review findings together here, revising them in place.
Scene content — briefs and worked examples — lives in [SCENES.md](SCENES.md).
Replace superseded material instead of accumulating review documents or competing instructions.
When the method settles, incorporate what remains useful into the existing authoring reference and remove this draft and the links to it.
The [research notes](../../research/NARRATIVE_VOICE.md) retain the source evidence for the voice and length experiments.

## Develop the scene and participation together

Use the selected [house and sign references](../../mechanics/HOUSES.md#3-chart-conditioning-model) to establish a particular situation.
Give someone an understandable concern or feeling: Mara wants to be addressed by name; a brother wants one sausage for the dark.
Include a few possible directions for participation.
These are enough to assess the scene without enumerating every action or assembling a finished menu.

Ask what makes participating a meaningful decision.
Most decision encounters need something unresolved: a demand, competing wants, an opportunity with conditions, or a reason different forms of participation matter.
Pleasure can contain tension without becoming a quarrel.
Avoid making every encounter a moral confrontation.

Keep the Prince's motive open during this pass.
Other characters can express wants directly; the Prince's eventual drive and the player's experience remain distinct under [DRIVES.md](../../concept/DRIVES.md).

## Let the sign describe the house's people and places

Under whole-sign houses a Prince always meets the same sign in each house, so the sign makes that house his.
Following the [sign notes](../../research/SIGN_NOTES.md#how-a-sign-qualifies-a-house), the sign describes the people, places, season, and manner of the house's affairs, not the Prince.
In the House IV test, Libra gave a household arguing over courtesy, Capricorn the longest night and the winter stores, Leo a father's harvest title, and Pisces a flooded house that keeps taking people in.
Each changed who was present and what they wanted, not only the backdrop.

A sign's planets of dignity and debility often name its tensions: Capricorn's Saturn, Mars, Moon, and Jupiter map onto thrift, labor, comfort, and generosity deferred.
Use them as a source of situations, not as a checklist.

## Characters

Names are for flavor.
Each scene's relationships stand alone: a Prince's rising sign selects a pool of 60 scenes, and they need not agree on who his mother or brother is.
Write so a scene does not depend on the Prince having exactly one of anyone.

## Voice and length

- Aim for **30–50 words in one paragraph**, excluding participation notes; reconsider anything above 60.
  Shorter scenes need no padding, and necessary context can justify an exception.
  The [selected FTL and Slay the Spire openings](../../research/NARRATIVE_VOICE.md#opening-length-comparison) inform this target without establishing a corpus average.
- Use second person, present tense, familiar words, and active verbs.
  Let people ask, object, tease, or say what they want in their own manner.
- Use details that establish a relationship, history, practical condition, or particular pleasure.
  Age, beauty, and a final gesture do not by themselves supply significance.
- Let a concrete exchange carry meaning without explaining it again afterward.
  Cut repeated interpretation and incidental staging before cutting the detail that explains why someone cares.
- Keep the narrator observant and capable of affection or dry humor.
  An observation needs evidence in the scene; it should leave the Prince's feelings and response available to the player.
- Treat the horoscope influence as an experiment in direct address and compressed social observation.
  Avoid generic reassurance, unsupported predictions, prescribed responses, and assumptions about the Prince's personality.
  The encounter's sign is not necessarily his Sun sign.

Keep generated narration separate from the sourced planetary aria under the [planetary voice guidance](../../concept/PLANETS.md#2-universal-voice-rules).

## Choices and economics

Once the scene and participation are convincing, turn the participation into choices.
A developed option is **choice narration and economic effect**; there is no separate outcome narration.
Use the [encounter economy and eligibility rules](../../mechanics/ENCOUNTERS.md) and the provisional rates in [economy.ts](../../../client/src/data/economy.ts).

- **Compose a small set of choices.**
  Trades exchange Light, affliction, recovery, or run-long stat gains.
  Gifts and mutually exclusive benefits need no matching payment: choosing one can mean forgoing another.
  Include a valid way through at zero Light and every unlock tier, usually an exit or an available gift.
  An exit may cost a little Light in an averse house; declining an offer can be the comfortable or decent course.
- **Vary the decision.**
  Use the [choice structures in ENCOUNTERS.md §1.2](../../mechanics/ENCOUNTERS.md#12-choice-families): choose a benefit, commitment size, payment, or concentrated versus distributed effects.
  Their example amounts are provisional; let the situation justify the offers.
  Compare recovery with Resolve's immediate capacity, group effects with actual lit recipients, and costs after occupant terms.
  Keep the whole visible menu within five choices, including joy and revival, and use at most one independently chosen planet per option.
- **The house guides the terms.**
  Houses that aspect the Ascendant generally offer more favorable opportunities; II, VI, VIII, and XII can offer harsher terms.
  Use the provisional rates as a reference and compare opportunities across the house–sign pool and representative run states.
  Do not require the same surplus from every choice.
  Value recovery at 2 Light per point and affliction taken at 3, as in [ENCOUNTERS.md §6](../../mechanics/ENCOUNTERS.md#6-provisional-amounts).
- **The fiction justifies each exchange.**
  Revise the fiction if it does not support the proposed exchange.
  A disagreement alone does not justify affliction; leaving shelter, hard work, or a cold floor can.
  An obvious response should not disappear solely to manufacture a cost.
- **Joy houses add a joy choice.**
  In the seven houses with a joy, each scene also writes one choice for its joyful planet, shown when that planet is present under [ENCOUNTERS.md §4.1](../../mechanics/ENCOUNTERS.md#41-planetary-joys).
  It offers better terms than the scene's trades, or an exchange they lack, in that planet's manner.
  It can change the action, benefit, or recipients as well as the price.
- **Revival where a return fits.**
  Add a revival choice where the house supports a return; every House IV scene has one.
  It costs the flat revival price and appears only when a planet is combusted.
- **Planets in the house are not written.**
  Their effect on existing costs is computed under [ENCOUNTERS.md §4.2](../../mechanics/ENCOUNTERS.md#42-occupants-and-dignity); write scenes that work for any occupant.

Options may deliberately offer unequal economic value when the difference gives the player a meaningful reason to sacrifice an advantage.
The morally troubling choice may be the economically strongest one, as when letting Mara's correction pass buys a cheap supper.
Make the advantage being surrendered clear, and let the player decide whether refusing it is worth the cost.
Avoid automatically compensating that refusal with another reward, or making every decent act expensive.

## Plan variety with briefs

Before writing prose, give each scene a one-line brief: who is there, which side of the sign drives it (season, trade, place, or manner), its register (gift, pleasure, dilemma, burden, or quarrel), and its economic choices.
Review the briefs down each house and across each sign before writing, to catch repetition such as every Capricorn scene turning on thrift.
Five scenes in one house–sign pair should differ in people, register, and economic decisions.
Mix the choice structures where the fiction supports them; there is no requirement to assign one scene to each structure.

## Review through comparisons

Compare a small number of scenes before expanding the catalogue.
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
   Keep only feedback useful to the next iteration here.
   A model's approval does not establish the reader's preference or readiness to generate at scale.

The comparisons so far produced these findings:

| Comparison | Reader feedback | Working implication |
| --- | --- | --- |
| Mara speaking directly versus narration reporting her request | The direct request was preferred. | Let people say what they want. |
| Lena's shared history versus a joke in dialogue | The history “evokes a larger backstory,” but screaming could mean joy or pain. | Keep the sense of an earlier shared experience and clarify its emotional character. |
| A mother gives the Prince a key while his brother must still wait up | Neither version established clear drama. | Rework the situation before adjusting narrator commentary or sentence order. |
| House IV under Libra, Capricorn, Leo, and Pisces | “Each of these scenes has something to draw the reader in.” | The sign can carry the situation; proceed to house–sign scenes. |

## Next: the initial catalogue

Generate five scenes for every house–sign pair, retaining the four existing House IV scenes within their respective pools.
Work in batches: briefs first, then scenes and offers, then editorial review and resolver validation before integration.
Review across batches for repeated situations and economic menus, and playtest several rising signs so coverage is not judged from one Prince alone.
The first pass supplies the full catalogue for the demo; balance and writing continue to improve through playtesting.
