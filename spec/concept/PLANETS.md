# Space Prince — Planetary Voices

*The philosophical chorus that gives each planet its personality.*

Each of the seven classical planets has a **chorus** — a small set of thinkers whose writings share a tonal register that matches the planet's archetype.
At various points in the game (principally the opening of narrative encounters; see `spec/mechanics/HOUSES.md`), the player receives a short fragment drawn from the relevant planet's chorus.
Fragments frame a decision, set a mood, and over many runs build up a symbolic association between each planet and its felt voice.

This document supersedes the *Voice Register*, *When Planets Speak*, and *Chart Recognition* sections of `spec/design/VIBES.md`.

Influences include *Everything* (David OReilly), in which Alan Watts fragments surface as the player moves through the world.
The effect we're aiming for is similar: evocative, philosophical, ambient — language that points at meaning without explaining it.

---

## 1. Usage

Fragments appear in the game at moments where mood matters more than mechanics.

**Primary usage (v1):** narrative encounter arias.
Each house encounter opens with a single short fragment in the voice of the house's ruling planet.
The fragment is **persistent across the entire encounter** — it sits in the right-hand column's top band as the encounter's *aria* (per `spec/design/SCREENS.md §3.2`), not refreshing per decision node.
Per-node framing is carried by narrative text in the middle band; the aria stays.
A Saturn-framed 12th-house encounter opens with Saturn-weight; a Venus-framed 5th-house encounter opens with Venus-ease.
See `spec/mechanics/HOUSES.md` for encounter structure.

**Likely secondary usages:** planetary-combat moments of significance (opening of a run, combustion, possibly others), progression milestones.
These are not specced here — PLANETS.md is the content library, not the integration schedule.

---

## 2. Universal Voice Rules

Rules that apply to every planet's chorus.

- **Length is tag-driven, not planet-driven.** Cut / command / warning fragments should be tight — one sentence, maybe two. Opening / reverie / gift / affirmation fragments can breathe — several sentences if the rhythm asks for it. Brevity is in service of tone-setting, not a rule for its own sake. Never a paragraph.
- **Curated, not generated.** All fragments are drawn from the real writings of the chorus authors. No AI generation. No paraphrase.
- **Public domain only.** See §11 for scope and translation notes.
- **Never explanatory.** The fragment never explains the mechanic beneath it. It accompanies, it does not instruct.
- **Never twice in a run.** Within a single run, no fragment repeats. Across runs, repetition is fine — recognition is part of the experience.
- **Authored in advance.** Fragments are tagged and selected at runtime; they are not composed at runtime.
- **Attribution is part of the craft.** Each fragment is tagged with author and source. Whether attribution is shown to the player, and how, is an open design question. At minimum, attribution is recorded internally for sourcing integrity.

---

## 3. Sun

### Archetype

The sovereign self.
Illumination, vitality, authority.
The declaration of what is.
In Space Prince, the Sun is the planet that names itself — the voice of centered, present-tense presence.

### Voice

Declarative, present-tense, unqualified.
Speaks as if from the center of its own attention.
Moral weight without moralizing.
Brevity as authority.

### Chorus

- **Ralph Waldo Emerson** (essayist, 1803–1882) — self-reliance, the over-soul, the sovereign individual.
- **Walt Whitman** (poet, 1819–1892) — expansive solar selfhood, the body as celebration.
- **Marcus Aurelius** (emperor-philosopher, 121–180) — Stoic duty, the present as the only real domain.
- **The Bhagavad Gita** — Krishna's counsel of action without attachment.

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Always first person or imperative.
- Never qualifying or hedging.
- Never ornamental — solar speech is clean, not decorated.
- Never ironic.
- Never backward-looking with regret; the Sun is present.

### Color and tonal signature

Gold, warm white.
A single clear tone, sustained and centered.

---

## 4. Moon

### Archetype

The reflective interior.
Memory, sleep, intimacy.
What is half-seen, returning, half-forgotten.
In Space Prince, the Moon is the voice of reverie and the inner weather — the self as something one overhears, not declares.

### Voice

Intimate, nocturnal, drifting between present and memory.
Often first-person but softer and less declarative than the Sun.
Uses sensory and spatial language — rooms, water, twilight, half-open doors.

### Chorus

- **Marcel Proust** (novelist, 1871–1922) — memory's involuntary return, the interior as the true world.
- **Henri-Frédéric Amiel** (diarist, 1821–1881) — the long private examination of the inner weather.
- **Novalis** (poet, 1772–1801) — *Hymns to the Night*, the ecstatic dark.
- **Thomas Browne** (physician-philosopher, 1605–1682) — the melancholy of antiquities, the dream of the self.
- **Charles Baudelaire** (poet, 1821–1867) — *Paris Spleen* and *Les Fleurs du Mal* (Symons / Sturm / Huneker translations); the interior at twilight, the city as nocturne.
- **Emily Dickinson** (poet, 1830–1886) — pre-1930 Todd / Higginson editions. Interior, the slant of light, the selection of one's own society.
- **Kalidasa** — *Meghaduta* (H. H. Wilson 1814 / 1843). The beloved evoked through distance and landscape; the classical Sanskrit anchor of Moon reverie.
- **Bashō** (poet, 1644–1694) — the haiku instant, the moment as window.

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Imagery over argument.
- Never declarative or imperative — the Moon doesn't command.
- Acknowledges the unseen without explaining it.
- Uses temporal drift — "once," "again," "still."
- Never bright or solar-certain.

### Color and tonal signature

Silver, pale blue.
Soft, layered, slightly distant — a sound heard through water or through a wall at night.

---

## 5. Mercury

### Archetype

The riddle, the turn.
Quick movement.
Paradox.
What slips when you try to grip it.
Hermes the messenger, the translator, the trickster.
In Space Prince, Mercury is the voice that unsettles before it instructs.

### Voice

Aphoristic, paradoxical, self-inverting.
Rarely completes a thought in the direction it started.
Often second-person.
Uses the trick of saying the opposite of what the listener expects.

### Chorus

- **Friedrich Nietzsche** (philosopher, 1844–1900) — the aphoristic mode of *Twilight of the Idols*, *Human, All Too Human*.
- **Lao Tzu** — *Tao Te Ching*, James Legge (1891). The paradox of the Way, the inversion of striving.
- **Zhuangzi** (philosopher, ~4th c. BCE) — butterfly dreams, useless trees, the wandering mind.
- **Heraclitus** (fragments, ~500 BCE) — the unity of opposites, the river that cannot be stepped in twice.
- **William Blake** (poet, 1757–1827) — *Proverbs of Hell*, the inversion as revelation.
- **Pirkei Avot (*Ethics of the Fathers*)** — Charles Taylor (1897), Joshua Kulp Mishnah Yomit (CC-BY). Hillel's three questions, Akiva's paradoxes, Ben Bag Bag's "turn it over, and again turn it over."
- **Attar** — *Bird Parliament* (FitzGerald 1889). The Simurgh recognition — thirty birds discovering the sought Bird is themselves; the self-inverting turn as mystical vocation.
- **The Hermetica** — "as above, so below."

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Usually one sentence, often inverting midway.
- Prefers paradox to statement.
- Never earnest — Mercury speaks with a smile.
- Never conclusive; always leaves a door open.
- Never threatens; Mercury misleads, it does not warn.

