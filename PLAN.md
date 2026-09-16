# Desktop Interaction Implementation Plan

## Overview

Remove repeated confirmation from ordinary encounter actions, map travel, and narrative choices.
Desktop previews use hover or keyboard focus; activating a fully specified action executes it.
Planet inspection and choosing a narrative target remain separate steps where they provide information or a missing choice.

## Goals

- Reduce encounter turns to selecting a planet and activating its action once.
- Enter map nodes and resolve untargeted narrative options with one activation.
- Resolve targeted narrative options by selecting the option, previewing eligible planets, and activating the target.
- Preserve exact previews, keyboard operation, safe inspection, and guide demonstrations.
- Replace mandatory mobile parity in active guidance with desktop priority and deferred mobile adaptation.

## Non-Goals

- Mobile interaction design, a touch-specific confirmation path, or removal of existing responsive layouts.
- Changes to game rules, scoring, costs, persistence, animation timing, or encounter advancement.
- Changes to mint confirmation, wallet integration, Cairo, or the landing page.
- New preview-lock controls, settings, dependencies, or a general interaction framework.

## Assumptions and Constraints

- The user has approved desktop priority and the interaction direction described here.
- This is the local React prototype; existing resolvers remain the source for previews and outcomes.
- Use `pnpm` and the existing React/Vitest setup; preserve unrelated workspace changes.
- This updates `PLAN.md` for the current task, replacing the preceding Light terminology plan.
- Implementation is complete; validation is recorded below.

## Requirements

### Functional

| Surface | Preview / preparation | Activation |
|---|---|---|
| Encounter planet | Hover/focus shows the defensive preview; activation opens its inspection panel. | Inspection alone never resolves a turn. |
| Afflict / Testify | Hover/focus shows full-turn effects and Light gain. | One activation executes the selected planet and verb. |
| Eligible map node | Hover/focus highlights the node and incoming route. | One activation enters it. |
| Untargeted narrative option | Hover/focus previews determined effects; the authored aside remains visible. | One activation resolves it. |
| Targeted narrative option | One activation enters targeting and marks eligible planets. | Repeating this activation leaves targeting active without resolving. |
| Narrative target | Hover/focus previews the selected option's exact effect on that planet. | One activation resolves the option for that planet. |
| Ordinary chart inspection | Keep existing behavior outside narrative targeting. | No gameplay commitment. |

- Hover/focus never commits or enters targeting.
- Previewing another narrative option cannot change the option a target activation executes; returning to the chart restores the selected targeting option's preview.
- Choosing another option clears the previous target preview; background click or Escape cancels targeting.
- Preserve eligibility, unavailable-choice explanations, revival targeting, and selected-option result highlighting.
- Guides allow demonstrations but block gameplay commitment and commit sounds.
- Existing resolution animation and advancement remain intact.

### Non-Functional

- Keyboard focus supplies the same determined information as hover and has a visible indicator.
- Switching input methods keeps previews coherent; pointer exit must not erase a preview still supplied by keyboard focus.
- Commit handlers use the activated control's explicit planet, verb, or option, without assuming preceding hover or a completed React state update.
- Retain resolved/animation guards, key-repeat suppression, and narrative duplicate-commit protection.
- Remove redundant arming state, callbacks, toggle semantics, styles, and sound expectations.

## Technical Design

### Data Model

No persisted types or storage keys change.
Affected state is local: encounter action preview, map hover/focus, and narrative option preview versus selected targeting option.
Keep selected planets for ordinary inspection and the selected narrative option for targeting and result identification.
These selections supply information beyond confirmation.

### API Design

In `PlanetStatsPanel.tsx`, remove `PlanetStatsActions.pending` and `onClearPending`.
Keep choices and an activation callback, with a preview value/callback supporting hover and focus.
Action buttons become ordinary buttons rather than pressed toggles.

