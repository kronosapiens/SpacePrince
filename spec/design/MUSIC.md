# Space Prince — Music

*The sonic vocabulary, and how we intend to build it.*

`VIBES.md` describes how the game should feel and `STYLE.md` what it should look like.
This document is the third surface — what it should *sound* like: the current creative direction and working method.

The guiding principle:

> **The same seven planets you play, in sound.**

**Status:** first in-engine realization shipped; planetary event tones are being tuned.
The shared tonic, planet-to-mode mapping, planet-to-degree mapping, register, and timbre are design choices described below.
All seven themes now play in the client (`client/src/audio/themes.ts`, developed from `music-sketches/`) as synchronized bed + down + up layers.
The surface selects the mix — map breathes the down layer and combat drives the up layer — while one ruler's theme remains active at a time.
This vertical variation within one theme is distinct from the future multi-planet layered model in Architecture (b).
Theme selection: the map plays the Prince's chart ruler, combat the opponent's chart ruler, narrative the house ruler.
The standalone per-planet signature gestures have been removed from the client.
Event audio uses the ruler-relative degrees below, voiced within one octave around Sun's D5 tonic.
The DAW pass (real timbre and mix) remains future work; Venus and Saturn's open mode calls were resolved provisionally in the shipped themes (Venus Mixolydian, Saturn Locrian over a moving toll rather than a static pedal).

---

## Reference

The starting reference is Gustav Holst's *The Planets* (1914–17).
It is a natural fit because its movements are organized by **astrological archetype**, not astronomy — Holst's own subtitles ("Mars, the Bringer of War"; "Saturn, the Bringer of Old Age") are the same archetypes we build planets from.

We treat it as a **quarry, not a cover.**
We mine its archetypes, harmonic language, and metric character; we do not transcribe its movements.
A literal synth-cover of the suite is explicitly rejected: it fights our restraint (Holst shouts, our visuals whisper), it has been done (Tomita, 1976), and it doesn't fit our planet set (see below).

---

## Rights