### Color and tonal signature

Quicksilver, shifting grey-green.
Quick, metallic, slightly dissonant — a single plucked note that doesn't quite settle.

---

## 6. Venus

### Archetype

Beauty, relation, the sensed world.
Pleasure as a mode of knowing.
The other, seen lovingly.
In Space Prince, Venus is the voice of aesthetic attention and erotic intelligence — the planet that notices first, and closely.

### Voice

Sensory, relational, attuned.
Uses concrete particulars — a fold of cloth, a smell, the angle of light.
Often gentle but never evasive; Venus names what she sees.

### Chorus

- **Sappho** (poet, ~600 BCE) — fragments, eros, the remembered body.
- **Plato** (philosopher, ~428–348 BCE) — *Symposium* (Jowett 1871), eros reasoned about rather than sung; Aristophanes's myth of the halves.
- **John Keats** (poet, 1795–1821) — "beauty is truth"; the intensities of perception.
- **Walter Pater** (essayist, 1839–1894) — *The Renaissance*, the gemlike flame.
- **Oscar Wilde** (writer, 1854–1900) — aestheticism, the paradoxes of beauty.
- **The Song of Songs** — sensual-religious devotion.
- **Sei Shōnagon** (diarist, ~1000) — the catalog of things delightful and things displeasing.

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Always specific; beauty speaks through particulars.
- Never abstract, never moralizing.
- Uses the senses, not concepts.
- Often pairs two images rather than arguing one.
- Never clinical, never cold.

### Color and tonal signature

Copper, rose, soft green.
Warm, harmonic, close — a chord rather than a line.

---

## 7. Mars

### Archetype

Decision, cut, commitment.
The thing that must be done.
Iron, direction.
In Space Prince, Mars is the voice that refuses hedging — the act stripped of deliberation.

### Voice

Clipped, imperatival, direct.
Short sentences.
No metaphor unless it serves the action.
Comfortable with silence.

### Chorus

- **Thucydides** (historian, ~460–400 BCE) — *History of the Peloponnesian War*, the speeches of men under pressure.
- **Sun Tzu** (strategist, ~500 BCE) — *Art of War*, the economy of force.
- **Homer** (poet, ~8th c. BCE) — the *Iliad*, warrior culture and the agon.
- **Niccolò Machiavelli** (statesman, 1469–1527) — *The Prince*, the politics of commitment.
- **Heraclitus** (fragments, ~500 BCE) — "war is the father of all"; the agonistic mode.
- **Thomas Carlyle** (essayist, 1795–1881) — *On Heroes and Hero-Worship*, the heroic will.
- **Marcus Aurelius** (emperor-philosopher, 121–180) — the soldier-emperor's discipline, distinct from his solar register.

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Short sentences — the shorter, the better.
- Imperative or declarative, never interrogative.
- No adjectives that aren't functional.
- Never pleads, never explains.
- Can be silent; silence is a Mars mode.

### Color and tonal signature

Red, iron.
Percussive, sharp, brief — a strike, not a tone.

### Note on chorus depth

Mars has a narrower philosophical corpus than the other planets — most good martial writing lives in epic and strategy rather than philosophy proper.
The chorus above is deliberately broader than the others' to compensate, and includes historical and epic sources alongside philosophical ones.
Miyamoto Musashi was considered and dropped; see §11.

---

## 8. Jupiter

### Archetype

Expansion, gift, meaning.
The far horizon.
Pilgrimage and teaching.
In Space Prince, Jupiter is the voice of generous scope — the recognition that the frame is always larger than the problem inside it.

### Voice

Expansive, affirmative, oracular.
Uses long rhythms rather than short ones.
Names the whole where others name the part.
Often speaks in a register of affirmation without being sentimental.

### Chorus

