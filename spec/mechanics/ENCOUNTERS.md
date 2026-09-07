# Space Prince — Narrative Encounter Authoring Spec

Narrative encounters are single decisions about the chart the player will carry onward.
House concepts live in `HOUSES.md`, combat rules in `MECHANICS.md`, and presentation in `SCREENS.md §3.2`.
Authored scenes live in `client/src/data/narrative-scenarios.ts`; validation, targeting, previews, and resolution live in `client/src/game/narrative.ts`.

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

House valence guides the kinds of offers and their severity.
Dignity reveals alternative approaches; it does not apply an automatic exchange-rate multiplier.
Exact balance remains deferred.

## 2. Outcomes and Payment

Only immediate changes to combat-shared resources are implemented.
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

## 3. Targeting

Only unlocked planets may be selected or affected.
Ordinary affliction effects require lit planets; revival requires a combusted planet.

| Target | Meaning |
|---|---|
| `chosen` | The player's selected planet. |
| `allUnlocked` | All currently lit unlocked planets. |
| `joy` | The house's joy, only if lit and unlocked. |
| `ruler` | The house's natural ruler, only if lit and unlocked. |
| `mostAfflicted` | The lit unlocked planet with greatest affliction. |
| `healthiest` | The lit unlocked planet with greatest remaining combustion margin. |

Target roles bind against the state before the choice.
Authored effects then apply in order to a copy of that state.
An unavailable themed target never silently drops its cost or redirects it to someone else.

Selected targets are the usual grammar for individual harm and recovery.
Automatic roles remain available where the situation calls for them.
Early scenes must still work with only the Moon unlocked.

## 4. Chart Conditioning

### 4.1 Current condition

A joy is present when it is unlocked, lit, and below 96 affliction.
At or above that threshold, or when combusted, its special approach disappears.
This threshold remains provisional.

### 4.2 Dignity

Domicile and Exaltation are the strong band.
Neutral, Detriment, and Fall do not reveal strong-dignity approaches.
A strong ruler must also be unlocked and lit.

### 4.3 Predicates

| Predicate | True when |
|---|---|
| `joyPresent` | The joy is unlocked, lit, and below the affliction threshold. |
| `joyStrong` | The joy is present and has strong dignity. |
| `rulerStrong` | The ruler is lit, unlocked, and has strong dignity. |
| `anyCombusted` | At least one unlocked planet is combusted. |

Visibility is distinct from affordability.
A chart-gated option is absent when its predicate fails.
An offered choice with insufficient Light or no valid targets stays visible with an explanation.

### 4.4 Asymmetric joy

Benefic joys add help: a free restoration, a gift, or a better way through the scene.
Contained malefics reduce harm: Mars or Saturn can absorb a smaller, scoped cost in their own domains.
Without containment, the ordinary choices may concentrate a larger burden or spread it across the lit chart.
All costs remain visible and immediate.

## 5. Encounter Shape

### 5.1 One decision

Each scene has one prompt and at most three visible choices, including any exit.
The default is two substantive offers and a way to decline.
Chart-conditioned offers replace their standard counterparts within that limit.
There are no child nodes, intermediate rewards, cash-outs, or traversal state.
Selecting targets and inspecting previews are preparation for the decision, with no gameplay effects.

### 5.2 Commitment

Tap an option to arm it.
For a targeted effect, the shared encounter center mark invites selection on the chart.
Tap an eligible planet to preview its exact consequence, then confirm beneath its readout.
An option without a requested target commits on a second tap of that option.
Hover adds a preview without committing; selecting a planet holds the preview until the player changes or clears it.
A resolved encounter cannot resolve again.
Its consequence is shown before returning to the map; the lifetime encounter count advances on leaving the resolved scene.

### 5.3 Exits

Every scene must offer a valid choice at every unlock tier and at zero Light.
Usually this is a plain exit; a harsh house can instead impose a small ordinary Light loss, which clamps at zero.

## 6. Provisional Amounts

Authored amounts are multiples of 12.
Ordinary affliction changes currently span 12–72, Light gains up to 96, and healing prices 12–36.
The standard paid revival costs 84 Light; a strong Home ruler offers a 60-Light alternative.
Revival always returns a planet at half its own ceiling.
These values support playtesting; they are not settled balance.

## 7. House Blueprints

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

- **Aria:** one fragment in the ruler's voice for the whole encounter.
- **Prompt:** one or two concrete sentences that establish the immediate situation.
- **Option:** a short action, with no implied debt or promise that the game does not track.
- **Aside:** generated from the authored effects and shared resolver; stays fixed while inspecting planets.
- **Consequence:** one specific sentence for the immediate result.

Mechanics belong in the aside, not in the scene's prose.
Player-facing text uses encounter, self, and other; named Light and Resolve follow the shared copy register.

## 10. Validation

Every authored scene must remain playable across all unlock tiers and representative clean, afflicted, and partially combusted charts.
Preview and commit must agree for every valid target.
Tests cover full payment, ordinary losses, invalid targets, combustion margins, revival, repeated resolution, and save resets.
Playtests compare choices across chart conditions and upcoming rulers.

## 11. Deferred Decisions

Wagers, deliberate sacrifice, transfers, persistent effects, multi-stage scenes, and final balance remain deferred.
No additional run currency or lasting narrative state is introduced by this version.
