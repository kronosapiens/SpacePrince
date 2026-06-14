# Space Prince — Narrative Encounter Authoring Spec

This document is the **generation-ready specification** for narrative encounters.
Where `HOUSES.md` answers *what each house is* (the conceptual reference), this answers *how an encounter is built* — the economy it runs on, the vocabulary it targets, how a chart conditions it, its shape, its prose, and a blueprint per house-kind.

It fills the parts `HOUSES.md §1` explicitly deferred: mechanical treatment, exchange curves, and authored structure.
When this conflicts with the rough first pass in `client/src/data/narrative-trees.ts`, this wins; the code is being upgraded to match.

Combat resolution lives in `MECHANICS.md`; house concepts in `HOUSES.md`; screen layout in `SCREENS.md §3.2`; planetary voice in `PLANETS.md`.

---

## 1. The Complementary-Loop Economy

Narrative is not a second scoring engine.
It is the **trade surface** between the run's two currencies; combat remains the resolution engine.

### 1.1 Two currencies

- **Distance** — the run's score (`MECHANICS.md §12`). Run-wide, banked.
- **Chart-health** — low affliction and lit (un-combust) planets. Per-planet, the substrate of survival.

Combat is the only positive-sum engine: healing affliction *both* scores Distance *and* restores chart-health (`MECHANICS.md §12`).
Narrative does not add a second engine — it lets the player **trade one currency for the other**, in either direction, at moments combat can't reach.

### 1.2 Two trade directions

Every encounter is built from two moves and a gamble.

- **Press** — take affliction (now) to gain Distance (now). Spend chart-health for score.
- **Tend** — spend Distance to heal affliction or call back a combusted planet. Buy chart-health with score.
- **Wager** — a push-your-luck branch (see §5.3) that resolves Press-or-nothing on a luck roll.

A root node typically offers one of each, plus conditional branches that the chart reveals or hides (§4).

### 1.3 Why this is bounded (the anti-faucet)

Pressing looks like free Distance, because affliction taken can later be healed in combat for more Distance.
The bound is not an arbitrary cap — it is **run-length**.

The run ends when all seven planets combust (`MECHANICS.md §11`).
Affliction taken in narrative pushes planets toward their combustion ceiling, shortening the run, which lowers *lifetime* Distance.
So Press trades run-length for Distance-now; Tend spends Distance to buy run-length back.
The master loop:

| Move | Distance | Chart-health (run-length) |
|---|---|---|
| Combat (heal) | **+** | **+** | (the engine: scores *and* survives) |
| Narrative Press | **+** | **−** | (cash durability for score) |
| Narrative Tend | **−** | **+** | (buy durability with score) |

A per-encounter Press ceiling (§6) is a secondary guard so a single node can't dominate; the real discipline is combustion.

### 1.4 Exchange rates carry valence and dignity

The exchange rate is where the chart enters the trade mechanically — *not* a flavor tax.
Two modifiers compose on every rate.

**House valence** (`HOUSES.md §3.2`) — the fixed character of the place, the same for every chart:

- **Good place** — favorable: Press yields more Distance per affliction; Tend heals more per Distance.
- **Bad place** — unfavorable: Press yields less; Tend costs more.

**Dignity of the conditioning planet** (§4.2) — how well the planet carrying the house sits, by sign:

- **Strong** (Domicile / Exaltation) — shifts the rate one notch favorable.
- **Weak** (Detriment / Fall) — one notch unfavorable.

The two stack: a Strong conditioning planet in a good place trades best; a Weak one in a bad place worst.
This is what makes the same house *feel* different on two charts — **valence is the house, dignity is the Prince**.
These are *relationships*, not final numbers; concrete bands are tuning targets in §6.

---

## 2. Outcome Set (v1)

Narrative outcomes are restricted to the **combat-shared resources** only.
`Omen` and `Lore` are deferred — both were inert (Omen is never read by combat; Lore is a dead counter), and shipping a resource that does nothing is worse than not having it.

