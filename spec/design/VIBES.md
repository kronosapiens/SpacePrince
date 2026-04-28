# Space Prince — Vibes & Presentation

*How the client transforms mechanical state into felt experience.*

The contract defines what happens.
The client defines what it *feels like*.
This document specifies the presentation layer — narrative voice, visual language, and atmospheric design — that turns a strategy game into an art game.

The guiding principle:

> **The player should feel like they are learning a symbolic language, not optimizing a system.**

---

## Planetary Voice

Every planet has a **voice** — a tonal register drawn from real philosophical, literary, and spiritual traditions.
Fragments in that voice appear at moments where mood matters more than mechanics, principally the opening of narrative encounters.

See `spec/concept/PLANETS.md` for the full specification — chorus authors per planet, usage, voice rules, and sourcing notes.

---

## Visual Language

### Color

Each planet has a traditional color association.
These drive the visual palette dynamically based on what's happening in the game.

- **Sun:** gold, warm white
- **Moon:** silver, pale blue
- **Mercury:** quicksilver, shifting grey-green
- **Venus:** copper, rose, soft green
- **Mars:** red, iron
- **Jupiter:** deep blue, royal purple
- **Saturn:** lead grey, dark earth, black

#### Color Swatches

| Planet | Colors | | |
|--------|--------|---|---|
| **Sun** | ![](swatches/sun-gold.svg) Gold `#FFD700` | ![](swatches/sun-warmwhite.svg) Warm White `#FFF5CC` | |
| **Moon** | ![](swatches/moon-silver.svg) Silver `#C0C0C0` | ![](swatches/moon-paleblue.svg) Pale Blue `#B0C4DE` | |
| **Mercury** | ![](swatches/mercury-greygreen.svg) Grey-Green `#A8B5A2` | ![](swatches/mercury-quicksilver.svg) Quicksilver `#D4D4D4` | |
| **Venus** | ![](swatches/venus-copper.svg) Copper `#B87333` | ![](swatches/venus-rose.svg) Rose `#E8A0BF` | ![](swatches/venus-softgreen.svg) Soft Green `#8FBC8F` |
| **Mars** | ![](swatches/mars-red.svg) Red `#CD2626` | ![](swatches/mars-iron.svg) Iron `#5C4033` | |
| **Jupiter** | ![](swatches/jupiter-deepblue.svg) Deep Blue `#1B3F8B` | ![](swatches/jupiter-royalpurple.svg) Royal Purple `#4B0082` | |
| **Saturn** | ![](swatches/saturn-leadgrey.svg) Lead Grey `#6B6B6B` | ![](swatches/saturn-darkearth.svg) Dark Earth `#3B2F2F` | ![](swatches/saturn-black.svg) Black `#1A1A1A` |

The screen's ambient color reflects the **active planet**.
When Mars is in play, the world tilts red.
When Saturn dominates, things go grey and heavy.
Transitions between planets should feel like shifts in light — dawn to dusk, season to season.

### Art Style

The visual language draws from **spiritual abstraction** — art that uses geometry, color, and symbol to point at the numinous.

Primary references:
- **Hilma af Klint:** bold shapes, layered circles, organic symmetry, color as revelation.
- **Wassily Kandinsky:** composition through geometric tension, color relationships as emotional grammar.
- **Alejandro Jodorowsky:** alchemical imagery, tarot-inflected symbolism, sacred geometry that's alive and a little dangerous.

The aesthetic is **shapes, rainbows, alchemy, spirituality**.
Not pixel art. Not sci-fi chrome. Not medieval parchment.
Clean geometric forms saturated with color, arranged with the logic of a mandala or a diagram of correspondences.

### The Map as Sephirot

The roguelike map — the structure of nodes and paths the player traverses each run — evokes the **Kabbalistic Tree of Life**.

Seven layers arranged vertically, each either a single central node or a left-right pair, connected by pillar spines and asymmetric bookends.
The topology is procedurally generated each run from a simple grammar (see `spec/mechanics/MAP.md` for construction rules).
Occasionally the generation produces something very close to the actual Sephirot.
Deniably so.

