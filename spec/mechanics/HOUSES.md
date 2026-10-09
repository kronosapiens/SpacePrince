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

- Provide a second encounter type shaped by house, sign, and planet references selected through natal placements and current condition.
- Give each of the twelve houses a distinct mechanical identity.
- Give each Prince chart-specific approaches while keeping ordinary economic opportunity equivalent across charts.
- Keep each encounter to one decision, with target selection and previews before commitment.
- Influences include Slay the Spire and Faster Than Light, whose events connect available resources to the choices ahead.

### In Scope (v1)

- Chart-conditioning model: fixed references, their relationships in the natal chart, and current condition.
- **Essential dignity from planet and sign.**
  The chart computes dignity from this pair (`CHART.md`), which shapes the economic terms of occupant approaches under `ENCOUNTERS.md §4`.
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

Group each attribute under the reference that determines it.
House, sign, and planet supply fixed references; natal placements connect them; current run state determines availability and usefulness.
Cadency and aversion belong to House, just as element and modality belong to Sign.
Selecting their parent determines them together.

### 3.1 Fixed references

| Reference | Indexed by | Fixed contents |
|---|---|---|
| House | One of twelve houses | Topics, geometry and angularity, relationship to the Ascendant and favorability, joy assignment, fixed game ruler |
| Sign | One of twelve signs | Imagery, element, modality, traditional ruler, manner of expression |
| Planet | One of seven planets | Domains, archetype, voice, benefic or malefic character where applicable |

Placements and relationships select combinations of these references, as described in §3.2.
They are linked lookups rather than independent random selections.
A reference can influence the fiction without adding a numerical modifier.
The Prince's motives and emotions remain distinct from economic advantage and from the player's experience, as described in [DRIVES.md](../concept/DRIVES.md).

#### House

