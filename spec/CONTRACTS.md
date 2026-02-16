# Space Prince — Contract Design Spec

*Astrological data model for chart-based identity, derived from traditional Western astrology.*

This document specifies the onchain data structures and functions that encode a natal chart and make its relationships computable.
Everything here is grounded in the astrological tradition documented in ASTROLOGY.md.
Game mechanics built on top of this foundation belong in a separate document.

---

## Overview

A Prince is defined by a natal chart — 7 planet positions computed from a birth moment (latitude, longitude, timestamp).
The chart provides:

1. **Identity** — 7 planets, each placed in a sign, house, and dignity state
2. **Internal structure** — aspects between the Prince's own planets describe how parts of the chart relate to each other
3. **Relational structure** — when two charts meet, cross-aspects describe how their planets interact
4. **Domains** — 12 houses, each ruled by a planet, organize areas of life

The astrological structure is rich enough to generate distinct play patterns without any additional game-design layer.
Each chart is unique, and the relationships between charts are deterministic.

---

## Data Structures

### Prince (immutable after mint)

```
struct Prince {
    id: u256,
    latitude: i32,       // fixed-point, e.g. * 10000
    longitude: i32,
    timestamp: u64,
    ascendant: u16,      // degree 0-359
    planets: [PlanetNatal; 7],
    aspect_table: [AspectType; 21],  // 7 choose 2 = 21 pairs
}
```

### PlanetNatal (immutable, derived at mint)

```
struct PlanetNatal {
    planet: PlanetId,    // Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn
    degree: u16,         // 0-359
    sign: Sign,          // Aries through Pisces
    element: Element,    // derived from sign
    modality: Modality,  // derived from sign
    dignity: Dignity,    // derived from planet + sign
    house: u8,           // 1-12
}
```

### Sign

```
enum Sign {
    Aries,       // Cardinal, Fire
    Taurus,      // Fixed, Earth
    Gemini,      // Mutable, Air
    Cancer,      // Cardinal, Water
    Leo,         // Fixed, Fire
    Virgo,       // Mutable, Earth
    Libra,       // Cardinal, Air
    Scorpio,     // Fixed, Water
    Sagittarius, // Mutable, Fire
    Capricorn,   // Cardinal, Earth
    Aquarius,    // Fixed, Air
    Pisces,      // Mutable, Water
}
```

Each sign carries two intrinsic properties:

- **Element** (Fire, Earth, Air, Water) — the temperamental quality of the sign
- **Modality** (Cardinal, Fixed, Mutable) — the sign's relationship to seasonal change

A third property — **Dignity** — is derived from the combination of planet and sign.
See the Dignity section below.

### Element

```
enum Element {
    Fire,   // Aries, Leo, Sagittarius
    Earth,  // Taurus, Virgo, Capricorn
    Air,    // Gemini, Libra, Aquarius
    Water,  // Cancer, Scorpio, Pisces
}
```

### Modality

```
enum Modality {
    Cardinal,  // Aries, Cancer, Libra, Capricorn — initiation
    Fixed,     // Taurus, Leo, Scorpio, Aquarius — sustaining
    Mutable,   // Gemini, Virgo, Sagittarius, Pisces — adaptation
}
```

### Dignity

```
enum Dignity {
    Domicile,     // planet rules this sign
    Exaltation,   // planet is exalted in this sign
    Neutral,      // no special relationship
    Detriment,    // planet is in the sign opposite its rulership
    Fall,         // planet is in the sign opposite its exaltation
}
```

Dignity describes how naturally a planet functions in its zodiacal position — not how powerful it is, but how comfortably it expresses itself.
Most planets in a chart will be Neutral.
Dignified and debilitated planets create distinctive patterns without making any chart objectively better or worse.

Traditional meanings:

- **Domicile** — the planet is at home, expressing its nature fully and without distortion
- **Exaltation** — the planet is honored, performing at a heightened level
- **Neutral** — standard expression, no special coloring
- **Detriment** — the planet is in unfamiliar territory, its expression is strained or awkward
- **Fall** — the planet is humbled, its natural authority undermined

Dignity is computed at mint from the planet-sign combination using the traditional assignment table:

| Planet | Domicile | Exaltation | Detriment | Fall |
|--------|----------|------------|-----------|------|
| Sun | Leo | Aries | Aquarius | Libra |
| Moon | Cancer | Taurus | Capricorn | Scorpio |
| Mercury | Gemini, Virgo | Virgo | Sagittarius, Pisces | Pisces |
| Venus | Taurus, Libra | Pisces | Aries, Scorpio | Virgo |
| Mars | Aries, Scorpio | Capricorn | Taurus, Libra | Cancer |
| Jupiter | Sagittarius, Pisces | Cancer | Gemini, Virgo | Capricorn |
| Saturn | Capricorn, Aquarius | Libra | Cancer, Leo | Aries |

```
fn compute_dignity(planet: PlanetId, sign: Sign) -> Dignity
```

Lookup table based on the traditional assignments above.
A planet-sign pair matches at most one dignity state; if none match, the result is Neutral.

### SignRelationship

