# Balance evaluation methods

Use simulations to identify which decisions change outcomes and why.
The [Necessity research summary](https://github.com/kronosapiens/SpacePrince/pull/18#issuecomment-6457613560) retains the experiments, findings, and qualifications; [client commands](../../README.md#balance-evaluation) describe the maintained evaluator.
This guide preserves methods future studies can extend without recreating old scripts.
The historical studies used a smaller narrative catalogue, so establish a baseline on the current game before interpreting a new change.

## Choose the question before the batch

Separate completion difficulty, Light earned, the benefit of planning, and repeated-run adaptation.
A change can improve one while weakening another.
The research aimed for the experience of FTL Normal and Slay the Spire A1, with combat providing the main challenge and narratives supporting it.
That goal did not imply equal combat and narrative rewards.
The proposed 84% completion target was a temporary simulation proxy and was later relaxed; it is not a standing human difficulty target.

Write down the candidate rules, primary policy and outcome, controls, and what result would change the recommendation before examining results.
A short screen followed by a fresh confirmation was more useful than simply increasing the original baseline to 30,000 runs.
More trials narrow uncertainty about a policy's performance; they do not repair its blind spots.
The studies used screens such as 20 charts × five seeds and confirmations such as 50 fresh charts × ten seeds, as examples rather than fixed requirements.
Keep the confirmation charts and seeds separate from those used to select candidates.
Label user-requested follow-ups on an existing cohort as follow-ups, not independent confirmation.

## Separate the causes of an improvement

Use the actual game resolver for both execution and policy forecasts under the tested rules.
Keep current actions deterministic and let policies see publicly derivable information, while keeping future live RNG inaccessible.
Two-turn planning enumerates possible next announcements and their probabilities; it does not read the next actual draw.

| Question | Comparison and control | What it establishes |
| --- | --- | --- |
| Does another turn of planning help? | Hold routing, narrative choices, and capacity allowance fixed; vary the planning horizon. | Benefit within an encounter, not whole-run planning or human skill. |
| Does accepting tactical risk improve score? | Hold horizon and routing fixed; vary the capacity allowance while preserving survival and lit-planet priorities. | A measured survival/score tradeoff. |
| Does route forecasting add value? | Include simple combat- and narrative-preferring routes using the same action policies. | Whether elaborate forecasting beats a simple preference. |
| Does preparation for entry matter? | Compare ordinary two-turn defense with the same policy valuing the next Necessity sweep. | Sensitivity to preparation; that continuation omits intervening recovery and is not optimal play. |
| Does an upgrade pay for its cost? | Branch from the same reachable state into accept, decline, and a same-cost/no-gain control, then compare matched future continuations. | Value of the gain in that state, separate from its cost. |

Immediate survival and immediate Light remain useful controls, but neither values every delayed benefit.
The investment audit found an early Afflict gain that these policies missed; a late Fortune gain had no remaining trigger under the rules then tested.
For such studies, select a state and recipient during exploration, fix them, then test fresh future continuations and examine different timings and recipients.
An interval over futures from one fixed state does not estimate a universal upgrade price.

Test rule changes with several fixed policies first, then evaluate a separately identified policy that adapts to the new rule.
This distinguishes a harder game from a policy that has become poorly suited to it.
When changing multiple mechanics together, report the bundle's effect rather than attributing it to one component.
For example, the lethal comparison changed both the cap and the draw amounts.

## Pair samples and describe uncertainty honestly

Compare alternatives on the same starting chart/game-seed pairs, then resample whole charts for uncertainty because runs on one chart share its strengths and weaknesses.
Report the paired difference with its interval and sample size, including how many charts were sampled.
Treat many turns on the same run as observations, not independent experimental subjects.
An all-success sample or a zero-width bootstrap interval does not prove a policy cannot fail.

Keep game, policy-tie, route, and forecast randomness separate and record their definitions.
The CLI keys policy ties by strategy name; a study isolating one factor can inject policies into `runTrial` using a shared trial identity instead.
Even shared initial seeds and tie streams do not guarantee identical later draws: choices change paths, encounter counts, and stream consumption.
Do not compare percentages from different cohorts as if they were a paired experiment.
The sampled ephemeris charts are also a model of chart diversity, not an observed distribution of players' birth charts.

## Measure pressure and choices, not only completion

Capacity is the sum of remaining room before combustion across fielded planets, using their effective Resolve including gains.
Track combat damage and healing separately, entry affliction, narrative effects, revival, Resolve gains, and capacity added by unlocks; reconcile them with the change in capacity.
Combat measurements use actual logged effects after clamping and inversion, while narrative measurements use net changes per planet within a choice.

The pressure audit showed that combat could restore more capacity than it consumed.
Consequently, extra turns can supply healing, extra opening affliction can create more room for recovery, and doubling damage can change combustion and propagation.
Rerun the resolver under a candidate rule rather than scaling totals from old trajectories.
More affliction on the Other also lowered preemption thresholds and could make survival easier; Self and Other tuning cannot be interpreted independently of initiative and healing.

Report completion and failure maps, Light across all attempted runs, outcomes among completed runs, and encounter exposure.
Separate planet losses at entry from losses during turns, full entry wipes, and final run failures after unlock handling.
Use explicit denominators such as planet losses per 100 combat entries: longer-surviving policies encounter more opportunities to lose planets.
Keep deaths after revival as repeated losses rather than counting each planet only once.
Inspect individual surviving planets and concrete action disagreements, since equal total capacity can conceal different future capabilities.

For strategic depth, look for a benefit from preparation, viable alternatives whose value changes with state, and understandable examples of setup paying off.
Lower completion alone is insufficient evidence.
Actor usage and consecutive reuse can diagnose concentration, but specialization is not automatically an exploit; the reuse restriction tested here offered little benefit.

## Evaluate onboarding and repeated play separately

Use actual unlock progression as well as a fully unlocked control on matched starting seeds.
The UI commits a resolved encounter, increments lifetime progress, and clears it before deciding whether the enlarged roster can continue.
A new planet can rescue a zero-turn entry wipe; stopping at the combat resolver's earlier loss would mismeasure onboarding.
The comparison includes different roster-dependent encounters as well as fresh unlocks, so it does not isolate the value of the new planet alone.

For replayability, run the same Prince across fresh seeds and compare routes, acting planets, gains, and whether earlier decisions change later plans.
Carry lifetime count between attempts while resetting run-specific wounds and gains.
The CLI's `--starting-encounters` starts each trial independently; chaining attempts requires passing the previous summary's final count to the next `runTrial`.
Fixed policies do not model human learning, and varied random outcomes alone do not establish enjoyable replayability.

## Validate and carry the learning forward

Before scaling a study, check a small deterministic replay, unchanged controls, a hand-calculated planning example, and the resource ledger.
Verify the relevant boundaries: effective gains and roster, entry deaths, zero-action endings, unlock rescue, and any claimed fresh-planet safety.
Observation and forecasting should neither mutate live state nor consume its random streams.
Investigate simulation errors before aggregating a batch.

Preserve the question, rule and policy definitions, controls, sampling and selection procedure, metrics and denominators, uncertainty method, decisive examples, limitations, and the next unresolved question in the research summary.
Record which game/content version was evaluated so later sessions know what needs remeasurement.
Raw records and one-off scripts can serve validation during a study without becoming a permanent historical replay system.

The next calibration should combine a current-catalogue baseline with human playtests of entry-risk comprehension, mistake recovery, combat avoidance versus scoring, and repeated runs on one Prince.
Simulation policies provide evidence about consequences; human playtesting establishes felt difficulty, enjoyment, and comparison with the reference games.
