# Space Prince — Client

The client is a presentation-only browser app.
It reads game state, renders it as SVG, and writes new state when the player acts.
There is no wallet, no RPC, and no contract calls; production will run on Starknet, which is a separate project (`cairo/`).
Right now everything is local: state lives in `localStorage`, other charts are seeded real-ephemeris charts, and the focus is relational flow and chart readability.

The design references live in `docs/` (see [docs/README.md](../docs/README.md)).
`docs/mechanics/MECHANICS.md` describes the relational rules the resolvers implement; `docs/presentation/SCREENS.md` and `STYLE.md` describe the surfaces and the vocabulary they are drawn with.
This file describes the *implementation*: how the client is wired together and why.

## Stack

- React 18 + Vite 6 + TypeScript (strict + `noUncheckedIndexedAccess`)
- React Router 7: two game routes plus dev and gallery routes (below)
- Vitest: pure logic, reducers, and screen tests (`tests/`)
- `astronomy-engine` (Don Cross): real ephemeris for casting a chart
- Tone.js: the audio engine (`src/audio/`)
- pnpm: `pnpm dev`, `pnpm test`, `pnpm build`, `pnpm exec tsc -b --noEmit`

## Folder layout

Layers are listed lowest-first; each layer imports only from layers above it.

```
client/src/
  svg/                  Constants: palette, glyphs, viewBox geometry, stroke scale, chart/map/prince style tokens, the dev tuner
  game/                 Pure game logic: no React, no storage, no DOM
  data/                 Static reference data: houses, the economy table, the 720 narrative scenes, achievement candidates
  copy/                 Player-facing text, one file per surface (guides, help, primer, codex, openings, introductions)
  astronomy/            astronomy-engine wrapper for casting
  audio/                Tone.js engine, themes, strike pitches, UI cues
  eval/                 Balance evaluator (see below)
  state/                The Prince store: reducer, provider, thunk hooks, persistence, dev settings, dev spawn
  components/           Reusable presentation pieces (Chart, MapDiagram, guides, info cards, animation hooks)
  screens/              Title, the play surface, encounter and map screens, dev index, gallery, token
  style/                Tokens, motion keyframes, layout, reset
  assets/               Static assets
  main.tsx              Mount + provider stack + router
  App.tsx               Route table
  routes.ts             Route constants
```

## Architectural decisions

### One store: the Prince owns its runs

There is one reducer at the app root, `princeReducer`, provided by `PrinceStoreProvider` (`state/PrinceStore.tsx`) and persisted under one `localStorage` key, `sp:prince:v6` (`state/prince.ts`).
The `Prince` holds identity, chart, lifetime relational encounter count, the achievement bitmap, and every run it has played; the active run is the tail of `runs` if and only if it is not over (`docs/mechanics/STATE.md`).
Keys from earlier prototype shapes (`sp:profile:v1`, `sp:run:v1`, `sp:prince:v1` through `v5`) are cleared on load; there is no migration, so a schema change wipes stored state until the game ships for real users.

