# Space Prince — Houses (Narrative Encounters)

This document defines the **narrative encounter** system, organized around the twelve astrological houses.
Narrative encounters are an alternative node type to combat, offering a single decision about immediate costs, recovery, or revival.

Combat mechanics are specified in `spec/mechanics/MECHANICS.md`.
Chart construction (whole-sign houses, ASC, rulerships) is specified in `spec/mechanics/CHART.md`.
Map topology is specified in `spec/mechanics/MAP.md`.

### Reading the encounter references

| Reference | Responsibility |
|---|---|
| [ASTROLOGY.md](../concept/ASTROLOGY.md#favorable-and-unfavorable-houses) | Historical concepts, sources, and qualifications |
| [HOUSE_MATRIX.md](../concept/HOUSE_MATRIX.md) | Each house's classifications, situations, and original authoring guidance |
| [HOUSE_PLANET_MATRIX.md](../concept/HOUSE_PLANET_MATRIX.md) and [PLANET_MATRIX.md](../concept/PLANET_MATRIX.md) | Planetary wants in each house and their expression through signs |
| [DRIVES.md](../concept/DRIVES.md) | Motives, emotional range, and the distinction between Prince and player |
| This document, §3 | How the sources contribute to the encounter model |
| [ENCOUNTERS.md](ENCOUNTERS.md) | Scenario composition, economic terms, eligibility, resolution, and review |

Historical claims and original game interpretations remain separately identified in these references.
The matrices supply writing possibilities; the authoring spec determines which effects can currently resolve.

---

## 1. Purpose and Scope

### Goals

- Provide a second encounter type shaped by house and sign, planetary occupants, dignity, and joy condition.
- Give each of the twelve houses a distinct mechanical identity.
- Give each Prince chart-specific approaches while keeping ordinary economic opportunity equivalent across charts.
- Keep each encounter to one decision, with target selection and previews before commitment.
- Influences include Slay the Spire and Faster Than Light, whose events connect available resources to the choices ahead.

### In Scope (v1)

- Chart-conditioning model: how house signs, occupants, dignity, and joy condition shape encounters.
- **Essential dignity as an input.**
  The chart computes dignity (`CHART.md`), which shapes the economic terms of occupant approaches under `ENCOUNTERS.md §4`.
  Dignity is not a combat input (`MECHANICS.md §10`).
- Twelve house archetypes: topics, fixed geometry, favorability, and joy.
- Outcome vocabulary: what resources narrative encounters can move.
- Encounter shape: one decision, immediate consequences, previews, and exits.

### Out of Scope (v1)

- Authored prose / flavor text for each encounter.
- Exact risk/reward curves (fine-tune later).
- Map placement logic — whether a node's house is fixed at map generation or selected on entry.
- Art direction for narrative screens.
- Additional influences from planets aspecting the encounter house from elsewhere, and weighting by proximity to the exact angles.

---

## 2. Outcome Vocabulary

Narrative encounters operate on the same resources as combat.
Light can be gathered or spent; affliction can be added or relieved.
A combusted planet can return at half its ceiling.
Purchases require full payment; ordinary Light losses clamp at zero.
The exact outcome vocabulary and validation rules live in `ENCOUNTERS.md §2–3`.

Omen, Lore, debts, vows with later consequences, and other persistent effects are deferred.
Their storage and gameplay costs require a separate design decision.

---

## 3. Chart-Conditioning Model

Read the inputs separately before combining them in a scene.
Shared house properties establish the situation; natal placements supply expression and approaches; current condition and the economy determine which offers can be used.

| Input | What varies | Contribution |
|---|---|---|
| House topics | Fixed by house | Human situation and what is at stake |
| House geometry and angularity | Fixed by house | Position from which action occurs, authority, and constraints on agency |
| House favorability | Fixed by house | Balance of opportunities and burdens in ordinary offers |
| House sign | Natal chart | Manner, mood, and possible ordinary tradeoffs |
| Occupying planet | Natal chart | Particular wants and special approaches |
| Occupant's dignity | Planet and sign | Economic terms and modest bonuses for those approaches |
| Planetary joy | Fixed affinity; condition varies during play | House character and additional approaches available through its joyful planet |
| Economy and run state | Shared valuation; resources vary during play | Prices, targets, affordability, and the usefulness of an offer now |

These are authoring contributions, not independent numerical modifiers to add together.
A source can influence the fiction without adding a mechanical effect.
The Prince's motives and emotions remain distinct from economic advantage and from the player's experience, as described in [DRIVES.md](../concept/DRIVES.md).

### 3.1 House topics and geometry

Start with the house's human situation, using the [house matrix](../concept/HOUSE_MATRIX.md).
Its fixed position supplies another influence: I is associated with rising, IV with the private foundation, VII with meeting the other, and X with public action.
The angular, succedent, and cadent classifications describe relationships to these four angles; their historical basis is in [ASTROLOGY.md](../concept/ASTROLOGY.md#favorable-and-unfavorable-houses).

Our adaptation uses this geometry to ask who can act directly, who holds authority, and what the Prince depends on.
Apply those questions through each house's topics: angular IV can remain private, and cadent IX can offer consequential understanding.
An occupant shares its house's classification; this adds no separate angularity bonus or calculation of influence from other planets.

### 3.2 Aspect to the ASC and favorability

The house matrix records each house's relationship to the rising sign.
I is the origin; III, IV, V, VII, IX, X, and XI aspect it; II, VI, VIII, and XII are averse.
This is fixed house geometry, distinct from aspects cast by planets elsewhere in an individual chart.

Historical favorability informs our **valence**: favorable houses tend toward opportunities and assistance; adverse houses toward necessity, constraint, and extraction.
These are tendencies to test when composing ordinary offers, not guaranteed outcomes or prescribed emotional tones.
II can concern abundance as well as scarcity; VIII can offer a gain without making a loss beneficial.
The same economic opportunity can evoke pleasure, envy, relief, or resentment.
Angularity and favorability stay separate: potency does not itself make an offer generous.

### 3.3 Joys

The fixed joy assignments are recorded in the [house matrix](../concept/HOUSE_MATRIX.md#game-correspondences).
They contribute to house character independently of the occupant: Venus's affinity with V, for example, supplies one influence on its pleasures.
These affinities do not establish a single historical origin for every house topic.

The game also reads the joyful planet's unlock status, affliction, and combustion wherever it resides.
Those changing conditions can open or close additional approaches, giving players opportunities they can preserve, lose, and restore during a run.
Natal placement does not exclude a Prince from those joy options.
Houses without a joy still have ordinary offers and occupant approaches.

The **asymmetric joy rule** is our game adaptation: benefic joy options add help, while Mars and Saturn's options contain a burden in VI and XII.
Loss of a joy option removes that help or mitigation; it does not prescribe the scene's emotional outcome.
Availability and economic treatment are specified in [ENCOUNTERS.md §4.1–4.4](ENCOUNTERS.md#4-chart-conditioning).

### 3.4 House signs

The natal sign shapes how the house's situation is expressed, including its writing, mood, and possible ordinary tradeoffs.
This applies in empty houses as well as occupied ones.
Use the [planet and sign reference](../concept/PLANET_MATRIX.md) for expression while keeping the house's topics recognizable.
The sign influences the terms on offer through authored variations, subject to the aggregate balance check in §3.7.

### 3.5 Occupants

An occupying planet supplies a particular concern and unlocks special approaches within the house's shared situation.
The [house and planet matrix](../concept/HOUSE_PLANET_MATRIX.md) develops these wants and possible responses for all 84 placements.
Its entries allow mixed motives, enjoyment, refusal, and unresolved feelings; they do not assign a moral personality.

Occupancy, joy, and the fixed game ruler have separate roles even when they name the same planet.
The fixed ruler supplies color, musical identity, and the opening voice; it is not another source of the Prince's wants.
Current ruler-based predicates are documented separately from the intended occupant model in `ENCOUNTERS.md §4.3`.

### 3.6 Dignity

Essential dignity shapes the economic terms of an occupant's approach.
Favorable dignity can improve an offer, while neutral, detriment, and fall placements retain substantive approaches.
It does not replace the planet's concern or settle the emotional meaning of the choice.
Bonuses remain modest because repeated advantages and birth-cohort effects can accumulate; detailed guidance lives in `ENCOUNTERS.md §4.2`.

### 3.7 Combining influences and checking balance

Compose a coherent situation before selecting the effects it supports.
Identify which source explains each special approach and which, if any, explains its economic advantage.
Shared house geometry is accounted for in the house's ordinary offers; do not count it again as a placement bonus.
The composition and revision process is in [ENCOUNTERS.md §4.6](ENCOUNTERS.md#46-composing-and-revising-a-scenario).

Where house signs change ordinary offers, each of the twelve Ascendant arrangements should receive equivalent aggregate economic opportunity across the catalogue.
Individual houses can differ; assess the complete arrangements with encounter frequency and usable choices accounted for.
Use the shared economy to value direct exchanges as well as Light payments, then check the cumulative advantage of dignity and joy options.
The valuation and catalogue checks live in `ENCOUNTERS.md §2.1` and `§4.5`.

---

## 4. Encounter Shape

### 4.1 Structure

Each encounter has one prompt and at most three visible options, including any exit.
Every choice resolves immediately, with a specific consequence sentence.
Choosing a target planet is part of preparing the choice and does not advance the encounter.

### 4.2 Direct effects

Every choice has a determined consequence, previewed before commitment.
Planet selection uses the shared encounter chart and readout.
Wagers, deliberate sacrifice, transfers, and multi-stage encounters are deferred until the one-decision experience is refined.

### 4.3 Offered vs always-present

Some options are always visible; chart-conditioned offers replace their standard counterparts within the three-choice limit.
Revival is offered only when a planet is combusted.
This is the primary vehicle for chart-conditioning.

> Example: in FTL, having a certain species as a shipmate unlocks certain narrative paths.

---

## 5. The Twelve Houses

The [house matrix](../concept/HOUSE_MATRIX.md#game-correspondences) records each house's geometry, joy, and fixed game ruler together.
Its individual entries separate source notes from editorial direction, stakes, scenes, and economic applications.
Use those entries for the shared context of all seven planetary placements in a house.

| House | Human situation | Authoring reference |
|---|---|---|
| I · Self | Bodily presence and introducing oneself | [Self](../concept/HOUSE_MATRIX.md#i--self) |
| II · Livelihood | Obtaining, holding, and using resources | [Livelihood](../concept/HOUSE_MATRIX.md#ii--livelihood) |
| III · Communication | Everyday exchange, siblings, and short journeys | [Communication](../concept/HOUSE_MATRIX.md#iii--communication) |
| IV · Home | Shelter, ancestry, and private foundations | [Home](../concept/HOUSE_MATRIX.md#iv--home) |
| V · Creativity | Making, pleasure, children, and play | [Creativity](../concept/HOUSE_MATRIX.md#v--creativity) |
| VI · Labor | Necessary work, illness, and receiving care | [Labor](../concept/HOUSE_MATRIX.md#vi--labor) |
| VII · Relationships | Partnership, negotiation, and open opposition | [Relationships](../concept/HOUSE_MATRIX.md#vii--relationships) |
| VIII · Transformation | Death, endings, inheritance, and others' resources | [Transformation](../concept/HOUSE_MATRIX.md#viii--transformation) |
| IX · Pilgrimage | Travel, belief, and unfamiliar learning | [Pilgrimage](../concept/HOUSE_MATRIX.md#ix--pilgrimage) |
| X · Achievement | Public action, recognition, and authority | [Achievement](../concept/HOUSE_MATRIX.md#x--achievement) |
| XI · Friendship | Allies, shared hopes, and assistance | [Friendship](../concept/HOUSE_MATRIX.md#xi--friendship) |
| XII · The Hidden | Seclusion, confinement, and what others cannot see | [The Hidden](../concept/HOUSE_MATRIX.md#xii--the-hidden) |

The current [client house data](../../client/src/data/houses.ts) still stores good/bad valence and compound kind labels such as contained-malefic and pure-bad-place.
Those summarize the earlier implementation; new authoring considers geometry, favorability, and joy separately as described in §3.
The existing mechanical blueprints remain in `ENCOUNTERS.md §7` while the catalogue is refreshed.
