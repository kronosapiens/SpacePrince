# Space Prince — The Prince NFT

The artifact reference: what the Prince NFT is, what it shows, and how it is drawn.
Identity and chart construction are in [CHART.md](../mechanics/CHART.md); what the token stores is in [STATE.md](../mechanics/STATE.md); the visual vocabulary it shares with the client is in [STYLE.md](STYLE.md).
The client renders the same artifact today as **Inspect Prince** ([SCREENS.md §7](SCREENS.md#7-chart-study-screen)) from `client/src/components/PrinceArtwork.tsx`; the onchain renderer does not exist yet.

## Overview

In Space Prince, the NFT is not a cosmetic wrapper around a game character.
It is the **canonical object** through which identity, memory, and progression are expressed.

The Prince NFT functions at once as:

1. **A save file** — a complete, auditable record of the Prince's state
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

How finely that position is quantized — and therefore how large the identity space is, and how chart twins arise — is covered in [CHART.md §11](../mechanics/CHART.md#11-identity-grid-and-chart-twins): 5-minute buckets and a 0.01° grid, one Prince per position.

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

1. **Immutable Core** — derived from the chart: the wheel, the planets in their signs, the aspect web.
   Never changes.

2. **Planet revelation** — planets are progressively revealed per the **Macrobian ascent** (Moon → Mercury → Venus → Sun → Mars → Jupiter → Saturn): the Moon from the start, each subsequent planet at a cumulative-encounter count of `2^i` for `i = 0..5` ([MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)).
   Unrevealed planets render as ghosts at hairline weight — present as potential, not yet awakened.

3. **The Star-Field** — every run inscribes one star (see below).
   The permanent, accumulating record of play.

4. **Achievement marks** — fixed slots below the wheel that fill as marks are earned (see Placement).
   Earning is not implemented yet ([MECHANICS.md §11.2](../mechanics/MECHANICS.md#112-achievements)).

### The Star-Field

Every completed run inscribes one **star** into the space above the chart wheel.
The active run has no star until it ends.

When a run ends — whether by completing its seven maps or by full combustion before then ([MECHANICS.md §11](../mechanics/MECHANICS.md#11-encounter--map--run-flow)) — its remaining **Light** ([MECHANICS.md §12](../mechanics/MECHANICS.md#12-scoring-light)) determines the star's radius and opacity.
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

The NFT evolves only on **meaningful state changes**:

- A planet revealed by the unlock schedule
- A run's final Light (a new star)
- An achievement mark, once earning exists

It does not evolve on individual actions, minor choices, or time passage alone.
Earlier drafts also listed house unlocks, planetary-expression unlocks, and world thresholds; none of those systems exists, and the artifact makes no claim about them.

---

## Determinism & Onchain Rendering

The Prince NFT must be:

- Fully deterministic from onchain state
- Regenerable from scratch
- Auditable by anyone

The rendered image is a **pure function** of:

- Birth data (through the chart)
- The lifetime encounter count (which planets are revealed)
- Recorded run-scores (the star-field)
- The achievement bitmap

This ensures:

- Long-term persistence
- No broken metadata
- No reliance on offchain storage for canon

### Star-field geometry

The current artwork uses `viewBox="0 0 800 1000"` with a shared inset of 16 units.
The wheel is centred at `(400, 500)` with diameter 768, filling its container at `(16, 116)`.
The shared chart viewport fits its outer ring; it contributes no additional internal padding ([STYLE.md §4](STYLE.md#4-proportion-scale)).
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

The Prince is a standard ERC-721 and transfers like one.
Its value as an artwork accrues through play: each run leaves a star, and the achievement marks fill in as earning arrives, so a Prince that has been played is a different object from one that has not.
Transfer carries no in-world ceremony; abdication, succession, and a visible mark of changed hands were considered and set aside, and could return as rites if a reason for them appears.
The economics of minting and runs are in [intent.md](../intent.md), Economics, with the remaining work in [#31](https://github.com/kronosapiens/SpacePrince/issues/31).

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
