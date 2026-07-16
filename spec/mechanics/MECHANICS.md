# Space Prince — Mechanics

The source of truth for the game's mechanics. Where an older design doc conflicts, this wins.

**Number model.** Every magnitude an aspect can halve is even, so all values are whole numbers — no rounding anywhere. A single stat ranges in a roughly `1–10` band (8 is heavy). Affliction accumulates toward a deterministic combustion at a ceiling set by durability, and is capped there — a combusted planet holds `ceiling`, never more.

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

The opponent's verb is precommitted (§5), so you choose with full information and you always act first. This is the core tactical lever: afflict a threatening opponent planet hard enough to combust it before it swings. Preemption only fires on combustion — a planet hits at full stat until it goes — so it is a finisher, not a guaranteed negate. Conversely, letting a *testifying* opponent planet resolve is free healing — longevity, not Distance (§12) — that combusting it would deny.

Base amount is the stat for the action:

- `Afflict`: `damage`
- `Testify`: `healing`

Raw direct amount:

- `raw = baseStat` — no multipliers; there are no crits (§7)

Magnitude is the planet's own stat; sect and element/modality buffs (§4) are the only sources of contextual strength.

## 7. Randomness

Randomness never decides how a committed action resolves; it only decides what is revealed next.

When the player commits an action, its full outcome — affliction, testimony, propagation, combustion, Distance — is computable from state the client already holds. The client renders the resolution immediately; the transaction confirms the same result behind the animation. There are no crits and no hidden rolls: anything derivable before commitment is shown (client honesty, `SCREENS.md` §1.1), and anything not derivable is genuinely unknown to everyone — including the contract — until the transaction lands.

Fresh randomness enters only where the game is already pausing to reveal something new, and every reveal rides a transaction the player is already waiting on:

- **Map creation.** The map seed is a VRF draw; from it derive node content (`MAP.md`) and, on rollover, the map-boundary uncombust rolls and barrage (§11.3) — all settled and fully displayed before the first node is entered.
- **Turn boundaries.** The transaction that resolves turn N also draws the opponent's next precommit — planet and verb (§5). By the time the resolution animation finishes, the next move has landed. Combat's randomness is not knowing what comes next — never not knowing what your committed action will do.
- **Wagers.** A narrative wager's outcome is rolled by the transaction that commits it; the wait is the reveal. The odds are always displayed before commitment: `min(0.85, 0.4 + luck × 0.03)` on the conditioning planet's luck.

Luck is therefore not a combat stat. Damage, healing, and durability decide what a planet does inside an encounter; luck decides how fate treats it between encounters — wager odds, uncombust rolls, and the barrage. The **fortune roll**, `luck × 0.05` (~10–60% at effective luck 2–12), is the shared formula at map boundaries: the chance a combusted planet uncombusts, and the chance a lit planet's barrage share is halved (§11.3). The UI surfaces it as `Fortune`.

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

Affliction is **capped at the ceiling** — a combusted planet holds `affliction = ceiling`, never more. Within encounters, combustion is terminal: a combusted planet is zero-output, takes no further affliction, receives no testimony, and is skipped by propagation. Testimony defends the margin; it never resurrects.

A combusted planet returns only by **uncombusting**, and uncombusting never happens in combat. Two processes exist: the map-boundary fortune roll (§11.3) and the narrative uncombust rites (`HOUSES.md`). Both return the planet at `affliction = ceiling / 2` — back, but scarred, with half its margin already spent.

