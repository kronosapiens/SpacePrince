# Space Prince docs

The design references for Space Prince, organized by responsibility.
Docs record intended behavior; code records implemented behavior.
When they disagree, investigate rather than assuming either is right, and update the reference when a change in guidance lands.
Proposals, experiments, and open questions live in [GitHub issues](https://github.com/kronosapiens/SpacePrince/issues); what a particular change did and why lives in its PR.
New design decisions are recorded only with the user's agreement.

## Responsibilities

| Material | Home |
|---|---|
| Premise, audience, desired experience, influences | [intent.md](intent.md) |
| Current rules and the rationale that matters | [mechanics/](mechanics/) |
| Visual, musical, interaction, and artifact guidance | [presentation/](presentation/) |
| Authoring guidance, matrices, scene briefs | [writing/](writing/) |
| Sources, comparisons, reusable evaluation methods | [research/](research/README.md) |
| Feature ideas, unresolved questions, experiments, implementation plans | GitHub issues |
| What an implementation changed and why | PR description and discussion |
| Exact constants, types, player copy, tuned presentation values | Code: `client/src/game`, `client/src/copy`, `client/src/svg`, `client/src/style` |
| How the prototype is wired, evaluation methods, DNS | [client/README.md](../client/README.md), [client/src/eval/README.md](../client/src/eval/README.md), [landing/DNS.md](../landing/DNS.md) |
| Deliberately retained design history | [archive/](archive/README.md) |

## Reading paths

**Mechanics.**
Start with [MECHANICS.md](mechanics/MECHANICS.md) for combat (the number model, stats, resolution, aspects, combustion, Necessity, the run, and Light), then [STATE.md](mechanics/STATE.md) for the data shapes and what is stored, derived, or evented.
[ENCOUNTERS.md](mechanics/ENCOUNTERS.md) specifies house scenes (outcomes, targets, chart conditioning, economy, resolution) and [HOUSES.md](mechanics/HOUSES.md) the references they draw on.
[MAP.md](mechanics/MAP.md) is the map grammar and [CHART.md](mechanics/CHART.md) chart construction.

**Presentation.**
[SCREENS.md](presentation/SCREENS.md) for the screen set and the rules that hold the surfaces together (register, client honesty, interaction grammar), [STYLE.md](presentation/STYLE.md) for the visual vocabulary (primitives, stroke scale, palette, faces, motion), [MUSIC.md](presentation/MUSIC.md) for the sonic one, and [NFT.md](presentation/NFT.md) for the artifact.
Composition (where things go, how large, how fast) is decided in the running client and lives beside its tokens.

**Writing.**
[SCENES.md](writing/SCENES.md) for how house scenes are written and reviewed, then the matrices: [HOUSE_MATRIX.md](writing/HOUSE_MATRIX.md), [HOUSE_PLANET_MATRIX.md](writing/HOUSE_PLANET_MATRIX.md), and [PLANET_MATRIX.md](writing/PLANET_MATRIX.md).
[DRIVES.md](writing/DRIVES.md) covers motive and emotional range, [PLANETS.md](writing/PLANETS.md) each planet's archetype and voice, [PRIMER.md](writing/PRIMER.md) the game explaining itself, and the [briefs](writing/briefs/) hold all 720 scene briefs.
Player copy itself lives in `client/src/copy/`.

**Onchain.**
[STATE.md](mechanics/STATE.md) for the intended contract storage against the prototype's shapes, [CHART.md](mechanics/CHART.md) for the Cairo-first chart derivation and the identity grid, and the determinism sections of [NFT.md](presentation/NFT.md) for the onchain renderer.
The derivation crate is `cairo/crates/star_chart`, consuming the sibling [astronomy-engine](https://github.com/kronosapiens/astronomy-engine) repository.
The mint identity quantization is unresolved ([#30](https://github.com/kronosapiens/SpacePrince/issues/30)).

## Research and archive

[research/](research/README.md) holds sources, comparisons, and historical findings, consulted as needed; a recommendation there is not a rule.
[archive/](archive/README.md) holds the earlier v1 pass.
