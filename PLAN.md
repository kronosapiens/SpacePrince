# Light Terminology and Schema Implementation Plan

## Overview

Rename the run-wide, spendable score from **Distance** to **Light** across the active specification, client domain model, persistence schema, player-facing copy, and future star-field terminology.
Preserve every scoring rule, value, exchange rate, animation behavior, and star-placement formula while giving the quantity one consistent name.

## Goals

- Make **Light** the sole player-facing name for the run score.
- Rename score-specific `distance` identifiers in canonical state and active code to `light` identifiers.
- Establish language that explains how Light is gathered, spent, and recorded as a star.
- Keep the specification, runtime types, stored prototype state, UI, and tests aligned.
- Leave unrelated geometric, geographic, and ordinary-language uses of “distance” unchanged.

## Non-Goals

- Do not change ruler scoring rules, numerical payouts, narrative prices, balance, or the zero clamp.
- Do not split Light into separate score and currency resources.
- Do not implement or redesign the deferred star-field.
- Do not add new colors, visual effects, animation timing, or layout vocabulary.
- Do not add Cairo gameplay contracts or migrate deployed onchain state, because none exists in this repository yet.
- Do not update archived `spec/v1/` documents.
- Do not rename generic developer concepts such as scoring, `score.ts`, `ScoredBeat`, `ScoringRule`, `beatScore`, or the unrelated musical score.

## Assumptions and Constraints

- Light remains a run-wide, banked, nonnegative number that combat can increase and narrative encounters can increase or spend.
- A run’s remaining Light is its permanent output and continues to determine its star.
- The mechanical term is capitalized as **Light** in prose, while ordinary visual light remains lowercase.
- Light remains visually neutral in the HUD; the rename does not assign it a new color or make color its only information channel.
- The client is an alpha prototype with no external users or deployed gameplay schema.
- Existing `sp:prince:v2` browser state may be discarded rather than migrated.
- The storage key will advance to `sp:prince:v3`, and `sp:prince:v2` will become a cleared legacy key.
- Active Markdown continues to use one sentence per line.
- The current baseline is 127 passing client tests, with both client and landing TypeScript checks passing.

## Requirements

### Functional

- New runs start with `light: 0`.
- Combat adds the ruler-derived turn gain to `Run.light` exactly as it currently adds to `Run.distance`.
- Narrative Light outcomes remain signed and clamp the run total at zero.
- Node outcomes record signed `lightDelta` values for end-of-run inspection and synthetic history.
- Combat previews and resolution animations show the same Light gain produced by the existing scoring function.
- Combat, narrative, index, and end-of-run screens label the quantity `LIGHT` or `Light` according to their current casing convention.
- Narrative option asides use forms such as `+24 Light` and `−12 Light` without changing their numbers.
- The ruler explanation uses the non-personifying form `Light gathers from {rule}.`
- The mint framing introduces Light before the first HUD encounter.
- Final Light continues to feed the existing `log2` band and modulo placement model without numerical conversion.
- Loading the app after the rename clears obsolete v2 prototype state and starts from the normal empty-state flow.

### Non-Functional

- The change must not alter deterministic resolution, preview parity, run termination, or narrative targeting.
- TypeScript must expose no compatibility aliases such as both `distance` and `light`.
- Active code and current specifications must contain no score-specific `Distance` terminology after integration.
- Long ruler copy, especially Mercury’s rule, must remain readable at supported desktop and mobile widths.
- The rename must not touch aspect-distance calculations, map-depth prose, geographic coordinates, CSS stroke weights, or ordinary narrative references to light.

## Technical Design

### Data Model

The canonical domain schema changes names without changing representations or values.

