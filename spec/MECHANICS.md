# Space Prince — Mechanics

*How the astrological data model becomes a game.*

This document describes the mechanisms available for game design, grounded in the structures defined in CONTRACTS.md.
Each mechanism is described in terms of what it is, what astrological structure it draws on, and what role it serves in gameplay.
No specific game loop is prescribed here — this is the toolkit from which a game loop will be assembled.

---

## 1. Chart as Identity

**What it is.**
A Prince is defined by 7 planet positions, computed deterministically from a birth moment (latitude, longitude, timestamp).
The chart is immutable after mint.
No two Princes share the same birth moment.

**Astrological basis.**
The natal chart — a snapshot of the sky at a specific time and place — is the foundation of all astrological practice.

**Role in gameplay.**
The chart is the character sheet.
It determines the Prince's strengths, weaknesses, internal tensions, and relational patterns.
Because charts are immutable and unique, the player's job is to understand and work with what they have, not to optimize toward an ideal.

---

## 2. Planets as Agents

**What it is.**
Each Prince has 7 planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
Each planet has a sign, element, modality, dignity, and house placement.
Planets are the units of action — whatever the player does in the game, they do it through a planet.

**Astrological basis.**
In traditional astrology, planets are the actors.
Signs describe how they act; houses describe where; aspects describe how they relate to each other.

**Role in gameplay.**
Planets are the player's resources and tools.
The player must choose which planet to deploy and when, creating a resource-management layer where the "resources" are aspects of identity rather than consumables.

**Stat profiles.**
Each planet has four stats on a 1–4 scale:
- **Damage** — affliction dealt to the opponent
- **Healing** — testimony generated in testimony matchups
- **Durability** — resistance to combustion (determines affliction threshold: effective durability × 10)
- **Luck** — chance to deal a critical hit (each point = 8% crit chance; crit doubles output; max 40%)

| Planet | Damage | Healing | Durability | Luck | Category | Sect | Role |
|--------|--------|---------|------------|------|----------|------|------|
| Sun | 3 | 2 | 3 | 2 | Luminary | Day | Sovereign — strong all-around, slightly offensive |
| Moon | 1 | 4 | 1 | 2 | Luminary | Night | Nurturer — best healer, combusts easily |
| Mercury | 2 | 2 | 2 | 4 | Neutral | Chart's | Trickster — flat stats, highest crit chance |
| Venus | 1 | 4 | 2 | 3 | Benefic | Night | Diplomat — heals brilliantly, fortunate |
| Mars | 4 | 1 | 2 | 1 | Malefic | Night | Warrior — maximum damage, no luck |
| Jupiter | 2 | 3 | 3 | 3 | Benefic | Day | Sage — generous, fortunate, steady |
| Saturn | 2 | 1 | 4 | 1 | Malefic | Day | Sentinel — maximum endurance, no luck |

**Astrological basis for stat profiles.**
Planet natures are core Hellenistic.
Mars as aggressive, Venus as harmonizing, Saturn as enduring, Jupiter as expansive, Moon as responsive — these are traditional characterizations, not inventions.
The malefic/benefic/luminary categories are among the oldest features of the tradition.

**Sign buffs (sheet time).**
A planet's sign modifies its base stats.
Each sign has an element and a modality, each contributing +1 to one stat:

*Element → primary stat:*
- Fire → +1 damage (aggression, will)
- Earth → +1 durability (stability, endurance)
- Water → +1 healing (nurture, flow)
- Air → +1 luck (lightness, volatility, chance)

*Modality → secondary stat:*
- Cardinal → +1 damage (initiative, first strike)
- Fixed → +1 durability (endurance, persistence)
- Mutable → +1 healing (adaptability, recovery)

Every sign gives exactly +2 total.
When element and modality map to the same stat, the sign is a "specialist" (+2 to one stat).
Otherwise it's a "hybrid" (+1/+1 to two stats).

| Sign | Element | Modality | Buff | Profile |
|------|---------|----------|------|---------|
| Aries | Fire | Cardinal | +2 damage | Pure aggressor |
| Taurus | Earth | Fixed | +2 durability | Immovable object |
| Gemini | Air | Mutable | +1 luck, +1 healing | Lucky adapter |
| Cancer | Water | Cardinal | +1 healing, +1 damage | Protective striker |
| Leo | Fire | Fixed | +1 damage, +1 durability | Relentless force |
| Virgo | Earth | Mutable | +1 durability, +1 healing | Steady mender |
| Libra | Air | Cardinal | +1 luck, +1 damage | Volatile striker |
| Scorpio | Water | Fixed | +1 healing, +1 durability | Deep endurer |
| Sagittarius | Fire | Mutable | +1 damage, +1 healing | Versatile striker |
| Capricorn | Earth | Cardinal | +1 durability, +1 damage | Armored initiative |
| Aquarius | Air | Fixed | +1 luck, +1 durability | Fortunate survivor |
| Pisces | Water | Mutable | +2 healing | Pure healer |

