# Space Prince — Houses (Narrative Encounters)

This document defines the **narrative encounter** system, organized around the twelve astrological houses.
Narrative encounters are an alternative node type to combat, offering short decision trees and push-your-luck choices rather than turn-by-turn planetary resolution.

Combat mechanics are specified in `spec/mechanics/MECHANICS.md`.
Chart construction (whole-sign houses, ASC, rulerships) is specified in `spec/mechanics/CHART.md`.
Map topology is specified in `spec/mechanics/MAP.md`.

---

## 1. Purpose and Scope

### Goals

- Provide a second encounter type that exercises **house placement** and **ruler-state** rather than chart-vs-chart combat.
- Give each of the twelve houses a distinct mechanical identity.
- Let a Prince's chart make certain houses "easier" or "harder" — narrative nodes should feel chart-specific, not generic.
- Keep individual encounters short (depth 2–3, 2–3 options per node) and low-prep relative to combat.
- Influences include Slay the Spire and Faster Than Light, which use push-your-luck decision-trees as alternative encounter types

### In Scope (v1)

- Chart-conditioning model: how a chart makes a house friendly or hostile.
- Twelve house archetypes: theme, native valence, joy.
- Outcome vocabulary: what resources narrative encounters can move.
- Encounter shape: decision tree depth, push-your-luck structure, exits.

### Out of Scope (v1)

- Authored prose / flavor text for each encounter.
- Exact risk/reward curves (fine-tune later).
- Map placement logic — whether a node's house is fixed at map-gen or rolled on entry (see Open Questions).
- Art direction for narrative screens.

---

## 2. Outcome Vocabulary

Narrative encounters operate on the same resources as combat.
Open question: should new resources be introduced to make these mechanics richer?

| Resource | Scope | Notes |
|---|---|---|
| **Affliction** | Per-planet, real-valued | Same units as combat. Can be added or healed. |
| **Combustion** | Per-planet, binary | Can be applied *or removed*. Uncombust is allowed (see §4). |
| **Distance** | Run-wide, integer-ish | The run's score metric. Can be earned or spent. |
| **Omen** (new) | Run-scoped, temporary | Buff/debuff active until end of run or trigger condition. |
| **Lore** (new) | Persistent on Prince | Unlocks copy, hidden chart annotations, future content. |

Encounters cost and reward in these terms.
A decision tree might offer: "lose 3 distance, heal 2 affliction on Mars" or "combust Venus, unlock a lore entry, gain a +1 luck omen for the rest of the run."

---

## 3. Chart-Conditioning Model

Each house has three intrinsic structural features, drawn from the Hellenistic tradition, that give it character: its position on the **diurnal cycle**, its **aspect to the ASC**, and its **native joy**. These are the core mechanistic elements we're working with. A chart doesn't change any of them — they're the same in every birth.

Chart-conditioning is the act of measuring how a specific Prince's placements engage with each of these features, then composing the result into an encounter.

### 3.1 Diurnal cycle

Each house sits at a fixed position in the day/night rotation of the sky: rising at the ASC (1st), culminating at the MC (10th), setting at the DSC (7th), hiding at the IC (4th), with the other eight distributed between these four pivots.

A house that sits on one of these four pivots is called **angular**. In this doc, "angular" means only that — sitting on a pivot — not the classical three-tier angular/succedent/cadent taxonomy.

- Encounters should feel rooted in this geometry: the 1st is emergence, the 10th is the public summit, the 7th is the threshold of the other, the 4th is the secret interior.
- The cycle itself doesn't vary per chart, but proximity of a tenant to an angle weights its narrative voice.

### 3.2 Aspect to the ASC

Every house either does or doesn't form a classical aspect (conjunction, sextile, square, trine, opposition) to the 1st:

- **Good places** (1, 3, 4, 5, 7, 9, 10, 11): aspect the ASC. Native valence favorable.
- **Bad places** (2, 6, 8, 12): averse — no aspect. Native valence hostile.

This sets the baseline emotional tone: good places tend to reward, bad places tend to extract. Chart variable: whether the house's *ruler* itself aspects the ASC in the native's chart can gate conditional branches.

### 3.3 Joys

Each of the seven planets rejoices in one house: Mercury-1, Moon-3, Venus-5, Mars-6, Sun-9, Jupiter-11, Saturn-12. This assignment is fixed by tradition — a permanent affinity between planet and house, independent of any chart.

The joy shapes the house's character in every chart, regardless of where the joy-planet is physically placed. The 5th feels Venusian (pleasure, creativity, play) because Venus joys there. The 6th feels Martial (toil, strife, wearing work) because Mars joys there. The 12th feels Saturnine (sorrow, concealment, slow weight) because Saturn joys there. This tint is baked into each house's theme in §5.

