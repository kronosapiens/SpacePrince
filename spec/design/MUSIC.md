# Space Prince — Music

*The sonic vocabulary, and how we intend to build it.*

`VIBES.md` describes how the game should feel and `STYLE.md` what it should look like.
This document is the third surface — what it should *sound* like: the committed creative direction and the working method, ahead of the per-piece composition itself.

The guiding principle:

> **The same seven planets you play, in sound.**

**Status:** direction committed, realization pending.
The cohesion model (parallel modes on a shared tonic), the home pitch, the per-planet mode mapping, and the runtime architecture (jukebox now, layered later) are decided below.
Two mode calls (Venus, Saturn) and the per-piece work remain; full realization is blocked on DAW infrastructure.

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

## Cohesion — parallel modes on a shared tonic

Cohesion has several independent levers — a **shared tonic**, a **shared collection** (one pitch set, varying tonics), a **shared chord-color**, a **shared motivic germ** (one cell seeded across all 14), and **shared timbre** (the strongest, but a DAW concern, not a theory one).
A suite can be tonally varied and still tightly unified when cohesion lives in any of these — FTL changes key track to track and coheres through idiom and timbre alone.

We commit to the strongest form anyway: **one home pitch, each planet a different mode on that same tonic** — parallel modes (Lydian / Dorian / Phrygian on one root), not different keys.

The decisive reason is **simultaneity**, not transitions.
A shared tonic is the precondition for planets to *sound at once*: the chart-as-chord north-star (below) is coherent only if placements share a root, as is any combat texture carrying more than the active planet (the layered model in *Architecture*).
Different keys would be polytonal mush; one tonic lets the chart be voiced as a single chord.
Seamless **transitions** are a real but secondary benefit — the drone holds while only the upper structure moves, so explore↔battle crossfades and between-encounter planet swaps don't lurch.
And it rhymes with the visuals: the active-planet tint in `STYLE.md` is one global ground the current planet recolors; parallel modes are that structure in sound.

*Caveat.*
Shared *root* is not automatically shared *consonance* — full Lydian and full Phrygian on one tonic still clash chromatically.
Simultaneity works because the texture is drone plus register-separated stems, not seven melodies at once: the tonic anchors, voicing does the rest.

**Home pitch: D.**
A warm modal-drone center — D1 (≈ 37 Hz) gives Saturn real floor without mud and leaves Mercury room to sparkle on top.
This is pure transposition, trivially changed if the synths prefer otherwise; we are not tuning-mystical about it (no 432 Hz — astrology here is a symbolic system, not woo).

---

## The seven modes

Parallel modes form a **brightness ladder** — Lydian → Ionian → Mixolydian → Dorian → Aeolian → Phrygian → Locrian — that maps onto planetary temperament, and closely onto the traditional benefic→malefic axis, so the assignment is structural rather than decorative.

| Planet  | Mode       | Rationale |
|---------|------------|-----------|
| Jupiter | Lydian     | Greater benefic; the ♯4 reaches past its own boundary — "the frame is larger than the problem." |
| Sun     | Ionian     | The reference mode *is* the sovereign center — the Sun is the home key, every other mode measured against it. |
| Venus   | Mixolydian | Warm major-lean with an unresolved ♭7 ache. *(provisional — see below.)* |
| Mercury | Dorian     | Dorian's interval pattern is a palindrome, inverting to itself — the self-inverting trickster, "turn it over, and again turn it over." |
| Moon    | Aeolian    | Natural minor; nocturnal, reflective, soft. |
| Mars    | Phrygian   | The ♭2 carries menace — the dark, militaristic mode. |
| Saturn  | Locrian    | Darkest; the ♭5 denies a stable home. *(provisional — see below.)* |

**Mode is the fingerprint; meter is the character.**
The ladder is a cohesion/identity device, not a differentiation one — Mars and Saturn are both dark yet nothing alike, and that difference lives in **meter, tempo, register, and rhythm**.
Holst pre-solves these for the five planets he wrote: Mars's 5/4 ostinato, Mercury's fast bitonal 6/8, Venus serene and slow, Jupiter broad and majestic, Saturn's processional tolling.
The two we invent fill the gaps — the **Sun** is the steady centered pulse everything else is heard against; the **Moon** is the floating nocturne.
A planet's mode is constant across its explore and battle variants: you do not change a fingerprint between two states of one theme.