The *composition* is public domain essentially worldwide — US (published 1921, pre-1930) and UK/EU (Holst d. 1934, life+70 cleared 2005).
Public domain covers the **score, not any recording**: sampling an existing orchestra would pull in a separate recording copyright.
Because we re-arrange from the score in a DAW rather than sample, we sidestep that entirely and **own our arrangement outright.**
There is no estate left to clear; the historical objection to synth versions (Imogen Holst's) expired with the copyright.

---

## The seven-planets gap

Holst's seven are **not** our seven.
He covers Mars, Venus, Mercury, Jupiter, Saturn, Uranus, Neptune — pointedly omitting the **Sun and Moon** (our two luminaries) and adding Uranus/Neptune (modern outer planets, outside our traditional set).
So the reference gives us five planets and a hole exactly where our most important bodies are.

**We compose Sun and Moon ourselves** — and we do them *last*, after the five Holst-derived themes have set the palette, so they inherit the same world rather than inventing their own.

---

## Structure

The structural model is Ben Prunty's *FTL* soundtrack, not the concert-suite form.

- **7 planet themes, each with two variants** — a downtempo "explore" and an uptempo "battle" — for **14 pieces**, ~3–4 minutes each.
- The two variants of a theme **share harmonic DNA** (Prunty's trick: same bed, the battle version adds percussion and drive), so they crossfade without a jarring cut.
- This means we really compose **7 cores and derive their variants**, not 14 unrelated pieces — it roughly halves the work.

The adaptive logic then falls out for free: the **active planet** selects the theme, **map vs. combat** selects the variant (the runtime model and its later extension are in *Architecture*, below).
Themes stay **ambient and atmospheric**, not character songs — consistent with planets staying ambient (no Hades-style personification).

---

## Musical structure and design choices

Choosing the seven diatonic modes is itself a design choice.
Within that family, the musical definitions give us:

- Seven pitch classes per octave, with a different interval pattern for each mode.
- Seven rotations of the major scale's whole-step and half-step pattern: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian.
- Relative modes that share a pitch collection but have different tonics; parallel modes that share a tonic but have different pitch collections.
- A determined pitch class once the tonic, mode, and scale degree are specified; an octave placement is still needed to determine the sounding pitch.

The interval patterns and parallel relationship are described in [Open Music Theory](https://pressbooks.nebraska.edu/openmusictheory/chapter/intro-to-diatonic-modes-and-the-chromatic-scale/).
These definitions impose no planetary associations.
Seven planets do not require using every mode or every degree exactly once.

| Design choice | Current setting |
|---|---|
| Tonic | D for all planetary modes |
| Planet → mode | One of the seven modes per planet, using each once; associations are interpretive |
| Planet → degree | Sun 1, Venus 2, Mercury 3, Moon 4, Saturn 5, Jupiter 6, Mars 7, fixed across rulers |
| Active mode | Combat uses the opponent's chart ruler, narrative the house ruler, map necessity the player's chart ruler |
| Register | Sun at D5, with degrees 5–7 below and degrees 2–4 above, spanning less than one octave |
| Timbre | One shared `PLANET_VOICE` for strikes and necessity, currently auditioning the existing plucked arpeggio voice |
| Event notes | Each affected planet sounds its assigned degree, without aspect-added notes |

The mode and degree assignments can be changed independently.
For example, assigning Jupiter another mode would change Jupiter-ruled encounters; it need not change Jupiter's degree when sounded as a target.
The pitch matrix is derived from these choices rather than assigned separately cell by cell.
Membership in one mode does not guarantee that every sequence or combination will sound pleasing; rhythm, voicing, overlap, and phrasing still matter.

---

## Cohesion — parallel modes on a shared tonic

The current approach uses one home pitch, D, with each planet's theme in a different mode on that tonic.
The shared tonic gives the themes a common reference and lets the event notes follow the active theme's mode.
It also parallels the global planetary tint in `STYLE.md`.

A shared tonic is neither required for simultaneous music nor sufficient to make it consonant.
For example, D Lydian and D Phrygian contain conflicting pitch classes despite sharing D.
Any future layering of planetary themes needs compatible musical material and arrangement.
A drone is one possible arrangement choice, not a requirement of modal music or of the pitch matrix.

D is a chosen home pitch; transposing the system preserves its interval relationships.

---

## The seven modes

Parallel modes can be ordered as a **brightness ladder** — Lydian → Ionian → Mixolydian → Dorian → Aeolian → Phrygian → Locrian — with each step lowering one degree by a semitone.
The planetary assignments below interpret that ordering through temperament and the benefic–malefic axis.
They are artistic associations, not consequences of the interval patterns.

| Planet  | Mode       | Rationale |
|---------|------------|-----------|
| Jupiter | Lydian     | Greater benefic; the ♯4 reaches past its own boundary — "the frame is larger than the problem." |
| Sun     | Ionian     | The major reference mode is chosen to express the sovereign center. |
| Venus   | Mixolydian | Warm major-lean with an unresolved ♭7 ache. *(provisional — see below.)* |
| Mercury | Dorian     | Dorian's interval pattern is a palindrome, inverting to itself — the self-inverting trickster, "turn it over, and again turn it over." |
| Moon    | Aeolian    | Natural minor; nocturnal, reflective, soft. |
| Mars    | Phrygian   | The ♭2 carries menace — the dark, militaristic mode. |
| Saturn  | Locrian    | Darkest; the ♭5 denies a stable home. *(provisional — see below.)* |

**Mode is the fingerprint; meter is the character.**
The ladder is a cohesion/identity device, not a differentiation one — Mars and Saturn are both dark yet nothing alike, and that difference lives in **meter, tempo, register, and rhythm**.
Holst pre-solves these for the five planets he wrote: Mars's 5/4 ostinato, Mercury's fast bitonal 6/8, Venus serene and slow, Jupiter broad and majestic, Saturn's processional tolling.
The two we invent fill the gaps — the **Sun** is the steady centered pulse everything else is heard against; the **Moon** is the floating nocturne.
A planet's mode stays the same across its explore and battle variants as a choice of thematic continuity.

**Reasons for two of the assignments.**

- **Sun = Ionian** connects the sovereign character with the major reference mode.
- **Saturn = Locrian** uses the diminished tonic triad as an interpretation of instability and constraint.
  The current Saturn theme uses a moving toll; Locrian does not require a drone.

**Two open calls.**

- **Venus** — Mixolydian is provisional; Venus may want a sweeter Lydian/Ionian color, and Jupiter and Venus both have a claim on the bright end.
- **Saturn** — strict Locrian versus a drone-anchored dark (Phrygian, or harmonic minor with a ♭5 color) is a call to settle at the keyboard.

This honors the caveat to carry forward: the mode serves the planet, and "7 planets = the 7 diatonic modes" must not harden into law — a planet may want harmonic minor or something non-diatonic.

**A free arc from the unlock schedule.**
The Macrobian unlock order (`MECHANICS.md §11.1`: Moon → Mercury → Venus → Sun → Mars → Jupiter → Saturn) walks the ladder as Aeolian → Dorian → Mixolydian → Ionian — a dawn from lunar minor up to solar clarity — then Phrygian / Lydian / Locrian, where the transpersonal planets break the gradient: Mars stabs dark, Jupiter blazes brightest, Saturn arrives darkest as the final teacher.
The music's emotional arc as the chart fills in is built into the unlock schedule for free.

---

## The strike grid — one mode per encounter, a degree per planet

Every combat encounter has a ruler (`MECHANICS.md §11`), and the combat score already plays the ruler's theme, so the encounter sits in one mode from its first turn to its last.
The resolution strikes ring in that same mode: every beat that strikes a planet — the direct hit, each propagation hop, each combust — sounds that planet's **degree** in the ruler's mode, on the shared D.
It is the same set of beats that lights the edge bands, so band and note are one event, the key struck.
The narrative screen strikes the same way at its house's natural ruler: each planet an outcome touches rings its degree, so an outcome that touches several planets sounds as a chord.

Sun supplies the tonic, D5, at the middle of the seven-note arrangement.
From low to high, the planets are Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.
This follows the planetary pitch order described in [Boethius, *Fundamentals of Music*, I.27](https://www.examenapium.it/cs/biblio/Godwin1993.pdf) and reverses the game's Macrobian unlock order.
The historical alignment concerns planetary ordering; the shared D tonic and seven parallel modes remain design choices.
[Macrobius's own musical account, II.4](https://dokumen.pub/macrobius-commentary-on-the-dream-of-scipio-9780231880046.html) follows Cicero in placing the Moon lowest, so its pitch direction is opposite to ours.
The ruler changes the mode and its intervals while the planetary ordering stays the same.
`PLANET_MODE` and `PLANET_DEGREE` in `client/src/audio/pitches.ts` store the assignments independently.

All planetary event notes use D5 as their common tonic anchor.
Degrees 5–7 are voiced an octave below their ascending-scale positions; degrees 1–4 retain those positions.
Sun has three voices below and three above, and each mode's arrangement spans ten or eleven semitones.
The lowest sounding note is the bass; the tonic need not be the lowest note.

| Planet | Current degree | Placement relative to D5 |
|---|---:|---|
| Saturn | 5 | Below |
| Jupiter | 6 | Below |
| Mars | 7 | Below |
| Sun | 1 | Tonic |
| Venus | 2 | Above |
| Mercury | 3 | Above |
| Moon | 4 | Above |

The ruler selects the row and the affected planet selects the column.
The ruler's own planet keeps its assigned degree; it does not take the tonic from Sun.

| Ruler's mode | Saturn | Jupiter | Mars | Sun | Venus | Mercury | Moon |
|---|---|---|---|---|---|---|---|
| Jupiter, Lydian | A4 | B4 | C♯5 | D5 | E5 | F♯5 | G♯5 |
| Sun, Ionian | A4 | B4 | C♯5 | D5 | E5 | F♯5 | G5 |
| Venus, Mixolydian | A4 | B4 | C5 | D5 | E5 | F♯5 | G5 |
| Mercury, Dorian | A4 | B4 | C5 | D5 | E5 | F5 | G5 |
| Moon, Aeolian | A4 | B♭4 | C5 | D5 | E5 | F5 | G5 |
| Mars, Phrygian | A4 | B♭4 | C5 | D5 | E♭5 | F5 | G5 |
| Saturn, Locrian | A♭4 | B♭4 | C5 | D5 | E♭5 | F5 | G5 |

Under these assignments, Saturn voices scale degree 5 below Sun, Venus carries the second, Mercury the major or minor third, and Moon the fourth, raised under Jupiter.
These planetary relationships are consequences of the current mappings and change if those mappings change.
Propagation selects a sequence of these notes through the aspect web; overlapping notes also form harmonies within the mode.

An action is a short phrase inside the ruler's mode: the acting planet's degree opens and the target planet's degree lands.
Testimony and Affliction use the same planetary notes.
Each propagation sounds only the target's assigned note, regardless of aspect.
Combustion begins the target's ruler-relative voice, chokes it, and releases a breath.
Strikes and necessity use the same pitch calculation and shared voice setting.
Music is opt-in while sound is on by default, so the strikes must read alone, and a melody of degrees over silence does.

The matrix can also use another seven-note scale, such as harmonic minor, for a ruler's row.
That changes the row's interval pattern without requiring a new degree assignment for the ruling planet.

---

## Architecture — jukebox now, layered later

There are two sonic scales.

- **Music** (here): the themes — the score.
- **Event sound** (`VIBES.md §Sound Design`): short ruler-relative phrases for actions, propagation, and combustion.

The score and event sounds share the tonic and planet-to-mode mapping.
The score has composed melodies and instrument registers; event sounds use the planet-to-degree mapping and shared octave above.
There is no separate library of pitched per-planet jingles.
The ruler governs the event pitch collection throughout an encounter, and the affected planet selects the degree.

**Combat-music model: implement (a), architect for (b).**

- **(a) Jukebox** *(v1)* — the encounter ruler's battle variant plays while the event layer articulates actions and combustion inside that mode.
  The score does not progressively thin as individual planets combust.
- **(b) Layered** *(possible later)* — combat music is a live mix of the fielded planets' battle stems, each muting as it combusts: literally the chart-as-chord in motion.
  This is the architecture that can make the continuous soundscape grow genuinely sparser as planets go dark.
  It is richer but larger, and it requires every theme to be writable as a simultaneous stem.

The shared tonic is intended to help a possible layered arrangement; it does not guarantee that independently composed themes will work together.
That arrangement would need its own composition and listening pass.

---

## Working method

We work **from theory outward**, and the ear is a checkpoint, not the working surface.

The shared text language:

- **Harmony** in Roman numerals, mode-relative (`i – ♭VII – ♭VI – ♭VII`).
- **Melody** in scale degrees, so we argue contour and tension rather than keys (`5 – ♭6 – 5 – 1`).
- **Mode + meter** named per planet.
- **Motif** as an interval/rhythm cell that recurs and transforms.
- **Form** as section letters with loop points, plus how the battle variant escalates from explore.

Order of operations per planet: mode + metric character → harmonic bed → motif → form → realize.

**Division of labor.**
Claude composes — notes, harmony, structure, and the symbolic/MIDI output — but composes *blind* (cannot hear its own output).
The user is the ear, the taste, and the DAW/mix.
The loop is: Claude writes → user renders and judges → Claude revises.

**Ear access before the DAW.**
Full timbre and mix wait for DAW infrastructure (not yet set up).
But melody and harmony can get a *rough* piano-timbre audition now via ABC notation in free MuseScore or an online player, so theory work doesn't pile up untested.

---

## Tooling

- **MIDI-first** for composing and auditioning — multi-track `.mid` (pad/bed, bass, lead, arp, and a percussion/drive layer for battle), imported into a DAW where the synth character and mix are applied.
- **Tone.js** is the eventual in-game home: the client is already React/Vite/TS, so the explore↔battle crossfade can be real adaptive code rather than two exported files.

---

## North star (parked)

The chart is 7 planets across 12 signs; both the zodiac and the chromatic circle are circles of twelve.
So a Prince's chart could *be* a chord — each placement a note — making hand-composed themes and procedural, per-Prince music one system instead of two.
We are not pursuing this yet, but it is no longer only aspirational: the shared-tonic commitment and the layered (b) model (*Architecture*) are precisely the groundwork it needs.

---

## Open decisions / next

Current choices are described above: parallel modes on D, separate planet-to-mode and planet-to-degree mappings, a shared event octave and voice, and the jukebox architecture.

Remaining, roughly in order:

1. Settle the two open mode calls — Venus's bright color, and Saturn's strict-Locrian-vs-drone-anchored dark.
2. Formalize metric character per planet: confirm the five inherited from Holst, and pin the Sun's reference pulse and the Moon's nocturne.
3. Per piece: harmonic bed → motif → form → explore/battle relationship — composing each battle core so it can also stand as an isolated stem (*Architecture* (b)).
4. Complete the ruler-relative action and combustion phrases above, then compose the mint ceremony as its own cue.

Blocked on nothing at the theory level; full realization is blocked on DAW infrastructure.
