# Cairo Chart Engine Workspace

This workspace contains the Cairo-native chart pipeline split into two crates:

- `astronomy_engine_v1`: deterministic astronomy primitives and approximate 7-body/ascendant longitudes
- `star_chart`: quantization + astrology derivation layer that emits canonical sign-level chart state

## Numeric policy (v1)

- Runtime fixed-point: `i64` scaled by `1e9`
- Intermediate arithmetic: `i128`
- Rounding: half-away-from-zero

## Input policy (v1)

- `time_minute_since_1900` (minute resolution)
- `lat_bin` / `lon_bin` in `0.1°` bins
- Onchain quantization to 15-minute buckets (`floor(minute/15)`)

## Testing

Run all Cairo tests:

```bash
scarb test
```

Current test coverage includes:

- fixed-point arithmetic and angle normalization
- time conversion (`1900` epoch -> `J2000` days)
- planetary longitude and ascendant normalization
- sign/house/dignity/aspect/sect derivations
- end-to-end canonical chart generation with deterministic golden vectors
