# Space Prince — Free Tier

*A no-wallet, no-input way to play a single run, so anyone can try the game before owning one.*

**Status:** idea, not built.
Captured here to pick up later; nothing below is committed.

---

## The idea

A **Play a sample** affordance under *Cast Chart* on the mint screen.
It skips chart creation and drops the player straight onto a fresh map with a randomly-drawn chart and three unlocked planets.
Everything stays off-chain and local; no wallet, no birth data, no persistence.

The free tier is the *mechanics* — the combat, the tension, the feel of a run.
The paid tier is *identity and permanence* — owning your chart as a token, metaprogression, the star field, the artifact that evolves.
For a game whose thesis is meaning over power, that is the right line to draw: give away the play, charge for the self.

## What's free vs. paid

- **Free:** one map, random chart, three planets, off-chain, nothing kept.
- **Paid:** your real chart minted as a Prince, full seven-planet ascent, runs recorded onchain, NFT that reflects play.

## The core tension

A random chart quietly undercuts *play as yourself* — the emotional spine of the mint framing (*"nobody else is you"*).
Two coherent ways to hold it, leading to different buttons:

- **Random sample (leaning).** Zero friction, instant. The demo is explicitly *not you* → desire through absence: "this is a Prince; cast your own to play as yourself."
- **Your real chart, ephemeral.** Free players still enter birth data and play their actual chart, but it is one map and unowned → desire through loss-aversion: "cast it to keep it forever."

Lean is the random sample for a first cut — it is the lower-friction "anyone, instantly" the tier is for, and "that's a stranger, cast your own" is a genuine conversion line.

## What actually needs design

The **end-of-free-map moment** is the real conversion beat, not the entry button.
It should land as loss, not as "run over" — e.g. *"This Prince vanishes when you leave. Cast your own to keep it — and everything after."*

Smaller calls:

- Show the *full* random chart on the map (the artifact is a selling point) while only fielding three planets.
- "Play for Free" reads mobile-freemium against the voice; prefer **Play a sample** / **Try a run**.

## Implementation note

Cheap to prototype: the client is already fully local with a random chart in `localStorage`, and `state/dev-spawn.ts`'s `spawn('map')` already mints a real Prince + run at the map.
The free button is that path — capped to three planets and one map — on a real (non-dev) control, plus the end-of-map conversion screen.