| Outcome | Meaning |
|---|---|
| `affliction { planet, delta }` | `delta > 0` harms, `< 0` heals. Clamped at 0. |
| `combust { planet, value }` | Force combust on/off. |
| `uncombust { planet }` | Call a combusted planet back (Tend; expensive). |
| `distance { delta }` | Earn / spend score. Clamped at 0. |

Omen/Lore can return in v2 once combat consumes Omen and Lore unlocks real content; the `Outcome` union keeps room for them but no v1 tree emits them.

---

## 3. Targeting Vocabulary (unlock-safe)

A Prince's chart fills in progressively (`MECHANICS.md §11.1`: Moon first, Saturn at encounter 64).
**An encounter must never reference a locked planet.**
Trees therefore target *abstract roles* resolved at runtime against the unlocked set, never raw planet names.

| Target | Resolves to |
|---|---|
| `joy` | the house's joy-planet **iff unlocked**; otherwise this branch is absent (see §4.4) |
| `ruler` | the house's natural ruler (the aria/voice planet) **iff unlocked**, else fall through |
| `mostAfflicted` | the unlocked planet with the highest affliction (Tend targets) |
| `healthiest` | the unlocked planet with the most combustion-margin (Press targets — absorbs without going dark) |
| `allUnlocked` | every unlocked planet (broad small heals) |
| `randomUnlocked` | one unlocked planet, seeded |
| `anyCombusted` | gates uncombust options; absent if none combusted |

Resolution rule for themed targets: `joy → ruler → mostAfflicted → Moon` (the Moon is always unlocked).
Press defaults to `healthiest` so it doesn't accidentally combust a fragile planet; Tend defaults to `mostAfflicted` so healing lands where it counts.

**Early-game consequence (intended):** before encounter 4, only Moon and Mercury exist, so most joys are locked and encounters degrade to ruler/Moon variants.
The first houses where chart-conditioning can fire are **1 (Mercury joy)** and **3 (Moon joy)** — the two most intimate houses. Lean into that; the chart literally fills in as the player goes.

---

## 4. Chart-Conditioning

Conditioning must **shift the decision space, not scale numbers** (`HOUSES.md §3.4`): a hostile chart removes or disguises the best option; a friendly one reveals it.
Two levers compose.

### 4.1 Run-state lever (dynamic)

The joy-planet's current condition, read wherever it sits (`HOUSES.md §3.3`).
Three states: **clean**, **afflicted**, **combust**.

### 4.2 Natal lever (fixed at mint)

The **dignity** of the conditioning planet (joy if available, else ruler), banded:

- **Strong** — Domicile / Exaltation
- **Neutral**
- **Weak** — Detriment / Fall

Dignity is **narrative-native**.
As dignity moves out of combat — the *quantitative* chart (stats, aspects, sect, combustion) — and into narrative — the *qualitative* chart (dignity, joy, house placement) — narrative becomes the system where a planet's sign-condition has mechanical meaning.
This makes the two encounter types exercise different facets of the same chart: combat is what your planets *do*, narrative is what your planets *are*.

Dignity does two jobs here:

- **Gates branches** (§4.3) — which premium / penalty options exist at all.
- **Nudges exchange rates** (§1.4) — how favorably the trade resolves.

(*Combat dependency:* this assumes the in-progress removal of `dignityMult` from the combustion ceiling, `MECHANICS.md §10`, and a re-anchoring of the dignity study annotation, `SCREENS.md §3.6.1`, away from "resilience." *Natal-lever alternative deferred to v2:* whether the ruler aspects the ASC, per `HOUSES.md §3.2`.)

### 4.3 The authoring predicates

Trees gate options with a small fixed predicate set, never ad-hoc logic:

| Predicate | True when |
|---|---|
| `joyStrong` | joy unlocked, dignity Strong, clean |
| `joyPresent` | joy unlocked, clean (any dignity) |
| `joyAfflicted` | joy unlocked, afflicted or combust |
| `joyLocked` | joy not yet unlocked |
| `rulerStrong` / `rulerWeak` | ruler dignity band (for joyless houses, §7.2) |
| `anyCombusted` | at least one unlocked planet combusted |

Composition: the **natal** lever decides *which* premium/penalty branches exist (a Strong joy reveals a real boon; a Weak joy exposes only harsher options); the **run-state** lever decides *whether the joy's boon is live or flattened*.
Keep each encounter to 2–3 gated branches — do not enumerate all combinations.

### 4.4 The asymmetric joy rule, mechanized

`HOUSES.md §5.0`: benefic joys *add good*, malefic joys *remove bad*. Preserve the asymmetry — a clean benefic is a **bonus**, a clean malefic is a **mitigation**; they must not collapse into one mechanic.

- **Benefic joy (3, 5, 9, 11), well-conditioned:** reveal a **boon** branch — a free or discounted heal / Distance the option list wouldn't otherwise carry.
- **Benefic joy, afflicted:** boon branch hidden; replaced by a flattened option ("the pleasure is dimmer than you remember") at the plain rate.
- **Contained malefic (6, 12), well-conditioned:** affliction taken is **scoped** — bounded magnitude, contained to the joy-planet ("the malefic is honestly employed").
- **Contained malefic, afflicted:** containment fails — affliction **spills** to other unlocked planets and/or larger magnitude.
- **Pure bad place (2, 8):** no joy lever at all — flat, same for every chart (the two "gates"). Conditioning here is whole-chart run-state only (e.g. the uncombust rite appears iff `anyCombusted`).
- **Pure angular (4, 7, 10):** no joy lever — conditioned by the **natal lever** (ruler dignity) and diurnal theme (§7.2).

---

## 5. Encounter Shape

### 5.1 Structure

- **Depth 2** standard (root + at most one follow-on); **depth 3** only for a two-rung wager.
- **Breadth 2–3** options per node.
- Every path ends in a resolution node applying §2 outcomes.

### 5.2 The trade-axis root

A root node spans the trade axis (§1.2): a **Tend**, a **Press**, and a **Wager** option, with conditional joy/dignity branches *replacing or augmenting* them per §4.
Not every root carries all three — recovery houses lean Tend, ambition houses lean Press/Wager — but the axis is the design grammar.

### 5.3 Push-your-luck

The Wager resolves against the **conditioning planet's luck** (joy if available, else ruler), per the existing roll (`EncounterNarrative` luck check).

- **One rung** (default): success → Press payoff; fail → affliction, nothing gained.
- **Two rungs** (gambling houses only — 5 Creativity, 8 Transformation, 10 Achievement): cash out after rung 1, or continue to rung 2 for a larger payoff with **rollback of rung 1 on failure**.

The three-rung ladder from `HOUSES.md §4.2` is **not** built — two rungs deliver the cash-out/rollback tension without the extra rollback-state complexity.

### 5.4 Always-present vs offered

Tend, Press, and a plain exit are always visible.
Boon branches, containment branches, and the uncombust rite are **offered** — surfaced only when their predicate (§4.3) holds. This is the primary vehicle of conditioning (`HOUSES.md §4.3`).

---

## 6. Tuning Targets (provisional)

Numbers are **bands to author within**, not final balance (`HOUSES.md §1` scopes exact curves out). Hold the *relationships*; tune the values in playtest.

