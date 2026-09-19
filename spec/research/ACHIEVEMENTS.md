# Achievements in FTL and Slay the Spire — findings for Space Prince

An audit of [FTL's 51 named achievements](FTL_ACHIEVEMENTS.md) and [the original Slay the Spire's 46 achievements](STS_ACHIEVEMENTS.md), compiled 2026-09-18.
It complements the [narrative-event survey](SURVEY.md).
Game facts are sourced in the inventories; the comparisons and recommendations here are design interpretations.
The twenty Space Prince candidates remain a discussion draft, with no rewards assigned and no implementation implied.

## 1. What the two catalogues do

| Question | FTL | Slay the Spire |
|---|---|---|
| Catalogue size | 21 general + 30 cruiser achievements | 46 achievements |
| Important subdivisions | Progression, route restrictions, equipment feats, cruiser-specific challenges | Bosses, character clears, difficulty, combat feats, restricted victories |
| Conditions scoped to one encounter | 23 | 28, including nine boss milestones |
| Direct achievement reward | Any two of a cruiser's three achievements unlock its Type B layout | Achievement marks themselves award no cards or relics |
| Other progression | Separate ship quests and victory routes; additional hangar records | Character unlocks, score-based card/relic unlocks, Ascension access |
| Relationship to identity | Ship mechanics determine many challenges | Card pools make particular strategies easier for particular characters |
| Explicit narrative involvement | Crew-dependent event options and secret-sector discovery | No achievement specifically requires choosing a named event option |

