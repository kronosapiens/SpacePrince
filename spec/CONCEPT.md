# Space Prince — Concept

## Overview

**Space Prince** is a fully onchain, single-character RPG with roguelike structure and mythic progression.
Each player controls a single **Prince** whose identity is fixed at mint time by a real-world latitude, longitude, and timestamp. This immutable birth data is used to compute an astrological chart onchain, which serves as the character’s symbolic and mechanical foundation.

The game is not about optimizing stats or chasing linear power. It is about **interpreting fate**, discovering viable playstyles within constraint, and watching the world respond to your actions over time.

Space Prince is expression-first, lore-driven, and cyclical rather than competitive or hierarchical.

---

## Core Fantasy

> *You are born once.
> The cosmos does not change — but your understanding of it does.*

Players do not min-max characters. They **inhabit** them.

- Identity is irreversible.
- Power is contextual and cyclical.
- Progress is measured in understanding, not accumulation.

Failure is not punishment; it is acknowledgment. When a run ends, the world remembers.

---

## Identity & Minting

- Each Prince is defined **onchain** by:
  - Latitude
  - Longitude
  - Timestamp
- These values are immutable and public.
- The onchain astrological calculation derives:
  - 12 Signs
  - 4 Elements
  - Planetary placements
  - Aspects and tensions

Names, biographies, and historical interpretations (e.g. “this chart resembles Napoleon”) are **offchain only**. Onchain, all Princes are anonymous coordinates in spacetime.

This preserves mythic distance and avoids canonical celebrity worship.

---

## Design Pillars

### 1. Fixed Identity, Horizontal Power
- No chart is strictly stronger than another.
- Charts define **affinities, constraints, and tradeoffs**, not raw strength.
- Every configuration supports a viable but distinct playstyle.

### 2. Cyclical Balance
- Systems are balanced through cycles, not ladders.
- Elemental relationships form rock-paper-scissors–style dominance loops.
- Strength is situational and contextual.

### 3. Expression Over Optimization
- The player’s job is not to “win faster,” but to **interpret themselves better**.
- Progression unlocks new expressions of the same identity, not replacements.

### 4. Loss Unlocks the World
- Defeat advances narrative and mechanical understanding.
- The cosmos responds to failure with new access, dialogue, and options.
- The emotional outcome of loss should be: *“The world noticed.”*

---

## Game Structure

### Genre
- Single-character RPG with roguelike runs
- Diablo/Hades lineage, but slower, more ritualized
- Not a TCG (no deck-swapping, no disposable characters)

### Runs
- Short, self-contained campaigns
- Focused on encounters, choices, and interpretation shifts
- Temporary emphases (houses, aspects, planetary expressions) may arise during a run

### Metaprogression
- Unlocks new:
  - Areas / cosmological layers
  - NPCs (planets, constellations, abstractions)
  - Interpretations of existing mechanics
- Does **not** invalidate earlier playstyles

---

## Mechanical Framework

### Elements
- 4 Elements form the macro combat cycle
- Govern initiative, reaction priority, and high-level dominance

### Signs
- 12 Signs provide micro-modifiers and conditional effects
- Each sign has a narrow, legible mechanical identity

### Planets
- Planets are **verbs**, not stats
- Each planet represents a type of action or intervention
- Aspects (trine, square, opposition, etc.) modify *how* the planet behaves

### Houses
- Houses act as progression tracks
- Unlocking a house deepens a dimension of identity rather than increasing power
- Progression answers: *“Which parts of yourself have you integrated?”*

---

## Combat & Randomness

### Turn Structure
- Discrete, deterministic turns
- One meaningful player choice per turn (by design)
- Onchain-friendly state transitions

### RNG
- Randomness is explicit and ritualized
- A D20-style roll underlies many actions
- Rolls are **always visible**, with modifiers explained

Astrology shapes randomness:
- Some charts bias outcomes upward or downward
- Some compress variance; others amplify swinginess
- The question is never “why did this happen?” but:
  > “Given who I am, was this likely?”

RNG is interpretive, not opaque.

---

## Onchain Philosophy

- The **entire game state** lives onchain
- Client is UI only
- Onchain responsibilities include:
  - Identity
  - Chart computation
  - Combat resolution
  - World state & progression flags

Design avoids:
- Real-time inputs
- Inventory spam
- Excessive branching state
- Micro-actions with high gas cost

Space Prince is designed as a **ritual game**, not an arcade game.

---

## Tone & Vibe

- Mythic, symbolic, slightly austere
- Not ironic, not whimsical
- The universe is legible but not friendly
- Systems feel ancient, not gamified

---

## Open Questions / Areas for Exploration

1. **Death & Memory**
   - How exactly does the world record *how* a Prince dies?
   - Are scars permanent, cyclical, or interpretable?

2. **RNG Boundaries**
   - Which actions should never fail?
   - Where does randomness enhance expression vs undermine agency?

3. **World Structure**
   - How many cosmological layers exist?
   - What defines “endgame” in an expression-first system?

4. **Asynchronous Interaction**
   - How do Princes meaningfully encounter one another without ladders or hypercompetitive PvP?
   - Echoes, challenges, shared world events?

5. **Lore Emergence**
   - What is discovered by play vs authored upfront?
   - How much ambiguity should remain unresolved?

---

## Non-Goals

- Hypercompetitive esports balance
- Linear power inflation
- Celebrity branding
- Belief claims about astrology

Astrology is treated as a **symbolic system**, not a truth assertion.

---

*Space Prince is a game about fate without determinism, randomness without chaos, and power without hierarchy.*