Three specialists: Aries (+2 dmg), Taurus (+2 dur), Pisces (+2 heal).
No luck specialist (luck only comes from air element, never from modality).
Nine hybrids with distinct +1/+1 profiles.

**Example effective stat profiles.**

*Mars in Aries* (fire, cardinal, domicile):
Base: Dmg 4, Heal 1, Dur 2, Luck 1.
Sign: +2 dmg.
Effective: **Dmg 6, Heal 1, Dur 2, Luck 1** — peak aggression, combustion threshold 20.

*Saturn in Taurus* (earth, fixed):
Base: Dmg 2, Heal 1, Dur 4, Luck 1.
Sign: +2 dur.
Effective: **Dmg 2, Heal 1, Dur 6, Luck 1** — immovable object, combustion threshold 60.

*Moon in Pisces* (water, mutable):
Base: Dmg 1, Heal 4, Dur 1, Luck 2.
Sign: +2 heal.
Effective: **Dmg 1, Heal 6, Dur 1, Luck 2** — ultimate healer, combustion threshold 10.

*Mercury in Libra* (air, cardinal):
Base: Dmg 2, Heal 2, Dur 2, Luck 4.
Sign: +1 luck, +1 dmg.
Effective: **Dmg 3, Heal 2, Dur 2, Luck 5** — trickster with teeth, 40% crit chance.

---

## 3. Sign Relationships (The 12×12 Matrix)

**What it is.**
Any two zodiac signs have a fixed relationship determined by their angular distance: conjunction (0), semi-sextile (1), sextile (2), square (3), trine (4), inconjunct (5), or opposition (6).

**Astrological basis.**
Sign relationships derive from the geometry of the zodiac circle.
Trines connect signs of the same element; squares connect signs of the same modality; oppositions connect complementary polarities.
These relationships are among the oldest features of the tradition.

**Role in gameplay.**
Sign relationships serve two functions:
1. **Internal propagation** — aspects between a Prince's own planets use sign relationships to determine propagation multipliers (§4).
2. **Encounter weighting** — the number of major sign relationships between two charts determines which opponent planets appear most often (§13).

Sign relationships do *not* directly determine encounter damage.
Interaction resolution uses a different decomposition: element determines polarity, modality scales outgoing, stats determine magnitude (§13a).
The player cannot change the terrain, only choose which planet to send into it.
Learning the relationships is a core skill that develops through play.

---

## 4. Aspects (Internal Structure)

**What it is.**
Each Prince's 7 planets form up to 21 pairwise aspects based on sign relationships.
Some pairs have no aspect.

**Astrological basis.**
Aspects describe the relationships between planets within a single chart — which cooperate, which are in tension.

**Role in gameplay.**
Aspects create **internal connectivity**.
When a planet is activated (sent into an encounter turn), its aspect connections resolve — propagating the turn's outcome to connected planets.

**Propagation model: one hop from the active planet.**
Each aspect applies a multiplier to the active planet's outcome (affliction or testimony) and delivers the result to the connected planet:

| Aspect | Base Multiplier | Same-Sect Multiplier | Effect |
|--------|----------------|---------------------|--------|
| Conjunction | +1x | +1.25x | Full pass-through, same polarity |
| Trine / Sextile | +0.5x | +0.625x | Attenuated, same polarity |
| Square | -0.5x | -0.625x | Attenuated, **inverted** polarity |
| Opposition | -1x | -1.25x | Full pass-through, **inverted** polarity |

Same-sect connections propagate at ×1.25 strength (§4a).
Cross-sect connections propagate at base strength.

Polarity inversion means affliction becomes testimony and testimony becomes affliction.
A planet that takes affliction heals its square and opposition partners; a planet that receives testimony afflicts them.
The magnitude depends on the aspect type and whether the connection is same-sect (see table above).

**Astrological basis for inversion.**
Squares are traditionally the aspect of accomplishment through difficulty — friction in one area produces growth in another.
Oppositions are polar by definition — two ends of an axis, rising and falling together.
Trines flow without transforming.
Conjunctions fuse — shared fate.