The catalogue counts come from the official [FTL](https://steamcommunity.com/stats/212680/achievements/) and [Slay the Spire](https://steamcommunity.com/stats/646570/achievements/) lists.
Encounter-scope counts are this audit's classifications, reproducible from the inventory tables.
FTL's [ship achievement rules](https://ftl.fandom.com/wiki/Ship_Achievements) and Slay the Spire's [achievement reference](https://slay-the-spire.fandom.com/wiki/Achievements) establish the reward distinction.
Steam completion percentages are not used as measures of enjoyment or intrinsic difficulty.

## 2. The most useful patterns

### Recognize the accomplishment when it happens

FTL can recognize a recovery, unusual boarding victory, or successful use of cloaking before the player wins the run.
Slay the Spire can recognize an unusual deck interaction inside a run that later fails.
The achievement survives the failure because the accomplishment already happened.

Our first draft asks for a full seven-map completion in eight candidates, and completion of the seventh map in two more.
Half the proposed catalogue therefore depends on reaching the final map.
That makes recognition slow and often couples an interesting accomplishment to a separate endurance test.

For Space Prince, consider granting more achievements after a turn, encounter, or map.
Keep whole-run completion where enduring for the whole passage is the actual achievement.
For example, changing Mars's role could be demonstrated by using its changed stats successfully, without necessarily completing six more maps afterward.

### Let the condition reveal a mechanic

Slay the Spire's Come At Me teaches that damage can come from outside Attack cards.
FTL's Manpower draws attention to Zoltan crew supplying power when reactor growth is unavailable.
Their conditions point toward an interaction worth learning.

The proposed Testify-through-a-hard-aspect combustion is a strong Space Prince counterpart.
Other possibilities to explore include using one action to cause affliction and testimony on different planets, or arranging a turn that earns Light from both charts under an appropriate ruler.
These are candidate replacements to discuss, not additions to the agreed budget of twenty.

### Make identity a source of different challenges

FTL's cruiser groups derive from what each ship does: the Stealth Cruiser has cloaking challenges, the Engi Cruiser has drone and ion challenges, and the Lanius Cruiser has an oxygen constraint.
The equivalent material in Space Prince is planetary roles, aspect propagation, ruler-specific scoring, and house conditions.

An achievement about developing Mars's testimony has more specific meaning than accumulating an arbitrary total of stat upgrades.
A house achievement could likewise recognize an interaction particular to Home, Labor, or The Hidden once those houses' lasting effects exist.
The draft currently assumes any Prince can eventually earn all twenty; conditions requiring a particular immutable natal placement would need separate discussion.

### A restriction should leave an interesting alternative

Minimalist changes deck construction; FTL's drone-only victory asks another system to do the work.
The restriction makes the player discover or develop an alternative.

This strengthens the case for trying a Testify-only challenge, but does not justify requiring the seventh map specifically.
The appropriate duration should come from whether the restriction creates a real decision at that stage.
Refusing all Light from houses is less clearly useful: it may simply remove the attractive half of many menus.
It needs stronger evidence from play before taking one of twenty places.

### Recognition and content access can be related without matching one to one

FTL's two-of-three structure is the clearest precedent for achievements opening another way to play.
Slay the Spire demonstrates a different arrangement: tactical recognition and content progression coexist as largely separate systems.

Neither comparison requires every Space Prince icon to carry a reward.
Later, an individual achievement or a small set could open an additional house offer, while other achievements remain records.
Unlocking an option can still increase practical power if it is always better than the existing choices; the offer's costs and tradeoffs will matter when rewards are designed.
There is no need to resolve that mapping before selecting interesting accomplishments.

### Lasting narrative choices are the least established part of our proposal

FTL's Diplomatic Immunity rewards using crew-dependent event options.
Ancestry rewards reaching a hidden place through the game's event structure.
Slay the Spire's events can make achievement builds possible, but none of its 46 achievement descriptions requires a particular event choice.

The narrative survey found rich examples of run-long sacrifice; the achievement audit finds little direct recognition of those sacrifices.
Space Prince's consequential-choice category could connect the two.
It should be developed from actual house offers, rather than filling five slots with variations of a generic completion condition before those offers exist.

## 3. Revised twenty candidates

Revised after the reference audit, retaining five achievements in each of the four proposed categories.
These are proposed earning conditions, not settled achievement names or gameplay rewards.
Complete a run means finish all seven maps.
Conditions are intended to be attainable by any Prince; none requires a particular natal placement.

### Milestones

| # | Proposed condition | Revision and purpose |
|---|---|---|
| 1 | Complete the first map. | Keep: the first substantial passage. |
| 2 | Unlock all seven planets. | Keep: access to the whole chart. |
| 3 | Complete a map after one of your planets combusts during it. | Keep: discover that loss need not end the journey. |
| 4 | Revive a planet, then act with it in a later chart encounter. | Revise: recognize its return to use immediately, without an additional map-completion requirement. |
| 5 | Complete the first seven-map run. | Keep: the central completion milestone. |

### Mastery

| # | Proposed condition | Revision and purpose |
|---|---|---|
| 6 | Complete a run without any of your planets combusting. | Keep: sustained care is the accomplishment, so the full passage matters. |
| 7 | With all seven planets already unlocked, fall to one lit planet and recover to all seven lit within the same run. | Revise: recognize a complete recovery when it happens; no subsequent victory required. |
| 8 | Complete any map in which you acted with each of the seven planets. | Revise: find uses for the entire chart, without requiring map seven. |
| 9 | With one Testify action, reduce affliction on its direct target and combust another Other planet through a hard aspect. | Revise: make both sides of inversion visible in the same action. |
| 10 | Under Saturn's rule, earn Light from combustion on both charts in one turn, with at least one of your planets still lit afterward. | Replace the Testify-only restriction with a tactical use of Saturn's scoring and sequential resolution. |

The Saturn condition is possible because the player's action can combust a propagated target while leaving the Other's acting planet able to respond.
Its response can then combust a planet on the Prince's chart.
Combusting the Other's acting planet directly would preempt that response instead.
This condition asks the player to understand the cost of allowing the exchange.
See [resolution, propagation, and scoring](../mechanics/MECHANICS.md).

### Exploration

| # | Proposed condition | Revision and purpose |
|---|---|---|
| 11 | Visit all twelve houses across the Prince's lifetime. | Keep: acquaintance with the whole world. |
| 12 | Earn Light under each of the seven encounter rulers across runs. | Keep: experience what each ruler values. |
| 13 | Complete a map with the canonical Sephirot pattern. | Keep: one discovery rooted in the game's cosmology. |
| 14 | Resolve the same house scene on separate visits: once with its joy-planet combusted, and once by taking an option enabled by that planet's presence. | Revise: experience a familiar situation changing with the Prince's condition; either visit may come first. |
| 15 | Take a Mars-conditioned offer in Labor and a Saturn-conditioned offer in The Hidden, across any runs. | Replace the aspect checklist: discover how the malefics can contain hardship in their respective houses. |

For the house conditions, an enabled option must actually be chosen.
Merely having an eligible chart does not count.
The offers for #14 and #15 should be available through the joy-planet's current condition without requiring strong natal dignity.
The existing [house offers](../../client/src/data/narrative-scenarios.ts) already include such choices for Mars in Labor and Saturn in The Hidden.

### Consequential choices

| # | Proposed condition | Revision and purpose |
|---|---|---|
| 16 | Accept permanent combustion of a planet for the run, then complete that run. | Keep: carry a lasting absence through the passage. |
| 17 | Accept a run-long Resolve reduction for a benefit; then complete a later chart encounter in which that planet acts and remains lit, with the reduction still in effect. | Revise: demonstrate using the planet with its chosen vulnerability, without requiring a full clear. |
| 18 | Accept a run-long stat trade that weakens one planet to improve another; then complete a chart encounter using both, with both still lit and the trade still in effect. | Replace the second revival achievement: continue to rely on the planet that carried the cost as well as the beneficiary. |
| 19 | Choose recovery over an available Light reward in a house; in the next chart encounter, earn Light on a turn acted by a planet that the choice actually restored. | Replace the blanket refusal of house Light: forgo an immediate reward to keep a planet in use. |
| 20 | Through house effects, make Mars's testimony stat exceed its affliction stat; while that remains true, act with Mars to earn Light from applied testimony on the Other's chart. | Revise: demonstrate a changed planetary role when it becomes useful. |

Candidates 16, 17, 18, and 20 depend on future run-scoped house effects.
The stat trade in #18 is a proposed use of per-run increases and decreases, not an implemented transfer system.
These conditions should be refined alongside actual offers; they do not prescribe particular prices or stat amounts.
The recovery choice in #19 already has a basis in Friendship's money-versus-care offers.

This revision retains nine candidates, tweaks seven, and replaces four.
Only #5, #6, and #16 require a complete run; none of the other conditions is tied specifically to map seven.
The recovery in #7 can still invite manufactured danger, and the discovery in #13 depends on map generation.
They remain candidates because they offer distinct stories, but those costs should be weighed when narrowing the final set.

## 4. Questions to use when selecting the final twenty

- What particular moment would the player remember?
- Does the condition reveal a mechanic, express a role, or record a consequential choice?
- Does it need a complete run, or is the accomplishment already finished sooner?
- Does pursuing it create decisions, or encourage waiting, repetition, or manufactured danger?
- Can a Prince with different natal placements reasonably pursue it?
- Is its story sufficiently different from the other nineteen?

Once those questions produce a convincing set, examine each achievement for a thematic connection to a future choice unlock.
The references give us useful condition structures; they do not require importing permanent stat rewards or assigning a gameplay effect to every icon.
