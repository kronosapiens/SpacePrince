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
- **Planetary palette.** The seven palettes in `VIBES.md §Color` are the entire color universe. New colors are not introduced. Backgrounds, text, line work, and chrome are all derived from the palette plus a small neutral scale (§5).
- **Active-planet tint.** The screen's ambient color reflects the active planet (`VIBES.md §Color`). The tint is global; the chart, map, and chrome all sit inside it.
- **Diagram as world.** The chart is the visual ground (`VIBES.md §The Chart as Visual Center`). It is never a corner HUD. The map is a diagram of emanation, not a level select. The encounter is two charts speaking, not a battle screen.

---

## 2. Geometric Vocabulary

The client draws with a closed set of primitives.
Anything not on this list requires a deliberate exception.

### Allowed primitives

- **Circle.** The dominant form. Planets, nodes, orbits, halos, the outer chart ring. Hilma af Klint's vocabulary almost entirely.
- **Line segment.** Aspect lines, spine connections, pillar paths. Always straight.
- **Arc.** Sign boundaries on the chart wheel, partial halos around active planets, sweep transitions.
- **Polygon — regular only.** Triangles (trines), squares (squares), hexagons (sextiles), dodecagons (the zodiac itself). Irregular polygons are forbidden.
- **Spiral.** Reserved. One spiral per screen, maximum. Used for emanation cues and rare cosmic moments.
- **Glyph.** Authored SVG paths for the seven planets and twelve signs. Drawn once, reused everywhere. No alternates.

### Forbidden primitives

- Bezier curves outside of authored glyphs. The world does not draw freehand.
- Rectangles with rounded corners. If something needs to be a rectangle, it is a rectangle; if it needs to be soft, it is a circle.
- Dashed or dotted lines. Lines are solid.
- Drop shadows. Depth is communicated through layering, opacity, and stroke weight, not through simulated lighting.
- Gradients on strokes. Only fills receive gradients (§5).

The vocabulary should feel like a Hilma af Klint plate or a Renaissance armillary diagram — a small set of marks combined with discipline, not a wide set used loosely.

---

## 3. Stroke Scale

Stroke weights are defined relative to the unit grid, not in absolute pixels. This keeps the line work coherent across the chart wheel, the map, and the encounter, all of which sit in different viewBox sizes.

Let `u` = 1 unit on the active viewBox, where the canonical chart wheel uses a 1000×1000 viewBox.

| Name      | Weight   | Use                                                            |
|-----------|----------|----------------------------------------------------------------|
| Hairline  | `0.5u`   | Sign boundaries, faint background grid, distant aspects.       |
| Light     | `1u`     | Aspect lines at rest, chart inner ring.                        |
| Regular   | `1.5u`   | Map paths, planet glyph strokes, chart outer ring.             |
| Medium    | `2.5u`   | Active aspect line, active planet halo, encounter spine.       |
| Heavy     | `4u`     | Combust crack, the rare emphatic mark. Used sparingly.         |

Weights scale the same way across viewBoxes — a 500-unit map uses the same five weights, just with `u = 0.5px` at default zoom.