**Chart balance through playstyle.**
- **Conjunction-heavy** — shared fate. The inner cluster (Sun/Mercury/Venus are almost always conjunct) thrives or collapses together.
- **Trine-heavy** — stable and forgiving. Effects spread gently, nothing spikes. Low variance, low ceiling.
- **Square-heavy** — high skill ceiling. The player can sacrifice a planet to convert affliction into testimony for square partners. Harder to execute, genuinely more powerful when played well.
- **Opposition-heavy** — see-saw. Full inversion creates volatile swings. Maximum risk, maximum expressiveness.

A chart with many squares isn't weaker — it's harder to play and rewards mastery.

Sect amplifies these patterns unevenly.
A chart where most aspects fall within one sect team runs hot — stronger propagation, higher variance, more dramatic swings.
A chart with aspects split across sect lines runs cooler — base-strength propagation, more predictable, easier to manage.

**Propagation examples.**

*Same-sect square (sacrifice play):*
Mars (night sect) takes 6 affliction.
Moon (night sect) is square to Mars.
Propagation: 6 × -0.625x (same-sect square) = -3.75 → Moon receives 3.75 testimony.
Mars's suffering heals the Moon sharply — still the strongest version of the sacrifice play, but less extreme.

*Cross-sect square (attenuated sacrifice):*
Mars (night sect) takes 6 affliction.
Jupiter (day sect) is square to Mars.
Propagation: 6 × -0.5x (cross-sect square) = -3 → Jupiter receives 3 testimony.
Same geometry, half the payoff — sect determines the intensity.

---

## 4a. Sect (Aspect Propagation Amplifier)

**What it is.**
Sect divides the 7 planets into two teams — day and night — based on whether the chart is diurnal or nocturnal.
Same-sect aspect connections propagate at double strength.

**Sect teams.**

| Sect | Planets |
|------|---------|
| Day | Sun, Jupiter, Saturn |
| Night | Moon, Venus, Mars |

Mercury joins the chart's sect: day sect in a diurnal chart, night sect in a nocturnal chart.

A chart is **diurnal** if the Sun is above the horizon (houses 7–12 in whole sign), **nocturnal** if the Sun is below (houses 1–6).
Sect is determined at mint from the Sun's house position and is immutable.

**Astrological basis.**
Sect is one of the oldest and most fundamental concepts in Hellenistic astrology.
The day/night division governs which planets are "in favor" — a planet of the sect in favor operates with more support.
Traditional sect assignments follow from the planets' natures: the Sun leads the day team with the greater benefic (Jupiter) and the greater malefic tempered by light (Saturn); the Moon leads the night team with the lesser benefic (Venus) and the lesser malefic tempered by darkness (Mars).

**Role in gameplay.**
Sect amplifies same-team aspect propagation by ×1.25.
This creates intensity gradients within the chart — some connections run hot, others run cool.
The propagation table in §4 shows both base and same-sect multipliers.

**Mercury's flexibility.**
Mercury is the only planet whose sect depends on the chart.
In a diurnal chart, Mercury's connections to Sun, Jupiter, and Saturn propagate at double strength.
In a nocturnal chart, Mercury's connections to Moon, Venus, and Mars are doubled instead.
This makes Mercury the planet most affected by the day/night split — the trickster adapts to whichever team is in power.

---

## 5. Cross-Aspects (Chart Interaction)

**What it is.**
When two charts meet, cross-aspects are computed by checking all 49 planet pairs (7×7).
Each cross-aspect identifies which planets are connected and carries the sign relationship between them.

**Astrological basis.**
Synastry — comparing two charts — is a major branch of astrological practice.
Cross-aspects describe where two lives intersect.

**Role in gameplay.**
Cross-aspects define **encounter structure**: how many interaction points exist, which planets are involved, and the character of each interaction.
Encounters are shaped by the specific relationship between two charts — the same Prince has a completely different experience against different opponents.

---

## 6. Dignity (Planet Quality)

**What it is.**
Each planet receives a dignity rating based on its sign: Domicile, Exaltation, Neutral, Detriment, or Fall.
Most planets in a chart are Neutral.

**Astrological basis.**
The dignity system is two independent axes layered together.

*Domicile/detriment* comes from the Hellenistic rulership scheme — a symmetric assignment of planets to signs based on geocentric distance.
Detriment is the opposite sign from domicile.
The metaphor is jurisdictional: home territory vs. foreign territory.

*Exaltation/fall* is older, likely Babylonian.
Each planet has one sign of exaltation, assigned by tradition rather than geometry.
Fall is the opposite sign.
The metaphor is status: honored guest vs. humbled outsider.

**Role in gameplay.**
Dignity shapes **how a planet fails** — each dignity gives the combustion check a different curve (§11).
Dignity does not modify interaction resolution.
Mars in Aries (domicile) and Mars in Cancer (fall) deal and receive the same damage in the same matchup, but their relationship with combustion is qualitatively different.