Extend the existing panel with an optional read-only effect row, forwarded through `Chart`, for narrative previews.
It replaces the confirmation button's verb and actual amount: an authored `Testify 36` on a planet with 10 affliction still previews `Testify 10`.
Use resolver output; add neither another panel component nor duplicate arithmetic.

Narrative commitment takes the option ID and explicit `Selection`.
Target activation passes `{ chosen: planet }` directly rather than setting selection state and reading its previous value.

### Architecture

- `Chart.tsx` and `PlanetStatsPanel.tsx`: preview/focus events, activation, and readouts.
- `EncounterCombat.tsx`: selected actor, indicated verb, resolver preview, and commitment.
- `MapDiagram.tsx`: node/route emphasis and activation; `MapScreen.tsx` retains travel, persistence, and guide blocking.
- `EncounterNarrative.tsx`: transient option preview, active targeting, ordinary inspection, and resolved choice.
- Guide components and `copy/guide.ts`: demonstrations and accurate instructions.

Extend these components without a shared state machine or device-specific interaction branches.

### UX Flow

Encounter inspection stays pinned after selecting a planet, allowing the pointer to reach its actions safely.
Hover/focus previews an action; activation executes it.
Changing planet or entering study clears obsolete action previews.
Both charts' consequences must remain readable while the pointer stays on the action button.

Narrative targeting starts explicitly through the option and keeps that option visibly selected.
Eligible planets preview their actual effect in the readout and resolve on activation.
Outside targeting, planet activation continues to inspect safely.

Map route emphasis moves from selected-node state to hover/focus state.
Remove the confirmation ring and selected-node background-dismiss behavior.

The encounter guide currently holds examples using `pendingAction`.
Replace it with guide-only preview state, defaulting to Testimony in the action phase and permitting example changes without execution.
Closing the guide restores ordinary inspection/study state and clears transient previews.

## Implementation Plan

### Serial Dependencies (Must Complete First)

#### Phase 0: Shared controls

**Prerequisite for:** Encounter and narrative workstreams.

| Task | Description | Output |
|---|---|---|
| 0.1 | Run baseline client tests/build and inspect workspace changes. | Known baseline; unrelated work preserved. |
| 0.2 | Simplify the panel action API, add the read-only effect row, and adapt both consumers mechanically. | Compiling shared API without compatibility aliases. |
| 0.3 | Connect focus/blur to previews in `Chart` and the panel; preserve activation and sound semantics. | Pointer and keyboard preview support. |
| 0.4 | Update affected panel styles and remove arming styles. | Visible preview/focus feedback without toggle presentation. |

Keep the foundation and workstreams in one deliverable; do not release intermediate behavior.

### Parallel Workstreams

After Phase 0 these workstreams have separate primary files and can proceed independently or serially.
Assign shared panel, chart, and stylesheet changes to one owner to avoid overlapping edits.

#### Workstream A: Encounters and their guide

**Dependencies:** Phase 0.
**Can parallelize with:** B and C.

| Task | Description | Output |
|---|---|---|
| A.1 | Remove gameplay `pendingAction` in `EncounterCombat.tsx`; execute the selected planet's action on first activation. | Two-click turns. |
| A.2 | Derive effects, corona, and Light from the indicated action; clear stale previews on selection/study/turn transitions. | Correct preview and outcome. |
| A.3 | Replace armed guide examples, snapshots, and `CombatGuide` props with guide-only preview state. | Stable demonstrations that cannot commit. |
| A.4 | Update the encounter case in `chart-sounds.test.tsx` and add focused screen coverage. | Preview, first-activation commitment, and guide safety verified. |

#### Workstream B: Map navigation

**Dependencies:** Baseline check; otherwise independent of Phase 0.
**Can parallelize with:** A and C.

