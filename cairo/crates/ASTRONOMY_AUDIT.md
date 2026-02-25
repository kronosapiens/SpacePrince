# Astronomy Engine Audit Report

## Summary

No critical correctness bugs found across v1, v2, v3.
The implementations are sound, the READMEs accurately reflect the code, and the validation pipeline is well-structured.

## v1 — Table-Driven Sign Lookup

**Correct.**
The runtime path goes through `oracle_signs.cairo::planet_sign_from_minute` → `lookup_sign`, which does a linear scan of pre-generated ingress tables.
The ascendant is computed at runtime via the sidereal/trig path in `ascendant.cairo`.

**Minor findings:**

1. **`lookup_sign` is O(n) linear scan** — binary search would be faster, but for the table sizes (~2400 entries for Sun, Moon segmented into 5 chunks) and Cairo's gas model, this is acceptable.
The 44M gas benchmark confirms it's within budget.

2. **`planets.cairo` is dead code in v1** — the README correctly calls it "approximation code retained for experimentation/reference."
However, the Saturn path in this dead code is missing the -1° correction present in the JS model (`cairo-model.js:251` applies `- 1_000_000_000` but Cairo v1 `planets.cairo:287` doesn't).
Not a runtime issue since the oracle tables are the actual path.

## v2 — Chebyshev Runtime Evaluation

**Correct.**
The Clenshaw recurrence in Cairo (`clenshaw_cheby_deg_scaled`) matches the JS reference (`clenshaw.js:evalChebyshev`).
The key differences are properly handled:

- Cairo uses `u_scaled` in [-U_SCALE, U_SCALE] vs JS's u in [-1, 1] — the `2*u*b1/U_SCALE` factor is correct.
- The `a0 + u*b1/U_SCALE - b2` final step matches the standard Clenshaw formula.
- The modular wrap `y % (360 * CHEBY_DEG_SCALE)` is correct for periodic longitude.

**Coefficient pipeline verified:**

- JS generator (`generate-cheby-v2-cairo.js`) fits Chebyshev coefficients per block using `fitChebyshev`, quantizes by `coeffQuantum=4`, stores as `i32`.
- Cairo accessor multiplies back by 4 and returns `i64`.
- The `MOON_LONGITUDE_BIAS_1E9 = +3000` (+0.000003°) documented bias is present and matches README.

**Note on `eval_series_deg_scaled`:**
The domain normalization `u = 2*local_minute/block_minutes - 1` correctly maps [0, block_minutes] to [-1, 1], matching the JS normalization in `clenshaw.js:normalizeTimeToChebyshevDomain`.

## v3 — VSOP + Frame Conversions

**Correct.**
The most complex crate, and the implementation properly chains:

1. VSOP spherical → Cartesian ecliptic (`helio_xyz_1e9`)
2. VSOP ecliptic → EQJ rotation (`vsop_ecliptic_to_eqj_1e9`)
3. Precession J2000 → of-date (`precession_from2000_1e9`)
4. Nutation IAU2000B (`nutation_from2000_1e9` via `iau2000b_e_tilt`)
5. EQD → ecliptic-of-date longitude (`eqj_to_ecliptic_of_date_longitude_1e9`)

**Specific verifications:**

- **VSOP data is in degrees** (pre-converted from radians): `EARTH_L_0[0] = (100466456672, 0, 0)` → ~100.466° matches the known VSOP87 Earth L₀ constant term (1.75347 rad ≈ 100.466°).
- **VSOP evaluation**: `angle = b + c * t_millennia / 1e9`, then `A * cos(angle) / 1e9`, summed per order and multiplied by `t^order`.
This is the standard VSOP series form Σ(Σ Aᵢ cos(Bᵢ + Cᵢt)) * tⁿ.
- **`if false { ... }` pattern in vsop_gen.cairo**: Known Cairo idiom for type inference — forcing the compiler to unify the span type across branches.
Not a bug.
- **IAU2000B nutation**: The 5-term truncated series (ω, 2F-2D+2ω, 2F+2ω, 2ω, l') with dp/de coefficients matches the standard IAU2000B short model.
- **Precession polynomial** (`psia`, `omegaa`, `chia`): The 5th-degree polynomials match the IAU 2006 precession model coefficients (Capitaine et al. 2003), converted from arcseconds to degrees×1e9.

**Design note — light-time iteration backdates both bodies:**
The README documents this explicitly.
The loop shifts both planet and Earth by the light-travel time.
Upstream `astronomy-engine` only backdates the target body.
For sign-level accuracy over the 1900–2100 window, this approximation is validated by the 0-mismatch sweep results.
Earth moves ~1°/day and light-time for outer planets is at most ~1.1 hours (Saturn), so the Earth position error is < 0.05° — negligible for 30° sign boundaries.

## Shared Modules (across all 3 crates)

- **`fixed.cairo`**: `div_round_half_away_from_zero` is correct — handles all sign combinations and the half-away-from-zero tie-breaking rule.
- **`time.cairo`**: `J2000_MINUTE_SINCE_1900 = 52_595_280` correctly accounts for the exact number of minutes from 1900-01-01T00:00:00Z to 2000-01-01T12:00:00Z.
- **`trig.cairo`**: sin uses 0.05° lookup table (7201 entries) with linear interpolation.
atan2 correctly handles all four quadrants.
The `atan_unit_deg_1e9` clamps at idx=10000 (z=1.0).
- **`ascendant.cairo`**: Identical across all 3 crates.

**Structural concern — code duplication:**
`fixed.cairo`, `time.cairo`, `trig.cairo`, `types.cairo`, `ascendant.cairo`, `trig_table.cairo`, and `atan_table.cairo` are copy-pasted across all three crates.
A bug fix in any shared module must be applied in three places.
Extracting these into a shared `astronomy_common` crate would eliminate this maintenance risk.

**Ascendant division-by-zero at the poles:**
In `ascendant.cairo`, the line `tan_lat = sin_lat * 1e9 / cos_lat` will panic if `lat_bin = ±900` (exactly ±90°) since `cos(90°) = 0`.
The ascendant is geometrically undefined at the poles (the ecliptic lies on the horizon), so a panic is arguably correct — but it is undocumented and produces an unhelpful error.
This affects all three crates identically.

## README Accuracy

All three READMEs accurately reflect:

- The numeric model (i64 + i128, 1e9 scale)
- The planet strategy for each version
- The gas estimates (benchmark tests exist with matching names)
- The accuracy claims (0 planet mismatches, ~2-5 ascendant mismatches at cusp edges)
- The regeneration/validation workflows

## Findings Table

| Finding | Severity | Location |
|---------|----------|----------|
| Ascendant div-by-zero at poles (lat_bin = ±900) | Medium | ascendant.cairo (all crates) |
| Shared module duplication across crates | Medium (maintenance) | fixed/time/trig/types/ascendant/tables |
| Dead elliptic/coplanar code in v3 planets.cairo | Low (cleanup) | v3/planets.cairo — **resolved** |
| Orphan cheby_data.cairo stub in v3 | Low (cleanup) | v3/src/cheby_data.cairo — **resolved** |
| v1 planets.cairo Saturn missing -1° vs JS model | None (dead code) | v1/planets.cairo:287 |
| Light-time backdates Earth in v3 | None (documented) | v3/planets.cairo |
| Linear scan in lookup_sign | None (acceptable) | v1/oracle_signs.cairo |