- **Affliction magnitudes:** 1–5 per node (chip scale — small against combustion ceilings, which are set by durability alone once dignity leaves combat, so narrative chips, combat swings).
- **Press rate:** ~1 Distance per 2 affliction baseline; good place better (~1:1.5), bad place worse (~1:3). Sub-1:1 so press-then-heal isn't a printer.
- **Tend rate:** ~2 Distance per affliction healed; good place cheaper. Above 1:1 because combat heals "for free" via scoring — narrative Tend is the between-combat / emergency heal.
- **Dignity nudge:** a Strong / Weak conditioning planet shifts Press and Tend one band more / less favorable (§1.4), stacking with valence. Keep each notch ≈ the good-place/bad-place gap, so dignity colors the trade without dominating it.
- **Uncombust:** ~6–8 Distance, rite-gated (house 8, secondarily 4). The run-saver, deliberately steep.
- **Per-encounter Press ceiling:** ~+6 Distance, so no single node dominates a turn-score's worth.
- **Wager:** safe option ≈ baseline; risky option ≈ 2× payoff on success vs proportional affliction on fail; two-rung ≈ 3× at rung 2.

A full encounter's net Distance should sit in the range of a single combat turn-score, so neither node type dominates run scoring.

---

## 7. Per-Kind Blueprints

The five kinds (`HOUSES.md §5.0`) are the generation backbone: each house's 2–3 scenarios are instances of its kind's blueprint, differing in flavor, not in economic DNA.

### 7.1 Double-anchored — House 1 (Self)

Mercury joy + ASC. The origin; recovery-leaning, gentle rates.

- **Tend (signature):** "return to yourself" — small broad heal across `allUnlocked` at a low Distance cost.
- **Press:** "stake your name" — Distance for affliction on the conditioning planet.
- **Boon (`joyStrong`/`joyPresent`, Mercury unlocked):** the strongest line speaks — discounted heal + small Distance.
- Voice: Mercury (the turn, paradox, the new beginning one is always arriving at).

### 7.2 Pure angular — Houses 4 (Home/IC), 7 (Relationships/DSC), 10 (Achievement/MC)

No joy → conditioned by **ruler dignity** (`rulerStrong`/`rulerWeak`) + diurnal theme. Each house gets a distinct economic flavor:

- **4 (IC, interior):** Tend-heavy — rest and heal; `rulerStrong` deepens the rest. The recovery house.
- **7 (DSC, the other):** relational Wager — ally (mutual heal) vs duel (push-your-luck on relating). Balanced.
- **10 (MC, summit):** Press/Wager-heavy — the visible monument, the two-rung gamble for big Distance and big variance.

### 7.3 Benefic joy — Houses 3 (Moon), 5 (Venus), 9 (Sun), 11 (Jupiter)

Good place + benefic joy. Asymmetric rule: well-conditioned joy **adds a boon** (§4.4). Favorable rates.

- **3 (Moon):** reflective heal — listen, recover; afflicted Moon flattens to "letters arrive folded."
- **5 (Venus):** play / creative Wager — the boon is a strong heal; the gamble is "games of chance" (two-rung).
- **9 (Sun):** illumination — study for Distance + heal; the far country, vows.
- **11 (Jupiter):** the gift — unearned Distance + heal when Jupiter is clean; "no one at the door" when afflicted.

### 7.4 Contained malefic — Houses 6 (Mars/Labor), 12 (Saturn/Hidden)

Bad place + malefic joy. Asymmetric rule: well-conditioned joy **caps the downside** (§4.4: scoped vs spill). Unfavorable rates, but legible when contained.

- **6 (Mars):** toil — Press for Distance; contained Mars absorbs the cut; uncontained Mars spills to other unlocked planets.
- **12 (Saturn):** concealment — hidden costs; contained Saturn keeps them scoped and legible; uncontained = unseen spill arriving late.

### 7.5 Pure bad place — Houses 2 (Livelihood), 8 (Transformation)

Averse, no joy, not angular → **identical for every chart** (the two gates). Flat unfavorable rates. The heaviest, most final trades; conditioned only by whole-chart run-state.