Read all fixed house attributes together from the [house matrix](../concept/HOUSE_MATRIX.md).
Historical classifications and their qualifications are explained in [ASTROLOGY.md](../concept/ASTROLOGY.md#favorable-and-unfavorable-houses).

| House attribute | Contribution to authoring |
|---|---|
| Topics | Human situation and what is at stake |
| Diurnal geometry and angularity | Position from which action occurs, authority, and constraints on agency |
| Relationship to the Ascendant and favorability | Tendencies toward opportunities or burdens in ordinary offers |
| Joy assignment, where present | Planetary affinity contributing to house character; identifies the planet whose condition can enable joy options |
| Fixed game ruler | Color, musical identity, and the opening voice |

**Geometry and angularity:** I, IV, VII, and X are angular; II, V, VIII, and XI succedent; III, VI, IX, and XII cadent.
Our adaptation asks who can act directly, who holds authority, and what the Prince depends on.
Apply those questions through the house's topics: angular IV can remain private, and cadent IX can offer consequential understanding.
An occupant shares its house's classification, with no additional angularity bonus or calculation of other planets' influence.

**Relationship to the Ascendant and favorability:** I is the origin; III, IV, V, VII, IX, X, and XI aspect it; II, VI, VIII, and XII are averse.
This fixed relationship is distinct from aspects cast by planets elsewhere in an individual chart.
Historical favorability informs our **valence**: favorable houses tend toward assistance and opportunity; adverse houses toward necessity, constraint, and extraction.
These are authoring tendencies rather than guaranteed outcomes or prescribed emotional tones.
II can concern abundance as well as scarcity; VIII can offer a gain without making a loss beneficial.
Angularity and favorability remain distinct attributes of House: potency does not itself make an offer generous.

**Joy assignment:** Venus's affinity with V, for example, contributes to its pleasures regardless of occupancy.
These affinities do not establish a single historical origin for every house topic.
The assignment is fixed by house; an option's availability is derived from that planet's changing condition (§3.3).
Houses without a joy still have ordinary offers and occupant approaches.

**Fixed game ruler:** this follows the game's natural-zodiac convention and supplies presentation rather than another source of the Prince's wants.
It is distinct from the house's occupant, joy, and the traditional ruler of its natal sign, even when they name the same planet.
Current ruler-based predicates are documented separately from the intended occupant model in `ENCOUNTERS.md §4.3`.

#### Sign

The [sign reference](../concept/PLANET_MATRIX.md#sign-matrix) groups each sign's emblem, element, modality, and traditional ruler.
These attributes inform manner, mood, and imagery together.
They can also inform authored ordinary tradeoffs, subject to the aggregate balance check in §3.4.
The natal chart selects the sign for each house; empty houses retain this expression.

#### Planet

Each planet supplies domains and a characteristic way of wanting or acting; [PLANETS.md](../concept/PLANETS.md) develops its archetype and voice.
Venus and Jupiter's benefic character, and Mars and Saturn's malefic character, belong to these planet references.
They do not assign a moral personality or require a particular emotional outcome.
Mercury, the Moon, and the Sun also participate in the joy scheme without being assigned either of these two roles for its economic treatment.

The **asymmetric joy rule** combines a house's fixed joy assignment with its planet's character.
It is our game adaptation: benefic joy options add help, while Mars and Saturn's options contain a burden in VI and XII.
Loss of a joy option removes that help or mitigation without prescribing the scene's emotional outcome.
The economic treatment lives in [ENCOUNTERS.md §4.4](ENCOUNTERS.md#44-asymmetric-joy).

### 3.2 Natal placements and relationships

Under whole-sign houses, the Ascendant sign and planetary signs determine the house–sign arrangement and occupancy.
Use these relationships to select references and approaches; dignity is derived from a planet–sign pair.

| Relationship | Determined by | Encounter use |
|---|---|---|
| House and sign | Ascendant sign and encounter house | Shared situation expressed through the selected sign, including ordinary tradeoffs |
| Planet and house | Planet's natal sign relative to the Ascendant sign | Occupant wants and special approaches from the 84 [house–planet entries](../concept/HOUSE_PLANET_MATRIX.md) |
| Planet and sign | Planet identity and its natal sign | Expression from the 84 [planet–sign entries](../concept/PLANET_MATRIX.md); essential dignity and resulting occupant terms |

An occupant necessarily has the sign of its whole-sign house.
Its house–planet entry develops what it wants in that situation; its planet–sign entry develops how it expresses that concern.
The entries allow mixed motives, enjoyment, refusal, and unresolved feelings.

Essential dignity shapes economic terms rather than replacing the planet's concern or settling the emotional meaning of a choice.
Favorable dignity can improve an offer, while neutral, detriment, and fall placements retain substantive approaches.
Bonuses remain modest because repeated advantages and birth-cohort effects can accumulate; detailed guidance lives in `ENCOUNTERS.md §4.2`.

### 3.3 Current run state

Read unlocks, affliction, derived combustion, and Light from the current run.
These determine valid targets, affordability, and which approaches are currently usable.

Joy availability is derived by taking the house's fixed joy assignment and inspecting that planet's condition wherever it resides.
Unlock status, affliction, and combustion can open or close its additional approaches, giving players opportunities they can preserve, lose, and restore.
Natal occupancy is not required.
The current threshold and related predicates live in [ENCOUNTERS.md §4.1–4.3](ENCOUNTERS.md#4-chart-conditioning).

### 3.4 Composition and lookup order

The economy, immediate resolution, target rules, and three-choice limit apply across the catalogue.
They constrain composition without adding another chart axis.
Identify which reference explains an approach and which, if any, explains its economic advantage.
Shared house geometry is accounted for in ordinary offers; do not count it again as a placement bonus.

Where house signs change ordinary offers, each of the twelve Ascendant arrangements should receive equivalent aggregate economic opportunity across the catalogue.
Individual houses can differ; assess the complete arrangements with encounter frequency and usable choices accounted for.
Use the shared economy to value direct exchanges as well as Light payments, then check the cumulative advantage of dignity and joy options.
The valuation and catalogue checks live in `ENCOUNTERS.md §2.1` and `§4.5`.

For an encounter in VI with Sagittarius rising, Venus in Taurus, and Mars in Aquarius:

1. **Read House VI.**
   Its topics include labor and care; it is cadent and averse, its joy is Mars, and its fixed game ruler is Mercury.
   These attributes remain the same in every chart.
2. **Resolve the house's sign.**
   Sagittarius rising places Taurus in VI, supplying Taurus's imagery, earth element, fixed modality, and traditional ruler Venus.
   That sign ruler does not replace Mercury's fixed presentation role.
3. **Resolve occupants and their references.**
   Venus in Taurus occupies VI, selecting Venus–VI wants and Venus–Taurus expression.
   Venus–Taurus also determines domicile dignity, which can improve the approach's terms.
4. **Inspect the relevant current state.**
   Mars in Aquarius occupies III, but its condition can still enable VI's joy option.
   Read the current resources and eligible targets for each proposed choice.
5. **Compose and validate the offers.**
   Apply the shared encounter rules to ordinary, occupant, and joy options using [ENCOUNTERS.md §4.6](ENCOUNTERS.md#46-composing-and-revising-a-scenario).

This grouping defines authoring dependencies; exact scene prices and the runtime representation remain separate implementation work.

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
Those summarize the earlier implementation; new authoring records geometry, favorability, and joy as distinct attributes of House, as described in §3.
The existing mechanical blueprints remain in `ENCOUNTERS.md §7` while the catalogue is refreshed.
