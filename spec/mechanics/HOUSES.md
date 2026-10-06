# Space Prince — Houses (Narrative Encounters)

This document defines the **narrative encounter** system, organized around the twelve astrological houses.
Narrative encounters are an alternative node type to combat, offering a single decision about immediate costs, recovery, or revival.

Combat mechanics are specified in `spec/mechanics/MECHANICS.md`.
Chart construction (whole-sign houses, ASC, rulerships) is specified in `spec/mechanics/CHART.md`.
Map topology is specified in `spec/mechanics/MAP.md`.

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
- Twelve house archetypes: theme, native valence, joy.
- Outcome vocabulary: what resources narrative encounters can move.
- Encounter shape: one decision, immediate consequences, visible odds, and exits.

### Out of Scope (v1)

- Authored prose / flavor text for each encounter.
- Exact risk/reward curves (fine-tune later).
- Map placement logic — whether a node's house is fixed at map-gen or rolled on entry (see Open Questions).
- Art direction for narrative screens.

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

Each house has three intrinsic structural features, drawn from the Hellenistic tradition, that give it character: its position on the **diurnal cycle**, its **aspect to the ASC**, and its **native joy**.
These provide the house's shared character across charts.

The Prince's house signs and planetary occupants supply individual character, while dignity and joy condition shape the available terms and approaches.

### 3.1 Diurnal cycle

Each house sits at a fixed position in the day/night rotation of the sky: rising at the ASC (1st), culminating at the MC (10th), setting at the DSC (7th), hiding at the IC (4th), with the other eight distributed between these four pivots.

A house that sits on one of these four pivots is called **angular**. In this doc, "angular" means only that — sitting on a pivot — not the classical three-tier angular/succedent/cadent taxonomy.

- Encounters should feel rooted in this geometry: the 1st is emergence, the 10th is the public summit, the 7th is the threshold of the other, the 4th is the secret interior.
- The cycle itself doesn't vary per chart, but proximity of a tenant to an angle weights its narrative voice.

### 3.2 Aspect to the ASC

Every house either does or doesn't form a classical aspect (conjunction, sextile, square, trine, opposition) to the 1st:

- **Good places** (1, 3, 4, 5, 7, 9, 10, 11): aspect the ASC. Native valence favorable.
- **Bad places** (2, 6, 8, 12): averse — no aspect. Native valence hostile.

This contributes to the baseline emotional tone: good places tend to reward, bad places tend to extract.
House signs, occupants, and joy condition supply the chart variation described in §3.4.

### 3.3 Joys

Each of the seven planets rejoices in one house: Mercury-1, Moon-3, Venus-5, Mars-6, Sun-9, Jupiter-11, Saturn-12. This assignment is fixed by tradition — a permanent affinity between planet and house, independent of any chart.

The joy shapes the house's character in every chart, regardless of where the joy-planet is physically placed. The 5th feels Venusian (pleasure, creativity, play) because Venus joys there. The 6th feels Martial (toil, strife, wearing work) because Mars joys there. The 12th feels Saturnine (sorrow, concealment, slow weight) because Saturn joys there. This tint is baked into each house's theme in §5.

**Chart-conditioning via joy.**
A joy-house reads its joy-planet's unlock status, affliction, and combustion wherever that planet sits.
These conditions can open or close additional approaches, giving players opportunities they can preserve, lose, and restore during a run.
Every chart contains all seven planets, so natal placement does not exclude a Prince from a house's joy options.
The current availability threshold is recorded in `ENCOUNTERS.md §4.1`.

This preserves the **asymmetric joy rule** from §5.0: a well-conditioned benefic joy-planet intensifies the pleasantness of its joy-house; a well-conditioned malefic joy-planet *contains* the malefice of its joy-house. When the joy-planet is afflicted, benefic joy-houses lose their boon and malefic joy-houses lose their containment.

The five houses with no joy (2, 4, 7, 8, 10) acquire character from other sources — primarily the diurnal geometry (4th and 10th as IC/MC, 7th as DSC) and the aspect-to-ASC rule (2nd and 8th as bad places). Joy is one of several ways houses acquire meaning, not the only one.

*Historical note.* Classical practice treats "in joy" both as this permanent affinity and as a minor placement dignity (the planet is stronger when actually in its joy-house). We've deliberately collapsed the two into the affinity sense alone: it applies to every chart equally, it's historically the primary sense, and it keeps the mechanic a single clean lever. The placement-dignity sense can be reintroduced later if encounter density needs another axis.

### 3.4 Encounter variation and balance

House and sign shape the scenario, writing, mood, and ordinary offers, including in empty houses.
Where those offers differ economically, distribute them so that each of the twelve Ascendant arrangements receives equivalent aggregate economic opportunity across the catalogue.
Evaluate the complete arrangements with encounter frequencies and usable choices accounted for; each chart containing every sign once is not sufficient.

