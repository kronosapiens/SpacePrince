# Space Prince — Design

## Overview

**Space Prince** is a fully onchain, single-character RPG with roguelike structure and mythic progression.
Each player controls a single **Prince** whose identity is fixed at mint time by a real-world latitude, longitude, and timestamp.
This immutable birth data is used to compute an astrological chart onchain, which serves as the character's symbolic and mechanical foundation.

The game is not about optimizing stats or chasing linear power.
It is about **interpreting fate**, discovering viable playstyles within constraint, and watching the world respond to your actions over time.

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
- The player's job is not to "win faster," but to **interpret themselves better**.
- Progression unlocks new expressions of the same identity, not replacements.

### 4. Loss Unlocks the World
- Defeat advances narrative and mechanical understanding.
- The cosmos responds to failure with new access, dialogue, and options.
- The emotional outcome of loss should be: *"The world noticed."*

---

## Tone & Vibe

- Mythic and symbolic
- Systems feel ancient, not gamified
- The universe is legible and neutral

---

# Part I: Identity

## Identity & Chart Computation

A Prince is not something you tune — it is something you inhabit.

### Mint Inputs

Each Prince is defined by immutable onchain inputs:
- `latitude`
- `longitude`
- `timestamp`

These values are:
- Public
- Permanent
- Non-upgradable

They form the *entire* basis of identity.

### Onchain Chart Derivation

From the inputs, the contract deterministically computes:
- Sun sign
- Moon sign
- Rising sign
- Planetary placements
- Elemental distribution (Fire / Air / Earth / Water)
- Aspect graph (e.g. trine, square, opposition)

No offchain oracle is required after mint. The chart is canonical and auditable.

### Mechanical Interpretation

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

# Part II: Core Resource

## Permission

Space Prince has exactly **one primary resource**: Permission.

Permission represents what the world allows the Prince to do, see, or interpret at any given moment.
It is not a currency, not a meter, and not a stat — it is a relationship between the Prince and the cosmos.

### What Permission Is

Permission is:
- **Access** — which actions, interpretations, or paths are available
- **Standing** — how the world currently responds to the Prince
- **Latitude** — how much deviation or risk is tolerated
- **Legibility** — what the Prince is allowed to perceive or know

Permission is contextual, situational, and asymmetric.
The Prince may lose permission in one domain while gaining it in another.

### Alignment Drives Permission

Permission is not abstract — it emerges from **alignment**.

Alignment measures the harmony between the Prince's chart and the current context (an encounter, an environment, an opponent's chart).
Maintaining alignment increases permission; losing alignment decreases it.

The player feels permission change through what options open or close as alignment shifts.

### What Permission Is Not

Permission is explicitly **not**:
- Health
- Energy
- Cooldowns
- Skill points
- Time
- Currency
- Progression XP

If a mechanic can be expressed as "you ran out," it is probably not permission.

### Permission and Failure

Failure is the primary way permission changes.

On failure:
- Some permissions are revoked
- Other permissions may be granted
- Certain approaches may stop working
- New interpretations may become available

This is never framed as punishment.

The correct player interpretation is not:
> "The game took something from me."

But:
> "The world no longer responds to this approach."

### Visibility of Permission

Permission is **never displayed as a number or bar**.

The player learns permission through:
- Which options appear or disappear
- Which actions resolve cleanly or fail abruptly
- Lore fragments that acknowledge allowance or refusal
- Changes in world response

Permission must always be *legible in principle*, but never exhaustively enumerated.

### Onchain Representation

Onchain, permission is represented through:
- Flags
- Access gates
- Branch eligibility
- Unlockable interpretations
- State-dependent action availability

There is no global "permission score."
Permission is always specific to a context, layer, or moment.

### Entropy Is Not Permission

The darkening background (death entropy) records **cost**, not capacity.

- Entropy accumulates
- Permission fluctuates

A Prince with high entropy may still have broad permission.
A Prince with low entropy may find their options sharply constrained.

These systems must never collapse into one another.

### Permission Design Rules

- Permission must never feel grindable
- Permission must never regenerate on a timer
- Permission must never be purchasable
- Permission loss must always be interpretable
- Permission gain must feel *noticed*, not rewarded

If permission ever resembles stamina, the design has failed.

---

# Part III: World & Progression

## State Model

State represents **what the world remembers**, not what the player hoards.

### Prince State

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

## World Structure

Progression feels like *revealing a cosmology*, not climbing a content ladder.

The cosmos is not an opponent to defeat — it is a presence to listen to, like Siddhartha's river.
Alignment isn't conquest; it's harmonizing with something that was always there.

### Cosmological Layers

