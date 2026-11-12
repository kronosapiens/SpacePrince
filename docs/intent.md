# Space Prince — Intent

*Why the game is the way it is: the premise, the audience, the experience it is after, and the work it leans on.*

The rules that currently realize this intent are in [mechanics](mechanics/), the surfaces in [presentation](presentation/), and the writing material in [writing](writing/).
Those are revisable ways of achieving what this document describes; when a rule and the intent pull apart, the question is which one to change, not which one wins.

## Premise

A player mints a **Prince**: one moment and place, a latitude, a longitude, and a time, resolved into a natal chart of seven planets.
The position is recognized, not invented, and it can be recognized only once.
The chart is the character sheet, the save file, and the artifact the player owns, all the same object.

Play is a journey of encounters, with other charts and with the houses of the player's own, informed by Siddhartha's attention to lived experience (below).
In each encounter the player chooses which planet answers and how, and the chart's own structure, its signs and aspects, carries the consequences.
The Prince generates **Light** by responding skillfully to each circumstance: energy gathered across the journey and expended to restore the chart, with what is left at a journey's end becoming one star in the Prince's sky.
Tension wears down each planet's Resolve, planets combust and return, and a run ends by completion or by every planet going dark.
Nothing resets.
A run ends in combustion as readily as in completion, and either way the world records the Light that remains.

The canonical definition of Light:

> Light is the energy you generate by responding skillfully to your circumstance.
> You can expend it to restore yourself, and what is left at a run's end becomes a star.

Progress does not increase power.
It increases specificity: over many runs the chart fills in, one planet at a time, and the player's reading of it deepens.

The setting is a cosmic fable: many small worlds under a sky people come from and return to, with wonders that go unexplained.
[SETTING.md](writing/SETTING.md) guides its atmosphere, limited exposition, and encounters that stand alone in any order.

## Audience and exposition

The player we build for is the **curious outsider**: drawn by the art, the mystery, or the artifact, who knows no astrology and is not asked to believe in any of it.
Astrology is taught from zero, as a language for reading agents, roles, and change, with every term introduced on first use.
The game is a gateway into astrology, not a test of it.

The governing rule is to **front-load intent, not information**.
A newcomer should arrive knowing why this matters and what they will do, enough to form intent, and learn the concepts by living them.
Exposition is generous in availability and invisible by default.
It is delivered deepest-on-demand: a short framing at first arrival, each screen's guide the first time a Prince meets it, the inspect annotations and the glossary when summoned, and the long-form primer for whoever wants it.
Offer a foothold; never force a lesson.
The guides teach in the game's own words, each paired with one plain descriptive word ([SCREENS.md §1.2](presentation/SCREENS.md)).

## The experience

The player should feel they are learning a symbolic language, not optimizing a system.
Early runs are mechanics and a diagram; in the middle the patterns start to read symbolically; late, the player reads their own chart fluently.
This progression requires no mechanical change.
The game does not become meaningful; the player becomes literate.

The client holds to a few qualities in service of that:

