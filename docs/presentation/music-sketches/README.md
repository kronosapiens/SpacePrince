# Music sketches

Tracked MIDI auditions from which the shipped themes in `client/src/audio/themes.ts` grew — reference material, not finished pieces.
The direction they audition is described in [MUSIC.md](../MUSIC.md).
They made two ideas audible before any in-engine or DAW work:

1. **Cohesion** — every file is rooted on the same home tonic, **D**.
2. **Per-planet character** — mode is the fingerprint, meter is the personality.

The General MIDI instruments are placeholders for auditioning only; real timbre and mix are the later DAW pass.
Open them in MuseScore (free) or any GM player; on macOS, GarageBand will import them.

| File | Planet · mode | Meter / tempo | What to listen for |
|------|---------------|---------------|--------------------|
| `00-ladder-on-D.mid` | all seven, in brightness order | 4/4, 66 | One D drone the whole way; only the mode recolors above it, always resolving back to D. The cohesion demo. |
| `01-jupiter-lydian.mid` | Jupiter · Lydian | 3/4, 96 | The ♯4 (G♯) reaching past its boundary — the brightest mode, broad and majestic. |
| `02-sun-ionian.mid` | Sun · Ionian | 4/4, 72 | The home/reference key itself: clean, centered, resolved. Every other mode is measured against this. |
| `03-mercury-dorian.mid` | Mercury · Dorian | 6/8, fast | Quick and metallic; the bright ♮6 marks Dorian, and the line ends unsettled. |
| `04-mars-phrygian.mid` | Mars · Phrygian | 5/4, 138 | The Holst 5/4 hammer, the ♭2 (E♭) menace, ♭II brass stabs — a battle-variant feel. |
| `05-saturn-locrian.mid` | Saturn · Locrian | 4/4, 50 | The deep D pedal supplies the floor Locrian's ♭5 denies; a slow toll between the unstable tonic and its ♭II consolation. |

The engine's themes have since moved past these — the Sun and Moon were composed in-engine, and Saturn's shipped theme uses a moving toll rather than this pedal — so treat the files as the starting point, not the current sound.