**Chart-conditioning via joy.** The chart-variable lever is the joy-planet's *condition*, not its placement. A joy-house reads the state (affliction, combustion) of its joy-planet wherever that planet sits. If Venus is afflicted, the 5th's encounters darken; if Saturn is combust, the 12th's weight becomes unreadable and its containment fails. Because every chart has all seven planets in some state, this mechanic applies universally — there are no charts that "miss" a joy-house.

This preserves the **asymmetric joy rule** from §5.0: a well-conditioned benefic joy-planet intensifies the pleasantness of its joy-house; a well-conditioned malefic joy-planet *contains* the malefice of its joy-house. When the joy-planet is afflicted, benefic joy-houses lose their boon and malefic joy-houses lose their containment.

The five houses with no joy (2, 4, 7, 8, 10) acquire character from other sources — primarily the diurnal geometry (4th and 10th as IC/MC, 7th as DSC) and the aspect-to-ASC rule (2nd and 8th as bad places). Joy is one of several ways houses acquire meaning, not the only one.

*Historical note.* Classical practice treats "in joy" both as this permanent affinity and as a minor placement dignity (the planet is stronger when actually in its joy-house). We've deliberately collapsed the two into the affinity sense alone: it applies to every chart equally, it's historically the primary sense, and it keeps the mechanic a single clean lever. The placement-dignity sense can be reintroduced later if encounter density needs another axis.

### 3.4 Design principle

Chart-conditioning should **shift the decision space**, not merely scale numbers.
A hostile chart should remove or disguise the best option; a friendly chart should reveal it.
Pure cost scaling is one mechanism; changing options is another.

---

## 4. Encounter Shape

### 4.1 Structure

- **Depth:** 2–3 decision nodes per encounter.
- **Breadth:** 2–3 options per node.
- **Termination:** each path ends in a resolution node that applies outcomes from §2.

### 4.2 Push-your-luck ladder

One path in most encounters is a **ladder**: escalating stakes, each rung offering the choice to cash out or continue.

- Rung 1: small risk, small reward.
- Rung 2: medium risk, medium reward, rollback of rung 1 on failure.
- Rung 3: large risk, large reward, full rollback on failure.

The ladder's arithmetic (probabilities, payoffs) will be tuned per-house once mechanical treatments are committed.

### 4.3 Offered vs always-present

Some options are always visible; others appear only when a chart condition is met (e.g. uncombust only appears if a planet is currently combusted; a ruler-aspected branch only appears when the aspect exists).
This is the primary vehicle for chart-conditioning.

> Example: in FTL, having a certain species as a shipmate unlocks certain narrative paths.

---

## 5. The Twelve Houses

Each house is documented below with its **valence** (good place or bad place, per §3.2), its **joy** (the planet that rejoices here, per §3.3), its **kind** (category; see below), and a short note on **theme** (traditional meaning plus modern gloss).
Mechanical treatment is deferred — the goal at this stage is a reference that builds intuition for what each house *is*, not how it plays.

### 5.0 Categories

The twelve houses fall into five categories based on which of the three anchoring features — joy, angular position, averse-to-ASC — apply to them. The category captures how each house acquires its character. Every house has at least one anchor; three have two.

- **Double-anchored (1):** joy + angular. The only house with both. Overdetermined by design — it *is* the chart's origin.
- **Pure angular (4, 7, 10):** no joy, but sit on the diurnal angles (IC, DSC, MC). Identity comes from sky-geometry alone — private interior, the other, public summit.
- **Benefic joys (3, 5, 9, 11):** a benefic (Moon, Venus, Sun, Jupiter) joys here in a good place. The pleasant houses. When the joy-planet is well-conditioned, the house reads at its most favored; when afflicted or combust, the house still carries the benefic tint but the favored voice goes flat.
- **Contained malefics (6, 12):** a malefic (Mars, Saturn) joys in a bad place. Classical containment — the malefic is given a role that fits its nature. When the joy-planet is well-conditioned, its harshness stays scoped and legible (the malefic has honest employment); when afflicted or combust, containment fails and the house reads at its worst.
- **Pure bad places (2, 8):** averse to the ASC, no joy, not angular. Unmitigated — the two "gates" (Gate of Hades for the 2nd, the death-house for the 8th). These houses are the same in every chart. That genericness is deliberate: the two darkest houses don't get softened by anyone's chart, which is part of what makes them feel final.

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
- **Kind:** Pure bad place. Nothing softens the averse valence — no joy-planet can be placed here to ease it, and it sits off the diurnal angles. The 2nd feels the same in every chart; it and the 8th are the two houses intentionally left generic.
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
- **Kind:** Pure bad place. Like the 2nd, no joy-softener is available and it sits off the diurnal angles. The 8th feels the same in every chart — intentionally so, and classically the darkest.
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