The ratio between adjacent weights is roughly 1.6 (golden-ratio-adjacent, not an accident — af Klint's plates do this).

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
- **Radial gradients** are permitted only on planet halos and on the ambient screen tint. The gradient runs from the planet's primary color at the center to transparent at the edge. Never from one palette color to another.
- **Linear gradients** are forbidden. They read as digital and break the painterly register.
- **Mesh gradients** (SVG2) are forbidden until SVG2 support is universal. Approximate with layered radial gradients if needed.

### Active-planet tinting

When a planet is active, the entire screen receives an ambient tint in that planet's primary color at 8% opacity, applied as a full-canvas radial gradient centered behind the active element. The tint composites over `Void`, not under it.

Transitions between tints take 2000ms, linear easing — slow enough to feel like the light changing in a room, fast enough that a player who looks away and back perceives the new state.

### Aspect propagation color

When an aspect propagates between two planets, the line's stroke transitions from the source planet's color to the destination planet's color over the propagation duration (§7). The transition is positional along the line — a literal traveling band of color — not a global crossfade.

A trine propagation uses both planets' primary colors.
A square propagation uses both planets' *secondary* colors (the darker / heavier ones — Mars iron, Saturn dark earth, Venus copper). The visual difference between a harmonious and a discordant propagation should be perceptible without text.

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
- No game-UI text registers — no "+3 PERMISSION" or "TURN 4". The world doesn't talk like that. (This is `VIBES.md §What the Client Must Never Do` restated for type.)

---

## 7. Motion Language

Animation is part of the symbolic vocabulary. Every named motion has a duration, an easing, and a one-line brief.

### Named motions

| Motion                    | Duration | Easing                      | Brief                                                              |
|---------------------------|----------|-----------------------------|--------------------------------------------------------------------|
| Encounter open            | 1200ms   | ease-out                    | Two charts arrive into facing position. Ceremonial, unhurried.     |
| Planet activate           | 600ms    | ease-in-out, looping        | The active planet pulses — a slow heartbeat at the planet's tone.  |
| Aspect propagation (trine)| 1000ms   | ease-out                    | Color travels along the line. Resolves cleanly into the target.    |
| Aspect propagation (square)| 1400ms  | ease-in, hold, ease-out     | Color travels, pauses just before terminus, completes. Dissonant.  |
| Combust                   | 1800ms   | cubic-bezier(.7,.0,.85,.0)  | The planet glyph dims. Slow, then sudden — a candle going out.     |
| Tint shift                | 2000ms   | linear                      | Ambient color changes between planetary registers. Light shifting. |
| Map node arrival          | 400ms    | ease-out                    | The next node materializes. Modest, not theatrical.                |
| Fragment fade-in          | 800ms    | ease-out                    | Text appears one line at a time, lines staggered by 200ms.         |

### What does not animate

The chart wheel itself, at rest, does not animate. No drifting, no breathing, no idle motion on any element that isn't currently active. Stillness is a default state.

The cursor does not pulse. Buttons do not hover-glow. Inactive planets do not shimmer. The world is calm until it isn't.

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
- Aspect lines are drawn between planet glyph edges, never planet centers. This keeps the central area clear.
- The ascendant is marked by a single radial line from inner ring to outer ring at the rising sign's leading edge. Light weight.
- The chart has no "front" — it does not rotate to put any sign at the top. The conventional 1st-house-on-the-left orientation is preserved.

A chart that is rendered at rest, with no encounter active, should feel like a Hilma af Klint diagram — symmetrical enough to read as a complete object, asymmetric enough in its planet placements to read as *this player's* chart and no one else's.

---

## 12. What the Client Must Never Do (Visual)

The visual analogue to `VIBES.md §What the Client Must Never Do`.

- **Never use raster art.** Including for backgrounds, including for "atmospheric textures." If it's not vector, it doesn't ship.
- **Never simulate paper, parchment, or canvas.** No grain, no fiber, no paper-edge effects. The world is a clean drawing, not a faux artifact.
- **Never simulate lighting.** No drop shadows, no glows beyond the specified halos, no rim lighting, no specular highlights.
- **Never use stock symbols or icons.** All glyphs are authored for this game. No Material Icons, no Font Awesome, no zodiac glyphs pulled from a font.
- **Never break the layer hierarchy.** Word never sits behind Diagram. Active never sits behind Field. The order is the order.
- **Never animate at rest.** Stillness is a state, not an absence of state.
- **Never introduce a color outside the palette plus neutrals.** Including for "just this one error state."
- **Never use a typeface outside the two specified faces.** Including for "just this one tooltip."

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
- No interactions that rely on hover with no touch equivalent. Hover-vs-touch is itself an open question (§14), but the architecture must leave room to answer it.

The mobile layout doesn't have to be polished yet. It has to be possible.

---

## 14. Open Questions

Things this document deliberately does not yet answer, listed so they don't get lost:

- **Sign glyphs.** Authored or selected from a PD source (e.g. classical astrological woodcuts)? Authored is more coherent but more expensive.
- **The aspect graph at rest.** Always visible, faintly? Or only visible during encounters? VIBES.md says "the player sees their internal web" — probably always visible at Hairline weight, brightening to Light when an aspect is touched.
- **Touch interaction model.** Hover-to-inspect / click-to-act is the desktop model in the current prototype. On touch there's no hover. Tap-to-inspect-then-tap-to-commit, long-press-to-commit, and inspect-mode toggles are all candidates — none chosen. This affects mobile but also desktop interaction grammar, since whatever pattern wins should feel natural on both.
- **Loading and transition states between scenes.** Currently undefined. Probably a slow tint shift on a Void canvas, but worth specifying.
- **Accessibility.** Color is doing a lot of work in this style. A planet's identity is communicated by color before glyph. We need a parallel channel — probably texture-on-glyph or ARIA labels — so the game is playable without color discrimination.

---

## 15. Relationship to Other Specs

- `VIBES.md` — felt qualities, voice register, sound design. This document is the visual operationalization.
- `SCREENS.md` — which screens exist and how they relate. This document specifies *how things look*; SCREENS.md specifies *which surfaces exist*.
- `NFT.md` — the on-chain SVG generator. Style rules here apply to the NFT artifact too; the artifact and the client must look like the same object.
- `MAP.md` — topology and construction. §10 above covers map-specific rendering.
- `CHART.md` — chart computation. §11 above covers chart-specific rendering.
- `PLANETS.md` — planetary voices and color/tonal signatures. The palette inherits from there.
