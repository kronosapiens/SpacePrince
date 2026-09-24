# Space Prince — The Prince NFT

## Overview

In Space Prince, the NFT is not a cosmetic wrapper around a game character.
It is the **canonical object** through which identity, memory, and progression are expressed.

The Prince NFT functions simultaneously as:

1. **A save file** — a complete, auditable record of the Prince’s state
2. **An enchanted object** — forged through play, marked by effort and attention
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

- **Time: 5-minute buckets.**
288 slots per day.
Fine enough to honor the minute-level birth time recorded on most birth certificates.
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

The 5-minute time bucket is well within the ~2-hour Ascendant window.
The 0.1° location grid shifts the effective time by ~45 seconds (negligible for sign boundaries).
Both are far finer than the chart resolution, which is intentional: the coordinate triple is the identity, the chart is the nature.

### Identity space under this resolution

At 5-minute time buckets and 0.1° location, the mintable identity space is 288 × ~6,500 ≈ 1.87 million slots per day, or ~683 million per year of birth dates.
This is far larger than any realistic player population, by design — the coordinate triple is the identity, and identities should not collide except on shared birth moments.
The number of distinct *chart artifacts* per year is unchanged by this parameterization: 12–24 charts per day × 365 ≈ 4,400–8,800 per year.
The gap between identity space (~683 M/year) and chart space (~6,500/year) is the chart-twin landscape — most Princes will share their chart with someone, and that is intentional.

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
| 1 | Collect and quantize mint inputs (timestamp, latitude, longitude) | Quantized `(t, lat, lon)` | Low | Low | 5-minute time buckets, 0.1° location grid |
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
   - **Planet revelation.** Planets are progressively revealed per the **Macrobian ascent** (Moon → Mercury → Venus → Sun → Mars → Jupiter → Saturn) — the Moon from the start, each subsequent planet at a cumulative-encounter count of `2^i` for `i = 0..5`. See `spec/mechanics/MECHANICS.md §11.1`. Unrevealed planets render as ghosts at hairline weight — present as potential, not yet awakened.
   - **Houses add structure.**

3. **The Star-Field** — Every run inscribes one star (see below). The permanent, accumulating record of play.

4. **Temporary States** — Run-specific effects (glow, distortion) that recede when the run ends.

### The Star-Field

Every completed run inscribes one **star** into the space above the chart wheel.
The active run has no star until it ends.

When a run ends — whether by completing its seven maps or by full combustion before then (`MECHANICS.md §11`) — its remaining **Light** (`MECHANICS.md §12`) determines the star's radius and opacity.
Position is deterministic and pseudorandom, seeded by Prince identity and run index independently of score.
Stars use the same neutral bone color as the client's ornamental stars.

Run count gives the sky density; higher scores give it larger, brighter stars.
The visual emphasis favors exceptional runs over accumulating many mediocre ones.
Each star keeps its position and appearance as later runs are added.

There are **no scars and no entropy-darkening.**
The only thing a run leaves behind is the star shaped by the Light it carried out.

#### Placement

Stars occupy the upper **spandrel**, the space between the inset frame bounds and the curve above the wheel.
The corresponding lower space holds the achievement marks in horizontal courses clipped by the wheel, a full row of twelve with six more stepping in above on each side, at fixed slot positions (`ACHIEVEMENT_SLOTS` in `client/src/svg/prince-style.ts`).
Every slot draws: a gold ring with the achievement's bone glyph once earned, an empty mist ring until then, so the base keeps its shape and fills in with play.

The prototype divides the upper spandrel into **44 equal-area rectangles**, 22 on each side mirrored about the centre.
They are wide and shallow near the centre, narrow and tall toward the edges, with their lower inner corners touching the curve.
Fractional boundaries allow equal areas and curve contact; the stepped edges leave small gaps beside the curve.

Each star uses three pseudorandom draws: choose a rectangle uniformly, then choose its horizontal and vertical position uniformly within it.
Equal rectangle areas give uniform density over the covered region, with constant-time placement and no curve evaluation or rejection sampling per star.
Run index distinguishes equal scores; accidental overlap remains possible.
The prototype constrains star centres only, without clearance for their radii or collision avoidance.

#### Radius and brightness

For final Light `L`, the current mapping in `client/src/svg/prince-style.ts` and `client/src/components/RunStars.tsx` is:

```text
q           = L / (L + 256)
coreRadius  = 1
haloRadius  = max(0.75, sqrt(L / 256))
coreOpacity = 0.1 + 0.9 × q
haloOpacity = q²
```

Every star has a crisp bone core 2 SVG units across, with score controlling its opacity and the surrounding halo.
The halo's outer radius is in NFT artwork units: 256 Light gives radius 1, and 1,024 Light gives radius 2.
Above the minimum radius, the outer disc's area is proportional to score.
The squared halo response suppresses glows around ordinary runs while giving high scores more surrounding light.
Zero Light leaves a faint core with no halo.
Core opacity and halo strength approach 1 as score increases; halo radius currently has no upper cap.
Each star draws a glow circle using a shared radial gradient, then a fixed-size core circle above it.
The gradient fades from 0.5 opacity at its centre to 0.14 at half its radius and zero at the edge, multiplied by `haloOpacity`.
The group uses `coreOpacity`; the halo's fill opacity compensates for that group opacity so its final strength follows `q²` independently.
The solid core covers the underlying halo before group compositing, keeping the core's apparent opacity independent of halo strength.
Both use fixed bone RGB.

### Evolution Rules

The NFT only evolves on **meaningful state changes**:
- House unlocks
- Planetary expression unlocks
- A run's final Light (a new star)
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
- Recorded run-scores (the star-field)
- World flags

This ensures:
- Long-term persistence
- No broken metadata
- No reliance on offchain storage for canon

### Star-field geometry

The current artwork uses `viewBox="0 0 800 1000"` with a shared inset of 16 units.
The wheel is centred at `(400, 500)` with diameter 768, filling its container at `(16, 116)`.
The shared chart viewport fits its outer ring; it contributes no additional internal padding (`STYLE.md §4`).
The upper spandrel keeps 16 units of radial clearance from the wheel, using an arc of radius 400 with endpoints `(16, 388)` and `(784, 388)`:

```svg
<path d="M 16 16 H 784 V 388 A 400 400 0 0 0 16 388 Z" />
```

The lower spandrel mirrors this path with `translate(0 1000) scale(1 -1)`.
Spandrel and rectangle outlines appear only with the developer `g` overlay.

For the onchain renderer, star-field geometry will use **fixed-point integers with scale 10,000**, representing 0.0001 SVG units per integer step.
Precompute the 23 cumulative horizontal boundaries for one half and the shared rectangle area as source constants; mirror the other half without per-NFT geometry storage.
Cumulative boundaries give both position and width directly, avoiding a sum over preceding rectangles.

```text
edgeQ[i] = round(edge[i] × 10,000)
areaQ    = round(area × 10,000²)
widthQ   = edgeQ[i + 1] - edgeQ[i]
heightQ  = areaQ / widthQ  (unsigned integer division, rounded down)
```

Coordinates scale once and area scales twice, so the derived height uses the same fixed-point scale as the boundaries.
Quantization makes equal areas and curve contact approximate at this precision.
The client prototype still uses floating-point boundaries and division; the fixed-point conversion is planned for the onchain implementation.

---

## Social Meaning & Interpretation

Because the Prince is abstract and symbolic:
- Meaning is not prescribed
- Interpretation is social

Observers may notice:
- Depth vs simplicity
- The density, size, and brightness of the star-field
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
