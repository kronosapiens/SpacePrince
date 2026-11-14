# State Model

The maintained description of the intended onchain shapes for the chart and all game state.
This document defines the *shapes*; the prose references define the *rules*.

The TypeScript prototype (`client/src/game/types.ts`) is the implemented shape.
It is wider than what is described here — presentation and history fields the client needs now — and it is where field names are read today.
The Cairo contract storage is the eventual home.
When the prototype and this document drift, reconcile deliberately: the prototype carries what the client needs, this document what the contract will store.
Other references point here for field shapes rather than redefining them.

Because the target is onchain, structures are specified explicitly — field widths where size is load-bearing, and a clear line between what is stored, derived, and evented.

## Structures

```cairo
Prince {
  position:      Position,       -- birth lat/lon/dob; the uniqueness key (one Prince per quantized position)
  chart:         Chart,          -- memoized at mint: f(position) via compute_chart, stored to avoid re-running the ephemeris
  numRelationalEncounters: u8,             -- cumulative lifetime relational encounters (saturating; only needs to reach 32); gates planet unlock (MECHANICS §11.1)
  achievements:  u64,            -- bitmap of achievement marks (reserved; earning not implemented, MECHANICS §11.2)
  runs:          Array<Run>,     -- every run this Prince has played; the star-field derives from runs[].light
  -- ERC-721 standard fields (token id, ownerOf, approvals) come from the token base and are not re-listed here.
}

Position {                       -- packs into one felt: 16 + 16 + 32 = 64 bits
  lat: u16,                      -- (latitude  + 90)  * 100  -> 0..18000   (0.01° resolution)
  lon: u16,                      -- (longitude + 180) * 100  -> 0..36000   (0.01° resolution)
  dob: u32,                      -- birth instant in 5-minute buckets from a fixed epoch (~40k-year range)
  -- The grid is 5-minute buckets and 0.01° (CHART.md, "Identity grid and chart twins").
}

Chart {
  placements: u32,               -- 7 planets × 4 bits (sign, 1 of 12) + 4 bits ascendant sign = 32 bits
}

Run {
  seed:          felt252,        -- one VRF request at run start; seeds all previewable map structure + gives between-run variety
  light:         u64,            -- cumulative Light; the run's permanent record (one star). Stays in storage — the onchain SVG reads it
  state:         u64,            -- per-planet run state: 7 × u9 tension = 63 bits; combustion is derived, not stored (MECHANICS §10)
  gains:         u128,           -- per-planet stat gains from narrative choices, lasting the run: 7 planets × 4 stats × u4 count of +12 steps = 112 bits; zero at run start (ENCOUNTERS §2)
  map:           Map,            -- the current map only; past maps are emitted as events, not stored
  mapsCompleted: u3,             -- maps finished this run, 0..7; the run ends at 7 (completion, MECHANICS §11)
  encounter:     Option<Encounter>,  -- the active encounter; None while routing on the map
}

Map {
  layout:   u5,                  -- 1 of 32 layouts (the 5 variable middle layers); derivable from f(seed, mapsCompleted), stored as a cache
  position: u4,                  -- current node, 0..11 (≤12 nodes); genuine mutable state — where the player stands
}

Encounter = Relational | Narrative -- tagged union

Relational {
  placements: u32,               -- the other chart, copied from the minted Prince picked by a VRF request on arrival (same packing as Chart)
  state:      u64,               -- the other chart's per-planet state (same shape as Run.state)
  turn:       u3,                -- turn counter, 0..6 (turns per encounter = map number = mapsCompleted + 1, MECHANICS §11)
  precommit:  u4,                -- the opponent's locked-in verb this turn: planet (u3) + action (u1); shown before the player chooses
}

Narrative {
  house:    u4,                  -- 1 of 12 houses
  storyIdx: u3,                  -- which of the five scenes written for this house and the Prince's sign on it (the sign is derived from the chart, ENCOUNTERS §8); one authored decision; the contract validates the option and targets
}
```