| Current | Replacement | Semantics |
|---|---|---|
| `Run.distance: number` | `Run.light: number` | Nonnegative run-wide score and spendable balance. |
| `NodeOutcome.distanceDelta: number` | `NodeOutcome.lightDelta: number` | Signed Light change attributable to one resolved node. |
| `Outcome { kind: "distance"; delta }` | `Outcome { kind: "light"; delta }` | Signed narrative Light outcome, clamped at application time. |
| `TurnLogEntry.turnScore: number` | `TurnLogEntry.lightGain: number` | Nonnegative Light awarded by one combat turn. |
| `runs[].distance` in the state spec | `runs[].light` | Persistent source for each historical run’s star. |

No conversion factor, rounding change, or backfill is required.
The existing number remains a TypeScript `number` in the prototype and a future `u64` in the onchain state specification.

Transient domain names follow the same mapping, including `runLight`, `runningLight`, `lightDelta`, `lightFlashEpoch`, and `lightFlashPlanet`.
The star-band helper moves from `game/distance.ts` to `game/light-scale.ts`, with `DistanceBands` and `distanceBands` becoming `LightBands` and `lightBands`.

Generic scoring names remain intact where they describe the calculation rather than stored game state.
`score.ts`, `scoreBeats`, `beatScore`, `ScoredBeat`, `ScoringRule`, and `ScoreCharts` therefore remain valid.
The domain-facing `turnScore` function becomes `turnLight`, matching `TurnLogEntry.lightGain`.

### API Design

There is no external runtime API to version today.
The internal contract becomes `Run.light`, `NodeOutcome.lightDelta`, and narrative outcome kind `light`, with all producers and consumers updated atomically.

The future onchain contract described by `spec/mechanics/STATE.md` will use `light: u64` from its first implementation.
No deprecated `distance` field, read fallback, or dual-write period will be introduced.

The player-facing ruler-rule contract becomes:

```text
Light gathers from {RULER_RULES[ruler].label}.
```

Each stored label remains a lower-case noun phrase, such as `testimony on the Other’s chart` or `combustion on both charts`.

### Architecture

The rename preserves the existing two paths into one run balance and its three downstream consumers.

```text
combat beats ── scoreBeats(ruler) ──> lightGain ─┐
                                                 ├─> Run.light
narrative { kind: "light" } ── clamp at zero ───┘       ├─> live and end-of-run readouts
                                                         ├─> NodeOutcome.lightDelta
                                                         └─> star placement: log2 / modulo
```

Persistence serializes `Prince.runs[].light` under `sp:prince:v3`.
Loading removes the obsolete `sp:prince:v2` key before reading v3 state.

### UX Flow

- Mint framing replaces the distance promise with the direct anchor: `Tension held and relieved, over and over, gathers into Light. When the passage ends, that Light becomes a star.`
- Map help describes Light as the lasting record of the crossing without implying that it measures map progress.
- Combat shows `LIGHT`, the current total, the projected `+N`, the existing per-beat pulse, and `Light gathers from …` beneath the ruler.
- Narrative encounters show signed Light prices and rewards, then animate the unchanged balance delta.
- End-of-run shows final `LIGHT` beside maps and encounters while retaining the passage and star framing.
- The future star-field continues to map final Light to position and brightness using the existing formulas.

---

## Implementation Plan

### Serial Dependencies (Must Complete First)

These tasks establish the shared contracts that every later workstream consumes.
Complete them in order.

#### Phase 0: Schema and Language Foundation

**Prerequisite for:** All subsequent phases

| Task | Description | Output |
|---|---|---|
| 0.1 | Update `client/src/game/types.ts` from `distance`, `distanceDelta`, and `turnScore` to `light`, `lightDelta`, and `lightGain`. | One canonical TypeScript domain schema with no compatibility aliases. |
| 0.2 | Change the narrative outcome discriminant in `client/src/data/narrative-trees.ts` from `distance` to `light`, and rename its terse constructor from `D` to `L`. | One final narrative outcome contract for runtime and authored trees. |
| 0.3 | Rename the domain-facing `turnScore` calculation to `turnLight` while retaining generic scoring helpers and the `score.ts` module. | A stable combat scoring boundary returning Light. |
| 0.4 | Advance `PRINCE_KEY` to `sp:prince:v3` and add `sp:prince:v2` to `LEGACY_KEYS` without a migration path. | Intentional alpha-state reset with no malformed old state loaded as the new schema. |
| 0.5 | Lock the ruler sentence template to `Light gathers from {label}.` and keep labels as lower-case noun phrases. | Shared copy contract for tests, UI, and specification. |

