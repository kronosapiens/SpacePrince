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
| Mint            | Birth-data input → chart computation → first chart view  | Not designed     |
| Title           | Entry point for returning players                        | Open question    |
| Prince select   | Pick which Prince to play (if player has multiple)       | Not designed     |
| Map             | Navigate the run's Sephirot-pattern node graph           | Prototyped (§4)  |
| Encounter       | Combat or narrative encounter — same screen, two modes   | Prototyped (§3)  |
| End-of-run      | "The world remembers" — the run's residue                | Not designed     |
| Chart study     | Inspect own chart between runs, with earned annotations  | Not designed     |

Dev-only:

- **Index.** Navigation between screens during development. Not part of the shipped game.

The current `client/` is a prototype. Nothing in it is canonical against this document. Where the prototype and this spec diverge, this spec wins, but neither is sacred — both can move.

---

## 3. Encounter Screen

The primary surface. Designed to morph between two modes — **combat** and **house narrative** — without semantic discontinuity. The same screen, with one slot rendering different content.

### 3.1 Layout (canonical / desktop)

- **Left half:** the player's chart, drawn per `STYLE.md §11`.
- **Right half:** the *what you're facing* slot.
  - In **combat**, this is another chart. NPC opponent — see §3.4.
  - In **house narrative**, this is a large glyph of the house's ruling planet, sized at multiple times the player's planet glyphs, with the planet's color halo per `STYLE.md §5`.

### 3.2 Layout (mobile portrait)

The two halves stack vertically — player's chart on top, the right-hand slot below. The "two charts face each other" framing translates from horizontal to vertical without semantic change. See `STYLE.md §13`.

### 3.3 Mode signals

Mode is signaled by the right-hand slot's content, not by chrome differences. The chart on the left looks the same in both modes; what's different is what it's facing. There is no "narrative mode banner" or "combat HUD." The world tells you what mode you're in by what's across from you.

### 3.4 NPC opponents

In combat encounters, the opponent's chart is a real player's chart (another minted Prince) pulled in as an NPC. Combat is single-player; the multiplayer dimension is purely as content source.

This means:

- Both sides render with the same chart visual language. No special "boss" or "enemy" styling.
- No visual cue that a chart is "yours" vs "someone else's" — they are both charts.
- The narrative framing of *whose* chart it is and *why* you're facing them lives in encounter setup, not in visual differentiation.

### 3.5 Visual climax

Activation propagates **within each chart** along that chart's own aspect lines, per the current prototype's `useCombatAnimation`. The chart is the living system; its internal web is what lights up.

There is no spine drawn between the two charts. The connection between them is conceptual (your planet faces theirs this turn), not visual. This is consistent with `VIBES.md` "the chart is a living system, and the propagation is its heartbeat" — the heartbeat is *internal* to the chart.

This applies to both modes. In a house narrative encounter, the propagation runs through the player's chart in response to whatever the encounter activates. The right-hand glyph (the ruling planet's archetype) is the framing, not the locus of action.

### 3.6 Chrome

Allowed:

- Turn indicator (where in the encounter sequence the player is).
- Decision/action affordances tied to the player's chart (selecting which planet to act with).
- Chorus fragment region for narrative encounters, sitting on negative ground per `STYLE.md §6` and §8.

Forbidden:

- HP bars, score readouts, or other game-UI register elements.
- Targeting reticles, attack/defend buttons, or any "battle" framing.
- Always-visible logs of past turns. Such logs are dev-only; see §8.
- Any chrome element that lives strictly to the left or right of one chart in a way that wouldn't survive vertical stacking on mobile (per `STYLE.md §13`).

### 3.7 Open questions

- Where the chorus fragment sits in the layout — above the right-hand glyph, below it, or in a dedicated region.
- How decisions are presented during a house narrative encounter — text below the spine, overlay, side panel, or other.
- Whether the player's chart visibly responds during a fragment (idle vs. animated). VIBES.md's "silence is a design tool" suggests the chart should quiet during fragments, not animate.
- Touch interaction model — see `STYLE.md §14`.

---

## 4. Map Screen

The second main surface. Renders the Sephirot-pattern node graph from `MAP.md`.

### 4.1 Layout

