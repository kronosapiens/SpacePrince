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
When a planet acts, speaks, or is referenced, the language reflects its nature.

### Voice Register

- **Sun:** sovereign, declarative, present-tense. Marcus Aurelius, Whitman, the Bhagavad Gita.
- **Moon:** reflective, shifting, intimate. Bashō, Rilke, the Psalms.
- **Mercury:** quick, ambiguous, playful. Hermes Trismegistus, Borges, Zhuangzi.
- **Mars:** direct, clipped, committed. Musashi, Fanon, the Iliad.
- **Venus:** sensory, relational, attuned to beauty. Sappho, Rumi, Sei Shōnagon.
- **Jupiter:** expansive, generous, oracular. Emerson, Tagore, the Upanishads.
- **Saturn:** austere, patient, measured. Epictetus, Ecclesiastes, Simone Weil.

### When Planets Speak

- **Encounter narration.** When a planet is sent into a turn, a fragment appears — brief, atmospheric, never interrupting.
  Not: "Mars deals 3 affliction."
  But: *"Forward."* — and the numbers follow beneath.
- **Aspect propagation.** When effects propagate through an aspect (Mars activates, Saturn receives inverted testimony via a square), both planets speak — briefly, in tension.
  *"Forward."* / *"Not yet."*
  The player feels the relationship between their planets, not just the arithmetic.
- **Combustion.** When a planet combusts, it speaks one last time — a longer fragment, a closing thought.
  The silence that follows should be noticeable.
  A voice the player has been hearing all game goes quiet.
- **House encounters.** The ruling planet of the house introduces the encounter.
  A Jupiter-ruled house speaks expansively.
  A Saturn-ruled house speaks sparely and with warning.
- **Chart recognition moments.** At progression milestones, a planet offers an observation about the player's chart (see below).

### Voice Rules

- Fragments are **short** — one sentence, rarely two. Never a paragraph.
- Fragments are **curated, not generated** — a library of real quotes and original lines, tagged by planet, mood, and context.
- Fragments are **never repeated** within a run. Across runs, repetition is fine — recognition becomes part of the experience.
- Fragments **never explain the mechanic**. They accompany it.
- The player should eventually associate each planet's voice with its mechanical role — not because the game tells them to, but because they've heard Mars speak a hundred times and know what Mars sounds like.

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

### The Chart as Visual Center

The player's natal chart should be **always visible** — not as a HUD element but as the visual ground of the game.
The chart is not a menu; it is the world.

- Planets glow or dim based on affliction state.
- Combust planets go dark.
- The active encounter highlights the connection between two charts.
- Aspect lines (trines, squares, oppositions) between planets are visible — the player sees their internal web.

### Encounter Visuals

Two charts face each other.
The current turn highlights the active pair of planets — one from each chart.
When the player selects a planet, it pulses in its color.
The opponent planet pulses in theirs.

**Aspect propagation should be the visual climax of each turn.**
When Mars activates and affliction inverts to testimony on Saturn via a square, the player should *see* the effect travel along the aspect line — a ripple of red becoming Saturn's grey.
When Jupiter's testimony flows to Venus via a trine, soft blue moves along the line.
The chart is a living system, and the propagation is its heartbeat.

Propagation that combusts a planet should feel significant — a dimming, a crack, a sound design moment.
Not dramatic in a blockbuster way.
More like a candle going out.

### House Encounter Visuals

Each house has a visual mood derived from its theme and ruling planet.
Entering a house encounter should feel like entering a *place*, not opening a menu.

- **1st house:** a mirror, a threshold, your own face
- **4th house:** underground, roots, stone
- **7th house:** an open field, someone across from you
- **10th house:** a summit, exposed sky, wind
- **12th house:** deep water, fog, things half-seen

---

## Chart Recognition (Self-Knowledge Moments)

At progression milestones, the game surfaces **interpretive observations** about the player's chart.
These are not horoscopes.
They are structurally grounded statements about how the player's chart has been expressing itself through play.

### Examples

After a planet combusts for the third time across runs:
> *"Saturn has combusted again. It sits in your 5th house — pleasure constrained, joy deferred. Each time it goes dark, the game gets quieter. Have you noticed what you lose when discipline fails?"*

After reaching a new depth record:
> *"Your Moon trines your Jupiter. You've always recovered well — setbacks expand rather than diminish you. This is why you're still here."*

After activating a difficult aspect:
> *"Your Mars squares your Venus. Every time you send one, the other pays. You've been managing that tension all game. What have you learned about the cost?"*

### Design Rules for Recognition Moments

- **Grounded in actual chart mechanics.** Every observation must reference a real feature of the player's chart — a sign placement, an aspect, a house, a pattern of play.
- **Questioning, not declarative.** End with a question or an observation, not a verdict. The player interprets.
- **Rare.** A few per run at most. If they happen too often they become noise.
- **Accumulative.** Over many runs, the player builds a mosaic of observations about their chart. No single moment explains everything. The full picture emerges slowly — like reading a difficult poem many times.

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
It emerges from the accumulation of fragments, visuals, sounds, and recognition moments across many runs.

> The game doesn't become meaningful. The player becomes literate.

---

## What the Client Must Never Do

- **Never explain astrology didactically.** No tutorials on what a trine is. The player learns through encounter, not instruction.
- **Never generate text.** All fragments are authored and curated. Quality over quantity.
- **Never break the symbolic register with game-UI language.** No "Level Up!" or "+3 Attack." The world speaks in its own voice.
- **Never rush.** Animations, transitions, and text should have pacing. Silence is a design tool. The game respects the player's time by not filling every moment.
- **Never flatten the mystery.** The player should always feel there is more to understand. Even at maximum progression, the chart should feel partially opaque — not because information is hidden, but because symbolic meaning is inexhaustible.
