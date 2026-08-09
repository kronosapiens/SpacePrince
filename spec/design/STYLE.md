# Space Prince — Visual Style

*The vocabulary the client draws with.*

`VIBES.md` describes how the game should feel.
This document defines what it should look like — the geometry, the strokes, the type, the timing — so that two engineers and one illustrator working in different rooms produce a coherent object.

The guiding principle:

> **Every screen is the same drawing, continued.**

The chart, the map, the encounter, the menus — all of it is one visual artifact in vector space. There is no "game UI layer" sitting on top of "game art." There is one drawing. The client renders portions of it.

---

## 1. Inherited Constraints

These are not negotiable inside this document — they come from elsewhere in the spec.

- **SVG-native.** The NFT chart is generated entirely on-chain as SVG (see `spec/concept/NFT.md`). The rest of the client renders in the same medium so the artifact a player owns is visually continuous with the world they play in. No raster art, no 3D, no canvas-rendered scenes.
  - *Exception — UI chrome.* Client-only readout chrome (e.g. the study stats panel) may embed HTML via `<foreignObject>` when a real layout engine earns its keep — tables, wrapping prose, auto-sizing. This is **not** for the chart art or anything that is or resembles the on-chain artifact; those stay pure SVG. The line is: chart/world = SVG, data readouts = HTML-in-SVG, both still inside the chart's coordinate space and palette.
- **Planetary palette.** The seven palettes in `VIBES.md §Color` are the entire color universe. New colors are not introduced. Backgrounds, text, line work, and chrome are all derived from the palette plus a small neutral scale (§5).
- **Active-planet tint.** The screen's ambient color reflects the active planet (`VIBES.md §Color`). The tint is global; the chart, map, and chrome all sit inside it.
- **Diagram as world.** The chart is the visual ground (`VIBES.md §The Chart as Visual Center`). It is never a corner HUD. The map is a diagram of emanation, not a level select. The encounter is two charts speaking, not a battle screen.

---

## 2. Geometric Vocabulary

The client draws with a closed set of primitives.
Anything not on this list requires a deliberate exception.

### Allowed primitives

- **Circle.** The dominant form. Planets, nodes, orbits, halos, the outer chart ring. Hilma af Klint's vocabulary almost entirely.
- **Line segment.** Aspect lines, pillar paths, corona streamers (§5). Always straight.
- **Arc.** Sign boundaries on the chart wheel, partial halos around active planets, sweep transitions.
- **Polygon — regular only.** Triangles (trines), squares (squares), hexagons (sextiles), dodecagons (the zodiac itself). Irregular polygons are forbidden.
- **Spiral.** Reserved. One spiral per screen, maximum. Used for emanation cues and rare cosmic moments.
- **Glyph.** Astrological characters for the seven planets and twelve signs. Standard Unicode in v1 (♉ ♓ ☉ ♀ etc.); authored SVG paths reserved as a later option if Unicode proves insufficient. Drawn once, reused everywhere. No alternates.

### Forbidden primitives

- Bezier curves outside of authored glyphs. The world does not draw freehand.
- Rectangles with rounded corners. If something needs to be a rectangle, it is a rectangle; if it needs to be soft, it is a circle.
- Dashed or dotted lines. Lines are solid.
- Drop shadows. Depth is communicated through layering, opacity, and stroke weight, not through simulated lighting.
- Gradients on strokes. Only fills receive gradients (§5).

The vocabulary should feel like a Hilma af Klint plate or a Renaissance armillary diagram — a small set of marks combined with discipline, not a wide set used loosely.

---

## 3. Stroke Scale

