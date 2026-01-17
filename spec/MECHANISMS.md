# Space Prince — Core Mechanisms

This document specifies the **core mechanisms** of Space Prince and, crucially, the **motivations behind them**.
It is not an implementation spec and not a balance sheet. Its purpose is to preserve intent.

Space Prince is designed around a central constraint:

> **Identity is fixed. Power is cyclical. Progress is interpretive.**

Every system below exists to support that constraint and to prevent the game from collapsing into stat inflation, optimization dominance, or meaningless randomness.

---

## 1. Identity & Chart Computation

### Motivation

Most RPGs treat characters as interchangeable vessels. Power comes from choices made *after* creation, and bad starts are meant to be discarded. Space Prince explicitly rejects this model.

The purpose of identity in Space Prince is not customization, but **commitment**. A Prince is not something you tune — it is something you inhabit. The astrological chart is used because it provides a dense, symbolic structure that supports differentiation without hierarchy, permanence without stagnation, and meaning without belief claims.

Identity must be:
- Immutable
- Legible
- Non-optimizable
- Mechanically consequential

### 1.1 Mint Inputs
Each Prince is defined by immutable onchain inputs:
- `latitude`
- `longitude`
- `timestamp`

These values are:
- Public
- Permanent
- Non-upgradable

They form the *entire* basis of identity.

### 1.2 Onchain Chart Derivation
From the inputs, the contract deterministically computes:
- Sun sign
- Moon sign
- Rising sign
- Planetary placements
- Elemental distribution (Fire / Air / Earth / Water)
- Aspect graph (e.g. trine, square, opposition)

No offchain oracle is required after mint. The chart is canonical and auditable.

### 1.3 Mechanical Interpretation
The chart does **not** produce flat stats.

Instead, it defines:
- **Affinities** (actions that resolve smoothly)
- **Friction** (actions that are costly or risky)
- **Variance profile** (how randomness behaves)
- **Progression bias** (which Houses unlock naturally vs with effort)

All charts are designed to be *equally powerful but not equally expressed*.

### Global Uniqueness Constraint

There can exist **only one Prince for any given combination of latitude, longitude, and timestamp**.

If a Prince has already been minted for a specific spacetime coordinate, no additional Prince may ever be created for that coordinate.

This constraint is global, permanent, and enforced onchain.

Minting does not create identity; it recognizes it.


---

## 2. Core Resources & State

### Motivation

Because Space Prince is fully onchain, state bloat is not just a technical risk — it is a design smell. Excessive inventories, micro-resources, and per-turn bookkeeping encourage optimization and grind, undermining expression-first play.

State should represent **what the world remembers**, not what the player hoards.

### State Model

Each Prince maintains a compact onchain state:
- Current world position (layer / node)
- Active run state (if in-run)
- Unlocked Houses
- Unlocked planetary expressions
- World memory flags (deaths, scars, omens)
- Persistent modifiers (rare and intentional)

The system explicitly avoids:
- Large inventories
- Continuous numeric scaling
- Per-turn micro-state explosion

---

## 3. World Structure

### Motivation

The world exists to give **context** to identity. Progression should feel like *revealing a cosmology*, not climbing a content ladder. The structure of the world must reinforce the idea that meaning unfolds outward from the self.

### 3.1 Cosmological Layers
The world is structured in layered domains, unlocked over time:
1. The Ascendant — learning who you are
2. The Houses — learning where you act
3. The Planets — learning how you act
4. The Aspects — learning why action is constrained
5. The Fixed Stars — mythic / endgame layer

Each layer adds **interpretive depth**, not raw power.

### 3.2 Nodes & Encounters
- Each layer contains discrete nodes
- Nodes represent encounters, trials, or dialogues
- Nodes are deterministic but may reference RNG

Nodes are designed to be *read*, not merely cleared.

---

## 4. Runs (Roguelike Structure)

### Motivation

Runs exist to allow experimentation without erasing identity. They provide a temporary sandbox in which interpretations can be tested, stressed, and sometimes broken — while ensuring that failure still advances the game.

Runs are not about efficiency; they are about discovery.

### 4.1 Run Lifecycle
1. Run begins at a known anchor
2. Player advances through a sequence of nodes
3. Temporary emphases may arise:
   - House focus
   - Planetary aspect shifts
   - Elemental intensification
4. Run ends via victory, defeat, or withdrawal

### 4.2 Temporary vs Persistent Effects
- **Temporary effects** expire at run end
- **Persistent effects** unlock new options, interpretations, or world states

No run invalidates prior playstyles.

---

## 5. Combat System

### Motivation

Combat is not the fantasy; **decision under constraint** is. Combat exists to pressure interpretation, not to reward mechanical mastery or reflex speed.

Combat must be:
- Legible
- Auditable
- Slow enough to feel intentional
- Fast enough to avoid tedium

### 5.1 Turn Model
Combat is:
- Turn-based or tick-based
- Deterministic except for explicit RNG
- Fully resolvable onchain