The map should feel like a diagram of emanation — something flowing downward from unity into multiplicity, or upward from matter toward spirit, depending on which direction the player reads it.
Narrative nodes glow in their house's ruling-planet color; combat nodes are rendered in neutral outline.
Distant nodes are ghosts at hairline weight — the map manifests as the player approaches it.
Paths between nodes are visible aspect-lines, not just routes.
See `SCREENS.md §4` for full node and layout treatment.

### The Chart as Visual Center

The player's natal chart should be **always visible** — not as a HUD element but as the visual ground of the game.
The chart is not a menu; it is the world.

- Each planet's affliction state is shown numerically beside its glyph (per current prototype — see `img/chart-v3.png`).
- Combust planets gray out.
- During an active encounter, each chart's internal aspect web lights up — the connection between two charts is conceptual, not drawn.
- Aspect lines (trines, squares, oppositions) between planets are visible at rest at Hairline weight — the player sees their internal web.

### Encounter Visuals

Two charts face each other.
The current turn highlights the active pair of planets — one from each chart.
When the player selects a planet, it pulses in its color.
The opponent planet pulses in theirs.

**Aspect propagation should be the visual climax of each turn.**
When Mars activates and affliction inverts to testimony on Saturn via a square, the player should *see* the effect travel along the aspect line — a ripple of red becoming Saturn's grey.
When Jupiter's testimony flows to Venus via a trine, soft blue moves along the line.
The chart is a living system, and the propagation is its heartbeat.

Propagation that combusts a planet should feel significant — a desaturation moment, a sound design moment.
Not dramatic in a blockbuster way.
More like a candle going out.

---

## Sound Design Direction

Sound should reinforce the planetary color system.

- Each planet has a **tonal signature** — not a melody, but a texture. Saturn is low, sustained, mineral. Mercury is quick, metallic, slightly dissonant. Venus is warm, harmonic, close.
- Encounter turns produce sound from the active planets — the clash or harmony of two tonal signatures.
- Aspect propagation is *audible*. A trine propagation is a resolution. A square propagation is a dissonance that hangs.
- A planet combusting is the most significant sound event — its tonal signature cuts off mid-phrase.
- House encounters have ambient sound shaped by their ruling planet.
- The overall soundscape gets **sparser as planets combust**. Early in a run, the full chart hums. Late in a run, with planets dark, there are gaps — silences where voices used to be.

---

## Narrative Progression

The game's narrative is not a story that unfolds.
It is a **symbolic vocabulary that the player learns**.

Early runs: the player is learning mechanics.
Planetary voices are encountered but not understood.
The chart is a diagram.

Mid runs: the player starts to recognize patterns — not just mechanically but symbolically.
They know what Mars sounds like, what Saturn feels like when it's afflicted.
The chart starts to feel like a self-portrait.

Late runs: the player has internalized the symbolic language.
They anticipate not just the mechanical consequences of selecting a planet but the *feeling* of it.
The game is no longer explaining anything.
The player is reading their own chart fluently.

This progression requires **no mechanical changes**.
It emerges from the accumulation of fragments, visuals, and sounds across many runs.

> The game doesn't become meaningful. The player becomes literate.

---

## What the Client Must Never Do

- **Never explain astrology didactically.** No tutorials on what a trine is. The player learns through encounter, not instruction.
- **Never generate text.** All fragments are authored and curated. Quality over quantity.
- **Avoid blockbuster game-UI registers.** No "Level Up!", "+3 Attack", or HP-bar flourishes. Restrained functional chrome (a Distance readout, turn cadence, opponent indicator) is permitted where it does necessary work — see `SCREENS.md §3.7`. The aesthetic remains sparse and ethereal; treat it as provocation, not a strict ban on UI text.
- **Never rush.** Animations, transitions, and text should have pacing. Silence is a design tool. The game respects the player's time by not filling every moment.
- **Never flatten the mystery.** The player should always feel there is more to understand. Even at maximum progression, the chart should feel partially opaque — not because information is hidden, but because symbolic meaning is inexhaustible.
