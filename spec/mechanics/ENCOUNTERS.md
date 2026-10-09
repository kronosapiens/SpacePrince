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
| House–sign variants | Scenarios are selected by house and prior visits, without sign variation | Sign shapes ordinary scenes and offers, including in empty houses | Author and select variants; verify equivalent opportunity across Ascendant arrangements |
| Occupants and dignity | Special choices use joy and fixed game ruler predicates, including their dignity; occupants do not select approaches | Occupants supply special approaches with dignity shaping their terms; joy options depend on the joyful planet's condition | Implement occupant approaches and terms; reconcile existing gates with the refreshed catalogue |
| Run-long stat gains | [economy.ts](../../client/src/data/economy.ts) defines purchase amounts and prices; the resolver supports Light, affliction, and revival | Offers can include the defined run-long gains and direct exchanges | Add supported outcomes, state updates, previews, and authored offers |
| Baseline prices | Scenarios contain earlier prices and do not use `economy.ts` | Use its agreed values as the reference for ordinary offers and authored advantages | Reprice the catalogue and validate its exchanges |

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

A scene uses the families its situation supports.
It does not need a copy of every economic option.
Gifts can be favorable without a matching penalty; preserving the chart that reveals one is meaningful preparation.

### 1.3 Run context

Affliction can end a run early, but its value also depends on the upcoming rulers and the player's available planets.
A scene should support a different preferred choice on a different chart or route.
The test is whether the player can explain who needs recovery, who can carry a cost, or why the Light matters now.

### 1.4 Valence and dignity

Valence and geometry are house attributes: valence guides offers and their severity, while geometry guides agency and narrative emphasis without an additional angularity bonus.
Planet–house placement unlocks occupant approaches; planet–sign dignity shapes their economic terms without an automatic exchange-rate multiplier.
Exact balance remains deferred.

## 2. Outcomes and Payment

The current resolver supports these immediate outcomes.
Debts, vows with later consequences, Omen, Lore, and other persistent effects are deferred pending a separate design and storage decision.

| Outcome | Meaning |
|---|---|
| `affliction { target, delta }` | Positive adds affliction; negative heals, clamped at zero. |
| `uncombust { target }` | Return a combusted planet at half its ceiling, through the shared uncombust rule. |
| `light { delta }` | Gather Light or incur an ordinary loss, clamped at zero. |

An option's separate `cost` is a **purchase**, paid in full before its result.
Insufficient Light makes the entire option unavailable; incoming rewards cannot finance its price.
Ordinary losses remain payable at zero and cannot make Light negative.
Paid healing requires some actual recovery; clean planets cannot consume Light for no benefit.

All outcomes are atomic.
An invalid target or unaffordable planetary cost rejects the whole choice, including any reward.
Positive affliction must fit within the target's remaining combustion margin; landing exactly at its ceiling is permitted and combusts it.

### 2.1 Exchange value

Light is both a spendable currency and the common reference for valuing encounter exchanges.
Use the agreed purchase quantities and prices in the [economy table](../../client/src/data/economy.ts) as the baseline.
An offer can exchange burdens and benefits directly without Light changing hands.
For example, a Prince could take affliction for a run-long stat increase, or combine a smaller Light payment with an affliction cost.
The offer identifies which planet bears each burden and receives each benefit.

Value taking affliction separately from the price of removing it; the two need not form a reversible exchange.
Compare a direct trade, including the cost of later recovery, with buying its benefit at the ordinary Light price.
Better terms can be an intentional placement bonus, with the advantage explicit in the authored offer.
Eligibility and payment are separate: an occupant's special approach can still ask for Light, affliction, or both.

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
Occupants and an available joy supply additional approaches; the occupant's planet–sign dignity shapes its terms.
Historical potency does not automatically increase rewards, and adverse house character does not require every option to be a loss.
The shared economy and encounter limits constrain all offers; there are no cumulative modifiers for each reference attribute.

### 4.1 Planetary joys

A house's fixed joy assignment identifies the planet to inspect, wherever it resides in the natal chart.
That planet's current unlock status, affliction, and combustion determine whether the additional options are available.
This gives players opportunities they can preserve, lose, and restore through their decisions during a run.

