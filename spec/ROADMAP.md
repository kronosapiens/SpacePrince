# Space Prince — Improvement Roadmap

A tracked implementation guide from the 2026-07 whole-game review.
Six pillars: astrology hitting harder, gameplay engagement, UI tightness, meaningful metaprogression, emotive experience, high engagement.
Checkboxes track implementation on the `improvements` branch.

Everything here stays inside established constraints: no power progression, no pay advantages, no generated text, no fog of war, no planet personification, aspect red/green untouched, and no re-litigation of rejected combat alternatives (sign-matchup valence, self-resolution scoring).

---

## Diagnosis

The conceptual architecture is strong; the gaps are in the middle layer between concept and screen.

- The metaprogression loop is broken in the prototype: `EndOfRunScreen.beginNew` dispatches `clear`, wiping the Prince, so `numEncounters`, unlocks, and `runs[]` never accumulate.
- The star-field — the game's central artifact promise (`NFT.md`, "The Star-Field") — is rendered nowhere.
- There is no audio at all, despite `VIBES.md §Sound Design` and `MUSIC.md` specifying the direction.
- The emotional ceremonies (combustion, planet unlock, star inscription) are specced but unbuilt; the mint ceremony proves the register.
- After cumulative encounter 32 the Macrobian ascent is complete and no lifetime horizon exists; `ECONOMICS.md` imagines ~1000 runs to maturity with no system spanning the gap.
- The run is flat: map 7 plays identically to map 1, though `MECHANICS.md §11` invokes FTL's sectors.
- The chart computes more astrology than the game uses: dignity is derived and shown nowhere, the player's own house placements affect nothing, and transits do not exist.

## Phase 0 — Make the loop true

- [x] Land the in-flight combat rework: opponent-chart-only scoring + pre-afflicted opponent spawns (committed on this branch).
- [ ] **Prince persistence.**
  New Game starts a new run on the same Prince; wiping identity becomes dev-only.
  Prerequisite for feeling any metaprogression.
- [ ] **Determinism leaks.**
  `EncounterNarrative.handleOption` and `chorus.pickFragment` use `Math.random()`; thread seeded rng through both.
  Seed-derivability is what makes shareable run states and eventual contract binding work.
- [ ] **Lossless run history.**
  `run.events` is stripped on save, so the End-of-run map browser is lossy after reload.
  Persist per-map seed + walk path + node outcomes; re-derive topology and content from seed.

## Phase 1 — The felt layer

- [ ] **Tonal signatures** (`VIBES.md §Sound Design`, `MUSIC.md §Architecture`).
  Seven per-planet textures on the shared D tonic, each in its planet's mode; verbs sound on commit; propagation is audible (trine resolves, square hangs); a combustion cuts its signature off mid-phrase; the soundscape thins as planets go dark.
  This is the signature layer, not the themes — it front-runs the eventual score rather than competing with it.
  Needs a mute affordance and a user-gesture unlock for autoplay policy.
- [ ] **Combustion beat.**
  The existing 1800ms desaturation, plus the signature cut, plus the planet's final fragment in its own voice, plus a held pause before play resumes.
- [ ] **Unlock ceremony** (`SCREENS.md §4.1`).
  The newly unlocked planet emerges from ghost on the map chart anchor when a Macrobian threshold is crossed.
- [ ] **Star-field rendering** (`NFT.md`).
  Derive from `runs[].distance`: deterministic position and brightness per star; render behind the chart on Title and Chart Study.
- [ ] **Star inscription** (`SCREENS.md §6.1`).
  At End-of-run the player watches the new star take its place in the field.
- [ ] **Run-ending differentiation.**
  Combust-out gets the slower ~1800ms weighted fade and the silence of a fully-thinned soundscape; completion stays lighter.
  Same screen, different weight — failure is acknowledgment, not punishment.
- [ ] **Combat voice moments** (`PLANETS.md §1` secondary usages).
  One fragment at run open (the Moon), one at a player planet's combustion, one at run end.

## Phase 2 — Astrology deeper

