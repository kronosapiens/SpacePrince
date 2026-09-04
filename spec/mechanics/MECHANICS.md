# Space Prince — Mechanics

The source of truth for the game's mechanics. Where an older design doc conflicts, this wins.

**Number model — the sexagesimal lattice.** The mechanics use the arithmetic of their source material: the 360° circle.
Every quantity the game divides lives on a lattice its divisions cannot break, so all values are whole numbers — no rounding anywhere.
Effective stats are multiples of `12` — the smallest number every aspect fraction (§9) divides — so halves, thirds, quarters, and sixths of any stat are integers.
Combustion ceilings are multiples of `60` (§10).
Probabilities are stated in sixtieths (§7); percentages appear only as glosses.
Lattice membership is an invariant: never introduce a buff, multiplier, or knob that steps off it.
Exempt from the lattice: the planet-unlock schedule (`2^i` — temporal pacing, not an operand), the seven planets themselves, and economy numbers (Distance totals, rite prices) — sums and payments, never divided.
Affliction accumulates toward a deterministic combustion at a ceiling set by durability, and is capped there — a combusted planet holds `ceiling`, never more.

## 1. Entities

- Planets: `Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn`
- Signs: 12 zodiac signs.
- Each planet placement stores:
  - `sign`
  - `element`
  - `modality`
  - `dignity`
  - `base` stats
  - `buffs` stats

## 2. Roles and Base Stats

Each planet has a gameplay role — a stat profile that matches its astrological archetype (see `spec/concept/PLANETS.md`).
The role is the player's first read on the planet; the stats are the role's mechanical expression.
The short display label per planet (e.g., "the warrior") lives in `client/src/game/data.ts` as `PLANET_ROLE`.

- **Sun** — balanced presence in every stat; the centered self.
- **Moon** — top witness, fragile elsewhere; the reflective interior.
- **Mercury** — top luck, average elsewhere; paradox, the turn.
- **Venus** — strong witness and luck; beauty, relation, the sensed world.
- **Mars** — top impact, brittle elsewhere; the decisive cut.
- **Jupiter** — balanced and generous across all stats; expansion, gift.
- **Saturn** — top durability, slow elsewhere; limit, time, endurance.

Base stats per planet, multiples of `12` on a `12–48` scale:

| Planet  | Impact | Witness | Durability | Luck | Total |
|---------|-------:|--------:|-----------:|-----:|------:|
| Sun     |     36 |      24 |         36 |   24 |   120 |
| Moon    |     12 |      48 |         12 |   24 |    96 |
| Mercury |     24 |      24 |         24 |   48 |   120 |
| Venus   |     12 |      48 |         24 |   36 |   120 |
| Mars    |     48 |      12 |         24 |   12 |    96 |
| Jupiter |     24 |      36 |         36 |   36 |   132 |
| Saturn  |     24 |      12 |         48 |   12 |    96 |

Base values are multiples of `12` and buffs (§4) add `+12`, so every effective stat stays on the 12-lattice — every aspect fraction (§9) of every magnitude is an integer.

**Balance (open).** Stat totals are not equalized: generalists (Jupiter, Sun, Mercury, Venus; ~120–132) carry a higher total at a lower peak, specialists (Mars, Moon, Saturn; 96) a higher single-stat peak (`48`) at a lower total. No planet tops both `impact` and `witness`, and none is strictly dominated by another, so neither a dominant nor a dead pick results — but whether to equalize the totals or tier them deliberately (e.g. along the benefic/malefic ladder) is left to playtest.

## 3. Chart Generation

Every chart — player or opponent — comes from one generator: real ephemeris positions for a birth moment and place, via `astronomy-engine` (`client/src/astronomy/compute.ts`). There are no fabricated skies.

- **Player** Princes use the player's real birth data: ISO datetime, latitude, longitude.
- **Opponent, dev, and preview** charts (`seededChart`) use a deterministic-random birth — a seeded moment over ~200 years and a random place — so they are reproducible from the seed yet astronomically real.

For a given moment and place it computes:

- apparent **geocentric** ecliptic longitude per planet, in the tropical zodiac (ecliptic of date) — the frame astrology uses, so Mercury stays within `±28°` of the Sun and Venus within `±47°`
- Ascendant from local sidereal time and the obliquity of date
- sect (`isDiurnal`) from whether the Sun is above the horizon at birth

Sign, dignity, element/modality, and buffs derive from longitude the same way regardless of source (sign = `floor(longitude / 30)`).