```
enum SignRelationship {
    Conjunction,  // same sign (0°) — intense, high stakes, fused
    Sextile,      // 60° apart — supportive, mild advantage
    Square,       // 90° apart — harsh friction, tension
    Trine,        // 120° apart, same element — harmonious, low friction
    Inconjunct,   // 150° apart — awkward, unpredictable
    Opposition,   // 180° apart — polar tension, volatile swings
    SemiSextile,  // 30° apart — adjacent, slight friction
}
```

The relationship between any two signs is **deterministic** — derived from their angular distance in the zodiac.
This is not the same as the aspect between two planets (which depends on their exact degrees and orbs).
Sign relationships are fixed, permanent properties of the zodiac itself.

```
fn sign_relationship(a: Sign, b: Sign) -> SignRelationship {
    let distance = abs(a - b) % 12;  // signs apart (0-6, wrapping)
    match distance {
        0 => Conjunction,
        1 => SemiSextile,
        2 => Sextile,
        3 => Square,
        4 => Trine,
        5 => Inconjunct,
        6 => Opposition,
    }
}
```

### HouseCategory

```
enum HouseCategory {
    Angular,    // houses 1, 4, 7, 10
    Succedent,  // houses 2, 5, 8, 11
    Cadent,     // houses 3, 6, 9, 12
}
```

Angular houses are the most prominent and active.
Succedent houses stabilize and resource what the angular houses initiate.
Cadent houses are transitional and preparatory.

### AspectType (relationship between two specific planets)

```
enum AspectType {
    None,          // no significant angular relationship
    Conjunction,   // ~0° — intensity, fusion
    Sextile,       // ~60° — mild support
    Square,        // ~90° — friction, tension
    Trine,         // ~120° — strong support, flow
    Opposition,    // ~180° — polarity, direct tension
}
```

The `aspect_table` stores the aspect between every pair of the 7 planets (21 entries).
Computed once at mint time from exact angular distances with orb tolerances.

Note: sign relationships and planet aspects are **related but distinct**.
Two planets can be in trine signs (e.g. Aries and Leo) without being in an exact trine aspect (their degrees might not be close enough).

**Open question:** Exact orb values.
Traditional orbs range from 6-10° depending on the aspect.
This is a tuning lever.

---

## Sign Relationships

The 12×12 sign relationship matrix is the core structural feature of the zodiac for gameplay purposes.

| Relationship | Signs apart | Character |
|-------------|-------------|-----------|
| Conjunction | 0 (same) | Intense, fused, overwhelming |
| Semi-sextile | 1 | Adjacent discomfort, slight friction |
| Sextile | 2 | Supportive, opportunity |
| Square | 3 | Harsh friction, conflict |
| Trine | 4 (same element) | Harmonious, flowing |
| Inconjunct | 5 | Awkward, no natural rapport |
| Opposition | 6 | Polar tension, volatile |

These characterizations come from the astrological tradition.
The key structural insight: **not all relationships are equal**.
Trines and sextiles are traditionally favorable; squares and oppositions are traditionally challenging; conjunctions are intense and context-dependent; inconjuncts and semi-sextiles are awkward and minor.

---

## Aspects

Aspects are angular relationships between two specific planets, computed from their exact degree positions.
Where sign relationships are properties of the zodiac itself, aspects are properties of a particular chart.

**Polarity:**

- **Trine / Sextile** — favorable, supportive
- **Square / Opposition** — challenging, tense
- **Conjunction** — intensifying, context-dependent (depends on the planets involved)

A chart's aspect table encodes its internal structure — which planets support each other, which are in tension, and which are fused.
Charts with many squares and oppositions have more internal tension.
Charts with many trines and sextiles have more internal harmony.
Both create interesting patterns.

---

## Houses

### Traditional Meanings

Each house governs a domain of life.
In Whole Sign houses (used here), each house corresponds to exactly one sign, starting from the Ascendant's sign.

| House | Domain | Category |
|-------|--------|----------|
| 1st | Self, body, identity | Angular |
| 2nd | Resources, possessions | Succedent |
| 3rd | Communication, siblings, short journeys | Cadent |
| 4th | Home, family, foundations | Angular |
| 5th | Creativity, pleasure, children | Succedent |
| 6th | Service, health, labor | Cadent |
| 7th | Partnerships, open enemies | Angular |
| 8th | Death, shared resources, transformation | Succedent |
| 9th | Philosophy, travel, higher learning | Cadent |
| 10th | Career, public standing, authority | Angular |
| 11th | Friends, aspirations, alliances | Succedent |
| 12th | Isolation, hidden enemies, the unseen | Cadent |

### Categories

```
fn house_to_category(house: u8) -> HouseCategory {
    match house {
        1 | 4 | 7 | 10 => Angular,
        2 | 5 | 8 | 11 => Succedent,
        3 | 6 | 9 | 12 => Cadent,
    }
}
```

### Rulerships

Each house is ruled by the planet that rules its sign.
The traditional sign-planet rulerships:

- Aries / Scorpio → Mars
- Taurus / Libra → Venus
- Gemini / Virgo → Mercury
- Cancer → Moon
- Leo → Sun
- Sagittarius / Pisces → Jupiter
- Capricorn / Aquarius → Saturn

```
fn compute_house_rulers(ascendant_sign: Sign) -> [PlanetId; 12]
```

The **chart ruler** is the planet that rules the Ascendant sign.
This planet has special significance — it represents the chart as a whole.

---

## Chart Interaction (Synastry)

When two charts meet, the interaction is described by **cross-aspects** — aspects formed between planets in one chart and planets in the other.

```
struct CrossAspect {
    player_planet: PlanetId,
    opponent_planet: PlanetId,
    aspect: AspectType,               // planet-level aspect (exact degree)
    sign_relationship: SignRelationship, // sign-level relationship (zodiac position)
}
```

Cross-aspects are computed by checking all 49 planet pairs (7 × 7) across the two charts.
Only pairs that form a recognized aspect (within orb) become cross-aspects.
Each cross-aspect also carries the sign relationship between the two planets' signs.

```
fn compute_cross_aspects(
    player: [PlanetNatal; 7],
    opponent: [PlanetNatal; 7],
) -> Vec<CrossAspect>
```

The number and nature of cross-aspects between two charts determines the character of their interaction.
Some chart pairings produce many cross-aspects (dense, intense interaction); others produce few (sparse, limited contact).
The mix of favorable and challenging aspects shapes whether the interaction is harmonious, tense, or volatile.

---

## Mint

```
fn mint(latitude: i32, longitude: i32, timestamp: u64) -> Prince
```

- Validates uniqueness of (latitude, longitude, timestamp)
- Computes ascendant from inputs using astronomical formulae
- Computes 7 planet positions (degree, sign, element, modality, house)
- Computes dignity for each planet from planet + sign (via `compute_dignity`)
- Computes aspect table (21 pairs, angular distance → aspect type with orb check)
- Derives house rulerships from ascendant
- Stores immutable Prince

**Open question:** Astronomical computation onchain.
Options: (a) precompute offchain and submit with proof, (b) simplified analytical model, (c) lookup tables with interpolation.

---

## Computed Constants

### Aspect Table (per Prince, at mint)

```
fn compute_aspect_table(planets: [PlanetNatal; 7]) -> [AspectType; 21]
```

### Cross-Aspect Table (per encounter, at encounter start)

```
fn compute_cross_aspects(
    player: [PlanetNatal; 7],
    opponent: [PlanetNatal; 7],
) -> Vec<CrossAspect>
```

Check all 49 pairs (7 × 7).
Filter to pairs with recognized aspects.
Annotate each with sign relationship.

### Sign Relationship (pure zodiac lookup)

```
fn sign_relationship(a: Sign, b: Sign) -> SignRelationship {
    let distance = abs(a as u8 - b as u8) % 12;
    let distance = min(distance, 12 - distance);  // shortest arc
    match distance {
        0 => Conjunction,
        1 => SemiSextile,
        2 => Sextile,
        3 => Square,
        4 => Trine,
        5 => Inconjunct,
        6 => Opposition,
    }
}
```

### House Category

```
fn house_to_category(house: u8) -> HouseCategory {
    match house {
        1 | 4 | 7 | 10 => Angular,
        2 | 5 | 8 | 11 => Succedent,
        3 | 6 | 9 | 12 => Cadent,
    }
}
```

### House Rulership (derived from ascendant)

```
fn compute_house_rulers(ascendant_sign: Sign) -> [PlanetId; 12]
```

---

## Design Affordances

What the astrological structure provides for game design, without prescribing how to use it:

- **Sign relationships** — a 12×12 matrix with built-in asymmetry (some pairings are harmonious, some harsh, some volatile). Natural terrain for any contest or encounter system.
- **Aspect polarity** — internal chart structure where some planet pairs support each other and others are in tension. Natural basis for cascading effects, resource flow, or internal tradeoffs.
- **Dignity** — 5-tier quality rating per planet. Natural basis for planet-specific strengths, weaknesses, or special behaviors.
- **Modality** — 3-way classification (initiate / sustain / adapt). Natural basis for behavioral archetypes or action categories.
- **Element** — 4-way classification (fire / earth / air / water). Natural basis for terrain types, matchup modifiers, or thematic grouping.
- **Houses** — 12 domains with 3 categories (angular / succedent / cadent) and individual thematic meanings. Natural basis for encounter types, progression structure, or narrative framing.
- **House rulership** — connects planets to houses, creating a web of authority. A planet "cares about" the houses it rules. Natural basis for planet-house interactions and the chart ruler as a special identity.
- **Cross-aspects** — when two charts meet, the number and nature of their cross-aspects is deterministic and variable. Natural basis for encounter length, difficulty, and character.
- **Aspect density** — charts vary in how many internal aspects they have. Dense charts are more interconnected; sparse charts are more modular. Natural basis for chart-level playstyle differences.

---

## Open Questions

1. **Astronomical computation onchain** — how to derive planet positions from lat/long/timestamp
2. **Orb tolerances** — affects density of aspect webs and cross-aspect counts