Planetary occupants unlock special approaches grounded in their concerns within the house.
Dignity organizes the economic terms of those approaches, with substantive options for neutral, detriment, and fall placements as well as favorable dignity.
Keep bonuses modest and assess their cumulative value across charts and birth cohorts, since dignity retains cohort effects from slower-moving planets.
Joys add options through the joyful planet's current condition, regardless of its natal placement.

The detailed authoring and balance guidance lives in [ENCOUNTERS.md §4](ENCOUNTERS.md#4-chart-conditioning).

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

Each house is documented below with its **valence** (good place or bad place, per §3.2), its **joy** (the planet that rejoices here, per §3.3), its **kind** (category; see below), and a short note on **theme** (traditional meaning plus modern gloss).
These concepts frame the mechanical blueprints in `ENCOUNTERS.md §7`.

### 5.0 Categories

The twelve houses fall into five categories based on which of the three anchoring features — joy, angular position, averse-to-ASC — apply to them. The category captures how each house acquires its character. Every house has at least one anchor; three have two.

- **Double-anchored (1):** joy + angular. The only house with both. Overdetermined by design — it *is* the chart's origin.
- **Pure angular (4, 7, 10):** no joy, but sit on the diurnal angles (IC, DSC, MC).
  Their shared themes come from sky geometry: private interior, the other, public summit.
- **Benefic joys (3, 5, 9, 11):** a benefic (Moon, Venus, Sun, Jupiter) joys here in a good place. The pleasant houses. When the joy-planet is well-conditioned, the house reads at its most favored; when afflicted or combust, the house still carries the benefic tint but the favored voice goes flat.
- **Contained malefics (6, 12):** a malefic (Mars, Saturn) joys in a bad place. Classical containment — the malefic is given a role that fits its nature. When the joy-planet is well-conditioned, its harshness stays scoped and legible (the malefic has honest employment); when afflicted or combust, containment fails and the house reads at its worst.
- **Pure bad places (2, 8):** averse to the ASC, no joy, not angular.
  Their baseline concerns are scarcity and loss.
  House signs shape their scenes and ordinary offers, and occupants unlock special approaches, as in other houses.
  They have no additional joy options.

This typology surfaces an **asymmetric joy rule**: *benefic joys add good, malefic joys remove bad.* A well-conditioned Venus intensifies the 5th's pleasure; a well-conditioned Mars *contains* the 6th's toil rather than amplifying it. A well-conditioned Jupiter delivers the 11th's gifts; a well-conditioned Saturn makes the 12th's sorrow legible and scoped. When mechanics are eventually committed, this asymmetry should be preserved — a clean benefic joy is a bonus, a clean malefic joy is a mitigation, and the two shouldn't collapse into the same mechanic.

### Summary

| # | Name | Valence | Joy | Angular | Kind |
|---|---|---|---|---|---|
| 1 | Self | Good | Mercury | ASC | Double-anchored |
| 2 | Livelihood | Bad | — | — | Pure bad place |
| 3 | Communication | Good | Moon | — | Benefic joy |
| 4 | Home | Good | — | IC | Pure angular |
| 5 | Creativity | Good | Venus | — | Benefic joy |
| 6 | Labor | Bad | Mars | — | Contained malefic |
| 7 | Relationships | Good | — | DSC | Pure angular |
| 8 | Transformation | Bad | — | — | Pure bad place |
| 9 | Pilgrimage | Good | Sun | — | Benefic joy |
| 10 | Achievement | Good | — | MC | Pure angular |
| 11 | Friendship | Good | Jupiter | — | Benefic joy |
| 12 | The Hidden | Bad | Saturn | — | Contained malefic |

### 5.1 First — Self
*Horoskopos (the "hour-marker," the Ascendant)*

- **Valence:** Good place. The chart's point of view; the house of emergence.
- **Joy:** Mercury.
- **Kind:** Double-anchored. The only house with both a joy and an angular position. The self-house is overdetermined by design.
- **Theme:** The self, the body, vitality, temperament. In modern framing: identity, the "new beginning" one is always arriving at.

### 5.2 Second — Livelihood
*Haidou Pylē ("Gate of Hades")*

- **Valence:** Bad place. Averse to the ASC. The house of scarcity and substance.
- **Joy:** None.
- **Kind:** Pure bad place.
  It has no joy and sits off the diurnal angles.
  Its house sign and occupants supply variation and special approaches within the concerns of livelihood.
- **Theme:** Resources, livelihood, what one must secure to keep going. The "gate of Hades" framing marks this as a narrow passage, not an abundance.

### 5.3 Third — Communication
*Thea ("Goddess")*

- **Valence:** Good place. Small, intimate, close to home.
- **Joy:** Moon.
- **Kind:** Benefic joy. The Moon joys here in a good place. A well-conditioned Moon opens the house's reflective, intimate voice; an afflicted or combust Moon leaves the Lunar tint without the favor.
- **Theme:** Siblings, short journeys, communication, dreams, daily speech. The Moon's joy gives this house a quality of reflection and ordinary intuition.

### 5.4 Fourth — Home
*Hypogeion ("Under the Earth") — the IC*

- **Valence:** Good place. The hidden foundation; the private interior.
- **Joy:** None.
- **Kind:** Pure angular. Identity comes from the IC — the lowest point of the sky, the midnight-point, what is buried.
- **Theme:** Home, ancestors, roots, endings. The foundational layer beneath the public self; the counterpart to the 10th.

### 5.5 Fifth — Creativity
*Agathē Tychē ("Good Fortune")*

- **Valence:** Good place. The most directly joyful of the succedent houses.
- **Joy:** Venus.
- **Kind:** Benefic joy. Venus joys here — the goddess of pleasure in the house of pleasure. A well-conditioned Venus is a pure boon; a combust or afflicted Venus is the classical "gift spoiled."
- **Theme:** Children, pleasure, play, creation, games of chance. Venus's joy here makes this the house of generative delight.

### 5.6 Sixth — Labor
*Kakē Tychē ("Bad Fortune")*

- **Valence:** Bad place. Averse to the ASC. The house of extracted effort.
- **Joy:** Mars.
- **Kind:** Contained malefic. Mars joys in a bad place — classical containment. A well-conditioned Mars gives the malefic honest employment: the harshness is still present but scoped, legible, *his job*. An afflicted or combust Mars is when the 6th is at its worst, because the house's native malefic energy has no custodian to carry it.
- **Theme:** Illness, servitude, toil, accidents, the body as a site of grinding work. Mars's joy here is a classical "containment" — the malefic given a role that fits its nature.

### 5.7 Seventh — Relationships
*Dysis (the Descendant)*

- **Valence:** Good place. The threshold of the other; the mirror of the self.
- **Joy:** None.
- **Kind:** Pure angular. Identity from the DSC — the setting point, the self-to-other threshold.
- **Theme:** Partnership, open enemies, contracts, the other. Traditionally ambivalent — any named relationship lives here, whether friendly or hostile.

### 5.8 Eighth — Transformation
*Argon ("Idle") — the house of death*

- **Valence:** Bad place. Averse to the ASC. The house of transfer and inheritance.
- **Joy:** None.
- **Kind:** Pure bad place.
  Like the 2nd, it has no joy and sits off the diurnal angles.
  Its house sign and occupants supply variation and special approaches within the concerns of death and inheritance.
- **Theme:** Death, shared resources, others' money, crisis, transformation. The traditional darkness of this house is the zero-sum nature of inheritance: one gains only because another loses.

### 5.9 Ninth — Pilgrimage
*Theos ("God")*

- **Valence:** Good place. The house of wisdom, meaning, and the far.
- **Joy:** Sun.
- **Kind:** Benefic joy. The Sun joys here — the illuminator in the house of illumination-at-a-distance. A well-conditioned Sun opens the house's favored voice; an afflicted Sun leaves the tint but the pilgrimage runs without its light.
- **Theme:** Long journeys, foreign lands, religion, philosophy, wisdom. The Sun's joy here is the illumination of distance — what is learned by going far.

### 5.10 Tenth — Achievement
*Mesouranēma ("Midheaven") — the MC*

- **Valence:** Good place. The public summit; action visible to the world.
- **Joy:** None.
- **Kind:** Pure angular. Identity from the MC — the highest point of the sky, the noon-point, maximum visibility.
- **Theme:** Reputation, career, public life, action in the world. The visible counterpart to the 4th's hidden interior.

### 5.11 Eleventh — Friendship
*Agathos Daimōn ("Good Spirit")*

- **Valence:** Good place. The most benefic of the succedent houses; the house of grace.
- **Joy:** Jupiter.
- **Kind:** Benefic joy. Jupiter (greater benefic) joys here — the most gift-laden of the joy affinities. A well-conditioned Jupiter is the closest thing to a pure "unearned help" bonus; an afflicted or combust Jupiter leaves the house a house-of-gifts with no giver.
- **Theme:** Friends, allies, hopes, benefactions, unearned blessings. Jupiter's joy here gives the house a quality of gift — help that arrives from outside.

### 5.12 Twelfth — The Hidden
*Kakos Daimōn ("Bad Spirit")*

- **Valence:** Bad place. Averse to the ASC. The hardest house; what is withheld, concealed, or lost.
- **Joy:** Saturn.
- **Kind:** Contained malefic. Saturn joys in a bad place — sorrow and concealment are Saturn's domain, so housing him here gives him honest employment. A well-conditioned Saturn *contains*: costs are still real but become scoped and legible. An afflicted or combust Saturn is when the 12th is worst, because its characteristic weight has no custodian.
- **Theme:** Hidden enemies, sorrows, confinement, exile, the unseen. Saturn's joy here gives the house a quality of slow, heavy concealment — costs unseen until they arrive.