"Opponent" and "adversary" are internal names for the other chart; player surfaces say *other* ([SCREENS.md §1.2](../presentation/SCREENS.md#12-player-facing-register-no-martial-language)).

## Randomness

A single RNG primitive supplies true randomness on demand (VRF-style).
Relational and narrative resolution are deterministic.
The intended onchain VRF requests are listed below.
The current prototype instead derives the Other chart from the map's stored opponent seed, so that chart is already derivable at map creation (`client/src/game/run.ts`).
Its arrival and future-turn streams are seeded stand-ins for future VRF requests; this tuning does not settle the eventual onchain source of that randomness.
Any information derivable from public state remains available to the player.

For the onchain design, randomness is spent deliberately:

- **Once per run** — `Run.seed`, set by a VRF request at run start; the first map derives from it, and the player's tension starts at zero.
  A Prince's first run opens on the fixed first map instead ([MAP.md §4](MAP.md#4-seeding)).
- **Once per map rollover** — the next map's seed; from it derive node content and opening uncombust rolls (MECHANICS §11.3), shown on entry.
  Revival uses a separate seeded stream from node content; map openings add no tension.
- **At relational encounter arrival** — the minted Prince that supplies the other chart, and independent Necessity rolls for both charts, each drawing uniformly from 12/24/36 before Fortune, with tension capped at Resolve.
  A successful Fortune roll blocks that planet's entire draw.
  The player carries existing tension; the other starts with fresh state.
  Carried tension can cause combustion at entry; fresh planets survive every draw.
  In the prototype, each chart's Necessity uses a separate seeded stream from the other's and from the other chart's turn sequence.
- **At turn resolution** — the opponent's *next* precommit (planet + verb), revealed behind the resolution animation.
  A relational encounter's last turn has no next precommit, so it needs no VRF request.

Everything else is **pseudorandom**: a deterministic function of committed state that the client computes to render and the contract re-derives to bind, storing nothing.
Relational resolution itself is fully deterministic — no crits, no hidden rolls — so the client renders a committed turn instantly and the transaction confirms the identical result.
The client shows the whole current map (node types, boundary results), so routing is informed (Slay-the-Spire-style).
Under the intended design, the opposing chart and future precommits remain unknown until their VRF requests.
The prototype's derivable opponent charts are an implementation difference, not information the client may conceal.

## Stored, derived, evented

Three tiers, separated by who needs to read the data.

**Stored** — contract-readable, needed by gameplay logic and the onchain SVG render:
`Prince`, `Position`, `Chart`, and the current `Run` (including its `seed` and `light`).

**Derived** — computed at read time, never written:

- The star-field derives from completed runs: Prince identity and original run index seed position, while final `light` determines radius and opacity ([NFT.md](../presentation/NFT.md), "The Star-Field").
  All earlier runs are finished; the tail contributes only after it ends.
  No separate star array or stored coordinates are needed.
- A planet is **combusted** when `tension >= Resolve` (MECHANICS §10): tension caps at Resolve and combustion triggers there, so the tension lane carries the flag for free.
  Rejected: a stored per-planet combust bit — it widened `state` lanes to 10 bits (u128) to duplicate what the cap already encodes.
- A run is **over** when `mapsCompleted == 7` or all seven planets have combusted — a pure function of stored fields, so no status flag is stored.
  At most one run is not-over: the active one, always at the tail of `runs`.
- Map `layout` and node types — `f(Run.seed, position)`.

**Evented** — client/indexer-readable only, never contract-readable:
past maps and run history, so the client can render a run's provenance.
Events cannot be read onchain, which is exactly why each run's `light` must stay in storage rather than being evented away with its maps.

## Notes

`numRelationalEncounters` is materialized on the Prince rather than derived, because per-run relational encounter counts are not recoverable from stored state once a run's maps are evented.
It is the planet-unlock counter; a saturating `u8` is plenty, since unlock completes at 32.
The prototype uses the same `numRelationalEncounters` counter and excludes narrative encounters.

Only the tail run carries live state; earlier runs are inert apart from `light`.
Whether to physically prune a finished run's other fields or keep the full struct is an implementation choice — conceptually the array's payload is the Light values.

Narrative gating, target eligibility, and full payment must live in the contract so it can validate a submitted option and selected planet ids.
The conditioning planet and valid targets derive from the chart and current run state.
There is no narrative traversal state or continuing effect to store.
The prototype encounter stores `scenarioId`, `resolved`, and optional `resolutionText`, alongside its id and house.
Target selection is transient UI state; a committed consequence persists through reloads and cannot be applied twice.

The TypeScript prototype uses `Prince` and `Run`; its presentation and history fields are wider than the planned contract storage.
The prototype persists one Prince in `localStorage` (`client/src/state/prince.ts`); a schema change clears the save rather than migrating it.