## 4. Stat Buffs

Buffs are additive at generation, always in `+12` steps, so effective stats stay on the 12-lattice.
A planet's effective stat is base + buffs — the value used in combat.

Element — each element buffs the one stat it expresses:

| Element | Impact | Witness | Durability | Luck |
|---------|:------:|:-------:|:----------:|:----:|
| Fire    |  +12   |         |            |      |
| Water   |        |  +12    |            |      |
| Earth   |        |         |    +12     |      |
| Air     |        |         |            | +12  |

Modality — three of the four stats; modality does not touch luck:

| Modality | Impact | Witness | Durability | Luck |
|----------|:------:|:-------:|:----------:|:----:|
| Cardinal |  +12   |         |            |      |
| Mutable  |        |  +12    |            |      |
| Fixed    |        |         |    +12     |      |

Sect — a conditional `+12 luck`, the companion to Air.
A planet gains it when its sect matches the chart's.
Chart sect is `Day` when the birth is diurnal, else `Night`; sect changes nothing but luck.

| Sect  | Planets              |
|-------|----------------------|
| Day   | Sun, Jupiter, Saturn |
| Night | Moon, Venus, Mars    |

Mercury has no fixed sect — it takes `Day` or `Night` from its solar phase (ecliptic longitude relative to the Sun), then matches the chart the same way.

## 5. Action and Valence

Each turn, both sides commit one planet to one of two actions.

- **Afflict** — uses the planet's `impact` stat.
- **Testify** — uses the planet's `witness` stat.

Action is set per side:

- **Player side:** explictly chosen.
  Selecting a planet fans out the two actions; the player picks one.
- **Opponent side:** randomly drawn and precommitted.
  The verb is a stat-weighted random draw — `P(afflict) = impact / (impact + witness)`, `P(testify) = 1 - P(afflict)`.
  It is locked at turn start and surfaced to the player — alongside the already-revealed opponent planet — before the player chooses, so the player always acts with full information.

## 6. Direct Resolution

Resolution is **sequential**, in two phases — the intent → act → response rhythm of Slay the Spire rather than the simultaneous trade of FTL (`spec/concept/INFLUENCES.md`):

1. **Your action → the opponent's chart.** Your acting planet's effect lands on the opponent's active planet and propagates through their web (§9); combustion is resolved there.
2. **The opponent's action → your chart.** Read *after* phase 1 — so a planet you combusted in phase 1 outputs nothing; its phase-2 response is **preempted**.

The opponent's verb is precommitted (§5), so you choose with full information and you always act first. This is the core tactical lever: afflict a threatening opponent planet hard enough to combust it before it swings. Preemption only fires on combustion — a planet hits at full stat until it goes — so it is a finisher, not a guaranteed negate. Conversely, letting a *testifying* opponent planet resolve is free relief — longevity, not Distance (§12) — that combusting it would deny.

Base amount is the stat for the action:

- `Afflict`: `impact`
- `Testify`: `witness`

Raw direct amount:

- `raw = baseStat` — no multipliers; there are no crits (§7)

Magnitude is the planet's own stat; sect and element/modality buffs (§4) are the only sources of contextual strength.

## 7. Randomness

Randomness never decides how a committed action resolves; it only decides what is revealed next.

When the player commits an action, its full outcome — affliction, testimony, propagation, combustion, Distance — is computable from state the client already holds. The client renders the resolution immediately; the transaction confirms the same result behind the animation. There are no crits and no hidden rolls: anything derivable before commitment is shown (client honesty, `SCREENS.md` §1.1), and anything not derivable is genuinely unknown to everyone — including the contract — until the transaction lands.

Fresh randomness enters only where the game is already pausing to reveal something new, and every reveal rides a transaction the player is already waiting on:

- **Map creation.** The map seed is a VRF draw; from it derive node content (`MAP.md`) and, on rollover, the map-boundary uncombust rolls and barrage (§11.3) — all settled and fully displayed before the first node is entered.
- **Turn boundaries.** The transaction that resolves turn N also draws the opponent's next precommit — planet and verb (§5). By the time the resolution animation finishes, the next move has landed. Combat's randomness is not knowing what comes next — never not knowing what your committed action will do.
- **Wagers.** A narrative wager's outcome is rolled by the transaction that commits it; the wait is the reveal. The odds are always displayed before commitment: the fortune roll on the conditioning planet's luck.

