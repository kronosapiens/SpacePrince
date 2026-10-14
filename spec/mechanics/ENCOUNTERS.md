# Space Prince — Narrative Encounter Authoring Spec

Narrative encounters are single decisions about the chart the player will carry onward.
House concepts live in [HOUSES.md](HOUSES.md), combat rules in [MECHANICS.md](MECHANICS.md), and presentation in [SCREENS.md §3.2](../design/SCREENS.md#32-narrative-layout-asymmetric).
Sourced house meanings and original scene material live in [HOUSE_MATRIX.md](../concept/HOUSE_MATRIX.md).
The [encounter model](HOUSES.md#3-chart-conditioning-model) groups fixed references, natal relationships, and current state; §4 below applies these lookups to offers, and §4.6 describes composing and revising a scene.
Authored scenes live in [narrative-scenarios.ts](../../client/src/data/narrative-scenarios.ts); validation, targeting, previews, and resolution live in [narrative.ts](../../client/src/game/narrative.ts).

### Implementation status

The composition and economic guidance describes the intended refresh.
The outcome, target, and predicate tables in §2, §3, and §4.3 describe current client behavior.

| Area | Current behavior | Intended behavior | Remaining work |
|---|---|---|---|
| House references | [House data](../../client/src/data/houses.ts) stores good/bad valence and compound kind labels | Use the separate attributes grouped under House in [HOUSES.md §3.1](HOUSES.md#31-fixed-references) | Align the representation during the refresh |
| House–sign scenes | Selection prefers the house and the Prince's sign on it, then falls back to the house; four House IV scenes exist | Five scenes for each of the 144 house–sign pairs | Write one rising sign's 60 scenes, then the rest; retire the 24 house-only scenes and the helpers only they use |
| Occupants and dignity | Every choice's terms follow §4.2 (`withOccupants` in [narrative.ts](../../client/src/game/narrative.ts)); the screen names the occupants | As implemented | Tune the step sizes in the balancing pass |
| Joy choices | Joy choices are added under `joyPresent`; only a test fixture has one | One per scene in the seven joy houses | Author them with the scenes |
| Run-long stat gains | `gain` outcomes raise a planet's stat on the run (`Run.gains`), read through `runChart` in combat, map openings, narrative, and the stat table | As implemented | None for this iteration |
| Prices | [economy.ts](../../client/src/data/economy.ts) holds the provisional going rates; the house-only scenes keep earlier prices | Every scene priced from the going rates and its house's terms | Price new scenes as they are written |

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
- **Tend:** spend Light for selected or distributed recovery.
- **Revive:** spend Light to return a selected combusted planet at half its ceiling.
- **Stat gains:** spend Light or take affliction to raise a selected planet's Resolve, Afflict, or Fortune for the rest of the run.

A scene uses the families its situation supports.
It does not need a copy of every economic option.
Each standard choice is a trade, and one choice exits.
Free gains come only from favorable planets in the house (§4.2).

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

A joy is present when it is unlocked, lit, and below 96 affliction.
At or above that threshold, or when combusted, its choice disappears.
This threshold remains provisional.

### 4.2 Occupants and dignity

Occupants are the unlocked planets whose natal sign is the house's sign, whatever their current condition.
They are not written into scenes.
Instead they change the terms of every choice in the scene, applied in this order:

1. **Any occupant raises the stakes.**
   Each affliction amount in a choice grows by 12, recovered or taken, and the choice's Light scales in the same proportion, rounded to a multiple of 12.
   Choices with a stat gain or a revival, and choices with no affliction, are unchanged.
2. **Dignity tilts the terms by one step.**
   Each occupant counts +1 in domicile or exaltation and −1 in detriment or fall; only the sign of the total applies.
   A favorable total lowers each choice's cost by one step and an unfavorable total raises it: 24 Light for a purchase or an ordinary loss, or 12 affliction taken, never below zero.

A favorable planet can therefore reduce a cost to nothing, which is how a scene offers a free gain.
An unfavorable planet makes every trade worse, with the exit as the floor.
The encounter names its occupants and whether they make the terms larger, better, or worse.
The [Capricorn worked example](../drafts/narrative-encounters/SCENES.md#iv--capricorn--the-sausage) shows the rule applied.

Each planet has as many favorable signs as unfavorable ones, so its expected effect is zero.
Individual charts still vary, and slower-moving planets turn that variation into birth-cohort effects.
Keep the steps modest, and assess their cumulative value across a run as well as within one scene.

### 4.3 Current predicates

These are the current client predicates.
For these predicates, Domicile and Exaltation are the strong band.

| Predicate | True when |
|---|---|
| `joyPresent` | The joy is unlocked, lit, and below the affliction threshold. |
| `joyStrong` | The joy is present and has strong dignity. |
| `rulerStrong` | The fixed game ruler is lit, unlocked, and has strong dignity. |
| `anyCombusted` | At least one unlocked planet is combusted. |

`joyStrong` and `rulerStrong` serve only the earlier house-only scenes, which remain as a fallback until house–sign scenes replace them.

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

The house, not the sign, sets the terms of its trades.
In houses that aspect the Ascendant, each trade comes out 24 Light better than the going rate.
In the averse houses (II, VI, VIII, and XII), trades are at the going rate and the exit may cost a little Light.
Because every scene in a house carries the same advantage whatever its sign, each of the twelve Ascendant arrangements receives the same aggregate opportunity.
Signs vary which exchanges a scene offers, not how much it offers.

Value trades at the going rates (§6).
Account for encounter frequency, payment methods, benefit types, and target restrictions when checking that an advantage holds.

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
   Turn two participation directions into trades and one into the exit, using the going rates and the house's terms (§4.5) and explaining how each exchange follows from the fiction.
   Add the joy choice in a joy house, and a revival choice where the house supports a return.
   Occupant terms are computed (§4.2); check the scene still reads sensibly when a planet in the house enlarges or tilts its trades.
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

Each scene has one prompt, two trades, and an exit.
A joy choice and a revival choice are added when they apply, so up to five choices can show.
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
The exit provides it.
It is a participation direction like the trades, usually with no effect; in an averse house it can impose a small ordinary Light loss, which clamps at zero.

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

## 7. House Blueprints

These summarize the current catalogue's decisions, before the full narrative refresh.
Use the [house matrix](../concept/HOUSE_MATRIX.md) and §4.6 to develop revised scenarios; these summaries do not exhaust a house's possible offers.

| House | Immediate decision identity |
|---|---|
| 1 · Self | Attend to a chosen part of the chart, or stake its strength. |
| 2 · Livelihood | Small gains versus costly labor. |
| 3 · Communication | Selected recovery, carrying an errand, or finding a crossing. |
| 4 · Home | Deep recovery for one planet versus smaller recovery across the chart; conditional revival. |
| 5 · Creativity | Finishing work at a chosen cost, or taking time to recover. |
| 6 · Labor | Concentrated versus distributed toil; Mars provides containment. |
| 7 · Relationships | Accept help, carry a load for Light, or pay for relief. |
| 8 · Transformation | Accept a heavy cost, recover, or choose who returns. |
| 9 · Pilgrimage | Study, demonstration, or a vigil completed within the scene. |
| 10 · Achievement | Take a modest return or spend strength for greater recognition. |
| 11 · Friendship | Gather Light versus restore one or many planets; Jupiter adds gifts. |
| 12 · The Hidden | Concentrate or spread an immediate burden; Saturn contains it. |

## 8. Scenario Identity and Selection

The catalogue target is five scenarios for each house–sign pair.
A stable `scenarioId` is the unit of the no-repeat rule.
Prefer unseen scenarios for the house and the Prince's sign on it; then unseen scenarios of the same house in any sign, including the earlier house-only scenes; recycle when the pool is exhausted.
The scenario and aria fragment are chosen on entry and persist through reloads.
The alpha schema resets old tree-based saves rather than migrating them.

## 9. Prose and Mechanical Copy

- **Aria:** one fragment in the fixed game ruler's voice for the whole encounter.
- **Prompt:** a short scene, usually 30–50 words, that establishes the immediate situation.
- **Option:** a short action, with no implied debt or promise that the game does not track.
- **Occupants:** one line naming the planets in the house and whether they make the terms larger, better, or worse.
- **Aside:** shows the amounts and costs after occupant terms; stays fixed while inspecting planets.
- **Consequence:** optional; when a scene has none, the chosen option's text stands for the result.

Mechanics belong in the aside, not in the scene's prose.
Planet previews and read-only effect amounts show the actual changes from the shared resolver, including recovery clamped to current affliction.
Player-facing text uses encounter, self, and other; named Light and Resolve follow the shared copy register.

## 10. Validation

Every authored scene must remain playable across all unlock tiers and representative clean, afflicted, and partially combusted charts.
Preview and commit must agree for every valid target.
Tests cover full payment, ordinary losses, invalid targets, combustion margins, revival, stat gains, occupant terms, repeated resolution, and save resets.
A catalogue test checks every house–sign scene for a choice valid at zero Light with only the Moon unlocked, and for amounts on the 12-lattice.
Playtests compare choices across chart conditions and upcoming rulers.
Catalogue reviews check that each house's trades hold its advantage (§4.5) and the cumulative effect of occupant terms and joy choices, including dignity's birth-cohort effects.
Editorial reviews use the scenario rationale in §4.6 to check that historical claims, original interpretations, eligibility, and economic advantages remain distinguishable.

## 11. Deferred Decisions

Wagers, deliberate sacrifice, transfers, persistent effects, multi-stage scenes, and final balance remain deferred.
The going rates and the size of occupant steps await the full balancing pass ([issue #12](https://github.com/kronosapiens/SpacePrince/issues/12)).
Authored special choices for planets in the house were set aside for computed terms; [issue #10](https://github.com/kronosapiens/SpacePrince/issues/10) records the alternatives.
Run-long stat gains are the only lasting state this version adds; there is no additional run currency or lasting narrative state.
