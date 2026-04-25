# Space Prince — Map Construction Spec

This document defines the construction rules for the roguelike map traversed each run.

It covers topology only. Visual/aesthetic treatment lives in `spec/VIBES.md` ("The Map as Sephirot"). Encounter semantics (what lives at each node) and traversal mechanics are out of scope for v1.

Reference implementation: `spec/tree.html` — interactive prototype with live layer sliders, pattern overrides, and reseed.

---

## 1. Scope and Goals

### Goals

- Each run produces a unique traversable map.
- The canonical Kabbalistic Sephirot arises rarely but discoverably ("deniably so", per `VIBES.md`).
- No authored meaning is attached to any single shape — every generated tree is a valid tree.
- Construction rules are simple enough to implement on-chain if needed.

### In Scope (v1)

- Layer pattern generation.
- Edge rules.
- Graph output: nodes with `(layer, pillar)` positions + edge list.

### Out of Scope (v1)

- Encounter type / content assignment per node.
- Planet-to-sephirot semantic mapping.
- Traversal mechanics and rewards.
- Visual rendering (see `VIBES.md`).

---

## 2. Topology Grammar

Seven layers arranged top to bottom. Each layer contains either one central node (`C`) or a pair of side nodes (`L` + `R`).

- **L1** (top): always `C`.
- **L2 – L6**: independently `C` or `L+R`, each with probability `p = 0.5` of being double.
- **L7** (bottom): always `C`.

This yields `2^5 = 32` equally likely layer patterns.

### Node count

- Min: 7 (all singles)
- Max: 12 (all doubles)
- Mean: 9.5

### Canonical reference

The canonical Kabbalistic pattern `[1, 2, 2, 1, 2, 1, 1]` (Keter / Chokmah-Binah / Chesed-Geburah / Tiferet / Netzach-Hod / Yesod / Malchut) is one of the 32 patterns and occurs with frequency `1/32 ≈ 3.1%`.

No special treatment is given to the canonical pattern at generation time; it is just one valid tree among equals.

---

## 3. Edge Rules

Four rules produce the full edge set. Pillars are referenced as `L` (left), `C` (center), `R` (right).

### 3.1 Pillar spines

Each pillar has a vertical spine connecting sequential occurrences of nodes in that pillar.

- **Center pillar:** every central node connects to the next central node below it (skipping intervening double layers).
- **Left pillar:** every `L` node connects to the next `L` node below it.
- **Right pillar:** every `R` node connects to the next `R` node below it.

### 3.2 Horizontal pair

In every double layer, the `L` and `R` nodes are connected.

### 3.3 Asymmetric bookend

At each boundary between a central node and an adjacent stretch of double layers:

- **Upper central → down:** connects only to the `L` and `R` of the *immediately adjacent* double layer below it.
- **Lower central → up:** connects to the `L` and `R` of *every* double layer in the stretch above it.

This asymmetry is adapted from the Kircher tree. It keeps the lower central node graph-dominant (echoing Malchut as the receiver of all upward flow) without duplicating the symmetry everywhere.

### 3.4 Adjacent-double cross

Whenever two double layers are directly adjacent (no central layer between them), connect them with an X:

- `L` of the upper layer → `R` of the lower layer
- `R` of the upper layer → `L` of the lower layer

In a stretch of `k` consecutive double layers, this produces `2 · (k - 1)` cross edges. Combined with the pillar spines (§3.1) and horizontal pairs (§3.2), every pair of consecutive doubles becomes fully cross-connected.

This rule is drawn from the canonical Kircher and Bahir renderings (e.g., Binah → Chesed, Chokmah → Geburah in the canonical tree) and restores the traditional 22-path count when applied to `[1, 2, 2, 1, 2, 1, 1]`.

### 3.5 Canonical edge count

The canonical `[1, 2, 2, 1, 2, 1, 1]` pattern produces exactly 22 edges, matching the traditional 22-path Tree of Life:

- 7 pillar spine
- 3 horizontal pair
- 4 upper-bookend
- 6 lower-bookend
- 2 adjacent-double cross (between L2 and L3)

---

## 4. Seeding

Seed source is **TBD**. Candidate approaches:

- **Fixed random per run** — maximum variety, no authored meaning attached.
- **Chart-derived** — each player's natal chart determines map shape; adds meaning but limits variety within a chart.
- **Hybrid** — run-random seed, chart biases per-layer probabilities.

The playground currently uses fixed random for design exploration.

---

## 5. Graph Properties

For any generated pattern, the following hold by construction:

- **Connected.** Every node is reachable from every other node via the edge rules.
- **Central nodes are articulation points.** Removing any central node disconnects the graph (apart from the trivial case of L1/L7 at the ends).
- **Deterministic from pattern.** Given the same 7-layer pattern, edges are identical. No additional RNG is used after pattern selection.

---

## 6. Open Questions

- Seed source (see §4).
- Whether layer probability stays at flat `0.5` or becomes chart-derived.
- Whether to guarantee a minimum traversal length or branch count.
- Encounter assignment per node and per (pillar, layer) coordinate.

---

## 7. Relationship to Other Specs

- `VIBES.md` — visual and felt qualities of the map (colors, aspect-lines, emanation feel).
- `MECHANICS.md` — encounter resolution once the player reaches a node.
- `CHART.md` — natal chart construction; may feed map seeding.
- `LORE.md` — map as symbolic structure; lore framing of emanation, bisection, and pillar meaning.