**Balance.**
Any given planet has ~75% chance of being Neutral.
The expected chart has ~5 Neutral, ~1 dignified, ~1 debilitated.
Extreme concentrations are astronomically impossible because inner planets are tethered to the Sun, limiting which dignity combinations can co-occur.

**Design principle: texture, not hierarchy.**
Each dignity state is qualitatively different, not linearly ranked:

- **Domicile** — slow burn. Safe for a long time, then danger escalates sharply. Reliable until it cracks.
- **Exaltation** — clutch. Standard risk, but can survive one combustion that should have killed it. Rises to the occasion.
- **Neutral** — standard. Risk increases steadily with affliction.
- **Detriment** — unkillable. Combustion probability caps at 50%. No matter how battered, always has a fighting chance.
- **Fall** — fragile. Enters danger much sooner, but the curve flattens at high affliction. Lives permanently on the edge.

A chart with several debilitated planets isn't weaker — it's *weirder*.
A detriment planet is a meat shield that won't die.
A fall planet demands constant attention but creates tension every turn it survives.

---

## 7. Modality (Three Behavioral Modes)

**What it is.**
Every sign belongs to one of three modalities: Cardinal (initiation), Fixed (sustaining), Mutable (adaptation).

**Astrological basis.**
Modality reflects a sign's position within its season.
This is a Greek innovation layered onto the Babylonian zodiac.

**Role in gameplay.**
Modality has a dual role.
At **sheet time**, it provides a stat buff: Cardinal → +1 damage, Fixed → +1 durability, Mutable → +1 healing (§2).
At **interaction time**, it shapes **how effects move**:
- **Cardinal** planets boost **outgoing** effects by ×1.25.
- **Mutable** planets boost **incoming** effects by ×1.25.
- **Fixed** planets are neutral (×1).

Outgoing and incoming multipliers stack: effect = base × outgoing(sender) × incoming(receiver).
The distribution across a Prince's 7 planets shapes the chart's temperament: heavy Cardinal favors initiative; heavy Fixed favors endurance; heavy Mutable favors responsiveness (high upside, high exposure).

---

## 8. Element (Four Temperaments)

**What it is.**
Every sign belongs to one of four elements: Fire, Earth, Air, Water.
Each element appears in exactly 3 of the 12 signs (one per modality).

**Astrological basis.**
Retrofitted onto the zodiac during the Hellenistic period.
Elements underpin the trine structure — signs of the same element are always trine.

**Role in gameplay.**
Element has a dual role.
At **sheet time**, it provides a stat buff: Fire → +1 damage, Earth → +1 durability, Water → +1 healing, Air → +1 luck (§2).
At **interaction time**, polarity is determined by **qualities** (hot/cold, wet/dry), not by a simple element-opposition rule (§13a).
The elemental distribution across a chart reveals its temperamental balance.

---

## 9. Houses (Twelve Domains)

**What it is.**
The 12 houses divide the chart into domains of life, starting from the Ascendant sign.
In Whole Sign houses, each house is exactly one sign.
Categories: Angular (1, 4, 7, 10), Succedent (2, 5, 8, 11), Cadent (3, 6, 9, 12).

**Astrological basis.**
Houses are a Hellenistic innovation.
Where signs describe qualities and planets describe agents, houses describe arenas — where in life a planet operates.

**Role in gameplay.**
Houses provide **12 thematically distinct domains** with a natural prominence gradient (angular = high-stakes, cadent = hidden).
Each house's theme gives encounters built-in narrative meaning without authored story.

---

## 10. House Rulership (The Authority Web)

**What it is.**
Each house is ruled by the planet that rules its sign.
Different Princes have different rulership webs because the house-sign mapping depends on the Ascendant.
The chart ruler is the planet that rules the 1st house.

**Astrological basis.**
Rulership connects agents (planets) to domains (houses).
The chart ruler is the planet most identified with the person as a whole.

**Role in gameplay.**
Rulership creates a **web of stakes** — each planet cares about specific houses, making houses personal rather than generic.

---

## 11. Affliction and Combustion (Resource Model)

**What it is.**
The game's sole resource is **affliction** — a per-planet value representing how burdened each planet is.
A Prince's run state is 7 integers.
There is no separate HP, gold, energy, or inventory.

Affliction accumulates through interactions.
It can be relieved through positive interactions (**testimony**).
It can be transferred between planets through the aspect web.
When affliction overwhelms a planet, it becomes **combust** — silenced, unable to act.
A run ends when too many planets are combust.

