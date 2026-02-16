# Space Prince — Mechanics

*How the astrological data model becomes a game.*

This document describes the mechanisms available for game design, grounded in the structures defined in CONTRACTS.md.
Each mechanism is described in terms of what it is, what astrological structure it draws on, and what role it serves in gameplay.
No specific game loop is prescribed here — this is the toolkit from which a game loop will be assembled.

---

## 1. Chart as Identity

**What it is.**
A Prince is defined by 7 planet positions, computed deterministically from a birth moment (latitude, longitude, timestamp).
The chart is immutable after mint.
No two Princes share the same birth moment.

**Astrological basis.**
The natal chart — a snapshot of the sky at a specific time and place — is the foundation of all astrological practice.
Every interpretive technique begins with the chart.

**Role in gameplay.**
The chart is the character sheet.
It determines the Prince's strengths, weaknesses, internal tensions, and relational patterns.
Because charts are immutable and unique, no two Princes play the same way, and no Prince can be respecced.
The player's job is to understand and work with what they have, not to optimize toward an ideal.

---

## 2. Planets as Agents

**What it is.**
Each Prince has 7 planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
Each planet has a sign, element, modality, dignity, and house placement.
Planets are the units of action — whatever the player does in the game, they do it through a planet.

**Astrological basis.**
In traditional astrology, planets are the actors.
Signs describe how they act; houses describe where they act; aspects describe how they relate to each other.
The planets are not interchangeable — each governs a different domain of life and expression.

**Role in gameplay.**
Planets are the player's resources and tools.
Different planets are better or worse suited to different situations based on their sign, dignity, and aspects.
The player must choose which planet to deploy and when, creating a resource-management layer where the "resources" are aspects of identity rather than consumables.

---

## 3. Sign Relationships (The 12×12 Matrix)

**What it is.**
Any two zodiac signs have a fixed relationship determined by their angular distance: conjunction (same sign), semi-sextile (1 apart), sextile (2), square (3), trine (4), inconjunct (5), or opposition (6).
This produces a 12×12 matrix where every sign pairing has a known character.

**Astrological basis.**
Sign relationships derive from the geometry of the zodiac circle.
Trines connect signs of the same element; squares connect signs of the same modality; oppositions connect complementary polarities.
These relationships are among the oldest and most structurally stable features of the tradition.

**Role in gameplay.**
This is the **terrain system**.
When two planets meet (one from each chart), their signs determine the character of the interaction — harmonious, tense, volatile, or awkward.
The player cannot change the terrain, only choose which planet to send into it.
Learning the matrix — knowing that Scorpio vs. Leo is a square (harsh) while Scorpio vs. Pisces is a trine (smooth) — is a core skill that develops through play.

**Properties worth noting:**
- 7 distinct relationship types, not just "good" and "bad"
- Conjunctions and oppositions are high-intensity but have different characters
- Inconjuncts and semi-sextiles are minor and awkward — not every matchup is dramatic
- The matrix is symmetric: if A→B is a square, B→A is also a square

---

## 4. Aspects (Internal Structure)

**What it is.**
Each Prince's 7 planets form up to 21 pairwise aspects (7 choose 2), computed from exact degree positions with orb tolerances.
An aspect exists when two planets are within a threshold of a recognized angle (0°, 60°, 90°, 120°, 180°).
Some pairs have no aspect (too far from any recognized angle).

**Astrological basis.**
Aspects describe the relationships between planets within a single chart.
A trine between Mars and Jupiter means those two planets cooperate; a square between Moon and Saturn means they're in tension.
This is the primary tool for reading a chart's internal dynamics.

**Role in gameplay.**
Aspects create **internal connectivity**.
When something happens to one planet, the aspect web determines whether and how other planets are affected.
A chart with many aspects is highly interconnected — activating one planet ripples through many others.
A chart with few aspects is modular — planets act more independently.

**The polarity dimension:**
- Trines and sextiles are favorable channels — natural pathways for support, relief, or positive propagation
- Squares and oppositions are tense channels — natural pathways for stress, cost, or negative propagation
- Conjunctions intensify whatever passes through them

This polarity is the foundation for any mechanic where one planet's action affects another.

---

## 5. Cross-Aspects (Chart Interaction)

**What it is.**
When two charts meet, cross-aspects are computed by checking all 49 planet pairs (7×7) across the two charts.
Each cross-aspect identifies which planets are connected and carries both the exact aspect type and the sign relationship.

**Astrological basis.**
Synastry — comparing two charts to understand a relationship — is a major branch of astrological practice.
The cross-aspects between two people's charts describe where their lives intersect: points of attraction, friction, and intensity.