The world is structured in layered domains, unlocked over time:
1. The Ascendant — learning who you are
2. The Houses — learning where you act
3. The Planets — learning how you act
4. The Aspects — learning why action is constrained
5. The Fixed Stars — where distinctions dissolve into unity

Each layer adds **interpretive depth**, not raw power.

### Nodes & Encounters

- Each layer contains discrete nodes
- Nodes represent encounters, trials, or dialogues
- Nodes are deterministic but may reference RNG

Nodes are designed to be *read*, not merely cleared.

---

## Runs (Roguelike Structure)

Runs allow experimentation without erasing identity.
Failure still advances the game.

### Run Lifecycle

1. Run begins at a known anchor
2. Player advances through a sequence of nodes
3. Temporary emphases may arise:
   - House focus
   - Planetary aspect shifts
   - Elemental intensification
4. Run ends via victory, defeat, or withdrawal

### Temporary vs Persistent Effects

- **Temporary effects** expire at run end
- **Persistent effects** unlock new options, interpretations, or world states

No run invalidates prior playstyles.

---

## Houses (Progression Tracks)

Houses are long-term development paths that deepen identity rather than override it.

### House Unlocks

Houses unlock via:
- World progression
- Death events
- Repeated behavioral patterns

Unlocking a House adds interpretations and options, not stats.

### Design Intent

Houses answer:
> "Where does this Prince act in the world?"

---

## Precision as Advancement

Advancement in Space Prince is operationalized through **finer-grained control**.

A novice Prince can only make coarse adjustments — broad strokes, blunt corrections.
An advanced Prince can make precise adjustments — fine-tuning, micro-corrections.

This means:
- Early play has fewer meaningful choices within each action (coarse bands)
- Late play has more meaningful choices (fine bands)
- The ceiling of what's *possible* doesn't change, but the ceiling of what's *expressible* does

An advanced Prince isn't stronger — they're more articulate.
They can achieve the same outcomes as a novice, but with more control over exactly how.

### Precision and Charts

Different charts may gain precision along different dimensions.
One Prince refines control over timing; another over intensity; another over targeting.
Advancement means becoming more specifically yourself, not generically better.

---

# Part IV: Action & Combat

## Core Actions: Think / Wait / Fast

The game defines **three existential stances** a Prince may take toward any moment:

> **Think. Wait. Fast.**

These come from Siddhartha's answer when asked what skills he has: *"I can think. I can wait. I can fast."*

They are orientations toward uncertainty, time, and constraint.
All other mechanics — planetary actions, elemental dynamics, progression effects — are interpreted through one of these stances.

### Action Overview

On each turn, the player may choose exactly one of the following actions:

- **Think** — seek clarity
- **Wait** — yield to time
- **Fast** — impose constraint

Each action must always produce a **legible effect**, even if its full consequences are delayed.

---

### Think

**Stance:** Attention directed inward.

**Effect:** Trades tempo for clarity.
Reveals current alignment state, drift direction, and likely outcome bands.
Does not directly correct alignment, but makes the next correction more informed.

**Relationship to Alignment:** Thinking shows you where you are and where you're drifting — it doesn't move you, but it illuminates the path.

---

### Wait

**Stance:** Attention withheld.

**Effect:** Allows drift to occur without intervention.
Sometimes drift moves in your favor; sometimes it doesn't.
Waiting can soften harsh alignment states or allow an opponent to overextend.

**Relationship to Alignment:** Waiting lets the world move first. Drift happens, but you haven't spent your action — you're watching to see where things settle.

---

### Fast

**Stance:** Attention concentrated through deprivation.

**Effect:** Forces an alignment correction by sacrificing something — a resource, a planet's influence, or an option.
The correction is stronger than normal, but at cost.
Fasting can snap you back into alignment quickly, but overuse accumulates consequences.

**Relationship to Alignment:** Fasting is the hard correction. When drift has taken you far off center, fasting forces realignment — but you pay for the violence of the snap.

---

### Action Invariants

- Every turn offers **Think, Wait, or Fast** — never more, never less
- No action is "free"; each affects alignment or probability
- No optimal sequence exists independent of context
- Think = see the drift, Wait = let it happen, Fast = force correction

Planetary abilities, elemental interactions, and special mechanics are expressed **through** these stances, not alongside them.

---

## Combat System

Combat exists to pressure interpretation, not to reward mechanical mastery or reflex speed.

### Alignment as Core

