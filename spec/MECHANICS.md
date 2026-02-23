# Space Prince — Mechanics (Current Prototype)

This document describes the mechanics currently implemented in the `client/` prototype.
It is implementation-first: if this conflicts with older design docs, this file reflects actual code behavior.

## 1. Core Data Model

- Planets: `Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn`
- Signs: 12 zodiac signs.
- Each planet placement stores:
  - sign
  - element
  - modality
  - dignity
  - base stats
  - sign-derived buffs

## 2. Base Stats

Current base stats (`damage, healing, durability, luck`):

- Sun: `3, 2, 3, 2`
- Moon: `1, 4, 1, 2`
- Mercury: `2, 2, 2, 4`
- Venus: `1, 4, 2, 3`
- Mars: `4, 1, 2, 1`
- Jupiter: `2, 3, 3, 3`
- Saturn: `2, 1, 4, 1`

## 3. Sign Buffs

Buffs are additive at chart generation:

- Element buffs:
  - Fire `+1 damage`
  - Earth `+1 durability`
  - Water `+1 healing`
  - Air `+1 luck`
- Modality buffs:
  - Cardinal `+1 damage`
  - Fixed `+1 durability`
  - Mutable `+1 healing`

Effective per-planet pre-combat stats are `base + buffs`.

## 4. Effective Combat Stats

On each action, effective combat stats are currently:

- `effectiveStat = max(0, base + buffs)`

Combusted planets are treated as zeroed for direct combat output.

## 5. Polarity (Element Relationship)

Polarity between acting self planet and acting opponent planet is quality-overlap based:

- `Testimony`: 2 shared qualities
- `Friction`: 1 shared quality
- `Affliction`: 0 shared qualities

## 6. Direct Resolution

Both sides resolve simultaneously each turn:

- Self planet applies to opponent
- Opponent active planet applies to self

Base trait used:

- `Affliction` / `Friction`: uses `damage`
- `Testimony`: uses `healing`

Friction factor:

- `Friction` applies `* 0.5`
- Otherwise `* 1`

Critical multiplier:

- Crit doubles outgoing direct amount (`* 2`)

Raw direct amount:

- `raw = baseTrait * friction * critMultiplier`

## 7. Crit

Crit rolls are independent per side, per action.

- `critChance = effectiveLuck * 0.10`
- no hard cap is currently applied in code
- `roll < critChance` => crit

Crit affects propagation indirectly because propagation uses direct output magnitude as base impact.

## 8. Sect (Current Implementation)

Sect no longer boosts direct output or aspect multipliers.

Current sect effect:

- **In-sect planets get `+1 durability` for combustion checks only.**

Sect assignment:

- Day planets: `Sun, Jupiter, Saturn`
- Night planets: `Moon, Venus, Mars`
- Mercury: follows chart sect (`Day` if diurnal chart, else `Night`)

Chart sect:

- Diurnal chart => `Day`
- Nocturnal chart => `Night`

## 9. Rounding and Carry

Affliction is integer-state, but raw effect math is real-valued.

The game uses deterministic carry to avoid repeated rounding bias:

- Run stores per-planet carry on both sides:
  - `playerCarry[planet]`
  - `opponentCarry[planet]`
- Quantization uses:
  - `effective = max(0, raw + carry)`
  - `applied = round(effective)`
  - `nextCarry = effective - applied`
- Carry is consumed/updated per target planet.
- Healing clamped at zero does not bank overflow carry.

## 10. Aspects and Propagation

Aspects are computed from sign distance.

Propagation multipliers:

- Conjunction: `+1`
- Sextile: `+0.5`
- Trine: `+0.5`
- Square: `-0.5`
- Opposition: `-1`

No same-sect amplification is currently applied.

Propagation rules:

- One-hop from the active source planet to each connected target.
- Magnitude uses absolute value:
  - `|directAmount * aspectMultiplier|`
- Sign of multiplier determines inversion:
  - positive: keep polarity
  - negative: invert polarity (`Affliction <-> Testimony`)
- Propagation also uses carry-aware integer application.
- Combusted targets are skipped.
- Combusted active source does not propagate.

## 11. Combustion

Combustion is checked when applying non-testimony affliction (direct or propagation).

Probability uses affliction pressure vs durability threshold:

- `threshold = durability * 10`
- `ratio = min(1, affliction / threshold)`

Dignity transforms probability:

- Domicile: `ratio^2`
- Exaltation: `ratio`
- Neutral: `ratio`
- Detriment: `min(0.5, ratio)`
- Fall: `sqrt(ratio)`

Exaltation save:

- First would-combust event is prevented once (`exaltationSaveUsed`), then consumed.

Combusted planets:

- stop participating meaningfully in combat output
- are excluded from aspect rendering and propagation targeting

## 12. Encounter and Run Flow

- A run contains `MAX_ENCOUNTERS = 3` encounters.
- In current client flow, encounters are created with all planets unlocked, so sequence length is 7.
- Turn sequence is pre-built per encounter.
- Combusted opponent sequence entries are skipped.
- Encounter auto-advances when completed.
- Run ends in defeat when all player planets combust.

## 13. Scoring (Distance)

UI label: `Distance`.

Per turn:

- `turnAffliction`: total positive deltas this turn (direct + propagation)
- `turnTestimony`: absolute sum of negative deltas this turn
- `turnScore = turnAffliction + turnTestimony`

Run score accumulates `turnScore`.

## 14. Interaction Chart (Current UI Semantics)

Columns:

- Planet
- Polarity
- Sect (`☉ In/Out` or `☽ In/Out`)
- Base
- Luck
- Output

Output currently displays:

- base direct output after friction (`rounded`)
- crit bonus in parentheses: `(+x)` where `x` is extra from crit

## 15. Notes on Prototype Scope

Intentionally out of scope in current prototype:

- metaprogression economy
- final balancing pass
- broader content systems
- production-grade persistence migrations

This file should be updated whenever implemented mechanics change.