**Astrological basis.**
*Affliction* is the standard term for a planet burdened by difficult aspects.
*Testimony* is the counterpart — planets support each other through favorable aspects.
*Combustion* is the most dramatic traditional condition: a planet overwhelmed to the point of losing its individual light.

**Combustion model: probabilistic.**
After each turn where a planet gains affliction, it makes a combustion check.
A planet's effective durability (base + sign buff) determines its **combustion threshold** T = effective durability × 10.
Dignity determines the **curve shape** — how probability rises as affliction approaches the threshold.

**Dignity combustion curves:**

| Dignity | Formula | Shape | Strategic feel |
|---------|---------|-------|---------------|
| Domicile | P = (A/T)² | Convex — safe early, spikes late | Deploy aggressively; danger is distant but sudden |
| Exaltation | P = A/T, one-time save | Linear with clutch | Standard risk, but survives one fatal check |
| Neutral | P = A/T | Linear | Steady, predictable; each point of affliction adds equal risk |
| Detriment | P = min(0.5, A/T) | Linear, capped at 50% | Never guaranteed to die; persistent, refuses to quit |
| Fall | P = √(A/T) | Concave — dangerous early, flattens late | Lives on the edge; immediate danger but hard to finish off |

Where A = total affliction, T = effective durability × 10.

**Example combustion probabilities at half-threshold (A = T/2):**
- Domicile: (0.5)² = **25%**
- Exaltation: 0.5 = **50%** (but has a save)
- Neutral: 0.5 = **50%**
- Detriment: min(0.5, 0.5) = **50%** (but can never exceed this)
- Fall: √0.5 = **71%**

**Example: Moon (dur 1, threshold 10) at affliction 3:**
- Domicile: (3/10)² = 9%
- Neutral: 3/10 = 30%
- Fall: √(3/10) = 55%

This avoids the threshold problem where a planet at 9/10 and 1/10 are treated as functionally equivalent.
Every interaction has stakes once affliction is non-trivial.
Each dignity creates a qualitatively different strategic experience — domicile rewards aggression, detriment enables attrition, fall demands careful management.

---

## 12. Metaprogression (Chart Revelation)

**What it is.**
The chart's full structure exists at mint, but the player's access to it deepens over time across three layers: planetary appearance, aspect activation, and house illumination.
Nothing is added — what was always there is revealed.

**Astrological basis.**
*Phasis* — a planet's first visible emergence from the Sun's light — was a major event in Hellenistic astrology.
*Perfection* — an aspect completing its formation — brings its significations to fruition.
A chart's potential is present from birth; it takes a lifetime to express.

**The three layers:**

1. **Planetary appearance.** Not all 7 planets are available at mint. Planets emerge as the player accumulates total encounters (across all runs — death still advances progress). Unlock order follows planetary speed, with exponentially increasing cost:

   | Planet | Cost | Cumulative | Encounter length |
   |--------|------|------------|-----------------|
   | Moon | 0 (start) | 0 | 1 |
   | Mercury | 1 | 1 | 2 |
   | Venus | 2 | 3 | 3 |
   | Sun | 4 | 7 | 4 |
   | Mars | 8 | 15 | 5 |
   | Jupiter | 16 | 31 | 6 |
   | Saturn | 32 | 63 | 7 |

   The first encounter is a tutorial — Moon is the only option, the player observes how sign relationships work. Mercury unlocks immediately after, and the second encounter introduces real choice. Strategy deepens with each new planet. Saturn, the planet of patience and time, is unlocked by investing time — thematically exact.

2. **Aspect activation.** The 21 potential aspects start latent. Through play involving both planets in a pair, aspects activate and their propagation effects come online. The chart evolves from isolated planets to an interconnected web.

3. **House illumination.** Houses start undifferentiated. Through encounters, they gain their thematic identity — shaped by their category, theme, and ruling planet. The full twelve-domain structure emerges over many runs.

**NFT visual arc.**
The Prince NFT mirrors this progression:
- Early: a few bright points on a dark field
- Mid: aspect lines appear, connecting planets into visible internal geometry
- Late: the full wheel — planets, aspects, and houses — each carrying its history

**Capstone: Planetary Joy.**
Each planet has a traditional house where it rejoices (Moon in 3rd, Mercury in 1st, Venus in 5th, Sun in 9th, Mars in 6th, Jupiter in 11th, Saturn in 12th).
When both a planet and its joy-house are active, a special interaction unlocks — a reward for deep play, not a power boost.

---

## 13. Encounters (Planet Selection as Action)

