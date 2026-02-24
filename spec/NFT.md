# Space Prince — The Prince NFT

## Overview

In Space Prince, the NFT is not a cosmetic wrapper around a game character.
It is the **canonical object** through which identity, memory, and progression are expressed.

The Prince NFT functions simultaneously as:

1. **A save file** — a complete, auditable record of the Prince’s state
2. **An enchanted object** — forged through play, marked by effort and failure
3. **A generative artifact** — a visual system that evolves deterministically over time

The NFT is not something you decorate.
It is something you **become responsible for**.

---

## Design Intent

The Prince NFT exists to solve a specific problem in both games and NFTs:

> How do you make a persistent digital object feel *earned*, *irreversible*, and *meaningful* over time — without turning it into a commodity or a flex?

The answer in Space Prince is:
- Identity is immutable
- Change is rule-bound
- History is visible
- Progress is interpretive, not accumulative

The Prince NFT is meant to feel less like a profile picture and more like:
- A talisman
- An astrolabe
- A living diagram
- A ritual object that records its use

---

## Ontological Status

The Prince NFT is **the Prince**.

There is no separate character save, avatar, or progression object.
All canonical state is reflected through the NFT.

If the NFT exists, the Prince exists.
If the NFT changes, the Prince has changed.

## Singularity

Each Prince corresponds to a unique position in spacetime.

Once a Prince is minted for a given latitude, longitude, and timestamp, that Prince is **globally unique and non-replicable**.

No alternative versions, re-rolls, or parallel instances can exist.

The Prince NFT is not a copy of an idea.
It is the canonical artifact associated with that position.

---

## Mint Resolution

