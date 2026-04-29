# Space Prince — Client Architecture

The client is a presentation-only browser app.
It reads game state, renders it as SVG, and writes new state when the player acts.
There is no wallet, no RPC, no contract calls — production will run on Starknet, that's a separate project (`cairo/`).
Right now, everything is dev: state lives in `localStorage`, opponents are seeded random charts, and the focus is combat-flow + chart-readability prototyping.

`spec/mechanics/MECHANICS.md` is the runtime source of truth for combat math.
`spec/design/SCREENS.md` / `STYLE.md` / `VIBES.md` define the visual contract.
This file describes the *implementation* — how the client is wired together.

## Stack

- React 18 + Vite 6 + TypeScript (strict + `noUncheckedIndexedAccess`)
- React Router 7 — URLs are state for dev seed routes (`/encounter/<seed>`)
- Vitest — pure logic + reducers tested
- `astronomy-engine` (Don Cross) — real ephemeris for Mint
- `js-yaml` + Vite `?raw` — chorus fragments loaded from `planets/*.yaml`
- pnpm — `pnpm dev`, `pnpm test`, `pnpm exec tsc -b --noEmit`

## Folder layout

```
client/src/
  main.tsx              Mount + provider stack + router
  App.tsx               Route table
  routes.ts             Route constants
  game/                 Pure game logic — no React, no storage, no RNG except via passed-in fns
  astronomy/            astronomy-engine wrapper for Mint
  data/                 Static reference data (houses, narrative trees, chorus loader)
  state/                Reducers, providers, thunks, persistence
  screens/              Route-level components — one per screen
  components/           Reusable presentation pieces (Chart, MapDiagram, etc.)
  svg/                  SVG primitives, palette, glyph maps, viewBox constants
  style/                Tokens, motion keyframes, layout, reset
```

## State management

There are two reducers at the app root.
Each owns a domain, persists to a dedicated `localStorage` key, and is read via context.

| Domain | Reducer | Provider | Persistence key |
|---|---|---|---|
| Run (in-flight game state) | `runReducer` | `RunStoreProvider` | `sp:run:v1` |
| Profile (the Prince) | `profileReducer` | `ProfileStoreProvider` | `sp:profile:v1` |

Settings (`DevSettings`) is small and toggle-shaped, kept as ad-hoc `localStorage` reads in `state/settings.ts`.

### Reducers are pure

A reducer is `(state, action) => state`.
No RNG, no `Date.now()`, no storage reads, no input mutation.
All actions that adopt a fully-resolved next state (e.g. `run/commitTurn`) carry it as `nextRun`; the reducer just returns it.
Impure work — `resolveTurn`, `randomSeed`, `Date.now`, RNG-rolling — happens in **thunk hooks** in `state/store-actions.ts`.

### Thunk hooks

Thunks are React hooks that call dispatch.
They live in `state/store-actions.ts` and exist for two reasons.
One: they're the place where RNG and time live, keeping reducers pure.
Two: they handle cross-store concerns — `useCommitTurn` dispatches `run/commitTurn` and, if the encounter ended, also `profile/incrementLifetime`.

The current vocabulary:

- `useStartRun` — begin a run for a profile
- `useCommitTurn` — resolve a combat turn, build the `NodeOutcome`, bump lifetime if encounter ends
- `useCommitNarrative` — apply narrative outcomes, build the `NodeOutcome`, bump lifetime if encounter ends
- `useRolloverMap` — terminal node reached, archive current map, generate a fresh one
- `useBumpScars` — End-of-Run scars increment, idempotent per `runId`
- `useResetAll` — clear both stores

### Persistence is an effect

Each provider runs:

```ts
useEffect(() => {
  if (state) saveX(state); else clearX();
}, [state]);
```

Screens never call `saveRun` / `saveProfile` / `clearRun` / `clearProfile` directly.
The grep `grep -rn "saveRun\|saveProfile\|loadRun\|loadProfile" src/screens src/components` should always return empty — the load/save helpers are called only by the providers and the reducer init.
Screens dispatch actions; persistence is reactive.

This separation mirrors the eventual onchain shape.
Today: dispatch → reducer → persistence-effect.
Tomorrow: dispatch → contract call → resolved chain state → reducer.
The screens won't need to change.

### Encounter is derived, not passed

