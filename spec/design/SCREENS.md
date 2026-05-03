# Space Prince — Screens

*The set of surfaces a player passes through, and the rules that hold them together.*

The chart is the player's anchor. Most of the game happens on a single screen — the encounter — that morphs between modes without losing visual continuity. Outside the encounter, the player navigates a small number of supporting surfaces.

This document specifies the screen architecture: which screens exist, what each one does, and how they relate. Visual treatment lives in `STYLE.md`. Felt qualities live in `VIBES.md`. Mechanical resolution lives in `MECHANICS.md` and `HOUSES.md`.

The guiding principle:

> **The chart is always present, even when it isn't visible.**

---

## 1. Approach

Space Prince is structurally closer to **FTL** than to **Slay the Spire**.

FTL keeps the player's ship visible at all times — combat, narrative, and exploration all happen against the same anchor. The narrative encounter isn't a different screen; it's a modal moment in the same view as the ship. StS, by contrast, splits combat (cards in hand, deck/discard) from events (painted backgrounds, choice text) into entirely separate screens, because card combat doesn't translate to a narrative beat.

Space Prince inherits FTL's logic. The player's natal chart is who they are, and most surfaces of the game are about the chart in a particular state. Combat encounters and house narrative encounters are *modes of the same encounter screen*, not separate screens — see §3.

This produces a small screen set: two main surfaces (encounter, map) and a handful of supporting ones for entry and exit (mint, end-of-run, chart study, prince select).

---

## 2. The Screen Set

Listed roughly in the order a player encounters them.

| Screen          | Primary purpose                                          | State            |
|-----------------|----------------------------------------------------------|------------------|
| Mint            | Birth-data input → chart computation → reveal ceremony   | Designed (§5)    |
| Title (lobby)   | Entry point; Prince selection (dropdown); Begin          | Designed (§9)    |
| Map             | Walk the Sephirot tree; one map per L1→L7 traversal      | Designed (§4)    |
| Encounter       | Combat (symmetric) or narrative (asymmetric column)      | Designed (§3)    |
| End-of-run      | Browsable history of the run's maps                      | Designed (§6)    |
| Chart Study     | Inspect own chart between runs (earned annotations)      | Stub (§7)        |

Dev-only:

- **Index.** Navigation between screens during development. Not part of the shipped game.

The current `client/` is a prototype. Nothing in it is canonical against this document. Where the prototype and this spec diverge, this spec wins, but neither is sacred — both can move.

---

## 3. Encounter Screen

The primary surface. Two distinct configurations — **combat** and **house narrative** — sharing one constant: the player's chart on the left.

The two configurations are different layouts, not modes of one layout. An earlier draft of this document framed them as a single morphing screen; that framing has been retired. The screens are related by what they share (the player chart) and by their place in the run flow, not by being the same layout with different content.

### 3.1 Combat layout (symmetric)

- **Left half:** the player's chart, drawn per `STYLE.md §11`.
- **Right half:** the opposing NPC chart, drawn with the same chart visual language. See §3.4.
- **Center seam:** narrow chrome region carrying turn cadence and opponent-of-the-turn indicator. Chrome rules per §3.7.

The two charts face each other as equals. There is no visual differentiation between "yours" and "theirs" beyond their position.

### 3.2 Narrative layout (asymmetric)

- **Left half:** the player's chart, drawn per `STYLE.md §11`.
- **Right half:** a three-band column carrying the narrative encounter:
  - **Top band — Aria:** the ruling planet's glyph paired horizontally with a single chorus fragment in that planet's voice. The persistent presence of the encounter — fades in once at encounter open and remains throughout. The planet glyph is rendered with its color treatment per `STYLE.md §5`; the fragment in Cormorant Garamond per `STYLE.md §6`.
  - **Middle band — Narrative:** the current decision node's narrative text. Updates per node.
  - **Bottom band — Options:** the 2–3 decision options for the current node. Updates per node.

The aria does not re-pulse on node transitions; only the middle and bottom bands change. Per `PLANETS.md §1`, **one fragment per encounter, not per node** — the aria carries the whole encounter, while the narrative text in the middle band does the per-node framing.

### 3.3 Mobile portrait

Both layouts stack vertically.

- **Combat:** player's chart on top, opponent's chart below. Center-seam chrome relocates to a horizontal band between them.
- **Narrative:** player's chart on top, then aria, narrative text, options.

In both cases the vertical stacking preserves the semantic relationship between the chart and what it faces. See `STYLE.md §13`.