**Role in gameplay.**
Cross-aspects define **encounter structure**.
The set of cross-aspects between the player's chart and an opponent's chart determines:
- **How many interaction points exist** — some pairings produce 3 cross-aspects (brief encounter), others produce 12+ (long encounter)
- **Which planets are involved** — not all of the player's planets will be engaged in every encounter
- **The character of each interaction point** — each cross-aspect has its own sign relationship (terrain) and aspect type (polarity)

This means encounters are not generic — they are shaped by the specific relationship between two charts.
The same Prince will have a completely different experience against different opponents.

---

## 6. Dignity (Planet Quality)

**What it is.**
Each planet receives a dignity rating based on its sign placement: Domicile, Exaltation, Neutral, Detriment, or Fall.
Most planets in a chart are Neutral.
The assignment follows the traditional table and is computed at mint.

**Astrological basis.**
The dignity system is two independent axes layered together, from different eras.

*Domicile and detriment* come from the Hellenistic planetary rulership scheme.
Each planet rules 1-2 signs, assigned by a symmetric geometric pattern radiating outward from the Sun-Moon axis (Leo-Cancer) in order of geocentric distance.
Detriment is the opposite sign from domicile — maximally foreign territory.
The metaphor is jurisdictional: a planet in domicile is an official in their own territory; a planet in detriment is that official in someone else's jurisdiction.