Centered diagram with breathing room, per `STYLE.md §10`. Nodes are interactive; edges are visible aspect-lines. The player's current position is highlighted; eligible next nodes pulse.

Chrome at the top of the screen, minimal — at least a way back to a higher-level surface, possibly run-meta information. Final shape TBD.

### 4.2 Mobile

Map scales down to width. Vertical scrolling is acceptable here (unlike encounter screens), since map navigation is inherently slow and exploratory.

### 4.3 Open questions

- Whether the player's chart is anchored somewhere on the map (e.g. a small inset top-left) or absent. Anchoring keeps the chart "always present"; absence keeps the map's diagrammatic logic clean. Worth prototyping both.
- How much information eligible nodes reveal pre-traversal — encounter type? ruling planet? nothing?
- Whether traversed nodes show a visible trace of what happened there, or just "visited."

---

## 5. Mint Screen

(Stub — to be designed.)

The first time a player touches the game. Receives birth data (latitude, longitude, timestamp), triggers on-chain chart computation per `CHART.md`, reveals the resulting chart with appropriate ceremony.

### 5.1 Constraints

- The reveal moment matches the weight of the act per `DESIGN.md`: *"Minting does not create identity; it recognizes it."* Not a "spinning loot box" reveal. Closer to "the chart was always going to be this one — you're just seeing it now."
- Birth-data input must be careful. Wrong input means wrong identity, and identity is permanent. UX needs to accommodate ambiguity (uncertain birth times, contested locations) without making the act trivial.

### 5.2 Open questions

- Date/time picker treatment. Ascendant calculation is sensitive to the minute; the input should reflect that without becoming a data-entry chore.
- Location input — coordinate picker, city search, or both?
- Whether the reveal is paced (chart components appear over time) or instant.
- Whether chorus fragments accompany the reveal, and from which planet(s).

---

## 6. End-of-Run Screen

(Stub — to be designed.)

What the player sees when a run ends. Per `DESIGN.md`: *"Failure is not punishment; it is acknowledgment. When a run ends, the world remembers."*

### 6.1 Constraints

- Quiet, not theatrical. No "GAME OVER" register.
- The chart is visible in its end state — combust planets dark, residual afflictions visible.
- A trace of the run (which nodes traversed, where it ended) is readable at a glance.

### 6.2 Open questions

- What persists between runs and how that's communicated here.
- Whether there is a chorus fragment specific to the ending mode (combust by Saturn vs. by Mars vs. exhausted at the lowest layer).
- Continue/restart affordances — and whether "restart" is even the right word for a game that treats runs as cumulative.

---

## 7. Chart Study Screen

(Stub — to be designed.)

Between runs, a place to look at one's chart at full size, possibly with annotations earned through play. This is the "interpretive depth replaces gear" payoff per `INFLUENCES.md` (Diablo lineage section).

### 7.1 Constraints

- The chart should feel like an artifact, not a stat sheet.
- Annotations earned through play (which planets you've activated, which aspects have propagated, which houses you've encountered) should be present but not loud.

### 7.2 Open questions

- Whether this is a separate screen or a "zoom in" mode of another screen.
- What annotations are earned and how they're presented.
- Whether this surface is the same as the on-chain NFT chart artifact, a richer view of it, or something distinct that draws from the same data.

---

## 8. Dev-Only Surfaces

The current prototype includes panels not intended for the shipped game — interaction logs, encounter event traces, debug indicators, an `Index` screen for navigation. These are gated behind a development toggle and never appear in production builds.

Dev surfaces are not the subject of this document beyond:

- They exist.
- They are visually separated from game UI so it's clear which is which.
- They do not constrain game-screen design — final-game chrome should not be designed around the assumption that dev panels will be present.

---

## 9. Title and Prince Select

(Stubs — to be designed.)

For returning players, an entry surface and (if they have multiple Princes) a selector. These are likely thin — the title screen may be a single chart-glyph splash; the prince select may be a horizontal carousel or grid of mini-charts.

Open question: whether title and prince select are separate screens or one combined "lobby" surface.

---

## 10. Navigation

The screen graph is small enough to draw in a sentence: *Mint → Title → Prince select → Map ↔ Encounter → End-of-run → Title*, with Chart study reachable from Title and from End-of-run.

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
