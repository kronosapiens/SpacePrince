# Narrative voice research

Sources and comparisons for short narrative encounters.
The game and horoscope research was consulted on 2026-10-08, asking how short scenes can carry a specific human situation while borrowing some of a newspaper horoscope's intimacy and confidence.
The [Gibran reading and comparisons](#gibran-and-encounter-prose) record the later prose direction; current authoring guidance lives in [VOICE.md](../writing/VOICE.md) and [SCENES.md](../writing/SCENES.md).

## Scope and source limits

The existing [FTL](FTL.md) and [Slay the Spire](STS.md) inventories distinguish paraphrased setups from quoted game text.
The selected entries below support analysis of situations, offers, and characterization; their setup sentences are not evidence of the games' original prose rhythm.
The older [survey](SURVEY.md#5-surface-and-register) mainly compares choice presentation and economics.
Its conclusions about legibility should not be treated as playtest findings about this proposed voice.

The walking simulator discussion began with [Entalto's overview](https://entaltostudios.com/our-top-5-walking-simulator-games-you-shouldnt-miss/).
The developer material below gives more specific evidence for the techniques that overview suggested.
The horoscope sample comprises two columns, sixteen years apart, rather than a representative history of newspaper astrology.
Both page images were inspected to check their dates and wording against OCR.

## What the game inventories offer

| Example | What gives the situation substance | Application to Space Prince |
| --- | --- | --- |
| [FTL: Asteroid mining colony](FTL.md#asteroid-mining-colony) | The colony needs explosives; its rejection of a missile attack distinguishes its practical need from the captain's proposed solution. | Give other people a use for what they want and a point of view about receiving it. |
| [FTL: Lanius trader with translator](FTL.md#lanius-trader-with-translator) | The apparent translation device turns out to be a person available to join the crew. | A surprising fact can change the meaning of an ordinary transaction. |
| [FTL: Slaver](FTL.md#slaver-friendly) | The player's need for crew meets an intelligible, objectionable business. | A practical opportunity can carry an ethical interpretation without a separate morality score. |
| [Slay the Spire: The Library](STS.md#the-library) | Books and a comfortable chair support different uses of the same refuge. | A scene can offer uncomplicated pleasure and relief without a hidden injury or interpersonal quarrel. |
| [Slay the Spire: Face Trader](STS.md#face-trader) | The stranger's unusual body, fixation, and terse request make the exchange memorable. | Let a person have a particular appetite and a recognizable way of speaking. |
| [Slay the Spire: The Cleric](STS.md#the-cleric) | His exuberant introduction gives an ordinary service a personality. | Functional clarity leaves room for humor and warmth. |
| [Slay the Spire: Old Beggar](STS.md#old-beggar) | Refusal receives a personal rebuke. | Useful counterexample: the scene can pressure the player toward an approved moral reading. |

These are selected examples, not claims about how frequently each technique occurs across either corpus.
Their common lesson for this exercise is that a reader can identify what is happening before interpreting its significance.
FTL's hidden outcomes and chains, and Slay the Spire's sometimes punitive framing, do not become recommendations merely because their scenes are memorable.

## Opening length comparison

Counted on 2026-10-08 from published game-text transcriptions, separately from the inventory paraphrases.
These six encounters were selected from the examples already discussed above; they are not a random sample or a corpus average.
Counts cover the opening narration and dialogue before the first substantive choice, excluding titles, option labels, mechanical information, and outcomes.
Words are counted with `\b\w+(?:['’\-]\w+)*\b`, keeping contractions and hyphenated words together.

| Game and encounter | Opening words | Source passage |
| --- | ---: | --- |
| FTL: Asteroid mining colony | 34 | [Opening before the numbered options](https://ftl.fandom.com/wiki/Asteroid_mining_colony) |
| FTL: Lanius trader with translator | 32 | [Opening under LANIUS_TRADER_TRANSLATOR](https://hugomg.github.io/ftl-cheatsheet/#LANIUS_TRADER_TRANSLATOR) |
| FTL: Slaver, friendly | 19 | [Opening before the numbered options](https://ftl.fandom.com/wiki/Slaver_(friendly)) |
| Slay the Spire: The Cleric | 29 | [Dialogue, Encounter](https://slay-the-spire.fandom.com/wiki/The_Cleric) |
| Slay the Spire: The Library | 50 | [Dialogue before Read](https://slaythespire.wiki.gg/wiki/Library) |
| Slay the Spire: Face Trader | 49 | [Dialogue before Touch](https://slaythespire.wiki.gg/wiki/Face_Trader), split into 15 words before Continue and 34 after it |

Face Trader spreads its introduction across two panels; its total is not a single-screen target.
The other rows count one opening passage.
The transcriptions were read from accessible page content or full dialogue sections returned by search; these counts were not independently checked against a running game.

On 2026-10-08, the 24 [client prompts](../../client/src/data/narrative-scenarios.ts) ranged from 22 to 38 words, with a median of 30.
The [existing authoring guidance](../mechanics/ENCOUNTERS.md#9-prose-and-mechanical-copy) already calls for one or two concrete prompt sentences.

## What the walking simulator references offer

### Gone Home

In [Leigh Alexander's interview with Steve Gaynor](https://www.gamedeveloper.com/design/how-i-gone-home-i-s-design-constraints-lead-to-a-powerful-story), published 2013-08-15, Gaynor describes exploration and objects as the means of discovering a family story.
He explains why a recently occupied house makes the available artifacts relevant to the immediate situation, and why the family's generations supply the conflict.
The period setting also makes physical records plausible.

**Application:** an object earns attention through what it lets us discover about a particular life.
A worn key can be attractive scenery; who has been getting out of bed to use it supplies a relationship.
Space Prince has less room for accumulated evidence, so an individual scene needs to carry more of that connection explicitly.

### What Remains of Edith Finch

[Ian Dallas's launch essay](https://blog.playstation.com/archive/2017/04/25/the-personal-stories-that-shaped-remarkable-ps4-adventure-what-remains-of-edith-finch-out-today/), published 2017-04-25, distinguishes an intended feeling of awe from the experience of seeing through the eyes of overwhelmed people.
He describes drawing details from the team's lives and developing different interactions for different stories.

**Application:** choose a particular experience before choosing an elevated tone.
Pleasure, embarrassment, boredom, and irritation can each give a short encounter character.
Different prose tones can help distinguish our scenes, although that cannot reproduce Finch's variety of embodied interactions.
Its emotional effects are design intentions and reported experience, not a guarantee that a similar sentence will work here.

### Firewatch

Campo Santo's [official localization repository](https://github.com/camposantogames/firewatch_localization) provides the game's text and distinguishes conversation sections from other strings.
Even its short dialogue example contains teasing about personal charm, rather than uniformly solemn speech.
This is a sample of available lines, not a reconstructed playthrough.

The developers' [2017 GDC presentation](https://media.gdcvault.com/gdc2017/Presentations/Armstrong_Do_you_copy.pdf#page=50), especially PDF pages 50–55, describes conversations selected according to what the characters know about Julia.
The distinction changes which question Delilah can plausibly ask.

**Application:** let speakers have different manners, incomplete knowledge, and ordinary social purposes.
Natural familiarity in Firewatch also depends on remembered interactions.
Our isolated scenes can establish a local history, but cannot claim callbacks to player choices that the game does not record.

### Dear Esther

In [Phill Cameron's interview with Dan Pinchbeck](https://www.gamedeveloper.com/game-platforms/interview-moved-by-mod-i-dear-esther-i-s-dan-pinchbeck), first published 2009-07-01 and lightly updated in 2023, Pinchbeck describes ambiguity, unease, and different versions of the story as deliberate aims.
He also describes the work as a mood piece.

**Application:** uncertainty can be an intended experience, but it needs a purpose.
That does not make obscurity a default for an encounter requiring one informed decision.
We can leave people's motives open while making the immediate situation clear.

### The Stanley Parable

The [official Ultra Deluxe description](https://stanleyparable.com/) explicitly presents contradiction and choices being taken away as part of its experience.
This is promotional framing, not an analysis of its complete script.

**Application:** a narrator's claim can be something the player contests.
Using that technique throughout Space Prince would introduce a more adversarial narrator than the current proposal requires.
For now, other characters can make contestable claims without the scene narrator deciding the Prince's response.

## Two newspaper horoscope samples

### Carroll Righter in 1978

[Times-News, Twin Falls, 1978-04-18, printed page 25](https://tfpl.sfo2.digitaloceanspaces.com/Newspapers/Times-News_TF341/PDF/1978_04_18.pdf#page=24), upper-left column.
The forecast is for Wednesday, April 19; this is distinct from the newspaper's publication date.

The entries move quickly between daily business and personal relationships.
Imperatives carry much of the voice; under Moon Children, Righter writes: “Get at the reason why a partner is irate and correct.”
Libra moves from early difficulty to better results later, followed by advice to reach an understanding with a loved one.
Ordinary concerns, compressed instruction, and confident timing carry the forecast more than ornate cosmic imagery.

**Useful:** direct address and concise, familiar language.
**Cost:** the column supplies a correct response and anticipates a favorable resolution.
Its sparse circumstances would need to become concrete fiction before supporting our encounters.

### Patric Walker in 1994

[Rio Grande Herald, 1994-09-15, page 7](https://texashistory.unt.edu/ark:/67531/metapth195462/m1/7/), forecast for September 12–18.
[Archive OCR](https://texashistory.unt.edu/ark:/67531/metapth195462/m1/7/ocr.txt) and [page image](https://texashistory.unt.edu/ark:/67531/metapth195462/m1/7/high_res/) were read together.

Walker's Libra entry identifies repeated acquiescence and names its consequence: “you are paying the price of your inability to say no.”
Aries cautions against an arrangement demanding more than it returns; Taurus pairs a claim of entitlement with a qualification about extenuating circumstances.
The tone combines assumed personal knowledge, forceful interpretation, and advice modified by concessions.
Astrological aspects supply authority for those statements.

**Useful:** frank recognition of a social pattern and sentences that complicate their first assertion.
**Cost:** the writer presumes the reader's history and directs their priorities.
For Space Prince, any such observation needs evidence in the scene, and the Prince's chosen drive remains open.
The horoscope's aspect language is not evidence of relationships implemented in the game.

## Interpretation of the sources

The research suggests a more observant and occasionally opinionated narrator, with concrete situations carrying its observations.
That is an editorial inference, not a recipe demonstrated by these sources.

The horoscope contribution may be a sentence that recognizes an immediate contradiction: a household offers the visitor freedom while someone else remains obliged to wait up.
The game contribution is the specific arrangement that makes the contradiction understandable and potentially actionable.
The walking simulator contribution is the sense that these people have lives and habits beyond the moment of encounter.

Overuse could still produce a succession of polished little lessons.
Whether that voice is enjoyable across repeated encounters remains a reading and playtesting question.

## Scene development feedback

Reader feedback from the catalogue's development, retained separately from the [comparison method](../writing/SCENES.md#review-through-comparisons).

| Comparison | Reader feedback | Working implication |
| --- | --- | --- |
| Mara speaking directly versus narration reporting her request | The direct request was preferred. | Let people say what they want. |
| Lena's shared history versus a joke in dialogue | The history “evokes a larger backstory,” but screaming could mean joy or pain. | Keep the sense of an earlier shared experience and clarify its emotional character. |
| A mother gives you a key while your brother must still wait up | Neither version established clear drama. | Rework the situation before adjusting narrator commentary or sentence order. |
| House IV under Libra, Capricorn, Leo, and Pisces | “Each of these scenes has something to draw the reader in.” | The sign can carry the situation; proceed to house–sign scenes. |

## Gibran and encounter prose

Readings and scene comparisons, 2026-11-08.
The [voice reference](../writing/VOICE.md) pairs passages from *The Prophet* with instructions for adapting their techniques to encounters.
The readings use the original English text published in 1923, with chapter sources linked beside each passage.

| Exercise | Reader feedback | Editorial application |
| --- | --- | --- |
| Existing cup, pear, and funeral scenes compared with revised versions | Preferred all three revisions because the writing flows more nicely. | Retain the more fluent cadence; this preference alone does not establish which individual device caused it. |
| Fresh scenes about competing claims and an actor borrowing a voice | Both created interpretable scenes and stakes. | Keep the situation and possible participation understandable. |
| A seamstress requesting help as her sight fails | The first version had unclear conflict and choices; the apprentice's contribution remained unclear after revision; removing him made the scene stronger. | Establish the practical request and let the situation determine the number of participants and choices. |

These judgments concern readability and flow in the passages reviewed.

### A/B scene comparisons

A is the catalogue opening used in the comparison; B is the revised version preferred by the reader.
The passages are retained here as reviewed, with their original possible participation.

#### A gift from your sister

[House IV, Taurus, handmade cup](../../client/src/data/narrative/house-04.ts).
Participation: drink from the cup, buy bread to share with the pot on the hearth, or set the cup within reach; revival uses the second cup.

**A**

> Your sister makes you a cup shaped like the one you broke years ago.
> When you reach toward the high shelf, she catches your wrist.
> “For drinking.”
> A pot simmers on the hearth.
> Beside her tools sits a second cup, still warm from its firing.

**B**

> Your sister makes you a cup like the one you broke years ago.
> You reach toward the high shelf.
> She catches your wrist.
> “It will hold nothing there, however long it lasts.”
> A pot simmers on the hearth.
> Beside her tools sits a second cup, still warm.

#### The first ripe pear

[House V, Taurus, ripe pears](../../client/src/data/narrative/house-05.ts).
Participation: enjoy the pear, divide it among others, or offer your companion the first bite; Venus's joy permits sharing it closely with her.

**A**

> Your companion gives you the first ripe pear and catches your wrist before you bite.
> “Smell it.”
> You turn it over, admiring its shape.
> She looks almost offended.
> “Yes, very pretty.
> I have been waiting three days for it to smell like this.”

**B**

> Your companion gives you the first ripe pear.
> You turn it to admire the shape.
> She draws your hand toward your nose.
> “Three days I have waited for this smell.
> You may praise its looks when we have eaten it.”

#### The funeral meal

[House VIII, Taurus, feast](../../client/src/data/narrative/house-08.ts).
Participation: eat the full portion, pass the dishes, or thank the cook without taking a plate.

**A**

> The funeral cook will not let the mourners pick at their plates.
> “He would have asked for seconds.”
> She gives you a portion large enough to support the claim.
> At the end of the table, untouched dishes wait beside people who have forgotten to pass them.

**B**

> The funeral cook fills your plate.
> “He would have asked for seconds.”
> Farther down the table, full dishes stand untouched.
> She knows how to feed the man who has died; she is still learning how to feed the people who miss him.