---

### Parallel Workstreams

These workstreams can proceed independently after Phase 0.

#### Workstream A: Mechanics, State, and Automated Tests

**Dependencies:** Phase 0

**Can parallelize with:** Workstreams B and C

| Task | Description | Output |
|---|---|---|
| A.1 | Update `game/run.ts`, `game/turn.ts`, and `game/narrative.ts` to initialize, award, spend, clamp, and return `Run.light`. | Unchanged score behavior under the new schema. |
| A.2 | Update `state/store-actions.ts` and `state/dev-spawn.ts` to calculate `lightDelta`, synthesize `light`, and preserve node-history totals. | State transitions and development fixtures using only Light fields. |
| A.3 | Update scoring comments, projections, and log construction to use `lightGain` and `turnLight` while retaining generic score helper names. | Clear separation between the scoring operation and the Light domain quantity. |
| A.4 | Rename `game/distance.ts` to `game/light-scale.ts`, then rename its interface, function, arguments, and comments without changing its `log2` math. | Future star-placement helper expressed in Light terminology. |
| A.5 | Rename and update `tests/distance.test.ts`, then update score, parity, reducer, and run-loop tests for the new fields and outcome discriminant. | Equivalent unit and integration coverage under the Light schema. |
| A.6 | Add a focused persistence test or equivalent state test proving v2 data is discarded and v3 Light data round-trips. | Explicit coverage of the chosen no-migration rollout. |

#### Workstream B: Player Surfaces and Presentation Internals

**Dependencies:** Phase 0

**Can parallelize with:** Workstreams A and C

| Task | Description | Output |
|---|---|---|
| B.1 | Update combat locals, projected-value names, readout labels, ruler copy, and comments in `EncounterCombat.tsx`. | Combat consistently presents Light and the new rule grammar. |
| B.2 | Rename animation state and CSS hooks in `useCombatAnimation.ts`, `motion.css`, and `layout.css` from distance to light without changing timing or appearance. | Semantically named presentation internals with pixel-identical behavior. |
| B.3 | Update `EncounterNarrative.tsx`, `EndOfRunScreen.tsx`, and `IndexScreen.tsx` to consume `Run.light` and display `LIGHT` or `Light`. | All score readouts use the new quantity. |
| B.4 | Replace score-specific Distance text in every narrative aside while preserving signs, values, targets, and prose choices. | Authored options such as `+24 Light` and `−84 Light`. |
| B.5 | Update `screen-help.ts` and `TermText.tsx` so help explains Light and the term highlighter recognizes Light instead of Distance. | Consistent onboarding and gold term treatment. |
| B.6 | Rename the unused gameplay-shaped fields in `landing/src/game/types.ts` to `lightDelta` and `runLight`, leaving geometric distance untouched. | Landing source no longer carries stale score terminology. |

#### Workstream C: Canonical Specification and Framing

**Dependencies:** Phase 0

**Can parallelize with:** Workstreams A and B