`run.currentEncounter` is the single source of truth for whether an encounter is in flight.
Screens that render an encounter narrow it via `run.currentEncounter` — never as a separate prop that could drift.

### Schema versioning

`Profile` has a `schemaVersion: 1` field but no migration path yet.
Schema changes wipe stored state until we ship for real users.
The Index screen has a Reset button for explicit clearing.

## Dev mode

`DevSettings.devModeActive` (toggle on Index screen) routes the encounter and map screens to *dev sub-components* that use local `useState` instead of dispatching to the real stores.
`DevCombatScreen` (in `EncounterScreen.tsx`) and `DevMapScreen` (in `MapScreen.tsx`) synthesize ephemeral state from a URL seed (`/encounter/<8-char-base36>`).
The synthetic profile lives in `sessionStorage` (`getOrCreateDevProfile`) so reroll only changes the encounter, not the Prince.

Because real screens never call save helpers directly, switching `devModeActive` cannot leak state into `localStorage`.
This was a real bug before the state refactor; it's now structurally impossible.

`NarrativeRoute` (`/narrative/<seed>`) is dev-only and renders `EncounterNarrativeScreen` with no-op callbacks.

## Game logic boundary

`src/game/` is framework-free.
Files there import only from each other and from `data.ts`.
They never import from React, the store, or any screen.

The boundary lets the same logic be called from the screen (via thunks) and from tests (directly).
When this rule is violated — for example, calling `Math.random()` inside a game function — it's a bug.
RNG should be passed in as `() => number`.

Key modules:

- `turn.ts` — `resolveTurn`: combat turn resolution
- `combat.ts` — polarity, stats, exchange formulas (shared between resolution and projection)
- `projections.ts` — preview deltas for tap-preview UI
- `combust.ts` — combustion probability + roll
- `encounter.ts` — `beginCombatEncounter`, `beginNarrativeEncounter`
- `run.ts` — `beginRun`, `rolloverMap`
- `chart.ts` — chart construction, `cloneSideState`, `blankSideState`
- `aspects.ts` — `getAspects` (stable lookup keyed on chart)
- `map-gen.ts` / `map-content.ts` — Sephirot graph + lazy node content rolling
- `unlocks.ts` — Macrobian threshold ladder

## Animation system

Combat animations are choreographed by `components/useCombatAnimation.ts`.
The hook owns animation state, a list of `setTimeout` IDs, `start(entry, prevRun, prevEncounter)`, and `skip()`.
Cleanup-on-unmount is built in.

The choreography model:
At the moment of commit the screen captures `previousRun` and `previousEncounter` (pre-dispatch).
Then it calls `start(...)` with the `TurnLogEntry` from the resolver.
The hook seeds animation state with the *previous* values, then schedules timeouts that mutate animation state toward the resolved post-turn state.
While `animation` is non-null, the screen reads display values from it; when it becomes null, the screen falls back to the live `run` / `encounter` props (which by then reflect the resolved turn).

Per-planet visual tells are flag maps on animation state — `actionPulse`, `impactPlanets`, `critPlanets`, `combustingPlanets` — read by `Chart.tsx` and translated into CSS class toggles (`anim-action-glow`, `anim-impact`, `anim-crit-burst`, `anim-combust-ripple`).
Keyframes live in `style/motion.css`.
The schedule's longest-running phase is the combust ripple (1000ms); the end delay extends to wait for it before clearing animation state.

`PropagationLine` is RAF-driven gradient travel along a `<line>`.
It uses `useRef` + `useId` for the gradient — never `document.getElementById`.

## Conventions

- Markdown in this repo uses one sentence per line.
- Don't introduce new visual vocabulary or colors outside the planetary palette without checking `spec/design/STYLE.md`.
- The chart is never a corner HUD; surfaces flow through the chart, not on top of it.
- Everything the player sees is SVG — including the NFT, the chart, the map, the encounter, the chrome.
- `MECHANICS.md` wins when it conflicts with older design docs.
- No wallet, RPC, or contract calls in `client/` unless explicitly asked.

## Verification commands

- `pnpm exec tsc -b --noEmit` — typecheck
- `pnpm test` — Vitest (currently 72 tests across game logic + reducers)
- Manual playthrough: Title → Start (mint) → Map → Encounter (combat + narrative) → End-of-Run → Begin again
- Reset button on Index clears both stores; refresh during an encounter resumes from the same state
