# Space Prince — Music

*The sonic vocabulary, and how we intend to build it.*

`VIBES.md` describes how the game should feel and `STYLE.md` what it should look like.
This document is the third surface — what it should *sound* like — and, for now, a tracker for the music workstream rather than a finished spec.

The guiding principle:

> **The same seven planets you play, in sound.**

**Status:** strategy only.
No creative choices are committed yet — no modes, keys, tempos, or progressions.
This doc records *how we will work* and *what we have already decided not to re-litigate*.

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

The adaptive logic then falls out for free: the **active planet** selects the theme, **map vs. combat** selects the variant.
Themes stay **ambient and atmospheric**, not character songs — consistent with planets staying ambient (no Hades-style personification).

---

## Cohesion (first creative decision, not yet made)

A concert suite can let its movements be tonal strangers; a *game* soundtrack wants a unifying identity (half of why FTL feels like one thing).
The standing recommendation — **to be confirmed when we start the creative work** — is to lean lightly unified: a shared tonal center and a shared parent collection, with each planet getting its own mode *within* that frame.
This keeps the suite coherent and keeps the north-star (below) reachable.

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
We are not pursuing this yet; it is recorded as the direction the theory-first approach naturally builds toward.

---

## Open decisions / next

Deferred to the creative pass, roughly in order:

1. The shared tonal center and parent collection (the cohesion decision above).
2. Mode + metric character for each of the five Holst-derived planets.
3. Mode + metric character for Sun and Moon, derived from those five.
4. Per piece: harmonic bed → motif → form → explore/battle relationship.

Blocked on nothing at the theory level; full realization is blocked on DAW infrastructure.