Mint inputs are quantized to balance specificity (people should be able to mint "themselves") with meaningful scarcity (once your position is claimed, nearby positions shouldn't trivially reproduce it).

### Grid

- **Time: 15-minute buckets.**
96 slots per day.
Fine enough that a person knows their slot — most people know their birth time to the nearest 15 minutes or hour.
Coarse enough that adjacent slots almost always produce the same chart, providing a natural buffer against near-miss minting.

- **Location: 0.1° grid (~11 km at the equator).**
~6,500 land grid cells worldwide.
Fine enough to distinguish cities and neighborhoods.
Coarse enough that minor GPS differences don't matter.

### Why this resolution

The game uses whole-sign houses and sign-based aspects — no degree-level angular geometry.
A chart is fully determined by 8 sign values: 7 planet signs + the Ascendant sign.

Planet positions depend on date but not location.
Only the Ascendant depends on time-of-day and location.
The Ascendant sign changes roughly every 2 hours (varies by latitude and sign).

This means on a typical day, there are **12-24 distinct charts** — one per Ascendant window, with occasional variation when the Moon or an inner planet crosses a sign boundary mid-day.

The 15-minute time bucket is well within the ~2-hour Ascendant window.
The 0.1° location grid shifts the effective time by ~45 seconds (negligible for sign boundaries).
Both are far finer than the chart resolution, which is intentional: the coordinate triple is the identity, the chart is the nature.

### Chart twins

Multiple Princes can share the same chart.
This is astrologically authentic — people born on the same day in the same Ascendant window have the same natal chart.
Chart twins are siblings in nature, not duplicates.
Their coordinates (and therefore their identities) remain distinct.

Over a realistic player population, most Princes will have unique charts.
12-24 charts per day × 365 days × decades of birth dates produces hundreds of thousands of distinct charts.
Chart twins become more common at scale, but this is a social feature, not a defect.

---

## Chart Creation Pipeline (Complexity Reference)

This section documents chart construction as a practical engineering pipeline.
It is intended as a planning reference for offchain implementation now and onchain migration later.

### Scope for Space Prince

The game currently uses a sign-level model:

- 7 planetary signs
- Ascendant sign
- Whole-sign houses
- Sign-based interactions

No orb calculations or degree-based aspect geometry are required for current gameplay semantics.

### Step-by-step pipeline

| Step | What happens | Output | Compute complexity | Data complexity | Notes |
|---|---|---|---|---|---|
| 1 | Collect and quantize mint inputs (timestamp, latitude, longitude) | Quantized `(t, lat, lon)` | Low | Low | 15-minute time buckets, 0.1° location grid |
| 2 | Convert time scales | UTC-normalized astronomical time base | Low | Low | UTC -> Julian day / related time terms |
| 3 | Compute planetary longitudes (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn) | 7 longitudes | High | High | Dominant cost center (ephemeris/model layer) |
| 4 | Compute local sky frame for Ascendant | Ascendant longitude/sign | Medium | Low | Sidereal time + latitude/longitude + obliquity |
| 5 | Discretize longitudes to signs | 7 planet signs + Ascendant sign | Low | Low | `floor(longitude / 30)` |
| 6 | Derive chart metadata | element, modality, dignity, house | Low | Low | table lookups + whole-sign house mapping |
| 7 | Derive gameplay structural relations | sign-based intra/cross-chart relations | Low | Low | sign-distance mapping only |

### Practical implication

Most complexity is concentrated in planetary astronomy (Step 3), with Ascendant calculation as the secondary cost (Step 4).
Everything after sign discretization is table lookup and modular arithmetic.

This is why canonical onchain state can remain compact while still being astrologically grounded.

---

## Visual Philosophy

The Prince is not depicted as a human figure.

Instead, the visual language draws from:
- Star charts
- Sigils
- Ritual diagrams
- Instruments
- Architectural cosmology

The artifact should feel:
- Abstract but legible
- Ancient but computational
- Personal without being narcissistic

Two Princes should be immediately distinguishable — not by rarity traits, but by **lived history**.

---

## Visual Grammar

The visual system mirrors the mechanical structure of the game.

### Layers

1. **Immutable Core** — Derived from mint inputs (lat, long, timestamp). Determines base geometry, symmetry, and color. Never changes.

2. **Evolutionary Layers** — Evolve with progression:
   - Houses add structure
   - Planets add motion
   - Death adds scars

3. **Temporary States** — Run-specific effects (glow, distortion) that recede when the run ends.

### Death as Entropy

Each death darkens the background slightly. This degradation is monotonic and irreversible — the Prince remains intact while the surrounding context erodes. A darkened background signifies duration, not weakness.

### Evolution Rules

The NFT only evolves on **meaningful state changes**:
- House unlocks
- Planetary expression unlocks
- Death scars
- Major world thresholds

It does not evolve on individual actions, minor choices, or time passage alone.

---

## Determinism & Onchain Rendering

The Prince NFT must be:
- Fully deterministic from onchain state
- Regenerable from scratch
- Auditable by anyone

The rendered image is a **pure function** of:
- Birth data
- Unlocked systems
- Recorded scars
- World flags

This ensures:
- Long-term persistence
- No broken metadata
- No reliance on offchain storage for canon

---

## Social Meaning & Interpretation

Because the Prince is abstract and symbolic:
- Meaning is not prescribed
- Interpretation is social

Observers may notice:
- Depth vs simplicity
- Scar patterns
- Structural completeness
- Planetary dominance

This enables:
- Lore emergence
- Reputation without rankings
- Cultural reading without metrics

Princes become *objects of conversation*, not comparison.

---

## Transfer, Ownership, and Consequence

The Prince NFT is **not designed for frictionless trading**.

If transfer is allowed at all, it should be:
- Ritualized
- Explicitly acknowledged in-world
- Potentially destructive to continuity

Possible models:
- Abdication (original player relinquishes claim)
- Succession (new steward inherits a changed Prince)
- Non-transferability (soulbound)

This decision is intentionally unresolved.

---

## Why This Matters

The Prince NFT is designed to demonstrate a different use of NFTs:

Not ownership of *things*, but stewardship of *process*.

It is:
- Proof of attention
- Evidence of persistence
- A record of disciplined play

A Prince that exists could not exist otherwise.

---

*The Prince is not a picture of a character.
It is the character, slowly written into form.*