Luck is therefore not a combat stat.
Impact, witness, and durability decide what a planet does inside an encounter; luck decides how fate treats it — wager odds, uncombust rolls, and the barrage.
The **fortune roll**, `luck / 120` — in sixtieths, `(luck/2) / 60` (10–60% at effective luck 12–72) — is the *only* formula fate is ever consulted through: a narrative wager's odds, the chance a combusted planet uncombusts, and the chance a lit planet's barrage share is halved (§11.3).
One roll, one name: the UI surfaces it as `Fortune`, and a planet's displayed Fortune is its odds wherever fate is asked.

*Rejected:* a separate wager curve, `min(45, 20 + luck/2) / 60` — a `20/60` (⅓) floor rising to a `45/60` (¾) cap.
It gave wagers a gentler spread and kept a low-luck wager from being hopeless, but it made `Fortune` name two different numbers: the panel would read `12/60` on a planet whose wager showed `32/60`.
The floor is the part worth missing — if low-luck wagers read as traps in playtest, restore the idea as a floor on the fortune roll itself rather than a second curve.

## 8. Affliction Value Model

Affliction is integer-valued — every direct and propagated effect is a whole number.

- direct and propagated effects apply their full amounts
- testimony clamps affliction at zero

## 9. Aspects and Propagation

The four aspects carry **circle-fraction** multipliers — each aspect's share of the 360° circle; hard aspects invert.
The conjunction stands apart — union, not aspect:

- Conjunction (0°): `+1` — co-presence; full conduction
- Sextile (60°): `+1/6`
- Square (90°): `-1/4`
- Trine (120°): `+1/3`
- Opposition (180°): `-1/2`

An aspect is a transmission across distance — *aspectus*, beholding — so the multiplier is readable off the chart itself: the wider the arc, the stronger the effect; soft aspects transmit, hard aspects invert.
The conjunction is classically not an aspect but **co-presence** (`ASTROLOGY.md`): planets in one sign do not behold each other across the circle — they share a place, so a blow that lands on one lands on the household.
Its `+1` is the absence of transmission, not its maximum; "wider arc, stronger effect" governs the four aspects, and the conjunction sits outside it.
The angle→effect mapping is piecewise by design: separations of 30° and 150° transmit nothing — signs that cannot see each other are in **aversion**.
This preserves the traditional strength ordering — trine over sextile, opposition over square, the conjunction most powerful of all.
Rejected: flat multipliers (`±0.5`, `−1`) — they left sextile and trine mechanically identical and contradicted the tradition's aspect hierarchy.
Rejected: strict monotonicity in arc (conjunction on the same rule) — it would rank same-sign planets weakest, inverting the tradition and draining the intensity a same-sign cluster should carry.

Rules:

- one-hop propagation from active source to connected targets
- magnitude: `abs(directAmount * aspectMultiplier)` — exact, since every denominator divides every effective stat (§2)
- negative multipliers invert the valence (`Affliction <-> Testimony`)
- propagation applies the same integer effect model as direct effects
- combusted targets are skipped
- unfielded targets are skipped — only the roster conducts (§11.1)
- combustion resolves before propagation: if the blow combusts the planet it lands on, that planet conducts nothing onward — propagation is short-circuited, not computed then negated

## 10. Combustion

Each planet takes **at most one** affliction application per turn — the direct blow if it is the acting planet, otherwise a single propagated ripple if aspected to it. Combustion is checked once, at that application, and only for affliction.

Affliction accumulates toward a **combustion ceiling** set by durability alone. A planet combusts **the moment its affliction reaches the ceiling** — deterministic, no roll:

- `ceiling = durability * 5` (durability = core + sign buffs, per §4; durability is a multiple of 12, so ceilings are multiples of 60 — every division the game takes lands on integers, and the maximum ceiling, a fixed earth-sign Saturn, is `360`: the full circle)
- combust when `affliction >= ceiling`

Ceilings read directly as how much affliction a planet absorbs before it goes out — durable planets soak many blows; fragile ones fold in a few. Affliction **below** the ceiling is a recoverable margin: a planet never combusts from a hit that leaves it under the line, and resolving affliction back down restores the full margin. Combustion is planned for, not gambled on — the player can read how many more blows a planet has in it.

Affliction is **capped at the ceiling** — a combusted planet holds `affliction = ceiling`, never more. Within encounters, combustion is terminal: a combusted planet is zero-output, takes no further affliction, receives no testimony, and is skipped by propagation. Testimony defends the margin; it never resurrects.