Each turn consists of:
1. State evaluation
2. One player choice
3. RNG resolution (if applicable)
4. Outcome application
5. State transition

### 5.2 Action Economy
Players choose **one meaningful action per turn**, such as:
- Invoke a planet
- Commit to an elemental stance
- React defensively
- Delay or conserve

This constraint ensures:
- Predictable gas costs
- Weighty decisions
- No APM dominance

---

## 6. Elements (Macro Combat Cycle)

### Motivation

Elements provide the **primary strategic topology** of combat. They define advantage without enforcing hard counters, preserving cyclical balance and avoiding dominant strategies.

### 6.1 Elemental Roles
- Fire: initiative, burst, momentum
- Air: mobility, manipulation, foresight
- Earth: endurance, economy, attrition
- Water: adaptation, recovery, reversals

### 6.2 Elemental Cycle
Elements form a closed dominance loop (ordering TBD).

Dominance biases outcomes through:
- Initiative shifts
- Modifier bias
- Reaction priority

Elements influence probability, not certainty.

---

## 7. Signs (Micro Modifiers)

### Motivation

Signs add texture and specificity without overwhelming the system. They ensure that two Princes of the same element can still feel radically different.

Each sign must be:
- Narrow in scope
- Mechanically legible
- Non-redundant

### Sign Effects
Signs apply conditional modifiers such as:
- Timing advantages
- Trigger-based effects
- Rule exceptions

Signs modify *how* actions resolve, not raw power.

---

## 8. Planets (Verbs)

### Motivation

Planets are the primary means by which players act. They are not stats; they are **intentions**. Treating planets as verbs reinforces expression and prevents numeric dominance.

### 8.1 Planet as Action
Each planet represents a verb:
- Mars: initiate / challenge / overextend
- Saturn: restrict / delay / tax
- Mercury: reposition / copy / misdirect
- Venus: bind / allure / soften
- Moon: react / echo / fluctuate
- Sun: commit / stabilize / assert

### 8.2 Aspects Modify Expression
Aspects change *how* a planet behaves:
- Trine: smooth and efficient
- Square: powerful but risky
- Opposition: symmetrical tradeoffs
- Conjunction: intensity and focus

---

## 9. Houses (Progression Tracks)

### Motivation

Progression in Space Prince is about **integration**, not accumulation. Houses provide long-term development paths that deepen identity rather than override it.

### 9.1 House Unlocks
Houses unlock via:
- World progression
- Death events
- Repeated behavioral patterns

Unlocking a House adds interpretations and options, not stats.

### 9.2 Design Intent
Houses answer:
> “Where does this Prince act in the world?”

---

## 10. RNG System (D20 Model)

### Motivation

Randomness is essential to myth, but corrosive to agency if hidden. Space Prince uses RNG to create uncertainty **that can be reasoned about**, not chaos that must be endured.

### 10.1 Core Roll
Many actions reference a D20-style roll:
- Roll is always visible
- Modifiers are always explicit

Outcome bands (illustrative):
- 1–3: catastrophe
- 4–7: complication
- 8–13: clean resolution
- 14–17: advantage
- 18–20: breakthrough / omen

### 10.2 Astrological Influence on RNG
Charts influence RNG through:
- Band shifting
- Variance compression or expansion
- Rerolls vs flat bonuses
- Streakiness bias

The player should ask:
> “Given who I am, was this likely?”

---

## 11. Death & World Memory

### Motivation

Death must matter without being punitive. It is the primary way the world acknowledges the player and advances narrative understanding.

### 11.1 Canonical Death
When a Prince dies:
- The run ends
- The world state updates
- New content may unlock

Death is never a pure reset.

### 11.2 World Response
Responses may include:
- New dialogue
- Altered encounters
- Persistent scars or flags
- Early access to layers

Failure must always advance understanding.

---

## 12. Asynchronous Interaction

### Motivation

Interaction should feel mythic, not competitive. Other players are part of the world’s texture, not opponents to dominate.

Princes may encounter:
- Echoes of other Princes
- Challenges left behind
- Shared world states shaped collectively

Ranked ladders are explicitly non-goals.

---

## 13. Onchain Constraints

### Motivation

The chain is canon. This constraint forces clarity, legibility, and honesty in design.

All mechanics must be:
- Deterministic
- Auditable
- State-light

The design avoids:
- Real-time inputs
- Inventory spam
- Large per-turn branching

---

## 14. Explicit Non-Mechanisms

### Motivation

Some absences are intentional. These systems are excluded to protect the core fantasy.

The game avoids:
- Linear stat inflation
- Gear treadmills
- Build invalidation
- Celebrity canonization
- Hidden math

---

## Open Mechanism Questions

- Exact elemental dominance ordering
- Formal taxonomy of death scars
- Endgame structure without ladders
- RNG boundaries (what must never fail)
- Balance between authored and emergent lore

---

*Space Prince is designed so that the same chart, played twice, can reveal different truths — but never contradict itself.*
