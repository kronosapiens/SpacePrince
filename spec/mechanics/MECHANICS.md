# Space Prince — Mechanics (Current Prototype)

This file documents the mechanics implemented in `client/`.
If this conflicts with older design docs, this file reflects runtime behavior.

## 1. Entities

- Planets: `Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn`
- Signs: 12 zodiac signs.
- Each planet placement stores:
  - `sign`
  - `eclipticLongitude` (optional, currently populated by generator)
  - `element`
  - `modality`
  - `dignity`
  - `base` stats
  - `buffs` stats

## 2. Roles and Base Stats

Each planet has a gameplay role — a stat profile that matches its astrological archetype (see `spec/concept/PLANETS.md`).
The role is the player's first read on the planet; the stats are the role's mechanical expression.

- **Sun, the sovereign** — balanced presence in every stat; the centered self.
- **Moon, the healer** — top healing, fragile elsewhere; the reflective interior.
- **Mercury, the trickster** — top luck, average elsewhere; paradox, the turn.
- **Venus, the muse** — strong healing and luck; beauty, relation, the sensed world.
- **Mars, the warrior** — top damage, brittle elsewhere; the decisive cut.
- **Jupiter, the patron** — balanced and generous across all stats; expansion, gift.
- **Saturn, the weight** — top durability, slow elsewhere; limit, time, endurance.

Base stats per planet (`damage, healing, durability, luck`):

- Sun: `3, 2, 3, 2`
- Moon: `1, 4, 1, 2`
- Mercury: `2, 2, 2, 4`
- Venus: `1, 4, 2, 3`
- Mars: `4, 1, 2, 1`
- Jupiter: `2, 3, 3, 3`
- Saturn: `2, 1, 4, 1`

## 3. Chart Generation

Charts are generated from a deterministic RNG seed.

- Sun longitude is sampled uniformly in `[0, 360)`.
- Mercury longitude is sampled around Sun within `±28°`.
- Venus longitude is sampled around Sun within `±47°`.
- Other planet longitudes are sampled uniformly in `[0, 360)`.
- Sign is derived from longitude (`floor(longitude / 30)`).

These are plausibility constraints, not full ephemeris astronomy.

## 4. Stat Buffs

Buffs are additive at generation:

- Element:
  - Fire `+1 damage`
  - Earth `+1 durability`
  - Water `+1 healing`
  - Air `+1 luck`
- Modality:
  - Cardinal `+1 damage`
  - Fixed `+1 durability`
  - Mutable `+1 healing`

## 5. Sect

Sect is chart-level (`Day` if diurnal, else `Night`).

Planet sect:

- Day: `Sun, Jupiter, Saturn`
- Night: `Moon, Venus, Mars`
- Mercury: conditional by solar phase proxy (relative ecliptic longitude to Sun)

Current effect:

- In-sect planets get `+1 luck`.
- This is baked into `buffs.luck` at chart generation time.
- Sect does not directly modify base output or aspect multipliers.

## 6. Effective Combat Stats

Effective combat stats are currently:

- `effectiveStat = max(0, base + buffs)`

Affliction does not currently scale stats.
Combusted planets are treated as zero-output for direct resolution.

## 7. Polarity

Polarity between acting self planet and acting opponent planet is based on element quality overlap:

- `Testimony`: 2 shared qualities
- `Friction`: 1 shared quality
- `Affliction`: 0 shared qualities

## 8. Direct Resolution

Both sides resolve each action (simultaneous exchange):

- Self acting planet -> opponent active planet
- Opponent active planet -> self acting planet

Base trait:

- `Affliction` / `Friction`: `damage`
- `Testimony`: `healing`

Multipliers:

- Polarity: `2` for `Affliction`, `1` for `Friction`, `1` for `Testimony`
- Crit: `2` on crit, else `1`

Raw direct amount:

- `raw = baseTrait * polarityMultiplier * critMultiplier`

## 9. Crit

Each side rolls independently per action:

- `critChance = effectiveLuck * 0.10`
- no hard cap is currently applied
- crit doubles direct outgoing effect

## 10. Affliction Value Model

Affliction state is real-valued in the game state.

- direct and propagated effects apply their full real-valued amounts
- healing still clamps at zero
- UI rounds values for readability (planet chips, projections, etc.)

## 11. Aspects and Propagation

Aspect multipliers:

- Conjunction: `+1`
- Sextile: `+0.5`
- Trine: `+0.5`
- Square: `-0.5`
- Opposition: `-1`

Rules:

- one-hop propagation from active source to connected targets
- magnitude: `abs(directAmount * aspectMultiplier)`
- negative multipliers invert polarity (`Affliction <-> Testimony`)
- propagation applies the same real-valued effect model as direct effects
- combusted targets are skipped
- combusted active source does not propagate

## 12. Combustion

Combustion is checked when non-testimony affliction is applied (direct or propagation).

- `threshold = durability * 10`
- `ratio = min(1, affliction / threshold)`

Dignity factor:

- Domicile: `0.75`
- Exaltation: `0.9`
- Neutral: `1.0`
- Detriment: `1.15`
- Fall: `1.3`

Probability:

- `p = clamp(ratio * dignityFactor, 0, 0.95)`

No one-time exaltation save is currently applied.

## 13. Encounter / Map / Run Flow

The game's progression is layered:

- **Encounter** — one node traversal (combat or narrative). Resolves in turns; turn count per encounter equals the number of unlocked planets (see §13.1).
- **Map** — one Sephirot-tree (per `MAP.md`). The player walks a path from L1 to L7, traversing one encounter per layer (typically 7 encounters per map).
- **Run** — a sequence of maps. After completing a map, a new map is generated and begun. The structure is similar to FTL's sectors.
- **Run end** — the run ends only when **all seven of the player's planets combust**, regardless of how many maps were completed.

Per encounter:

- Opponent planet is selected randomly each turn from non-combusted opponent planets.
- If all opponent planets combust before the final turn, the encounter ends early.
- Encounter advances manually via `Continue` after completion.

Affliction and combust state **persist across encounters and across maps within a run**. They reset only on run end.

### 13.1 Planet Unlock Schedule

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

### 13.2 Achievements (deferred)

The run-end-only structure suggests room for an achievements layer — recognitions for completing multiple maps in a single run, encountering rare topologies (e.g. the canonical Sephirot pattern from `MAP.md §2`), or other lifetime markers. Achievements are out of scope for v1; they're noted here so the surrounding mechanics leave room for them.

## 14. Scoring (Distance)

UI label: `Distance`.

Per turn:

- `turnAffliction`: sum of all positive deltas (direct + propagation, both sides)
- `turnTestimony`: sum of absolute negative deltas (direct + propagation, both sides)
- `turnScore = turnAffliction + turnTestimony`

Run score accumulates `turnScore`.

## 15. Interaction Chart Semantics

Columns:

- Planet
- Polarity
- Impact
- Luck

Impact display:

- one-decimal direct output after polarity multiplier

## 16. Prototype Scope

Intentionally out of scope for now:

- metaprogression/economy
- production persistence migrations
- full ephemeris chart calculation
- final balance pass