**What it is.**
An encounter presents a sequence of opponent planets, one per turn.
Each turn, the player chooses which of their 7 planets to respond with.
The element matchup determines polarity (testimony, affliction, or friction), modality scales outgoing/incoming effects, and effective stats determine magnitude (§13a).
Dignity shapes the combustion curve, not the interaction itself (§11).
Planet selection is the only action.
Everything else emerges from chart structure.

**The decision space.**
Each turn, the player weighs:
- **Matchup** — which of my planets has a favorable element and modality against this opponent? Can I find a same-element pairing for testimony, or a cardinal sender into a mutable receiver?
- **Affliction risk** — is my best planet already heavily afflicted? Is it worth the combustion risk, or should I spread the load?
- **Propagation** — this planet's aspect web fires after resolution. Will the outcome invert helpfully through squares, or compound through conjunctions? Are the targets same-sect (double strength) or cross-sect?
- **Conservation** — this is a friction matchup, low stakes. Should I send whoever needs healing rather than waste a strong planet on a predictable turn?

**Reuse and accumulation.**
Planets can be reused across turns within an encounter.
The cost of reuse is concentrated affliction — the combustion model makes repeated deployment increasingly dangerous.
The player chooses between spreading affliction thin (many planets, moderate risk each) or concentrating it (few planets, escalating risk).

**Interaction resolution.**
Resolution uses element polarity, luck, modality (outgoing/incoming), and stat magnitude.
See the full resolution section below (§13a).

**Encounter structure.**
Encounter length equals the number of unlocked planets — 1-2 turns early, 7 turns at full progression.
This tutorializes naturally (short encounters while learning) and keeps gas costs predictable.

Each turn, an opponent planet is drawn from a **weighted pool**.
Each opponent planet's weight = N, the number of major sign relationships it has with the player's planets.
Planets with more "business" with the player's chart appear more often.
Only major aspects count (conjunction, sextile, square, trine, opposition); minor aspects (semi-sextile, inconjunct) are excluded.

The total cross-aspect density (sum of all N) shapes the encounter's texture — which opponent planets dominate — while encounter length stays fixed and predictable.

**Emergent difficulty.**
The opponent doesn't need an AI or action system — its planets are simply *present*, and their natures determine the interaction.
An opponent with malefics in strong dignities is naturally harder than one with benefics in fall.
Difficulty scales by generating opponent charts with different compositions.

---

## 13a. Interaction Resolution (Full Model)

**Element** determines polarity (what happens), via qualities.
**Luck** determines crit chance (doubles output).
**Modality** scales outgoing/incoming effects.
**Stats** determine magnitude.
**Affliction** degrades all stats toward zero.
**Dignity** shapes the combustion curve (§11), not the interaction itself.

### Element (determines polarity via qualities)

Each element is defined by two qualities:
- **Fire:** hot + dry
- **Air:** hot + wet
- **Water:** cold + wet
- **Earth:** cold + dry

The matchup between two planets' qualities determines what happens: testimony, affliction, or friction.

| Matchup | Result | Pairs |
|---------|--------|-------|
| Share both qualities (same element) | **Testimony** (both heal) | fire-fire, earth-earth, air-air, water-water |
| Share one quality (adjacent elements) | **Friction** (half-magnitude affliction) | fire-air (hot), fire-earth (dry), air-water (wet), earth-water (cold) |
| Share no qualities (opposites) | **Affliction** (both hurt) | fire-water, earth-air |

### Luck (crit chance)

Before resolution, each planet rolls for a critical hit.
Probability = effective luck × 8%, capped at 40%.
On crit, that planet's output (damage or healing) is doubled.

Mercury in Libra (luck 5) has a 40% crit chance — the trickster wins through volatility, not raw power.
Mars in Aries (luck 1) has an 8% crit chance — brute force, not tricks.

### Modality (scales outgoing/incoming)

Modality determines how strongly a planet **sends** and **receives** effects.

**Outgoing multiplier (sender):**
- Cardinal: ×1.25
- Fixed: ×1
- Mutable: ×1

**Incoming multiplier (receiver):**
- Mutable: ×1.25
- Fixed: ×1
- Cardinal: ×1

Outgoing and incoming multipliers stack: effect = base × outgoing(sender) × incoming(receiver).

### Stats Determine Magnitude

- **Affliction:** each planet deals effective damage × outgoing × incoming × crit
- **Testimony:** each planet heals effective healing × outgoing × incoming × crit
- **Friction:** each planet deals effective damage × 0.5 × outgoing × incoming × crit

### Affliction Degrades Stats

Affliction isn't just a death counter — it reduces planet effectiveness.
All four stats scale down as affliction rises.
A planet at 0 affliction operates at full strength.
A planet at high affliction is mechanically diminished — dealing less, healing less, less durable, less lucky.

