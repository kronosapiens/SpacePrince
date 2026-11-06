# Space Prince — Screens

*The set of surfaces a player passes through, and the rules that hold them together.*

The chart is the player's anchor.
Most of the game happens on the encounter screen, in one of two configurations that share the player's chart.
Outside the encounter, the player navigates a small number of supporting surfaces.

This document holds the screen architecture: which screens exist, what each one does, and the rules that hold them together.
It records intent and constraints, not composition.
Where a surface puts things, how large, how far apart, and how fast is decided in the running client, and each value lives beside the code that uses it (`client/src/style/layout.css` and the token files named in `CLAUDE.md`).
Visual vocabulary lives in [STYLE.md](STYLE.md).
The experience the surfaces serve is described in [intent.md](../intent.md).
Mechanical resolution lives in [MECHANICS.md](../mechanics/MECHANICS.md) for combat and [ENCOUNTERS.md](../mechanics/ENCOUNTERS.md) for narrative encounters.

Where this document says what is built, it describes the local prototype; where it describes mint transactions, wallets, or other Princes as opponents, it describes the intended onchain game.

The guiding principle:

> **The chart is always present, even when it isn't visible.**

---

## 1. Approach

Space Prince is structurally closer to **FTL** than to **Slay the Spire**.

FTL keeps the player's ship visible at all times — combat, narrative, and exploration all happen against the same anchor.
The narrative encounter isn't a different screen; it's a modal moment in the same view as the ship.
StS, by contrast, splits combat (cards in hand, deck/discard) from events (painted backgrounds, choice text) into entirely separate screens, because card combat doesn't translate to a narrative beat.

Space Prince inherits FTL's logic.
The player's natal chart is who they are, and most surfaces of the game are about the chart in a particular state.
Combat encounters and house narrative encounters are *modes of the same encounter screen*, not separate screens — see §3.
The client makes this literal: one layout owns the player's chart across the title, the mint, the map, and both encounter configurations (`GameLayout` and `PlayerChartLayout`), and each surface supplies only what sits beside it.

This produces a small screen set: two main surfaces (encounter, map) and a handful of supporting ones (mint, title, inspection).

### 1.1 Client honesty

All game state is public onchain data; a determined player can derive anything the chain has published.
The client honors this as a rule: **it never presents derivable information as unknowable, and never frames a decision as a gamble whose outcome is already determined and readable.**
Fake mystery loses to a block explorer, and a choice made against pretend-uncertainty is a lottery, not a commitment.

Two boundaries keep the rule workable:

- **Curation is not concealment.**
  The client may foreground a summary and leave depth to other surfaces — a combat node shows the opponent's chart *ruler*, not the whole chart — so long as it never asserts that the rest is unknown.
- **Ceremonial pacing is not hiding.**
  The mint reveal dramatizes the arrival of knowledge; it withholds nothing from a choice.
  The rule bites only where the player is asked to *decide*.

When a design genuinely needs hidden information, it must be hidden onchain — entropy that doesn't exist yet (the per-map VRF draw, [MAP.md §4](../mechanics/MAP.md#4-seeding)) or a commitment scheme — never client-side concealment.

### 1.2 Player-facing register: no martial language

The game is about creating and relieving tension — being *with* others — and the player-facing vocabulary carries that.
The surfaces are **Map**, **Encounter**, and **Narrative**; the encounter shows **self** and **other**.
Affliction builds tension, testimony relieves it; planets combust and return; nothing fights, wounds, or wins.
Generated other-charts are named `Other N`, never `Adversary`.

**Combat, adversary, and opponent are internal vocabulary** — the developers' easy metaphor for the interaction (`MECHANICS.md`, code identifiers, this spec's internals).
They do not reach player prose: not the openings, the scenes, the primer, the help, or labels and summaries.
The mechanical terms the player sees are the verbs Afflict/Testify, the operational readouts Resolve and Fortune, and Light.
The underlying stats are **affliction, testimony, Resolve, and luck**.