**Dignity is not a combat input.** Essential dignity (a planet's strength by sign — domicile, exaltation, detriment, fall) is reserved for the **house-encounter** system (`HOUSES.md`), where a planet's competence in its sign is expressed narratively rather than as a stat nudge. The chart still computes each planet's dignity; combat simply does not read it.

## 11. Encounter / Map / Run Flow

The game's progression is layered:

- **Encounter** — one node traversal (combat or narrative). Combat resolves in a **fixed 3 turns**, regardless of unlock tier (§11.1); narrative encounters are short decision trees (`HOUSES.md`).
- **Map** — one Sephirot-tree (per `MAP.md`). The player walks a path from L1 to L7, traversing one encounter per layer (typically 7 encounters per map).
- **Run** — **up to seven maps.** After completing a map, the next is generated and begun. The structure is similar to FTL's sectors.
- **Run end** — a run ends on whichever comes first: **full combustion** (all seven of the player's planets combust) or **completion** (the seventh map is finished). Combustion is early failure — dying before the final boss, in Slay the Spire / FTL terms; completion is the full passage. Either way, the run's **final Distance (§12)** is its permanent record, inscribed as a star in the NFT field (`NFT.md`).

Per encounter:

- The opponent spawns **already afflicted** — only resolution scores (§12), so the tension must predate the player for a 3-turn fight to have anything to resolve.
  One fielded planet rolls heavy: 40–65% of its combustion ceiling.
  Every other fielded planet rolls light: 0–25% of its ceiling.
  Amounts are integers, rolled deterministically from the node's opponent seed, and always below ceiling — no planet spawns combusted.
- Opponent planet is drawn randomly each turn from its non-combusted **fielded** planets (the roster mirrors the player's unlock tier, §11.1). The draw for turn N+1 happens at turn N's resolution — encounter arrival draws the first — so the reveal rides a transaction already in flight (§7).
- The opponent's action verb is drawn stat-weighted and precommitted at the same time (§5).
- If all fielded opponent planets combust before the final turn, the encounter ends early.
- Encounter advances manually via `Continue` after completion.

Affliction and combust state **persist across encounters and across maps within a run**. Crossing a map boundary passes them through the uncombust rolls and barrage (§11.3). They reset only on run end.

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

**Encounter length and the mirrored opponent.** Combat always resolves in a fixed **3 turns**, regardless of unlock tier. Difficulty ramps not through encounter length but through the opponent's *roster*: the adversary fields exactly the planets the player has unlocked — Moon vs Moon at the first encounter, two-vs-two at the next tier, up to a full seven-vs-seven. Both sides may send the same planet on more than one turn, so a one-planet player plays a full three-turn fight with the Moon alone. Mirroring keeps the early game fair and legible: the challenge grows with the player's own chart rather than throwing a seven-planet opponent at a single-planet newcomer.

Each unlock happens **between encounters**, on the Map screen — when the player surfaces back from a completed encounter and sees their chart anchor (per `SCREENS.md §4.1`), the new planet appears in its computed sign with a small ceremony.

The Prince NFT artifact reveals planets on the same cumulative-encounter schedule: an unrevealed planet renders as a **ghost** at hairline weight (per `STYLE.md`), present as potential but not yet awakened. See `spec/concept/NFT.md`.

**Dev mode** overrides this schedule and unlocks all seven planets immediately. Dev mode is for development and is never active in production.

### 11.2 Achievements (deferred)

The run-end-only structure suggests room for an achievements layer — recognitions for completing multiple maps in a single run, encountering rare topologies (e.g. the canonical Sephirot pattern from `MAP.md §2`), or other lifetime markers. Achievements are out of scope for v1; they're noted here so the surrounding mechanics leave room for them.

### 11.3 Map boundaries: uncombust rolls and the barrage

Completing a map rolls the next one (§11), and the new map's seed also rolls what the crossing does to the player's chart — two steps, in order, both settled at map creation and shown on entry (§7):

1. **Uncombust rolls.** Each combusted fielded planet rolls fortune (`luck × 0.05`, §7); on success it uncombusts at half ceiling (§10).
2. **The barrage.** Each lit fielded planet — including any that just uncombusted — takes affliction: a uniform roll from `0` to `k × 5%` of its ceiling, where `k` is the number of maps completed this run. A successful fortune roll halves the planet's share. Amounts are integers, and a planet's resulting affliction is capped at `ceiling − 1` — like opponent spawns (§11), the barrage wounds but never combusts.

The first map of a run has no boundary: the chart enters clean. Each crossing after that opens closer to the edge — by the seventh map the barrage rolls up to 30% of every ceiling — so later maps are higher-stakes before their first node is entered. The barrage is also what makes combustion a tide rather than a one-way ratchet: pressure rises map over map, and the uncombust processes (§10) push back.

## 12. Scoring (Distance)

UI label: `Distance`.

Only **resolution on the opponent's chart** scores.
Distance accrues from testimony — affliction healed — not from affliction created.
Affliction is the setup; resolving it is the payoff.

The player's own chart never scores: personal chart management is about survival, opponent chart management is about scoring.
The opponent healing your chart is a gift of longevity, not Distance.
Every point of Distance therefore traces to the player's own action.

Per turn:

- `turnScore`: sum of testimony magnitudes (affliction reduced) on the opponent's chart — the direct hit and its propagation, including afflictions inverted to testimony across squares and oppositions (§9).
- Affliction created contributes nothing.
- Phase 2 — the opponent's action on your chart (§6) — contributes nothing.

Run score accumulates `turnScore`.

Because only real reductions count, testifying a planet already at zero affliction scores nothing — affliction must exist before it can be resolved.
This makes each turn a two-beat: afflict to set up, testify to cash.

A run's **final accumulated Distance** is its permanent output. When the run ends — combustion or completion (§11) — that value is inscribed as a star in the Prince's NFT field (`NFT.md`, "The Star-Field"). Nothing else about the run is recorded: not how it ended, not which planets combust. Only the Distance, and the star it earns.

## 13. Interaction Chart Semantics

Columns:

- Planet
- Action
- Impact

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