- **2 (Gate of Hades):** scarcity — the **debt** mechanic: big Distance now for big affliction later (borrow against tomorrow).
- **8 (death-house):** zero-sum — inheritance (Distance at a steep affliction/combust cost) and the home of the **uncombust rite** (`anyCombusted` → spend Distance to call a planet back). Two-rung Wager fits the crisis theme.

---

## 8. Scenario Identity & Selection

Each authored scenario has a stable `scenarioId` (e.g. `creativity-dice`, `creativity-unfinished-song`).
Houses carry 2–3 scenarios (§7); the **id**, not the house, is the unit of repetition.

**No-repeat rule:** *no specific encounter repeats within a single run.*
A run already tracks `seenFragmentIds` (`PLANETS.md §2`); it tracks `seenScenarioIds` the same way.

Selection layers on top of the map's house roll (`SCREENS.md §4.3`):

1. Pick a house — uniform over 12, excluding the immediately-previous narrative house (existing rule).
2. Pick a scenario in that house whose `scenarioId` ∉ `seenScenarioIds`.
3. Mark it seen on entry.

**Exhaustion fallback** — a long run can outlast the pool:

- If the chosen house has no unseen scenario, re-roll the house among houses that still do.
- If *every* narrative scenario has been seen, reset `seenScenarioIds` and recycle — still honoring the no-immediate-house-repeat rule so the seam stays invisible.

The pool size (12 houses × 2–3 = **24–36 distinct narrative beats**) sets how far a run travels before recycling; raise scenario counts later if runs routinely exhaust it.

**Combat parallel:** the same property holds for combat by opponent — a given opponent Prince should not recur within a run (dedup by opponent id). The large matchmaker pool (`SCREENS.md §3.4`) satisfies this for free; narrative is the case that needs authored breadth.

---

## 9. Prose Contract

Per `PLANETS.md §1–2` and `SCREENS.md §3.2`.

**Register: concrete but generic.**
The body is a plain, tangible folk-situation — a coin at the foot of a tree, a stranger on the road, a letter in an unknown hand — stated plainly, with legible choices.
The symbolism lives in the *structure* (house, planet, cost), not in the prose: no portentous mysticism, no purple lines, no Greek classical names in the body.
The only elevated register is the **aria** (the curated fragment floating above); the situation below it stays grounded.

- **Aria** — one curated, public-domain chorus fragment in the **ruler's** voice (`fragmentMood` per tree). One per *encounter*, not per node. Never explains the mechanic.
- **Node text** — 1–2 sentences, present tense, second person, concrete and grounded (a thing happens; a choice is offered). Sets the dilemma, not the numbers.
- **Option label** — imperative, second person, short. The *choice* ("Take the one coin and go."), never the mechanic.
- **Aside** — the plain mechanical summary, utilitarian register, explicit ("+2 Distance · heal 2 where it's needed most"). All numbers live here.
- **Resolution line** — one short consequence sentence.

The aria carries the planet's voice; the body stays plain.
Tonal range still tracks the house — a bad-place situation reads grimmer than a good-place one (`HOUSES.md §5`).

---

## 10. Authoring Checklist

A scenario is generation-complete when:

1. It declares its house, kind, `scenarioId`, and `fragmentMood`.
2. Targets are abstract roles (§3), never raw planet names — verified unlock-safe.
3. The root spans the trade axis (§5.2) within the kind's lean.
4. Conditioning uses only §4.3 predicates, and the asymmetric joy rule (§4.4) is honored for its kind.
5. Magnitudes sit in the §6 bands and respect the house's valence rates.
6. Every path terminates in §2 outcomes; any Wager rolls on the conditioning planet's luck.
7. Prose follows the §9 contract; aria fragment exists for the ruler.

---

## 11. Open Questions

- Exact exchange curves and the Press ceiling (§6) — playtest.
- Whether the natal lever should later become ruler-aspects-ASC (§4.2) instead of / in addition to dignity.
- Whether Tend should ever be able to *fully* clear a planet, or always leave a margin (interacts with the press-then-heal loop).
