# Space Prince — Mechanics

The source of truth for the game's mechanics. Where an older design doc conflicts, this wins.

**Number model.** Every magnitude an aspect can halve is even, so all values are whole numbers — no rounding anywhere. A single stat ranges in a roughly `1–20` D&D-style band (15 is heavy, 20 the top). Affliction accumulates toward a probabilistic combustion, offset by `durability × dignity`.

## 1. Entities

- Planets: `Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn`
- Signs: 12 zodiac signs.
- Each planet placement stores:
  - `sign`
  - `element`
  - `modality`
  - `dignity`
  - `base` stats
  - `buffs` stats

## 2. Roles and Base Stats

Each planet has a gameplay role — a stat profile that matches its astrological archetype (see `spec/concept/PLANETS.md`).
The role is the player's first read on the planet; the stats are the role's mechanical expression.
The short display label per planet (e.g., "the warrior") lives in `client/src/game/data.ts` as `PLANET_ROLE`.

- **Sun** — balanced presence in every stat; the centered self.
- **Moon** — top healing, fragile elsewhere; the reflective interior.
- **Mercury** — top luck, average elsewhere; paradox, the turn.
- **Venus** — strong healing and luck; beauty, relation, the sensed world.
- **Mars** — top damage, brittle elsewhere; the decisive cut.
- **Jupiter** — balanced and generous across all stats; expansion, gift.
- **Saturn** — top durability, slow elsewhere; limit, time, endurance.

Base stats per planet, even values on a roughly `1–20` D&D-style scale:

| Planet  | Damage | Healing | Durability | Luck | Total |
|---------|-------:|--------:|-----------:|-----:|------:|
| Sun     |     12 |       8 |         12 |    8 |    40 |
| Moon    |      4 |      16 |          4 |    8 |    32 |
| Mercury |      8 |       8 |          8 |   16 |    40 |
| Venus   |      4 |      16 |          8 |   12 |    40 |
| Mars    |     16 |       4 |          8 |    4 |    32 |
| Jupiter |      8 |      12 |         12 |   12 |    44 |
| Saturn  |      8 |       4 |         16 |    4 |    32 |

Base values are multiples of 4 and buffs (§4) add `+2`, so are always even — which means `×0.5` multipliers still yield integers (§9).

**Balance (open).** Stat totals are not equalized: generalists (Jupiter, Sun, Mercury, Venus; ~40–44) carry a higher total at a lower peak, specialists (Mars, Moon, Saturn; 32) a higher single-stat peak (`16`) at a lower total. No planet tops both `damage` and `healing`, and none is strictly dominated by another, so neither a dominant nor a dead pick results — but whether to equalize the totals or tier them deliberately (e.g. along the benefic/malefic ladder) is left to playtest.

## 3. Chart Generation

Every chart — player or opponent — comes from one generator: real ephemeris positions for a birth moment and place, via `astronomy-engine` (`client/src/astronomy/compute.ts`). There are no fabricated skies.

- **Player** Princes use the player's real birth data: ISO datetime, latitude, longitude.
- **Opponent, dev, and preview** charts (`seededChart`) use a deterministic-random birth — a seeded moment over ~200 years and a random place — so they are reproducible from the seed yet astronomically real.

For a given moment and place it computes:

- apparent **geocentric** ecliptic longitude per planet, in the tropical zodiac (ecliptic of date) — the frame astrology uses, so Mercury stays within `±28°` of the Sun and Venus within `±47°`
- Ascendant from local sidereal time and the obliquity of date
- sect (`isDiurnal`) from whether the Sun is above the horizon at birth

Sign, dignity, element/modality, and buffs derive from longitude the same way regardless of source (sign = `floor(longitude / 30)`).

## 4. Stat Buffs

Buffs are additive at generation, and always evenly-valued.
A planet's effective stat is base + buffs — the value used in combat.

Element — each element buffs the one stat it expresses:

| Element | Damage | Healing | Durability | Luck |
|---------|:------:|:-------:|:----------:|:----:|
| Fire    |   +2   |         |            |      |
| Water   |        |   +2    |            |      |
| Earth   |        |         |     +2     |      |
| Air     |        |         |            |  +2  |

Modality — three of the four stats; modality does not touch luck:

| Modality | Damage | Healing | Durability | Luck |
|----------|:------:|:-------:|:----------:|:----:|
| Cardinal |   +2   |         |            |      |
| Mutable  |        |   +2    |            |      |
| Fixed    |        |         |     +2     |      |

Sect — a conditional `+2 luck`, the companion to Air.
A planet gains it when its sect matches the chart's.
Chart sect is `Day` when the birth is diurnal, else `Night`; sect changes nothing but luck.

| Sect  | Planets              |
|-------|----------------------|
| Day   | Sun, Jupiter, Saturn |
| Night | Moon, Venus, Mars    |

Mercury has no fixed sect — it takes `Day` or `Night` from its solar phase (ecliptic longitude relative to the Sun), then matches the chart the same way.

## 5. Action and Valence

Each turn, both sides commit one planet to one of two actions.

- **Afflict** — uses the planet's `damage` stat.
- **Testify** — uses the planet's `healing` stat.

Action is set per side:

- **Player side:** explictly chosen.
  Selecting a planet fans out the two actions; the player picks one.
- **Opponent side:** randomly drawn and precommitted.
  The verb is a stat-weighted random draw — `P(afflict) = damage / (damage + healing)`, `P(testify) = 1 - P(afflict)`.
  It is locked at turn start and surfaced to the player — alongside the already-revealed opponent planet — before the player chooses, so the player always acts with full information.

## 6. Direct Resolution

Both sides resolve simultaneously.
The opponent's verb is precommitted (§5), so the player chooses with full information.

- Self acting planet -> opponent active planet
- Opponent active planet -> self acting planet

Base amount is the stat for the action:

- `Afflict`: `damage`
- `Testify`: `healing`

Multipliers:

- Crit: `2` on crit, else `1`

Raw direct amount:

- `raw = baseStat * critMultiplier`

Magnitude is the planet's own stat; dignity, sect, and element/modality buffs (§4) are the only sources of contextual strength.

## 7. Crit

Each side rolls independently per action:

- `critChance = effectiveLuck * 0.025` (effective luck runs ~4–20, so ~10–50%)
- crit doubles the direct outgoing effect (`×2`)

## 8. Affliction Value Model

Affliction is integer-valued — every direct and propagated effect is a whole number.

- direct and propagated effects apply their full amounts
- healing (testimony) clamps affliction at zero

## 9. Aspects and Propagation

Aspect multipliers:

- Conjunction: `+1`
- Sextile: `+0.5`
- Trine: `+0.5`
- Square: `-0.5`
- Opposition: `-1`

Rules:

- one-hop propagation from active source to connected targets
- magnitude: `abs(directAmount * aspectMultiplier)`
- negative multipliers invert the valence (`Affliction <-> Testimony`)
- propagation applies the same integer effect model as direct effects
- combusted targets are skipped

## 10. Combustion

Each planet takes **at most one** affliction application per turn — the direct blow if it is the acting planet, otherwise a single propagated ripple if aspected to it. Combustion is rolled once, at that application, and only for affliction.

**Functional affliction** subtracts a durability offset, scaled by dignity:

- `functional = max(0, affliction - durability * dignityMult)`

`durability` is the effective durability (§4); `dignityMult` is:

- Domicile: `3`
- Exaltation: `2.5`
- Neutral: `2`
- Detriment: `1.5`
- Fall: `1`

**Combustion probability** reads the functional value directly as a percent:

- `p = min(1, functional / 100)`

So a planet is **dead safe** while its raw affliction stays under its offset (`durability * dignityMult`, ~4–60 across the roster), then the per-hit combust chance climbs one point per point of functional affliction. Well-buffered, dignified planets endure into 3-digit raw affliction before they are likely to go; fragile, debilitated planets fold early.