- **William James** (philosopher, 1842–1910) — pragmatism, *Varieties of Religious Experience*, pluralism.
- **Ralph Waldo Emerson** (essayist, 1803–1882) — in his oracular and generous mode, distinct from his solar register.
- **Rabindranath Tagore** (poet, 1861–1941; pre-1930 works are PD) — *Gitanjali*, devotional expansiveness.
- **Plato** (philosopher, ~428–348 BCE) — *Symposium* (Jowett 1871), Diotima's ladder from particulars to the Form of beauty; the ascent passages.
- **The Upanishads** — Atman, the great identity.
- **Plotinus** (philosopher, 204–270) — *Enneads*, emanation, the return (Plato's lineage).
- **Henry David Thoreau** (writer, 1817–1862) — *Walden*, deliberate living, the natural teacher.

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Longer rhythms — Jupiter is the one planet whose fragments can run to two sentences.
- Names scope — the world, the whole, the ages.
- Generous in its assumptions about the listener.
- Never sarcastic, never clever for cleverness's sake.
- Never small.

### Color and tonal signature

Deep blue, royal purple.
Resonant, wide, chordal — a low sustained harmony.

---

## 9. Saturn

### Archetype

Limit, time, weight.
The real cost.
What is endured, not avoided.
In Space Prince, Saturn is the voice of honest reckoning — the planet that names what things are actually costing.

### Voice

Measured, austere, patient.
Often uses time as subject matter.
Comfortable with melancholy without being despairing.
Speaks as if having waited a long time to speak.

### Chorus

- **Ecclesiastes** — "vanity of vanities"; the cycle of what has been and will be again.
- **The Book of Job** — KJV (1611); lamentation, the endured weight, the sufferer's voice.
- **Luo Guanzhong** — *Romance of the Three Kingdoms*, C. H. Brewitt-Taylor (1925). The Zhuge Liang death arc, the failed restoration, the closing dissolution; measured austere narrative register.
- **Ferdowsi** — *Shahnameh*, A. G. and Edmond Warner (1905–1925). The dynastic falls, Rustam's lament for his son Suhrab, Iraj's pre-death plea, Jamshid's loss of Grace.
- **Epictetus** (philosopher, 55–135) — *Enchiridion*, the dichotomy of control.
- **Seneca** (philosopher, 4 BCE–65) — *Letters from a Stoic*, the moral measured life.
- **Michel de Montaigne** (essayist, 1533–1592) — *Essays*, the patient examination of mortality, solitude, and age.
- **Arthur Schopenhauer** (philosopher, 1788–1860) — *Essays on Pessimism*, the will's suffering.
- **Blaise Pascal** (philosopher, 1623–1662) — *Pensées*, the eternal silence of infinite spaces.
- **Boethius** (philosopher, 477–524) — *Consolation of Philosophy*, written in prison.

### Sample fragments

*[To be sourced. See §11.]*

### Voice rules

- Measured cadence; Saturn is never hurried.
- Honest about cost and loss without melodrama.
- Often uses time-scale language — "in the end," "after many years," "what remains."
- Never consoles falsely; Saturn consoles only by naming.
- Never loud.

### Color and tonal signature

Lead grey, dark earth, black.
Low, sustained, mineral — the lowest note, held.

---

## 10. Shared Authors

Some authors appear in more than one chorus because their body of work has distinct registers.
This is expected and a feature, not a bug — a mature voice can speak from more than one part of the chart.

- **Emerson** — Sun (sovereign, self-reliant) and Jupiter (oracular, expansive).
- **Marcus Aurelius** — Sun (declarative, present-tense) and Mars (soldier-emperor discipline).
- **Heraclitus** — Mercury (paradox, the riddle) and Mars (agonistic, "war is the father").
- **Keats** — Venus (beauty as truth, sensory intensity) and Mercury (paradox, Negative Capability).
- **Wilde** — Venus (aestheticism, the paradoxes of beauty) and Saturn (the prison-voice of *De Profundis* and *The Ballad of Reading Gaol*).

When sourcing, fragments from these authors should be tagged by which register they serve.
A fragment that could serve both is tagged for both; the encounter system picks by context.

---

## 11. Sourcing Notes

### Scope

Space Prince is a **commercial project** — it monetizes via per-prince mints and per-run fees. License choices must preserve commercial distribution and must not commit the content library to share-alike terms.

**Acceptable license tiers:**
- **Public domain** — pre-1930 translations; unrestricted use.
- **CC0** — creator has waived all rights; equivalent to PD in practice.
- **CC-BY** — commercial use permitted with attribution. Attribution is recorded in the YAML `author` / `source` / `translation` fields already; no additional workflow change needed.

**Unacceptable license tiers:**
- **CC-BY-NC** — non-commercial only. Excludes the William Davidson Talmud, JPS 1985 / 2006 / 2023, Koren Jerusalem Bible, and any other NC-licensed source regardless of voice fit. If a specific NC source becomes load-bearing, negotiate a separate commercial license with the rights holder rather than relying on the NC license.
- **CC-BY-SA** — the share-alike clause requires derivative works to carry the same license, which could propagate to the game's content library or further. Avoid entirely for now; we are not committing to share-alike distribution.
- **Proprietary / all-rights-reserved / "copyright: [publisher]"** — not usable without a separate license grant.
- **"Unknown" license** — treat as restricted. Do not source.

PD status depends on jurisdiction and on whether attribution is to an original or a translation.
Default rule of thumb for PD: target works where **both** the author died before 1930 **and** (for translated works) the translator died before 1930 or the translation was published before 1930 in the US.

### Storage

Sourced fragments live in `planets/<planet>.yaml`, one file per planet:

```
planets/
├── sun.yaml
├── moon.yaml
├── mercury.yaml
├── venus.yaml
├── mars.yaml
├── jupiter.yaml
└── saturn.yaml
```

Schema per entry:

```yaml
- text: |
    Quote text. Multi-line is supported.
  author: "Author Name"
  source: "Work, section reference"
  translation: "Translator, year"     # optional; only for non-English originals
  source_url: "https://..."           # optional; PD verification link
  moods: [opening, cost]              # optional; free-form tags
```

Required fields: `text`, `author`, `source`.
Optional: `translation`, `source_url`, `moods`.
A fragment that fits more than one planet (see §10) lives in the file of whichever planet is its primary assignment and carries a `moods` tag identifying its secondary register; the runtime will handle cross-planet selection.

### Public-domain editions to prefer

Most of the non-English chorus requires a translation layer.
The editions below are reasonable-confidence recommendations; subagents must verify the PD chain (author death date, translator death date or pre-1930 US publication) for each quote against the specific edition they source from.

- **Marcus Aurelius** — George Long (1862); C. R. Haines Loeb (1916).
- **Bhagavad Gita** — Edwin Arnold, *The Song Celestial* (1885); K. T. Telang (1882, SBE series).
- **Homer's *Iliad*** — Samuel Butler (1898); Lang, Leaf & Myers (1883); Alexander Pope (1715–1720) for archaic register.
- **Thucydides** — Benjamin Jowett (1881).
- **Zhuangzi** — James Legge (1891, SBE series); Herbert Giles (1889).
- **Heraclitus** — John Burnet, *Early Greek Philosophy* (1892).
- **Hermetica** — G. R. S. Mead, *Thrice-Greatest Hermes* (1906).
- **Upanishads** — Max Müller (1879–1884, SBE series); Paul Deussen (1906); Swami Paramananda, *The Upanishads* (1919) — cleaner idiom for short-fragment use than Müller's scholarly Victorian.
- **Plotinus** — Stephen MacKenna, *Enneads* vols 1–4 (1917–1926). Vol 5 (1930) is on the boundary and needs verification.
- **Epictetus** — W. A. Oldfather Loeb *Discourses* (1925); Elizabeth Carter *Enchiridion* (1758).
- **Seneca** — R. M. Gummere Loeb *Letters* vols 1–3 (1917–1925); Aubrey Stewart (1880s–90s).
- **Boethius** — H. R. James (1897), preferred over "I.T." (1609) for readability.
- **Schopenhauer** — T. Bailey Saunders *Essays* (1890s); Haldane & Kemp *World as Will and Representation* (1883–1886).
- **Pascal** — W. F. Trotter (1910).
- **Montaigne** — Charles Cotton (1685–1686); John Florio (1603).
- **Machiavelli** — W. K. Marriott, *The Prince* (1908).
- **Sun Tzu** — Lionel Giles, *Art of War* (1910).
- **Nietzsche** — Oscar Levy, ed., *Complete Works* series (1909–1913); translators include Helen Zimmern, Anthony Ludovici, Thomas Common.
- **Sappho** — Henry Thornton Wharton (1885).
- **Song of Songs / Ecclesiastes** — King James Version (1611); Jewish Publication Society (1917).
- **Sei Shōnagon** — Arthur Waley (1928, pre-1930 US publication).
- **Bashō** — Basil Hall Chamberlain (1880); Clara A. Walsh (1910). *PD Bashō is sparse — the major translations (Blyth, Yuasa) are post-1930 and under copyright. Expect a smaller sourced pool from Bashō than from other chorus members.*
- **Novalis** — George MacDonald, *Rampolli* (1897).
- **Amiel** — Mrs. Humphry Ward, *Journal Intime* (1885).
- **Proust** — Scott Moncrieff, vols 1–6 (1922–1929). Volume 7 (Stephen Hudson, 1931) is outside the safe window and should be excluded.
- **Tagore** — self-translated English works: *Gitanjali* (1912), *Sadhana* (1913), and other pre-1930 publications.

English-original authors (Emerson, Whitman, Keats, Blake, Pater, Wilde, Thoreau, James, Browne, Carlyle) do not require a translation layer — source directly from PD editions of the originals.

### Excluded from the chorus

Two authors were considered and dropped during scoping:

- **Miyamoto Musashi** — no PD English translation of *Book of Five Rings* exists. Victor Harris (1974) and Thomas Cleary (1993) are both under active copyright. Mars chorus is compensated with Thucydides, Homer, and Carlyle.
- **Søren Kierkegaard** — PD English translations are thin. Hong & Hong (Princeton, 1978+) and Walter Lowrie (1930s–40s) are under copyright; earlier translations (Hollander 1923, Dru 1938) are incomplete. Saturn chorus is compensated with Montaigne.

### Anti-hallucination guardrails

The single biggest sourcing risk is fabricated quotes — LLMs will confidently produce attributed material that does not exist in the cited source.
Subagents must:

- Return a specific textual locator for each quote: book/chapter/section/page/fragment number as appropriate to the work.
- Return a `source_url` pointing at a PD host (Project Gutenberg, Wikisource, archive.org, Perseus) where the quote appears in situ.
- Never source from quote-aggregator sites (BrainyQuote, Goodreads) — only from the primary text.
- Flag any quote that is widely attributed but not locatable in a primary source (common for Emerson, Aurelius, Nietzsche).

A spot-check of ~20% of each batch against the linked primary source should be part of the acceptance workflow before merging.

### Tagging

Each sourced fragment carries the fields defined in Storage above.
The `moods` tag vocabulary should emerge from the real sourced content — do not fix it before the fragments exist.
Initial candidates: *opening, warning, cost, gift, ending, question, cut, reverie, paradox.*

### Scale

Initial target: ~10 fragments per planet, ~70 total.
This comfortably covers 60 narrative encounter openings (12 houses × 5 encounters) without within-run repetition.
Sourcing can grow the library over time.

Within each planet's ten, aim for coverage across the chorus rather than a single-author shotgun: no more than 3–4 fragments from any one author.

### Workflow

Pilot one planet first — recommended: **Saturn**, which has the deepest PD corpus and the lowest hallucination risk (its authors are widely anthologized on Gutenberg).
Use the pilot to iterate on the brief, the schema, and the verification cadence before running the remaining six in parallel.

Sourcing can be run in two modes:

- **Planet-driven.** A subagent takes one planet and works through its chorus (§§3–9). Good for initial population. Used in the first sourcing sweep.
- **Source-driven.** A subagent takes one text (e.g. *Tao Te Ching*) and distributes fragments across whichever planet YAMLs the source's register serves. Good for expansion — a single source can yield material for several planets, and deep reading of one text tends to surface more resonant fragments than shallow sampling across many. See §12 for candidate sources.

This document is the brief for both modes.

---

## 12. Extended Chorus Candidates

The seven per-planet choruses (§§3–9) are the core, but the content library is open-ended and grows through source-driven sourcing passes (§11 Workflow).
The list below is a roster of candidate sources worth exploring, with approximate planetary register.
Not all candidates must be sourced; this is a backlog to draw from.
Authors already in a core chorus (§§3–9) appear here when their wider corpus reaches planets beyond the one they anchor.

### Classical and ancient

- **Plato** (beyond core Venus + Jupiter) — Jowett (1871). *Phaedo* → Saturn; *Phaedrus* → Jupiter + Mercury; *Apology* → Sun + Saturn; *Republic* → Jupiter.
- **Cicero** — *On Old Age*, *On Friendship*, *On Duties*, pre-1930 PD translations. Saturn + Venus + Sun.
- **Plutarch** — *Moralia* essays, Goodwin / Shilleto PD translations. Jupiter + Sun.
- **Horace** — *Odes*, Conington (1863). Saturn + Jupiter.
- **Ovid** — *Metamorphoses*, Dryden / Pope collaborative (1717) or Garth (1717). Jupiter + Venus + Mars.
- **Virgil** — *Aeneid*, Dryden (1697) → Mars; *Georgics*, Rhoades (1881) → Jupiter.

### Mesopotamian and ancient Near East

Load-bearing for Space Prince's cosmology — Babylonian astronomy is the root of Hellenistic astrology, and the Mesopotamian planetary pantheon (Shamash → Sun, Sin → Moon, Nabu → Mercury, Ishtar → Venus, Nergal → Mars, Marduk → Jupiter, Ninurta → Saturn) is the system the game inherits.

- **Epic of Gilgamesh** — R. Campbell Thompson verse (1928), Morris Jastrow & A. T. Clay prose (1920), Stephen Langdon (1917). All PD. Saturn (Enkidu's death, mortality, the failed return from Utnapishtim) + Jupiter (cosmic scope, the flood) + Mars (Humbaba, the Bull of Heaven) + Moon (the dreams, the twelve leagues of darkness). Modern Sandars / George / Kovacs / Mitchell all under copyright.
- **Enuma Elish** (Babylonian creation) — L. W. King, *The Seven Tablets of Creation* (1902). Jupiter + Mars.
- **Descent of Ishtar to the Underworld** — multiple PD translations (King, Jastrow). Saturn + Venus (Ishtar herself — the Mesopotamian Venus).
- **Code of Hammurabi** — L. W. King (1902). Mars + Sun (sovereign pronouncements).

### Hebrew Bible and Abrahamic scripture

- **Hebrew Bible — poetic books beyond Job and Ecclesiastes (already core Saturn)** — KJV (1611). *Psalms* → Moon + Sun + Saturn; *Proverbs* → Mercury + Saturn; *Isaiah* → Jupiter; *Song of Songs* already core Venus.
- **Quran** — Palmer (1880) or Rodwell (1861). Jupiter + Sun.

### Jewish: Talmudic, midrashic, kabbalistic, philosophical

The layered rabbinic tradition — Tanakh, Mishnah, Talmud, Midrash, Kabbalah, medieval philosophy. Voice fit tends to cluster in the *aggadic* (narrative / parable) register rather than the *halakhic* (legal), and the aphoristic tractates are the most quotable.

- **Pirkei Avot (*Ethics of the Fathers*)** — Charles Taylor, *Sayings of the Jewish Fathers* (1877 / 1897). The aphoristic tractate of the Mishnah; Hillel's three questions, Akiva's aphorisms, the chain of tradition. Saturn (ethical measure) + Mercury (Hillel's paradoxes) + Jupiter (universal affirmation). Danby's complete *Mishnah* (1933) is not PD.
- **Babylonian Talmud** — Michael L. Rodkinson, *New Edition of the Babylonian Talmud* (1896–1903, 10 vols). The only full-PD English Talmud; abridged and looser than Soncino but usable. Pull from *aggadic* portions, not halakhic. Saturn + Mercury + Jupiter. **Soncino (1935–1952), Steinsaltz/Koren, ArtScroll are NOT PD.**
- **Louis Ginzberg — *The Legends of the Jews*** — vols 1–6 (1909–1928), massive midrashic compilation woven into continuous narrative. Multi-planet narrative source. Vol 7 (index only, 1938) not PD.
- **Pirkei de-Rabbi Eliezer** — Gerald Friedlander (1916). Midrashic cosmogony. Jupiter + Saturn.
- **Sefer Yetzirah (*Book of Formation*)** — W. Wynn Westcott (1887) or Knut Stenring (1923). Foundational short kabbalistic text. Jupiter + Mercury (alphabet mysticism, creation paradoxes). Aryeh Kaplan 1990 edition NOT PD.
- **Zohar — partial only** — Nurho de Manhar's Genesis portion (serialized 1900–1914, book 1921) is PD but theosophically inflected and considered unreliable; S. L. MacGregor Mathers's *The Kabbalah Unveiled* (1887) covers Idra Rabba, Idra Zuta, Sifra de-Tzeniuta through a Hermetic lens. Soncino Zohar (1931–1934) and Matt's *Pritzker Zohar* NOT PD. Jupiter + Saturn.
- **A. E. Waite — *The Holy Kabbalah*** (1929). PD secondary; useful for context, not for primary quotation.
- **Philo of Alexandria** — C. D. Yonge 4-vol. translation (1854–1855). Jewish Hellenistic allegorical philosophy. Jupiter.
- **Josephus** — William Whiston (1737). Historical voice, multi-planet.
- **Yehuda Halevi — *Kuzari*** — Hartwig Hirschfeld (1905). Medieval philosophical dialogue. Saturn + Jupiter.
- **Bahya ibn Paquda — *Duties of the Heart*** — Edwin Collins partial (1904). Ethical-mystical. Saturn.

**Hasidic gap.** Much of the tradition's most atmospheric material — Buber's *Tales of the Hasidim* (1947), Nachman of Bratslav's stories, the sayings of the Baal Shem Tov and the Kotzker rebbe — lives in 20th-century English translations under active copyright. Scattered pre-1930 partials exist (Paul Levertoff especially) but the canonical Hasidic corpus is largely inaccessible for us.

**Sefaria as a per-text license clearinghouse.** [sefaria.org](https://www.sefaria.org) hosts a large library of Jewish texts with per-translation license metadata exposed via their public API (e.g. `https://www.sefaria.org/api/texts/Pirkei_Avot.1.14`). License strings fall into PD, CC0, CC-BY, CC-BY-SA, CC-BY-NC, proprietary, and "unknown." Per §11 Scope we accept PD, CC0, and CC-BY only. Sefaria Community Translations (CC0) exist for many texts without pre-1930 English translations and are the main route to expanding beyond the PD list above. Named CC-BY translations worth knowing: **Joshua Kulp's Mishnah Yomit** (Mishnah), **Rabbi Shraga Silverstein's Rashi Chumash** (Rashi on Torah), **Metsudah Chumash** (Torah). Explicitly **unavailable** under our license discipline: William Davidson Talmud (CC-BY-NC), JPS 1985 / 2006 / 2023 (CC-BY-NC), Koren Jerusalem Bible (CC-BY-NC), Everett Fox (proprietary), Chabad Kehot (proprietary). A sourcing agent working Jewish texts should query the Sefaria API per passage and filter to the acceptable tier before quoting.

### Persian, Arabic, and Islamic philosophy

- **Hafiz** — *Divan*, Gertrude Bell (1897) and H. Wilberforce Clarke (1891). Venus (the ghazal of love) + Saturn (the ruin of time) + Mercury.
- **Rumi** — *Mathnawi*, Reynold A. Nicholson vols 1–2 (1925–1926, pre-1930 PD; later vols excluded); E. H. Whinfield selections (1887). Jupiter (devotional expansiveness) + Venus (lover-and-beloved) + Mercury (paradox of the reed-flute). **Note:** Coleman Barks, Arberry, and most 20th-century Rumi translations are NOT PD.
- **Omar Khayyam** — *Rubáiyát*, Edward FitzGerald (first ed. 1859, later editions also PD). Saturn (the vessel, the clay, the moving finger) + Mercury + Venus (wine and the rose).
- **Sa'di** — *Gulistan*, James Ross (1823) or Edward Rehatsek (1888); *Bustan*. Saturn (measured reflection) + Mercury (aphorism).
- **Al-Ghazali** — *The Alchemy of Happiness* (*Kimiya-yi-sa'ādat*), Claud Field (1910). Saturn + Jupiter.
- **Attar** — *Conference of the Birds* (*Manṭiq-uṭ-Ṭayr*), Edward FitzGerald's abridgment *Bird Parliament* (1889); R. P. Masani (1924). Jupiter (the mystical journey) + Mercury (paradoxes of the seeker) + Saturn.
- **Ferdowsi — *Shahnameh*** — the Persian national epic. Arthur & Edmond Warner 9-volume translation (1905–1925); Helen Zimmern abridgment (1883). Mars + Saturn + Sun — the Persian *Iliad*.
- **Nizami Ganjavi** — *Laila and Majnun*, James Atkinson (1836); *Haft Paikar*, C. E. Wilson (1924). Venus (love stories) + Jupiter.
- **Jami** — *Yusuf and Zulaikha*, Ralph T. H. Griffith (1882) or Alexander Rogers (1892). Venus.
- **Ibn Tufayl** — *Hayy ibn Yaqdhan*, Simon Ockley translation (1708). The 12th-c. autodidact philosophical novella. Jupiter + Saturn.
- **Arabian Nights / *One Thousand and One Nights*** — Richard Burton (1885), Edward Lane (1840s), John Payne (1882–1884). More narrative than atmospheric — use sparingly. Multi-planet.

### South Asian (beyond core Gita and Upanishads)

- **Mahabharata** — Kisari Mohan Ganguli's complete prose translation (1883–1896), PD. The massive Indian epic in which the Gita sits as Book VI. Multi-planet: Yudhishthira / Dharma dialogues → Saturn; Bhishma on his bed of arrows → Saturn; Draupadi's ordeal → Saturn + Mars; the final ascent → Jupiter. Modern van Buitenen translation is incomplete and under copyright.
- **Ramayana** — Ralph T. H. Griffith verse (1870–1874); Manmatha Nath Dutt prose (1892); Romesh C. Dutt abridgment (1900). Mars (Rama the warrior) + Venus (Sita-Rama) + Saturn (exile, loss) + Jupiter (Vishnu's cosmic scope).
- **Kalidasa** — the great classical Sanskrit poet. *Shakuntala* (Monier Williams 1855); *Meghaduta* (H. H. Wilson 1814 — the cloud-messenger, pure Moon reverie); *Kumarasambhava*.
- **Bhartrihari** — Sanskrit aphorist (5th c. CE). *Niti-Shataka* (worldly wisdom), *Vairagya-Shataka* (renunciation), *Shringara-Shataka* (love). B. Hale Wortham (1886). Saturn + Venus + Mercury.
- **Jataka tales** — Buddhist birth-stories. E. B. Cowell et al. (1895–1913). Multi-planet narrative source.
- **Tulsidas — *Ramcharitmanas*** — the Hindi devotional Ramayana. Frederic Salmon Growse (1876–1881). Jupiter (devotion) + Venus + Mars.
- **Manusmriti / Laws of Manu** — G. Buhler, SBE vol. 25 (1886). Saturn + Sun.
- **Arthashastra** (Kautilya) — R. Shamasastry (1915). Mars (statecraft, warfare, strategic austerity).
- **Kabir** — *One Hundred Poems of Kabir*, Tagore's self-translation with Evelyn Underhill (1915, PD). Jupiter (devotional) + Mercury (paradox of the seeker) + Saturn.
- **Swami Vivekananda** — *Raja Yoga*, *Jnana Yoga*, *Karma Yoga*, lectures (all pre-1902 publications, PD). Jupiter + Sun.
- **Patanjali — Yoga Sutras** — Vivekananda (1896) or James Haughton Woods (1914). Jupiter + Saturn.
- **Rig Veda hymns** — Ralph T. H. Griffith translation (1889). Jupiter + Sun.

### East Asian (beyond core Lao Tzu, Zhuangzi, Sun Tzu)

- **Confucian Analects / Mencius** — Legge (pre-1900). Saturn + Jupiter + Sun.
- **I Ching / Book of Changes** — Legge (1882, SBE). Jupiter + Mercury.
- **Liezi** — Lionel Giles (1912). Mercury + Jupiter.
- **Book of Songs (*Shijing*)** — James Legge, *The Chinese Classics* vol. 4 (1871). The oldest Chinese poetry anthology. Venus (Guofeng love poems) + Jupiter (dynastic hymns) + Saturn (lamentations).
- **Tang Dynasty poets** — Li Bai, Du Fu, Wang Wei, Bai Juyi, Tao Yuanming. Arthur Waley's *A Hundred and Seventy Chinese Poems* (1918) and *More Translations from the Chinese* (1919); Herbert Giles's *Chinese Poetry in English Verse* (1898). Moon + Saturn + Venus.
- **Romance of the Three Kingdoms** (*Sanguo Yanyi*, attr. Luo Guanzhong, 14th c.) — C. H. Brewitt-Taylor (1925, Shanghai). Mars (battles, strategic speeches) + Saturn (the tragic falls; Zhuge Liang's last campaign) + Jupiter (Zhuge Liang's cosmic register). Modern Moss Roberts 1991 translation NOT PD.
- **Dream of the Red Chamber** (*Hongloumeng*, Cao Xueqin, 18th c.) — H. Bencraft Joly (1892–1893), **first 56 chapters only**. Venus (Dai-yu / Bao-yu) + Saturn (the family's decline) + Moon (interior reflection). The Hawkes/Minford and Yang complete translations are NOT PD.

### Japanese classical (beyond core Bashō and Sei Shōnagon)

- **Murasaki Shikibu** — *The Tale of Genji*, Arthur Waley vols 1–3 (1925–1927, pre-1930 PD); vols 4–6 (1928–1933) partially PD; vols 5–6 (post-1930) excluded. Moon + Venus.
- **Kamo no Chōmei** — *Hōjōki (An Account of My Hut)*, c. 1212; James Rice (1886) and other pre-1930 translations. Saturn (impermanence) + Moon (solitude).
- **Yoshida Kenkō** — *Tsurezuregusa (Essays in Idleness)*, c. 1330; William N. Porter (1914). Saturn + Moon + Mercury.
- **Tale of the Heike** — A. L. Sadler (1918–1921). Mars (battle) + Saturn (the fall of great houses).

### Buddhist

- **Dhammapada** — Max Müller (1881). Jupiter + Saturn.
- **Diamond Sutra and Heart Sutra** — Max Müller, SBE vol. 49 (1894). Jupiter (emptiness, non-attachment) + Mercury.
- **Platform Sutra of the Sixth Patriarch** (Huineng, compiled ~9th c.) — Wong Mou-Lam (1930, Shanghai). Mercury (Chan paradox — "no mind, no tree, no mirror"). Boundary case for US pre-1930 pub — verify exact publication date before sourcing.

### African and Mediterranean (pre-Greek / Hellenistic)

- **Instructions of Ptahhotep / Maxims of Ani** — Egyptian wisdom literature, ~2400 BCE onward; Breasted and other pre-1930 translations. Saturn (measure) + Jupiter.
- **Egyptian Book of the Dead** — E. A. Wallis Budge (1895). Jupiter + Moon + Saturn.
- **Kebra Nagast** — Ethiopian national epic; E. A. Wallis Budge (1922). Jupiter.
- **Lucretius** — *De Rerum Natura*, H. A. J. Munro (1864) or Cyril Bailey (1910). Saturn (mortality, the nature of things) + Jupiter (cosmic scope) + Mercury (atomic paradoxes).
- **Epicurus fragments** — Cyril Bailey, *Epicurus: The Extant Remains* (1926, pre-1930 PD). Saturn + Venus (pleasure rightly understood).

### Mesoamerican and Indigenous Americas

- **Popol Vuh** — Mayan creation text, Daniel G. Brinton (1885) and other PD translations. Jupiter (cosmogony) + Moon (emergence from the dark).

### Mystical, contemplative, and medieval

- **Augustine** — *Confessions*, Pusey (1838). Saturn (time, memory) + Moon (interior life).
- **Maimonides** — *Guide for the Perplexed*, Michael Friedländer (1881 / revised 1904). Jupiter + Saturn. Written in Judeo-Arabic; culturally part of the medieval Arabic philosophical conversation, placed here for its mystical-philosophical register.
- **Julian of Norwich** — *Revelations of Divine Love* (c. 1395); Grace Warrack (1901). Venus + Jupiter + Saturn.
- **Thomas à Kempis** — *Imitation of Christ*; multiple PD translations. Saturn + Jupiter.
- **Dante** — *Divine Comedy*, Longfellow (1867) or Cary (1814). Saturn (*Inferno*) + Mars (*Inferno* martial) + Jupiter (*Paradiso*).
- **Meister Eckhart** — sermons, pre-1930 English translations (where they exist). Jupiter.
- **Teresa of Avila** — *Interior Castle*, David Lewis (1852–1853). Venus + Moon.
- **Milton** — *Paradise Lost* (1667). Jupiter + Mars + Saturn.
- **Spenser** — *The Faerie Queene* (1590–1596). Jupiter (allegorical scope) + Venus (courtly love).
- **Shakespeare** — sonnets and plays. Multi-planet — *Antony and Cleopatra* for Venus, *Macbeth* for Mars, *Lear* for Saturn, *Hamlet* for Mercury.

### Early modern philosophy

- **Spinoza** — *Ethics*, Elwes (1883). Mercury (geometric paradox) + Saturn (measured limit).
- **Hume** — *Enquiry concerning Human Understanding*, English original. Mercury (skeptical paradox).
- **Kant** — *Critique of Practical Reason*, Abbott (1873). Sun (the "starry heavens / moral law within" passage); otherwise dense and limited yield.

### Romantic and 19th-century canon

- **William Blake** (beyond core Mercury) — *Songs of Innocence and of Experience*, *Marriage of Heaven and Hell* (full, not just proverbs), *Milton*, *Jerusalem*, the prophetic books. Venus + Jupiter + Mars + Saturn.
- **Rousseau** — *Reveries of a Solitary Walker*, pre-1930 PD translations. Moon.
- **Goethe** — *Faust* (Bayard Taylor 1870–1871; Anna Swanwick pre-1900), *Sorrows of Young Werther*. Multi-planet — Saturn (Werther), Jupiter (Faust's cosmic drama).
- **Wordsworth** — *The Prelude*, *Lyrical Ballads*, sonnets. Moon + Jupiter.
- **Coleridge** — "Kubla Khan," "Rime of the Ancient Mariner," *Biographia Literaria*. Moon + Mercury.
- **Byron** — *Don Juan*, *Childe Harold*, *Cain*. Mars + Venus.
- **Shelley** — *Prometheus Unbound*, *Adonais*, "Ode to the West Wind," *Defence of Poetry*. Jupiter + Venus + Mars.
- **John Keats** (beyond core Venus + Mercury) — *Hyperion*, remaining letters.
- **Emily Brontë** — *Wuthering Heights*, collected poems. Moon + Saturn.
- **Poe** — tales, poems, "The Philosophy of Composition." Moon + Saturn.
- **Baudelaire** — *Fleurs du Mal*, *Paris Spleen*, Arthur Symons (1905) or F. P. Sturm (1906) or Huneker (1919). Moon + Venus + Saturn.
- **Emily Dickinson** — poems, **pre-1930 editions only** (Todd / Higginson 1890–1896); Johnson (1955) and Franklin (1998) critical editions are **not** PD. Moon + Saturn.
- **Yeats** — pre-1930 volumes only: *The Wild Swans at Coole* (1919), *Michael Robartes and the Dancer* (1921), *The Tower* (1928). Later collections (*Last Poems*, 1939) not PD in US. Jupiter + Saturn + Venus.

### Art, aesthetics, and critical theory

Victorian and early-modernist voices on art, perception, form, and consciousness. Register is reflective and sometimes oracular — aesthetic attention raised to a philosophical register.

- **John Ruskin** — *Modern Painters* (1843–1860), *The Stones of Venice* (1851–1853), *The Seven Lamps of Architecture* (1849), *Sesame and Lilies* (1865). English original, all PD. Venus (aesthetic attention) + Saturn (moral weight of craft) + Jupiter (the architectural-as-spiritual).
- **William Morris** — essays, *News from Nowhere* (1890), lectures on art and socialism. English original, PD. Venus + Saturn.
- **Matthew Arnold** — *Culture and Anarchy* (1869), *Essays in Criticism* (1865 / 1888). English original, PD. Saturn + Jupiter.
- **Wassily Kandinsky** — *Concerning the Spiritual in Art*, Michael Sadler translation (1914, London). PD in US (pre-1930 publication). *Point and Line to Plane* (1926 German, 1947 English) — English translation not PD. Voice: Jupiter (the spiritual in art, inner necessity) + Venus (color as emotional grammar) + Mercury (the paradox of abstraction).
- **Henri Bergson** — *Time and Free Will* (F. L. Pogson 1910), *Matter and Memory* (Paul & Palmer 1911), *Creative Evolution* (Arthur Mitchell 1911), *Laughter* (Brereton & Rothwell 1911). All pre-1930 English translations, PD. Jupiter (duration, élan vital) + Mercury (the paradox of time and memory). Significant early-20c influence on modernist thought.
- **George Santayana** — *The Sense of Beauty* (1896), *The Life of Reason* (1905–1906), *Three Philosophical Poets* (1910). Pre-1930 works all PD. Venus (aesthetics) + Saturn (skeptical naturalism). Later works (*Realms of Being* 1927–1940, *The Last Puritan* 1935) outside the safe window.

### Novels and narrative prose

- **Melville** — *Moby-Dick* (1851). Mars (Ahab) + Saturn (Ishmael's reflections) + Jupiter (*The Whiteness of the Whale*).
- **Dostoevsky** — Constance Garnett translations (pre-1930). *Notes from Underground* → Mercury; *Brothers Karamazov* (Grand Inquisitor) → Saturn + Jupiter; *Demons* → Mars.
- **Tolstoy** — Garnett (pre-1930). *Death of Ivan Ilych* → Saturn; *War and Peace* philosophical asides → Jupiter; *Anna Karenina* → Venus + Saturn.

### Social and political

- **Karl Marx** — *Communist Manifesto* (Moore 1888), *Capital* (Moore-Aveling 1887), *Economic and Philosophical Manuscripts of 1844*. Atmospheric yield is concentrated in the Manifesto's rhetorical peaks and the 1844 *Manuscripts* on alienation. Mars + Jupiter + Saturn.
- **Adam Smith** — *Theory of Moral Sentiments* (1759). Saturn (the impartial spectator). *Wealth of Nations* is too analytical for atmospheric use.
- **G. K. Chesterton** — *Orthodoxy* (1908), *Heretics* (1905), *The Man Who Was Thursday* (1908). Mercury (paradox; Wilde-adjacent but more pious).

### Utopian, anarchist, and radical-social

Utopian and radical social thinkers from Renaissance to early 20th century. Note: the 19c utopian-socialists (Fourier, Owen, Noyes) are historically important but their prose registers skew reformist-systematic rather than atmospheric — low expected yield. The more atmospheric figures in this lineage are Kropotkin, Carpenter, and the Renaissance utopian dialogues (More, Bacon, Campanella).

- **Thomas More — *Utopia*** (Latin 1516; Ralph Robinson English 1551; Gilbert Burnet 1684). PD. Jupiter (the vision) + Saturn (the moral critique).
- **Francis Bacon — *The New Atlantis*** (1627). English original, PD. Jupiter (cosmic scientific-utopian vision).
- **Tommaso Campanella — *The City of the Sun*** (Latin 1602; Thomas W. Halliday English 1885). Jupiter + Mercury.
- **Peter Kropotkin** — *Mutual Aid: A Factor of Evolution* (1902), *The Conquest of Bread* (1906 English), *Memoirs of a Revolutionist* (1899), *Fields, Factories, and Workshops* (1898). All PD. Jupiter (mutual aid as cosmic principle) + Saturn + Mars. The most atmospheric voice in this lineage.
- **Edward Carpenter** — *Towards Democracy* (1883 and later editions), *Civilisation: Its Cause and Cure* (1889), *The Drama of Love and Death* (1912). PD. Whitman-inspired English socialist-mystic. Venus + Jupiter + Saturn.
- **Mikhail Bakunin** — *God and the State* (1882 English). PD. Mars (polemical) + Jupiter. Modest yield — more polemical than atmospheric.
- **Charles Fourier** — Albert Brisbane's interpretive *Social Destiny of Man* (1840); John Reynell Morell's *The Passions of the Human Soul* (1851); other 19c English partials. All PD. Jupiter (cosmic-social scope) + Mercury (his eccentric taxonomies — phalansteries, passionate series). **Low atmospheric yield expected** — Fourier's 19c English prose is dry and taxonomic. Worth exploring but don't expect much.
- **Robert Owen** — *A New View of Society* (1813), *The Book of the New Moral World* (1836–1844), lectures. English original, PD. Saturn (moral weight) + Jupiter (formative affirmation). **Low yield expected** — reformist-essay register rather than aphoristic.
- **John Humphrey Noyes** — *Bible Communism* (1849), *History of American Socialisms* (1870), *The Berean* (1847). PD. Jupiter + Saturn. **Low yield expected** — sermonic and community-rule-oriented. Context-sensitive: parts of the Oneida doctrine ("complex marriage") are awkward for game use regardless of voice fit.

### Core-chorus deepening

- **Marcus Aurelius** (Long 1862) — Books V–XI especially under-mined.
- **Sei Shōnagon** (Waley 1928) — additional *Pillow-Book* entries beyond "Pretty Things."
- **Nietzsche** (Levy series) — *The Gay Science* / *Joyful Wisdom*, *Human All Too Human*, *Daybreak*.
- **Proust** (Moncrieff vols 1–6) — deeper Overture, *Within a Budding Grove*, *The Guermantes Way*.
- **Emerson** — *Self-Reliance*, *Nature*, *Heroism*, *The Over-Soul* in full (earlier passes sampled).

### Coverage gaps worth naming

PD sourcing pulls unavoidably toward the North Atlantic, the ancient Mediterranean, and the classical Asian canon — the traditions with the deepest pre-1930 English-language translation corpora.
Genuinely underrepresented regions where good PD material is scarce:

- **Sub-Saharan Africa** — most atmospheric philosophical and poetic material is either oral-traditional (and recorded only in colonial-era ethnographic contexts that are PD but problematic), or modern (Soyinka, Achebe, Senghor) and under copyright. Egyptian and Ethiopian texts above are Northern African / Afro-Asiatic.
- **Latin America** — pre-Columbian material is mostly in *Popol Vuh* above; colonial-era sources are dominated by Spanish imperial voices; the great modern Latin American poets (Darío, Mistral, Neruda, Paz, Borges) are all under copyright.
- **Indigenous peoples of the Americas, Australia, Oceania** — recorded song and myth traditions exist in pre-1930 ethnographic collections, but the voice-fit for an atmospheric game and the ethics of using ethnographically-recorded material warrant case-by-case judgment.
- **Modern Islamic thought** (Iqbal, Shariati) and **modern Indian thought** (Aurobindo, Krishnamurti, Ramana Maharshi) — mostly 20th century and under copyright.

Calling this out explicitly so we don't pretend the content library is representing the full range of human wisdom traditions — it's representing what's accessible, which skews heavily toward what was colonized, translated, and printed in English before 1930.

### Excluded under our license discipline

Per §11 Scope, Space Prince accepts **PD, CC0, and CC-BY** only. The following are excluded because they fail that test — whether through outright copyright, CC-BY-NC licensing, or share-alike terms we are not committing to. Not exhaustive.

**Still under active copyright (all rights reserved):**
- **Hermann Hesse** — *Siddhartha* German original (1922) PD in US; canonical Rosner 1951 English translation not PD.
- **Rilke** — most English translations post-1930.
- **Umberto Eco** (d. 2016), **Jorge Luis Borges** (d. 1986) — voice fits (Mercury especially), but full works still under active copyright.
- **Journey to the West** (*Xi You Ji*) — only the Timothy Richard 1913 paraphrase is PD, and it recasts Buddhist concepts in Christian terms; misrepresents Wu Cheng'en. Waley (1942), Anthony Yu (1977–83), Jenner (1982–86) all under copyright.
- ***Water Margin*** (*Shuihu Zhuan*) — Pearl Buck *All Men Are Brothers* (1933) and Sidney Shapiro (1980) both under copyright.
- ***Golden Lotus*** (*Jin Ping Mei*) — Egerton 1939 under copyright.
- **Full *Shiji*** (Sima Qian) — Burton Watson 1961+ under copyright.
- **Han Shan / Cold Mountain poems** — Waley 1954, Snyder 1958, Red Pine all under copyright.
- **Simone Weil** (d. 1943), **Camille Paglia** (active), **Jung**, **Buber**, **W. H. Auden**, **Alan Watts** — modern authors still in copyright despite strong voice-fit.
- **Walter Benjamin** (d. 1940) — *Illuminations*, *Reflections*, *Arcades Project*, *Selected Writings*. All canonical English translations (Zohn 1968; Belknap 1996–2003; Howard Eiland *Arcades* 1999) under copyright. German originals partially PD in US but atmospheric use requires translation we can't source.
- **Gershom Scholem** (d. 1982) — *Major Trends in Jewish Mysticism* (1941), *On the Kabbalah and Its Symbolism* (1965), *Sabbatai Sevi* (1973). All rights reserved. A real gap — Scholem is the scholarly voice on Kabbalah, and his absence means our kabbalistic corpus stays thin.
- **Hilma af Klint's notebooks** (d. 1944) — sealed until the 1980s; English editions of her writings published only recently, all under copyright.
- **Paul Klee theoretical writings** (d. 1940) — *Pedagogical Sketchbook* (English 1953), *Creative Credo* — most English translations post-1930.
- **Kazimir Malevich** — *The Non-Objective World* (1927 German, 1959 English). English translation under copyright.
- **Piet Mondrian theoretical writings** (d. 1944) — English translations mostly under copyright.

**CC-BY-NC (non-commercial only — excluded because Space Prince is commercial):**
- **William Davidson Talmud** (Sefaria's commissioned Steinsaltz English translation).
- **JPS Tanakh 1985, JPS Contemporary Torah 2006, JPS Gender-Sensitive Edition 2023.**
- **Koren Jerusalem Bible.**

**CC-BY-SA (excluded for now — share-alike could propagate to the game's content distribution):**
- **Wikisource Talmud Bavli** translation (CC-BY-SA).
- **Open Mishnah** (CC-BY-SA).
- Other CC-BY-SA material on Sefaria and elsewhere. Reconsider case-by-case if a particular work becomes load-bearing and no CC-BY / PD alternative exists.

Sources are added to this list as they surface during design conversations.
After sourcing, a source that contributes meaningfully to a particular planet's voice may be promoted into that planet's core chorus in §§3–9.