| Task | Description | Output |
|---|---|---|
| C.1 | Update `README.md` to introduce Light as the banked run quantity and replace the inaccurate claim that Affliction is the only resource with a precise distinction between per-planet affliction and run-wide Light. | A pitch consistent with the implemented economy. |
| C.2 | Update `spec/concept/PRIMER.md` with the agreed mint framing and ensure the later star passage reinforces rather than redefines Light. | Light has an emotional anchor before its first HUD appearance. |
| C.3 | Edit `spec/mechanics/MECHANICS.md`, `ENCOUNTERS.md`, `HOUSES.md`, and `STATE.md` to rename formulas, fields, outcomes, prices, and permanent records without changing mechanics. | Canonical mechanics and state documents using Light throughout. |
| C.4 | Edit `spec/design/SCREENS.md`, `STYLE.md`, and `VIBES.md` to rename the readout, explain neutral styling, and adopt `Light gathers from …`. | Presentation rules aligned with the client. |
| C.5 | Edit `spec/concept/NFT.md` so final Light determines each star, including `log2(Light)` and `Light % 100`, while avoiding awkward phrases such as “Light recorded as a point of light.” | Star-field model with unchanged mathematics and clearer prose. |
| C.6 | Update current entries in `spec/ROADMAP.md` from `runs[].distance` and final Distance to `runs[].light` and final Light. | Forward work targets the final schema name. |
| C.7 | Audit every remaining current-spec match manually and retain only genuine concepts such as sign distance, transmission across distance, and the ninth house’s long-distance theme. | No blind replacements or semantic damage. |

---

### Merge Phase

After all workstreams complete, these tasks integrate and validate the rename.

#### Phase 2: Integration

**Dependencies:** Workstreams A, B, and C

| Task | Description | Output |
|---|---|---|
| 2.1 | Reconcile imports, renamed files, JSX props, test fixtures, and discriminated-union switches against the Phase 0 schema. | A compiling client with no temporary aliases. |
| 2.2 | Compare scoring test expectations and authored narrative numbers before and after the rename. | Evidence that the patch contains no balance drift. |
| 2.3 | Run a targeted residual search and classify each remaining lowercase `distance` or `light` occurrence by meaning. | Only intentional geometric, geographic, visual, archived, or generic-score terminology remains. |
| 2.4 | Exercise mint, map help, combat preview and resolution, narrative gain and spend, zero clamping, end-of-run, and reload/reset flows. | End-to-end confirmation that Light reads coherently on every surface. |
| 2.5 | Check responsive wrapping for every ruler sentence, especially Mercury, and verify Light remains readable without relying on color. | No layout or accessibility regression. |

---

## Testing and Validation

- Preserve all existing ruler-payout assertions in `score.test.ts`.
- Update the label-contract test to assert that every phrase completes `Light gathers from …`.
- Preserve projection-versus-resolution beat parity and assert `result.run.light - run.light === result.log.lightGain`.
- Test narrative Light gain, spending, and clamping at zero.
- Test node `lightDelta` accumulation in real and synthetic map history.
- Rename the scale tests and assert identical doubling, fraction, monotonicity, zero, `NaN`, and unbounded-input results.
- Test that `sp:prince:v2` is cleared and never deserialized as a v3 Prince.
- Test that a v3 Prince containing historical and active `light` values round-trips through local storage.
- Manually inspect combat at narrow and wide widths with each ruler rule.
- Manually inspect positive and negative narrative Light flashes and final Light on end-of-run.

## Rollout and Migration

- Ship the schema and vocabulary rename as one atomic change because there is no external API or deployed gameplay state to support.
- Use `sp:prince:v3` for all newly saved Princes.
- Treat `sp:prince:v2` as legacy and delete it during load.
- Do not migrate, dual-read, dual-write, or backfill v2 saves.
- Do not add a feature flag because mixed Distance and Light states would create more risk than the alpha reset avoids.
- A source rollback can restore the old code, but discarded v2 local data is intentionally unrecoverable and accepted because there are no users.

## Verification Checklist

