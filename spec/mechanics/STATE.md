# State Model

The canonical reference for every data structure in Space Prince — the chart and all game state.
This document defines the *shapes*; the prose specs define the *rules*.

This is the single source of truth for data structures.
When `MECHANICS.md`, `CHART.md`, `MAP.md`, or `NFT.md` need to name a field, they reference it here rather than redefining it.
Two realizations track this doc and must stay consistent with it: the Cairo contract storage (the eventual home) and the TypeScript prototype (`client/src/game/types.ts`).

Because the target is onchain, structures are specified explicitly — field widths where size is load-bearing, and a clear line between what is stored, derived, and evented.

## Structures

```cairo
Prince {
  position:      Position,       -- birth lat/lon/dob; the uniqueness key (one Prince per quantized position)
  chart:         Chart,          -- memoized at mint: f(position) via compute_chart, stored to avoid re-running the ephemeris
  numEncounters: u8,             -- cumulative lifetime encounters (saturating; only needs to reach 32); gates planet unlock (MECHANICS §11.1)
  achievements:  u64,            -- bitmap of unlocked achievements (reserved; §11.2 deferred)
  runs:          Array<Run>,     -- every run this Prince has played; the star-field derives from runs[].distance
  -- ERC-721 standard fields (token id, ownerOf, approvals) come from the token base and are not re-listed here.
}

Position {                       -- packs into one felt: 16 + 16 + 32 = 64 bits
  lat: u16,                      -- (latitude  + 90)  * 100  -> 0..18000   (0.01° resolution)
  lon: u16,                      -- (longitude + 180) * 100  -> 0..36000   (0.01° resolution)
  dob: u32,                      -- birth instant in 5-minute buckets from a fixed epoch (~40k-year range)
}

Chart {
  placements: u32,               -- 7 planets × 4 bits (sign, 1 of 12) + 4 bits ascendant sign = 32 bits
}

Run {
  seed:          felt252,        -- one true-RNG draw at run start; seeds all previewable map structure + gives between-run variety
  distance:      u64,            -- cumulative Distance; the run's permanent record (one star). Stays in storage — the onchain SVG reads it
  state:         u64,            -- per-planet run state: 7 × (u8 affliction + 1 combust bit) = 63 bits
  map:           Map,            -- the current map only; past maps are emitted as events, not stored
  mapsCompleted: u3,             -- maps finished this run, 0..7; the run ends at 7 (completion, MECHANICS §11)
  encounter:     Option<Encounter>,  -- the active encounter; None while routing on the map
}

Map {
  layout:   u5,                  -- 1 of 32 layouts (the 5 variable middle layers); derivable from f(seed, mapsCompleted), stored as a cache
  position: u4,                  -- current node, 0..11 (≤12 nodes); genuine mutable state — where the player stands
}

Encounter = Opponent | Narrative -- tagged union

Opponent {
  placements: u32,               -- the adversary's chart; drawn by true RNG on arrival (same packing as Chart)
  state:      u64,               -- adversary per-planet state (same shape as Run.state)
  turn:       u2,                -- turn counter, 0..2 (every encounter is exactly 3 turns, regardless of unlock)
  precommit:  u4,                -- the opponent's locked-in verb this turn: planet (u3) + action (u1); shown before the player chooses
}

Narrative {
  house:    u4,                  -- 1 of 12 houses
  planet:   u3,                  -- 1 of 7 planets (the house's joy / ruler)
  storyIdx: u3,                  -- which scenario (2 per house today; headroom to 8). The tree-walk is client-only; the contract validates the final outcome
}
```

## Randomness

A single RNG primitive supplies true randomness on demand (VRF-style).
It is spent deliberately, in only two kinds of place:

- **Once per run** — `Run.seed`, drawn at run start.
- **At encounter resolution** — the adversary's chart, combat crits (`luck × 0.05`), and the opponent's precommitted action each turn.

Everything else is **pseudorandom**: a deterministic function of committed state that the client computes to render and the contract re-derives to bind, storing nothing.
Map layout and node types are `f(Run.seed, position)`.
The client shows the whole current map's node *types*, so routing is informed (Slay-the-Spire-style); only the *specifics* behind a node — the exact opponent, the crits — are drawn by true RNG on arrival.

The determinism is safe only because combat is genuinely random.
With a fixed `seed`, node types are knowable, but you cannot predict your chart-state two encounters out, so nothing past the immediate choice can be pre-solved.
The map's uncertainty is downstream of combat's.

## Stored, derived, evented

Three tiers, separated by who needs to read the data.

**Stored** — contract-readable, needed by gameplay logic and the onchain SVG render:
`Prince`, `Position`, `Chart`, and the current `Run` (including its `seed` and `distance`).

**Derived** — computed at read time, never written:

- `starField` = `runs.filter(over).map(r => r.distance)` — read by the NFT render; no separate array, since the distance already lives on each run.
- A run is **over** when `mapsCompleted == 7` or all seven planets have combusted — a pure function of stored fields, so no status flag is stored.
  At most one run is not-over: the active one, always at the tail of `runs`.
- Map `layout` and node types — `f(Run.seed, position)`.

**Evented** — client/indexer-readable only, never contract-readable:
past maps and run history, so the client can render a run's provenance.
Events cannot be read onchain, which is exactly why each run's `distance` must stay in storage rather than being evented away with its maps.

## Notes

`numEncounters` is materialized on the Prince rather than derived, because per-run encounter counts are not recoverable from stored state once a run's maps are evented.
It is the planet-unlock counter; a saturating `u8` is plenty, since unlock completes at 32.

Only the tail run carries live state; earlier runs are inert apart from `distance`.
Whether to physically prune a finished run's other fields or keep the full struct is an implementation choice — conceptually the array's payload is the distances.

Narrative gating (joy/ruler options, uncombust-rites gated on planet state) must live in the contract so it can validate a client-submitted outcome; the multi-step tree-walk itself is presentation only.

The TypeScript prototype (`Profile`, `RunState`) predates this model and should be reconciled to it.