*Exaltation and fall* are older — likely Babylonian in origin, predating the clean Hellenistic scheme.
Each planet has exactly one sign of exaltation, assigned by tradition rather than geometric logic.
Fall is the opposite sign from exaltation.
The metaphor is different: exaltation is being honored as a guest (performing exceptionally, but in someone else's territory), while fall is being humbled — stripped of recognition.

Crucially, dignity is not about power but about ease of expression.

**Role in gameplay.**
Dignity creates **per-planet asymmetry**.
Two Princes might both have Mars, but Mars in Aries (domicile) and Mars in Cancer (fall) will behave differently.

The 5-tier scale (two positive, one neutral, two negative) creates meaningful variation without overwhelming complexity.

**Balance.**
Non-neutral dignity is rare for any individual planet.
Each planet has 2-3 signs (out of 12) that confer dignity or debility, and 9-10 that are Neutral.
Any given planet has roughly a 75% chance of being Neutral.

Across 7 planets, the expected chart has ~5 Neutral, ~1 dignified, and ~1 debilitated.
Having 3 dignified planets would be unusual; having 5 would be astronomically near-impossible.

The reason extreme concentrations can't occur is that **inner planets are tethered to the Sun**.
Mercury is always within ~1 sign of the Sun; Venus within ~2 signs.
This clustering limits which dignity combinations can co-occur.
For example, Sun in Leo (domicile) means Venus must be within ~2 signs of Leo — far from Pisces (exaltation).
So Sun domicile + Venus exaltation simply cannot happen.
The solar system's orbital mechanics act as a natural balancing constraint.

**Design principle: texture, not hierarchy.**
Dignity should modify *character* rather than *power*.
If domicile simply means +20% effectiveness, more domicile = better chart, and the game is unbalanced.
The interesting design space is making each dignity state qualitatively different:

- **Domicile** — consistent and reliable, but predictable. Always does what you expect. An opponent who knows your Mars is in Aries knows exactly what Mars will do.
- **Exaltation** — performs exceptionally, but in a register that doesn't quite belong to the planet. Strong but slightly misaligned with the chart's overall identity.
- **Neutral** — standard behavior, no special coloring.
- **Detriment** — awkward in the standard role, but has adapted. Compensating strategies from a lifetime of discomfort. Unreliable conventionally, surprisingly useful in unconventional situations.
- **Fall** — exposed and vulnerable, but permeable. Receives influence (good and bad) more intensely. High risk, high sensitivity.

Under this design, a chart with several debilitated planets isn't weaker — it's *weirder*.
More volatile, less predictable, with unexpected strengths where conventional planets flounder.
A chart with several dignified planets is stable and legible — but potentially rigid.

---

## 7. Modality (Three Behavioral Modes)

**What it is.**
Every sign belongs to one of three modalities: Cardinal (initiation), Fixed (sustaining), Mutable (adaptation).
Since each planet inherits its sign's modality, a chart's 7 planets are distributed across the three modes.

**Astrological basis.**
Modality reflects a sign's position within its season — beginning (Cardinal), middle (Fixed), or end (Mutable).
Cardinal signs start things; Fixed signs maintain things; Mutable signs transition between things.
This is a Greek innovation layered onto the Babylonian zodiac.

**Role in gameplay.**
Modality provides a **three-way classification of action style**.
This is a natural fit for:
- Three action types or stances mapped to the three modalities
- Planets that default to behavior matching their modality
- Strategic variation where different situations favor different modes

The distribution of modalities across a Prince's 7 planets shapes the chart's overall temperament.
A chart heavy in Cardinal planets favors initiative; heavy in Fixed favors endurance; heavy in Mutable favors flexibility.

---

## 8. Element (Four Temperaments)

**What it is.**
Every sign belongs to one of four elements: Fire, Earth, Air, Water.
Each element appears in exactly 3 of the 12 signs (one per modality).
A chart's 7 planets are distributed across the four elements.

**Astrological basis.**
The four elements were retrofitted onto the zodiac during the Hellenistic period to align with Aristotelian physics.
They describe temperamental qualities: Fire is active and expressive, Earth is practical and material, Air is intellectual and social, Water is emotional and intuitive.
Elements also underpin the trine structure — signs of the same element are always trine to each other.

**Role in gameplay.**
Element provides a **four-way classification** that crosscuts modality.
Two Cardinal signs (Aries and Cancer) differ by element (Fire vs Water), giving them distinct characters despite sharing a mode.

Element is useful for:
- Grouping or theming (encounters, environments, narrative register)
- Matchup modifiers (elemental affinity or dissonance)
- A coarser layer of identity than sign (4 types vs 12)

The elemental distribution across a chart reveals its temperamental balance.
A chart with 4 Fire planets and no Water is all initiative and no reflection.

---

## 9. Houses (Twelve Domains)

**What it is.**
The 12 houses divide the chart into domains of life, starting from the Ascendant sign.
In Whole Sign houses, each house is exactly one sign.
Houses are grouped into three categories: Angular (1, 4, 7, 10), Succedent (2, 5, 8, 11), Cadent (3, 6, 9, 12).

**Astrological basis.**
Houses are a Hellenistic innovation that localized astrology to a specific birth.
Where signs describe qualities and planets describe agents, houses describe arenas — where in life a planet operates.
Angular houses are the most prominent (self, home, partnership, career); cadent houses are the most hidden (communication, service, philosophy, isolation).

**Role in gameplay.**
Houses provide **12 thematically distinct domains** for structuring encounters, progression, or narrative.
The three categories create a natural difficulty or prominence gradient:
- Angular houses are high-stakes, central
- Succedent houses are supportive, resourceful
- Cadent houses are preparatory, transitional, or hidden

Each house's theme (1st = self, 7th = partnerships, 12th = hidden enemies) gives encounters built-in narrative meaning without needing authored story.

---

## 10. House Rulership (The Authority Web)

**What it is.**
Each house is ruled by the planet that rules its sign.
Since the house-sign mapping depends on the Ascendant, different Princes have different rulership webs.
The chart ruler is the planet that rules the 1st house (the Ascendant sign).

**Astrological basis.**
Rulership is how astrology connects agents (planets) to domains (houses).
If Jupiter rules your 10th house (career), then Jupiter's condition — its sign, dignity, aspects — describes the character of your career.
The chart ruler is the planet most identified with the person as a whole.

**Role in gameplay.**
Rulership creates a **web of stakes** — each planet cares about specific houses.
When a house is in play, the planet that rules it has a personal connection to the outcome.
This means:
- A planet's effectiveness or behavior might change when its own house is at stake
- The chart ruler has broad significance — it connects to the Prince's core identity
- Two Princes experience the same house differently because different planets rule it for each of them

Rulership is the mechanism that makes houses personal rather than generic.

---

## Structural Summary

| Mechanism | Astrological source | Gameplay role |
|-----------|-------------------|---------------|
| Chart | Natal chart | Unique, immutable character identity |
| Planets | 7 classical planets | Units of action and agency |
| Sign relationships | Zodiac geometry | Encounter terrain (12×12 matrix) |
| Aspects | Planet-to-planet angles | Internal chart connectivity and propagation |
| Cross-aspects | Synastry | Encounter structure between two charts |
| Dignity | Planet-sign evaluation | Per-planet quality and asymmetry |
| Modality | Seasonal position | Three behavioral modes |
| Element | Temperamental quality | Four-way grouping and matchup layer |
| Houses | Life domains | Thematic structure for encounters and progression |
| Rulership | Planet-house authority | Web of stakes connecting agents to domains |

---

## What This Document Does Not Do

This document describes mechanisms, not a game loop.
The following questions remain open and will be answered as the design develops:

- **Action system** — what does the player actually *do* on a turn?
- **Resource model** — is there a resource? What depletes, what regenerates?
- **Win/loss conditions** — what ends an encounter, a run, the game?
- **Progression** — what changes across runs? What is permanent?
- **Encounter sequencing** — how are encounters ordered? What determines pacing?
- **Opponent generation** — how are opponent charts created or selected?