### 3.4 NPC opponents (combat)

The opponent's chart is a real player's chart (another minted Prince) pulled in as an NPC. Combat is single-player; the multiplayer dimension is purely as content source.

This means:

- Both sides render with the same chart visual language. No special "boss" or "enemy" styling.
- No visual cue that a chart is "yours" vs "someone else's" — they are both charts.
- The narrative framing of *whose* chart it is and *why* you're facing them lives in encounter setup, not in visual differentiation.

**Asymmetric matchups are expected.** The opponent renders with whatever planets that source Prince has actually unlocked at the time of matching, regardless of the player's own unlock tier. A Run-1 player with only the Moon may face a fully-charted opponent — turn count is bounded by the *player's* unlocked planet count, so encounters remain short. The asymmetry is part of the tutorial: the player learns to read chart complexity from the outside before they have it themselves. Subject to balance review during playtesting.

### 3.5 Visual climax

**Combat.** Both charts' propagations animate **simultaneously** — when a turn resolves, the player-chart and opponent-chart both light up their internal aspect webs at the same time. Activation propagates within each chart along that chart's own aspect lines; there is no line drawn between the two charts. The connection between them is conceptual (your planet faces theirs this turn), not visual.

The total turn animation budget is roughly **3–4 seconds**, intentionally long enough to mask a Starknet transaction confirmation while preserving visual energy. See `STYLE.md §7` for the per-motion durations.

**Narrative.** During the **decision phase**, the player's chart is *gently active* — planets that gate a current option (per `HOUSES.md §4.3` chart-conditioning) carry a soft Field-layer halo so the player can see *why* the option exists. On **resolution**, affected planets receive plain state-change flashes (testimony or affliction gained, combust applied). No propagation through aspect lines — propagation is a combat-only language. The aria does not animate during resolution; it remains the steady framing presence.

### 3.5.1 Affliction badges

Affliction badges are visible on gameplay chart surfaces even when the value is zero.
This applies to the Map chart anchor, the Combat encounter charts, and the Narrative encounter chart.
Affliction badges are hidden on entry and exit surfaces: Title, Mint / Start, and End-of-run.
Chart Study follows the gameplay rule because its purpose is to inspect current chart state.

### 3.6 Interaction grammar

The player's only per-turn action in combat is choosing which of their planets acts (the opponent's planet is system-selected). The grammar is the same on touch and desktop.

- **First tap on a planet:** preview. The chart highlights the aspects this planet would fire and the consequences the choice would carry. The inspected planet receives a thin gold selection ring.
- **Second tap on the same planet:** commit. The turn resolves.
- **Tap a different planet:** preview switches to that planet (not a commit).
- **Tap an opponent planet:** preview-only. Surfaces the same information as own planets. No commit; opponent planets are not actable.
- **Hover (desktop only):** ambient preview. Same information as tap-preview, but free. Hover is additive — never a commit gesture and never a substitute for tap.

In narrative encounters, the same grammar governs *inspecting* the chart. Decision options are committed by single-tap on the option — each option's text label is itself the commit affordance, no separate confirm step.

### 3.7 Chrome

The encounter screen is allowed restrained, functional chrome where it does necessary work — telling the player whose turn it is, what the run state is, and how to leave. The aesthetic remains *sparse and ethereal* (per `VIBES.md`), but that is an aesthetic provocation, not a hard ban on UI text.

**Allowed:**

- **Distance readout.** The run's accumulating score (per `MECHANICS.md §14`). Visible during encounters. Functional type at small size.
- **Turn cadence indicator.** A row of dots showing position in the encounter's turn sequence — one dot per turn, filled to the current position.
- **Opponent-of-the-turn indicator.** Text + glyph identifying which opponent planet is acting this turn (e.g. "ANSWER MERCURY ☿"). Lives in the center seam between charts in combat.

**Out:**

- Section titles ("ENCOUNTER", "MAP") on the screens themselves — the player knows where they are.
- The wordmark "SPACE PRINCE" inside the encounter — it lives on the title screen.
- Instructional hints ("Hover a planet to inspect. Click a planet to act.") — the grammar should be discoverable; if it isn't, that's a structural failure to fix, not to paper over with copy.
- HP bars, "+N attack" registers, blockbuster game-UI flourishes.
- Always-visible logs of past turns (those are dev-only).
- Run-management affordances inside an active run. There is no in-game "abandon" or "new voyage" while a run is in progress; runs continue until full combust regardless of session breaks. The prototype's "New Voyage" button is a development artifact.