A joy is present when it is unlocked, lit, and below 96 affliction.
At or above that threshold, or when combusted, its special approach disappears.
This threshold remains provisional.

### 4.2 Occupants and dignity

Dignity derived from an occupant's planet–sign pair shapes its offer's terms, following the [natal relationships](HOUSES.md#32-natal-placements-and-relationships).
Neutral, detriment, and fall placements should still support substantive special options.

Favorable dignity can provide better terms, including lower costs or greater benefits, alongside some alternative exchanges.
These advantages are authored into individual offers rather than applied through an automatic exchange-rate multiplier.

Dignities are broadly distributed across charts but retain meaningful birth-cohort effects, especially through slower-moving planets.
Keep dignity bonuses modest enough that their cumulative value does not excessively advantage particular charts or cohorts.
Assess repeated savings and access to run-long growth as well as the value of a single offer.
Exact amounts remain subject to encounter design and playtesting.

### 4.3 Current predicates

These are the current client predicates.
For these predicates, Domicile and Exaltation are the strong band.

| Predicate | True when |
|---|---|
| `joyPresent` | The joy is unlocked, lit, and below the affliction threshold. |
| `joyStrong` | The joy is present and has strong dignity. |
| `rulerStrong` | The fixed game ruler is lit, unlocked, and has strong dignity. |
| `anyCombusted` | At least one unlocked planet is combusted. |

Visibility is distinct from affordability.
A chart-gated option is absent when its predicate fails.
Revival is offered only when an unlocked planet is combusted.
An offered choice with insufficient Light or no valid targets stays visible with an explanation.

### 4.4 Asymmetric joy

This economic treatment combines the house's joy assignment with that planet's benefic or malefic character.
It is a game adaptation of the historical affinities.
Benefic joys add help: a free restoration, a gift, or a better way through the scene.
Contained malefics reduce harm: Mars or Saturn can absorb a smaller, scoped cost in their own domains.
Without containment, the ordinary choices may concentrate a larger burden or spread it across the lit chart.
All costs remain visible and immediate.

### 4.5 House–sign economic balance

Narrative variation should be available throughout the chart, including empty houses.
Where house–sign combinations change ordinary economic offers, arrange those differences in a cycle or equivalent distribution so that every chart receives equivalent aggregate economic opportunity across the encounter catalogue.

Evaluate each of the twelve Ascendant arrangements separately.
Every chart containing each sign once does not, by itself, establish equivalence: the particular house–sign pairings also matter.
Account for encounter frequency, prices, payment methods, benefit types, and target restrictions.
Use the shared economy table in §2.1 as the valuation reference.

Compare the available choices as alternatives; their benefits cannot simply be added together when only one option can be taken.
Check that nominally equivalent arrangements remain comparably useful under representative resource levels and planetary conditions.
Equivalence concerns the opportunities supplied by the catalogue, rather than identical outcomes in every run.

### 4.6 Composing and revising a scenario

Follow the lookup order in [HOUSES.md §3.4](HOUSES.md#34-composition-and-lookup-order) while drafting.
Each step below applies a reference or relationship to the scene without requiring every attribute to appear in every option.

1. **Read the house reference and establish the situation.**
   Select a concrete topic and consider its fixed geometry, favorability, joy affinity, and fixed game ruler together.
   The house matrix separates the historical basis from proposed writing applications, including questions of agency and opportunity.
   House geometry is already accounted for in ordinary offers; do not count it again as a placement bonus.
2. **Resolve the house's sign and write ordinary choices.**
   Use the Ascendant and house to select the sign reference, including its imagery, element, and modality.
   Let these shape the manner, mood, and any alternative trades.
   The scene remains usable without an occupant or an available joy option.
3. **Resolve occupant references and develop special approaches.**
   Use each occupant's house–planet entry for a particular want and action, and its planet–sign entry for expression and dignity.
   Explain any change in terms justified by the resulting dignity.
4. **Read current condition and price the offers.**
   Inspect the house's joyful planet wherever it resides to determine joy availability, then read current resources and valid targets for all options.
   If the same planet supplies both an occupant approach and a joy option, identify the eligibility and advantage of each offer without automatically combining bonuses.
   Apply the shared economy, targets, affordability, immediate resolution, and three-choice limit.
   A burden in the fiction does not by itself justify an affliction cost; the stated action should explain the actual exchange.
   Place replacement options beside their ordinary counterparts so the change in opportunity is clear.
5. **Review the experience and the catalogue.**
   Read the Prince's motive, likely player experience, and economic value separately.
   Check playability across current conditions, the aggregate house–sign balance, and cumulative dignity advantages before adopting the scene.

Keep a brief rationale with a proposed scene: which House, Sign, or Planet attributes inform the situation, which placement or current condition changes availability, and what changes terms.
A source link and a few sentences or a compact comparison are sufficient; the 84 research entries need no new checklist.
Record what the current resolver can support separately from proposed effects.

To refine a reference attribute's contribution, compare alternative interpretations while holding the selected chart and other authoring choices steady.
For example, VI is always cadent and averse; compare how different VI scenes express those attributes rather than treating them as chart variations.
When comparing charts, use valid placements and name which linked references change: holding occupants fixed while changing their house's sign also changes their signs and may change dignity.
Changing affliction can change joy availability while leaving the natal references intact.
If a proposed influence adds no useful distinction, simplify its use and update the relevant guidance rather than adding a token sentence or bonus.
Keep unresolved writing questions separate from economic or implementation questions so each can be revisited on its own evidence.

## 5. Encounter Shape

### 5.1 One decision

Each scene has one prompt and at most three visible choices, including any exit.
The default is two substantive offers and a way to decline.
Chart-conditioned offers replace their standard counterparts within that limit.
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
Usually this is a plain exit; a harsh house can instead impose a small ordinary Light loss, which clamps at zero.

## 6. Provisional Amounts

Authored amounts are multiples of 12.
Existing scenarios use affliction changes of 12–72, Light gains up to 96, and healing prices of 12–36.
They price ordinary revival at 84 Light; a strong fixed game ruler of Home offers a 60-Light alternative.
Revival always returns a planet at half its own ceiling.

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

There are two scenarios per house.
A stable `scenarioId` is the unit of the no-repeat rule.
Prefer unseen scenarios within the selected house; recycle when its pool is exhausted.
The scenario and aria fragment are chosen on entry and persist through reloads.
The alpha schema resets old tree-based saves rather than migrating them.

## 9. Prose and Mechanical Copy

- **Aria:** one fragment in the fixed game ruler's voice for the whole encounter.
- **Prompt:** one or two concrete sentences that establish the immediate situation.
- **Option:** a short action, with no implied debt or promise that the game does not track.
- **Aside:** shows the full authored amounts and costs; stays fixed while inspecting planets.
- **Consequence:** one specific sentence for the immediate result.

Mechanics belong in the aside, not in the scene's prose.
Planet previews and read-only effect amounts show the actual changes from the shared resolver, including recovery clamped to current affliction.
Player-facing text uses encounter, self, and other; named Light and Resolve follow the shared copy register.

## 10. Validation

Every authored scene must remain playable across all unlock tiers and representative clean, afflicted, and partially combusted charts.
Preview and commit must agree for every valid target.
Tests cover full payment, ordinary losses, invalid targets, combustion margins, revival, repeated resolution, and save resets.
Playtests compare choices across chart conditions and upcoming rulers.
Catalogue reviews check baseline economic equivalence across the twelve Ascendant arrangements and cumulative advantages from dignity and joy options, including dignity's birth-cohort effects, as described in §4.
Editorial reviews use the scenario rationale in §4.6 to check that historical claims, original interpretations, eligibility, and economic advantages remain distinguishable.

## 11. Deferred Decisions

Wagers, deliberate sacrifice, transfers, persistent effects, multi-stage scenes, and final balance remain deferred.
The precise house–sign economic cycle and numerical limits on dignity bonuses remain to be designed and tested.
No additional run currency or lasting narrative state is introduced by this version.
