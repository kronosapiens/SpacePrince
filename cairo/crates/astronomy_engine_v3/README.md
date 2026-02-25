# astronomy_engine_v3 (Cairo)

`astronomy_engine_v3` is a Cairo-native astronomy runtime for sign-level chart computation.

This crate is a higher-fidelity adaptation of the JavaScript [`astronomy-engine`](https://github.com/cosinekitty/astronomy) planetary path than `v2`, while remaining constrained to Cairo fixed-point arithmetic and chart-oriented outputs.

## Purpose

- Provide deterministic onchain longitude/sign outputs for the seven classical chart bodies.
- Improve upstream-model fidelity for Mercury/Venus/Mars/Jupiter/Saturn relative to `v2`.
- Keep all computation Cairo-native with no runtime table ingress dependency.

## Upstream Reference and Attribution

Primary reference implementation:

- `astronomy-engine` JavaScript package (`^2.1.19`)
- Author: Donald Cross
- Repo: <https://github.com/cosinekitty/astronomy>
- License: MIT

This crate should be cited as:

1. Cairo adaptation in this repository (`cairo/crates/astronomy_engine_v3`).
2. Upstream reference implementation: Donald Cross, `astronomy-engine`.

If publishing benchmark or parity numbers, include both references.

## Adaptation Process

This port explores a deeper upstream-style chain than `v2` by evaluating truncated VSOP terms directly at runtime and applying frame conversions before deriving ecliptic longitudes.

### Engineering Decisions

#### Numeric model

- Runtime scalar: `i64`, fixed-point `1e9`.
- Intermediates: `i128` for multiply/accumulate and matrix/trig combinations.
- Integer-only trig and angle math (lookup/interpolation based) consistent with existing Cairo runtime utilities.

Why:

- Cairo cost profile favors bounded integer math over floating-point emulation.
- `i64 + i128` remains the practical precision/performance tradeoff for onchain sign-level computation.

#### Time contract

- Input time: `minute_since_1900` (`1900-01-01T00:00:00Z` epoch).
- Current validation target window: `1900-01-01` to `2100-01-01`.

#### Planet model strategy

- Sun/Moon remain compact parametric approximations inherited from prior versions.
- Mercury/Venus/Mars/Jupiter/Saturn use generated VSOP term data (`vsop_gen.cairo`) with runtime series evaluation.
- Two-iteration light-time correction backdates both target and Earth in the VSOP branch.

#### Frame/transform strategy

For Mercury..Saturn, runtime path applies:

1. VSOP spherical evaluation (`L/B/R`) -> Cartesian ecliptic.
2. VSOP rotation to EQJ.
3. Precession (J2000 -> of-date).
4. Nutation (IAU2000B short series).
5. EQD -> true ecliptic-of-date longitude.

This closes a major semantic gap that dominated mismatch rates in simpler VSOP-only attempts.

### Ported / Preserved

1. Deterministic minute-based runtime interface used by existing chart crates.
2. Seven-body longitude API and shared ascendant approximation module.
3. Oracle-driven parity workflow against upstream `astronomy-engine` during development.

### Adapted (Equivalent Outcome, Different Mechanics)

1. Full upstream floating-point/vector stack is represented as fixed-point integer math.
2. VSOP term sets are truncated to practical per-order limits for Cairo cost control.
3. Light-time solver is fixed-iteration (2) rather than convergence-loop based.

### Dropped / Deferred

1. Full upstream feature surface (all bodies and all coordinate APIs).
2. High-precision Sun/Moon replacement with the same transform chain used for Mercury..Saturn.
3. Fully generalized runtime generator pipeline checked into this crate (the generated artifact is committed).

## Implementation Structure

- `planets.cairo`: public longitude API and planet-specific routing.
- `vsop_gen.cairo`: generated VSOP term data/evaluators (Earth + Mercury..Saturn).
- `frames.cairo`: VSOP->EQJ rotation, precession/nutation, EQJ->ecliptic-of-date conversion.
- `ascendant.cairo`: inherited runtime ascendant approximation.
- `fixed.cairo`, `time.cairo`, `trig.cairo`, `types.cairo`: shared fixed-point/runtime primitives.

## Known Limits and Practical Notes

- Planet fidelity work in `v3` is concentrated on Mercury..Saturn.
- Sun/Moon currently remain approximation-based and are not yet upgraded to the same VSOP+frame chain.
- Ascendant path in `v3` is currently identical to `v1`/`v2`, so accuracy is unchanged (~99.99987%).
- `vsop_gen.cairo` is generated data and should not be edited manually.

## v1 vs v2 vs v3 Comparison

All numbers below are from current workspace builds/tests.

### Runtime Gas (single-sample 7-body benchmark tests)

| Metric | v1 (`astronomy_engine_v1`) | v2 (`astronomy_engine_v2`) | v3 (`astronomy_engine_v3`) |
| --- | --- | --- | --- |
| Benchmark test | `benchmark_lookup_all_planet_signs` | `benchmark_parametric_all_planets_cheby` | `benchmark_parametric_all_planets_cheby` |
| Gas usage est. | `44,183,350` | `2,458,170` | `152,429,220` |

Estimated STRK fee range for this benchmark (L2 gas component only, `3-10 gFri`):

| Metric | v1 | v2 | v3 |
| --- | --- | --- | --- |
| STRK at `3 gFri` | `0.13255005` | `0.00737451` | `0.45728766` |
| STRK at `10 gFri` | `0.44183350` | `0.02458170` | `1.52429220` |

Interpretation:

- `v2` optimizes gas aggressively via runtime Chebyshev lookup/eval.
- `v3` is much heavier due to deeper runtime astronomy math.

### Size Footprint

| Metric | v1 | v2 | v3 |
| --- | --- | --- | --- |
| Core generated data source | `oracle_signs.cairo` = `808,011` bytes | `cheby_data.cairo` = `2,251,214` bytes | `vsop_gen.cairo` = `31,376` bytes |
| Sierra artifact | `59,589,267` bytes | `72,129,199` bytes | `15,898,293` bytes |

Interpretation:

- `v3` shifts complexity from large static data blobs into runtime computation.
- This dramatically shrinks data/code artifact size versus `v1`/`v2`, but increases execution cost.

### Planet-Sign Parity Snapshot (Mercury..Saturn)

Development sweeps against the upstream oracle in the `1900-2100` window (hourly, 15-minute quantized) reached `0` mismatches for Mercury/Venus/Mars/Jupiter/Saturn with the current VSOP term depth.

## Validation Workflow

From repo root:

```bash
# Run v3 tests.
scarb test -p astronomy_engine_v3 --manifest-path cairo/Scarb.toml

# Build artifact for size inspection.
scarb build -p astronomy_engine_v3 --manifest-path cairo/Scarb.toml
```

## Scope Boundary

`astronomy_engine_v3` is an experimental higher-fidelity Cairo port path focused on planetary sign accuracy mechanics for Mercury..Saturn. It is not yet a complete full-surface replacement for upstream `astronomy-engine`.