### 3.8 Mode and scene transitions

Transitions between major surfaces fade through the Void canvas with an active-planet tint shift, ~1000ms in each direction:

- **Map → Encounter** inherits the "Encounter open" 1200ms ease-out from `STYLE.md §7`.
- **Encounter → Map** is a faster ~600ms fade (the player is leaving, not arriving).
- **Encounter → End-of-run** (on full combust): a slower fade, ~1800ms, matching the combust motion's weight.

### 3.9 Open questions

- Whether the player's chart should pulse, idle, or stay completely still during the *fragment fade-in* moment specifically (distinct from the broader decision phase, which is settled — gating planets pulse).
- Map traversal interaction model (separate from encounter interaction — see §4).
- Accessibility (color-channel parallel signal).

---

## 4. Map Screen

The second main surface. Renders the Sephirot-pattern node graph from `MAP.md` against a Void canvas.

### 4.1 Layout

- **Centered diagram** with breathing room — at least 15% margin on each side, per `STYLE.md §10`.
- **Chart anchor:** a small inset of the player's chart in the **top-left corner**, ~15–18% of viewport width. Shows current state (combust grayed, afflicted with numeric badges per the chart-rendering rules in `STYLE.md §11`). The "chart is always present" principle (§1) made literal on this surface. **Unlock moments** happen here: when the player surfaces back from a completed encounter that crosses a Macrobian threshold (cumulative encounters 1, 2, 4, 8, 16, 32, 64 — per `MECHANICS.md §13.1`), the newly unlocked planet appears in its computed sign on the anchor with a small ceremony — the ghost emerges into full visual treatment.
- **Distance readout** in the same position and treatment as the encounter screen (per §3.7).

### 4.2 Nodes

Two content types, distinguished by shape and fill. Both share the same outer disc footprint so the diagram reads as one network of nodes; the *content inside* the disc tells you what kind of beat it is.

- **Combat node:** thin disc-ring outline plus an eight-pointed star inside, filled with the opponent's **chart ruler** color — the planet ruling the opponent's Ascendant sign. The star extends slightly past the disc rim. Reads as *"another chart waits here, anchored by [planet]."*
- **Narrative node:** filled disc in the color of the house's natural-zodiac ruler (table in §4.5). Reads as *"this is [planet]'s domain."* The house Roman numeral appears at the node center.

The color rule is the same on both axes: a single principled astrological lookup picks the identifying planet. For narrative, it's the house's natural ruler; for combat, it's the opponent's chart ruler. See §4.5 for the sign→ruler table both lookups consume.

Each node also has one of four **temporal states** relative to the player's current position. Together with content type, the state determines what's rendered:

- **Current** — the player's standing position. Node radius stays the same as every other state — emphasis comes from the active-planet halo (planet-color radial gradient), a colored ring around the disc, and a slightly heavier disc stroke. There is exactly one current node per map.
- **Eligible-next** — every node **one edge away** from current that the player hasn't already visited and isn't behind them in the topology. Includes forward-layer neighbors *and* same-layer (horizontal) siblings, so a "sidestep" along the current layer is allowed. Rendered with full content at full saturation. The eligible set surfaces a soft pulse on entry per the "Map node arrival" motion in `STYLE.md §7`. Backtracking is still impossible — once visited, a node is locked out, so a sidestep is a one-way street.
- **Traversed (past)** — nodes on the player's walk-path so far, excluding current. Full content visible but **at reduced opacity (~0.35)**. The shape and ruler color are preserved so the player can read the path they came from; the desaturation says "this is memory, not action."
- **Distant** — every other node. Always rendered as **unfilled outline circles only**, regardless of whether the topology is exposed. No content visible, no glyph, no ruler color. The road ahead is geometry; what waits on it is unknowable until the player approaches.

Distant nodes therefore render the same whether or not their content has been rolled. **Knowing what's there is a function of where the player stands**, not a function of internal state. This preserves the "diagram of emanation" feel from `VIBES.md`: meaning concentrates near the player and dissolves into potential at distance.

The progression from outline (distant) to full saturation (eligible) to full saturation + halo (current) to desaturation (past) reads as a wave passing across the map.

Click/tap on a traversed node will eventually reveal an outcome detail popup (especially relevant in the end-of-run map browser, per `§6.1`). Treatment TBD.

### 4.2.1 Determinism

A map's full visual state — topology, content per node, walk-path so far, and current position — is **deterministically derived from a single seed**. Re-rendering the same seed always produces the same map and the same point along the walk. This matters for two reasons: it lets the player share a specific run state via URL, and it lets dev tooling reproduce exact map states for screen-iteration work.

