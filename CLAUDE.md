# Space Prince

An onchain roguelike about identity, attention, and irreversible choice.

The player mints a unique **Prince**, a natal chart of 7 planets in 12 signs, and plays runs of encounters with other charts and with the houses of their own.
The chart is the character sheet, the save file, and the NFT artifact, all the same object.

See `README.md` for the pitch and `docs/README.md` for the map of the design references.
This file holds working instructions and pointers.

## Current phase

*This section describes now, not the design; revise it as the phase moves.*

- **Alpha.** Mechanics and screens are still settling; playtesting drives changes.
- **Prioritize legibility of mechanics and debuggability over production polish.** Making game state readable beats making it pretty.
- Visual tuning knobs are centralized in `client/src/svg/chart-style.ts` and `client/src/svg/palette.ts`; prefer turning knobs to restructuring.
- Base stats are being tuned through playtesting; final balance remains open (`docs/mechanics/MECHANICS.md §2`).

## Architecture

Space Prince is intended as a **fully onchain game** with a thin presentation client.

- **Backend (Starknet / Cairo).**
  Game state, chart derivation, and run resolution are meant to be computed onchain, and the Prince NFT generated onchain as SVG.
  Astronomical computation comes from a separate, reusable Cairo package, the `engine_v6` crate in the [`astronomy-cairo`](https://github.com/kronosapiens/astronomy-cairo) repo, which `cairo/crates/star_chart` consumes as a git dependency pinned to a commit.
  This repo does not vendor that package.
  Today only the chart-derivation crate exists.

- **Client (browser, React + Vite + TypeScript).**
  The client is presentation-only: it reads game state and renders it.
  Currently it is a **local prototype** with no wallet, no RPC, and no contract calls.
  Charts come from a real ephemeris, state lives in `localStorage`, and the focus is relational encounter flow and chart readability.
  Production integration with Starknet will replace the local generators; the rendering surface stays the same.

- **Rendering medium.**
  Everything the player sees is SVG: the NFT, the chart, the map, the encounter, the chrome.
  The artifact a player owns must be visually continuous with the world they play in (`docs/presentation/STYLE.md`).

## Repo layout

```
cairo/        Cairo crates — onchain backend
client/       React/Vite/TS — browser client (current prototype)
landing/      React/Vite/TS — the public landing page (spaceprince.xyz)
docs/         Design references, writing material, research, and a small archive
img/          Banner and prototype screenshots
README.md     Design pitch
```

## Where things are

- `docs/intent.md` holds premise, audience, experience, and influences.
- `docs/mechanics/` holds the rules: `MECHANICS.md` (relational encounters), `ENCOUNTERS.md` and `HOUSES.md` (house scenes), `STATE.md` (data), `CHART.md`, `MAP.md`.
- `docs/presentation/` holds `SCREENS.md`, `STYLE.md`, `MUSIC.md`, and `NFT.md`.
- `docs/writing/` holds the authoring guide, the matrices, the planetary archetypes, the primer, and the 720 scene briefs.
- `docs/research/` holds sources and historical findings; a recommendation there is not a rule.
- GitHub issues hold proposals, experiments, and open questions.
- Docs record intended behavior; code records implemented behavior.
  Investigate a disagreement rather than treating either as correct.
- Presentation rules (register, client honesty, interaction grammar, the chart's channels, chrome placement) live in `docs/presentation/SCREENS.md` §1 and §3 and in `STYLE.md`; read them before UI work.
  Where a doc and the client disagree on a placement, size, or timing, the client is current; where they disagree on a stated rule, that is a discrepancy to resolve, not a rule the client has quietly changed.

## Conventions

- **Markdown uses one sentence per line.**
- **Don't add wallet, RPC, or contract calls to `client/`** unless explicitly asked; the client is presentation-only and currently a local prototype.
- **Player-facing text lives under `client/src/copy/`**, one file per surface, never inline JSX.
- **Tune via tokens.** Colors live in `client/src/svg/palette.ts`, chart stroke/opacity knobs in `client/src/svg/chart-style.ts`, the stroke schedule in `client/src/svg/viewbox.ts` (chart viewBox units only; the map and seam render at their own scales), motion in `client/src/style/motion.css`. A hard-coded value moves to its token file the first time it gets tuned; new visual work starts there.
- **One breath clock.** Every ambient pulse rides the shared `--breath` property (`client/src/style/motion.css`); never add a second rhythm.
- **The landing chart follows the client's.** `landing/` carries a trimmed copy of the chart (resting + hover only), and `landing/src/svg/chart-style.ts` mirrors the client's token values; when the client's chart styling moves, re-sync the landing.
- **Previews share the resolver's code.** Derived displays (projections, warnings) call the resolution functions (`turn.ts`, `combust.ts`, `narrative.ts`), never a parallel implementation of the math.
- **The sexagesimal lattice.** Stats and Resolve ceilings are multiples of 12, probabilities in sixtieths; aspect multipliers are circle fractions (`docs/mechanics/MECHANICS.md`, "Number model" and §9). Never introduce a value that steps off the lattice.
- **Don't record decisions unprompted.** Most choices are just the process of arriving at an answer; writing each one into a doc or a comment turns the repo into a tar pit. If something reads as a principle worth recording, propose it as a separate edit and wait for explicit confirmation.
- **Harvest upward, on request.** A settled rule may be worth writing into the relevant reference with a one-line pointer here; propose it, don't do it unasked. Code comments hold only what's local to the site.
- **When a change alters guidance, update the affected reference.** Leave implementation history to git and PRs.

## Tooling

- Client package manager: **pnpm**. Dev: `pnpm dev` in `client/`.
- **Tuner** (dev only): `d` in the running client opens the dev console, whose tuner drives whatever is still unsettled live (`client/src/svg/tuning.ts`). Its defaults *are* the committed tokens, so it is an override layer, never a second source of truth; settled values get written back by hand.
- Cairo: standard `scarb` workflow inside `cairo/`, on scarb 2.16.1 (pinned in `cairo/.tool-versions`). Scarb fetches `engine_v6` from its git dependency.
