# Space Prince

An onchain roguelike about identity, attention, and irreversible choice.

The player mints a unique **Prince** — a natal chart of 7 planets in 12 signs — and plays runs by choosing which planet to send against opponents.
The chart is the character sheet, the save file, and the NFT artifact, all the same object.

See `README.md` for the design pitch.
The full design lives in `spec/`; this file is a map.

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
client/       React/Vite/TS — browser client (prototype)
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
- `PLANETS.md` — the philosophical chorus / voice for each of the seven planets
- `NFT.md` — what the Prince NFT is and how it evolves with play
- `ECONOMICS.md` — economics as commitment reinforcement, not extraction
- `INFLUENCES.md` — games and genres that shaped Space Prince and where it diverges

### `spec/mechanics/` — how the game *works*

- `MECHANICS.md` — **runtime source of truth** for combat. When older docs conflict, this wins.
- `CHART.md` — chart-construction spec (Cairo-first)
- `CHART_PLAN.md` — implementation decisions made while planning the Cairo chart pipeline
- `MAP.md` — run map topology (Sephirot-pattern node graph)
- `HOUSES.md` — narrative encounter system organized around the twelve houses

### `spec/design/` — how the game *looks and feels*

- `SCREENS.md` — the screen set and how surfaces relate (encounter is the anchor, chart is always present)
- `STYLE.md` — visual vocabulary: SVG primitives, stroke scale, palette, typography
- `VIBES.md` — felt qualities: how mechanical state becomes experience
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

## Tooling

- Client package manager: **pnpm**. Dev: `pnpm dev` in `client/`.
- Cairo: standard `scarb` workflow inside `cairo/crates/star_chart`. Build expects the sibling `astronomy-engine` workspace to resolve the path dependency.