Walk derivation in dev mode: from the seed, walk 1–5 forward steps from L1 along eligibleNext (deterministic seeded RNG), with the final node becoming current and intermediate nodes becoming traversed. In real gameplay the walk is the player's actual history, but the same deterministic principle applies to topology + content rolls.

### 4.3 Lazy node generation

Nodes are not all rolled at map-generation time:

- The **topology** is fixed at map generation (per `MAP.md`).
- **Encounter content** (combat opponent, or narrative house) is rolled only for the *current* node and the *eligible-next* nodes.
- As the player traverses, newly-eligible nodes get rolled. Once rolled, content is stable.
- Distant nodes render as small unstyled placeholders (per §4.2) until they enter the eligible frontier.

The map manifests as the player approaches it — distant nodes are placeholders; near nodes are charged with content. This honors the "diagram of emanation" feel from `VIBES.md`: meaning concentrates near the player and dissolves into potential at distance.

**Roll parameters:**

- **Combat-to-narrative ratio:** **50/50**. Refine in playtesting — earlier drafts ran a φ:1 (62/38) combat-heavy split, but rebalanced to give narrative beats equal footing in a run.
- **House assignment** (for narrative nodes): **uniform random over the 12 houses, with a "no immediate repeat" rule** (a freshly-rolled narrative node cannot be the same house as the player's most-recent narrative node). Position-derived house assignment (upper layers = elevated houses, lower = grounded) is reserved for v2 if it earns its weight in playtesting.
- **Combat opponent assignment:** the matchmaker pulls a real other-player Prince per `§3.4` (asymmetric matchups expected).

### 4.4 Mobile

Map scales down to width. Vertical scrolling is acceptable here (unlike encounter screens), since map navigation is inherently slow and exploratory. The chart anchor relocates to the top of the screen, above the map.

### 4.5 House → ruler mapping (color rule)

Narrative nodes are colored by their house's **natural-zodiac ruler** (the classical seven-planet rulership of the sign that naturally corresponds to the house number — Aries=1, Taurus=2, etc.):

| House | Natural sign | Ruler |
|-------|--------------|-------|
| 1 | Aries | Mars |
| 2 | Taurus | Venus |
| 3 | Gemini | Mercury |
| 4 | Cancer | Moon |
| 5 | Leo | Sun |
| 6 | Virgo | Mercury |
| 7 | Libra | Venus |
| 8 | Scorpio | Mars |
| 9 | Sagittarius | Jupiter |
| 10 | Capricorn | Saturn |
| 11 | Aquarius | Saturn |
| 12 | Pisces | Jupiter |

This is the **rulership** axis, distinct from the **joys** axis used mechanically in `HOUSES.md §3.3`. Rulership is the visual color anchor on the map; joys remain the mechanical character of each house.

### 4.6 Map ambient tint

Between encounters, the map's ambient tint **fades to neutral** — no active planet to color the world. The map is a contemplative between-surface; let it breathe.

### 4.7 Open questions

- Outcome-detail popup treatment for traversed nodes (when clicked in the end-of-run map browser).

---

## 5. Mint Screen

The player's first touch. Three beats: input, confirmation, reveal. Each is irreversible at its end.

### 5.1 Beats

**Input.** The player enters birth date, time (quantized to 15-min buckets per `NFT.md`), and location. As inputs progress, a faint scaffold of the chart wheel begins to take shape — sign divisions appearing at hairline weight, the wheel becoming legible. Geometry stabilizing, not generating.

**Confirmation.** A single explicit confirmation step. *"This position may only be recognized once."* The friction is intentional — wrong input is permanent identity.

**Reveal.** The staged Macrobian ceremony (§5.2).

### 5.2 The Reveal — staged Macrobian unfolding

After confirmation, the chart wheel is computed on-chain (per `CHART.md`). During the on-chain transaction's confirmation window, the seven planets paint in **one at a time, in Macrobian order**:

> Moon → Mercury → Venus → Sun → Mars → Jupiter → Saturn

Each planet appears at its computed sign placement, in its glyph and color, separated by ~2–3 seconds. The total ceremony runs roughly 15–20 seconds — intentionally long enough to mask the on-chain compute and to give the act its weight. After all seven planets have appeared, the chart sits whole for a brief held moment.

This is the **only time** the player sees their full chart until cumulative encounter 64.

The chart then **gates back** to its starting state: the Moon remains in full visual treatment, the other six planets recede to **ghost** (hairline outline, no color), per `NFT.md` and `MECHANICS.md §13.1`. The player is left with what they currently have access to.

Future unlocks (per `MECHANICS.md §13.1`) reveal one planet at a time *between encounters*, not in a single ceremony. The mint is the only staged unfolding in the game.

### 5.3 NFT artifact

The NFT renders the player's chart at its current unlock state — Moon visible, the other six as ghosts from minute one. The artifact evolves alongside in-game unlocks per `NFT.md`. There is no standing "preview" of the full chart in the artifact; a verification preview surface (e.g. for wallets) can be added later if needed.

### 5.4 Constraints

- *"Minting does not create identity; it recognizes it."* The reveal is recognition, not generation. Not a spinning loot box; closer to *"the chart was always going to be this one — you're just seeing it now."*
- Birth-data input must accommodate ambiguity (uncertain birth times, contested locations) without trivializing the act.

### 5.5 Open questions

- **Date/time picker treatment.** The 15-min quantization should be reflected in the picker — not "type any time" but "select your slot."
- **Location input.** City search, coordinate picker, or both? Likely both, with city search as the primary affordance.
- **Chorus fragments at mint.** None, the Moon at the end, or one per planet during the unfolding? Per `VIBES.md` "silence is a design tool," lean is **no chorus at mint** — the chart's appearance is itself the moment. The Moon's voice can arrive at the first encounter instead.
- **Failed mints.** Handled by the Cartridge Controller wallet's transaction UI; the game does not invent a custom error surface. If the mint transaction fails or is rejected, the player remains on the Mint screen and can retry through the Controller flow. The 15–20s reveal ceremony begins only after the on-chain confirmation lands.

---

## 6. End-of-Run Screen

What the player sees when a run ends — that is, when **all seven of the player's planets have combust** (per `MECHANICS.md §13`). *"Failure is not punishment; it is acknowledgment. When a run ends, the world remembers."*

A run typically spans multiple maps. End-of-run is the wrap of the entire arc, not the end of any single map.

### 6.1 The map browser

End-of-run is **the run's map history, browsable**. The player can page through every map they walked, in order, with the path-trace and outcomes preserved on each.

The current chart in end state is *not* shown here — it's always all-combust, and showing it adds nothing the player doesn't already know.

- Maps appear as a horizontal carousel or sequence — first map leftmost, last (where final combust occurred) rightmost.
- Each map renders at full fidelity when selected. The player can revisit each, click through, and see what happened at each node (traces per `§4.2`).
- The interaction is paginating between maps and inspecting nodes.

Reads as: *here is what you walked. Walk it again, in your mind.*

### 6.2 Constraints

- Quiet, not theatrical. No "GAME OVER" register.
- The map browser is the dominant register. Small chrome can carry Distance final and achievements (per `§3.7`), but they don't earn their own zone.

### 6.3 Affordances

- **Begin new run.** Generates a new starting map and resets chart state (afflictions and combusts cleared). The player's accumulated encounter count and unlocks persist — that's the lifetime layer.
- **Return to Title.** Step out, decide later.

There is no "restart this run" or "abandon run" affordance — at end-of-run, the run is already over.

### 6.4 Open questions

- **Run journal.** A visible record of past runs (one line each: # maps completed, Distance final, etc.)? Candidate lifetime-progression surface. Out of scope for v1; flagged.
- **Chorus on end-of-run.** Currently deferred — possible later detail (e.g. the planet that delivered the final combust speaks one fragment).

---

## 7. Chart Study Screen

A "quiet mode" of the Title screen for sitting with one's chart.

### 7.1 Entry and exit

- Entered by tapping the chart on the Title (per `§9`).
- On entry: the wordmark fades, the Begin affordance recedes, the chart sits alone on a clean Void canvas.
- Exited by tapping outside the chart, or by tapping the chart again.

### 7.2 Inspection grammar

Chart Study supports the same **tap-to-inspect / hover-to-preview** grammar as combat (per `§3.6`), minus the commit step:

- Tap a planet → its aspect lines highlight, the planet receives its inspection ring.
- Hover (desktop) → ambient preview, same surface.
- Tap elsewhere → preview clears.

There is no commit. The point of Chart Study is to look at the web, not to act on it.

### 7.3 What's shown in v1

The chart at full size, in its current state — combust grayed, afflictions visible per the chart-rendering rules in `STYLE.md §11`.

No earned-annotation layers in v1. The chart-at-rest is the artifact.

### 7.4 v2 evolution path

Future additions can layer on top of v1 without restructuring:

- Aspects that have propagated in play stay subtly brighter at rest.
- Houses encountered in narrative encounters get a small Field-layer flourish in their wedge.
- Lifetime activation count per planet (revealed on hover, not always visible).
- Fragment archive — chorus quotes the player has heard, browsable.

These are deferred. The interpretive-depth payoff (per `INFLUENCES.md`) is delivered in v1 by the chart's visible state changes during play; richer annotation comes later.

### 7.5 Relationship to NFT

Chart Study renders the **same chart** as the NFT artifact (per `NFT.md`). No client-only enrichments in v1. Future annotations would be in-app overlays, not modifications to the canonical on-chain artifact.

---

## 8. Dev-Only Surfaces

The current prototype includes panels not intended for the shipped game — interaction logs, encounter event traces, debug indicators, an `Index` screen for navigation. These are gated behind a development toggle and never appear in production builds.

Dev surfaces are not the subject of this document beyond:

- They exist.
- They are visually separated from game UI so it's clear which is which.
- They do not constrain game-screen design — final-game chrome should not be designed around the assumption that dev panels will be present.

---

## 9. Title (Lobby)

A combined lobby surface — the player's entry point, also serving as Prince selection for the rare player with multiple Princes.

### 9.1 Layout

- **The player's chart fills the canvas** at full size, in its current unlock state (Moon visible early, ghosts for the rest). The chart is who they are; standing on the title is standing in front of yourself.
- **Wordmark "SPACE PRINCE"** appears small at the top. This is the only screen where the wordmark exists.
- **One primary affordance:** **Begin** (see §9.2).
- **Chart Study** as a quiet secondary affordance (per `§7`).

### 9.2 Begin — state-dependent

The Begin affordance's meaning depends on game state:

- **If a run is in progress** (no end-of-run has fired), Begin = *continue* — drops the player back at the Map (their last surface in that run).
- **If no run is in progress** (post-end-of-run, or never run), Begin = *new run* — generates a fresh starting map and begins.

The button does not label its branches. The world tells the player which they did, by where they land.

Active runs must be completed (full combust). There is no abandon-run affordance — see `§3.7`.

### 9.3 Prince selection

For players with multiple Princes, a small **dropdown** lets them switch the lobby's chart between their Princes. Visually quiet. The dropdown is hidden if the player has only one Prince. Most players will.

### 9.4 First arrival (no Prince yet)

A new player landing here without a minted Prince sees a shorter version of this surface:

- A blank canvas (no chart).
- The line *"A position has not yet been recognized."*
- A single affordance: **Recognize a Position**, which leads to Mint (`§5`).

This preserves the *recognition* tone from the archived `v1/ONBOARD.md` minute 0–1 without that doc's ten-minute arc.

### 9.5 Settings, account, wallet

Account, wallet, and configuration management are **not** in-game surfaces. They live in the **Cartridge Controller** web wallet's config modal, accessed once the user is logged in. The game does not duplicate that surface.

---

## 10. Navigation

The screen graph is small enough to draw in a sentence: *Mint → Title (lobby) → (Map ↔ Encounter, looping; new maps generate after each L7 completion) → End-of-run (only on full combust) → Title*. Chart Study is reachable from Title and from End-of-run.

In the current dev prototype, navigation is via the Index screen and direct routes (`/map`, `/encounter`, `/narrative`). Final-game navigation is mostly implicit — the world advances you through screens — with a small persistent way back to higher-level surfaces from any point.

Forbidden:

- Hamburger menus.
- Tab strips that expose all screens at once.
- Breadcrumbs.

The world does not need a wayfinding overlay. The player knows where they are because the screen tells them by being itself.

---

## 11. Relationship to Other Specs

- `STYLE.md` — visual treatment and layout rules. This document specifies *which surfaces exist*; STYLE.md specifies *how they look*.
- `VIBES.md` — felt qualities, voice register, sound design. Drives the tone each screen should hit.
- `MAP.md` — map topology (rendered on the Map screen).
- `CHART.md` — chart computation (rendered on the Encounter screen and Chart Study).
- `HOUSES.md` — house encounter mechanics (drives the narrative mode of the Encounter screen).
- `MECHANICS.md` — encounter resolution (drives both modes of the Encounter screen).
- `NFT.md` — the on-chain SVG chart artifact (related to but distinct from the Chart Study surface).
- `PLANETS.md` — planetary voices (chorus fragments appear in narrative encounters).