- **Never rush.** Transitions and text have pacing, and silence is a design tool.
- **Never flatten the mystery.** Even at full progression the chart should feel partially opaque, not because information is hidden but because symbolic meaning is inexhaustible.
- **Never generate text.** Every line the player reads is authored; composing a surface from authored lines (the 720 house scenes, the seven encounter openings) honors this.
- **Client honesty.** Anything derivable from public state is shown, and nothing determined is framed as a gamble ([SCREENS.md §1.1](presentation/SCREENS.md#11-client-honesty)).
- **Failure is canonical.** Combusting out is acknowledgment, not punishment; the star is the same kind of mark either way.

What the game is not: a hero collector, a loot treadmill, a competitive ladder, a belief-driven astrology simulator, or a free-to-play engagement machine.
It is not trying to entertain so much as to reward attention.

## The Prince

You are the Prince.
Your own chart is the character sheet, and the position is how you were recognized: one place and time, once.
Siddhartha guides the Prince's openness to lived experience: each encounter offers a partial view, and interpretation belongs to the player.
Enlightenment is the player's, not the game's: more stars and more marks point to mastery, but it is not something a run can complete or the artifact can represent.
The Prince is addressed in the second person, in the scenes and in the house–planet entries.
No two Princes occupy the same position; many may share a chart, and chart twins are siblings in nature, not duplicates.
The Prince NFT is the Prince: if it exists the Prince exists, and if it changes the Prince has changed ([NFT.md](presentation/NFT.md)).

Lore, where it exists, is structural rather than expository: no omniscient narrator, no timeline, no villains; facts and state are canon, and interpretation belongs to the player.

## The chain and the client

Space Prince is intended to be a fully onchain game.
Identity, chart derivation, run state, resolution, and the artifact are meant to be computed and held on Starknet, so the chain is canon and the client reveals what already exists.
Where a design needs hidden information, it is hidden onchain, as entropy that does not exist yet, never by the client.

The current client is a local prototype: no wallet, no RPC, no contract calls, charts from a real ephemeris, state in `localStorage`.
It is where composition is decided by looking, and its rendering surface is meant to survive the integration unchanged.
The chart-derivation crate exists in `cairo/`; the game contracts do not yet (see the onchain reading path in [docs/README.md](README.md)).

## Influences

Space Prince borrows pressure, not resemblance, from each of these, and diverges where optimization would overwhelm meaning.

### Astrology, as a symbolic system

The dense symbolic language, cyclical balance, and non-hierarchical typology of Hellenistic astrology are the design substrate.
The game asserts nothing about whether astrology is true, only that it is useful: a fixed but expressive identity space with meaningful asymmetry and no dominant build.
[ASTROLOGY.md](research/ASTROLOGY.md) traces the tradition and its sources.

### Siddhartha (Hermann Hesse)

The spiritual reference for self-discovery through lived experience.
Each encounter is meaningful on its own in any order; the player may find connections without following a prescribed sequence of lessons.
The planets are partial teachers, each giving something and none the whole.
The cosmos is the river, a presence to listen to rather than an opponent to defeat.
Other Princes are Govinda: different coordinates, different journeys, no judgment between them.
Familiar kindness and difficult exchange can both generate Light; an encounter need not teach a lesson.
The archived v1 action space, the Think / Wait / Fast postures ([archive](archive/v1/DESIGN.md)), came from Siddhartha's answer to Kamaswami; the postures did not survive, the sensibility did.

### The Prophet (Kahlil Gibran)

The reference for what a person in a scene may believe and say: a precise claim about an ordinary thing, which the listener is free to dispute.
Its chapters share the houses' subjects, among them houses, children, work, marriage, friendship, and death.
[VOICE.md](writing/VOICE.md) gives such convictions to speakers and keeps the narrator plain.
The Prince's feelings and interpretation remain the player's.

### The Little Prince (Antoine de Saint-Exupéry)

The setting and prose reference.
Its narrator is plain and its convictions sit with its speakers ([VOICE.md](writing/VOICE.md)).
Small worlds, each with someone on it and one thing they care about; a traveller who arrives, asks a plain question, and goes on.
The sky is a place people come from and return to, and nothing in it is explained by machinery.
Its inhabitants are caricatures and its episodes carry morals; ours are people with understandable wants, and an encounter need not teach.
[SETTING.md](writing/SETTING.md#the-little-prince) applies it to encounters.

### Hyperion (Dan Simmons)

Travellers share a road and carry private reasons for it.
An encounter shows one of those reasons and leaves the rest of that life unseen, which bears most on encounters with other Princes ([SETTING.md](writing/SETTING.md#hyperion)).

### FTL: Faster Than Light

The structural reference.
The ship is always visible, so the chart is always present and narrative beats happen against the same anchor rather than on separate screens.
Sectors become maps, nodes become encounters, and scarcity becomes constraint: a Prince is never out of anything, only no longer permitted to act in certain ways.
Its soundtrack's explore and battle variants of one theme shape the music ([MUSIC.md](presentation/MUSIC.md)).

### Slay the Spire

The combat rhythm: telegraphed intent, then the player acts, then the response, sequential rather than simultaneous, extended with preemption when the acting planet is combusted first.
Its events shape the house scenes: a deterministic decision with a few offers and a way to leave, and routing that is informed because the map shows what is knowable.

### Others, briefly

- **Star Wars**: a lived-in world, where things are worn and mended and the mysterious is taken for granted.
- **Hades**: failure as forward motion; a personified cast on its model was considered and rejected, so the planets stay ambient.
- **Loot Survivor**: proof that a roguelike can live onchain; Space Prince asks what that looks like when identity replaces inventory.
- **Into the Breach**: perfect information and weighty single actions, which became client honesty.
- **Braid**: a core mechanic that embodies its theme; the astrological system is a metaphor for identity and fate.
- **Outer Wilds** (progress as knowledge), **Cultist Simulator** (a symbolic system as mechanics), **Disco Elysium** (fixed identity as constraint, failure as the interesting outcome), **Wildermyth** (history written into the character), and the tabletop die (visible, ritualized, legible randomness) each lend one idea.
- An ambient chorus of philosophical fragments, after David OReilly's *Everything*, was built and removed; its archetypes survive in [PLANETS.md](writing/PLANETS.md).

## Economics

Economics exist to reinforce commitment, not to extract value or accelerate outcomes.
Money may acknowledge commitment; it may never improve outcomes, influence randomness, restore permission, or undo recorded history.
Inspecting the Prince, waiting, and returning are always free.

The Prince is a standard ERC-721, freely transferable.
Its value is as an artwork that records play: each run leaves a star and each earned mark a glyph, so a played Prince is a different object from a fresh one ([NFT.md](presentation/NFT.md)).
The intended pricing is a flat mint fee of about $5 that includes five runs, then about $1 per run, with a paymaster covering the gas.
The target is an average of about $0.50 of gas per run; a single long run may cost more.
If gas runs over, the game gets harder or shorter; the price and the paymaster stay.
The ephemeris runs only at mint, and the Others are minted Princes.

Achievements carry a Prince's progression past the planet unlocks.
A free sample run stays in the browser, so it costs no gas.
What happens if a game reaches a gas limit remains open ([#31](https://github.com/kronosapiens/SpacePrince/issues/31)).

## Open questions

The plan for completing the design is [#51](https://github.com/kronosapiens/SpacePrince/issues/51): three items that decide whether chart-to-chart encounters land, then four that finish the design.

- [#52](https://github.com/kronosapiens/SpacePrince/issues/52): what Light is, and what has to change to fit it.
- [#24](https://github.com/kronosapiens/SpacePrince/issues/24): making the Other respond to the player, by remaining Resolve or by answering in kind.
- [#35](https://github.com/kronosapiens/SpacePrince/issues/35): the chart-to-chart encounter's words at every level.
- [#34](https://github.com/kronosapiens/SpacePrince/issues/34): the end-of-run beat, where the run's Light becomes a star.
- [#31](https://github.com/kronosapiens/SpacePrince/issues/31): the per-run gas budget, maturity, and a free sample run.
- [#32](https://github.com/kronosapiens/SpacePrince/issues/32): deferred presentation (run history, chart study layers, map valence cue, shareable runs).