- [ ] **Dignity wiring** (`ENCOUNTERS.md §1.4, §4.2`).
  Exchange-rate nudges from the conditioning planet's dignity band; verify the `visibleIf` gates already consume dignity; surface dignity in the study stats panel.
- [ ] **House-tenant targeting.**
  Add a targeting-vocabulary entry for the planet standing in the player's own whole-sign house matching the encounter's house.
  This makes the Prince's houses mechanically real — the classical meaning of houses — and shifts the decision space per chart (`HOUSES.md §3.4`) without touching combat.
- [ ] **Study annotations beyond planets** (`SCREENS.md §3.6.1` extension path).
  Tap an aspect line in study mode → name and gloss; tap a sign glyph → element/modality gloss.
- [ ] **Wager odds visibility** (`SCREENS.md §1.1` client honesty).
  The push-your-luck roll resolves against a knowable luck stat; the option's aside must carry the odds.
- [ ] **Narrative pacing pass.**
  Hold the resolution beat instead of the abrupt auto-advance; make option → outcome causality visually traceable.

## Phase 3 — The run's shape

- [ ] **Map-over-map ramp.**
  Opponent spawn-affliction bands tighten and the opponent verb draw skews toward afflict as `mapsCompleted` rises.
  Map 1 is generous, map 7 austere; no stat inflation (opponents stay real charts).
  Also counter-pressures the testify-spam thread late in the run.
- [ ] **L7 gate beat.**
  The terminal node guarantees combat with the heavy spawn band at its top end, so each map ends with weight.
- [ ] **Run journal** (`SCREENS.md §6.4`).
  One quiet line per run — maps completed, final Distance — on End-of-run and Chart Study.
- [ ] **Map-as-strategy legibility.**
  A glance at a narrative node should answer "a place to earn or a place to heal" (house valence is fixed and public).

## Phase 4 — Horizon and reach

- [ ] **Transits.**
  Compute the current sky from wall-clock time via the existing ephemeris path (`client/src/astronomy/compute.ts`); render as a faint outer ring on Title and Chart Study; a transit conjoining or opposing a natal placement biases fragment mood and ambient tint.
  Strictly presentational: zero mechanical effect, and the NFT does not respond (`NFT.md` forbids evolution on time passage).
  The return loop this game's ethos permits — the sky is different every day, for free.
- [ ] **Lifetime layers** (`SCREENS.md §7.4`).
  Fragment archive (lift `seenFragmentIds` from run scope to Prince scope, browsable in Chart Study); houses encountered gain their wedge flourish.
- [ ] **Achievements v1** (`MECHANICS.md §11.2`, bitmap reserved in `STATE.md`).
  A small set — first completed run, canonical Sephirot pattern witnessed, full passage without a combustion — shown as quiet marks, never toasts.
- [ ] **Free tier** (`FREE.md`).
  "Play a sample": random chart, three planets, one map, nothing kept; the end-of-map conversion beat framed as loss.
- [ ] **Spec cleanup.**
  `README.md` and `spec/v2/ONBOARD.md` still describe the rejected sign-matchup terrain and 1–2 turn early encounters; update to match `MECHANICS.md`.

## Deferred / open design questions

- **Long-horizon progression.**
  Reconcile `ECONOMICS.md`'s ~1000-run maturity with the 32-encounter unlock ramp.
  Candidate spans: house scenario pools deepening with lifetime visits, the `LORE.md` fragment system, the unbounded star-field.
  A design decision to make deliberately, not code to rush.
- **Opponent-target lever** (open thread in the combat model).
  Letting the player aim the direct hit at any non-combusted opponent planet would turn the opponent's aspect web into a puzzle surface.
  Explore behind a dev toggle after the testify-spam playtest settles.
- **Shareable run states** (`SCREENS.md §4.2.1`).
  Depends on lossless history; a URL-shareable map walk is the social artifact for a single-player game.
- **Accessibility color channel** (`STYLE.md §14`) and the mobile portrait pass — audit that nothing bakes in horizontal-only assumptions.
- **Testify-spam watch** (combat model, pending playtest).
  Levers in order: narrow/lower seed bands, raise opponent aggression.
  The Phase 3 ramp implements both as map-indexed rather than global changes.