Dignity scales the offset: domicile offsets more (safer), fall less (riskier). Combustion is terminal — a combusted planet is zero-output and skipped by propagation until run end (§11).

## 11. Encounter / Map / Run Flow

The game's progression is layered:

- **Encounter** — one node traversal (combat or narrative). Resolves in turns; turn count per encounter equals the number of unlocked planets (see §11.1).
- **Map** — one Sephirot-tree (per `MAP.md`). The player walks a path from L1 to L7, traversing one encounter per layer (typically 7 encounters per map).
- **Run** — a sequence of maps. After completing a map, a new map is generated and begun. The structure is similar to FTL's sectors.
- **Run end** — the run ends only when **all seven of the player's planets combust**, regardless of how many maps were completed.

Per encounter:

- Opponent planet is selected randomly each turn from non-combusted opponent planets.
- The opponent's action verb is drawn stat-weighted and precommitted at the same time (§5).
- If all opponent planets combust before the final turn, the encounter ends early.
- Encounter advances manually via `Continue` after completion.

Affliction and combust state **persist across encounters and across maps within a run**. They reset only on run end.

### 11.1 Planet Unlock Schedule

A Prince's chart is fixed at mint, but planets are unlocked progressively as a **function of cumulative encounter count** across the player's lifetime — not per run. The unlock order follows the **Macrobian ascent** (the Hellenistic ordering of the soul's ascent through the planetary spheres, Earth outward), with unlocks at encounter counts of `2^i` for `i = 0..6`:

| Encounter # | Unlock | Total planets |
|-----|--------|---------------|
| 1 | Moon | 1 |
| 2 | Mercury | 2 |
| 4 | Venus | 3 |
| 8 | Sun | 4 |
| 16 | Mars | 5 |
| 32 | Jupiter | 6 |
| 64 | Saturn | 7 |

The first 32 encounters are effectively a tutorial — the chart fills in at exponentially spaced intervals, and the player's mechanical and symbolic literacy grow alongside the chart. Saturn arrives last as the final teacher.

Each unlock happens **between encounters**, on the Map screen — when the player surfaces back from a completed encounter and sees their chart anchor (per `SCREENS.md §4.1`), the new planet appears in its computed sign with a small ceremony.

The Prince NFT artifact reveals planets on the same cumulative-encounter schedule: an unrevealed planet renders as a **ghost** at hairline weight (per `STYLE.md`), present as potential but not yet awakened. See `spec/concept/NFT.md`.

**Dev mode** overrides this schedule and unlocks all seven planets immediately. Dev mode is for development and is never active in production.

### 11.2 Achievements (deferred)

The run-end-only structure suggests room for an achievements layer — recognitions for completing multiple maps in a single run, encountering rare topologies (e.g. the canonical Sephirot pattern from `MAP.md §2`), or other lifetime markers. Achievements are out of scope for v1; they're noted here so the surrounding mechanics leave room for them.

## 12. Scoring (Distance)

UI label: `Distance`.

Only **resolution** scores.
Distance accrues from testimony — affliction healed — not from affliction created.
Affliction is the setup; resolving it is the payoff.

Per turn:

- `turnScore`: sum of testimony magnitudes (affliction reduced) across direct effects and propagation, both sides.
- Affliction created contributes nothing.

Run score accumulates `turnScore`.

Because only real reductions count, testifying a planet already at zero affliction scores nothing — affliction must exist before it can be resolved.
This makes each turn a two-beat: afflict to set up, testify to cash.

## 13. Interaction Chart Semantics

Columns:

- Planet
- Action
- Impact
- Luck

Action display:

- the opponent's precommitted verb for the turn (`Afflict` / `Testify`)

Impact display:

- the direct output for the action's stat (`damage` for `Afflict`, `healing` for `Testify`)

## 14. Prototype Scope

Intentionally out of scope for now:

- metaprogression/economy
- production persistence migrations
- full ephemeris chart calculation
- final balance pass
