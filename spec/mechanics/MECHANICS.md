# Space Prince — Mechanics

The source of truth for the game's mechanics. Where an older design doc conflicts, this wins.

**Number model.** Every magnitude an aspect can halve is even, so all values are whole numbers — no rounding anywhere. A single stat ranges in a roughly `1–10` band (8 is heavy). Affliction accumulates toward a deterministic combustion at a ceiling set by durability.

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

Base stats per planet, even values on a roughly `1–10` scale:

| Planet  | Damage | Healing | Durability | Luck | Total |
|---------|-------:|--------:|-----------:|-----:|------:|
| Sun     |      6 |       4 |          6 |    4 |    20 |
| Moon    |      2 |       8 |          2 |    4 |    16 |
| Mercury |      4 |       4 |          4 |    8 |    20 |
| Venus   |      2 |       8 |          4 |    6 |    20 |
| Mars    |      8 |       2 |          4 |    2 |    16 |
| Jupiter |      4 |       6 |          6 |    6 |    22 |
| Saturn  |      4 |       2 |          8 |    2 |    16 |

Base values are even and buffs (§4) add `+2`, so every magnitude stays even — which means `×0.5` multipliers still yield integers (§9).

**Balance (open).** Stat totals are not equalized: generalists (Jupiter, Sun, Mercury, Venus; ~20–22) carry a higher total at a lower peak, specialists (Mars, Moon, Saturn; 16) a higher single-stat peak (`8`) at a lower total. No planet tops both `damage` and `healing`, and none is strictly dominated by another, so neither a dominant nor a dead pick results — but whether to equalize the totals or tier them deliberately (e.g. along the benefic/malefic ladder) is left to playtest.

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

Resolution is **sequential**, in two phases — the intent → act → response rhythm of Slay the Spire rather than the simultaneous trade of FTL (`spec/concept/INFLUENCES.md`):

1. **Your action → the opponent's chart.** Your acting planet's effect lands on the opponent's active planet and propagates through their web (§9); combustion is resolved there.
2. **The opponent's action → your chart.** Read *after* phase 1 — so a planet you combusted in phase 1 outputs nothing; its phase-2 response is **preempted**.

The opponent's verb is precommitted (§5), so you choose with full information and you always act first. This is the core tactical lever: afflict a threatening opponent planet hard enough to combust it before it swings. Preemption only fires on combustion — a planet hits at full stat until it goes — so it is a finisher, not a guaranteed negate. Conversely, letting a *testifying* opponent planet resolve is free Distance (§12) you'd otherwise deny.

Base amount is the stat for the action:

- `Afflict`: `damage`
- `Testify`: `healing`

Multipliers:

- Crit: `2` on crit, else `1`

Raw direct amount:

- `raw = baseStat * critMultiplier`

Magnitude is the planet's own stat; sect and element/modality buffs (§4) are the only sources of contextual strength.

## 7. Crit

Each side rolls independently per action:

- `critChance = effectiveLuck * 0.05` (effective luck runs ~2–12, so ~10–60%)
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
- combustion resolves before propagation: if the blow combusts the planet it lands on, that planet conducts nothing onward — propagation is short-circuited, not computed then negated

## 10. Combustion

Each planet takes **at most one** affliction application per turn — the direct blow if it is the acting planet, otherwise a single propagated ripple if aspected to it. Combustion is checked once, at that application, and only for affliction.

Affliction accumulates toward a **combustion ceiling** set by durability alone. A planet combusts **the moment its affliction reaches the ceiling** — deterministic, no roll:

- `ceiling = durability * 10` (durability = core + sign buffs, per §4)
- combust when `affliction >= ceiling`

Ceilings read directly as how much affliction a planet absorbs before it goes out — durable planets soak many blows; fragile ones fold in a few. Affliction **below** the ceiling is a recoverable margin: a planet never combusts from a hit that leaves it under the line, and healing affliction back down restores the full margin. Combustion is planned for, not gambled on — the player can read how many more blows a planet has in it.

Combustion is terminal — a combusted planet is zero-output and skipped by propagation until run end (§11).

**Dignity is not a combat input.** Essential dignity (a planet's strength by sign — domicile, exaltation, detriment, fall) is reserved for the **house-encounter** system (`HOUSES.md`), where a planet's competence in its sign is expressed narratively rather than as a stat nudge. The chart still computes each planet's dignity; combat simply does not read it.

## 11. Encounter / Map / Run Flow

The game's progression is layered:

- **Encounter** — one node traversal (combat or narrative). Combat resolves in a **fixed 3 turns** (with an early-game ramp, §11.1); narrative encounters are short decision trees (`HOUSES.md`).
- **Map** — one Sephirot-tree (per `MAP.md`). The player walks a path from L1 to L7, traversing one encounter per layer (typically 7 encounters per map).
- **Run** — **up to seven maps.** After completing a map, the next is generated and begun. The structure is similar to FTL's sectors.
- **Run end** — a run ends on whichever comes first: **full combustion** (all seven of the player's planets combust) or **completion** (the seventh map is finished). Combustion is early failure — dying before the final boss, in Slay the Spire / FTL terms; completion is the full passage. Either way, the run's **final Distance (§12)** is its permanent record, inscribed as a star in the NFT field (`NFT.md`).

Per encounter:

- Opponent planet is selected randomly each turn from non-combusted opponent planets.
- The opponent's action verb is drawn stat-weighted and precommitted at the same time (§5).
- If all opponent planets combust before the final turn, the encounter ends early.
- Encounter advances manually via `Continue` after completion.

Affliction and combust state **persist across encounters and across maps within a run**. They reset only on run end.

### 11.1 Planet Unlock Schedule

A Prince's chart is fixed at mint, but planets are unlocked progressively as a **function of cumulative encounter count** across the player's lifetime — not per run. The unlock order follows the **Macrobian ascent** (the Hellenistic ordering of the soul's ascent through the planetary spheres, Earth outward). The Moon is present from the first encounter; each subsequent planet unlocks at a cumulative count of `2^i` for `i = 0..5`:

| Cumulative encounters | Unlock | Total planets |
|-----|--------|---------------|
| 0 (start) | Moon | 1 |
| 1 | Mercury | 2 |
| 2 | Venus | 3 |
| 4 | Sun | 4 |
| 8 | Mars | 5 |
| 16 | Jupiter | 6 |
| 32 | Saturn | 7 |

The first 32 encounters are effectively a tutorial — the chart fills in at exponentially spaced intervals, and the player's mechanical and symbolic literacy grow alongside the chart. Saturn arrives last as the final teacher.

**Encounter length and the unlock ramp.** Combat resolves in a fixed **3 turns**, but a player can never send more distinct planets than they have unlocked, so the earliest encounters are shorter: `turns = min(3, unlockedPlanets)`. The Moon-only first encounter is a single turn (observation, per `spec/v2/ONBOARD.md`); the two-planet stage is two turns; from Venus (the third planet) onward, every encounter is the full three. Past three planets the cap stops biting — a full seven-planet chart still resolves in three turns, which makes *which three you send* a genuine choice rather than a roll-call of the whole chart.

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

A run's **final accumulated Distance** is its permanent output. When the run ends — combustion or completion (§11) — that value is inscribed as a star in the Prince's NFT field (`NFT.md`, "The Star-Field"). Nothing else about the run is recorded: not how it ended, not which planets combust. Only the Distance, and the star it earns.

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