| Task | Description | Output |
|---|---|---|
| B.1 | Remove `selectedNodeId`, reset/dismiss logic, and the confirmation ring from `MapDiagram.tsx`. | One-activation travel. |
| B.2 | Highlight routes on hover/focus and preserve passive thumbnails. | Destination emphasis before travel. |
| B.3 | Update `map-sounds.test.tsx` for immediate travel, keyboard activation, and guide blocking. | Feedback only for accepted travel. |

#### Workstream C: Narrative choices

**Dependencies:** Phase 0.
**Can parallelize with:** A and B.

| Task | Description | Output |
|---|---|---|
| C.1 | Separate option hover/focus preview from selection; resolve untargeted options immediately. | One-activation choices with unchanged authored asides. |
| C.2 | Keep targeted option selection; preview eligible planets and resolve using the activated planet explicitly. | Option-then-target interaction. |
| C.3 | Replace narrative action buttons with the read-only actual-effect row. | Exact consequences remain visible. |
| C.4 | Preserve inspection, eligibility, cancellation, guide blocking, frozen result rows, and chosen-option highlighting. | Complete scene flow without stale selection. |
| C.5 | Rewrite `narrative-screen.test.tsx` around the new interactions, retaining resolver-result assertions. | Choice, healing, revival, and guide behavior verified. |

### Merge Phase

#### Phase 1: Copy, documentation, and integration

**Dependencies:** A, B, and C.

| Task | Description | Output |
|---|---|---|
| 1.1 | Update encounter/map/narrative copy in `client/src/copy/guide.ts` and affected guide anchors. | Instructions match behavior. |
| 1.2 | Consolidate affected `layout.css` changes and remove obsolete arming selectors while retaining targeting/result styles. | Consistent interaction presentation. |
| 1.3 | Update `CLAUDE.md`, `SCREENS.md` §3.6, `STYLE.md` §§7/12/13 and related armed-state descriptions, and `ENCOUNTERS.md` §§5.2/9. | Desktop priority and revised interaction/readout guidance. |
| 1.4 | Adjust the mobile follow-up in `spec/ROADMAP.md` and explicit mobile-stance reference in `MUSIC.md`; preserve unrelated audio guidance and archives. | No indirect requirement to maintain mobile parity. |
| 1.5 | Run final checks and the browser walkthrough; fix observed regressions within scope. | Reviewable implementation with validation results. |

## Testing and Validation

Use existing React/Vitest fixtures and screen tests, with one test per observable behavior.
Keep mechanics tests as regression coverage; the unchanged resolvers need no new tests.

- Encounter: inspect, preview both verbs through hover/focus without commitment, then activate once and verify the actor/verb and resulting preview agreement.
- Feedback/guides: rejected or guide-blocked actions stay silent; accepted actions commit and sound once.
- Map: hover/focus changes emphasis without travel; first activation travels; passive thumbnails remain inert.
- Untargeted narrative: hover/focus previews, then first activation applies the expected Light or group effect.
- Targeted narrative: preview multiple eligible planets, then activate one and verify its actual clamped healing/revival amount and resulting state.
- Narrative transitions: changing/canceling options clears targeting; target activation works without prior hover and uses the event's target.
- Resolution: existing duplicate-commit protection holds and the chosen narrative result remains highlighted.
- Keyboard: focus previews, Enter/Space activates once, and existing repeat suppression remains effective.

Use browser checks for preview geometry, native keyboard behavior, focus order, and sound timing that jsdom cannot establish.

## Rollout and Migration

Ship interaction, copy, and documentation together as a normal prototype update.
No feature flag, dependency installation, saved-data reset, or migration is needed.
Source rollback restores the previous interaction without changing stored game data.
Touch adaptation is deferred without adding a separate confirmation path.

## Verification Checklist