Stroke weights are units on the **chart's** 1000x1000 viewBox, and only that.
They do not travel: the run map and the encounter seam render at their own unit scales (~1.4px and 1px per unit against the chart's ~0.67), so the same number is a different line there.
`MapDiagram`'s `TIER` is tuned in its own units and stays that way.

| Name        | Weight | Role               | Carries                                                                    |
|-------------|--------|--------------------|-----------------------------------------------------------------------------|
| Light       | `1u`   | ground             | Substrate, aspect web at rest, chart inner ring, badge border, planet rim.   |
| Medium      | `2u`   | structure          | Chart outer ring, sign ticks, combust shockwave.                             |
| Heavy       | `3u`   | under attention    | Interaction ring, active aspect line, propagation pulse, combust ripple.     |
| Extra heavy | `4u`   | the affliction arc | The arc alone.                                                              |

Four rungs, a unit apart, which at the chart's render size is about 0.67px per step.
The scale this replaced had five rungs at 0.5 / 1 / 1.5 / 2.5 / 4 and arrived whole in the v2 design port; it was never adopted, four of its five rungs had no clients, and at half-unit steps it was drawing distinctions the surface cannot express.

Extra heavy has exactly one client on purpose.
The affliction arc carries more than any other single mark on the chart — a planet's whole ceiling, what it can still absorb, and what the declared blow will take from it — so it outranks even the marks that are merely under attention.
A rung with one client is how the previous scale rotted, so if this one stays alone indefinitely it is worth folding back into Heavy rather than keeping a gradation nothing uses.

Mixing weights inside a single drawn element is forbidden. A node ring is one weight. A glyph is one weight. Variation across elements builds the hierarchy; variation within an element makes the work look amateur.

---

## 4. Proportion Scale

The drawn forms relate to each other through a small set of ratios. Like the stroke scale, this exists so that two engineers drawing different parts of the same artifact don't drift.

For the canonical 1000×1000 chart wheel:

- **Outer ring radius:** 480u
- **Inner ring radius:** 360u
- **Planet glyph radius (resting):** 24u
- **Planet glyph radius (active):** 32u
- **Planet halo radius (active):** 56u
- **Aspect line stroke origin/terminus:** at the planet glyph radius, not the planet center
- **Sign division marks:** from inner ring radius to outer ring radius, hairline weight

The map and encounter screens use proportionally derived versions of the same ratios. A node on the map is the same visual object as a planet on the chart, sized for its container.

The point: a player who holds a screenshot of the map next to a screenshot of an encounter should immediately see they are the same hand drawing the same world.

---

## 5. Color Rules

The palette is fixed by `VIBES.md §Color`. This section governs how palette colors compose.

### Neutrals

The palette is supplemented by a four-step neutral scale, used for backgrounds, text, and inert chrome:

- **Void:** `#0B0A0F` — deep ground, near-black with a faint indigo cast. The default canvas.
- **Smoke:** `#2A2730` — secondary ground for layered surfaces.
- **Bone:** `#E8E2D4` — primary text, light strokes against dark.
- **Mist:** `#9A95A0` — secondary text, inactive elements.

Neutrals are warm-cool balanced toward the cool side so they sit cleanly against any planetary tint. They never compete.

### Solid vs gradient

- **Solid fills** are the default. Most marks are solid.
- **Radial gradients** are permitted only on planet halos and on the ambient screen tint, and run from a single color at the center to transparent at the edge — never from one palette color to another.
That color is the planet's primary in the identity halo, and the valence amber or violet in the receive-pulse behind a planet taking a hit.
- **Linear gradients** are forbidden. They read as digital and break the painterly register.
- **Mesh gradients** (SVG2) are forbidden until SVG2 support is universal. Approximate with layered radial gradients if needed.

### Active-planet tinting

The screen receives an ambient tint in the active planet's primary color at 8% opacity, applied as a full-canvas radial gradient centered behind the active element. The tint composites over `Void`, not under it.

**What counts as "the active planet" depends on the configuration:**

- **Combat:** the **opponent's** acting planet — the one selected by the system at turn start. The opponent's planet is the constant of the turn (it doesn't change as the player explores their own options); the player's planet is in flux during exploration. Tinting by the constant gives the turn a stable mood. The world is in that planet's mood; the player's task is to reply. (An earlier draft said this matched an "ANSWER MERCURY" chrome label in `SCREENS.md §3.7`; that label is gone — the acting planet now reads off the opponent's chart directly — but the tinting rationale is unchanged.)
- **Narrative:** the house's **ruling planet** (per `SCREENS.md §3.2`). The aria's planet tints the world.
- **Map / between encounters:** fades to neutral — no active planet, the map is a contemplative between-surface. See `SCREENS.md §4.6`.

Transitions between tints take 2000ms, linear easing — slow enough to feel like the light changing in a room, fast enough that a player who looks away and back perceives the new state.

### Aspect, valence, and warning color

Three orthogonal signals share the chart and must read apart:

- **Aspect mood** — the resting aspect graph and its propagation pulse are colored by harmony/tension, not by planet: **green** (`#8FBC8F`) for harmonious (trine, sextile, conjunction), **red** (`#E15555`) for tense (square, opposition). The astrological convention. The whole web renders at one opacity; **stroke weight, not opacity, carries the rest→active distinction** — a line steps from Light at rest to Heavy when hovered, selected, or propagating (§3), the same weight the propagation pulse rides. The tension red is kept luminant rather than deep-saturated on purpose: a dark, saturated red artifacts badly under social-media video chroma subsampling, where a light red survives. The propagation pulse brightens that same line briefly (§7); it does not crossfade or travel planet hues.
- **Effect polarity (heal/harm)** — afflict/testify, the projected span on the affliction arc, and the interaction ring use **amber** (`#E8913A`, harm) and **violet** (`#9D86D9`, heal), kept deliberately off the aspect red/green so the two channels never collide.
The ring is **mist** until a verb is determined for its planet — the opponent's precommit, or the player's armed choice — and takes the verb's colour then, the same grammar as the arc inside it.
Mist rather than bone because the arc is bone, and a bone ring six units outside a bone arc is perceptually the same colour (ΔE 0 — they read as one double ring on an undamaged planet).
Mist separates them at ΔE 31 and puts the two neutrals where the scale already defines them: bone is state, mist is affordance.
The cost is testify, which drops from ΔE 61 to 41 against the resting ring — still far past where two colours read apart, but no longer symmetric with afflict, which gains slightly.
A dimmer ring does not weaken the invite, because the breath is what marks the tappable (§ Motion), not the brightness.
It does not carry the planet's own colour: the disc, the glyph and the halo already state identity three times, so the ring's hue was decoration, and spending it on the verb is what lets a precommit read at its source rather than only through its consequences on the other chart.
**The corona.** An acting planet — the opponent's precommitted actor, or the player's own once a verb is armed — carries its verb as streamers: radial line segments beginning just outside the interaction ring, in the verb's colour.
Colour alone was not enough to separate the two verbs at a glance, so they differ in silhouette as well, on the reference's own logic — a real corona is irregular and long-streamered at solar maximum, smooth and symmetric at minimum.
**Afflict flares:** twelve rays at Heavy weight reaching well past the halo, every other one falling short so the outline breaks up, butt caps.
**Testify gathers:** twenty-four rays at Medium weight, half as far, all equal, round caps, hugging the rim.
One rung apart, so the weight difference survives while both stay present — and it is the lighter of the two that needed it, since a streamer is the first thing to vanish at small sizes.
Radial segments were the one primitive still free around a planet — the filled circle is the disc, a complete circle is the interaction ring, a partial arc is affliction, a gradient bloom is identity, an expanding circle is combustion.
They cannot be misread as aspect lines, which always span planet to planet; a streamer terminates in empty space.
Unlike the arc and the ring the corona is exempt from the cluster radius budget, because only one planet per chart is ever acting — it may overlap a neighbour, since there is only ever one.

**The corona turns; it does not breathe.** The breath is the invite's language (§ Motion: a slow breath is what marks the tappable), and an acting planet has already been committed to — a breathing corona would ask for a tap on a decision already made.
It rotates instead, the two verbs in opposite directions at different periods (afflict 48s, testify 84s), which is a channel that costs nothing.
Symmetry is no obstacle to that, and it is worth saying because the opposite seems intuitive: a wheel with evenly spaced spokes is plainly rotating.
Motion is perceived directly, not by comparing one configuration with the next — symmetry only defeats rotation under stroboscopic sampling, the wagon-wheel effect, which needs rates orders of magnitude faster than these.
So testify's fringe can stay perfectly even and still visibly turn, and the even-versus-ragged silhouette survives as the verb distinction.

Rejected: breathing it on the shared clock, the first attempt.
Rejected: varying every ray's length to make the rotation legible — it was built on the mistaken premise above, and it cost the even/ragged distinction to solve a problem that did not exist.
Rejected: an annular **wash** under the streamers — a gradient ring, transparent at the centre, which is what a corona physically is. It read well and degraded better than the rays do (a streamer is a third of a pixel wide on a phone; a gradient has no minimum feature size), but it was a second glow around a planet that already has one, and the streamers alone are the more distinctive mark. If the corona ever proves too faint at small sizes, this is the thing to bring back.

Rejected: colouring the acting planet's *halo* by verb instead. Identity has to live somewhere, and recolouring the bloom takes it away at the moment the planet is most prominent — and it fails outright where the verb and the planet share a hue (Saturn with violet is 16° apart, Sun with amber 15°).

**The incoming mark.** The same corona again, at the wheel's centre, around the magnitude arriving rather than around a planet, with the interaction ring but no halo.
It sits at the centre because until the player commits the blow has no target — `resolveTurn` lands it on whichever planet is sent — so "60 of testimony is coming" is a fact about the whole chart and not about anything in it.
That is one rule rather than two: the corona is the verb wherever it appears, the source when it surrounds a disc and the destination when it surrounds nothing, and no planet ever sits at the centre for the two readings to collide.
Both charts carry it, on different clocks.
Yours is live from the top of the turn, since their precommit is already drawn and its magnitude already fixed; theirs waits for an indicated verb, because until then your own outgoing amount is not determined and a number would assert a decision you have not made.
Both ride through resolution rather than clearing at commit, and the stats panel is allowed to cover it.
- **Combust warning** — combustion is on the table for this planet this turn. A dedicated **luminant ember red** (`#FF5C33`, `COMBUST_WARNING` in `client/src/svg/palette.ts`): its own channel, kept off the valence amber (harm in flight), the luminant aspect red (edge language), the gold chrome (structure and invitation), and Mars vermillion (identity), which weight and kind separate it from besides.
Luminance is the constraint here, not saturation — the opposite of the aspect red, where thin-line artifacting is what governs.
The mark rides the affliction arc, whose whole vocabulary is *bright = still yours, dark = already spent*, so a dark ember (this was `#B03636`) reads as more spent and recedes into the track exactly where it should alarm.
It has to sit in the same value band as the amber and violet it escalates from (L\* ~60–68), never below them.
The treatment lives on the affliction arc: when the projected blow would close a planet's remaining span, that span renders ember instead of the valence amber.
A doomed planet therefore shows no bone at all — the ember covers everything it had left — where a survivor keeps bone with an amber bite at the end.
Colour carries this rather than length, because length cannot: the projected span clamps at the ceiling, so a planet that dies draws a *shorter* mark than one that survives, and "more amber is worse" reads backwards.
Ember makes the read categorical — which of these dies — instead of a comparison of two lengths at seven different clock positions.

Rejected: coloring the lines by the two connected planets' own hues (primary for trine, secondary for square, a band traveling along the line). It was tried and read muddy — planet hues already carry identity on the glyphs, and doubling them onto the lines blurred mood. Mood lives in red/green; identity stays on the glyphs.

Rejected for the combust warning: amber (tried — it reads as the valence channel, and amber digits mimic the projection chip) and gold (the ground and invitation color — gold plus the breath clock already means *tappable*, and gold is the Sun).

---

## 6. Typography

Two faces. No more.

### Display: Cormorant Garamond

For planetary fragments, encounter openings, and any moment where the world is speaking. A high-contrast Garamond revival with Italian Renaissance bones — appropriate for material drawn from Marcus Aurelius, Sappho, the Upanishads, and the rest of the chorus.

- **Weight:** 400 (Regular) for body fragments; 500 (Medium) for emphasis; 600 (SemiBold) for titles when needed. Italics are permitted and earn their place in this face.
- **Sizes:** Fragment body 24px / 1.45 line-height; fragment attribution 14px / 1.3; encounter title 36px / 1.2.
- **Letter-spacing:** -0.01em on body, 0 on titles, +0.04em on attribution (small caps territory).
- **Color:** `Bone` on dark; `Smoke` on light. Never on a planetary color directly — fragments rest in a tinted but neutral field.

### Functional: Inter

For chrome that must read as legible at small sizes — turn indicators, subtle annotations, accessibility text. Used minimally. If Inter is showing up on a screen, ask whether it needs to.

- **Weight:** 400 (Regular) for body; 500 (Medium) for state indicators.
- **Sizes:** 13px / 1.4 for chrome; 11px / 1.3 for fine annotation.
- **Letter-spacing:** +0.02em at small sizes.

### Forbidden moves

- No typeface other than these two. No "ornamental" fonts for sign names. The signs are glyphs, not letters.
- No all-caps display type. The chorus speaks in sentences.
- No drop caps. Affectation that doesn't earn its weight.
- No text on a planetary color. Text rests on neutral.
- Avoid blockbuster game-UI text registers — no "+3 PERMISSION", "Level Up!", or HP-bar flourishes. Restrained functional chrome (a Distance readout, turn dots) is permitted where it does necessary work; see `SCREENS.md §3.7`.

---

## 7. Motion Language

Animation is part of the symbolic vocabulary. Every named motion has a duration, an easing, and a one-line brief.

### Named motions

| Motion                    | Duration | Easing                      | Brief                                                              |
|---------------------------|----------|-----------------------------|--------------------------------------------------------------------|
| Encounter open            | 1200ms   | ease-out                    | Two charts arrive into facing position. Ceremonial, unhurried.     |
| Planet activate           | 600ms    | ease-in-out, looping        | The active planet pulses — a slow heartbeat at the planet's tone.  |
| Aspect propagation (trine)| 1000ms   | ease-out                    | The green line flares brighter, then clears into the target.       |
| Aspect propagation (square)| 1400ms  | ease-in, hold, ease-out     | The red line flares, holds just short of terminus, then clears. Dissonant. |
| Combust                   | 1800ms   | cubic-bezier(.7,.0,.85,.0)  | The planet glyph desaturates to gray. Slow, then sudden.           |
| Tint shift                | 2000ms   | linear                      | Ambient color changes between planetary registers. Light shifting. |
| Map node arrival          | 400ms    | ease-out                    | The next node materializes. Modest, not theatrical.                |
| Fragment fade-in          | 800ms    | ease-out                    | Text appears one line at a time, lines staggered by 200ms.         |
| Badge merge               | 200ms    | ease-out                    | The incoming Δ badge slides into the affliction total and fades — the addition is seen, not inferred. |
| Invite breath             | 1100ms   | ease-in-out, looping        | Everything tappable right now breathes — a ring, node, or verb swelling slightly. Chart rings breathe in bone (their colour is reserved for the verb); map nodes and verbs breathe in their own colour. |
| Armed pulse               | 1100ms   | ease-in-out, looping        | The armed verb pulses harder, filled; its alternatives fall still. The confirm is the only thing asking. |

### The next click is always legible

At any moment it should be obvious what the player can — or should — tap next.
The signal is motion: every ambient glow is static, so a slow breath (the invite) is what marks the tappable.
It is one grammar everywhere — a breathing ring on a planet or map node, a breathing verb in the stats panel.
Hover snaps a ring's breath to a steady full glow (the verbs keep breathing); selecting collapses the invites to the chosen element.
Arming (the first tap of tap-to-commit) promotes exactly one next click: the armed element pulses harder while its alternatives fall still.
Stillness remains the default for everything that cannot be tapped right now.

Hover is subordinate in this grammar: it may intensify or preview what is already legible, never carry anything alone.
Mobile has no hover, so every affordance, reveal, and action must be reachable by taps alone — hover is strictly additive polish for pointer devices.

### Combat turn composition

In a combat turn the two charts resolve **sequentially** (MECHANICS §6): when the player commits, the opponent's chart lights up first — the player's action landing on it and propagating through its web — then, after a short pause, the player's chart resolves the opponent's reply. Watching the opponent before yourself keeps the two readable and lets a phase-1 combust visibly preempt the response. The total turn animation budget is roughly **3–4 seconds**, intentionally long enough to mask a Starknet transaction confirmation while preserving visual energy.

Narrative encounters do not use propagation animations. Resolution applies plain state-change flashes on affected planets — see `SCREENS.md §3.5`.

### What does not animate

The chart wheel itself, at rest, does not animate. No drifting, no breathing, no idle motion on any element that isn't currently tappable or active. Stillness is a default state.

The cursor does not pulse. Chrome that merely informs does not glow. Inactive planets do not shimmer. The world is calm until it asks for a decision — the invite breath (above) is that ask, and it is the only motion granted to a resting element.

### Forbidden motions

- Parallax. The world is a diagram, not a stage.
- Particle effects. No drifting dust, no sparkles, no ambient glitter.
- Camera shake.
- Spring-overshoot easing. No bouncy UI. The motion register is meditative, not playful.
- Any motion that loops faster than the active-planet pulse. The pulse is the fastest sustained beat in the game. Anything faster reads as digital.

---

## 8. Negative Space

The frame is mostly empty. This is a design rule, not an aesthetic preference.

- At least 50% of the encounter screen is `Void` (or tinted Void) at rest.
- The chart wheel sits in the center with its own breathing room — a margin of at least 80u between the outer ring and any other drawn element.
- Fragments are always set against empty ground, never overlaid on the chart.
- The map screen reads as a diagram with air around it. Pillar columns do not extend to the edges.

When in doubt, remove something. The af Klint and Jodorowsky references derive much of their authority from how much they leave out.

---

## 9. Layering

There are five visual layers. Anything drawn must declare which one it lives on.

1. **Void.** The background. Often tinted by active planet.
2. **Field.** Faint background structure — sign divisions, distant pillar lines, grid hairlines. Hairline weight, low opacity.
3. **Diagram.** The chart, the map, the aspect graph. Light to Regular weight. The game's primary visual layer.
4. **Active.** The currently activating elements — pulsing planet, propagating aspect, glowing node. Medium weight. Carries the player's attention.
5. **Word.** Text and glyphs that name things. Always topmost.

Layers do not blend. An Active element in front of Diagram is opaque against it; we do not see the diagram through the active element. Transparency lives only in halos and tint.

---

## 10. The Map's Visual Treatment

The Sephirot-like map (`spec/mechanics/MAP.md`) gets specific treatment because it has a tendency to render badly — diagrammatic graphs are easy to make ugly.

- Nodes are circles at planet-glyph proportions, drawn at Regular weight.
- Edges are Light weight at rest, Medium when traversed, Hairline when out of reach.
- Node fills are the ruling planet's primary color at low saturation; rim is the same color at full saturation.
- The map is centered and never fills its container — at least 15% of the container's width is margin on each side.
- The pattern's symmetry (or asymmetry) is preserved by the rendering. We do not "compose" the layout post-generation.

The map's rare canonical-Sephirot pattern (`MAP.md §2`) is rendered the same way as any other pattern. No special highlighting. The recognition is the player's, not the client's.

---

## 11. The Chart's Visual Treatment

The natal chart is the game's central drawing.

- Twelve sign divisions inscribed on the outer ring, hairline weight.
- Sign glyphs at the outer edge, sized at one-half the planet glyph radius.
- Whole-sign houses indicated by faint Field-layer wedges, never by lines crossing the chart center.
- Planets sit at their sign's mid-point on the inner ring, not at degree-precise positions (per `CHART.md §2` — we don't persist longitudes for gameplay).
- Where planets sit inside a sign follows three rules, not per-case tuning.
  **One pitch:** no two planets in the chart sit closer than the interaction ring's real footprint at the peak of its breath, stroke included — the spacing floor is set by what is drawn, not by the disc.
  **One rim:** every arrangement puts its outermost planet at the same radius, so the band reads as one ring whatever each sign happens to hold, and that radius is the largest the inner ring allows.
  **Two planets to an angular tier:** a third on the same arc consumes almost the whole 30° wedge and leaves nothing for the gap to the next sign, so the cap is structural rather than a tuned number.
  Tiers are spaced one pitch apart radially, so radial neighbours are spaced like angular ones.
- Arrangements are regular wherever a regular shape exists — three planets form an equilateral triangle, four a rhombus of two equilateral triangles — and the shapes are solved for rather than eyeballed.
  The angular offset and the inner radii are one relationship: move either and the other has to be re-solved, or the shape goes lopsided.
- Planets sharing a sign must sit closer to each other than to a planet in the next sign.
  A wedge is 30° and a same-sign pair straddles its mid-point symmetrically, so the offset that separates the pair is the same offset that closes the gap to the neighbouring sign: it has to stay under a quarter of the wedge, or the chart groups planets across a boundary more tightly than within one, which is backwards from what the chart exists to show.
  The ordering is what the rule guarantees; the margin it can buy is under a fifth either way, which is not enough to read as grouping on its own.
  *Deferred:* drawing the twelve boundaries inward across the planet band at Field weight, which is what would actually carry the read — the ticks mark the same divisions but sit out at the label band, far from where planets are placed.
  Built once and set aside; the spacing rules hold the ordering in the meantime.
- Aspect lines are drawn between planet glyph edges, never planet centers. This keeps the central area clear.
- The ascendant is marked by a single radial line from inner ring to outer ring at the rising sign's leading edge. Light weight.
- The chart has no "front" — it does not rotate to put any sign at the top. The conventional 1st-house-on-the-left orientation is preserved.
- The Field substrate's two halves sit at different scales: the slowly rotating hexagram stops short of the band where planets sit, while the vesica keeps its full radius as a soft echo of the inner ring.
  The hexagram is straight chords, the same primitive the aspect web is made of, so at rim scale only opacity separated the two; pulled inward, scale does.
  It is also the half that moves — a vertex at full radius travels the whole circumference each turn, and motion at the edge of a reading zone is what pulls the eye.
  The vesica has neither problem: nothing else in the chart is drawn as arcs, and its circles are offset only slightly from centre, so rotating them barely moves them.
  How far in the hexagram comes is a judgement rather than a derivation — the vesica offers no landmark inside its own closest approach to centre — and it is set small enough that the star reads as a mark at the middle of the wheel rather than as structure spanning it.
  Planets stacked deep in one sign are placed inward, and the innermost of those do cross the hexagram; that is accepted, since a planet placed that deep sits in open space anyway.
  The two halves turn in opposite directions, so the ground reads as layers rather than as one rigid object.
  They share a single period: two periods would beat against each other, and a beat is a second rhythm however it is labelled.
  This is affordable only because the halves no longer intersect — at any size where they crossed, opposing them would set the star's points sweeping through the arcs at double the relative rate, which shimmers.
  *Rejected:* collapsing the vesica along with the hexagram, which leaves the band between the two dead.
  *Rejected:* sizing the hexagram so one star vertex lands on each sign tick, which is what full radius bought.
  The rotation already spends that alignment — it is true for an instant every ten seconds and false through the rest of the turn.

A chart that is rendered at rest, with no encounter active, should feel like a Hilma af Klint diagram — symmetrical enough to read as a complete object, asymmetric enough in its planet placements to read as *this player's* chart and no one else's.

---

## 12. What the Client Must Never Do (Visual)

The visual analogue to `VIBES.md §What the Client Must Never Do`.

- **Never use raster art.** Including for backgrounds, including for "atmospheric textures." If it's not vector, it doesn't ship.
- **Never simulate paper, parchment, or canvas.** No grain, no fiber, no paper-edge effects. The world is a clean drawing, not a faux artifact.
- **Never use stock symbols or icons** beyond the astrological glyphs. Standard Unicode astrological characters (planets, signs) are acceptable. No Material Icons, no Font Awesome, no decorative icon sets.
- **Never break the layer hierarchy.** Word never sits behind Diagram. Active never sits behind Field. The order is the order.
- **Never animate at rest.** Stillness is a state, not an absence of state.
- **Never introduce a color outside the palette plus neutrals.** Including for "just this one error state."
- **Never use a typeface outside the two specified faces.** Including for "just this one tooltip."
- **Never gate an action or a reveal behind hover.** Hover is additive polish for pointer devices (§7); taps alone must reach everything.

---

## 13. Layout and Viewport

The client targets **desktop as canonical** — the surface where design decisions are validated first and where the visual register is most fully expressed. Mobile (specifically iPhone portrait) is a documented secondary layout, designed to coexist with the canonical layout without requiring re-architecture later.

The principle: *don't lock in desktop assumptions that mobile can't escape.* Two charts in a horizontal flex container is a desktop layout, not a universal one. Orientation should be a first-class layout decision, not a CSS-only resize.

### Canonical (desktop / landscape)

- The encounter screen places the player's chart on the left and the right-hand slot (opposing chart or ruling-planet glyph) on the right. The two charts face each other horizontally.
- The map screen is centered with margins; chrome lives at the top.
- Chart wheels render at full proportion per §11.

### Mobile portrait

- The encounter screen stacks vertically: player's chart on top, the right-hand slot below. The "two charts face each other" framing translates from horizontal to vertical without semantic change.
- The map retains its diagrammatic shape but reduces in scale to fit the available width. Vertical scrolling is acceptable on the map; not in encounters.
- Final-game chrome that lives in a bottom rail on desktop relocates to collapsible sheets or drawers on mobile.

### Switching rule

Layout is selected by orientation and viewport width, not by user-agent string. A desktop browser at narrow width adopts the mobile layout; a tablet in landscape adopts the canonical one. Exact breakpoints are TBD — pick during prototype validation, not in advance.

### What this constrains today

Mobile is not the focus, but design decisions that bake in horizontal-only assumptions are forbidden:

- No encounter chrome positioned strictly to the left or right of a single chart in a way that wouldn't survive stacking.
- No chart-wheel sizing in absolute pixels that assumes a desktop viewport.
- No interactions that rely on hover with no touch equivalent. Hover's role is settled (§7): strictly additive, never necessary.

The mobile layout doesn't have to be polished yet. It has to be possible.

---

## 14. Open Questions

Things this document deliberately does not yet answer, listed so they don't get lost:

- **Accessibility.** Color is doing a lot of work in this style. A planet's identity is communicated by color before glyph. We need a parallel channel — probably texture-on-glyph or ARIA labels — so the game is playable without color discrimination.

Recently resolved (see referenced sections):

- *Aspect graph at rest* — the web renders at a uniform opacity; **stroke weight** carries the rest→active step (Light → Medium), not opacity. Earlier passes dimmed resting lines and lifted the Title web to full via an `aspectsFull` flag; that opacity split was removed as an unnecessary layer — stroke alone reads cleanly and keeps the combat web legible for planning propagation. Confirmed by prototype (`img/chart-v3.png`).
- *Touch interaction model* — see `SCREENS.md §3.6`. Double-tap to commit, universal tap-to-inspect across both charts.
- *Sign and planet glyphs* — standard Unicode in v1 (replace prototype's text labels like "LIB" with `♎` etc.). Authored SVG alternatives reserved for later.
- *Loading and transition states between scenes* — fade through Void with active-planet tint shift, ~1000ms each direction. Map → Encounter inherits the "Encounter open" 1200ms ease-out from `§7`; Encounter → Map is a faster ~600ms fade.

---

## 15. Relationship to Other Specs

- `VIBES.md` — felt qualities, voice register, sound design. This document is the visual operationalization.
- `SCREENS.md` — which screens exist and how they relate. This document specifies *how things look*; SCREENS.md specifies *which surfaces exist*.
- `NFT.md` — the on-chain SVG generator. Style rules here apply to the NFT artifact too; the artifact and the client must look like the same object.
- `MAP.md` — topology and construction. §10 above covers map-specific rendering.
- `CHART.md` — chart computation. §11 above covers chart-specific rendering.
- `PLANETS.md` — planetary voices and color/tonal signatures. The palette inherits from there.
