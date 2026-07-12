# Soundfont samples

Per-note renders of the **FluidR3_GM** General MIDI soundbank (MIT license),
via the [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) project.
Five instruments, sampled every tritone (C/Gb per octave), pitch-shifted between
samples by `Tone.Sampler` at runtime.

| Directory | GM instrument | Theme role |
|---|---|---|
| `string_ensemble_1/` | String Ensemble 1 | pad (and Saturn's lead) |
| `orchestral_harp/` | Orchestral Harp | arp |
| `contrabass/` | Contrabass | bass |
| `french_horn/` | French Horn | lead (Jupiter, Mars) |
| `flute/` | Flute | lead (Sun, Moon, Mercury, Venus) |

Percussion stays synthesized (`client/src/audio/engine.ts`).
