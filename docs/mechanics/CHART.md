# Space Prince — Chart Construction Spec (Cairo-First)

This document defines the chart-construction direction for the onchain game.

Primary approach: port the required subset of `astronomy-engine` into Cairo/Starknet, then layer astrology/game derivations above it.

The client prototype already computes every chart from the JavaScript `astronomy-engine` ([MECHANICS.md §3](MECHANICS.md#3-chart-generation)); this document covers the onchain version of the same computation and the identity it is keyed on.

---

## 1. Scope and Goals

### Goals

- Deterministic, reproducible chart generation from quantized mint inputs.
- Onchain-computable astronomy core with explicit versioning.
- Sign-level outputs for gameplay and NFTs.

### In Scope (v1)

- Seven bodies: `Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn`.
- Ascendant sign.
- Whole-sign houses.
- Derived traits from sign placement:
  - element
  - modality
  - dignity
  - sect status

### Explicitly Out of Scope (v1)

- Degree-level orb logic for aspects.
- Geometry beyond sign placement for game mechanics.
- Time-lords, lots, and medieval sub-systems.

---

## 2. Canonical Chart State

For each minted chart, canonical state is:

- `planet_sign[7]` (0..11)
- `asc_sign` (0..11)
- derived lookup results (house / dignity / sect / sign-aspect class)
- `core_version`
- `data_version`

Notes:

- We do not require persisting exact longitudes for gameplay.
- Longitudes may be computed internally to derive sign placements.

The storage packing of this state on the Prince is in [STATE.md](STATE.md).

---

## 3. Architecture

### 3.1 `AstronomyEngine` (Cairo)

Port of [astronomy-engine](https://github.com/cosinekitty/astronomy), no astrology semantics.

Responsibilities:

- Time transforms needed by astronomy model
- Ecliptic longitudes for 7 planets
- Ascendant computation

This layer lives in the separate [`astronomy-engine`](https://github.com/kronosapiens/astronomy-engine) repository, which this repo consumes as a sibling path dependency (`astronomy_engine_v1` in `cairo/crates/star_chart/Scarb.toml`).

### 3.2 `StarChart` (Cairo)

Astrological derivation layer, in `cairo/crates/star_chart`.

Responsibilities:

- input quantization (`time`, `lat`, `lon`)
- longitude -> sign mapping
- whole-sign house mapping
- dignity/sect derivation tables
- sign-distance aspect class derivation

Separation keeps astronomy stable while allowing gameplay derivation updates in higher layers.

---

## 4. Port Strategy (from `astronomy-engine`)

Reference implementation for correctness is `astronomy-engine`.

### Keep

- Only code paths required to compute:
  - 7 planetary longitudes
  - ascendant
- Dependent time/precession/nutation transforms actually used by those paths.

### Drop

- Eclipses, rise/set search, visual magnitude, constellations/stars.
- Unused bodies/features for current game/NFT output.

### Important Constraint

- No ad hoc rules (for example Mercury/Venus distance clamps).
- Validity should come from an accurate port of the existing engine.

---

## 5. Numeric/Data Plan

### Numeric

- Cairo fixed-point arithmetic for runtime math.
- Global precision + rounding policy is versioned and frozen per core version.

### Data

- Start from the same model/data basis as `astronomy-engine`.
- Convert to Cairo-friendly constants/tables during build.
- Version and hash datasets used by deployed contracts.

Design target:

- Keep deployed data footprint operationally manageable (sub-MB preferred for v1).

---

## 6. Validation Requirements

### 6.1 Differential Accuracy

Against JS oracle (`astronomy-engine`) across supported range:

- Track angular error by planet.
- Track sign parity by planet.

### 6.2 Sign Stability Gate

- Zero sign mismatches in validation corpus for supported range.
- Extra dense sampling near sign ingress windows.

### 6.3 Determinism Gate

- Same input + same versions -> identical output.
- Golden vector tests for Cairo fixed-point behavior.

### 6.4 Runtime Gate

- Mint-time compute cost within acceptable Starknet budget.

---

## 7. Supported Range and Versioning

Initial supported range target:

- `1900-01-01` through `2100-12-31` UTC

Policy:

- Inputs outside supported range are accepted, with warning.
- Extending range requires a new `data_version` plus validation report.
- Old versions remain reproducible.

---

## 8. Delivery Phases

1. JS oracle harness
- Lock reference outputs from `astronomy-engine` for required inputs.
- Produce reusable validation corpus.

2. Cairo math primitives
- Rely on [Alexandria](https://github.com/keep-starknet-strange/alexandria) library for core math
- Add deterministic rounding as needed.

3. Cairo longitude pipeline
- Implement 7-planet longitude path.
- Verify against oracle.

4. Cairo ascendant pipeline
- Implement ascendant/sign derivation path.
- Verify against oracle.

5. Astrology derivation layer
- Whole-sign houses + dignity + sect derivations.
- Produce canonical chart state payload.

6. Hardening
- Performance profiling.
- Version locking.
- Deployment-ready data packaging.

**Where this stands.**
The `star_chart` crate implements input quantization, sign derivation, whole-sign houses, dignity, sect, and sign-aspect classes, with end-to-end tests over the astronomy dependency (`quantization.cairo`, `chart.cairo`, `derive.cairo`, `signs.cairo`, `e2e.cairo`).
The astronomy phases live in the astronomy-engine repository.
The validation gates of §6 and the hardening phase are not recorded in this repo; the game contract itself (runs, encounters, the SVG renderer) does not exist yet.

---

## 9. Empirical Distribution

Charts mint from real ephemeris, not a uniform 12-sign distribution.
Clustering — multiple planets sharing a sign — is the rarity surface for both gameplay and the NFT artifact, and real charts cluster much harder than a naive model would suggest.
The structural reason is that Mercury is locked within ~28° of the Sun and Venus within ~48°, so Sun–Mercury–Venus huddles are a constant feature of real charts.

Largest cluster (most planets sharing any one sign), measured across 250k charts sampled uniformly over 1850–2050:

| Largest cluster | Real charts |
|---|---|
| 1 (all signs different) | 2.47% |
| 2 | 55.18% |
| 3 | 34.15% |
| 4 | 7.21% |
| 5 | 0.925% |
| 6 | 0.049% |
| 7 (all in one sign) | 0.0016% |

Cumulative ("at least k planets sharing a sign"):

| Threshold | Real |
|---|---|
| ≥ 3 | 42.34% |
| ≥ 4 | 8.19% |
| ≥ 5 | 0.98% |
| ≥ 6 | 0.051% |
| ≥ 7 | 0.0016% |

Implications for rarity tiering:

- Triple-stelliums are common (~42%), not rare — most Princes will have one.
- Quadruple-stelliums (~8%, ~1 in 12) are the natural "rare" tier.
- Quintuple+ (≤1%) is genuine scarcity.
- "All seven different signs" is itself rare (~2.5%) — a "scattered" Prince is its own distinction, not the baseline.
- Clusters that don't include Sun/Mercury/Venus are much rarer than the headline numbers suggest, and may deserve their own recognition.

---

## 10. Relationship to Game Mechanics

This document only covers chart construction.

Combat/encounter resolution remains defined in [MECHANICS.md](MECHANICS.md).

Key interface contract between systems:

- Chart construction outputs deterministic sign-level state.
- Mechanics consumes that state without requiring degree-level geometry.

---

## 11. Identity grid and chart twins

A Prince's identity is its quantized birth position — latitude, longitude, and instant — and one Prince exists per quantized position ([STATE.md](STATE.md), `Position`).
Mint inputs are quantized to balance specificity (people should be able to mint themselves) with meaningful scarcity (once a position is claimed, nearby positions should not trivially reproduce it).

### Why the grid can be coarse

The game uses whole-sign houses and sign-based aspects, with no degree-level angular geometry.
A chart is fully determined by eight sign values: seven planet signs and the Ascendant sign.
Planet positions depend on the date but not the place; only the Ascendant depends on time of day and place, and it changes sign roughly every two hours (varying by latitude and sign).
On a typical day there are therefore 12–24 distinct charts, with occasional variation when the Moon or an inner planet crosses a sign boundary mid-day.
Any plausible grid is far finer than the chart, which is intentional: the coordinate triple is the identity, the chart is the nature.

### Chart twins

Multiple Princes can share the same chart.
This is astrologically authentic — people born on the same day in the same Ascendant window have the same natal chart.
Chart twins are siblings in nature, not duplicates; their coordinates, and therefore their identities, remain distinct.
The gap between the identity space and the chart space is the chart-twin landscape, and at scale it is a social feature, not a defect.

### The grid itself is unresolved

Three values are in play and do not agree ([issue #30](https://github.com/kronosapiens/SpacePrince/issues/30)):

- The artifact prose assumed 5-minute time buckets (288 per day, within the minute-level time on most birth certificates and well inside the ~2-hour Ascendant window) and a 0.1° location grid (~11 km at the equator, which shifts the effective time by ~45 seconds); under those values the identity space is about 1.87 million slots per day.
- The `Position` packing in [STATE.md](STATE.md) assumes 5-minute buckets and a 0.01° grid.
- The Cairo quantizer (`cairo/crates/star_chart/src/quantization.cairo`) floors minutes-since-1900 to 15-minute slots, and its latitude and longitude bins are signed 16-bit integers whose unit is defined in the astronomy dependency.
- The prototype's mint form steps its time input in 5-minute increments (`client/src/screens/StartScreen.tsx`).

Pick one of each, then align the packing, the quantizer, and the mint pickers together; the choice changes the identity-space arithmetic but not the chart space.