**Model:** effective_stat = max(0, (base_stat + sign_buff) × (1 − affliction / 10))

At affliction = 5, a planet operates at half strength.
At affliction = 9, a planet is nearly useless.
A planet can survive beyond 10 affliction if its durability threshold is high enough, but it contributes nothing.

This means:
- Testimony doesn't just prevent death — it **restores combat power**
- A heavily afflicted Mars (effective damage: 1) is worse than a healthy Mercury (effective damage: 2)
- The player must decide: heal a specialist back to full, or work with degraded stats?

### Full Resolution Flow

1. **Element matchup** (qualities) → testimony, affliction, or friction
2. **Luck** → each side rolls: effective luck × 8% chance to crit (double output)
3. **Modality** → outgoing × incoming
4. **Magnitude** — effective damage × outgoing × incoming × crit (for affliction); ×0.5 for friction; effective healing × outgoing × incoming × crit (for testimony)
5. **Apply** to both planets' affliction totals (add for affliction/friction, subtract for testimony)
6. **Combustion check** — for any planet that gained affliction: use dignity curve (§11)
7. **Propagate** through active planet's internal aspect web (one hop, §4 polarity inversion model, §4a sect amplification)

Both sides resolve simultaneously.
In an affliction or friction matchup, both planets deal damage.
In a testimony matchup, both planets heal the other.

### Worked Examples

**Example 1 — Affliction (fire vs water, both domicile).**
Mars in Aries (Dmg 6, Luck 1, cardinal, domicile, 0 affliction) vs Moon in Cancer (Dmg 2, Luck 2, cardinal, domicile, 0 affliction).

1. **Element:** Fire vs Water (opposites) → **affliction**
2. **Luck:** Mars 8% — no crit. Moon 16% — no crit.
3. **Modality:** Mars outgoing ×1.25, Moon incoming ×1. **Moon outgoing ×1.25, Mars incoming ×1.**
4. **Mars deals:** 6 × 1.25 = 7.5 → 8. **Moon deals:** 2 × 1.25 = 2.5 → 3.
5. Mars at 3 affliction. Moon at 8 affliction.
6. **Combustion:** Mars (domicile): (3/20)² = 2%. Moon (domicile): (8/10)² = 64%.

Mars's raw damage is devastating.
Moon at 8 affliction would be 80% on a neutral curve, but domicile's squared curve gives 64% — still dangerous, but the curve bought a thin chance of breathing room.
The player should heal Moon immediately or risk losing their best healer.

**Example 2 — Testimony with mutable receptivity.**
Venus in Taurus (Heal 4, Luck 3, fixed, domicile, 3 affliction) vs Jupiter in Virgo (Heal 4, Luck 3, mutable, detriment, 0 affliction).

1. **Element:** Earth vs Earth (same element) → **testimony**
2. **Luck:** Venus 24% — no crit. Jupiter 24% — no crit.
3. **Modality:** Venus outgoing ×1, Jupiter incoming ×1.25. Jupiter outgoing ×1, Venus incoming ×1.
4. **Venus heals:** 4 × 0.7 (degraded) × 1.25 = 3.5 → 4. **Jupiter heals:** 4 × 1 = 4.
5. Venus receives 4 testimony (affliction 3 → 0). Jupiter receives 4 testimony.

Jupiter's mutable receptivity (×1.25 incoming) amplifies Venus's testimony.
Modality matters in healing: a mutable target receives more, while a fixed target stays steady.

**Example 3 — Friction (half-magnitude affliction).**
Sun in Leo (Dmg 4, Luck 2, fixed, domicile, 2 affliction) vs Saturn in Aquarius (Dmg 2, Luck 2, fixed, domicile, 0 affliction).

1. **Element:** Fire vs Air (share hot) → **friction**
2. **Luck:** Sun 16% — no crit. Saturn 16% — no crit.
3. **Modality:** both fixed → outgoing ×1, incoming ×1
4. **Sun deals:** effective dmg 4 × 0.8 (degraded) × 0.5 (friction) = 1.6 → 2. **Saturn deals:** 2 × 0.5 = 1.
5. Sun at 3 affliction, Saturn at 1.
6. **Combustion:** Sun (domicile): (3/40)² = 0.6%. Saturn (domicile): (1/50)² ≈ 0%.

Friction is lower stakes but not flat — Sun's higher damage still makes a difference.
Both domicile planets are nowhere near combustion danger.

**Example 4 — Mercury crits (the trickster strikes).**
Mercury in Libra (Dmg 3, Luck 5, cardinal, neutral, 0 affliction) vs Mars in Capricorn (Dmg 5, Luck 1, cardinal, exaltation, 0 affliction).