- [x] Before implementation, run `pnpm test` and `pnpm build` from `client/`; record existing failures.
- [x] After integration, repeat `pnpm test` and `pnpm build` from `client/`; both must pass.
- [x] Run `git diff --check` from the repository root.
- [x] Inspect residual matches from `rg -n 'pendingAction|onClearPending|tap.again|second tap|second click|again to confirm|again to travel|parity-first|is-arming' CLAUDE.md client/src client/tests spec/design spec/mechanics spec/ROADMAP.md`.
- [x] Start the local Vite server and exercise Map, Encounter, and Narrative using deterministic game fixtures; verify the existing `r` reroll control.
- [x] At 1440×900 and 1280×800, preview both encounter actions and execute with one action click; read the full projection without leaving the button.
- [x] Traverse a map node with one click, then repeat using the keyboard; verify route emphasis and one accepted travel sound.
- [x] Exercise untargeted narrative choice, clamped healing, and revival; verify click counts, actual readouts, and outcomes.
- [x] Enter targeting, preview multiple planets, change options, and cancel by background click and Escape; verify no gameplay effect before target activation.
- [x] Repeat main flows using Tab, Enter, and Space; verify visible focus and previews through normal mouse/keyboard transitions.
- [x] Open each guide, exercise examples, and close it; verify no turn, travel, purchase, or commit sound occurred.
- [x] Verify ordinary inspection/study, resolved-choice highlighting, normal animation/advancement, and reload of the resulting run.
- [x] Record final commands, results, and any browser limitations in the implementation handoff.

## Validation Results

Completed on 2026-09-15.

- Baseline: 228 tests and the client build passed.
- Final pre-commit check: all 239 tests across 33 files passed; TypeScript and the Vite production build passed.
- `git diff --check` passed; the active-file scan found no obsolete repeated-confirmation instructions or arming identifiers.
- Chromium walkthrough passed at 1440×900 and 1280×800 with no page errors: map travel, encounter actions, narrative choices, healing/revival, exact previews, Tab/Enter/Space, mixed pointer/focus behavior, guide guards, cancellation, advancement, and reload.
- Browser audio was muted; automated sound assertions passed in Vitest.

Commands used the cached pnpm 10.29.3 matching the installed dependencies:

```sh
cd client
node /Users/kronosapiens/.cache/node/corepack/v1/pnpm/10.29.3/bin/pnpm.cjs test
node /Users/kronosapiens/.cache/node/corepack/v1/pnpm/10.29.3/bin/pnpm.cjs build
```

The default pnpm 11 attempted a dependency reinstall and aborted; no dependencies were changed.
Vite still reports its existing large-chunk warning.
The local browser walkthrough is `/private/tmp/spaceprince-desktop-interactions.mjs`; screenshots are `/private/tmp/desktop-preview-{1440,1280}.png` and `/private/tmp/desktop-narrative-{1440,1280}.png`.

## Risk Assessment

| Risk | Ordinary user path and impact | Mitigation |
|---|---|---|
| Activation reads previous React selection. | A player clicks a narrative target and the wrong planet receives a persistent effect. | Pass the activated planet directly and assert the resulting state. |
| Removing the button removes the actual effect amount. | A player choosing healing or revival loses the exact consequence preview. | Preserve the amount in a read-only resolver-derived row. |
| Focus changes only the ring. | A keyboard player activates an action without its consequence preview. | Connect focus to preview callbacks and verify native keyboard flow. |
| Guide examples invoke live commitment. | A player studying instructions spends a turn or resolves a scene. | Retain commit guards and separate guide example state. |

The preview ceases when neither hover nor focus indicates it.
Accept that cost rather than adding preview locking; browser validation must establish that consequences remain readable in place.

## Open Questions

None outstanding for this change.
Preview legibility and keyboard focus order passed desktop browser validation.

## Decision Log

Only the direction approved in this conversation is recorded here.

| Agreed direction | Rationale |
|---|---|
| Prioritize desktop and defer mobile adaptation. | Current desktop quality should drive interaction design. |
| Remove repeated confirmation while retaining inspection and required target choice. | Hover/focus provides the preview; activation executes a complete choice. |