Reducer actions: `mint`, `clear`, `setRelationalEncounters`, `incrementRelationalEncounters`, `startRun`, `commitRun`.
Run mutations land on the tail run through `commitRun`.
Hooks: `usePrince`, `usePrinceDispatch`, `useActiveRun`, and `useRunChart` (the chart as the active run sees it, with the run's stat gains applied through `runChart`).

### Reducers are pure; thunks quarantine impurity

A reducer is `(state, action) => state`: no RNG, no `Date.now()`, no storage reads, no input mutation.
Actions that adopt a resolved next state carry it pre-computed; the reducer just returns it.
All impure work (`resolveTurn`, seeds, RNG rolling) happens in the thunk hooks in `state/store-actions.ts`: `useStartRun`, `useEnterNode`, `useCommitTurn`, `useRolloverMap`, `useResetAll`.

This shape deliberately mirrors the eventual onchain flow.
Today: thunk computes the next run → dispatch → reducer adopts it → persistence effect.
Tomorrow: thunk submits a transaction → resolved chain state comes back → reducer adopts it.
The screens won't need to change.

### Persistence is an effect, not a call

The provider runs one effect: save the Prince when it changes, clear storage when it is null.
Screens never call `savePrince` or `clearPrince`; they dispatch actions, and persistence is reactive.
The run's in-memory event log (`Run.events`) is stripped on save.

Dev settings (`state/settings.ts`, key `sp:settings:v1`) are small and toggle-shaped: unlock all planets, force the next node to a narrative house or a relational encounter.

### Planetary chorus at encounter entry

`useEnterNode` applies development overrides, samples a fresh entry seed, and commits the initialized encounter through `enterNode`.
That seed selects the narrative scene or the relational opening action and independent Necessity streams; the map's houses, rulers, and assigned Other remain fixed.
Tests and forecasts can inject an entry seed, while seeded evaluation retains its deterministic default draws.
The catalogue in `copy/chorus.ts` imports the seven canonical YAML files under `docs/research/chorus/` through `@rollup/plugin-yaml` in both Vite and Vitest.

`PlaySurface` mounts an opening component keyed by encounter ID, which selects a random passage once and holds it in local UI state.
It renders `ChorusCard` before mounting `EncounterScreen`, so opening playback, guides, and automatic advancement wait for Continue.
The shared chart stays mounted with inspection disabled behind an opaque backdrop.
All dismissal paths discard the local passage without changing game state.
Reloading an encounter, including an existing save or direct development spawn, shows a newly selected card; ordinary rerenders and turn updates do not reopen it.
No passage or dismissal state is persisted, and no storage migration is needed.

### The game layer is framework-free

`src/game/` imports only from itself and `data/`, never from React, the store, or any screen.
The boundary lets the same logic be called from screens (via thunks), from tests, and from the evaluator.

Determinism has a deliberate boundary inside this layer:

- **Resolution is deterministic.**
  `resolveTurn` computes the whole turn from state; its only draw is the opponent's *next* precommit, from a per-(run, encounter, turn) seeded stream (`relationalTurnRng`), so an initialized encounter replays its subsequent turns.
  Narrative resolution has no randomness.
  This is the part that must match the Cairo implementation.
- **Edges are not.**
  Entity ids use `Date.now()` (`encounter.ts`, `turn.ts`), and a new run, map, or live entry samples `randomSeed()` (`rng.ts`, `Math.random`), the prototype's stand-in for the VRF.
  Live entry saves its initialized result; the run seed alone does not reconstruct those opening draws.
  These are the call sites that change for onchain parity.

Adding a new `Math.random()` or `Date.now()` inside resolution-path game code is a bug; pass RNG in.

Key modules:

- `turn.ts`: `resolveTurn`, sequential relational resolution with preemption
- `relational.ts`: stats, the valence draw, direct exchange, the fortune roll (shared by resolution and projection)
- `projections.ts`: preview deltas and projected Light, over the same beats the scorer reads
- `score.ts`: Light by the encounter's ruler (`RULER_RULES`)
- `combust.ts`: ceilings, combustion, uncombust
- `necessity.ts`: relational-entry Necessity with Fortune blocking
- `encounter.ts`: `beginRelationalEncounter`, `beginNarrativeEncounter`, `encounterRuler`
- `narrative.ts`: scene context, targets, occupant terms (`withOccupants`), preview and resolve
- `run.ts`: `beginRun`, map rollover, boundary revival, `isOver`
- `chart.ts` / `aspects.ts`: chart construction, the run chart with gains, aspect lookup
- `map-gen.ts` / `map-content.ts`: the Sephirot graph and per-node content rolls
- `unlocks.ts`: the Macrobian threshold ladder
- `light-scale.ts`: star radius and opacity from Light

### The surface is derived from state, not the URL

The game runs at two routes (`routes.ts`): `/` is the Title, and `/play` is one state-derived surface (`screens/PlaySurface.tsx`) that shows casting, the map, or the encounter as a pure function of the active run.
`run.encounter` is the single source of truth for whether an encounter is in flight; screens narrow it rather than taking it as a separate prop that could drift.
Refresh during play resumes from the same state.
Onchain, `/play` gains a `?prince=` parameter resolved against chain; the surface layer is unchanged.

Other routes: `/__index` (the dev index), `/gallery` (the design gallery), and `/token` (the Prince artwork).

### Dev tooling spawns real games

There is no separate dev state.
`state/dev-spawn.ts` builds a real `Prince`, with a tail run and an encounter where relevant, positioned at a chosen screen (map, relational, narrative, end) and mints it into the store; "Regenerate" re-rolls a fresh real game at the same screen.
The dev console (`d` in the running client; `components/DevConsole.tsx`) hosts the tuner (`svg/tuning.ts`), whose defaults are the committed tokens, so it is an override layer and never a second source of truth.
Dev chrome ships in production builds too (PR #19) and is driven by the dev settings above.

### Animation is an overlay, not a state machine

Relational animations are choreographed by `components/useRelationalAnimation.ts`.
The hook owns animation state and a list of timeouts, with `start(...)` and `skip()`; cleanup on unmount is built in.
At commit the screen captures the pre-dispatch run and encounter, then calls `start(...)` with the resolver's `TurnLogEntry`; the hook seeds animation state with the previous values and schedules timeouts toward the resolved state.
While `animation` is non-null the screen reads display values from it; when it becomes null the screen falls back to the live run and encounter, which by then reflect the resolved turn.
The store always holds the truth; animation only controls what the player sees and when.

Per-planet visual tells are flag maps on animation state (`actionPulse`, `effectPlanets`, `combustingPlanets`), read by `Chart.tsx` and translated into CSS class toggles; keyframes live in `style/motion.css`.
`useNecessityAnimation.ts` plays the opening sweeps the same way, and `useEncounterAdvance.ts` advances a settled encounter after a pause, with tap to skip.
`PropagationLine` is RAF-driven gradient travel along a `<line>`.

## Known gaps and watch points

- **`Chart.tsx` is the one large file.** It is cohesive (one surface with its geometry, colour math, and subcomponents), but it is where complexity concentrates.
- **No schema migration.** Storage changes wipe saved state; the dev index has a reset.
- **Determinism edges** (ids, seeds) listed above must be revisited for Starknet integration.

## Conventions

Working rules live in the root `CLAUDE.md`, and the design references in `docs/`.
In short: Markdown one sentence per line, no wallet or contract calls here unless asked, player copy in `src/copy/`, visual values in their token files.

## Balance evaluation

The evaluator uses the game resolvers, seeded charts and runs, and a separate strategy RNG.
Its default strategies remain `random`, `survival`, and `light`.
Compare immediate defense with two-turn planning on relational-preferring routes:

```sh
pnpm eval:balance --seed 20261028 --charts 5 --runs 2 --strategies relational-immediate,relational-two-turn --out eval-results/planning
```

`narrative-immediate` provides a narrative-preferring control with the same immediate decisions.
`capacity-12` and `two-turn-capacity-12` allow up to 12 less remaining capacity for additional Light while preserving the best available survival and lit-planet measures.
They retain the original survival route forecasts; `two-turn-survival` uses those forecasts with no score allowance.
`relational-two-turn-entry-aware` values completed encounters as if another relational encounter arrived before recovery, using the current Necessity and Fortune rules.
That continuation omits intervening narratives and revival; it is a heuristic, not optimal play.
Planning enumerates possible future announcements without inspecting live future draws.

Use `--starting-encounters 0` to evaluate a first run with actual planet unlocks.
The count includes only resolved relational encounters.
Each trial starts at the selected lifetime count independently; omitting the option starts with all seven planets unlocked.
Clearing a relational encounter advances lifetime progress before checking for failure, including a new planet rescuing an otherwise combusted roster.
Programmatic callers can pass a run's final lifetime count into the next `runTrial` call.

Outputs include configuration, source revision and working-tree patch, run summaries, and paired comparisons with intervals resampled by chart.
The report separates relational damage and healing, relational-entry affliction and losses, and unlocks.
These fixed policies provide comparisons, not calibrated human win rates.
Regenerate a full record with the replay ID from the report, supplying the same starting count when used:

```sh
pnpm -s eval:balance --replay <chartSeed>:<gameSeed>:<strategy>:<strategySeed> --starting-encounters 0
```

### Evaluation methods

For study design, measurements, and interpretation, see the [evaluation methods guide](src/eval/README.md).
The [research summary on PR #18](https://github.com/kronosapiens/SpacePrince/pull/18#issuecomment-6457613560) records the earlier findings and their limitations.

## Verification

- `pnpm exec tsc -b --noEmit`: typecheck
- `pnpm test`: Vitest (game logic, reducers, screens)
- Manual playthrough: Title → cast a chart → Map → Encounter (relational and narrative) → finished map → New Run
- The dev index's reset clears the store; refresh during an encounter resumes from the same state