1. **Element:** Air vs Earth (opposites) → **affliction**
2. **Luck:** Mercury 40% — **CRIT!** Mars 8% — no crit.
3. **Modality:** Mercury outgoing ×1.25, Mars incoming ×1. **Mars outgoing ×1.25, Mercury incoming ×1.**
4. **Mercury deals:** 3 × 2 (crit) × 1.25 = 7.5 → 8. **Mars deals:** 5 × 1.25 = 6.25 → 6.
5. Mercury at 6 affliction. Mars at 8 affliction.
6. **Combustion:** Mercury (neutral): 6/20 = 30%. Mars (exaltation): 8/30 ≈ 27% — but has a one-time save.

Mercury's crit turns a losing matchup around — dealing 8 instead of 4.
Mars takes 8, but exaltation's clutch save means even if the 27% triggers, Mars gets a reprieve.
Next time Mars won't be so lucky — the save is spent.

**Example 5 — Degraded stats, dignity curves compared.**
Mars in Aries (Dmg 6, Luck 1, cardinal, domicile, 8 affliction) vs Moon in Scorpio (Dmg 1, Luck 2, fixed, fall, 0 affliction).

Moon in Scorpio: base Dur 1 + Scorpio (+1 dur) = Dur 2, threshold 20.

1. **Element:** Fire vs Water (opposites) → **affliction**
2. **Luck:** Mars 8% × 0.2 (degraded) = 1.6% — no crit. Moon 16% — no crit.
3. **Modality:** Mars outgoing ×1.25, Moon incoming ×1. **Moon outgoing ×1, Mars incoming ×1.**
4. **Mars deals:** 6 × 0.2 (degraded) × 1.25 = 1.5 → 2. **Moon deals:** 1 × 1 = 1.
5. Mars at 9 affliction. Moon at 2 affliction.
6. **Combustion:** Mars (domicile): (9/20)² = 20%. Moon (fall): √(2/20) ≈ 32%.

Mars at 9 affliction has cratered to effective damage 1, but domicile's squared curve gives only 20% combustion — on a neutral curve that would be 45%.
Moon took just 2 affliction but fall's steep curve makes even that a 32% risk — a neutral planet would be at 10%.
Dignity doesn't change the damage — it changes how each planet *handles* the damage.

---

## Structural Summary

| Mechanism | Astrological source | Gameplay role |
|-----------|-------------------|---------------|
| Chart | Natal chart | Unique, immutable character identity |
| Planets | 7 classical planets | Units of action with base stats modified by sign buffs (element + modality) |
| Sign relationships | Zodiac geometry | Internal propagation (§4) and encounter weighting (§13) |
| Aspects | Planet-to-planet angles | Internal propagation with polarity inversion |
| Sect | Day/night division | Same-sect aspect propagation ×1.25 |
| Cross-aspects | Synastry | Encounter structure between two charts |
| Dignity | Planet-sign evaluation | Combustion curve shape — each dignity has a different relationship with danger |
| Modality | Seasonal position | Sheet-time stat buff (+1 secondary stat), interaction-time outgoing/incoming scaling, chart temperament |
| Element | Temperamental quality | Sheet-time stat buff (+1 primary stat) and encounter polarity |
| Luck | — (game mechanic) | Crit chance — each point = 8% chance to double output (cap 40%) |
| Houses | Life domains | Thematic structure for encounters and progression |
| Rulership | Planet-house authority | Web of stakes connecting agents to domains |
| Affliction | Planetary condition | Sole resource — accumulates, degrades stats, relieves through testimony |
| Combustion | Combustion (traditional) | Planet failure state — probabilistic, curve shaped by dignity |
| Metaprogression | Phasis, perfection, joy | Chart revelation across runs — planets, aspects, houses |
| Encounters | Synastry sequence | Planet selection as sole action; resolution via element polarity, luck, modality scaling, stat magnitude |

---

## Open Questions

- **Luck tuning** — is 8% per point (cap 40%) the right crit rate? Should crit apply to friction?
- **Degradation zombie problem** — a high-durability planet (Saturn, threshold 60) can survive well past affliction 10, where all stats are 0. Is a living-but-useless planet interesting (meat shield) or degenerate?
- **Information visibility** — does the player see the opponent's weight distribution, the next planet, or only the current one?
- **Win/loss conditions** — how many combust planets end a run?
- **Between-encounter mechanics** — what happens between encounters? How does the player manage affliction, and what role do houses play?
- **Progression pacing** — how many runs to reveal each layer? What triggers planetary appearance vs. aspect activation vs. house illumination?
- **Opponent generation** — how are opponent charts created or selected? How does difficulty scale?