- [ ] Run `cd client && pnpm test`; expect every test to pass.
- [ ] Run `cd client && pnpm build`; expect TypeScript and Vite to succeed.
- [ ] Run `cd landing && pnpm build`; expect TypeScript and Vite to succeed.
- [ ] Run `git diff --check`; expect no whitespace errors.
- [ ] Search active sources with `rg -n '\bDistance\b|runDistance|distanceDelta|runningDistance|distanceFlash|distanceBands|kind: "distance"|\.distance\b' README.md spec/concept spec/mechanics spec/design spec/ROADMAP.md client/src client/tests landing/src`.
- [ ] Confirm residual matches are only unrelated geometric or ordinary-language uses, with archived `spec/v1/` intentionally excluded.
- [ ] Search `rg -n '\bLight\b' README.md spec client/src client/tests landing/src` and inspect capitalization and meaning manually.
- [ ] Confirm a combat preview’s `+N` equals the Light applied during resolution.
- [ ] Confirm narrative rewards increase Light, costs decrease it, and costs cannot take it below zero.
- [ ] Confirm end-of-run displays the same final Light stored on the run.
- [ ] Seed `sp:prince:v2`, load the app, and confirm the old key is removed and the empty-state flow appears.
- [ ] Start a new Prince, reload, and confirm `sp:prince:v3` restores `runs[].light` correctly.
- [ ] Verify the mint framing, all four help cards, all seven ruler lines, representative narrative options, and end-of-run at desktop and mobile widths.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A blind replacement changes aspect distance, map-depth prose, or the ninth house’s distance theme. | Medium | High | Use identifier-aware edits and manually classify every residual match. |
| Light becomes confused with visual illumination or the lit/unlit planet state. | Medium | Medium | Capitalize the quantity, keep visual uses lowercase, explain the balance in help, and add no new Light-specific color. |
| A stale `distance` field survives in a fixture or nested outcome and silently produces `undefined`. | Medium | High | Remove aliases, rely on TypeScript failures, update parity tests, and run the targeted residual search. |
| The longer `Light gathers from …` rule wraps poorly for Mercury. | Medium | Medium | Check all rulers at narrow widths and adjust local typography or phrase length only if required. |
| The storage-key bump unexpectedly discards a developer’s local Prince. | High | Low | Document the intentional reset and the confirmed absence of users. |
| Editorial replacement produces tautologies around a star’s light. | Medium | Low | Rewrite NFT passages by meaning instead of replacing words mechanically. |
| Generic scoring helpers are renamed unnecessarily, expanding the patch and obscuring their role. | Low | Medium | Keep `score.ts` and generic score types/functions, renaming only domain-facing stored values and UI variables. |
| Archived specifications continue to appear in broad repository searches. | High | Low | Leave `spec/v1/` historical and exclude it from active-spec acceptance scans. |

## Open Questions

None.

## Decision Log

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Rename the quantity to **Light** everywhere active. | Light can gather, be spent to restore planets, and remain as the star produced by a run. | Keep Distance; use Radiance, Reach, Attention, or Care. |
| Rename canonical fields rather than applying a display alias. | The gameplay state is not deployed, so carrying obsolete terminology would create avoidable onchain and client debt. | Keep `distance` internally and display Light only. |
| Retain generic scoring terminology in developer code. | Scoring describes the calculation, while Light names its domain output. | Rename every `score` symbol mechanically. |
| Use `Light gathers from …` for ruler rules. | The construction works for all seven rules and avoids personifying planets. | `Distance is …`; `{Ruler} draws Light from …`; `Light is …`. |
| Keep Light visually neutral. | The rename is semantic, and neutrality avoids collision with planetary colors and lit-state signaling. | Give Light a dedicated glow or color. |
| Reset v2 local state with `sp:prince:v3`. | There are no users, and a migration would add code with no product value. | In-place parsing; one-time nested-state migration; dual-read compatibility. |
| Preserve all score values and star formulas. | This change tests terminology, not balance or progression. | Retune payouts; change star placement; split score and currency. |
| Leave archived and unrelated distance language unchanged. | Historical specs and geometric distance describe different concepts. | Repository-wide textual replacement. |
