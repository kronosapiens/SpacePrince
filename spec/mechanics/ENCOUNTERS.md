# Space Prince — Narrative Encounter Authoring Spec

Narrative encounters are single decisions about the chart the player will carry onward.
House concepts live in [HOUSES.md](HOUSES.md), combat rules in [MECHANICS.md](MECHANICS.md), and presentation in [SCREENS.md §3.2](../design/SCREENS.md#32-narrative-layout-asymmetric).
Sourced house meanings and original scene material live in [HOUSE_MATRIX.md](../concept/HOUSE_MATRIX.md).
The [encounter model](HOUSES.md#3-chart-conditioning-model) groups fixed references, natal relationships, and current state; §4 below applies these lookups to offers, and §4.6 describes composing and revising a scene.
Authored scenes live in the [house modules](../../client/src/data/narrative), assembled by [narrative-scenarios.ts](../../client/src/data/narrative-scenarios.ts).
Their source rationales and participation directions live in the [authoring briefs](../drafts/narrative-encounters/briefs).
Validation, targeting, previews, and resolution live in [narrative.ts](../../client/src/game/narrative.ts).

### Implementation status

The catalogue implements the composition and provisional economic guidance below.
The outcome, target, and predicate tables in §2, §3, and §4.3 describe current client behavior.

| Area | Current behavior | Intended behavior | Remaining work |
|---|---|---|---|
| House references | [House data](../../client/src/data/houses.ts) stores good/bad valence and compound kind labels | Use the separate attributes grouped under House in [HOUSES.md §3.1](HOUSES.md#31-fixed-references) | Align the data representation |
| House–sign scenes | 720 scenes: five for each of the 144 house–sign pairs; selection uses only the matching sign | As implemented | Playtesting and further editorial refinement |
| Occupants and dignity | Existing costs follow §4.2 (`withOccupants` in [narrative.ts](../../client/src/game/narrative.ts)); the screen names the occupants | As implemented | Tune the step sizes in the balancing pass |
| Joy choices | 420 choices under `joyPresent`, one per scene in the seven joy houses | As implemented | Playtest their usefulness across chart conditions |
| Run-long stat gains | `gain` outcomes raise a planet's stat on the run (`Run.gains`), read through `runChart` in combat, map openings, narrative, and the stat table | As implemented | None for this iteration |
| Prices | Authored from the provisional going rates in [economy.ts](../../client/src/data/economy.ts) and each house's terms | Comparable aggregate opportunity across charts | Full run balancing under issue #12 |

## 1. The Complementary Loop

Narrative choices gather or spend Light, add or relieve affliction, or revive a planet.
Combat remains the primary scoring engine.

### 1.1 Shared resources

- **Light:** the run's banked score and spendable currency.
- **Affliction:** the burden on each planet, capped at its combustion ceiling.
- **Lit planets:** the remaining choices the player can bring to subsequent encounters.

Chart condition cannot be reduced to one health total.
The location of affliction matters: restoring Mercury or preserving Saturn changes what the player can do under the next ruler.

### 1.2 Choice families

- **Press:** choose which planet absorbs an immediate affliction cost to gather Light.
- **Tend:** selected or distributed recovery, as a gift or in exchange for a cost.
- **Revive:** spend Light to return a selected combusted planet at half its ceiling.
- **Stat gains:** raise a selected planet's Resolve, Afflict, or Fortune for the rest of the run, as a gift or in exchange for a cost.

A scene uses the families its situation supports.
It does not need a copy of every economic option.
Offers may be trades, gifts, or mutually exclusive benefits.
Forgoing another benefit can supply the tradeoff without a matching cost.
Each scene includes a valid way through at every unlock tier and at zero Light (§5.3).

The same outcomes support several structures for a decision:

| Structure | Example offers | Research |
|---|---|---|
| Choose a benefit | Recover 24 on one planet, gain 12 Resolve on one planet, or gather 48 Light | [The Library](../research/STS.md#the-library), [Big Fish](../research/STS.md#big-fish) |
| Choose commitment size | Gather 12 Light freely, take 12 affliction for 60 Light, or take 24 affliction for 96 Light | [Sensory Stone](../research/STS.md#sensory-stone) |
| Choose payment | Gain 12 Afflict on a chosen planet by paying 36 Light or taking 12 affliction on that planet | [Vampires](../research/STS.md#vampires) |
| Concentrate or spread | Recover 36 on one planet or 12 on each lit planet | [Ancient Writing](../research/STS.md#ancient-writing), which contrasts a focused change with a broad improvement |

These are provisional examples using the existing outcomes and a single decision.
Vary their amounts and combinations to fit the scene; they imply no fixed surplus or equivalence between offers.
A modest free option can make a commitment menu useful to a badly afflicted chart, while a larger reward gives healthier charts a reason to participate further.
Alternate payments are separate options for the same benefit, so the player can preserve whichever resource matters more now.

Compare recovery with Resolve using remaining capacity: gaining Resolve also gives immediate room for affliction.
With a ceiling of 60 and 24 affliction, recovering 24 leaves 60 capacity; gaining 12 Resolve leaves 48.
For group effects, count the lit recipients and actual recovery after clamping to each planet's affliction.
The value of spreading an effect changes with unlocks and the distribution of damage.
For a positive affliction cost targeting `allUnlocked`, dignity adjusts the per-planet amount, so the total adjustment scales with the number of lit recipients.
Apply occupant terms before comparing offers: favorable dignity makes the example's middle commitment free, while unfavorable dignity raises its affliction cost to 24.
An option can become preferable on a particular chart without making it preferable throughout the catalogue.

### 1.3 Run context

Affliction can end a run early, but its value also depends on the upcoming rulers and the player's available planets.
A scene should support a different preferred choice on a different chart or route.
The test is whether the player can explain who needs recovery, who can carry a cost, or why the Light matters now.

### 1.4 Valence and dignity

Valence and geometry are house attributes: valence sets the terms of a house's trades (§4.5), while geometry guides agency and narrative emphasis without an additional angularity bonus.
Planets in the house change those terms by a fixed rule, with dignity deciding whether for better or worse (§4.2).
Exact balance remains deferred.

## 2. Outcomes and Payment

The current resolver supports these immediate outcomes.
Debts, vows with later consequences, Omen, Lore, and other persistent effects are deferred pending a separate design and storage decision.

| Outcome | Meaning |
|---|---|
| `affliction { target, delta }` | Positive adds affliction; negative heals, clamped at zero. |
| `uncombust { target }` | Return a combusted planet at half its ceiling, through the shared uncombust rule. |
| `light { delta }` | Gather Light or incur an ordinary loss, clamped at zero. |
| `gain { target, stat, amount }` | Raise a lit planet's stat for the rest of the run; a Resolve gain raises its combustion ceiling. |

An option's separate `cost` is a **purchase**, paid in full before its result.
Insufficient Light makes the entire option unavailable; incoming rewards cannot finance its price.
Ordinary losses remain payable at zero and cannot make Light negative.
Paid healing requires some actual recovery; clean planets cannot consume Light for no benefit.

All outcomes are atomic.
An invalid target or unaffordable planetary cost rejects the whole choice, including any reward.
Positive affliction must fit within the target's remaining combustion margin; landing exactly at its ceiling is permitted and combusts it.

### 2.1 Exchange value

Light is both a spendable currency and the common reference for valuing encounter exchanges.
The [economy table](../../client/src/data/economy.ts) holds the going rates (§6).
They approximate each change's simulated effect on final run Light; full balance is deferred.
An offer can exchange burdens and benefits directly without Light changing hands.
For example, a Prince could take affliction for a run-long stat increase, or combine a smaller Light payment with an affliction cost.
The offer identifies which planet bears each burden and receives each benefit.

Value taking affliction separately from the price of removing it; the two need not form a reversible exchange.
In simulation, a point of affliction taken cost more final Light than a point removed gained, so taking affliction pays more per point than recovery costs.
Value a direct trade at the going rates of its parts.

Several linked costs and benefits form one choice and resolve together, with their full effects visible before commitment.
They do not require intermediate Light transactions or additional decisions.

## 3. Targeting

Only unlocked planets may be selected or affected.
Ordinary affliction effects require lit planets; revival requires a combusted planet.

| Target | Meaning |
|---|---|
| `chosen` | The player's selected planet. |
| `allUnlocked` | All currently lit unlocked planets. |
| `joy` | The house's joy, only if lit and unlocked. |
| `ruler` | The house's fixed game ruler, only if lit and unlocked. |
| `mostAfflicted` | The lit unlocked planet with greatest affliction. |
| `healthiest` | The lit unlocked planet with greatest remaining combustion margin. |

Target roles bind against the state before the choice.
`ruler` binds the fixed `HOUSES[].ruler`, not the traditional ruler of the house's natal sign.
Authored effects then apply in order to a copy of that state.
An unavailable themed target never silently drops its cost or redirects it to someone else.

Selected targets are the usual grammar for individual harm and recovery.
An option accepts one player-chosen planet; every `chosen` effect in it uses that same selection.
Other effects may use the fixed or automatic targets above, but two independently chosen planets would require a later interaction change.
Automatic roles remain available where the situation calls for them.
Early scenes must still work with only the Moon unlocked.

## 4. Chart Conditioning

Use the grouped references and dependencies defined in [HOUSES.md §3](HOUSES.md#3-chart-conditioning-model).
House and sign establish the shared situation and ordinary offers, including in empty houses.
An available joy adds an authored choice; occupants change the terms of every choice by the rule in §4.2.
Historical potency does not automatically increase rewards, and adverse house character does not require every option to be a loss.
The shared economy and encounter limits constrain all offers.

### 4.1 Planetary joys

A house's fixed joy assignment identifies the planet to inspect, wherever it resides in the natal chart.
That planet's current unlock status, affliction, and combustion determine whether its choice is available.
This gives players opportunities they can preserve, lose, and restore through their decisions during a run.

Every scene in the seven houses with a joy authors one joy choice, added to the scene's other choices rather than replacing one.
It offers better terms than the scene's trades, or an exchange they lack, in that planet's manner (§4.4).
The joy can change the action, benefit, or recipients: Jupiter might organize shared recovery where the ordinary offers provide individual support.
The [FTL research station example](../research/FTL.md#engi-research-station) illustrates a capability changing how a problem can be approached; Space Prince expresses that through immediate, determined effects.

A joy is present when it is unlocked, lit, and below 96 affliction.
At or above that threshold, or when combusted, its choice disappears.
This threshold remains provisional.

### 4.2 Occupants and dignity

Occupants are the unlocked planets whose natal sign is the house's sign, whatever their current condition.
They are not written into scenes.
Their net dignity changes existing costs by one step.
Each occupant counts +1 in domicile or exaltation and −1 in detriment or fall; only the sign of the total applies.
A favorable total lowers the cost and an unfavorable total raises it: 24 Light for a purchase, otherwise 12 affliction taken, otherwise 24 Light for an ordinary loss, each stopping at zero.
Neutral occupants and cancelling dignities leave the terms unchanged.
Occupants do not enlarge exchanges, and a gift with no cost remains a gift.

The encounter names its occupants and whether their dignity improves, worsens, or leaves the terms unchanged.
The [Capricorn worked example](../drafts/narrative-encounters/SCENES.md#iv--capricorn--the-sausage) shows the rule applied.

Symmetry in favorable and unfavorable signs does not guarantee equal economic value: affordability, target conditions, and costs stopping at zero affect the opportunities players can use.
Individual charts vary, and slower-moving planets turn that variation into birth-cohort effects.
Keep the steps modest, and assess their cumulative value across representative runs as well as within one scene.

### 4.3 Current predicates

These are the current client predicates.

| Predicate | True when |
|---|---|
| `joyPresent` | The joy is unlocked, lit, and below the affliction threshold. |
| `anyCombusted` | At least one unlocked planet is combusted. |

Visibility is distinct from affordability.
A chart-gated option is absent when its predicate fails.
Revival is offered only when an unlocked planet is combusted.
An offered choice with insufficient Light or no valid targets stays visible with an explanation.

### 4.4 Asymmetric joy

This economic treatment combines the house's joy assignment with that planet's benefic or malefic character.
It is a game adaptation of the historical affinities.
Benefic joys add help: cheaper recovery, a larger return, or a better way through the scene.
Contained malefics reduce harm: Mars or Saturn can absorb a smaller, scoped cost in their own domains.
Without containment, the ordinary choices may concentrate a larger burden or spread it across the lit chart.
All costs remain visible and immediate.

### 4.5 House–sign economic balance

Narrative variation should be available throughout the chart, including empty houses.
Every chart should receive equivalent aggregate economic opportunity across the encounter catalogue.

The house guides the tendency of its offers.
Houses that aspect the Ascendant generally offer more favorable terms; averse houses (II, VI, VIII, and XII) can offer harsher terms or a small cost to leave.
The going rates (§6) are provisional references, not a requirement that every choice have the same nominal advantage.
Gifts, trades, and choices among benefits can coexist within a house–sign pool.

Compare the opportunities across each house–sign pool and representative run states, including early unlock tiers, affliction, remaining maps, and available Light.
Account for encounter frequency, payment methods, benefit types, target restrictions, and occupant and joy effects.
No fixed per-choice surplus or symmetry of signs establishes balance by itself.

Compare the available choices as alternatives; their benefits cannot simply be added together when only one option can be taken.
Check that nominally equivalent arrangements remain comparably useful under representative resource levels and planetary conditions.
Equivalence concerns the opportunities supplied by the catalogue, rather than identical outcomes in every run.

### 4.6 Composing and revising a scenario

Use the references selected by [HOUSES.md §3.4](HOUSES.md#34-composition-and-lookup-order) in separate narrative, economic, and integration passes.
Review the narrative before assigning prices or mechanical effects.

1. **Generate and review the narrative.**
   Read the House's topics, geometry, favorability, joy affinity, and fixed game ruler together, then use Sign to shape the situation's manner and mood.
   In a joy house, use the joyful planet's house–planet wants to develop its choice.
   Write concrete situations, competing wants, actions, and immediate fictional consequences that work for any occupant and without an available joy.
   Evaluate emotional range, specificity, repetition, and whether the sign changes who is present and what they want.
   Keep the Prince's motives distinct from the player's possible experience.
   Retain the scope of one immediate decision and avoid consequences requiring unsupported lasting obligations or narrative state.
   Leave prices, stat changes, and exact eligibility for the economic pass; the candidates are not yet an assembled menu.
2. **Compose and review the economic offers.**
   Turn participation directions into a small set of offers, using the going rates and the house's tendency (§4.5) and explaining how each effect follows from the fiction.
   Gifts and choices among benefits need no invented payment; ensure a valid way through at every unlock tier and at zero Light.
   Add the joy choice in a joy house, and a revival choice where the house supports a return.
   Occupant terms are computed (§4.2); check the scene still reads sensibly when a planet in the house changes an existing cost.
   Check payment and target validity across representative charts and run states.
3. **Review the integrated encounter.**
   Check that the displayed choices form a coherent scene and that prose, previews, costs, and immediate consequences agree.
   A fictional burden alone does not justify affliction, and a desired reward does not justify inventing a transaction that weakens the scene.
   If economic composition changes an action or situation, return that change to narrative review.
   Playtesting evaluates the player's experience separately from source fidelity and editorial quality.

Keep a brief source rationale with narrative candidates and separate economic notes with proposed offers.
A source link and a few sentences are sufficient; the 84 research entries need no new checklist.
Label supported resolver effects separately from proposed effects, and keep unapproved experiments distinct from current guidance.

To refine a reference attribute's contribution, compare alternative interpretations while holding the selected chart and other authoring choices steady.
For example, VI is always cadent and averse; compare how different VI scenes express those attributes rather than treating them as chart variations.
When comparing charts, use valid placements and name which linked references change: holding a planet in a house while changing the house's sign also changes the planet's sign and may change its dignity.
Changing affliction can change joy availability while leaving the natal references intact.
If a proposed influence adds no useful distinction, simplify its use and update the relevant guidance rather than adding a token sentence or bonus.
Keep unresolved writing questions separate from economic or implementation questions so each can be revisited on its own evidence.

## 5. Encounter Shape

### 5.1 One decision

Each scene has one prompt and a small set of choices, usually two offers and a way to decline.
Trades and choices among benefits may use the same single-decision structure.
A joy choice and a revival choice can be added when they apply; keep the visible menu within five choices.
There are no child nodes, intermediate rewards, cash-outs, or traversal state.
Choosing an option that needs a target and inspecting previews are preparation for the decision, with no gameplay effects.

### 5.2 Commitment

Hover or keyboard focus previews an option's determined effects without committing.
Activate an option without a requested target once to resolve it.
An option that needs a target enters targeting and invites eligible planets on the chart.
Hover or focus a planet to preview its exact consequence in the shared readout; activate that planet once to resolve the choice.
Previewing another option leaves the selected targeting option unchanged.
Choosing another option replaces it; background click or Escape cancels targeting.
Outside targeting, planet activation remains safe inspection.
A resolved encounter cannot resolve again.
Its consequence is shown before returning to the map; the lifetime encounter count advances on leaving the resolved scene.

### 5.3 Exits

Every scene must offer a valid choice at every unlock tier and at zero Light.
Usually an exit provides it, with no effect or a small ordinary Light loss in an averse house, clamped at zero.
A choice among gifts can instead provide a valid way through without a separate empty exit.

## 6. Provisional Amounts

Authored amounts are multiples of 12.
The [economy table](../../client/src/data/economy.ts) holds the going rates:

| Exchange | Going rate |
|---|---|
| Recover 24 affliction | 48 Light |
| Take 24 affliction | Pays 72 Light |
| +12 Resolve | 60 Light |
| +12 Afflict | 36 Light |
| +6 Fortune | 36 Light |
| Revive | 180 Light |

Testify gains are not offered; their simulated value was near zero.
For valuing trades, count recovery at 2 Light per point and affliction taken at 3.
Revival returns a planet at half its own ceiling, so its flat price favors planets with high Resolve.

## 7. House Briefs

The [authoring briefs](../drafts/narrative-encounters/briefs) contain five situations per house–sign pair, with source rationale, emotional register, and possible participation.
They develop the [house matrix](../concept/HOUSE_MATRIX.md) through the process in §4.6.
The [runtime house modules](../../client/src/data/narrative) contain the finished prose and economic offers.

## 8. Scenario Identity and Selection

The catalogue contains five scenarios for each house–sign pair.
A stable `scenarioId` is the unit of the no-repeat rule.
Prefer unseen scenarios for the house and the Prince's sign on it.
When all five are exhausted, repeat matching-sign scenes.
Never substitute a scene authored for another sign.
The earlier house-only scenes and fallback selection have been removed.
The scenario and aria fragment are chosen on entry and persist through reloads.
Save schema v5 resets earlier saves, including v4 saves that may reference retired scenes.

## 9. Prose and Mechanical Copy

- **Aria:** one fragment in the fixed game ruler's voice for the whole encounter.
- **Prompt:** a short scene, usually 30–50 words, that establishes the immediate situation.
- **Option:** a short action, with no implied debt or promise that the game does not track.
- **Occupants:** one line naming the planets in the house and whether their dignity improves, worsens, or leaves the terms unchanged.
- **Aside:** shows the amounts and costs after occupant terms; stays fixed while inspecting planets.
- **Consequence:** optional; when a scene has none, the chosen option's text stands for the result.

Mechanics belong in the aside, not in the scene's prose.
Planet previews and read-only effect amounts show the actual changes from the shared resolver, including recovery clamped to current affliction.
When Resolve changes, the arc compares current and final remaining capacity, its track shows the gained ceiling, and the stat panel names the current and projected values.
Player-facing text uses encounter, self, and other; named Light and Resolve follow the shared copy register.

## 10. Validation

Every authored scene must remain playable across all unlock tiers and representative clean, afflicted, and partially combusted charts.
Preview and commit must agree for every valid target.
Tests cover full payment, ordinary losses, invalid targets, combustion margins, revival, stat gains, occupant terms, repeated resolution, and save resets.
The [catalogue tests](../../client/tests/narrative-catalogue.test.ts) check exact coverage, unique IDs and openings, matching-sign selection without repeats until exhaustion, and amounts on the 12-lattice.
They check zero-Light playability through every unlock tier, with empty, favorable, and adverse occupancy across four chart conditions: 60,480 scene states.
They also compare preview and commit for every eligible selection across five representative states, including run-long gains, and check joy visibility, revival, and the five-choice limit.
Playtests compare choices across chart conditions and upcoming rulers.
Catalogue reviews compare each house–sign pool under representative run conditions (§4.5), including the cumulative effects of occupants and joys and dignity's birth-cohort effects.
Editorial reviews use the scenario rationale in §4.6 to check that historical claims, original interpretations, eligibility, and economic advantages remain distinguishable.

## 11. Deferred Decisions

Wagers, deliberate sacrifice, transfers, persistent effects, multi-stage scenes, and final balance remain deferred.
The going rates and the size of occupant steps await the full balancing pass ([issue #12](https://github.com/kronosapiens/SpacePrince/issues/12)).
Authored special choices for planets in the house were set aside for computed terms; [issue #10](https://github.com/kronosapiens/SpacePrince/issues/10) records the alternatives.
Run-long stat gains are the only lasting state this version adds; there is no additional run currency or lasting narrative state.