**The guides are the deliberate exception.**
The screen guides (`client/src/copy/guide.ts`) and help (`client/src/copy/help.ts`) gloss the verbs in plain conventional game words — damage, heal, knocked out — because playtesters needed a vocabulary they already had before the game's own could mean anything.
That choice was made on purpose and confirmed when the encounter openings shipped ([#27](https://github.com/kronosapiens/SpacePrince/issues/27)); the guides are not to be rewritten against this register.
Whether the game's own words can eventually carry the first encounter is the question under [#22](https://github.com/kronosapiens/SpacePrince/issues/22) and [#26](https://github.com/kronosapiens/SpacePrince/issues/26).

**Casing.**
Named quantities are capitalized in prose — **Resolve, Fortune, Light** — the capital marking the term of art against the common noun ("resolving affliction restores the margin below its Resolve").
Other substances, processes, and stats stay lowercase — affliction, testimony, tension, combustion, aspects, and luck in flowing text; the fortune roll is a process and stays lowercase.
Verbs follow mention vs use: named as actions they are capped ("choose Afflict or Testify"); used as English they are not ("afflict their actor before it swings").
Display labels — table headers, stat lines, the uppercase micro-type (SELF, OTHER) — take title or upper case as chrome styling, independent of prose casing.
Personification rides the capitalized form ("Fortune turns at the crossing").

On player surfaces the named terms render in **gold** (`--gold`) — accent color replaces bold, the game-vernacular form of emphasis, and gold is already the attention color (selection rings, card titles, the chart ring).
Gold marks terms of art only, never free emphasis; the wrapping is mechanical (`TermText`), keyed off the capitalized forms, so copy stays plain strings.
Rejected: coloring Afflict/Testify by their valence colors in prose — running text becomes confetti, and amber/violet stay reserved for live action on the board.

---

## 2. The Screen Set

Listed roughly in the order a player encounters them.

| Screen          | Primary purpose                                                        | State                                   |
|-----------------|------------------------------------------------------------------------|-----------------------------------------|
| Title           | Entry point; Begin or Continue; the chart to look at                   | Built (§9)                              |
| Primer          | Framing at first arrival; the codex glossary from the settings menu    | Framing and glossary built (§9.6)       |
| Mint            | Birth-data input → chart computation → reveal ceremony                 | Built locally, no transaction (§5)      |
| Map             | Walk the Sephirot tree; one map per L1→L7 traversal                    | Built (§4)                              |
| Encounter       | Combat (symmetric) or narrative (asymmetric column)                    | Built (§3)                              |
| Inspection      | Planets inspected in place; the Prince artifact from the settings menu | Built (§7); earned layers open (#32)    |

Dev-only and auxiliary routes: `/__index` (navigation and reset during development), `/gallery` (the design gallery of components, palettes, and themes), `/token` (a random Prince artifact preview).
None is part of the shipped game's navigation (§8).

The `client/` prototype is where composition is decided; this document is where intent and constraints are kept.
Where the two diverge on a placement, a size, or a timing, the client is current and this document is stale.
Where they diverge on a rule stated here, that is a discrepancy to investigate and resolve, not a rule the client has quietly changed.

---

## 3. Encounter Screen

The primary surface.
Two distinct configurations — **combat** and **house narrative** — sharing one constant: the player's chart on the left.

The two configurations are different layouts, not modes of one layout.
An earlier draft of this document framed them as a single morphing screen; that framing has been retired.
The screens are related by what they share (the player chart) and by their place in the run flow, not by being the same layout with different content.

### 3.1 Combat layout (symmetric)

The player's chart and the other's chart, side by side as equals, drawn in one visual language (§3.4).
There is no visual differentiation between yours and theirs beyond position.
Nothing sits between them: no seam, no divider, no centre column.
The acting planet, its verb, and its magnitude are all drawn on the charts themselves (§3.5.1) and named once in the sentence (§3.7).
The chrome sits above and below the wheels rather than beside them, so the charts have the width.

Rejected: a dividing rule between the charts.
Two complete gold rings, two planet arrangements and two labels already state the separation, and a divider is the one kind of mark this world has no place for — it exists only to partition a screen, where every other mark is something the game is made of.

### 3.1.1 Wheel size

The wheels are sized from the viewport with no upper bound — bigger is more legible, and the limit should be the screen rather than a chosen maximum.
The chart is round and its box is square, so the box's corners are empty; the chrome above and below reaches into them rather than reserving bands of its own, and the charts keep the height too.
The border, the overlap, and the height budget the wheel is sized from are decided in `client/src/style/layout.css`, beside the values, with the reasoning as comments.

### 3.2 Narrative layout (asymmetric)

- **Left half:** the player's chart, drawn per [STYLE.md §11](STYLE.md#11-the-charts-visual-treatment).
- **Right half:** a column carrying the narrative encounter, top to bottom:
  - **Heading:** the house's coin in its fixed game ruler's colour, the house name, and its one-line gloss — the steady presence of the encounter.
  - **Prompt:** the scene's text, replaced by its specific consequence after commitment.
  - **Occupants:** one line naming the planets in the house and how their dignity changes the terms, when any planet occupies it.
  - **Options:** the single decision's options, each with its aside of costs and effects after occupant terms, and a reason when it cannot be taken.
  - **Light:** the run's total.

The heading stays put while the player selects targets and the decision resolves.
The copy rules for each piece are in [ENCOUNTERS.md §9](../mechanics/ENCOUNTERS.md#9-prose-and-mechanical-copy).

### 3.3 Mobile portrait (deferred)

Mobile adaptation is deferred while desktop takes priority.
These layout sketches can inform later work without constraining desktop interactions.
Both layouts stack vertically.

- **Combat:** player's chart on top, the other's chart below.
  The chrome stays above both, so the turn and the encounter's rule are read before scrolling.
- **Narrative:** player's chart on top, then the heading, prompt, and options.

In both cases the vertical stacking preserves the semantic relationship between the chart and what it faces.
See [STYLE.md §13](STYLE.md#13-layout-and-viewport).

### 3.4 NPC opponents (combat)

Intended: the opponent's chart is a real player's chart (another minted Prince) pulled in as an NPC.
Combat is single-player; the multiplayer dimension is purely as content source.
The prototype stands in with seeded charts computed from real ephemeris positions, named `Other N` ([MECHANICS.md §3](../mechanics/MECHANICS.md#3-chart-generation)).

This means:

- Both sides render with the same chart visual language.
  No special "boss" or "enemy" styling.
- No visual cue that a chart is "yours" vs "someone else's" — they are both charts.
- The narrative framing of *whose* chart it is and *why* you're facing them lives in encounter setup, not in visual differentiation; today that framing is the opening sentence and the rule beneath the wheels (§3.7).

**Mirrored matchups.**
The opponent fields exactly the planets the player has unlocked — Moon vs Moon at the first encounter, two-vs-two next, up to seven-vs-seven (per [MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)).
The other's chart still has its own placements; only its *fielded* roster mirrors the player's tier, so the unfielded planets render as ghosts on the opponent side too.
This keeps early fights fair and legible — one planet read against one — and lets chart complexity grow symmetrically on both sides as the player ascends.
Earlier drafts used asymmetric matchups, a single-planet player against a full chart, as a read-the-complexity-from-outside tutorial; mirroring replaces that in favor of accessibility, subject to balance review during playtesting.

### 3.5 Visual climax

**Combat.**
The two charts resolve in sequence, the order the rules resolve them ([MECHANICS.md §6](../mechanics/MECHANICS.md#6-direct-resolution), [STYLE.md §7](STYLE.md#7-motion-language)): the other's chart lights up first — the player's action landing and propagating through its web — then, after a short pause, the player's chart resolves the other's reply.
Activation propagates within each chart along that chart's own aspect lines; there is no line drawn between the two charts.
The connection between them is conceptual (your planet faces theirs this turn), not visual.

The total turn animation budget is roughly **3–4 seconds**, intentionally long enough to mask a Starknet transaction confirmation while preserving visual energy.
The per-motion durations live in `client/src/style/motion.css`.

**Narrative.**
During the **decision phase**, the player's chart is *gently active* — planets that gate a current option (per [ENCOUNTERS.md, Current predicates](../mechanics/ENCOUNTERS.md#43-current-predicates)) carry a soft Field-layer halo so the player can see *why* the option exists.
On **resolution**, affected planets receive plain state-change flashes (testimony or affliction gained, combust applied).
No propagation through aspect lines — propagation is a combat-only language.
The heading does not animate during resolution; it remains the steady framing presence.

### 3.5.1 The affliction arc

Affliction is drawn as an arc around each planet, at **1 point = 2°**.
Ceilings are multiples of 12 ([MECHANICS.md §10](../mechanics/MECHANICS.md#10-combustion)).
A full circle represents 180 Resolve, the provisional per-planet maximum for future run upgrades.

- The **faint track** is the planet's whole ceiling.
  Its length is proportional to Resolve, so a resting chart shows which planets are sturdy without a number.
- The **bright span** is what the planet can still absorb.
- The **combustion end is pinned at 6 o'clock**, and affliction accumulates toward it, so the bright span shortens by its free end descending into the anchor and every planet dies at the same point on the dial.
- The **projected span** is the change the declared blow would make to the boundary — amber for harm, violet for heal, ember when it would close the span ([STYLE.md §5](STYLE.md#5-color-rules)).
- A **combusted planet drops the arc.**
  All that is left of it is the spent track, which gauges a capacity the planet no longer has; the dimmed disc and glyph already say it is out.

Absolute rather than normalized.
A normalized arc reads as a fraction, which needs a complete-circle track to read against — and complete circles are the interaction ring's signal (§3.6).
It also flattens the resting chart, since every undamaged planet would look identical, and the chart is the character sheet and the NFT as well as the board.

**The projected span is focused only.**
It appears on the planet under consideration — hovered, focused, or inspected — and nowhere else.
A planet that cannot survive has its **whole remaining span** go ember, because the span clamps at the ceiling — so combustion reads as geometry rather than as a warned number, and the read is categorical (this one dies) rather than a comparison of lengths.

Rejected: the precommit's bite drawn on every live candidate at rest.
The magnitude does not depend on which planet catches it, so the resting menu and the focused preview were the same mark answering different questions — *what each planet would absorb*, against *what happens if I send this one* — and focusing read as six threats disappearing rather than as the question narrowing.
Keeping both at once, or separating them by opacity, was built and did not fix the misread.
The cost is that no danger read remains on the board at rest; which of your planets dies catching this is visible one planet at a time.

The arc replaced the earlier numeric badges, which showed numerators whose denominator lived in the panel; the arc is always on, on every live planet, because capacity is part of what the planet *is*.

### 3.6 Interaction grammar

The player's per-turn action in combat is choosing which of their planets acts, and with which verb (the opponent's planet and verb are system-selected and precommitted, per [MECHANICS.md §5](../mechanics/MECHANICS.md#5-action-and-valence)).
Desktop previews use hover or keyboard focus; one activation executes a fully specified action.
Mobile adaptation is deferred.

- **Activate a planet:** inspect.
  The chart highlights the planet's aspect web, narrows the defensive preview to that planet (below), and opens the inspect panel with its two actions.
  The inspected planet's ring goes steady.
- **Hover or focus an action (Afflict / Testify):** preview the full turn and Light gain.
  Activate the action once to resolve the turn.
- **Activate a different planet:** switch inspection without committing.
- **Activate an opponent planet:** inspect the same information as an own planet.
  Opponent planets are not actable.
- **Hover or focus a planet:** preview without committing.
  While a planet is selected, its inspection stays pinned so the player can reach the action buttons.

There is one interaction ring per planet, not two.
It breathes while the planet is available and sits steady once hovered, focused, selected, or acting — selection is the invite answered, not a different ring.
Its colour is **mist** until a verb is determined for that planet, and the verb's colour then ([STYLE.md §5](STYLE.md#5-color-rules)); it never carries the planet's own hue, which the disc, glyph and halo already state three times over.
Rejected: separate invite and select rings at different radii.
They were already mutually exclusive — selecting clears the invite on every planet and suppresses hover — so the second radius bought nothing and spent room the arc needed.

**Previews show only what is determined.**
Verb-dependent information appears only while a verb is indicated by hover or focus; verb-free information is free everywhere.
The *defensive* read — the opponent's precommitted action — is verb-free, so it needs no verb indicated; it still needs a planet, and appears only on the one under consideration, propagation included (§3.5.1).
The sentence (§3.7) carries the part of it that is planet-free: which of the other's planets acts, with which verb, and for how much.
The *offensive* read (the effect on the opponent's chart) appears while the action is hovered or focused.
The preview clears when neither indicates it; pointer exit preserves a preview still supplied by keyboard focus.
Previews are exact — they model the full phase order of [MECHANICS.md §6](../mechanics/MECHANICS.md#6-direct-resolution), including preemption and the combustion propagation short-circuit (§9).

In narrative encounters, hover or focus an option to preview its determined effects.
An option without a requested target resolves on its first activation.
Activate an option that needs a target to enter targeting; repeating that activation keeps targeting active.
The encounter center mark invites eligible planets on the chart.
Hover or focus a planet to preview its exact consequence in the shared readout, then activate the planet once to resolve the choice.
The readout shows the actual effect amount, including clamped recovery, without a confirmation button.
Previewing another option leaves the selected targeting option unchanged; returning to the chart restores that option's preview.
Choosing another option replaces the selection; background click or Escape cancels targeting.
Outside targeting, planet activation remains safe inspection.
Only eligible targets invite selection; revival can select combusted planets without enabling them in combat.
Determined effects project on the chart through the same resolver used at commit.
Unavailable purchases remain visible with an explanation.
Guides permit demonstrations but prevent gameplay commitment and commit sounds.

### 3.6.1 Study annotations (the inspect "i")

A newcomer with no astrology cannot form intent — choosing which planet to send presumes knowing what a planet connotes.
Study annotations are the opt-in foothold that closes this gap without imposing instruction on a fluent player (see [intent.md](../intent.md), "offer a foothold; never force a lesson").

A small **"i" in the top-right of the inspect panel** (`PlanetStatsPanel`) toggles study annotation.
The toggle is **sticky** across inspections and **commit-safe** — entering study mode never previews, advances, or commits a turn.
A player who never touches it sees the plain panel; the annotations exist only while study mode is on, so a fluent player carries no extra text.

With study **off**, the panel shows only **operational numbers** — what matters this turn:

- **Resolve** — the combustion ceiling ([MECHANICS.md §10](../mechanics/MECHANICS.md#10-combustion)): how much affliction the planet endures before it gives out.
  Now that combustion is deterministic, this is literally its HP.
  It is the planet's base Resolve plus placement bonuses, shown directly.
- **Fortune %** — the fortune roll, `luck / 120` ([MECHANICS.md §7](../mechanics/MECHANICS.md#7-randomness)): the planet's odds of uncombusting at map openings or blocking its entire necessity draw.
  Necessity applies independently to both charts at each combat encounter opening, drawing 12, 24, or 36 before Fortune.
  Each sweep shows the raw draw, then removes it on a successful Fortune roll before settling the resulting state.
  Wounded planets can combust at entry; fresh planets survive every draw.
  Both charts show their opening sweep before the first action becomes available.
  If the player's entire roster combusts during the opening, both sweeps finish before the encounter advances without an action.
  Map openings show revival only; a new run begins with zero affliction.
  These rolls settle before play; action resolution remains deterministic.
- **Afflict / Testify** — the planet's affliction and testimony amounts, carried by the two action buttons.

Afflict and Testify show their matching stat amounts directly.
Resolve is also shown directly; luck determines Fortune.

With study **on**, the box **drops open downward** (its top fixed) and the action buttons clear to make room for two things:

- **Symbolic gloss** — one evocative line naming what the planet is *about* (e.g. *"Mars — the drive to act, to cut, to assert"*), drawn from the planetary archetypes ([PLANETS.md](../writing/PLANETS.md)); it names the symbol plainly.
  Authored, never generated (`client/src/game/glossary.ts`).
- **Stat table** — rows for the four core stats, columns **Core · Placement · Total**.
  `Core` is the innate base; `Placement` bundles the sign-derived buffs (element, mode, sect); `Total` is the sum, tying back to the operational numbers above.
  Dignity is **not** here — it's a house-encounter input, not a combat stat; see [MECHANICS.md §10](../mechanics/MECHANICS.md#10-combustion).

Depth scales inversely with how often a thing is needed.
The table shows the numbers at a glance; the *concept* explanations — what Core or Placement each mean — sit one tap deeper (tap a column header), since a player needs them roughly once.
A basic explanation three taps deep is acceptable.

**Scope.**
Annotation covers the seven planets, where the blocked decision lives, and the inspected planet's aspects by name, each opening a gloss.
Signs and houses extend the same mechanism later.

**Relationship to inspection outside encounters (§7).**
Same teaching impulse, different moment: study annotations serve the player mid-encounter at the point of decision, while inspection on the title and map is the between-runs contemplative surface.
They share a register and the same panel.

### 3.6.2 The info card (summoned and queued)

One modal frame — full-viewport backdrop, bordered square stage, close button (`InfoCard`) — hosts standalone study content: the Prince artifact, the Astral Codex, planet introductions, and future tooltip or tutorial cards.
Content differs; the frame, entrance, and dismissal grammar (backdrop tap, ✕, or ESC) never do.
The primer keeps its own gated flow (§9.6) for now; whether it ever presents inside this frame is an open question.

A card opens one of two ways:

- **Summoned** — the player asks for it: **Inspect Prince** and the **Astral Codex** from the settings menu (§9.5).
- **Queued** — gameplay earns it (`InfoCardContext`): a queued card presents on returning to the map, one at a time, never over a running encounter.

The first queued card is the **planet introduction**: crossing a Macrobian threshold ([MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)) queues the new planet's card — glyph, sign placement, dignity, role, stats, and the schedule line (the thresholds are deterministic, so the next unlock is shown — client honesty, §1.1).
The Moon has no threshold to cross; its card presents at the end of the mint reveal instead (§5.2).
The introduction celebrates the **position, not a person**: no voice line, because planets stay ambient ([intent.md](../intent.md), Audience).

**Screen-help cards** — the corner "?" on each gameplay surface — run three beats: one sentence of purpose carrying the screen's stakes (the test: it survives with the title deleted); two-three sentences of goals and affordances in one breath; a slightly longer close holding only the concepts that change decisions.
Previews teach the numbers (§1.1); the card holds the frame the numbers sit in.
Copy lives in `client/src/copy/help.ts` and follows the §1.2 register and casing.
Each screen's **guide** (`client/src/copy/guide.ts`) opens by itself the first time a Prince meets that screen and waits for its `?` after that; it points at the controls in turn and permits previews but no commitment.

### 3.7 Chrome

The encounter screen is allowed restrained, functional chrome where it does necessary work — what is happening this turn, what the run state is, what this encounter pays for, and how to leave.
The aesthetic remains *sparse and ethereal* ([intent.md](../intent.md)), but that is an aesthetic provocation, not a hard ban on UI text.
None of it is chart data, so it reads as chrome without becoming a HUD sitting over the wheels.

**What moves sits above the charts; what is fixed sits below.**
Above: the instruction, the turn, Light, and the sentence naming the other's move — the things that change during play.
Below, between the SELF and OTHER labels: the encounter's ruler, the sentence that opens the meeting, and the rule, constant from the first turn to the last.

**Allowed:**

- **Light.**
  The run's accumulating score (per [MECHANICS.md §12](../mechanics/MECHANICS.md#12-scoring-light)), shown as a numeral.
  Light has no upper bound anywhere in the design, so it cannot be drawn as a fraction of anything without inventing one — and that would be the first dishonest number in the game.
  A numeral invents nothing: it has no denominator to imply and nothing to decode.
  It reads the same here and on the narrative screen.
  While a verb is indicated for a previewed planet, the numeral carries the projected gain for that move in the verb's colour, computed by the same function that will award it — verb-dependent information, so it appears only once a verb is indicated (§3.6), and it shows `+0` plainly on a node the planet cannot score on.
  A pulse behind the digits, tinted by whichever planet is resolving, is the only feedback that Light moved during a resolution wave.

  Rejected: a bar for the current doubling.
  It measured a span of *log* rather than a fraction of any maximum, but a partial bar reads as progress toward a maximum whatever it measures, which is the misread it was built to avoid.
  On the NFT, final Light determines star radius and opacity; position is pseudorandom ([NFT.md](NFT.md), "The Star-Field").
- **Turn.**
  Position in the encounter's turn sequence, as a fraction — *2 / 3*.
  Unlike Light this has a real denominator, the sequence length, so a fraction states it exactly rather than inventing a ceiling.
  While the encounter is live the numerator is the turn being answered; once settled it is the turns actually taken, so an encounter that ends early reads *2 / 3* rather than *3 / 3*.
  The final chart and Light total remain briefly after resolution finishes, then the screen advances to the map.
  A tap skips that final pause.

  Rejected: a row of pips, filled to the current turn.
  They separated three states where the fraction has two, and cost the strip a second visual language that could not share a baseline with the type beside it.
- **The sentence.**
  One line naming the turn's precommit — *"Jupiter afflicts 24"* — the planet in its own colour, the verb in its valence.
  The board already says all three wordlessly: the acting planet is the only one on its chart wearing a ring, that ring's colour is the verb, and the bites on the player's candidates are the magnitude.
  The sentence is the caption that teaches those marks, and the colour split is what makes it one — the name matches the disc on the other chart, the verb matches the corona around it.
  A glyph is not a name, and the audience premise is a player with no astrology, so this is the only place the other's planet is named at all.
  It is the one piece of prose on the combat surface, kept deliberately against a direction that otherwise removed words until the board carried none.
  The sentence clears after the final animation; its space remains so the charts stay still during the pause before advancing.
- **The instruction.**
  One line naming the player's next step — *Choose a planet to respond*, then *Choose Afflict or Testify* once a planet is selected.
  It sits top centre between the corner buttons, in bone, the same slot the map and narrative screens use for theirs.
  It shows on each run's first map only, and is absent while nothing waits on the player or the guide is open.
  Playtesters still found the game confusing with the invite rings alone, so the step is named outright.
- **The ruler, the opening, and the rule.**
  The encounter's ruler ([MECHANICS.md §11](../mechanics/MECHANICS.md#11-encounter--map--run-flow)), named in its own colour — the colour its node had on the map — tucked into the corner between the wheels just above their lower edge.
  Beneath it hang one sentence in bone that opens the meeting, and under that one line stating how you gain Light here (*Gain Light from affliction on the Other's chart*), the rule in the ruler's colour and Light itself neutral.
  The opening says what the Other seeks from this exchange, in the manner of the ruler's own natal sign in the Other's chart (not the rising sign that chose the ruler), and leaves the player's response unwritten; one sentence per ruler–sign placement lives in `client/src/copy/encounter-openings.ts`.
  Its job is to make the rule beneath it emotionally legible: what the Other wants is what the rule rewards.
  The number's meaning changes per node, so the rule is stated for the whole encounter, in every state, rather than discovered, and the opening holds with it, unchanged as turns and acting planets change, from entry through resolution.

**Out:**

- Section titles ("ENCOUNTER", "MAP") on the screens themselves — the player knows where they are.
- The wordmark "SPACE PRINCE" inside the encounter — it lives on the title screen.
- HP bars, "+N attack" registers, blockbuster game-UI flourishes.
  The affliction arc is not one of these, and the distinction is the point: an HP bar fills against an invented maximum, while the arc's track is a real ceiling the game already has ([MECHANICS.md §10](../mechanics/MECHANICS.md#10-combustion)).
  Light, which has no ceiling to fill against, is a numeral rather than any kind of bar.
- Always-visible logs of past turns (those are dev-only).
- Run-management affordances inside an active run.
  There is no in-game "abandon" or "new run" while a run is in progress; runs continue until they end regardless of session breaks, and **New Run** appears on the map only once the run is over (§6).

### 3.8 Mode and scene transitions

Transitions between major surfaces fade through the Void canvas as the tint shifts to the next surface's planet ([STYLE.md §5](STYLE.md#5-color-rules)).
Arriving is slower than leaving; a run's end is slower still, and on a combust-out it matches the combust motion's weight.
The durations live in `client/src/style/motion.css`.

### 3.9 Open questions

- How a **zero-effect ripple** should read.
  On an afflict turn a hard aspect inverts to testimony, and a target already at zero affliction has nothing to heal — so the arc draws nothing at all, and the player sees a lit aspect line with no consequence.
  The retired projection badge covered this by showing a violet zero.
- Accessibility (color-channel parallel signal) — [STYLE.md §14](STYLE.md#14-open-questions).
- What the encounter says about itself before, during, and after — the reading layer proposed in [#26](https://github.com/kronosapiens/SpacePrince/issues/26).

---

## 4. Map Screen

The second main surface.
Renders the Sephirot-pattern node graph from [MAP.md](../mechanics/MAP.md) against a Void canvas.

### 4.1 Layout

- **The diagram** sits beside the player's chart, with the breathing room [STYLE.md §10](STYLE.md#10-the-maps-visual-treatment) asks for, and a Roman numeral naming which map of the run this is.
- **The chart** is the same full-size, inspectable chart the layout keeps on every surface (§1), in its current state — combusts dimmed, affliction on the arc (§3.5.1).
  The "chart is always present" principle made literal on this surface.
  At a map's first node the chart plays the opening's revival rolls before the map can be entered ([MECHANICS.md §11.3](../mechanics/MECHANICS.md#113-necessity-at-combat-openings-and-revival-at-map-openings)).
- **Unlock moments** land here as an interstitial: surfacing back from an encounter that crossed a Macrobian threshold (cumulative encounters 1, 2, 4, 8, 16, 32 — per [MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)) presents the new planet's introduction in the info card (§3.6.2); on dismissal the planet stands unghosted in its computed sign on the chart.
- **New Run** appears in place of the next step once the run is over (§6).

### 4.2 Nodes

Two content types, distinguished by shape and fill.
Both share the same outer disc footprint so the diagram reads as one network of nodes; the *content inside* the disc tells you what kind of beat it is.

- **Combat node:** thin disc-ring outline plus an eight-pointed star inside, filled with the opponent's **chart ruler** color — the planet ruling the opponent's Ascendant sign.
  The star extends slightly past the disc rim.
  Reads as *"another chart waits here, anchored by [planet]."*
- **Narrative node:** filled disc in the color of the house's fixed game ruler (§4.5).
  Reads as *"this is [planet]'s domain."*
  The house Roman numeral appears at the node center.

Each node's identifying planet supplies its color.
Narrative nodes use the house's fixed game ruler (§4.5); combat nodes use the traditional ruler of the opponent's Ascendant sign, listed in the [sign matrix](../writing/PLANET_MATRIX.md#sign-matrix).

Each node also has one of four **temporal states** relative to the player's current position.
Together with content type, the state determines what's rendered:

- **Current** — the player's standing position.
  Node radius stays the same as every other state — emphasis comes from the node's planet halo (planet-color radial gradient), a colored ring around the disc, and a slightly heavier disc stroke.
  There is exactly one current node per map.
- **Eligible-next** — every node **one edge away** from current that the player hasn't already visited and isn't behind them in the topology.
  Includes forward-layer neighbors *and* same-layer (horizontal) siblings, so a "sidestep" along the current layer is allowed.
  Rendered with full content at full saturation.
  The eligible set surfaces a soft pulse on entry (the map-node arrival motion, `client/src/style/motion.css`).
  Backtracking is still impossible — once visited, a node is locked out, so a sidestep is a one-way street.
- **Traversed (past)** — nodes on the player's walk-path so far, excluding current.
  Full content at **full opacity** — the solid, committed past.
  What marks it as memory rather than action is stillness: no halo, no ring, no pulse.
- **Distant** — every other node.
  Full content — shape, glyph, ruler color — rendered at the faintest opacity tier.
  The road ahead is fully legible; it is simply not yet near.

The whole map renders its content from the start.
A map's fate is fixed the moment it is created (§4.3), so hiding rolled content behind a fog of war would misstate the player's actual knowledge — **the map visual reflects exactly what is knowable**.
This is the client-honesty rule (§1.1) applied to the map.
The tiers grade *attention*, not information: meaning concentrates near the player while the distance stays faint but readable.

The progression from faint (distant) through translucent (eligible) to full saturation + halo (current), with the walked path solid behind the player, reads as the map becoming real as it is walked.

Hover or keyboard focus highlights an eligible node and its incoming route.
One activation enters the node; there is no separate selection or confirmation ring.
The map guide permits route previews while blocking travel.
The finished run's map remains noninteractive, without invitations to travel.

### 4.2.1 Determinism

A map's full visual state — topology, content per node, walk-path so far, and current position — is **deterministically derived from a single seed** and the walk.
Re-rendering the same seed always produces the same map and the same point along the walk.
This lets dev tooling reproduce exact map states for screen-iteration work, and it is what would make a run state shareable by URL ([#32](https://github.com/kronosapiens/SpacePrince/issues/32)).

### 4.3 Node generation

A map is fully determined the moment it is created:

- The **map seed** is a VRF draw at map creation ([MAP.md §4](../mechanics/MAP.md#4-seeding)) — one call per map, never per node.
- The **topology** derives from the seed (per [MAP.md](../mechanics/MAP.md)).
- **Encounter content** (combat opponent, or narrative house) is rolled for every node at creation, each from its own RNG stream seeded on `(map seed, node id)`, so rolls are path-independent.

Before a map exists, nothing about it is knowable; once it exists, everything is — and the map renders accordingly (§4.2).
An earlier draft rolled content lazily at the eligible frontier and hid distant nodes behind a fog of war.
Both were dropped: under a per-map VRF seed the fog reflected no real uncertainty, and the map visual should reflect the actual knowledge available.

**Roll parameters:**

- **Combat-to-narrative ratio:** **50/50**.
  Refine in playtesting — earlier drafts ran a φ:1 (62/38) combat-heavy split, but rebalanced to give narrative beats equal footing in a run.
- **House assignment** (for narrative nodes): **uniform random over the 12 houses**.
  A "no immediate repeat" rule and position-derived house assignment (upper layers = elevated houses, lower = grounded) are deferred until they earn their weight in playtesting.
- **Combat opponent assignment:** intended, a real other-player Prince per §3.4; in the prototype, a seeded chart whose ruler belongs to the unlocked rotation ([MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)).

### 4.4 Mobile (deferred)

A future mobile layout could scale the map to width, allow vertical scrolling, and place the chart above it.
Existing responsive layouts remain while desktop interactions take priority.

### 4.5 House → ruler mapping (color rule)

The [house correspondence table](../writing/HOUSE_MATRIX.md#game-correspondences) records each house's **fixed game ruler**.
This presentation convention uses the traditional ruler of the sign assigned by house number: Aries for I, Taurus for II, and so on.
It gives every VI node Mercury's color, regardless of the natal sign occupying VI.

The fixed game ruler and joy assignment are both House attributes with different uses: the ruler supplies the color, while the joyful planet's current condition enables additional options.
The [encounter model](../mechanics/HOUSES.md#3-chart-conditioning-model) distinguishes both from occupants and the natal sign ruler.

### 4.6 Map ambient tint

The map takes the colour of the node the player stands on — its ruler, the planet the node itself is coloured by (§4.2) — so walking into an encounter continues the light rather than changing it ([STYLE.md §5](STYLE.md#5-color-rules)).

### 4.7 Open questions

- Whether traversed nodes need outcome inspection, and whether a narrative node should show its house's valence at a glance — both under [#32](https://github.com/kronosapiens/SpacePrince/issues/32).

---

## 5. Mint Screen

The player's first irreversible act.
Three beats: input, confirmation, reveal.
Each is irreversible at its end.
The prototype runs the whole ceremony locally with no transaction; the Prince it casts lives in `localStorage`.

On first arrival the **framing** (§9.6) precedes input; the mint screen itself carries no explanatory copy beyond the line above the form.

### 5.1 Beats

**Input.**
The player enters birth date, time, and place (a city search, `CityPicker`).
The time field steps in 5-minute increments; the identity grid the onchain mint will quantize to is unresolved ([#30](https://github.com/kronosapiens/SpacePrince/issues/30)).
The chart wheel stands beside the form, empty of planets: geometry waiting, not generating.

**Confirmation.**
Intended: a single explicit confirmation step — *"This position may only be recognized once."* — because wrong input is permanent identity.
The prototype casts on the **Cast Chart** button alone, since nothing is minted yet.

**Reveal.**
The staged Macrobian ceremony (§5.2).

### 5.2 The Reveal — staged Macrobian unfolding

After confirmation, the chart is computed (onchain per [CHART.md](../mechanics/CHART.md); locally in the prototype) and the seven planets paint in **one at a time, in Macrobian order**:

> Moon → Mercury → Venus → Sun → Mars → Jupiter → Saturn

Each planet appears at its computed sign placement, in its glyph and color, with a caption naming the placement and a row of glyph pips marking progress; the pacing lives in `client/src/screens/useCasting.ts`.
The ceremony is intentionally long enough to mask an onchain confirmation and to give the act its weight.
After all seven planets have appeared, the chart sits whole for a brief held moment.

This is the **only time** the player sees their full chart until cumulative encounter 32 (Saturn, the final unlock — [MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)).

The chart then **dims whole**: all seven planets recede to **ghost** (hairline outline, no color), the Moon included, and the planet-colored bands down the screen edge go dark and stay dark — past the reveal they only mark planets acting in an encounter.
After a beat, the Moon's **planet introduction** (§3.6.2) presents, and the Moon stands lit behind it in its computed sign.
It is the same card every later planet arrives through, so the first card earned in play is one the player has already seen.
Dismissing it leaves the chart in its starting state (per [NFT.md](NFT.md) and [MECHANICS.md §11.1](../mechanics/MECHANICS.md#111-planet-unlock-schedule)) and a single Continue into the first map.

Later unlocks arrive the same way, one card at a time *between encounters*, not in a single ceremony.
The mint is the only staged unfolding in the game.

### 5.3 NFT artifact

The NFT renders the player's chart at its current unlock state — Moon visible, the other six as ghosts from minute one.
The artifact evolves alongside in-game unlocks per [NFT.md](NFT.md).
There is no standing "preview" of the full chart in the artifact; a verification preview surface (e.g. for wallets) can be added later if needed.

### 5.4 Constraints

- *"Minting does not create identity; it recognizes it."*
  The reveal is recognition, not generation.
  Not a spinning loot box; closer to *"the chart was always going to be this one — you're just seeing it now."*
- Birth-data input must accommodate ambiguity (uncertain birth times, contested locations) without trivializing the act.

### 5.5 Open questions (onchain integration)

- **Date/time picker treatment.**
  The picker should reflect the identity grid once it is settled (#30) — not "type any time" but "select your slot."
- **Location input.**
  City search exists; whether a coordinate picker joins it is open.
- **Failed mints.**
  Intended to be handled by the wallet's transaction UI (Cartridge Controller is the planned wallet); the game does not invent a custom error surface.
  If the mint transaction fails or is rejected, the player remains on the Mint screen and can retry through the wallet flow, and the reveal begins only after the onchain confirmation lands.

---

## 6. End of Run

End-of-run presentation is deferred ([#32](https://github.com/kronosapiens/SpacePrince/issues/32)).
For now, the final chart and map remain visible, with further travel disabled and a **New Run** action.
Starting again preserves the Prince's identity, encounter count, unlocks, and run records.

---

## 7. Chart Study Screen

There is no separate study screen.
Sitting with one's chart happens in place: the chart the layout keeps on the title and the map is inspectable there with the same grammar as combat, and the Prince artifact opens from the settings menu as **Inspect Prince** (§3.6.2).

### 7.1 Entry and exit

- On the title or the map, activate a planet to inspect it; activate elsewhere, or the same planet again, to clear.
- **Inspect Prince** opens the artifact — chart, star-field, achievement marks — in the info card; backdrop, ✕, or ESC closes it.

### 7.2 Inspection grammar

Inspection supports the same previews as combat (per §3.6):

- Activate a planet → its aspect lines highlight, the planet receives its inspection ring, and the stats panel opens with the study toggle (§3.6.1).
- Hover or keyboard focus → ambient preview, same surface.
- Click elsewhere → inspection clears.

There is no commit.
The point is to look at the web, not to act on it.

### 7.3 What's shown

The chart at full size, in its current state — combusts grayed, afflictions visible per the chart-rendering rules in [STYLE.md §11](STYLE.md#11-the-charts-visual-treatment); the title hides affliction, since nothing is at stake there.

### 7.4 Earned layers (deferred)

Annotation earned through play — propagated aspects brighter at rest, encountered houses marked, lifetime counts per planet — is deferred under [#32](https://github.com/kronosapiens/SpacePrince/issues/32).

### 7.5 Relationship to NFT

**Inspect Prince** renders the **same artifact** the NFT will (per [NFT.md](NFT.md)), from the same state.
Future annotations would be in-app overlays, not modifications to the canonical on-chain artifact.

---

## 8. Dev-Only Surfaces

The prototype carries tooling not intended for the shipped game's navigation: a dev console (`d` in the running client) with its tuner and page spawner, an `/__index` screen for navigation and reset, the `/gallery` of components and themes, and the `/token` artifact preview.
They ship in every build so that playtest builds can be driven, but nothing in the game's own surfaces leads to them.

Dev surfaces are not the subject of this document beyond:

- They exist.
- They are visually separated from game UI so it's clear which is which.
- They do not constrain game-screen design — final-game chrome should not be designed around the assumption that dev panels will be present.

---

## 9. Title (Lobby)

A combined lobby surface — the player's entry point, and in the intended game also Prince selection for the rare player with multiple Princes.

### 9.1 Layout

- **The player's chart fills the left of the canvas** at full size, in its current unlock state (Moon visible early, ghosts for the rest), inspectable in place (§7).
  The chart is who they are; standing on the title is standing in front of yourself.
  A player with no Prince yet sees a sample chart instead, rerolled every few seconds or on a tap.
- **Wordmark "SPACE PRINCE"** beside it.
  This is the only screen where the wordmark exists.
- **One primary affordance:** **Begin** or **Continue** (see §9.2).
- **The settings menu** (the corner gear, present on every surface) holds audio controls, the **Astral Codex** glossary (§9.6), and **Inspect Prince** (§7).
  Always available, never demanded.

### 9.2 Begin — state-dependent

The affordance's meaning depends on game state:

- **If a run is in progress** (the run has not ended), the button reads **Continue** — drops the player back at the Map (their last surface in that run).
- **If no run is in progress** (the previous run ended, or no run has begun), the button reads **Begin** — generates a fresh starting map and begins.

The world tells the player which they did, by where they land.

Active runs must be completed.
There is no abandon-run affordance — see §3.7.

### 9.3 Prince selection

Intended: for players with multiple Princes, a small **dropdown** lets them switch the lobby's chart between their Princes, hidden when there is only one.
The prototype holds a single local Prince, so there is nothing to select yet.

### 9.4 First arrival (no Prince yet)

A new player landing here without a minted Prince sees the title with a sample chart and **Begin**.
Begin does not go straight to birth-data input.
It first presents the **framing** (§9.6) — a few lines of intent and stakes — from which the player proceeds into Mint (§5).
This is the game's one mandatory beat of explanation, and it is deliberately short; the long-form codex stays opt-in.

The archived [v1 onboarding](../archive/v1/ONBOARD.md) opened instead on a bare line — *"A position has not yet been recognized."* — with a single **Recognize a Position** affordance; its ten-minute arc described an earlier game, but the recognition tone survives in the mint's constraints (§5.4).

### 9.5 Settings, account, wallet

Account, wallet, and configuration management are **not** intended as in-game surfaces: they would live in the **Cartridge Controller** web wallet's config modal once the game is onchain.
The prototype's settings menu holds only what the local game needs — audio, the codex, and inspection.

### 9.6 Primer — the framing and the codex

The game's explanatory copy surfaces in two places, by length:

- **The framing** — the short intent-and-stakes beat: seven brief paragraphs in `client/src/copy/primer.ts`.
  Shown **once**, at first arrival, between the Title (§9.4) and Mint (§5).
  It says what the player is (a cosmic entity travelling the universe through encounters with others) and what Light is: the energy those meetings create, a kindness and a difficult exchange alike, carried into what comes next, with what remains at a journey's end shaping a star in the sky.
  It stays above the named mechanics (Resolve, affliction, testimony), which are taught in play, and it stays at two paragraphs on Light so **`Continue`** remains above the fold at 800px tall.
  "Clicking past" the framing *is* choosing to begin — the gesture leads into the mint, not around it.
- **The codex** — the explicit account of the game's terms.
  Today it is the **Astral Codex**, a glossary of every term of art the player meets (`client/src/copy/codex.ts`), opened from the settings menu on any surface.
  **Opt-in, never gated.**
  The long-form account of astrology and the game drafted in [PRIMER.md](../writing/PRIMER.md) — usable as a standalone explainer outside the game — is not in the client, nor is the framing's planned *"New to astrology? Read on →"* affordance into it.

**Returning players never see the framing.**
A player who already has a Prince enters through Begin (§9.2, continue or new run) and bypasses it entirely; the codex stays available for whoever wants it.
This is *front-load intent, not information* made literal ([intent.md](../intent.md), Audience): the short thing is unavoidable, the long thing is summoned.

---

## 10. Navigation

The play loop alternates between Map and Encounter, generating a new map after each non-final L7 completion.
When a run ends, the final chart and map remain visible with a New Run action (§6).
On first arrival the framing (§9.6) precedes Mint.
The codex and inspection are reachable from the settings menu on every surface.

### Routing and identity

The game runs at **two routes**: `/` (the Title/lobby) and `/play`; `/__index`, `/gallery`, and `/token` are development and auxiliary routes (§8).
Mint, Map, and Encounter share a single **state-derived surface** at `/play`: the screen shown is a pure function of the active run, not the URL (`PlaySurface`).
Map and Encounter follow run state; a finished run stays on the map, and only `/` ↔ `/play` is a route change.
This removes the URL-vs-state mismatch a screen-per-route design invites, makes refresh-during-play resume correctly, and lets the chart persist across surfaces instead of remounting per route.

**Identity lives in the URL; the screen does not.**
The URL identifies *which Prince* is in play — the NFT — never which screen.
This mirrors how Loot Survivor's `?id=` points at a game session, with one structural difference: our NFT is the **Prince** (a persistent character), and runs are *nested* play-throughs whose record (the star-field) accumulates inside it — so a run is never its own URL or token, the way an independent session-NFT is.
Onchain, `/play` gains a `?prince=0x…` param resolved against chain; the surface layer is unchanged, because it is already a function of `(prince, run)`.
The local prototype holds a single Prince in `localStorage`, so no param is needed yet.

Final-game navigation is otherwise implicit — the world advances you through surfaces — with a small persistent way back to higher-level surfaces from any point.

Forbidden:

- Hamburger menus.
- Tab strips that expose all screens at once.
- Breadcrumbs.

The world does not need a wayfinding overlay.
The player knows where they are because the screen tells them by being itself.

---

## 11. Relationship to Other Specs

- [STYLE.md](STYLE.md) — the visual vocabulary and its rules.
  This document specifies *which surfaces exist* and what they are for; STYLE.md specifies *what they are drawn with*.
- [MUSIC.md](MUSIC.md) — what each surface sounds like.
- [intent.md](../intent.md) — the audience, the felt qualities, and the influences each screen should serve.
- [MAP.md](../mechanics/MAP.md) — map topology (rendered on the Map screen).
- [CHART.md](../mechanics/CHART.md) — chart computation (rendered on the Encounter screen and at inspection).
- [HOUSES.md](../mechanics/HOUSES.md) — narrative reference attributes and chart dependencies.
- [ENCOUNTERS.md](../mechanics/ENCOUNTERS.md) — narrative composition, eligibility, and resolution.
- [MECHANICS.md](../mechanics/MECHANICS.md) — combat resolution.
- [NFT.md](NFT.md) — the on-chain SVG chart artifact (what Inspect Prince renders).
- [PLANETS.md](../writing/PLANETS.md) — the planetary archetypes the study glosses and introductions draw on.
