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

## 2. Base Stats

`damage, healing, durability, luck`:

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
- Mercury: follows chart sect

Current effect:

- In-sect planets get `+1 durability`.
- This is baked into `buffs.durability` at chart generation time.
- Sect does not directly modify output, crit, or aspect multipliers.

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

- Friction: `0.5` for `Friction`, else `1`
- Crit: `2` on crit, else `1`

Raw direct amount:

- `raw = baseTrait * friction * critMultiplier`

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

## 13. Encounter / Run Flow

- `MAX_ENCOUNTERS = 3`
- Current client creates runs with all planets unlocked (`unlockAll=true`), so sequence length is 7.
- Opponent sequence entries that are already combusted are skipped.
- Encounter auto-advances when completed.
- Run ends in defeat when all player planets combust.

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
- Sect (`☉ In/Out` or `☽ In/Out`)
- Base
- Luck
- Output

Output display:

- rounded direct output after friction
- crit bonus as `(+x)` where `x = round((output * 2) - output)`

## 16. Prototype Scope

Intentionally out of scope for now:

- metaprogression/economy
- production persistence migrations
- full ephemeris chart calculation
- final balance pass