The cap makes combustion **derived state**: a planet is combusted exactly when `affliction >= ceiling`, so no combust flag is stored anywhere (`STATE.md`) — affliction is the whole per-planet state.

A combusted planet returns only by **uncombusting**, and uncombusting never happens in combat.
Two processes exist: the map-boundary fortune roll (§11.3) and the narrative uncombust rites (`HOUSES.md`).
Both return the planet at `affliction = ceiling / 2` — back, but scarred, with half its margin already spent.
Combustion is tuned to be **frequent and recoverable** — a tide, not a rare catastrophe: at `durability × 5` a mid-durability planet falls to a few committed blows, and recovery capacity is sized to match.
Content target: roughly a third to a half of narrative encounters offer an uncombust rite, alongside the boundary rolls.
Combustion scores only under Saturn's rule (§12); under every other ruler, combusting an opponent planet is a trade: denying its swing against forfeiting the harvest banked on it.

**Dignity is not a combat input.** Essential dignity (a planet's strength by sign — domicile, exaltation, detriment, fall) is reserved for the **house-encounter** system (`HOUSES.md`), where a planet's competence in its sign is expressed narratively rather than as a stat nudge. The chart still computes each planet's dignity; combat simply does not read it.

## 11. Encounter / Map / Run Flow

The game's progression is layered:

- **Encounter** — one node traversal (combat or narrative). Combat resolves in a fixed number of turns **equal to the map number** — 1 turn on map 1, up to 7 turns on map 7 (§11.1); narrative encounters are short decision trees (`HOUSES.md`).
- **Map** — one Sephirot-tree (per `MAP.md`). The player walks a path from L1 to L7, traversing one encounter per layer (typically 7 encounters per map).
- **Run** — **up to seven maps.** After completing a map, the next is generated and begun. The structure is similar to FTL's sectors.
- **Run end** — a run ends on whichever comes first: **full combustion** (all seven of the player's planets combust) or **completion** (the seventh map is finished). Combustion is early failure — dying before the final boss, in Slay the Spire / FTL terms; completion is the full passage. Either way, the run's **final Distance (§12)** is its permanent record, inscribed as a star in the NFT field (`NFT.md`).

Per encounter:

- Every combat encounter has a **ruler** — the planet ruling the opponent chart's Ascendant (`RULERSHIP`, `CHART.md`).
  It is derived from the chart, never stored, and one planet drives three surfaces: the node's colour on the map, the combat theme (`MUSIC.md`), and the encounter's scoring rule (§12).
  Narrative encounters carry their house's natural ruler the same way (`HOUSES.md`).
- The opponent spawns **already afflicted** — under the Moon's rule only resolution scores (§12), so the tension must predate the player for a short fight to have anything to resolve; a 1-turn map-1 fight is pure harvest.
  Each fielded planet draws uniformly from three tiers — `12`, `24`, `36` — deterministically from the node's opponent seed.
  The tiers are **absolute, not a fraction of the ceiling** — the spawn pool is a harvest quantity, not a durability one, so a fragile Moon and a durable Saturn bank the same tribute.
  They are sized at roughly one planet's testimony: enough that a map-1 turn is never wasted, not enough to live on — a seven-planet pool of about `168` drains a few turns into a long encounter, after which the build beat of the two-beat (§12) is necessary rather than optional.
  Three tiers rather than a continuous band, so the spawn state reads off the affliction arc (1 point = 1°) as a legible tier rather than an arbitrary number.
  The floor of `12` keeps every planet worth testifying; `36` sits below the smallest ceiling (`60`, at durability `12`), so no planet spawns combusted — structurally, without a clamp.
  Rejected: a uniform draw from `0` to `ceiling − 1` — it banked roughly `510` across a full roster, more than seven turns of testimony can drain, so testify-always dominated and afflict-to-set-up stayed optional; and its floor of `0` let a map-1 opponent spawn nearly clean, making the run's single first turn score almost nothing.
- Opponent planet is drawn randomly each turn from its non-combusted **fielded** planets (the roster mirrors the player's unlock tier, §11.1). The draw for turn N+1 happens at turn N's resolution — encounter arrival draws the first — so the reveal rides a transaction already in flight (§7).
- The opponent's action verb is drawn stat-weighted and precommitted at the same time (§5).
- If all fielded opponent planets combust before the final turn, the encounter ends early.
- Encounter advances manually via `Continue` after completion.

Affliction and combust state **persist across encounters and across maps within a run**. Crossing a map boundary passes them through the uncombust rolls and barrage (§11.3). They reset only on run end.

### 11.1 Planet Unlock Schedule

A Prince's chart is fixed at mint, but planets are unlocked progressively as a **function of cumulative encounter count** across the player's lifetime — not per run. The unlock order follows the **Macrobian ascent** (the Hellenistic ordering of the soul's ascent through the planetary spheres, Earth outward). The Moon is present from the first encounter; each subsequent planet unlocks at a cumulative count of `2^i` for `i = 0..5`:

| Cumulative encounters | Unlock | Total planets |
|-----|--------|---------------|
| 0 (start) | Moon | 1 |
| 1 | Mercury | 2 |
| 2 | Venus | 3 |
| 4 | Sun | 4 |
| 8 | Mars | 5 |
| 16 | Jupiter | 6 |
| 32 | Saturn | 7 |

The first 32 encounters are effectively a tutorial — the chart fills in at exponentially spaced intervals, and the player's mechanical and symbolic literacy grow alongside the chart. Saturn arrives last as the final teacher.

**Encounter length and the mirrored opponent.** Combat length is the **map number**: 1 turn on map 1, 2 on map 2, up to 7 on map 7.
Difficulty therefore ramps on two axes.
The opponent's *roster* mirrors the player's unlock tier — Moon vs Moon at the first encounter, up to a full seven-vs-seven — so the challenge grows with the player's own chart rather than throwing a seven-planet opponent at a single-planet newcomer.
Encounter *length* rides the run instead: skirmishes while the chart is clean, full arcs on late maps, where the barrage (§11.3) has already raised the stakes before the first node is entered.
The length ramp is also a curriculum for the two-beat (§12): map 1 teaches cashing spawn affliction, map 2 is the minimal build-then-cash cycle, and later maps open real sequencing.
On a first run the unlock schedule and the map number rise roughly together, so the two ramps stay aligned; for a veteran at full roster, length reads purely as stakes.
Both sides may send the same planet on more than one turn, so a one-planet player still plays every turn with the Moon alone.
Only fielded planets conduct: propagation (§9) ripples through the roster's aspect web alone, so an unfielded planet takes nothing, passes nothing on, and scores nothing — the web the game resolves is the web the chart draws.
Rejected: fixed 3-turn encounters — the final turn made afflict-for-setup dead and the spawn pool was too deep to drain in three turns, so the first and last turns were near-forced and the build beat never became necessary; and three random draws could meet at most three planets of a seven-planet roster.

Each unlock happens **between encounters**, on the Map screen — when the player surfaces back from a completed encounter and sees their chart anchor (per `SCREENS.md §4.1`), the new planet appears in its computed sign with a small ceremony.

A planet enters the **combat-encounter ruler rotation** when it unlocks.
Before that threshold, no combat encounter may be ruled by it; narrative encounters keep their house-derived rulers independently.
Each map samples its combat rulers from the unlock tier present when that map is created, so its revealed nodes remain fixed even if another planet unlocks during the map.
The client prototype enforces this with deterministic rejection sampling: it generates Other charts until the Ascendant ruler belongs to that tier.
The eventual onchain sampling mechanism remains unspecified.

The Prince NFT artifact reveals planets on the same cumulative-encounter schedule: an unrevealed planet renders as a **ghost** at hairline weight (per `STYLE.md`), present as potential but not yet awakened. See `spec/concept/NFT.md`.

**Dev mode** overrides this schedule and unlocks all seven planets immediately. Dev mode is for development and is never active in production.

### 11.2 Achievements (deferred)

The run-end-only structure suggests room for an achievements layer — recognitions for completing multiple maps in a single run, encountering rare topologies (e.g. the canonical Sephirot pattern from `MAP.md §2`), or other lifetime markers. Achievements are out of scope for v1; they're noted here so the surrounding mechanics leave room for them.

### 11.3 Map boundaries: uncombust rolls and the barrage

Completing a map rolls the next one (§11), and the new map's seed also rolls what the crossing does to the player's chart — two steps, in order, both settled at map creation and shown on entry (§7):

1. **Uncombust rolls.** Each combusted fielded planet rolls fortune (`luck / 120`, §7); on success it uncombusts at half ceiling (§10).
2. **The barrage.** Each lit fielded planet — including any that just uncombusted — takes affliction: a uniform roll from `0` to `k × 3/60` of its ceiling, where `k` is the number of maps completed this run. The bound is exact — ceilings are multiples of 60. A successful fortune roll halves the planet's share. Amounts are integers, and a planet's resulting affliction is capped at `ceiling − 1` — like opponent spawns (§11), the barrage wounds but never combusts.

The first map of a run has no boundary: the chart enters clean. Each crossing after that opens closer to the edge — by the seventh map the barrage rolls up to `18/60` (30%) of every ceiling — so later maps are higher-stakes before their first node is entered. The barrage is also what makes combustion a tide rather than a one-way ratchet: pressure rises map over map, and the uncombust processes (§10) push back.

## 12. Scoring (Distance)

UI label: `Distance`.

Distance is one additive number on the lattice: every rule below sums magnitudes the turn log already carries, or ceilings, which are multiples of `60`.
What earns it is decided by the encounter's **ruler** (§11): each ruler pays for what that planet values.

| Ruler | Polarity condition | Chart | Channel | Payout |
|---|---|---|---|---|
| Moon | Testimony | Other | All | Applied magnitude |
| Mercury | Contrary | Other | All | Applied magnitude |
| Venus | Testimony | Both | Direct | Applied magnitude |
| Sun | Accord | Other | All | Applied magnitude |
| Mars | Affliction | Other | All | Applied magnitude |
| Jupiter | Either | Both | Direct | Applied magnitude |
| Saturn | Affliction | Both | Combustion | Target's ceiling |

`Other` means the Other's chart, while `Both` includes the Prince's chart and the Other's chart.
`All` includes direct and propagated applied effects, while `Direct` includes only the initial effect on each chart.
`Accord` means that a resolved beat has the same polarity as the Other's announced action.
`Contrary` means that it has the opposite polarity.
Each beat is checked after any aspect inversion, so one action can produce both Accord and Contrary beats.
The announced action remains the reference if the Other is preempted, and its zero-magnitude response still pays zero.

Per turn, the resolution is read as **beats** — the direct hit and each propagation hop, with a combust marker wherever a hit reaches a ceiling — and `turnScore` is the sum of the beats the ruler admits.
The projection preview produces the same beats, so a previewed Distance and an awarded one are one function.
Run score accumulates `turnScore`.

Applied-magnitude rules pay the actual magnitude after clamping, not the attempted magnitude.
A hit that causes combustion remains an applied-effect beat and also emits a separate combust marker.
Only Saturn admits the marker, and Saturn pays the target's ceiling rather than the hit magnitude.

Under the Moon only real reductions count — testifying a planet already at zero affliction scores nothing — so each turn is a two-beat: afflict to set up, testify to cash.
Under Mars the two-beat inverts.
Mercury and the Sun instead ask whether each effect runs contrary to or in accord with the Other's announced action.
Under Venus, Jupiter, and Saturn, the Other's reply on the Prince's chart can pay, so the choice includes which planet stands in the way.
The rule is stated on the encounter screen for the whole encounter, and the node's colour on the map is the same ruler, so a route is chosen with the rotation in view.

Moon and Mars partition effects on the Other's chart by absolute polarity.
Mercury and the Sun partition them by polarity relative to the Other's announced action.
Venus and Jupiter govern the direct exchange on both charts, with Jupiter intentionally containing Venus as the greater benefic contains the lesser.
No other ordinary rule strictly contains another.
Within the unlocked rotation, rulership fixes relative frequencies: the luminaries rule one sign each, while the other planets rule two.
Before Mercury unlocks, every combat encounter is necessarily Moon-ruled.
Saturn's ceilings dwarf per-turn magnitudes, so late-run Saturn nodes are cash-outs.

A run's **final accumulated Distance** is its permanent output. When the run ends — combustion or completion (§11) — that value is inscribed as a star in the Prince's NFT field (`NFT.md`, "The Star-Field"). Nothing else about the run is recorded: not how it ended, not which planets combust. Only the Distance, and the star it earns.

## 13. Interaction Chart Semantics

Columns:

- Planet
- Action
- Impact

Action display:

- the opponent's precommitted verb for the turn (`Afflict` / `Testify`)

Impact display:

- the direct output for the action's stat (`impact` for `Afflict`, `witness` for `Testify`)

## 14. Prototype Scope

Intentionally out of scope for now:

- metaprogression/economy
- production persistence migrations
- full ephemeris chart calculation
- final balance pass