Combat is not about depleting an enemy health bar.
It is about **maintaining alignment** between your chart and the opposing context (an encounter's chart, an environment, an opponent).

**Drift** is the natural entropy of combat — alignment degrades over time as forces act.
**Gameplay** is about correcting drift, restoring alignment, or strategically allowing misalignment.

Good alignment opens options (permission increases).
Poor alignment closes options (permission decreases).

The encounter isn't "can I kill this thing" but "can I stay aligned while it tries to knock me off center."

### Two Charts in Tension

Every combat involves two charts:
- In PvE: the Prince's chart vs the encounter's chart
- In PvP: the Prince's chart vs the opponent's chart

Charts are "equally powerful but differently expressed" because every chart can achieve alignment — but the *path* to alignment differs.
Some charts drift slowly; some snap back easily; some have narrow alignment windows but high permission when aligned.

### Rotating Charts

Visually and mechanically, combat is **two star charts rotating relative to each other**.

As the charts rotate, planetary positions come into and out of alignment:
- When your Mars aligns with their Venus, certain actions become available
- When your Saturn opposes their Jupiter, certain frictions arise
- The rotation is continuous — good and bad positions come and go

**Drift is rotation.** The charts turn naturally each turn. You're not fighting a health bar; you're surfing a cycle.

**Distance** may function as a second axis:
- Closer = more intense interactions, higher stakes
- Further = softer interactions, more time to react

**Think/Wait/Fast in rotation terms:**
- Think = see where the rotation is heading, anticipate alignments
- Wait = let the rotation proceed, hope it moves toward favorable positions
- Fast = force a rotation change (speed up, slow down, or lock), at cost

**Precision in rotation terms:**
- Coarse = "rotate faster" or "rotate slower"
- Fine = "rotate exactly 15 degrees"

### Precision in Combat

Advancement increases the precision of alignment adjustments:
- Coarse control = big corrections (might overshoot, risky)
- Fine control = small corrections (precise tuning, more options)

An advanced Prince makes micro-corrections where a novice makes macro-corrections and hopes.

### Turn Model

Combat is:
- Turn-based
- Deterministic except for explicit RNG
- Fully resolvable onchain

Each turn consists of:
1. Alignment evaluation
2. Drift applied
3. One player choice (Think, Wait, or Fast)
4. Outcome + alignment shift
5. Permission recalculated

### Action Economy

Players choose **one meaningful action per turn**.

This constraint ensures:
- Predictable gas costs
- Weighty decisions
- No APM dominance

---

## Elements (Macro Combat Cycle)

Elements define advantage without enforcing hard counters, preserving cyclical balance.

### Elemental Roles

- **Fire:** initiative, burst, momentum
- **Air:** mobility, manipulation, foresight
- **Earth:** endurance, economy, attrition
- **Water:** adaptation, recovery, reversals

### Elemental Cycle

Elements form a closed dominance loop (ordering TBD).

Dominance biases outcomes through:
- Initiative shifts
- Modifier bias
- Reaction priority

Elements influence probability, not certainty.

---

## Signs (Micro Modifiers)

Signs add texture so that two Princes of the same element can feel radically different.

### Sign Effects

Signs apply conditional modifiers such as:
- Timing advantages
- Trigger-based effects
- Rule exceptions

Signs modify *how* actions resolve, not raw power.

---

## Planets (Verbs)

Planets are not stats; they are **intentions** — and partial teachers.

Like Siddhartha's teachers, each planet offers real wisdom, but none offers the whole truth.
A Prince who only listens to Mars learns commitment but not patience.
A Prince who only listens to Saturn learns endurance but not initiative.

### Planet as Action

Each planet represents a verb:
- **Mars:** initiate / challenge / overextend
- **Saturn:** restrict / delay / tax
- **Mercury:** reposition / copy / misdirect
- **Venus:** bind / allure / soften
- **Moon:** react / echo / fluctuate
- **Sun:** commit / stabilize / assert

### Aspects Modify Expression

Aspects change *how* a planet behaves:
- **Trine:** smooth and efficient
- **Square:** powerful but risky
- **Opposition:** symmetrical tradeoffs
- **Conjunction:** intensity and focus

---

# Part V: Randomness & Death

## RNG System (D20 Model)

RNG creates uncertainty **that can be reasoned about**, not chaos that must be endured.

### Core Roll

Many actions reference a D20-style roll:
- Roll is always visible
- Modifiers are always explicit

Outcome bands (illustrative):
- 1–3: catastrophe
- 4–7: complication
- 8–13: clean resolution
- 14–17: advantage
- 18–20: breakthrough / omen

### Astrological Influence on RNG

Charts influence RNG through:
- Band shifting
- Variance compression or expansion
- Rerolls vs flat bonuses
- Streakiness bias

The player should ask:
> "Given who I am, was this likely?"

RNG is interpretive, not opaque.

---

## Death & World Memory

Death matters without being punitive — it is the primary way the world acknowledges the player.

### Canonical Death

When a Prince dies:
- The run ends
- The world state updates
- New content may unlock

Death is never a pure reset.

### World Response

Responses may include:
- New dialogue
- Altered encounters
- Persistent scars or flags
- Early access to layers

Failure must always advance understanding.

---

# Part VI: Asynchronous & Onchain

## Asynchronous Interaction

Other players are part of the world's texture, not opponents to dominate.

Other Princes are like Govinda to Siddhartha: travelers on parallel paths, meeting occasionally as echoes.
Different starting coordinates, different journeys — no judgment about which path is better.

Princes may encounter:
- Echoes of other Princes
- Challenges left behind
- Shared world states shaped collectively

Ranked ladders are explicitly non-goals.

---

## Onchain Constraints

The chain is canon — this forces clarity and honesty in design.

All mechanics must be:
- Deterministic
- Auditable
- State-light

The design avoids:
- Real-time inputs
- Inventory spam
- Large per-turn branching

### Onchain Responsibilities

- Identity
- Chart computation
- Combat resolution
- World state & progression flags

The client merely reveals what already exists.

---

# Part VII: Design Invariants

These are **non-negotiable constraints** — guardrails, not preferences.

---

### 1. Identity Is Irreversible

A Prince is defined by a unique latitude, longitude, and timestamp.
Only one Prince may exist per spacetime coordinate.
The NFT is the Prince — no separate save, avatar, or profile exists.
Minting recognizes an identity; it does not create one.

---

### 2. Progress Is Horizontal, Not Vertical

Progress unlocks *ways of acting*, not raw power.
All systems exist in closed loops and tradeoffs — no chart or strategy is universally dominant.
A Prince does not become stronger; they become more specific.

---

### 3. Death Advances and Marks

Death is canonical: it ends the run, updates the world, and may unlock new content.
Every death leaves an irreversible trace — history accumulates monotonically.
The background darkens with each death, recording entropy in the world, not damage to the Prince.

---

### 4. One Action Per Turn: Think / Wait / Fast

The player takes exactly one meaningful action per turn.
All actions are interpretations of thinking (clarity), waiting (yielding), or fasting (constraint).
No action is free of consequence.

---

### 5. Randomness Is Visible

All randomness must be explicit, all modifiers legible.
The player should be able to ask: "Given who I am, was this likely?"

---

### 6. The Chain Is Canon

All meaningful state lives onchain.
The UI reveals but does not decide.
If the client disappears, the world persists.

---

### 7. Lore Preserves Mystery

There is no omniscient narrator; lore may contradict itself.
Systems should be clear but not fully mapped.
Local clarity can coexist with global mystery.

---

### 8. Other Princes Are Traces, Not Competitors

No ranked ladders, no numeric comparison of worth.
Other Princes exist as echoes, warnings, or artifacts.
Social meaning is cultural, not mechanical.

---

### 9. Money Cannot Bypass Interpretation

Money may not accelerate understanding, undo history, or substitute for attention.
If payment replaces commitment, the system has failed.

---

### 10. The Game Respects Silence

Waiting is valid. Inaction is not failure.
Not playing for a time must not be punished.

---

### 11. There Is No Win Screen

No final victory condition, no completion percentage.
At most, there is quiet or saturation.

---

### 12. Beauty Emerges from Use

Visual evolution reflects history, not rarity traits.
A Prince is beautiful because it has been lived with.

---

# Part VIII: Non-Goals

Space Prince is **not**:
- A TCG or deckbuilder
- A hero collector
- A loot treadmill
- An esports title

Astrology is treated as a **symbolic system**, not a truth assertion.

---

# Part IX: Open Questions

1. **Death & Memory**
   - How exactly does the world record *how* a Prince dies?
   - Are scars permanent, cyclical, or interpretable?
   - Formal taxonomy of death scars?

2. **RNG Boundaries**
   - Which actions should never fail?
   - Where does randomness enhance expression vs undermine agency?

3. **World Structure**
   - How many cosmological layers exist?
   - What defines "endgame" in an expression-first system?

4. **Asynchronous Interaction**
   - How do Princes meaningfully encounter one another without ladders or hypercompetitive PvP?
   - Echoes, challenges, shared world events?

5. **Lore Emergence**
   - What is discovered by play vs authored upfront?
   - How much ambiguity should remain unresolved?
   - Balance between authored and emergent lore?

6. **Elements**
   - Exact elemental dominance ordering?

7. **Alignment**
   - Is alignment a single axis (aligned ↔ misaligned) or multi-dimensional (aligned on element but misaligned on planet)?
   - How is drift calculated and displayed?
   - What determines the "alignment window" for each chart?

---

*Space Prince is a game about fate without determinism, randomness without chaos, and power without hierarchy.*
