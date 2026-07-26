# Space Prince

An onchain roguelike about identity, attention, and irreversible choice.

The player mints a unique **Prince** — a natal chart of 7 planets in 12 signs — and plays runs by choosing which planet to send against opponents.
The chart is the character sheet, the save file, and the NFT artifact, all the same object.

See `README.md` for the design pitch.
The full design lives in `spec/`; this file is a map.

## Current phase

*This section describes now, not the design — revise it as the phase moves.*

- **Alpha.** Mechanics and screens are still settling; playtesting drives changes.
- **Prioritize legibility of mechanics and debuggability over production polish.** Making game state readable beats making it pretty.
- Visual tuning knobs are centralized in `client/src/svg/chart-style.ts` and `client/src/svg/palette.ts`; prefer turning knobs to restructuring.
- Balance is deferred (`spec/mechanics/MECHANICS.md §14`); don't tune numbers for fairness yet.

## Architecture

Space Prince is a **fully onchain game** with a thin presentation client.

- **Backend (Starknet / Cairo).**
  Game state, chart derivation, and run resolution are computed onchain.
  The Prince NFT is generated entirely onchain as SVG.
  Astronomical computation is provided by a separate, reusable Cairo package — the [`astronomy-engine`](https://github.com/kronosapiens/astronomy-engine) repo — which `cairo/crates/star_chart` consumes as a path dependency.
  This repo does not vendor that package; the workspace is expected to live as a sibling on disk.

- **Client (browser, React + Vite + TypeScript).**
  The client is presentation-only: it reads onchain state and renders it.
  Currently it is a **local prototype** with no wallet, no RPC, and no contract calls.
  Charts are randomly generated, state lives in `localStorage`, and the focus is combat-flow and chart-readability prototyping.
  Production integration with Starknet will replace the local generators; the rendering surface stays the same.

- **Rendering medium.**
  Everything the player sees is SVG — the NFT, the chart, the map, the encounter, the chrome.
  This is a hard constraint: the artifact a player owns must be visually continuous with the world they play in.
  See `spec/design/STYLE.md`.

## Repo layout

```
cairo/        Cairo crates — onchain backend
client/       React/Vite/TS — browser client (current prototype, v2)
spec/         Design spec (see outline below)
planets/      Per-planet YAML reference notes
img/          Chart and prototype screenshots
README.md     Design pitch
```

## Spec outline

The spec is divided by what kind of question each document answers.

### `spec/concept/` — what the game *is*

- `LORE.md` — what lore is for in this game (not backstory; structural)
- `ASTROLOGY.md` — astrology as a symbolic system, historically grounded
- `PRIMER.md` — player-facing on-ramp: what astrology is and what you're playing (framing + codex)
- `PLANETS.md` — the philosophical chorus / voice for each of the seven planets
- `NFT.md` — what the Prince NFT is and how it evolves with play
- `ECONOMICS.md` — economics as commitment reinforcement, not extraction
- `INFLUENCES.md` — games and genres that shaped Space Prince and where it diverges

### `spec/mechanics/` — how the game *works*

- `MECHANICS.md` — **runtime source of truth** for combat. When older docs conflict, this wins.
- `STATE.md` — **data source of truth**: canonical structures for the chart + all game state (onchain-bound, mirrored by the client)
- `CHART.md` — chart-construction spec (Cairo-first)
- `MAP.md` — run map topology (Sephirot-pattern node graph)
- `HOUSES.md` — narrative encounter system organized around the twelve houses
- `ENCOUNTERS.md` — generation-ready authoring spec for narrative encounters (`HOUSES.md` is the *what*, this is the *how*)

### `spec/design/` — how the game *looks and feels*

- `SCREENS.md` — the screen set and how surfaces relate (encounter is the anchor, chart is always present)
- `STYLE.md` — visual vocabulary: SVG primitives, stroke scale, palette, typography
- `VIBES.md` — felt qualities: how mechanical state becomes experience
- `MUSIC.md` — sonic vocabulary: the music workstream (Holst-derived, FTL-structured; strategy only so far)
- `swatches/` — color swatches per planet
- `tree.html` — Sephirot tree prototype

### `spec/v1/` — archived earlier pass

- `DESIGN.md`, `CONTRACTS.md`, `ONBOARD.md` — superseded by the documents above. Kept for reference; do not treat as current.

## Conventions

- **`MECHANICS.md` wins** when it conflicts with older design docs.
- **Spec markdown uses one sentence per line.**
- **Don't add wallet, RPC, or contract calls to `client/`** unless explicitly asked — the client is presentation-only and currently a local prototype.
- **Don't introduce new visual vocabulary or colors** outside the planetary palette without checking `spec/design/STYLE.md` first.
- **The chart is never a corner HUD.** Surfaces flow through the chart, not on top of it (`spec/design/SCREENS.md`).
- **Client honesty.** Never present derivable information as unknowable, and never frame a determined outcome as a gamble (`spec/design/SCREENS.md §1.1`).
- **Interaction grammar is parity-first.** Tap-preview and tap-commit work identically on touch and desktop; hover is desktop-only and additive — never the sole carrier of information, never a commit (`spec/design/SCREENS.md §3.6`).
- **Previews show only what is determined.** Verb-dependent information appears once a verb is indicated (hovered or armed); verb-free information is free everywhere (`spec/design/SCREENS.md §3.6`).
- **One breath clock.** Every ambient pulse rides the shared `--breath` property (`client/src/style/motion.css`); never add a second rhythm.
- **Record rejections.** When a design alternative is tried and dropped, note it in the relevant spec with a `Rejected:` line so it isn't re-proposed.
- **Tune via tokens.** Colors live in `client/src/svg/palette.ts`, chart stroke/opacity knobs in `client/src/svg/chart-style.ts`, the stroke scale in `client/src/svg/viewbox.ts`, motion in `client/src/style/motion.css`. A hard-coded value moves to its token file the first time it gets tuned; new visual work starts there.
- **Previews share the resolver's code.** Derived displays (projections, warnings) call the resolution functions (`turn.ts`, `combust.ts`) — never a parallel implementation of the math, so preview and outcome can't drift.
- **Harvest upward.** When a session settles a design rule, write it into the relevant spec and add a one-line pointer here; code comments hold only what's local to the site.

## Tooling

- Client package manager: **pnpm**. Dev: `pnpm dev` in `client/`.
- Cairo: standard `scarb` workflow inside `cairo/crates/star_chart`. Build expects the sibling `astronomy-engine` workspace to resolve the path dependency.