**Two structural wins.**

- **Sun = Ionian = the home key itself** settles both "which mode for the Sun" and "what is the reference," and is thematically exact; compose it last, as planned, but define the tonic as the Sun's.
- **Saturn = Locrian, held up by the shared pedal.** The one mode with no stable tonic triad leans on the suite's common drone for its floor — Saturn on borrowed ground is very Saturn, and the pedal supplies what the mode denies, so it stays darkest without an unplayable tonic.

**Two open calls.**

- **Venus** — Mixolydian is provisional; Venus may want a sweeter Lydian/Ionian color, and Jupiter and Venus both have a claim on the bright end.
- **Saturn** — strict Locrian versus a drone-anchored dark (Phrygian, or harmonic minor with a ♭5 color) is a call to settle at the keyboard.

This honors the caveat to carry forward: the mode serves the planet, and "7 planets = the 7 diatonic modes" must not harden into law — a planet may want harmonic minor or something non-diatonic.

**A free arc from the unlock schedule.**
The Macrobian unlock order (`MECHANICS.md §11.1`: Moon → Mercury → Venus → Sun → Mars → Jupiter → Saturn) walks the ladder as Aeolian → Dorian → Mixolydian → Ionian — a dawn from lunar minor up to solar clarity — then Phrygian / Lydian / Locrian, where the transpersonal planets break the gradient: Mars stabs dark, Jupiter blazes brightest, Saturn arrives darkest as the final teacher.
The music's emotional arc as the chart fills in is built into the unlock schedule for free.

---

## Architecture — jukebox now, layered later

There are two sonic layers, and this doc has so far described only one.

- **Music** (here): the themes — the score.
- **Sound design** (`VIBES.md §Sound Design`): per-planet **tonal signatures** ("not a melody, a texture"), audible aspect propagation, combustion cutting a signature mid-phrase, and the soundscape going **sparser as planets combust**.

These are the same identity at two scales, not two designs.
The signature is the **motif/timbre germ**; the theme is that germ developed to three or four minutes.
Saturn's "lowest note, held" is both the seed of Saturn's theme and the sound a Saturn combat-event makes.
We design one Saturn, used as ambient signature and as full score — the sonic form of `STYLE.md`'s "every screen is the same drawing, continued."

**Combat-music model: implement (a), architect for (b).**

- **(a) Jukebox** *(v1)* — the active or threatening planet's battle variant plays, and the **combustion-thinning lives in the signature layer** (signatures drop out as planets go dark).
  This delivers the `VIBES` promise without a multi-stem adaptive score.
- **(b) Layered** *(possible later)* — combat music is a live mix of the fielded planets' battle stems, each muting as it combusts: literally the chart-as-chord in motion.
  Richer, but the larger build, and it requires every theme to be writable as a simultaneous stem.

The shared-tonic decision is made now *because* (b) needs it, but v1 ships the jukebox.
In practice this means composing each battle core so it can also stand as an isolated, loopable stem over the common drone — the same material, deployed either way.
This mirrors `STYLE.md`'s mobile stance: (b) does not have to be built yet, only to stay *possible*.

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

Resolved above: the parallel-modes cohesion model, the home pitch (D), the per-planet mode mapping, the music/sound-design boundary, and the jukebox/layered architecture.

Remaining, roughly in order:

1. Settle the two open mode calls — Venus's bright color, and Saturn's strict-Locrian-vs-drone-anchored dark.
2. Formalize metric character per planet: confirm the five inherited from Holst, and pin the Sun's reference pulse and the Moon's nocturne.
3. Per piece: harmonic bed → motif → form → explore/battle relationship — composing each battle core so it can also stand as an isolated stem (*Architecture* (b)).

Blocked on nothing at the theory level; full realization is blocked on DAW infrastructure.
