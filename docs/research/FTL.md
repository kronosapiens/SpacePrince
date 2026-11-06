# FTL: Faster Than Light — event inventory

Every text event in FTL (Advanced Edition), with its options, the prerequisites of its blue options, its outcomes, odds where the game or the wiki states them, and shape tags.
Compiled 2026-09-17 as research for Space Prince's narrative encounters; the cross-game analysis is in [SURVEY.md](SURVEY.md) and the Slay the Spire inventory in [STS.md](STS.md).
Source: the FTL fandom wiki, every page in its Random Events category read as raw wikitext through the wiki's MediaWiki API, because the rendered pages sit behind a bot challenge.
Each page's location header names the event's sectors and beacon flags, so the `Where:` lines come from game data rather than prose.
Setups are paraphrased; anything in quotation marks is the game's own text.

## Coverage

- 289 events, one entry each, from the category's 293 pages; the rest are redirects and stubs.
- Events that fire in three or more sector families are filed under "Sector-agnostic events" with their full sector list on the `Where:` line, so each race pool holds only what is specific to it.
- Quest chains are folded into their starting event.
  Shared reward tables (Save the Civilian Ship, Slaver Fight, Investigate the station, and others) are inlined where they apply and not counted as events.
- Scrap rewards are the wiki's tier words (low, medium, high, random) because the game scales the amount by sector and difficulty; fuel, missiles, drone parts, hull repairs, and service prices are exact.
- FTL never shows branch odds to the player, so most random outcomes are marked "odds hidden".
  Surrender and escape thresholds, the out-of-fuel wait odds, and a few in-text phrasings are the exceptions.
- Two nebula events, "Rebel fight in nebula" and "Pirate fight in nebula", are shadowed by same-named lists in the game files and can never fire; they are kept and marked.
- Rebel Stronghold shares the Rebel Controlled pool and adds "Rebel shipyard".
  There is no "Hostile Nebula" sector type; the nebula sectors are Uncharted Nebula and the two Slug nebulae.
- The Hidden Crystal Worlds pool is reachable only through the Crystal Cruiser chain, which starts in Rock or Engi space.

## Tag vocabulary

Each event carries tags from a fixed list shared with the Slay the Spire inventory, so the two corpora can be compared.

- `no-choice`: one option only.
- `trade`: pay a known cost for a known gain.
- `gamble`: the outcome is random; `(odds-shown)` when the game states the odds, `(odds-hidden)` when it does not.
- `gated`: an option appears only with a prerequisite (a crew race, a system level, a weapon, a drone, an augment); FTL's blue options.
- `fight`: combat is forced; `optional-fight` when it can be avoided.
- `chain`: a multi-beacon quest or a two-stage event.
- `push-your-luck`: a repeatable draw with escalating risk.
- `sacrifice`: give up a persistent asset (a crew member, a system, a stock of fuel) for a gain.
- `gift`: free gain with no cost.
- `tax`: forced loss with no gain.
- `walk-away`: an option to leave with no effect exists.
- `delayed`: a consequence lands later (a quest marker, a fleet-timer change).
- `moral`: the choice is framed as ethical with asymmetric payoff.

## Sector-agnostic events
*Events reachable from three or more different sector families, plus generic hazards, stores, filler, exit-beacon and distress events.
The `Where:` line names the exact sector list from the game data.*
### Asteroid belt distress
- Where: Civilian, Engi ×2, Pirate, Rebel ×2, Rock ×2, Uncharted Nebula — **distress beacon** (no ship), once per sector
- Setup: A small ship is being battered to pieces trying to manoeuvre out of an asteroid belt; its shields are already down.
- Choices:
  1. `Hail them to offer assistance.` then `Try to shield their ship with yours and escort them out of the field.` → three branches (odds hidden): **1 hull damage + a damaged room** and high fuel and scrap; **4 hull damage** and low scrap (they die anyway); or low scrap (they die, you are untouched).
  2. `Don't risk our ship. Leave them to their fate.` → two branches (odds hidden): they survive and spitefully promise to report you — **the Rebel fleet's pursuit doubles for 1 jump**; or they die and nothing happens.
  - `[requires: Defense Drone]` / `[requires: Repair Drone]` (costs 1 drone part) → two branches (odds hidden): **4 hull damage, 1 system damage, 1 room damaged** plus **a weapon with medium scrap**; or they survive and hand you a **Hidden Federation Base quest marker**.
  - `[requires: Teleporter]` `Offer to beam them aboard your ship.` → two branches (odds hidden): **a crewmember** (the captain, ship lost); or they ask to be taken home → high scrap / medium scrap / **10 hull repairs**.
  - `[requires: Rock Plating augment]` `Shield their ship with yours and escort them out.` → medium fuel and scrap, **no hull damage at all**.
- Resources: scrap, fuel, missiles, drone parts, weapon, crew (gain), hull (damage / repair), system (damage), quest marker, rebel fleet advance (accelerated)
- Tags: `gamble (odds-hidden)`, `gated`, `delayed`, `chain`, `moral`, `tax`
- Note: abandoning them can actively cost you fleet timer — the walk-away is not free.
### Asteroid mining colony
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), also exit beacon, once per sector
- Setup: A mining colony blockaded by the Rebels has run out of blasting explosives and asks for missiles.
- Choices:
  1. `(Missile Weapon) Offer to solve their problem by launching a missile.` → no effect; they cite workplace safety protocols ("isn't exactly what I'd call 'union-friendly'") and the menu reopens.
     A blue option that deliberately does nothing.
  2. `Give them the requested 5 missiles.` (−5 missiles) → three branches (odds hidden): **10 hull repairs**, **reactor upgraded**, or 15–25 scrap.
  3. `Give them 15 missiles.` (−15 missiles) → three branches (odds hidden): **15 hull repairs + reactor upgraded**; **an augmentation**; or 30–40 scrap + 5 hull repairs.
  4. `Decline.` → nothing happens.
- Resources: missiles, scrap, hull (repair), reactor, augment
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `gated`
### Auto-ship fight in asteroid field
- Where: Civilian, Mantis ×2, Pirate, Rebel ×2 — asteroid-field hazard beacon (ship detected), repeatable
- Setup: A Rebel automated scout is stationed in an asteroid belt.
- Choices:
  1. (single option) → fight an Auto-ship with asteroids striking both ships → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (hazard + combat), system (damage)
- Tags: `no-choice`, `fight`
### Auto-ship fight in nebula
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (ship detected), nebula filler, repeatable
- Setup: A Rebel scout hunting for you in the nebula.
  Five rotating intros.
- Choices:
  1. (single option) → fight an Auto-ship with your sensors out → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Auto-ship fight in plasma storm
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — plasma-storm beacon (no ship detected), nebula filler, once per sector
- Setup: A Rebel auto-scout attacks in a storm that halves your reactor output.
- Choices:
  1. `Prepare to fight.` → fight an Auto-ship at half power → medium scrap with resources.
  - `[requires: Engines level 3-5]` `Attempt to out-run it.` → two branches (odds hidden): you lose it, or you fight anyway.
  - `[requires: Engines level 6+]` `Attempt to out-run it.` → you lose it, guaranteed.
  - `[requires: Cloaking]` `Use your cloaking to escape.` → you lose it, guaranteed.
- Resources: scrap, fuel, missiles, drone parts, reactor (halved), hull (combat)
- Tags: `fight`, `gated`, `gamble (odds-hidden)`
- Note: a clean three-rung blue-option ladder — partial engines are a coin flip, better engines or cloaking are certain.
### Auto-ship fight
- Where: Abandoned, Civilian, Pirate, Rebel ×2, Zoltan ×2 — normal beacon (ship detected), repeatable
- Setup: A Rebel unmanned scout engages.
  Nine rotating intros, including "This is an automated message.
  Resisting our takeover is pointless.
  Prepare to die."
- Choices:
  1. (single option) → fight an Auto-ship → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Auto-ship near storage station in nebula
- Where: Civilian, Pirate, Rebel ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (ship detected), nebula filler, once per sector
- Setup: A Rebel auto-ship guards a small station; without sensors you cannot see what is inside.
- Choices:
  1. `Attack the automated ship to get to the station.` → fight the Auto-ship → medium scrap, then `Investigate the station`.
  2. `Avoid provoking the ship.` → nothing happens.
  - `[requires: Cloaking]` `Attempt to stealthily access the space station.` → two branches (odds hidden): caught and forced to fight, or in undetected.
  - `[requires: Cloaking level 2+]` → in undetected, guaranteed.
  - `[requires: Hacking]` `Try to hack the station to prevent an alert.` (costs 1 drone part) → two branches (odds hidden): caught, or in undetected.
  - `[requires: Hacking level 2+]` (costs 1 drone part) → in undetected, guaranteed.
- Investigate the station (four branches, odds hidden): **a weapon** with low scrap; **a drone schematic** with low scrap; medium resources with some scrap; or nothing.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), hull (combat)
- Tags: `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
### Auto-ship near storage station
- Where: Civilian, Engi ×2, Rebel ×2, Slug ×2, Zoltan ×2 — normal beacon (ship detected), exit beacon and filler, once per sector
- Setup: Same as above but with working sensors — you know the station holds military goods.
- Choices:
  1. `Attack the automated ship to get to the storage cache.` → fight → medium scrap, then `Investigate the station`.
  2. `Avoid provoking the ship.` → nothing happens.
  - `[requires: Cloaking]` `Attempt to cloak and access the cache.` → two branches (odds hidden): caught and forced to fight, or in undetected.
- Investigate the station: same four-branch table (weapon / drone schematic / medium resources with some scrap / nothing).
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), hull (combat)
- Tags: `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
- Note: the non-nebula version has fewer blue options than its nebula twin — the same situation is harder when you *can* see.
### Auto-ship warning in nebula
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (ship detected), nebula filler, once per sector
- Setup: A Rebel scout was posted here specifically to report your passing.
- Choices:
  1. (single option) → fight an Auto-ship that **starts charging its FTL immediately** (40% escape behaviour).
     If it escapes: **the Rebel fleet's pursuit doubles.**
     If you destroy it first: low scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet advance (accelerated on failure), hull (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `tax`
- Note: a rare fight with a *time* penalty for losing the race rather than a loot penalty.
### Auto-ship warning
- Where: Civilian, Mantis ×2, Rebel ×2 — normal beacon (ship detected), once per sector
- Setup: Identical situation outside a nebula; shares its nine intro texts with `Auto-ship fight`, so you cannot tell the two apart until the ship starts running.
- Choices:
  1. (single option) → fight a fleeing Auto-ship.
     Escapes → **Rebel fleet pursuit doubles**.
     Destroyed → low scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet advance (accelerated on failure), hull (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `tax`
### Boarders: Humans in nebula
- Where: Civilian, Pirate, Uncharted Nebula — nebula beacon (no ship), nebula filler, once per sector
- Setup: With sensors dead in the nebula, you hear shots inside your own ship before you see anything.
  Three intros.
- Choices:
  1. (single option) → **2–4 human boarders** aboard.
- Resources: crew (injure / lose), system (damage)
- Tags: `no-choice`, `fight`, `tax`
### Boarders: rebels in nebula
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (no ship), nebula filler, once per sector
- Setup: A Rebel teleporter fires from one of several nearby stations before you can scan them.
- Choices:
  1. (single option) → **3–4 human boarders** aboard.
- Resources: crew (injure / lose), system (damage)
- Tags: `no-choice`, `fight`, `tax`
### Capture the ship
- Where: Civilian, Rock ×2, Zoltan ×2 — normal beacon (no ship), once per sector.
  Two-stage.
- Setup: Ships convening around a station are discussing, on an open channel, their need to take an enemy ship **intact**.
- Choices (stage 1):
  1. `Offer your services.` → you are not "properly equipped"; nothing happens.
  2. `Leave them alone.` → nothing happens.
  - `[requires: Teleporter]` / `[requires: Fire Bomb]` / `[requires: Anti-Bio Beam]` → `Offer a solution` → `Agree to capture the ship.` places a **quest marker**; `Decline` gives nothing.
- Stage 2 (at the marker): fight a Pirate ship (no surrender, no escape).
  **Killing the crew** → **a weapon with high scrap**.
  **Destroying the ship** → a chain detonation: **15 hull damage, 1 system damage, 1 room damaged plus a breach** — the largest single hull hit any event can deal, and no reward.
- Resources: scrap, weapon, hull (damage), system (damage), quest marker
- Tags: `chain`, `delayed`, `gated`, `fight`, `tax`
- Note: the prerequisite is the *ability to board*, and the event tells you plainly what happens if you shoot instead.
### Crew hiring station
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, once per sector
- Setup: A tavern, rest stop or meeting beacon with mercenaries for hire.
  "If you're looking for some bodies to fill your ship, you've come to the right place!"
- Choices:
  1. `Hire a crewmember.` (−25–45 scrap) → **that crewmember**.
     The race and skills are shown before you commit.
  2. `Hire a crewmember.` (−25–55 scrap) → **that crewmember**, shown likewise.
  3. `Don't hire anyone.` → nothing happens.
- Resources: scrap, crew (gain)
- Tags: `trade`, `walk-away`
### Crushed pirate
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rock ×2, Uncharted Nebula — **distress beacon** (no ship), once per sector
- Setup: A pirate ship is pinned between two asteroids, having tried to mine the belt without proper equipment.
- Choices:
  1. `Try to dislodge the ship by shooting at the rocks.` → two branches (odds hidden): a mineral patch detonates — **2 hull damage, 2 system damage**, low scrap; or they pull free and give you medium scrap with resources.
  2. `Destroy and loot the ship. They're just pirates.` → two branches (odds hidden): medium scrap with resources; or a second pirate arrives and you fight (default rewards).
  - `[requires: Beam weapon]` `Carefully cut the ship out.` (Anti-Bio and Fire Beams excluded; Artillery Beam counts) → medium scrap with resources, guaranteed.
  - `[requires: Beam drone]` `Have your drone cut the ship out.` (costs 1 drone part) → medium scrap with resources, guaranteed.
- Resources: scrap, fuel, missiles, drone parts, hull (damage), system (damage)
- Tags: `gamble (odds-hidden)`, `gated`, `moral`
- Note: murder and rescue pay the same median; the blue options make rescue the only certain one.
### Deactivated Auto-ship
- Where: Abandoned, Engi ×2, Mantis ×2, Rebel ×2, Slug ×2, Zoltan ×2 — normal beacon (ship detected), filler, once per sector
- Setup: A pristine but deactivated Rebel scout floats at the beacon.
- Choices:
  1. `Attempt to download the ship's data stores.` → two branches (odds hidden): low scrap with resources **and the sector map revealed**; or you wake its AI and must fight it (medium scrap with resources).
  2. `Don't risk activating it, and just strip the ship for any useful scrap.` → low scrap, no risk.
  - `[requires: Sensors level 3]` `Remotely scan the ship.` → two branches (odds hidden): it is safe — low scrap with resources and the map; or it is on standby and you are *told so*, then choose `Yes` (back to the original coin flip) or `No` (nothing).
- Resources: scrap, fuel, missiles, drone parts, map reveal, hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`
- Note: the blue option buys information rather than a better outcome — it tells you when the gamble is bad.
### Empty nebula beacon
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (no ship), nebula filler, repeatable
- Setup: Nothing is here, and with sensors dead you cannot be sure of that.
  Nine flavour lines, all about waiting blind: "Your crew are constantly looking out of the windows...
  They jump at every creak and moan of the ship."
- Choices:
  1. (single option) → nothing happens.
- Resources: none
- Tags: `no-choice`
### Encrypted federation signal
- Where: Abandoned, Civilian, Engi ×2, Rebel ×2, Rock ×2, Zoltan ×2 — normal beacon (no ship), once per sector
- Setup: An encrypted Federation signal is broadcasting from a nearby planet.
- Choices:
  1. `Send an away party to investigate.` → five branches (odds hidden): a **Hidden Federation Base quest marker**; medium resources with some scrap plus a **Federation Base Assist quest marker**; high scrap with resources from a supply cache; a Rebel trap — **2–3 human boarders** plus a Rebel ship fight; or an outpost the Rebels already found, with bloodstains and nothing else.
  2. `It could be a trap, let's move on.` → nothing happens.
- Hidden Federation Base (later stage): a drone schematic with high scrap / **a crewmember** + low scrap with resources / **35 hull repairs** + medium scrap with resources / nothing found, with `[requires: Sensors 2 / Sensors 3 / Long-Ranged Scanners]` recovering medium scrap or a weapon with medium scrap.
- Federation Base Assist (later stage): fight an Auto-ship or, under Advanced Edition, an Elite Rebel ship, with a friendly **Anti-Ship Battery firing on your behalf**; rewards include **a crewmember**, a weapon, high scrap with resources and 7 hull repairs.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), crew (gain), hull (repair / combat), quest marker
- Tags: `gamble (odds-hidden)`, `chain`, `delayed`, `walk-away`, `fight`
### Escort civilians FTL haywire
- Where: Civilian, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Uncharted Nebula — **distress beacon** (ship detected), once per sector.
  Two-stage.
- Setup: A civilian ship's FTL navigation has failed and it cannot plot a course to a repair depot.
- Choices:
  1. `Lead them to their destination.` → low scrap and a **quest marker**.
  2. `Decline.` → nothing happens.
  - `[requires: FTL Navigation augment]` `Have your navigation software calculate and upload route instructions to their ship.` → **high scrap with resources immediately**, no escort needed.
- Stage 2 (the destination, four branches, odds hidden): it was a trap — fight a Rebel ship (default rewards); high scrap with resources; **5 hull repairs and a store opens**; or **reactor upgraded**.
- Resources: scrap, fuel, missiles, drone parts, hull (repair / combat), reactor, quest marker
- Tags: `chain`, `delayed`, `gated`, `gamble (odds-hidden)`, `walk-away`
- Note: the augment converts a two-jump errand with an ambush risk into an immediate payout.
### Escort civilians
- Where: Civilian, Engi ×2, Pirate, Rock ×2 — normal beacon (ship detected), repeatable.
  Two-stage.
- Setup: A lightly armed civilian ship wants an escort to a nearby system.
  Three rotating intros.
- Choices:
  1. `Accept.` → low fuel and a **quest marker**.
  2. `Decline.` → nothing happens.
- Stage 2: the same four-branch destination table as above — Rebel ambush / high scrap with resources / 5 repairs and a store / reactor upgraded.
- Resources: fuel, scrap, missiles, drone parts, hull (repair / combat), reactor, quest marker
- Tags: `chain`, `delayed`, `gamble (odds-hidden)`, `walk-away`
### Fire on research station
- Where: Abandoned, Civilian, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Uncharted Nebula, Zoltan ×2 — **distress beacon** (no ship), once per sector
- Setup: A laboratory fire is consuming a research station and its suppression system will not respond.
- Choices:
  1. `Send your crew in a shuttle to help put out the fire.` → two branches (odds hidden): **lose a crewmember** (Clone Bay revives) plus low scrap; or high scrap for saving some scientists.
  2. `Dock and try to rescue the survivors.` → two branches (odds hidden): the station explodes — **4 hull damage, 1 system damage**, low scrap; or **a crewmember named Dr.
     Jones** plus low scrap.
  3. `Leave.` → nothing happens.
  - `[requires: Rock crew]` `Send your Rock crew-member in.` → **an augmentation with high scrap**, nobody hurt.
  - `[requires: Repair Drone]` `Send your repair drone into the fire.` → **a drone schematic with high scrap**, nobody hurt.
- Resources: scrap, crew (gain / lose), augment, drone (schematic), hull (damage), system (damage)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`, `moral`
### Free drone schematic
- Where: every sector family except Abandoned and Last Stand — normal beacon (no ship), exit beacon, repeatable
- Setup: Someone hands you drone plans.
  Six intros, including a stray marketing blast: "Free schematic samples!
  Be sure to visit our new military-grade drone store opening in sector XR1-45!"
- Choices:
  1. (single option) → **a drone schematic** with low scrap.
- Resources: drone (schematic), scrap
- Tags: `no-choice`, `gift`
### Free scrap with resources
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — normal beacon (no ship), exit beacon, repeatable
- Setup: Free salvage or a sympathiser's gift.
  Six intros, including a crewless pirate ship with no explanation for where its crew went.
- Choices:
  1. (single option) → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts
- Tags: `no-choice`, `gift`
### Free weapon
- Where: Civilian, Crystal, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, repeatable
- Setup: A weapon turns up.
  Six intros; the first is simply "Holy crap!
  A weapon is just floating in space!"
- Choices:
  1. (single option) → **a weapon** with low scrap.
- Resources: weapon, scrap
- Tags: `no-choice`, `gift`
### Friendly ship out of fuel
- Where: Abandoned, Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Uncharted Nebula, Zoltan ×2 — **distress beacon** (ship detected), repeatable
- Setup: A stranded ship asks for fuel.
  Five rotating intros.
- Choices:
  1. `Give them the fuel.` (−2–4 fuel; the exact amount is shown before you commit) → four branches (odds hidden): high scrap (two of the variants); **a weapon**; **the sector map revealed**; or **reactor upgraded**.
  2. `Apologize, wish them luck, and continue on.` → nothing happens.
- Resources: fuel, scrap, weapon, map reveal, reactor
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `moral`
### Giant alien spiders
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rock ×2, Uncharted Nebula — **distress beacon** (no ship), once per sector
- Setup: Ships are fleeing a station.
  "Help!
  We're being overrun by some sort of giant alien spiders!"
- Choices:
  1. `Send the crew to help! Giant alien spiders are no joke.` → two branches (odds hidden): **lose a crewmember** (Clone Bay revives); or you beat them back and receive high resources with some scrap.
  2. `Leave them alone.` → nothing happens.
  - `[requires: Anti-Personnel Drone]` `Send your battle drone in to help.` (costs 1 drone part) → medium resources with some scrap.
  - `[requires: Boarding Drone]` `Launch a Boarding drone into the station.` (costs 1 drone part) → the drone breaches the hull and vents the corpses into space; the owners pay you only low scrap with resources.
  - `[requires: Anti-Bio Beam]` `Use the beam to pick off the spiders.` → high resources with some scrap.
- Resources: scrap, fuel, missiles, drone parts, crew (lose)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`, `moral`
- Note: the game's most notorious event — the plain option loses a crewmember roughly half the time, and "Giant alien spiders are no joke" became a community catchphrase.
### Improve reactor for supplies
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, once per sector
- Setup: An engineer heading home offers to improve your reactor in exchange for military supplies.
- Choices:
  1. `Agree to the trade.` (one of: −3–5 missiles and 0–2 drone parts; −0–2 missiles and 2–3 drone parts; −2–3 fuel, 0–2 missiles and 0–2 drone parts — the exact cost is shown first) → **reactor upgraded**.
  2. `Respectfully decline.` → nothing happens.
- Resources: missiles, drone parts, fuel, reactor
- Tags: `trade`, `walk-away`
- Note: bugged — a maxed reactor does not block the trade; you pay and get nothing.
### Large asteroid field
- Where: Abandoned, Civilian, Engi ×2, Pirate, Slug ×2, Zoltan ×2 — normal beacon (no ship), exit beacon and filler, once per sector
- Setup: A large asteroid field you can scavenge while the FTL charges.
- Choices:
  1. `Explore the asteroid field.` → six branches (odds hidden): high fuel; medium missiles and scrap; medium drone parts and scrap; **a pirate ambush** (default rewards, fought inside the asteroid field); **5 hull damage, 1 system damage, 1 room damaged**; or nothing.
  2. `Too dangerous. We'll just wait for the FTL to charge.` → nothing happens.
  - `[requires: Scrap Recovery Arm augment]` `Attempt to mine the asteroids.` → **high scrap**, guaranteed, no risk.
- Resources: scrap, fuel, missiles, drone parts, hull (damage), system (damage)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `optional-fight`
- Note: the only event in the game that uses the Scrap Recovery Arm as a blue-option prerequisite.
### Large trade station
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, once per sector
- Setup: A large trade station broadcasts a warning about you as you arrive: "Do not associate with the Federation sympathizer."
- Choices:
  1. `Search among the stores to see if someone will sell to you.` → four branches (odds hidden): an Auto-ship attacks (two of the variants) for medium scrap with resources; a sympathiser's shuttle gives random scrap with resources; or **a store opens**.
  2. `Leave.` → nothing happens.
  - `[requires: Mind Control]` `Alter the announcer's opinions.` → **a store opens**, guaranteed.
  - `[requires: Mind Control level 2]` → medium scrap with resources **and a store opens**.
- Resources: scrap, fuel, missiles, drone parts, plus everything a store can sell; hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `optional-fight`, `trade`
### Malfunctioning defense system
- Where: Abandoned, Civilian, Engi ×2, Mantis ×2, Pirate, Rock ×2, Uncharted Nebula, Zoltan ×2 — **distress beacon** (no ship), once per sector
- Setup: A station's satellite defence system has gone haywire and is shooting at its own repair crews.
- Choices:
  1. `Promise to help.` then `Simply fire on the defense system from a distance.` → two branches (odds hidden): you cannot penetrate its shields — **5 hull damage, 1 system damage, 1 room damaged with a breach**, nothing gained; or you destroy it, the station is unhappy with your "solution", low scrap with resources.
  2. `Leave them alone.` → nothing happens.
  - `[requires: Ion weapon]` `Disable the defense system.` (any ion weapon, including Ion and Stun Bombs; no missile ammo is used) → high scrap with resources.
  - `[requires: Cloaking]` `Use your cloaking to disable the system.` → cloak fails; you destroy it; low scrap with resources.
  - `[requires: Cloaking level 2]` → medium scrap with resources.
  - `[requires: Cloaking level 3]` → high scrap with resources.
  - `[requires: Engi crew]` `Remotely repair its targeting system.` → high scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (damage), system (damage)
- Tags: `gated`, `gamble (odds-hidden)`, `walk-away`
- Note: six prerequisites in one event, and they form a clean ladder — the payout scales exactly with how surgically you can solve it.
### Merchant's request
- Where: Civilian, Engi ×2, Pirate, Rebel ×2 — normal beacon (no ship), once per sector.
  Multi-stage.
- Setup: A merchant is broadcasting for a mercenary ship.
  Two different jobs, chosen at random (odds hidden).
- Choices (stage 1):
  1. `Yes.` → either the **delivery** job (`Accept` → **+5 drone parts** and a Merchant's Delivery quest marker) or the **investigation** job (`Accept` → a Merchant's Investigation quest marker). `Decline` on either gives nothing.
  2. `No.` → nothing happens.
- **Merchant's Delivery** (at the marker): either the station does not respond — which runs the `Research station with no response` event (neurotoxin-maddened scientists, crew loss or crew gain depending on Medbay/Teleporter prerequisites) — or it does:
  - `Accept the paltry payment.` (−5 drone parts) → +20–30 scrap.
  - `Refuse and keep the drone parts.` → two branches (odds hidden): he was bluffing and offers +40–55 scrap; or he disconnects and you get nothing.
  - `[requires: Mind Control]` `Convince him that he's being 'unfair'.` → +40–55 scrap, guaranteed.
  - `[requires: Weapon Control level 6+]` `Remain silent but power up your weapons.` → **+55–70 scrap and +2–5 fuel**, the best outcome, and the only one where the offer is *not* shown first.
- **Merchant's Investigation** (at the marker, three branches, odds hidden): a wreck with intact cargo (medium scrap with resources, then `Take the cargo and head to its original destination` → a Deliver quest marker, or `Take the cargo for yourself` → `Investigate the cargo`); a damaged ship whose crew offers to join (`Promise to deliver` → **a crewmember** + Deliver marker; `Take the cargo but drop them off`; or `[requires: Teleporter]` beam the cargo and abandon them); or a rescue fight against a Pirate ship (medium scrap with resources).
- **Investigate the cargo** (odds hidden): food and medical supplies (Deliver marker only); **a weapon**; or high scrap with resources.
- **Deliver to the Station**: **a drone schematic with medium scrap**.
- Resources: scrap, fuel, drone parts, weapon, drone (schematic), crew (gain / lose), quest marker, hull (combat)
- Tags: `chain`, `delayed`, `gated`, `gamble (odds-hidden)`, `trade`, `moral`, `walk-away`
- Note: the deepest branching event in this group — up to four beacons and three different quest markers.
### Nebula lost ship
- Where: Civilian, Pirate, Rebel ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (no ship), nebula filler, once per sector
- Setup: A heavily damaged Federation ship hiding in the nebula fades from view before you can hail it.
- Choices:
  1. `Attempt to follow and help them.` → three branches (odds hidden): **a crewmember**; you find the Rebel ship they were hiding from instead (default rewards); or nothing.
  2. `Keep your position, they can handle themselves.` → nothing happens.
  - `[requires: Teleporter]` `Lock onto their life-signs with your teleporter.` → **a crewmember** and medium scrap, guaranteed.
  - `[requires: Long-Ranged Scanners]` `Pump extra power into your sensors and try to track them.` → two branches (odds hidden): **a crewmember**; or you find only an empty stripped hull (medium scrap).
- Resources: scrap, crew (gain), hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `optional-fight`
### Pirate briber
- Where: Abandoned, Civilian, Engi ×2, Pirate, Slug ×2, Uncharted Nebula, Zoltan ×2 — normal beacon (ship detected), exit beacon and filler, once per sector
- Setup: A pirate mid-pursuit offers to pay you to look the other way.
  Three rotating intros.
- Choices:
  1. `Accept their bribe.` → low scrap with resources.
  2. `Try to be a hero. Attack the pirate.` → fight: **70% surrender offer at 30–40% hull** (`Accept the more generous bribe and leave.` → high resources with some scrap; or keep fighting); **60% escape attempt at 30–40% hull**.
     Destroyed → random scrap; crew killed → medium scrap with resources.
     Then the rescued ship gives (odds hidden): **a store opens**; **15 hull repairs**; it was actually a Rebel scout — `Destroy the ship and salvage it` (low scrap with resources) or `Use the leverage you gained by saving their lives to convince them to delay the pursuing fleet` (**the Rebel fleet is delayed 1 jump**); medium scrap (they suffocated during your fight); or nothing.
- Resources: scrap, fuel, missiles, drone parts, hull (repair / combat), rebel fleet advance (delayed), store access
- Tags: `gamble (odds-shown)`, `trade`, `optional-fight`, `moral`
- Note: the bribe is the certain small payout; heroism is a wide distribution that can include a store, 15 repairs, or nothing.
### Pirate engine hacker
- Where: Civilian, Engi ×2, Pirate — normal beacon (ship detected), once per sector
- Setup: A pirate with advanced hacking tools tries to shut down your engines as you arrive.
- Choices:
  1. `Continue...` → fight the Pirate ship **with Engines pinned at level 1** (no surrender, no escape).
     Destroyed → random fuel and scrap; crew killed → medium fuel and scrap.
  - `[requires: Hacking]` `Counter the remote hacking.` → engines intact; you fight **with Hacking offline** instead.
    Same rewards.
- Resources: fuel, scrap, system (temporarily crippled), hull (combat)
- Tags: `no-choice`, `fight`, `gated`, `tax`
### Pirate fight in asteroid field
- Where: Civilian, Engi ×2, Pirate — asteroid-field hazard beacon (ship detected), repeatable
- Setup: A pirate ambush from inside an asteroid field.
- Choices:
  1. `Turn and fight.` → fight a Pirate ship (default rewards) while asteroids strike both ships.
- Resources: scrap, fuel, missiles, drone parts, hull (hazard + combat), system (damage)
- Tags: `no-choice`, `fight`
### Pirate fight near pulsar
- Where: Civilian, Engi ×2, Pirate — pulsar hazard beacon (ship detected), once per sector
- Setup: A pirate attacks near a pulsar, whose regular ion pulses knock out systems on both ships.
  Three rotating intros.
- Choices:
  1. (single option) → fight a Pirate ship (default rewards) under periodic ion bursts.
- Resources: scrap, fuel, missiles, drone parts, system (ion damage), hull (combat)
- Tags: `no-choice`, `fight`
### Pirate fight near sun
- Where: Civilian, Engi ×2, Pirate — red-giant hazard beacon (ship detected), once per sector
- Setup: "This beacon has been placed too close to a super-giant class M star!
  The ship will gradually overheat until you get out of here... or die."
  A pirate engages anyway.
- Choices:
  1. (single option) → fight a Pirate ship (default rewards) while solar flares set fires aboard both ships.
- Resources: scrap, fuel, missiles, drone parts, hull (hazard + combat), system (fire damage), crew (fire)
- Tags: `no-choice`, `fight`
### Pirate fight
- Where: Civilian, Engi ×2, Pirate — normal beacon (ship detected), repeatable
- Setup: A pirate attacks.
  Five rotating intros, one of which is "Haha!
  I am the dread pirate Tuco, prepare to die!"
- Choices:
  1. (single option) → fight a Pirate ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Pirate ship attacking civilian distress
- Where: Civilian, Pirate, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship; written as distress but mis-tagged), repeatable
- Setup: A civilian's distress beacon; a pirate is chasing them.
- Choices:
  1. `Aid the civilian ship` → fight the Pirate ship (no surrender, no escape) → medium scrap with resources (high if crew killed), then the `Save the Civilian Ship` roll.
  2. `Stay out of it.` → nothing happens; after a time the distress calls stop.
  - `[requires: Weapon Control level 6+]` `Fire a warning shot from your strongest weapon.` → two branches (odds hidden): they engage you anyway; or **they flee without a fight** and you collect the civilian reward for free.
- Resources: scrap, fuel, missiles, drone parts, weapon, crew (gain), hull (repair / combat)
- Tags: `optional-fight`, `walk-away`, `gated`, `gamble (odds-hidden)`, `moral`
### Pirate ship attacking civilian
- Where: Civilian, Pirate, Rock ×2, Slug ×2 — normal beacon (no ship), exit beacon and filler, repeatable
- Setup: The same scene, six rotating intros, but **without** the warning-shot blue option.
- Choices:
  1. `Aid the civilian ship.` → fight the Pirate ship → medium scrap with resources (high if crew killed), then the `Save the Civilian Ship` roll.
  2. `Stay out of it.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, crew (gain), hull (repair / combat)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
### Pirate ship distress trap
- Where: Abandoned, Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — **distress beacon** (ship detected), once per sector
- Setup: The distress call was bait.
  Four rotating intros, including "Haha!
  I knew someone would fall into our dastardly trap!"
- Choices:
  1. (single option) → fight a Pirate ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
- Note: this is the event that makes every distress beacon a real risk — it appears in every sector family.
### Pirate ship selling weapon
- Where: Civilian, Slug ×2, Uncharted Nebula — nebula beacon (ship detected), nebula filler, once per sector
- Setup: A black-market weapons trader in the nebula, pitching hard.
- Choices:
  1. `Ignore the ship.` → nothing happens.
  2. `Attack the ship.` → fight the Pirate ship (default rewards; 50% surrender at 30–40% hull, 50% escape at 20–40% hull).
  3. `Purchase an unknown weapon.` (−45 scrap) → two branches (odds hidden): **a weapon**, unseen before purchase; or he takes the scrap and reneges — then `Attack the ship!` or `Learn a valuable lesson and move on.` The 45 scrap is never refunded, even if you win the fight.
  - `[requires: Mind Control]` `Convince him to make it a better deal.` → two branches (odds hidden): the weapon is **shown before you buy** at the same 45 scrap; or he lets slip that it was a set-up and you fight.
- Resources: scrap, weapon, hull (combat)
- Tags: `trade`, `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`
- Note: the blue option buys *information* (seeing the weapon) rather than a discount.
### Pirate smuggler
- Where: Civilian, Pirate, Uncharted Nebula — nebula beacon (no ship), nebula filler, repeatable
- Setup: A pirate that arrives just after you is clearly avoiding beacons — a smuggler.
- Choices:
  1. `Attack the pirate.` → fight: it starts escaping at 30–40% hull on a 35-second timer (nothing if it gets away); 50% surrender offer at 20–40% hull (`Accept their offer.` → random resources with some scrap).
     Destroyed or crew killed → the shared smuggler/transport cargo table (odds hidden): **a weapon** with medium or random scrap; **a drone schematic** with medium scrap; **a crewmember** with low scrap with resources or high scrap; **the sector map revealed** plus medium scrap; high scrap with resources; medium drone parts and scrap; medium scrap; or low scrap with resources.
  2. `Ignore the ship.` → nothing happens.
  - `[requires: Weapon Control level 6+]` `Activate your advanced weapons threateningly.` → they offer a bribe: `Take their bribe.` → medium fuel and scrap, no fight; or attack anyway.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), crew (gain), map reveal, hull (combat)
- Tags: `optional-fight`, `gated`, `gamble (odds-shown)`, `walk-away`
### Pirate toll
- Where: Civilian, Engi ×2, Pirate — normal beacon (ship detected), repeatable
- Setup: "Greetings and welcome to our beacon!
  For a small fee, we'll let you continue on your way."
- Choices:
  1. `Pay their toll.` (−15–25 scrap) → you avoid the fight entirely.
  2. `Reject their 'offer'.` → fight a Pirate ship (default rewards; can surrender or escape).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `trade`, `optional-fight`
- Note: the purest expression of FTL's core tension — scrap now versus hull and time.
### Plasma storm incapacitated ships
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — plasma-storm beacon (no ship), nebula filler, once per sector
- Setup: A ship graveyard lit by lightning, with your reactor at half power and no detection equipment.
- Choices:
  1. `Manually search the wreckage for survivors and equipment.` → five branches (odds hidden): **4 hull damage and a breach** plus high resources with some scrap; **a crewmember** + low scrap with resources; **lose a crewmember** (Clone Bay revives) + low scrap with resources; **a drone schematic** with medium scrap; or **a weapon** with medium scrap.
  2. `Avoid the risk and wait to jump away unscathed.` → nothing happens.
  - `[requires: Piloting level 2+]` `Have your pilot carefully explore the debris.` → four branches (odds hidden), **none of them losing a crewmember or damaging the hull**: a crewmember + low scrap with resources; a drone schematic with medium scrap; a weapon with low scrap; or nothing.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), crew (gain / lose), hull (damage), reactor (halved)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`
### Rebel fight choice in nebula
- Where: Civilian, Pirate, Rebel ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (ship detected), nebula filler, once per sector
- Setup: You emerge far from the beacon and spot a Rebel ship stationed to look for you.
- Choices:
  1. `Attack the ship.` → fight a Rebel ship (default rewards).
  2. `Attempt to remain concealed.` → three branches (odds hidden): spotted — `Prepare to fight` or `[requires: Engines level 4+]` `Fully power the engines to out-run them` (escape clean); spotted and lost them, but **the fleet's pursuit doubles for 1 jump**; or unnoticed, nothing happens.
  - `[requires: Cloaking]` `Cloak to stay hidden.` → you slip away undetected, guaranteed.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet advance (accelerated), hull (combat)
- Tags: `optional-fight`, `gated`, `gamble (odds-hidden)`, `walk-away`
### Rebel fight in nebula
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (ship detected), nebula filler, repeatable
- Setup: A Rebel scout waiting in the nebula.
  Seven rotating intros.
- Choices:
  1. (single option) → fight a Rebel ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
- Note: **this event can never actually fire.**
  The data file contains an event *list* with the same name, so the game always substitutes a random other nebula event (Auto-ship fight in nebula, Empty nebula beacon, Nebula lost ship, Plasma storm incapacitated ships, Trade resources in nebula, and so on).
### Rebel fight in plasma storm
- Where: Civilian, Pirate, Rebel ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — plasma-storm beacon (ship detected), nebula filler, once per sector
- Setup: A Rebel scout waiting in a storm that halves both reactors.
- Choices:
  1. (single option) → fight a Rebel ship (default rewards) at half power.
- Resources: scrap, fuel, missiles, drone parts, reactor (halved), hull (combat)
- Tags: `no-choice`, `fight`
### Rebel fight near pulsar
- Where: Civilian, Mantis ×2, Rebel ×2, Zoltan ×2 — pulsar hazard beacon (ship detected), once per sector
- Setup: A Rebel engages near a pulsar.
  Three rotating intros, one of them a captain seeing his chance to escape "backwater assignments."
- Choices:
  1. (single option) → fight a Rebel ship (default rewards) under periodic ion bursts.
- Resources: scrap, fuel, missiles, drone parts, system (ion damage), hull (combat)
- Tags: `no-choice`, `fight`
### Rebel fight
- Where: Abandoned, Civilian, Engi ×2, Mantis ×2, Rebel ×2, The Last Stand, Zoltan ×2 — normal beacon (ship detected), repeatable
- Setup: A Rebel ship attacks.
  Ten rotating intros, several of them oddly sympathetic: "Personally, I'd have stuck with the Federation.
  But I'm a soldier, sir, and I'm no use without a war to fight."
- Choices:
  1. (single option) → fight a Rebel ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Rebel ship attacking Federation loyalists
- Where: Civilian, Pirate, Rebel ×2, Rock ×2, Uncharted Nebula — normal beacon (no ship; written as distress but mis-tagged), once per sector
- Setup: A Rebel scout is running down a transport carrying Federation loyalists.
  Three rotating intros.
- Choices:
  1. `Aid the Federation ship.` → fight a Rebel ship (no surrender, no escape) → medium scrap with resources, then contact (odds hidden): a **Hidden Federation Base quest marker**; medium scrap with resources; or their ship is dying —
     - `Quickly try to rescue the crew.` → **a crewmember** + low scrap with resources.
     - `[requires: Engi Med-bot Dispersal augment]` → **a crewmember with 1 skill in shields** + high fuel and scrap.
     - `[requires: Teleporter]` → **a crewmember with 1 skill in combat**, medium scrap, **and a Hidden Federation Base marker**.
     - `[requires: Healing Burst weapon]` (costs 1 missile) → **a crewmember with 1 skill in engines**, medium scrap, **and a Hidden Federation Base marker**.
  2. `Use this chance to escape.` → nothing happens, though the text notes you feel you should have helped.
- Resources: scrap, fuel, missiles, crew (gain), quest marker, hull (combat)
- Tags: `optional-fight`, `gated`, `gamble (odds-hidden)`, `chain`, `delayed`, `walk-away`, `moral`
### Rebel ship attacking refueling outpost
- Where: Civilian, Rebel ×2, The Last Stand — normal beacon (ship detected), once per sector
- Setup: A Rebel scout has its weapons charged on a small refueling outpost but has not fired yet.
- Choices:
  1. `Intervene to defend the outpost.` → fight a Rebel ship (no surrender, no escape) → medium scrap with resources (high if crew killed), then the outpost adds medium fuel and scrap.
  2. `Avoid the conflict.` → nothing; the outpost gives the Rebels what they want.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `optional-fight`, `walk-away`, `moral`
### Rebel ship warning
- Where: Civilian, Engi ×2, Rebel ×2 — normal beacon (ship detected), once per sector
- Setup: A forward scout that will report your position if it survives.
- Choices:
  1. (single option) → fight a fleeing Rebel ship (40-second escape timer, never surrenders).
     Escapes → **the Rebel fleet's pursuit doubles.**
     Destroyed or crew killed → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet advance (accelerated on failure), hull (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `tax`
### Rebel transport ship
- Where: Civilian, Mantis ×2, Rebel ×2, Slug ×2 — normal beacon (ship detected), exit beacon and filler, once per sector
- Setup: A Rebel ship refitted for transport rather than combat, visibly unwilling to engage.
- Choices:
  1. `Demand the surrender of their goods.` → fight a fleeing Rebel ship (40-second timer, never surrenders).
     If it escapes, **the fleet is not accelerated** — you simply get nothing.
     Destroyed or crew killed → the shared cargo table: **a weapon** with medium or random scrap / **a drone schematic** with medium scrap / **a crewmember** (+low scrap with resources, or high scrap) / **the sector map revealed** plus medium scrap / high scrap with resources / medium drone parts and scrap / medium scrap / low scrap with resources.
  2. `Avoid the ship.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), crew (gain), map reveal, hull (combat)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
- Note: identical reward table to `Pirate smuggler` — attacking an unarmed transport is one of the better expected-value plays in the game.
### Refueling platform
- Where: Abandoned, Engi ×2, Slug ×2 — normal beacon (no ship), exit beacon and filler, once per sector
- Setup: A small automated fuel platform cheerily broadcasting prices in a spectrum of languages.
- Choices:
  1. `Dock with the refueling platform.` → five branches (odds hidden):
     - A normal sale: `Accept it.` (−5–10 scrap) → **+5 fuel**; or `Reject it.`
     - It is damaged: `Steal it.` → **+3–5 fuel**; or `War doesn't justify abandoning one's values. You leave it alone.` → nothing.
     - It may ignite: `Quickly dock and refuel.` → two sub-branches (odds hidden), **+5 fuel**, or the station explodes — **3 hull damage, 3 engine damage, −3 fuel**; or give it a wide berth.
     - A pirate ambush at the pump: `Wait for them to finish.` → **3 hull damage, 3 engine damage, 2–4 boarders**; `[requires: Door System level 2+]` `Seal your blast doors` → the ambush backfires and you take the station's fuel (**+5 fuel**).
     - A pirate ambush plus a ship: **3 hull damage, 3 engine damage** and a Pirate ship fight.
  2. `Ignore the refueling platform.` → usually nothing, but on one of three rolls a pirate that was using the platform as bait attacks anyway.
- Resources: fuel, scrap, hull (damage), system (damage), crew (boarding)
- Tags: `gamble (odds-hidden)`, `gated`, `trade`, `moral`
- Note: even ignoring it is a gamble — there is no fully safe option.
### Refueling station
- Where: Civilian, Crystal, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — normal beacon (no ship), exit beacon, once per sector
- Setup: A fuel station at a fixed rate of 2 scrap per fuel.
- Choices:
  1. `Buy 6 Fuel for 12 Scrap.` (−12 scrap) → +6 fuel.
  2. `Buy 3 Fuel for 6 Scrap.` (−6 scrap) → +3 fuel.
  3. `Buy 1 Fuel for 2 Scrap.` (−2 scrap) → +1 fuel.
  4. `Ignore the station.` → nothing happens.
- Resources: scrap, fuel
- Tags: `trade`, `walk-away`
### Refugee comms down
- Where: Civilian, Pirate, Uncharted Nebula — **distress beacon** (no ship), repeatable
- Setup: A refugee ship that ran out of fuel fleeing the Rebels, distress beacon on, comms dead, unclear whether anyone is alive aboard.
- Choices:
  1. `Prepare to board and investigate.` → five branches (odds hidden): the starving crew turned cannibal and **you lose a crewmember** (Clone Bay revives); **a survivor found locked in the freezer** joins you; medium missiles and scrap from the hold; **2–4 human boarders** teleport aboard; or the ship is a total ghost — no crew, no cargo, nothing.
  2. `Ignore the ship.` → nothing happens.
- Resources: missiles, scrap, crew (gain / lose)
- Tags: `gamble (odds-hidden)`, `walk-away`, `sacrifice`
- Note: the best single-sentence example of the register — "you find one surviving crewman locked in the freezer, almost perfectly preserved and apparently overlooked by the starving crew."
### Refugee distress
- Where: Civilian, Pirate, Uncharted Nebula — **distress beacon** (no ship), repeatable
- Setup: The generic refugee ship, reached via its distress beacon.
- Choices:
  1. `Hail them.` → four branches (odds hidden): a **shown trade** (1–2 drone parts → 5–10 fuel; 1–2 fuel → 4–5 missiles; 2–3 missiles → 2–3 drone parts; 2–4 missiles → 4–10 fuel), with `Politely decline` available; **a pirate ambush** using them as bait; **a Zoltan ship** accusing you of escorting fugitives; or **a Slug ship** that was hunting them for sport.
     Each ambush fight gives medium scrap with resources (high if crew killed) plus low scrap with resources afterwards.
  2. `Ignore the refugees.` → nothing happens.
- Resources: fuel, missiles, drone parts, scrap, hull (combat)
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `optional-fight`
### Refugee
- Where: Civilian, Engi ×2, Slug ×2 — normal beacon (no ship), exit beacon and filler, repeatable
- Setup: The same refugee ship at a normal beacon — "It doesn't appear to have detected you... or else it is trying to avoid notice."
- Choices: same as `Refugee distress` — a shown trade, or one of three ambushes, or ignore.
- Resources: fuel, missiles, drone parts, scrap, hull (combat)
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `optional-fight`
### Repair station
- Where: Civilian, Crystal, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — normal beacon (no ship), exit beacon, once per sector
- Setup: A drone-fitted repair station.
  "We don't know who you are and we don't care, but this is the right place for some ship repair!"
- Choices:
  1. `Repair 20 damage.` (−40 scrap) → 20 hull repairs.
  2. `Repair 10 damage.` (−20 scrap) → 10 hull repairs.
  3. `Repair 5 damage.` (−10 scrap) → 5 hull repairs.
  4. `Ignore the station.` → nothing happens.
- Resources: scrap, hull (repair)
- Tags: `trade`, `walk-away`
- Note: a flat 2 scrap per hull point, everywhere — the price floor against which store repairs are judged.
### Sell drone parts for scrap
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, once per sector
- Setup: A war-damaged civilian station buying drone parts to speed its repairs.
- Choices:
  1. `Sell 3 drone parts for 12 scrap.` / 2. `Sell 6 for 24.` / 3. `Sell 12 for 48.` → a flat 4 scrap per part.
  4. `Ignore the station.` → nothing happens.
- Resources: drone parts, scrap
- Tags: `trade`, `walk-away`
- Note: the Scrap Recovery Arm augment changes the payout.
### Sell missiles for scrap
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, once per sector
- Setup: A black-market hub buying "military-grade explosives."
- Choices:
  1. `Sell 5 missiles for 15 scrap.` / 2. `Sell 10 for 30.` / 3. `Sell 15 for 45.` → a flat 3 scrap per missile.
  4. `Ignore the station.` → nothing happens.
- Resources: missiles, scrap
- Tags: `trade`, `walk-away`
### Settlement mercenary work
- Where: Civilian, Engi ×2, Pirate, Rock ×2 — normal beacon (no ship), once per sector.
  Two-stage.
- Setup: A settlement notices your ship is built for combat and offers work.
- Choices:
  1. `Listen to their offer.` → two jobs (odds hidden):
     - *Discourage the pirates*: `Accept.` → fight a Pirate ship that **surrenders at 30–40% hull**. `Let them live and then return to the settlement.` → **a weapon with medium scrap**. `Forget your promise, they die!` → the fight continues; killing them gives only low scrap with resources and you cannot go back.
     - *Save the space dock*: `Agree to rescue the store.` → a **quest marker**.
       At the marker: `Engage the Rebel and rescue the space dock.` → medium scrap, **5 hull repairs and a store opens**. `Avoid a fight.` → nothing, and everyone on the moon dies.
  2. `Decline.` → nothing happens.
- Resources: scrap, weapon, hull (repair / combat), quest marker, store access
- Tags: `chain`, `delayed`, `gamble (odds-hidden)`, `walk-away`, `moral`, `optional-fight`
- Note: keeping your word pays roughly four times what breaking it does.
### Single life form on moon
- Where: Abandoned, Civilian, Pirate, Rock ×2, Uncharted Nebula, Zoltan ×2 — **distress beacon** (no ship), once per sector
- Setup: A single life sign on a moon's surface, broadcasting distress.
- Choices:
  1. `Go down to the surface to investigate.` → two branches (odds hidden):
     - *A lone survivor of an attacked colony*: `Invite him to join your crew.` → **a crewmember named Charlie with 1 skill** in weapons, shields, piloting, engines, combat or repair (which one is random). `Take him home to his family` → high scrap / medium scrap / **10 hull repairs**.
     - *A man living alone in a cave for years, mental state questionable*: `Bring him back to your ship in hopes of finding some help for him.` → four branches (odds hidden): he turns violent and **you lose a crewmember** (Clone Bay revives); **a crewmember named Charlie**; he blows himself up — **5 hull damage, 1 system damage**; or he collapses dying, where `[requires: Medbay level 2+]` or `[requires: Clone Bay level 2+]` saves him as a crewmember. `Leave the madman to his ravings` → nothing. `[requires: Medbay level 2]` → a crewmember. `[requires: Medbay level 3]` → **a crewmember with 1 skill in every skill**. `[requires: Slug crew]` → the Slug reads his mind: a Human crewmember, or a warning to leave him alone.
  2. `Ignore the signal.` → nothing happens.
- Resources: scrap, crew (gain / lose), hull (damage / repair), system (damage)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`, `moral`
- Note: a Star Trek "Charlie X" reference; the Slug blue option is pure information — it tells you whether the gamble is safe.
### Slaver (friendly)
- Where: Abandoned, Civilian, Pirate, Rock ×2, Slug ×2, Zoltan ×2 — normal beacon (ship detected), exit beacon and filler, once per sector
- Setup: A known slave trader offers you "laborers" cheap.
- Choices:
  1. `Buy one slave and free them to join your crew.` (−25–45 scrap; race and skills are shown first) → **that crewmember**.
  2. `Attack the slaver scum.` → the shared slaver fight: 80% surrender at 20–40% hull (accepting gives **a crewmember**), 50% escape attempt; destroyed → high scrap with resources (the slaves die); crew killed → choose a **Mantis, Rock or Engi crewmember** + medium scrap with resources, or a hidden survivor + high scrap with resources, or just high scrap with resources.
  3. `Ignore the slaver and continue on your way.` → nothing happens.
  - `[requires: Teleporter level 2+]` `Use your teleporter to attempt to board the ship and release some of the slaves.` → two branches (odds hidden): **a crewmember** *and* a fight; or just a fight.
    The freed crewmember does not block a second crewmember from the surrender or crew-kill outcomes.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), hull (combat)
- Tags: `trade`, `optional-fight`, `gated`, `gamble (odds-shown)`, `walk-away`, `moral`
- Note: buying a slave to free them and shooting the slaver both end with a crewmember; the game never scores which you chose.
### Store
- Where: Civilian, Slug ×2, The Last Stand, Uncharted Nebula — **store beacon** (no ship)
- Setup: A shop.
  Five rotating intros — an engineer's stall, mysterious alien vessels with technology to sell, a planetside outpost, a travelling merchant, or a ship crippled by pirates selling its own equipment to get home.
- Choices:
  1. (single option) → a store opens: weapons, drones, augments, crew, system upgrades, fuel, missiles, drone parts and hull repairs for scrap; anything you own can be sold back.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew (gain), hull (repair), system (upgrade)
- Tags: `no-choice`, `trade`
### The mercenary
- Where: Civilian, Pirate, Rock ×2, Slug ×2 — normal beacon (ship detected), filler, repeatable
- Setup: A mercenary offering services for scrap.
  Six rotating intros.
- Choices:
  1. `Hire the mercenary to delay the Rebels.` (−10–25 scrap) → **the Rebel fleet is delayed 2 jumps** (no effect in The Last Stand).
  2. `Hire the mercenary to scout the sector.` (−10–20 scrap) → **the current sector map is revealed**.
  3. `Fight the ship.` → fight a Pirate ship (default rewards; 50% surrender at 30–40% hull, 50% escape at 20–40% hull).
  4. `You have no need of his services.` → nothing happens.
- Resources: scrap, rebel fleet advance (delayed), map reveal, hull (combat)
- Tags: `trade`, `optional-fight`, `walk-away`
- Note: one of only two ways in the game to buy time against the fleet timer with scrap.
### Trade fuel for drone parts
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — normal beacon (no ship), exit beacon, repeatable
- Setup: A station, an automated merchant, or a science vessel wants fuel and has drones spare.
- Choices:
  1. `Accept the offer.` (−2–4 fuel; the exact offer is shown first) → **+1–3 drone parts**.
  2. `Reject their offer.` → nothing happens.
- Resources: fuel, drone parts
- Tags: `trade`, `walk-away`
### Trade resources in nebula
- Where: Civilian, Pirate, Rebel ×2, Uncharted Nebula, Zoltan ×2 — nebula beacon (no ship), nebula filler, once per sector
- Setup: A beacon that is, improbably, a tourist destination, with one ship offering a deal.
- Choices:
  1. `Trade.` (the exact offer is shown first) → one of: −1–2 drone parts → +5–10 fuel; −1–2 fuel → +4–5 missiles; −2–3 missiles → +2–3 drone parts; −2–4 missiles → +4–10 fuel.
  2. `Ignore.` → nothing happens.
- Resources: fuel, missiles, drone parts
- Tags: `trade`, `walk-away`
### Trade resources
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula, Zoltan ×2 — normal beacon (no ship), exit beacon, repeatable
- Setup: A trader, pawn broker or grey-market shipwright with one offer.
  Six rotating intros.
- Choices:
  1. `Trade.` (shown first) → the same four exchanges as above: drone parts ↔ fuel, fuel → missiles, missiles → drone parts, missiles → fuel.
  2. `Ignore.` → nothing happens.
- Resources: fuel, missiles, drone parts
- Tags: `trade`, `walk-away`
### Trade scrap for upgrades
- Where: Civilian, Engi ×2, Mantis ×2, Pirate, Rebel ×2, Rock ×2, Slug ×2, Uncharted Nebula — normal beacon (no ship), exit beacon, once per sector
- Setup: A shipwright, construction platform or "Uncle Joe's Fix-it Shop" offering one specific upgrade.
  Four rotating intros.
- Choices (which upgrade is offered is random, odds hidden; the price is shown before you commit):
  1. **Oxygen** → level 2 for 15–20 scrap, or level 3 for 25–40 scrap.
  2. **Piloting** → level 2 for 8–15, or level 3 for 25–40.
  3. **Door System** → level 2 for 8–15, or level 3 for 25–40.
  4. **Sensors** → level 2 for 10–20, or level 3 for 35–45.
  5. **Reactor** → one bar for 15–25 scrap.
  - `Decline.` → nothing happens.
- Resources: scrap, system / subsystem (upgrade), reactor
- Tags: `trade`, `walk-away`
- Note: cannot upgrade past maximum level, cannot upgrade a subsystem you do not have installed, cannot take the reactor past 25 bars.
### Unknown disease on mining colony
- Where: Civilian, Mantis ×2, Pirate, Rock ×2, Uncharted Nebula — **distress beacon** (no ship), once per sector
- Setup: A human mining colony is trying to quarantine an unknown disease while a riot breaks out.
- Choices:
  1. `Send in your crew to help control the crowds.` → two branches (odds hidden): the quarantine holds but **one of your crew is infected and left behind permanently** (Clone Bay explicitly cannot help — they are alive) plus medium resources with some scrap; or your crew retreats and nothing happens.
  2. `Ignore their request and move on.` → nothing happens.
  - `[requires: Rock crew]` `Send your Rock crew-member to prevent a riot.` → medium resources with some scrap, nobody lost.
  - `[requires: Engi crew]` `Send your Engi to calm down the infected.` → medium resources with some scrap.
  - `[requires: Medbay level 2+]` `Use your medbay to help synthesize a cure.` → medium resources with some scrap, and if you also have `[requires: Engi Med-bot Dispersal augment]`, **a weapon with high scrap** instead.
- Resources: scrap, fuel, missiles, drone parts, crew (lose), weapon
- Tags: `gated`, `gamble (odds-hidden)`, `sacrifice`, `walk-away`, `moral`
- Note: the only stacked blue option in this group — a prerequisite inside a prerequisite.

---

## Out of fuel (global sub-pool)
*These fire only when you have 0 fuel and choose to wait at a beacon.
Each wait rolls one event from a pool determined by whether your distress beacon is **on** (help arrives faster, but so do the Rebels and the predators) or **off** (slower, safer, and it can actively delay the fleet).
Waiting also advances the Rebel fleet, so this is a repeatable draw against a closing timer — the game's one true push-your-luck loop.*
### No fuel: wait fail (distress off)
- Where: any sector, 0 fuel, distress beacon off — **36.4% of waits**
- Setup: Nobody comes.
  Eleven flavour lines: "You contemplate the vastness of space." / "Cabin fever begins to spread among your crew."
- Choices:
  1. (single option) → nothing happens; the fleet advances one step.
- Resources: rebel fleet advance (normal)
- Tags: `no-choice`, `push-your-luck`, `tax`
### No fuel: wait fail (distress on)
- Where: any sector, 0 fuel, distress beacon on — **16.7% of waits**
- Setup: Nobody comes, even with the beacon lit.
  Seven flavour lines: "The distress beacon's light is the only movement visible outside the ship."
- Choices:
  1. (single option) → nothing happens; the fleet advances.
- Resources: rebel fleet advance (normal)
- Tags: `no-choice`, `push-your-luck`, `tax`
### No fuel: Rebel fleet delay
- Where: any sector, 0 fuel, **distress beacon off only** — **9% of waits**
- Setup: With no beacon and no FTL signature, the fleet loses your trail.
  Seven flavour lines.
- Choices:
  1. (single option) → **the Rebel fleet's pursuit is delayed 1 jump**, and then *another* out-of-fuel event immediately fires.
     Because it re-rolls its own pool, it can recur and the delays accumulate.
- Resources: rebel fleet advance (delayed)
- Tags: `no-choice`, `gift`, `push-your-luck`
- Note: the mechanical argument for waiting with the beacon off — the only free time the game gives back.
### No fuel: fuel trader (distress off)
- Where: any sector, 0 fuel, beacon off
- Setup: A merchant, a caravan, a wary settlement, or "a modified YT-1300 freighter" whose crew look like smugglers but are feeling altruistic.
- Choices:
  1. `Gladly trade.` (offer shown first) → one of: −1–2 drone parts → +2–4 fuel; −2–4 missiles → +2–5 fuel; −15–25 scrap → +2–5 fuel.
  2. `Respectfully decline.` → three branches (odds hidden): a **better** second offer (−1–2 drone parts → +4–7 fuel; −1–2 missiles → +4–7 fuel; −5–12 scrap → +3–7 fuel), and declining *that* gives **+1–6 fuel free** or nothing; the same offer again, take it or leave; or they simply jump away.
- Resources: fuel, missiles, drone parts, scrap
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`
- Note: haggling by refusing is genuinely correct here — the second offer is better, and refusing twice can still end in free fuel.
### No fuel: fuel trader (distress on)
- Where: any sector, 0 fuel, beacon on
- Setup: The same trade, reached by your distress call.
  Four intros, one a mercenary: "We have a bit of extra fuel we can give you... for a price."
- Choices: identical to the distress-off version, including the improved second offer and the chance of free fuel after two refusals.
- Resources: fuel, missiles, drone parts, scrap
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`
### No fuel: prepare to dock
- Where: any sector, 0 fuel, beacon on **or** off
- Setup: A ship offers to dock and help.
- Choices:
  1. `Graciously accept their offer.` → four branches (odds hidden): **+2–6 fuel** free; a trade offer (the standard fuel-trader ladder); a Pirate ship attack; or **2–3 boarders** plus a Pirate ship fight.
  2. `Request they keep their distance.` → three branches (odds hidden): **+1–4 fuel** sent over by shuttle; they attack; or they leave, offended.
  - `[requires: Sensors level 3]` / `[requires: Long-Ranged Scanners]` `Run a detailed scan before responding.` → you learn which it is: unarmed → **+3–7 fuel**; armed → `Power up weapons and prepare for a fight`, or `[requires: Cloaking]` `Cloak and get out of scanning range` → escape clean.
- Resources: fuel, missiles, drone parts, scrap, crew (boarding), hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `trade`
- Note: the sensor blue options convert the gamble into information plus, with Cloaking, a free exit — the exact shape of the whole blue-option system in one event.
### No fuel: automated refueling ship
- Where: any sector, 0 fuel, beacon on
- Setup: "This automated ship will provide refueling services once a monetary exchange is complete.
  Complimentary amounts of fuel are available in emergencies only."
- Choices:
  1. `Request emergency fuel reserves.` → **low fuel, free**.
     (The "one-time allowance" is flavour — it works every time the event appears.)
  2. `Buy 5 fuel for 20 scrap.` (−20 scrap) → +5 fuel.
  3. `Buy 2 fuel for 8 scrap.` (−8 scrap) → +2 fuel.
  4. `Attack the automated ship.` → fight a fleeing Auto-ship (80-second timer); destroyed → medium fuel and scrap; escaped → nothing.
- Resources: fuel, scrap, hull (combat)
- Tags: `trade`, `gift`, `optional-fight`
- Note: the free option always works, which makes this the single best out-of-fuel roll.
### No fuel: friendly refugee
- Where: any sector, 0 fuel, beacon off
- Setup: A refugee ship that has been following you from a distance, hoping you would lead it to Federation space, splits its remaining fuel with you.
- Choices:
  1. (single option) → **medium fuel**, free.
- Resources: fuel
- Tags: `no-choice`, `gift`
### No fuel: refugee trading
- Where: any sector, 0 fuel, beacon on
- Setup: A refugee ship answers your beacon.
  Three variants (odds hidden): one gives, one wants scrap, one wants missiles.
- Choices:
  - *Gift variant*: low fuel, free.
  - *Scrap variant*: `Trade some scrap for fuel.` (−10 scrap) → +3 fuel. `[requires: Engi crew]` `Negotiate a better trade.` → −10 scrap → **+6 fuel**. `Refuse their offer.` → they either leave, or beg and offer the +6 fuel deal anyway. `The helpless refugees make easy targets. Attack them.` → they surrender instantly: **medium fuel and scrap**, no fight.
  - *Missile variant*: `Offer some missiles for fuel.` (−1 missile) → +5–7 fuel, or the same plus a pirate ambush (odds hidden). `Refuse their offer.` → a pirate ambush (two of four rolls), low fuel anyway, or nothing.
- Resources: fuel, missiles, scrap, hull (combat)
- Tags: `trade`, `gated`, `gamble (odds-hidden)`, `moral`
- Note: robbing the refugees is mechanically the best outcome in the scrap variant, and the game does not comment on it.
### No fuel: Engi ship repair
- Where: any sector, 0 fuel, beacon off
- Setup: An Engi ship passes through, discussing repairs on their own comm channel.
- Choices:
  1. `Hail them.` → four branches (odds hidden): they gift **+2–6 fuel**; they propose a trade (−10–20 scrap → **+4–6 fuel**, or decline); they have been reprogrammed to fight — a fleeing Engi ship (80-second timer, no surrender; destroyed → medium fuel and scrap, crew killed → high fuel and scrap); or "Identity: Federation.
     I/O error: Federation = [void]" and they ignore you.
  2. `Ignore them.` → nothing happens.
  - `[requires: Hull Repair Drone]` `Offer to help repair their hull.` (costs 1 drone part) → **+4–6 fuel**, guaranteed.
- Resources: fuel, scrap, drone parts, hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `trade`
### No fuel: drifting debris
- Where: any sector, 0 fuel, beacon off
- Setup: The gutted stern of a Rock frigate drifts past your starboard viewport.
- Choices:
  1. `Send an away team.` → four branches (odds hidden): **medium fuel and the sector map revealed**; **medium fuel**; medium missiles and scrap but no fuel; or the frigate's lone mad survivor takes your crewmember hostage — `Pay.` (−25–40 scrap) returns them, `Refuse.` **loses the crewmember permanently** (Clone Bay cannot help).
  2. `Let it drift by.` → nothing happens.
  - `[requires: Lifeform Scanner augment]` `Run additional scans.` → confirms the wreck is lifeless; **medium fuel**, no hostage risk.
- Resources: fuel, missiles, scrap, crew (lose), map reveal
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`
### No fuel: explore the system
- Where: any sector, 0 fuel, beacon on **or** off
- Setup: You cannot jump, but the impulse engines still work.
- Choices:
  1. `Explore the nearby area.` → four branches (odds hidden):
     - A small outpost selling fuel dear: `Trade 20 scrap for 5 fuel.` / `Trade 10 for 2.` / `Trade 5 for 1.` / `Don't make a trade.`
     - An asteroid field: `Approach the asteroid field to scan it.` → high fuel / medium missiles and scrap / medium drone parts and scrap / **a pirate ambush** / **5 hull damage, 1 system damage, 1 room damaged** / nothing.
       Or `Avoid the risk.`
     - A Rebel auto-scout: fight a fleeing Auto-ship (80-second timer); destroyed → medium fuel and scrap.
     - Nothing at all.
  2. `Stay near the beacon.` → nothing happens.
- Resources: fuel, missiles, drone parts, scrap, hull (damage), system (damage)
- Tags: `gamble (odds-hidden)`, `push-your-luck`, `walk-away`, `optional-fight`
### No fuel: Auto-ship warning
- Where: any sector, 0 fuel, beacon on
- Setup: A ship responding to your distress turns out to be a Rebel auto-scout, which reverses thrust the moment it scans you.
- Choices:
  1. (single option) → fight an Auto-ship on a **40-second escape timer** (half the usual out-of-fuel 80 seconds).
     Escapes → **the Rebel fleet's pursuit doubles.**
     Destroyed → low scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet advance (accelerated on failure), hull (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `tax`
- Note: the worst possible answer to a distress call — stranded, no fuel, and a race you are given half the normal time to win.
### No fuel: Mantis fight
- Where: any sector, 0 fuel, beacon on
- Setup: A Mantis ship answers your beacon.
  Four intros: "Looks like we found the poor fools that need some help.
  Come brothers, let's 'help' them!"
- Choices:
  1. (single option) → fight a fleeing Mantis ship (80-second timer).
     Escapes → nothing.
     Destroyed → medium fuel and scrap.
     Crew killed → **high fuel and scrap**.
- Resources: fuel, scrap, hull (combat), crew (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`
### No fuel: Rebel fight
- Where: any sector, 0 fuel, beacon on
- Setup: A Rebel ship answers your beacon and recognises you.
  Four intros: "Hello citizen.
  We are responding to your distress call and can assist...
  Wait a second...
  You're that ship!"
- Choices:
  1. (single option) → fight a fleeing Rebel ship (80-second timer).
     Escapes → nothing.
     Destroyed → medium fuel and scrap.
     Crew killed → high fuel and scrap.
- Resources: fuel, scrap, hull (combat), crew (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`
### No fuel: Slug fuel depot
- Where: Slug sectors, 0 fuel, beacon on
- Setup: A mobile Slugman fuel depot.
  "My prices are fair, but I ask one thing - do not insult me with negotiation!"
- Choices:
  1. `Buy 5 fuel for 50 scrap.` (−50 scrap) → +5 fuel.
  2. `Buy 10 fuel for 95 scrap. (BEST DEAL!)` (−95 scrap) → +10 fuel.
  3. `Negotiate.` → he is outraged; fight a fleeing Slug ship (80-second timer, no surrender).
     Destroyed → medium fuel and scrap.
     Crew killed → high fuel and scrap.
     Escaped → nothing.
- Resources: fuel, scrap, hull (combat)
- Tags: `trade`, `optional-fight`
- Note: roughly five times the normal fuel price, and the game labels the worse-per-unit bulk option "BEST DEAL!"
### No fuel: Slug fuel trader
- Where: Slug sectors, 0 fuel, beacon on
- Setup: A poorly armed Slug ship offers help while its captain chuckles to himself.
- Choices:
  1. `Pay 15 scrap for 5 fuel.` (−15 scrap) → two branches (odds hidden): +5 fuel, clean; or +5 fuel and then a hidden portable teleporter empties your hold — **−2–4 missiles and −20–35 scrap**.
  2. `Ignore the offer.` → nothing happens.
  - `[requires: Slug crew]` `Have your Slug make the purchase.` → −15 scrap, +5 fuel, no theft.
- Resources: fuel, scrap, missiles
- Tags: `trade`, `gamble (odds-hidden)`, `gated`, `walk-away`

---

## Civilian Sector
### Auto-ship attacking civilian
- Where: Civilian Sector, Rebel Controlled Sector, Rebel Stronghold — normal beacon (no ship on scanners), repeatable
- Setup: A Rebel automated scout is chasing down a civilian ship with weapons live.
- Choices:
  1. `Aid the civilian ship.` → fight an Auto-ship.
     On destruction: low scrap with resources, then a follow-up "contact the civilian ship" roll (shared `Save the Civilian Ship` table, odds hidden): a weapon + low scrap / a crewmember offer / 5 hull repairs / medium scrap with resources / low scrap with resources (crew died) / nothing (they fled).
  2. `Stay out of it.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, hull (repair), crew (gain), weapon
- Tags: `fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
### Auto-ship attacking outpost
- Where: Civilian Sector, Slug sectors — normal beacon (ship detected), also appears as an exit-beacon and filler event, once per sector
- Setup: An automated Rebel scout is pounding a small refueling outpost.
- Choices:
  1. `Intervene to defend the outpost.` → the scout retargets you; fight an Auto-ship.
     On destruction: low scrap with resources, then the grateful outpost adds medium scrap with resources.
  2. `Avoid the conflict.` → nothing; the outpost survives anyway.
- Resources: scrap, fuel, missiles, drone parts
- Tags: `fight`, `walk-away`, `moral`
### Auto-ship carrying shield virus
- Where: Civilian Sector only — normal beacon (ship detected), once per sector
- Setup: A Rebel auto-scout has already pushed a virus into your ship; your shields are crippled before the fight starts.
- Choices:
  1. `Continue...` → fight an Auto-ship **with your Shields halved** (rounded down).
     On destruction: medium scrap with resources.
  - `[requires: Hacking system]` `Counter the remote hacking.` → shields intact, but you fight with **Hacking offline**.
    Same reward: medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, system (temporarily disabled)
- Tags: `fight`, `no-choice`, `gated`, `tax`
### Auto-ship fight near sun
- Where: Civilian Sector — red-giant hazard beacon (ship detected), once per sector
- Setup: You jump in too close to a star; an automated Rebel ship, unbothered by the heat, engages.
- Choices:
  1. (single option) → fight an Auto-ship while the sun periodically sets fires / damages hull.
     On destruction: medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (hazard damage), system (fire damage)
- Tags: `no-choice`, `fight`
### Auto-ship near sensor station
- Where: Civilian Sector, Rebel Controlled Sector, Rebel Stronghold — normal beacon (ship detected), once per sector
- Setup: A Rebel auto-ship patrols a long-range sensor station it does not want you reading.
- Choices:
  1. `Attack the automated ship to get to the sensor station.` → fight the Auto-ship; on destruction, low scrap **and the current sector map is revealed**.
  2. `Avoid provoking the ship.` → nothing happens.
  - `[requires: Sensors level 3]` `Use your sensors to attempt to access the data.` → two outcomes (odds hidden): the ship activates and you must fight for the same reward, **or** you download the map remotely with no fight (map revealed, no scrap).
  - `[requires: Teleporter]` `Beam directly onto the station to try to avoid detection.` → map revealed, no fight.
- Resources: scrap, map reveal
- Tags: `optional-fight`, `walk-away`, `gated`, `gamble (odds-hidden)`
### Boarders: Humans in plasma storm
- Where: Civilian Sector, Slug sectors — plasma-storm nebula beacon (no ship detected), nebula filler, once per sector
- Setup: Two wrecked ships drift nearby; while you salvage, a boarding party beams in.
- Choices:
  1. (single option) → medium scrap with resources, and **3–4 human boarders** appear inside your ship.
     The plasma storm halves your reactor output for the fight.
- Resources: scrap, fuel, missiles, drone parts, crew (injure/lose in the boarding fight), system (damage)
- Tags: `no-choice`, `fight`, `tax`
### Empty beacon (Civilian)
- Where: Civilian Sector — normal beacon (no ship), repeatable
- Setup: Nothing is here.
  The flavour text rotates through nine variants — abandoned mining base, silent ore refinery, unresponsive settlements, an unremarkable binary star, a planet broadcasting a level-5 quarantine warning.
- Choices:
  1. (single option) → nothing happens.
- Resources: none
- Tags: `no-choice`
### Mantis fight in nebula
- Where: Civilian Sector, Uncharted Nebula — nebula beacon (ship detected), nebula filler, repeatable
- Setup: A Mantis hunting ship finds you in the clouds.
  Five rotating intro lines, all ending in a fight.
- Choices:
  1. (single option) → fight a Mantis ship (default rewards).
     In nebula: your sensors are out and the enemy cannot be scanned either.
     This ship never surrenders and never flees.
- Resources: scrap, fuel, missiles, drone parts, hull (combat), crew (combat)
- Tags: `no-choice`, `fight`
### Mantis war camp
- Where: Civilian Sector, Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector.
  Two-stage.
- Setup: A settlement that lost its military asks you to scout a Mantis war camp a few jumps away.
- Choices (stage 1):
  1. `Pledge to do what you can.` → medium scrap and a **quest marker** on your map.
  2. `Apologize and decline.` → nothing happens.
- Choices (stage 2, at the marker — the camp is too large to count):
  1. `Leave before they notice you.` → two branches (odds hidden): a patrol spots you and you fight a Mantis ship (medium scrap with resources on destruction, high scrap with resources if you kill the crew instead), or you slip away with nothing.
  - `[requires: Missile weapon]` `Bombard their key structures.` (costs 1 missile) → the missile is shot down; you fight the patrol ship anyway for the same rewards.
    (Bugged: the Hull Missile does not qualify.)
  - `[requires: Fire Bomb]` `Teleport fire bombs into key structures.` (costs 2 missiles) → best outcome: **an Engi crewmember** plus high resources with some scrap, no fight.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), quest marker, hull (combat)
- Tags: `chain`, `delayed`, `gated`, `gamble (odds-hidden)`, `optional-fight`, `trade`
- Chain: `Pledge to do what you can` places the marker; the camp encounter is the second and final stage.
### Remote settlement
- Where: Civilian Sector — normal beacon (ship detected), once per sector
- Setup: A pirate ship is blockading an isolated farming settlement and tells you to stay out of it.
- Choices:
  1. `Attack the pirate.` → fight the pirate ship: 50% chance it tries to escape at 30–40% hull, 50% chance it offers surrender at 20–40% hull.
     Surrender accepted → medium resources with some scrap.
     Destroyed/crew killed → medium scrap with resources, then the settlement adds low resources with scrap.
     If it escapes, you still get the settlement's low resources with scrap.
  2. `Ignore them.` → nothing happens.
  - `[requires: Fire Beam]` `Show the pirate how to intimidate settlers: burn their crops!` → a drone schematic with high scrap.
  - `[requires: Fire Bomb]` `Show the pirate how to intimidate settlers: start fires in their crude dwellings.` (costs 1 missile) → a drone schematic with high scrap.
- Resources: scrap, fuel, missiles, drone parts, drone (schematic), hull (combat)
- Tags: `optional-fight`, `walk-away`, `gated`, `gamble (odds-shown)`, `moral`
- Note: the blue options are the game's one openly villainous "burn the crops" payoff, and they pay better than rescuing.
### Slaver (hostile)
- Where: Civilian Sector, Pirate Controlled Sector — normal beacon (ship detected), repeatable
- Setup: A heavily armed slaver demands one of your crew as the price of safe passage.
- Choices:
  1. `Draw straws and send a crew-member over to the slavers.` → **you lose a crewmember** (random).
     A Clone Bay does not replace them.
  2. `We will never surrender one of our crew to slavers!` → fight the pirate slaver ship (see below).
  - `[requires: Engines level 6+]` `Attempt to out-run the slaver ship.` → two branches (odds hidden): you escape clean, or they catch you and you fight anyway.
- Slaver fight outcomes: 80% chance of a surrender offer at 20–40% hull — accepting gives **a crewmember**. 50% chance it tries to flee at 20–40% hull (nothing if it gets away).
  Destroying it: high scrap with resources (the slaves die).
  Killing the crew and boarding: choose a **Mantis, Rock or Engi crewmember** plus medium scrap with resources; or, on other rolls, a hidden survivor crewmember + high scrap with resources, or just high scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, crew (gain / lose), hull (combat)
- Tags: `sacrifice`, `optional-fight`, `gated`, `gamble (odds-shown)`, `moral`
- Note: the moral asymmetry is sharp — killing the crew rather than destroying the ship is both the kinder and the richer outcome.
### Space station under construction
- Where: Civilian Sector — normal beacon (no ship), once per sector.
  Two-stage.
- Setup: A half-built station lost contact with its supply freighter and asks you to find out what happened.
- Choices (stage 1):
  1. `Offer your help.` → 2–4 fuel, 0–4 missiles, 0–2 drone parts, and a **quest marker**.
  2. `Decline.` → nothing happens.
  - `[requires: Lanius crew]` `Offer to have your crewmember help.` → they want to buy the Lanius. `Ask your crew if they agree.` → **lose the Lanius crewmember**, gain an augmentation with high scrap. `Our crew is not for sale.` → medium scrap.
- Choices (stage 2, at the marker — one of three sub-events, odds hidden):
  - *Cargo ship docked to a Rebel station*: `Attack the Rebels to help them escape.` → fight a Rebel ship **while a planetary Anti-Ship Battery shoots at you**; medium scrap with resources (high if you kill the crew), then medium scrap from the freed cargo ship. `Leave.` → nothing.
  - *Cargo ship docked to an empty space station*: runs the `Abandoned station` exploration event.
  - *Cargo ship floating near the beacon*: `Give them the requested 4 fuel.` (−4 fuel) → medium scrap. `Give them 1 fuel.` (−1 fuel) → nothing. `Do not give them any.` → nothing.
- Resources: scrap, fuel, missiles, drone parts, crew (lose), augment, quest marker, hull (combat)
- Tags: `chain`, `delayed`, `gated`, `sacrifice`, `trade`, `gamble (odds-hidden)`, `walk-away`
- Chain: stage 1 places the marker; stage 2 resolves to one of three unrelated encounters.

---

## Engi sectors
### Battlefield wreckage
- Where: Engi Controlled Sector, Engi Homeworlds, Slug sectors — normal beacon (no ship), also exit-beacon and filler, repeatable
- Setup: You jump into the aftermath of a multi-ship battle; the combatants are unidentifiable without a closer look.
- Choices:
  1. `Investigate the battlefield.` → six branches (odds hidden): nothing (two of the six variants), medium resources with some scrap, or a fight — Mantis ship, Rebel ship, or Zoltan ship, each with default rewards.
  2. `Ignore the wreckage and continue on.` → nothing happens.
  - `[requires: Sensors level 2]` `Use your Sensors to scan the wreckage.` → medium resources with some scrap, guaranteed, no fight.
  - `[requires: Sensors level 3]` `Use your Sensors to scan the wreckage.` → high resources with some scrap, or a prototype **weapon** with low scrap (odds hidden).
- Resources: scrap, fuel, missiles, drone parts, weapon, hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `optional-fight`
- Note: a clean example of a blue option converting a coin-flip into a guaranteed payout.
### Confused Mantis
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), once per sector.
  Two-stage.
- Setup: Engi civilians have a malfunctioning Mantis aboard who believes he is human and will only take instruction from a human.
- Choices:
  1. `Listen to their problem.` then `Send a shuttle with an away team to help.` → three branches (odds hidden): the Mantis calms down and you `Return him home`; or he attacks and **you lose a crewmember** (Clone Bay does revive them here); or you subdue him and nothing happens.
  2. `Leave them, a cornered Mantis is too dangerous.` → nothing.
  3. `Explain that you can't do any programming and leave.` → nothing.
  - `[requires: Human crew]` `Send your human crewmember to communicate with the Mantis.` → he calms down; `Return him home`.
    (The game's only Human-crew blue option.)
  - `[requires: Mantis crew]` `Send your Mantis crewmember to communicate with the Mantis.` → he panics, is killed; low scrap with resources.
  - `[requires: Mind Control]` `Use your Mind control system to calm him down.` → medium scrap with resources.
- Stage 2 (`Return him home`, the mining colony): `Offer him a position on your ship.` → **a Mantis crewmember named Robert Smith**. `Ask if they can take a look at your engines.` → **Engines subsystem upgraded**.
- Resources: scrap, fuel, missiles, drone parts, crew (gain / lose), system (upgrade)
- Tags: `chain`, `gated`, `gamble (odds-hidden)`, `walk-away`, `moral`
### Empty beacon (Engi)
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), repeatable
- Setup: Nothing is here.
  Ten rotating flavour lines about Engi construction yards, hives building organic machines, junk-looking-but-efficient fleets, a lone Rebel carrier you decide not to provoke.
- Choices:
  1. (single option) → nothing happens.
- Resources: none
- Tags: `no-choice`
### Engi cache
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), once per sector
- Setup: An Engi colony is digging up a Federation-Mantis War equipment cache and suggests using it as bait for the Rebel fleet.
- Choices:
  1. `Booby trap the cache.` (costs 2 missiles) → **the Rebel fleet is delayed 2 jumps**.
  2. `Secure the cache.` → a drone schematic with medium scrap.
- Resources: missiles, scrap, drone (schematic), rebel fleet advance (delayed)
- Tags: `trade`, `no-choice` (both options are pure trades; there is no free exit)
- Note: one of the few events that buys back turns against the fleet timer instead of loot.
### Engi distress Rebel fight
- Where: Engi Controlled Sector, Engi Homeworlds — **distress beacon** (ship detected), once per sector.
  Two-stage.
- Setup: A Rebel fighter is attacking a small Engi ship; when the Rebels see your Federation markings they switch targets to you.
- Choices:
  1. (forced) fight the Rebel ship (no surrender, no escape) → low scrap with resources on destruction, medium if you kill the crew.
     Then:
- Stage 2 (the Engi runabout needs supplies to get home):
  1. `Give them 25 scrap.` (−25 scrap) → three branches (odds hidden): nothing, **the Healing Burst weapon**, or a drone schematic.
  2. `Give them 40 scrap, 2 missiles and 2 fuel.` (−40 scrap, −2 missiles, −2 fuel) → **Engi Med-bot Dispersal augmentation**.
  3. `Give them nothing.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), augment, hull (combat)
- Tags: `fight`, `chain`, `trade`, `gamble (odds-hidden)`, `walk-away`
### Engi fleet discussion
- Where: Engi Homeworlds only — normal beacon (no ship), once per sector.
  Multi-stage quest; **unlocks the Stealth Cruiser**.
- Setup: A fleet of civilian Engi ships is having an agitated private conversation you can decrypt but not join.
- Choices:
  1. `Message them and ask if you can help.` → politely refused, nothing happens.
  2. `Ignore it and move on.` → nothing happens.
  - `[requires: Engi crew]` `Have your Engi crewmember contact them.` → `Offer your help.` → **two quest markers** placed: one real Rebel base, one decoy.
- Stage 2a (real marker): fight a Rebel scout that immediately starts a 40-second escape timer and surrenders at 50% hull.
  If it escapes, **the unlock quest fails**.
  Surrender → `Demand information` → a **final quest marker**.
  Killing the crew → high scrap with resources + the final marker.
- Stage 2b (decoy marker): same setup, surrenders at 40% hull; the information is worthless.
  Destroyed/crew killed → medium scrap with resources.
- Stage 3 (final marker): a Mantis-hulled ship crewed by Rebels, escorted by Engi allies.
  Destroy it → victory; kill the crew → medium scrap with resources then victory.
- Victory: `Transmit coordinates of Federation command.` → **Stealth Cruiser unlocked**, Titanium System Casing augmentation, high scrap with resources, 20 hull repairs.
- Resources: scrap, fuel, missiles, drone parts, augment, hull (repair), quest marker, ship unlock, hull (combat)
- Tags: `chain`, `delayed`, `gated`, `fight`, `gamble (odds-hidden)`, `walk-away`
- Chain: three stages plus a decoy branch; the decoy and the real marker can be visited in either order.
  The real one is identifiable only by a missing comma in its intro text.
### Engi research station
- Where: Engi Controlled Sector, Engi Homeworlds — **distress beacon** (no ship), once per sector
- Setup: A burnt-out Engi research station's distress call has gone unanswered; something or someone may still be aboard.
- Choices:
  1. `Board the station.` → two branches (odds hidden).
     Empty → nothing.
     Otherwise you find a wounded Engi, a drone schematic, and an overloading reactor:
     - `Save the Engi!` → **lose a crewmember** (Clone Bay revives them) but gain an **Engi crewmember** with low scrap; or, on the other roll, everyone returns safely and you still gain the Engi crewmember with low scrap.
     - `Save the drone schematic.` → **lose a crewmember** and low scrap (Clone Bay revives); or a drone schematic with low scrap.
     - `Save yourselves!` → low scrap, nobody hurt.
  2. `Ignore it.` → nothing happens.
  - `[requires: Sensors level 2+]` / `[requires: Long-Ranged Scanners]` `Run another scan.` → you learn about the reactor first and take the same Engi-or-drone choice **with no risk of losing anyone**: an Engi crewmember with low scrap, or a drone schematic with low scrap.
- Resources: scrap, fuel, missiles, drone parts, crew (gain / lose), drone (schematic)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`, `moral`
- Note: the blue options remove the death risk entirely — the clearest case in the game of a prerequisite turning a dilemma into a free pick.
### Engi ship attacked by Mantis ship
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), repeatable.
  (Written as a distress event but mis-tagged in the data, so it appears at normal beacons.)
- Setup: An Engi ship broadcasts "Assistance requested.
  Danger present.
  Imminent destruction."
- Choices:
  1. `Respond to the call and move in to assist.` → two branches (odds hidden): a straight Mantis-ship fight (medium scrap with resources on destruction, high if crew killed, then a contact roll), **or** it is a trap — 1–2 Mantis boarders teleport aboard and you fight a Mantis-crewed Engi ship.
  2. `Keep your distance.` → nothing happens.
- Contact-the-Engi roll (odds hidden): an **Engi crewmember** + low scrap with resources / medium fuel / nothing (it was a lure) / a reward request menu — `Request fuel` (high fuel and scrap), `Request weapon` (weapon + low scrap), `Request drone` (drone schematic + low scrap), or `[requires: Engi crew]` which gives a weapon with low scrap, 10 hull repairs, **and a Hidden Federation Base quest marker**.
- Hidden Federation Base (later stage): four outcomes (odds hidden) — a drone schematic with high scrap; **a crewmember** + low scrap with resources; **35 hull repairs** + medium scrap with resources; or nothing found, in which case `[requires: Sensors 2 / Sensors 3 / Long-Ranged Scanners]` recovers medium scrap or a weapon with medium scrap.
  A variant stages a fight with an Auto-ship or Elite Rebel ship over the outpost, with Anti-Ship Battery support on your side under Advanced Edition.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), weapon, drone (schematic), hull (repair), quest marker
- Tags: `chain`, `delayed`, `gated`, `optional-fight`, `gamble (odds-hidden)`, `walk-away`, `moral`
### Engi smashed ships
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), once per sector
- Setup: Two Engi vessels are locked together after what looks like a collision and cannot free themselves.
- Choices:
  1. `Attempt to help the ships by prying them apart.` → one of them opens fire; fight an Engi ship (no surrender, no escape).
     Afterwards you learn it was a misunderstanding — nothing is awarded.
  2. `Ignore the damaged vessels.` → nothing happens.
  - `[requires: Engi crew]` `Have your Engi crewmember hail the vessel and assess the damage.` → the ships are mating; you leave them to it and quietly scavenge the perimeter for a random tier of resources with some scrap.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `gated`, `fight`, `walk-away`
- Note: the non-blue path is strictly punishing — a fight for zero reward.
### Engi surrender
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), once per sector
- Setup: An Engi ship sees your armament and surrenders before you say anything.
  "Subject goal: wealth.
  Engi motivation: survival."
- Choices:
  1. `Explain that you're friendly.` → two branches (odds hidden): nothing, or they hand the goods over anyway (random tier of scrap with resources).
  2. `Accept their offer of surrender.` → random tier of scrap with resources, guaranteed.
- Resources: scrap, fuel, missiles, drone parts
- Tags: `gamble (odds-hidden)`, `moral`
- Note: honesty is a coin flip for the same prize extortion pays out every time.
### Free scrap with resources (Engi)
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), repeatable
- Setup: Engi hand you supplies — a hailing vessel that reads your Federation ID as "Implies... hope", a cargo ship lightening its load, a science station offering experimental tech, or a battle site you pick over.
- Choices:
  1. (single option) → a random tier of scrap with resources.
- Resources: scrap, fuel, missiles, drone parts
- Tags: `no-choice`, `gift`
### Mantis fight (Engi)
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (ship detected), repeatable
- Setup: A Mantis raider — scavenging an Engi carrier, harassing a supply station, or jumping in behind you — engages.
  Four rotating intros.
- Choices:
  1. (single option) → fight a Mantis ship (default rewards).
     No surrender, no escape.
- Resources: scrap, fuel, missiles, drone parts, hull (combat), crew (combat)
- Tags: `no-choice`, `fight`
### Pirate fight (Engi)
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (ship detected), repeatable
- Setup: A worn-down but hungry pirate, left over from richer pre-war pickings.
- Choices:
  1. (single option) → fight a Pirate ship (default rewards; 50% escape attempt at 30-40% hull, 50% surrender offer at 20-40% hull).
- Resources: scrap, fuel, missiles, drone parts, hull (combat), crew (combat)
- Tags: `no-choice`, `fight`
### Rebel fight (Engi)
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (ship detected), repeatable
- Setup: A Rebel fighter this deep in Engi space means the fleet is already making incursions.
- Choices:
  1. (single option) → fight a Rebel ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat), crew (combat)
- Tags: `no-choice`, `fight`
### Store (Engi)
- Where: Engi Controlled Sector, Engi Homeworlds — **store beacon** (no ship)
- Setup: An Engi hive or trader sells equipment.
  "Your scrap, ours.
  Our weapons for you."
- Choices:
  1. (single option) → a store opens: buy weapons, drones, augments, crew, fuel, missiles, drone parts, hull repairs and system upgrades for scrap; sell items for scrap.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew (gain), hull (repair), system (upgrade)
- Tags: `no-choice`, `trade`
### The Engi virus
- Where: Engi Controlled Sector, Engi Homeworlds — normal beacon (no ship), once per sector
- Setup: An armed Engi ship informs you a wanted computer virus is aboard your vessel and that they must destroy your ship to contain it.
- Choices:
  1. `Hold on! Let us try to purge the system code!` → they attack mid-purge; fight an Engi ship **with Engines and Shields halved**.
     Reward: random tier of scrap with resources.
  2. `Attack the Engi vessel!` → fight an Engi ship at full strength; random tier of scrap with resources.
  - `[requires: Engi crew]` `Have your Engi crewmember negotiate.` → **the virus kills your Engi crewmember** (Clone Bay explicitly disabled), then a fight; afterwards the crewmember reforms as **"Virus", an Engi maxed in every skill**.
    Using your only crewmember here is a game over.
  - `[requires: Lanius crew]` `Your Lanius crewmember gestures frantically.` → the Lanius eats the infected terminal; random scrap plus the **Drone Reactor Booster augmentation**, no fight.
  - `[requires: Hacking]` `Isolate and quarantine the virus.` → low scrap with resources + Drone Reactor Booster, no fight.
  - `[requires: Hacking level 2]` `Reprogram the virus.` → **15 hull repairs, reactor upgraded**, plus Drone Reactor Booster.
  - `[requires: Hacking level 3]` `Reprogram the virus.` → **30 hull repairs, reactor upgraded**, plus Drone Reactor Booster.
- Resources: scrap, fuel, missiles, drone parts, crew (lose then gain, upgraded), augment, hull (repair / combat), reactor, system (temporarily halved)
- Tags: `gated`, `fight`, `sacrifice`, `no-choice` (no walk-away exists)
- Note: the widest blue-option fan in the group — six prerequisites, each strictly better than the two plain options.

## Zoltan sectors
### Boarders: Humans jammed sensors
- Where: Zoltan Controlled Sector, Zoltan Homeworlds, Pirate Controlled Sector — normal beacon (no ship), once per sector
- Setup: A strange signal from a space station kills your sensors, and hostiles beam aboard in the dark.
- Choices:
  1. `Continue...` → **3–5 human boarders** aboard and your **Sensors stay disabled until you jump away**.
  - `[requires: Hacking]` `Counter the remote hacking.` → same 3–5 boarders, but Sensors come back on immediately and Hacking is not disabled.
- Resources: crew (injure / lose), system (disabled, damage in the boarding fight)
- Tags: `no-choice`, `fight`, `gated`, `tax`
### Empty beacon (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), repeatable
- Setup: Nothing is here.
  Seven flavour lines: unmined asteroids, a training exercise where you note how fast beams and ions strip Zoltan energy shields, a shipyard of glowing workers, an advertised ancient monastery you have no time for.
- Choices:
  1. (single option) → nothing happens.
- Resources: none
- Tags: `no-choice`
### Engi fight
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), once per sector
- Setup: You arrive in the debris of a destroyed Zoltan cruiser; its Engi escort assumes you did it and refuses all hails.
- Choices:
  1. (single option) → fight an Engi ship (default rewards; no surrender, no escape).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Free scrap with resources (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — **distress beacon** (no ship), once per sector
- Setup: A Zoltan freighter drifts with nobody at the helm and no explanation.
- Choices:
  1. (single option) → a random tier of scrap with resources.
- Resources: scrap, fuel, missiles, drone parts
- Tags: `no-choice`, `gift`
### Mantis fight (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), once per sector
- Setup: You catch a Zoltan freighter's last broadcast — "The Mantis, they're here, please-" — and take fire.
- Choices:
  1. (single option) → fight a Mantis ship (default rewards; no surrender, no escape).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Mantis outcasts
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), once per sector
- Setup: Mantis outcasts mistake the Zoltan for easy prey, and you for the same.
- Choices:
  1. (single option) → **2–3 Mantis boarders** aboard plus a Mantis ship fight (default rewards).
- Resources: scrap, fuel, missiles, drone parts, crew (injure / lose), hull (combat)
- Tags: `no-choice`, `fight`
### Pirate fight (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), repeatable
- Setup: Pirates working Zoltan space.
  Five rotating intros, including a Zoltan ship that calls for help then jumps away the moment you engage.
- Choices:
  1. (single option) → fight a Pirate ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Pirate ships in plasma storm
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — plasma-storm nebula beacon (no ship), once per sector
- Setup: Two unaware pirate ships drift apart in the storm; your scanners identify one as the fuel carrier and one as the ammunition carrier.
- Choices:
  1. `Secure the fuel supply.` → fight that pirate (50% escape attempt at 20–40% hull, never surrenders).
     Destroyed → low fuel and scrap.
     Crew killed → **high fuel and scrap**.
  2. `Secure the ammunition.` → same fight shape.
     Destroyed → low missiles and scrap.
     Crew killed → **high missiles and scrap**.
  3. `Let them leave.` → nothing happens.
- Resources: fuel, missiles, scrap, hull (combat), reactor (halved by the storm)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-shown)`, `trade`
- Note: the reward names the resource in advance — the only choice is which shortage to fix, in a fight where your reactor is at half power.
### Refugee (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), repeatable
- Setup: A refugee ship fleeing the Rebel advance drifts through the system, not obviously aware of you.
- Choices:
  1. `Hail them.` → two branches (odds hidden): they offer a **named trade** (the exact offer is shown before you commit) — 1–2 drone parts for 5–10 fuel, or 1–2 fuel for 4–5 missiles, or 2–3 missiles for 2–3 drone parts, or 2–4 missiles for 4–10 fuel, with `Politely decline` available; **or** a Zoltan ship jumps in calling the refugees fugitives and attacks (no surrender, no escape) — medium scrap with resources (high if crew killed) plus low scrap with resources from the grateful refugees.
  2. `Ignore the refugees.` → nothing happens.
- Resources: fuel, missiles, drone parts, scrap, hull (combat)
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `optional-fight`
### Refugee distress (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — **distress beacon** (no ship), repeatable
- Setup: Identical to `Refugee (Zoltan)` but reached via an active distress beacon — the refugee ship ran out of fuel fleeing the Rebels and you cannot tell if anyone is aboard.
- Choices: same as `Refugee (Zoltan)` — a shown trade, or a Zoltan ambush, or ignore.
- Resources: fuel, missiles, drone parts, scrap, hull (combat)
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `optional-fight`
### Rock fight in nebula
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — nebula beacon (ship detected), once per sector
- Setup: A Rock crew hiding from the Zoltan border police will not risk you leaving with their coordinates.
- Choices:
  1. (single option) → fight a Rock ship (default rewards).
     Sensors are out in the nebula.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Store (Zoltan)
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — **store beacon** (no ship)
- Setup: A Zoltan alien knick-knack shop, a human dealer who claims he can get anything, or a Mantis black-market crew operating out of the abdomen of a long-dead space-whale.
- Choices:
  1. (single option) → a store opens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew (gain), hull (repair), system (upgrade)
- Tags: `no-choice`, `trade`
### Unarmed Zoltan transport
- Where: Zoltan Homeworlds only — normal beacon (no ship), once per sector.
  Two-stage; **unlocks the Zoltan Cruiser**.
- Setup: An unarmed, unshielded Zoltan peace envoy hails you and relies on your mercy to deliver its message.
- Choices (stage 1):
  1. `Attack them.` → two branches (odds hidden): fight the defenceless ship — it offers surrender, and you may `Finish them off` or `Let them go` (nothing); destroying it gives low scrap with resources, killing the crew a random tier — **or** a Zoltan defence ship jumps in and the envoy escapes.
  2. `Hear them out.` → they lecture you at length about peace and harmony and transmit the coordinates of their "brethren": a **quest marker**.
  3. `Leave.` → nothing happens.
- Choices (stage 2, at the marker — it is a Rebel ship, not the brethren):
  1. `Attack.` → fight a Rebel ship (default rewards).
  2. `Attempt to hail them.` → three dialogue options; two lead straight to a fight. `"Perhaps there could be a reconciliation of our ideals without war?"` then `True progress can only be achieved without bloodshed.` → the Rebel ship was an illusion; a Zoltan fleet appears.
     **50%: Zoltan Cruiser unlocked + Zoltan Shield augmentation + low scrap. 50%: Zoltan Cruiser unlocked + a Zoltan crewmember named "Envoy" maxed in all skills + high scrap with resources.**
- Resources: scrap, fuel, missiles, drone parts, augment, crew (gain), quest marker, ship unlock, hull (combat)
- Tags: `chain`, `delayed`, `gamble (odds-shown)`, `walk-away`, `moral`, `optional-fight`
- Chain: the envoy places the marker; the marker is a two-layer dialogue test where only the pacifist reply unlocks the ship.
- Note: the game's clearest reward for restraint — the unlock is gated on not shooting an unarmed ship and then on refusing to argue force.
### Zoltan Great Eye
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — nebula beacon (no ship), once per sector
- Setup: A rogue planet in the nebula carries a monolith visible from orbit.
  A Zoltan elder invites you to "look into its depths and receive your just deserts."
- Choices:
  1. `Pull the ship in closer.` → four branches (odds hidden): **you lose a crewmember**, aged backwards out of existence (Clone Bay explicitly cannot recover them); a Zoltan ship attacks (default rewards); **high scrap**; or **the Healing Burst weapon**.
  2. `Leave.` → nothing happens.
- Resources: scrap, crew (lose), weapon, hull (combat)
- Tags: `gamble (odds-hidden)`, `walk-away`, `sacrifice`, `optional-fight`
- Note: a pure four-way lottery, one branch of which permanently costs a crewmember.
### Zoltan border police
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), once per sector
- Setup: Customs officers beam aboard over a weapons-licence discrepancy; the discussion becomes gunfire.
- Choices:
  1. (single option) → **3–4 Zoltan boarders** aboard plus a Zoltan ship fight (default rewards).
- Resources: scrap, fuel, missiles, drone parts, crew (injure / lose), hull (combat)
- Tags: `no-choice`, `fight`
### Zoltan fight in asteroid field
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — asteroid-field hazard beacon (ship detected), once per sector
- Setup: A Zoltan guard cites the Natural Mineral Protection Act and announces your weapons will be confiscated.
- Choices:
  1. (single option) → fight a Zoltan ship (default rewards) while asteroids strike both ships.
- Resources: scrap, fuel, missiles, drone parts, hull (hazard + combat), system (damage)
- Tags: `no-choice`, `fight`
### Zoltan fight
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), repeatable
- Setup: A Zoltan ship attacks.
  Seven rotating intros — deep-space dementia, an off-limits patrol zone, a civilian who mistakes your purpose, solar radiation that garbles your reply and is read as aggression.
- Choices:
  1. (single option) → fight a Zoltan ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Zoltan free augment
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector
- Setup: A Zoltan academy shows you their work and sends you off with a souvenir.
- Choices:
  1. (single option) → **an augmentation** with low scrap.
- Resources: augment, scrap
- Tags: `no-choice`, `gift`
### Zoltan free map
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), once per sector
- Setup: A Zoltan crew gives you a tour and you quietly memorise their star charts.
- Choices:
  1. (single option) → **the current sector map is revealed**.
- Resources: map reveal
- Tags: `no-choice`, `gift`
### Zoltan odd moon
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector
- Setup: Something about a nearby moon looks wrong.
- Choices:
  1. `Check it out.` → four branches (odds hidden): a fragile surface layer you can blast — `Attempt to detonate some explosives` (costs 1 missile) → a **weapon** with random scrap / random scrap / nothing (odds hidden), or `Explosives are too valuable` → nothing; a cave with a working **weapon** + low scrap; a scrap heap (medium scrap); or nothing of interest.
  2. `Leave it be.` → nothing happens.
  - `[requires: Boarding Drone]` `Send a drone to probe the surface.` (costs 1 drone part) → **a Zoltan crewmember**, guaranteed.
- Resources: scrap, missiles, drone parts, weapon, crew (gain)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `push-your-luck`
### Zoltan quest primitives
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector.
  Also reachable as the quest stage of `Zoltan trade hub`.
- Setup: At an undeveloped planet, a Zoltan ship and a Rebel assault craft are facing off over first contact.
  The Rebel captain: "We are liberating this planet in the name of the new Galactic government!"
- Choices:
  1. `Interfere - make first contact with the primitive aliens.` → the locals (furry one-eyed tree lizards) chant at you and the Zoltan open fire.
     Fight the Zoltan ship → **the Rebel fleet's pursuit is doubled for 1 jump**, plus low scrap with resources (random tier if you killed the crew).
  2. `Protect the aliens' way of life - Attack the Rebel ship.` → fight the Rebel ship → **a weapon** with low scrap (medium scrap if you killed the crew).
  3. `Leave.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, rebel fleet advance (accelerated), hull (combat)
- Tags: `optional-fight`, `walk-away`, `moral`
- Note: the self-interested option costs you fleet timer; the principled one pays a weapon.
### Zoltan retake the ship
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (ship detected), once per sector
- Setup: A Zoltan in a life raft wants his commandeered ship back from pirates — intact.
  "You must not destroy my vessel in the process."
- Choices:
  1. `Engage the pirates.` → fight the pirate-held Zoltan ship.
     **Destroying it** (failing his condition) → medium scrap with resources, and he demands to be dropped off: `Let him go` (nothing) or `Offer to hire him for 40 scrap` → two branches (odds hidden), −40 scrap for **a Zoltan crewmember**, or he refuses and nothing happens.
     **Killing the crew** (ship intact) → **an augmentation with high scrap**.
  2. `Leave.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, augment, crew (gain), hull (combat)
- Tags: `optional-fight`, `walk-away`, `trade`, `gamble (odds-hidden)`
- Note: the event states its win condition in the fiction — boarding rather than shooting is the better payout, and the text tells you so up front.
### Zoltan security checkpoint
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector
- Setup: A checkpoint demands crew profiling to identify "fugitives of the empire."
- Choices:
  1. `You don't have time for this nonsense. Attack!` → fight a Zoltan ship (default rewards).
  2. `Submit to profiling.` → two branches (odds hidden): you are cleared and nothing happens; **or** they flag one of your crew on "five charges of Utter Villainy":
     - `Give up your crewmember.` → **lose a crewmember** (Clone Bay cannot help — they are taken alive).
     - `Refuse and fight.` → **2–4 Zoltan boarders** aboard plus a Zoltan ship fight **with Weapon Control halved**; low scrap with resources, medium if you kill the crew.
  - `[requires: Slug crew]` `Have your Slug talk them into letting you go.` → medium fuel, no fight.
  - `[requires: Mind Control]` `Make the guards believe they have already checked your crew today.` → medium fuel, no fight.
- Resources: scrap, fuel, missiles, drone parts, crew (lose / injure), system (temporarily halved), hull (combat)
- Tags: `gated`, `gamble (odds-hidden)`, `sacrifice`, `optional-fight`, `moral`
### Zoltan ship asks to dock
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector
- Setup: A Zoltan science ship asks permission to dock.
- Choices:
  1. `Dock with them.` → two branches (odds hidden): they open fire — fight a Zoltan ship with a **50% chance to surrender at 30–40% hull**, and the surrender text reveals it was "a test that you passed", giving **a Zoltan crewmember** plus low scrap with resources; destroyed → low scrap with resources; crew killed → medium scrap with resources.
     **Or** they were genuine and give you medium resources with some scrap.
  2. `Have them keep their distance.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), hull (combat)
- Tags: `gamble (odds-shown)`, `walk-away`, `optional-fight`
- Note: if the surrender triggers, the fight simply ends — there is no option to refuse it.
### Zoltan ship follows Mantis ship
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — **distress beacon** in an asteroid field (no ship), once per sector
- Setup: A Zoltan security ship chasing a Mantis pirate into an asteroid field asks you not to interfere.
- Choices:
  1. `Interfere and save the Mantis ship.` → fight the Zoltan ship; the Mantis then "only take three quarters of the loot" — low scrap with resources, medium if you killed the crew.
  2. `Interfere and help the Zoltan ship.` → fight an all-Mantis-crewed Mantis ship — low scrap with resources, medium if you killed the crew.
  3. `Don't interfere.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, hull (hazard + combat)
- Tags: `optional-fight`, `walk-away`, `moral`
- Note: both sides pay identically; the choice is purely which faction you back.
### Zoltan trade hub
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector.
  Two-stage.
- Setup: A Zoltan supply hub that admits only travellers with the right documentation — "neuro-laced identity bracelets."
- Choices:
  1. `Try to talk your way in.` → two branches (odds hidden): you are made and **2–4 Zoltan boarders** plus a Zoltan ship fight follow; or your forged IDs hold and you get in.
  2. `Leave.` → nothing happens.
  - `[requires: Teleporter]` `Beam directly to the civilian deck.` → in, no risk.
  - `[requires: Zoltan crew]` `Present his official documentation and pay the entry fee.` (−10 scrap) → in, no risk.
- Inside the hub (odds hidden): a **store opens**, or the cantina yields the location of an uncontacted planet — **a quest marker** that runs the `Zoltan quest primitives` event above.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew, hull (repair/combat), quest marker
- Tags: `chain`, `delayed`, `gated`, `gamble (odds-hidden)`, `walk-away`, `trade`
- Chain: hub → quest marker → `Zoltan quest primitives`.
### Zoltan wise man
- Where: Zoltan Controlled Sector, Zoltan Homeworlds — normal beacon (no ship), once per sector
- Setup: An ancient Zoltan has harnessed a spatial rift and been driven mad by it.
  "Choose your doom," he demands.
- Choices:
  1. `Mantis.` → fight an all-Mantis-crewed Mantis ship.
  2. `Slug.` → fight a Slug ship.
  3. `Rockmen.` → fight a Rock ship.
- After any of the three: low scrap with resources (medium if crew killed), then the wise man implodes in a rage and showers you with **high scrap with resources**.
- Resources: scrap, fuel, missiles, drone parts, hull (combat), crew (combat)
- Tags: `fight`, `no-choice` (the three options differ only in which enemy you face; there is no exit)
- Note: the datafiles contain an unfinished fourth option to fight a Crystal ship, commented out.

---

## Mantis sectors
### Mantis fight
- Where: Mantis Controlled, Mantis Homeworlds, Civilian Sector; normal beacon (ship detected).
  Non-unique.
- Setup: A Mantis warship finds you and opens with a threat.
  Twenty different intro lines rotate — mining claims, clan honour, a juvenile captain's first kill — all landing on the same fight.
- Choices:
  1. *(none — forced)* → fight a Mantis Ship, default rewards.
     The ship neither surrenders nor flees.
- Resources: scrap, fuel, missiles, drone parts (default fight rewards); hull damage risk from combat
- Tags: `no-choice`, `fight`
### Mantis fight choice
- Where: Mantis Controlled, Mantis Homeworlds, Engi Controlled, Engi Homeworlds; normal beacon (ship detected).
  Non-unique.
- Setup: For once you see the Mantis before they see you — a warship sitting at the beacon, comm chatter audible ("Negative, I have killed more humans!"), unaware of you.
- Choices:
  1. `Attack the ship.` → fight a Mantis ship, default rewards.
  2. `Attempt to remain concealed.` → odds hidden.
     Either they notice you anyway and the fight starts, or the FTL charges and nothing happens.
  - `[requires: Cloaking]` `Cloak to stay hidden.` → odds hidden, but heavily favourable: usually nothing happens; occasionally "not quickly enough" and the fight starts.
- Resources: scrap, fuel, missiles, drone parts (if fought); hull damage risk
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`
### Mantis fight near sun
- Where: Mantis Controlled, Mantis Homeworlds; normal beacon with red giant hazard (ship detected).
  Non-unique.
- Setup: "Who knows why the Mantis would venture so close to a sun.
  Perhaps it makes for more of a challenge?"
- Choices:
  1. *(none — forced)* → fight a Mantis ship, default rewards, while solar flares periodically set fires on both ships.
- Resources: scrap, fuel, missiles, drone parts; hull damage, fire, crew injury from the hazard
- Tags: `no-choice`, `fight`
### Mantis ship attacking civilian
- Where: Mantis Controlled, Mantis Homeworlds, Engi Controlled, Engi Homeworlds; normal beacon (ship detected).
  Non-unique.
- Setup: A Mantis warship is running down a civilian vessel.
  Sometimes the Mantis hails you first: "Stay out of this human!
  Else you are next!"
- Choices:
  1. `Aid the civilian ship.` → fight the Mantis ship.
     On victory: medium scrap with resources, then a follow-up contact with the rescued civilians (the standard "save the civilian" table — they thank you and give scrap, a crewmember, fuel, or nothing, odds hidden).
  2. `Stay out of it.` → nothing happens.
     "You let them pass and try not to think about it."
- Resources: scrap, fuel, missiles, drone parts, crew (gain, chance); hull damage risk
- Tags: `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Boarders: Mantis
- Where: Mantis Controlled, Mantis Homeworlds; normal beacon, flagged **no ship detected** by Long-Ranged Scanners.
  Unique per sector.
- Setup: No enemy ship — just boarders already inside.
  "You hear a grating rattle and a soft clicking.
  You reach for your pistol."
- Choices:
  1. *(none — forced)* → 2–4 Mantis boarders beam aboard.
     No ship to shoot; you fight them room by room.
- Resources: crew (injure / lose), system damage from the boarders' attacks
- Tags: `no-choice`, `fight`, `tax`
### Escape pod
- Where: Mantis Controlled, Mantis Homeworlds; normal beacon (no ship detected).
  Unique.
- Setup: You retrieve a drifting escape pod, then realise it's Mantis.
  Open it or space it.
- Choices:
  1. `Jettison the pod.` → nothing happens.
     "You send the pod back out the airlock.
     You're not stupid."
  2. `Pry it open.` → odds hidden, three branches:
     - The Mantis kills the nearest crewman and fights: 1 Mantis boarder aboard, **1 crewmember lost**. `[requires: Clone Bay]` the lost crewmember is revived automatically.
     - The Mantis treats you as a messenger from the god of mercy and demands to join: **gain a Mantis crewmember**.
     - A human survivor of Mantis captivity is inside: **gain a Human crewmember**.
- Resources: crew (gain or lose), system damage from the boarder
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `sacrifice`
### Mantis fugitive
- Where: Mantis Controlled, Mantis Homeworlds, Engi Controlled, Engi Homeworlds; normal beacon (no ship detected).
  Unique.
- Setup: A well-armed Engi ship has just killed a pirate craft; a young Mantis in a charred uniform teleports onto your deck begging sanctuary.
  The Engi trace the signal and offer a bounty for him.
- Choices:
  1. `Side with the fugitive and fight the Engi ship.` → odds hidden:
     - Trap: **5 hull damage**, 1 system damage, 1 room damaged, then fight a Mantis-controlled Engi ship.
     - Genuine: **gain a Mantis crewmember**, then fight an Engi ship.
  2. `Agree to offer up the Mantis in exchange for a bounty.` → odds hidden:
     - Clean handover: **high scrap**.
     - He resists: **5 hull damage**, fire in a random room, plus high scrap.
     - Trap: 1 Mantis boarder aboard, fight a Mantis-controlled Engi ship.
- Resources: hull, scrap, crew (gain), system damage, fire, boarders
- Tags: `gamble (odds-hidden)`, `moral`, `fight`, `sacrifice`
### Mantis ship-collectors
- Where: Mantis Controlled, Mantis Homeworlds; normal beacon (ship detected).
  Unique.
  **Two-stage chain.**
- Setup: "Your ship would make a mighty fine prize.
  Prepare for battle!"
  An all-Mantis fighter attacks, and it is coded to run at 50% hull.
- Choices:
  1. *(none — forced fight)* → outcomes:
     - Destroyed → medium scrap with resources.
     - Crew killed → high scrap with resources.
     - They escape (they flee at ~50% hull on a 5-second timer) → "they didn't mask their signatures."
       Then:
       - `After them!` → **quest marker added to map** (stage 2).
       - `Forget it.` → nothing happens.
- Stage 2 (quest marker, ship detected): you catch them transferring crew into a bigger hull.
  "Not YOU again!
  Do you know how much these repairs are going to cost me?"
  Fight an all-Mantis Bomber, which tries to escape at ~60% hull and offers surrender at ~20%.
  - Surrender offer → `Let them live.` (the exact weapon and scrap are shown before you accept) → **gain a weapon plus high scrap**. `Finish them off.` → fight continues.
  - Destroyed → **gain a weapon** + medium scrap with resources.
  - Crew killed → **gain a weapon** + high scrap with resources.
  - They escape again → high scrap with resources from the abandoned fighter.
- Resources: scrap, fuel, missiles, drone parts, weapon, quest marker, hull damage risk
- Tags: `fight`, `chain`, `delayed`, `trade`, `walk-away`
- Chain: stage 1 only leads to stage 2 if the Mantis ship survives long enough to flee — killing it efficiently *costs* you the weapon.
### Legendary thief KazaaakplethKilik
- Where: **Mantis Homeworlds only**; normal beacon (ship detected).
  Unique per run.
  **Mantis Cruiser unlock.**
- Setup: A Mantis ship carrying a century of welded-on armour plate.
  Its captain is the legendary thief KazaaakplethKilik.
  "Your crew look frightened."
- Choices:
  1. `[requires: Mantis crewmember]` `Attempt to hail him.` → your Mantis performs "a weird kind of alien haka" with him while you charge weapons.
     Same fight; flavour only.
  2. `Prepare to fight` → fight an all-Mantis ship (no surrender, no escape).
  - If **destroyed**: medium scrap with resources, and "his death has left a great mystery unresolved" — the unlock is lost.
  - If the **crew is killed** (boarding, suffocation, fire) the ship is intact and you get a second decision layer:
    1. `Move in to strip their ship.` → high scrap with resources.
    2. `[requires: Teleporter]` `Quickly teleport additional crew and check for survivors.` — or `[requires: Sensors lvl 3]` `Quickly scan their ship for survivors.` → you find him dying, and then:
       - `Put him out of his misery.` / `Let him die.` → high scrap with resources.
       - `Listen to what he has to say.` / `Dock and try to speak with him.` → high scrap with resources **and a quest marker** (a hidden weapon cache).
       - `[requires: Medbay lvl 2+]` `Quickly teleport him back to the medbay.` → save him.
       - `[requires: Clone Bay lvl 2+]` `Quickly configure the Clonebay to save him.` → save him.
    - Saving him → `Accept.` → **unlock the Mantis Cruiser**, high scrap, **Mantis Pheromones augment**, a Mantis crewmember named Kazaaak **maxed in every skill**, and a quest marker.
  - Quest marker beacon: a hidden cache in an asteroid field → **a weapon plus high scrap**.
- Resources: scrap, weapon, augment, crew (gain), ship unlock, quest marker
- Tags: `gated`, `fight`, `chain`, `delayed`, `gift`
- Chain: the unlock requires *not* destroying the hull — you must kill the crew and have a teleporter or level-3 sensors plus a level-2 Medbay or Clone Bay.
  Note the wiki's own advice: you can jump away, buy the missing system at a store, and come back.
### Store (Mantis)
- Where: Mantis Controlled, Mantis Homeworlds; store beacon.
  The Mantis-flavoured store wrapper.
- Setup: Six rotating framings for the same shop, and the framings are the content: a well-spoken Mantis trader; a trade-space no-violence zone; "Merchants are not highly respected among the Mantis race"; a leader hissing "come dock before the warriors see you"; a cargo ship you bully into selling at gunpoint; a malfunctioning Rebel supply drone "stuck in vending mode."
- Choices:
  1. *(none)* → a store opens.
- Resources: scrap (spend), fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrades, hull repair
- Tags: `no-choice`, `trade`
### Empty beacon (Mantis)
- Where: Mantis Controlled, Mantis Homeworlds; empty beacon (no ship detected).
  Non-unique.
- Setup: Six rotating nothing-happens texts, several of which are doing quiet worldbuilding — "A nearby Mantis mining operation is clearly using heavy Engi slave labor.
  You briefly consider the possibility of emancipating the slaves, but the Mantis presence is too formidable.
  You decide to lay low."
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`

## Rock sectors
### Rock fight
- Where: Rock Controlled, Rock Homeworlds; normal beacon (ship detected).
  Non-unique.
- Setup: A Rock vessel opens fire.
  The eight intro lines are almost all about offence taken rather than plunder — you hailed on a trading frequency and it read as "an act of cultural transgression"; you were scanned and asked "Why do you fill your computer with lies?!
  These are not the holy words!"
- Choices:
  1. *(none — forced)* → fight a Rock ship, default rewards.
     Rock ships have a chance to offer surrender once badly damaged.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Rock fight in asteroid field
- Where: Rock Controlled, Rock Homeworlds; asteroid field beacon (ship detected).
  Unique.
- Setup: A Rock mining vessel, a rookie cargo ship that took its course orders too literally, or a freighter lost in the field long enough to have gone fatalistic: "Our co-ordinates led us here, but only death greets us.
  What must be must be.
  Death to all."
- Choices:
  1. *(none — forced)* → fight a Rock ship, default rewards, with asteroids striking both ships throughout.
- Resources: scrap, fuel, missiles, drone parts; hull damage, system damage, breaches from the hazard
- Tags: `no-choice`, `fight`
### Rock fight with boarders
- Where: Rock Controlled, Rock Homeworlds; normal beacon (ship detected).
  Unique.
- Setup: Either you scanned a Rock station and they "must not have appreciated your curiosity," or a Rock ship is docked with a captured Mantis fighter and is using its teleporter on you.
- Choices:
  1. *(none — forced)* → 1–3 Rock boarders aboard **and** a Rock ship fight simultaneously.
     Default rewards.
- Resources: scrap, fuel, missiles, drone parts; crew injury/loss, system damage
- Tags: `no-choice`, `fight`
### Rock fight with boarders in asteroid field
- Where: Rock Controlled, Rock Homeworlds; asteroid field beacon (ship detected).
  Unique.
- Setup: The same trap in an asteroid field — the clunk you take for a hull strike is a teleporter.
- Choices:
  1. *(none — forced)* → 1–2 Rock boarders plus a Rock ship, inside an asteroid field.
- Resources: scrap, fuel, missiles, drone parts; crew, hull, system damage
- Tags: `no-choice`, `fight`
### Rock pirates fight
- Where: Rock Controlled, Rock Homeworlds; normal beacon (ship detected).
  Non-unique.
- Setup: Rock outcasts flying pirate colours.
  "A Rock ship flies past your windows and you recognize outcast decorations on the hull."
- Choices:
  1. *(none — forced)* → fight a Rock pirate ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Rock pirates fight in asteroid field
- Where: Rock Controlled, Rock Homeworlds; asteroid field beacon (ship detected).
  Unique.
- Setup: "You exit the jump surrounded by dirt and rocks.
  Before long a blast is deflected by your shield, but that was no asteroid..."
- Choices:
  1. *(none — forced)* → fight a Rock pirate ship in an asteroid field.
- Resources: scrap, fuel, missiles, drone parts; hull, system damage
- Tags: `no-choice`, `fight`
### Rock pirates fight near sun
- Where: Rock Controlled, Rock Homeworlds; red giant beacon (ship detected).
  Unique.
- Setup: A Rock pirate silhouetted against a star going supernova, hailing in something between panic and anger: "Even out here you follow us!
  We only wish to be left alone!"
- Choices:
  1. *(none — forced)* → fight a Rock pirate ship with solar flares igniting both ships.
- Resources: scrap, fuel, missiles, drone parts; hull damage, fire, crew injury
- Tags: `no-choice`, `fight`
### Boarders: Rockmen near sun
- Where: Rock Controlled, Rock Homeworlds; red giant beacon (**no ship detected**).
  Unique.
- Setup: No enemy ship.
  "With their high resistance to heat, outlaw Rocks often settle very close to stars."
  You stumble past a hidden settlement and they come aboard.
- Choices:
  1. *(none — forced)* → 2–3 Rock boarders aboard, while flares light fires.
     Rockmen are fire-immune; you are not.
- Resources: crew (injure / lose), system damage, fire
- Tags: `no-choice`, `fight`, `tax`
### Disabled Rock ship
- Where: Rock Controlled, Rock Homeworlds; normal beacon (no ship detected).
  Unique.
- Setup: A disabled Rock transport drifts at the beacon.
  Salvage is obvious; why nobody has already taken it is not.
- Choices:
  1. `Strip the ship.` → odds hidden.
     Either you get a random amount of scrap with resources and nobody interferes, or you get the scrap **and** a Rock patrol jumps in mid-salvage ("Filthy pirates!
     Prepare to die!") and you fight a Rock ship.
  2. `Leave it alone.` → odds hidden.
     Usually nothing happens; sometimes a patrol arrives anyway, misidentifies you as the killers, and attacks before you can answer.
  - `[requires: Slug crewmember]` `Check for lifeforms and keep a lookout for ships while looting the wreck.` → you get the scrap, guaranteed, with no fight — either nothing is detected, or you are warned in time to leave.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk from the fight
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`
### Rock live mine
- Where: Rock Controlled, Rock Homeworlds; normal beacon (no ship detected).
  Unique.
- Setup: A burnt-out Rock minelayer drifts past, and behind it a live mine — "an automated drone that drills into ships' hulls before exploding" — locks onto you.
- Choices:
  1. `Attempt evasive maneuvers.` → the mine latches on: "you can hear it now, chewing through the armor."
     Then:
     - `Send someone out there to defuse it.` → odds hidden.
       Either the crewmember defuses it cleanly (medium scrap), or they panic at the wire: "The red wire or the blue?! 3... 2... 1..." → `Red!` / `Blue!` are mechanically identical, and resolve on a hidden roll to either medium scrap, or **6 hull damage, a breach, and a crewmember killed** (revived automatically `[requires: Clone Bay]`).
     - `[requires: missile weapon]` `Attempt a controlled detonation using a missile.` (nominally 1 missile; a data-file typo means it costs none) → **4 hull damage**, 1 system damage, low scrap.
       Guaranteed, no crew risk.
     - `[requires: beam drone]` `Use a drone to cut away the mine with a precision beam.` (costs 1 drone part) → clean removal, low scrap.
  - `[requires: Engines lvl 5+]` `Reverse thrusters!` → you outrun it.
    Nothing happens.
- Resources: hull, scrap, crew (lose), system damage, breach, drone parts, missiles
- Tags: `gamble (odds-hidden)`, `gated`, `push-your-luck`, `sacrifice`, `trade`
### Rock atheists
- Where: Rock Controlled, Rock Homeworlds; normal beacon (ship detected).
  Unique.
- Setup: A barely-powered craft whose Rock crewman says "the Rock home-world is run on lies and propaganda that keep the populace in check, and that they want no part of it."
  He is a defector looking for somewhere to go.
- Choices:
  1. `Tell them their god sent them here to join your crew.` → always a fight.
     "These are the lies I sought to escape!"
     Fight a Rock ship, default rewards.
  2. `Promise to share with them the truths they've been denied.` → odds hidden.
     Usually they decline and jump away (nothing happens); sometimes **gain a Rockman crewmember**.
  - `[requires: Sensors lvl 2+]` `Show them to your data suite.` → guaranteed **Rockman crewmember**.
    Evidence beats rhetoric.
- Resources: crew (gain), scrap, fuel, missiles, drone parts (if fought); hull damage risk
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `moral`
### Rock bride
- Where: Rock Controlled, Rock Homeworlds; normal beacon (no ship detected).
  Unique.
  **Two-stage chain.**
- Setup: A Rock captain, apologising for even speaking to off-worlders, asks you to carry a woman to her arranged husband — the Grand Basilisk of Numa V — because their engines have failed.
  She "refuses to enter the main hold and prefers to wait in the cargo bay."
- Choices:
  1. `Accept the passenger.` → **quest marker added to map**.
  2. `Refuse.` → nothing happens.
     "Arranged marriages aren't on your list of worthy causes."
- Stage 2 (quest marker, no ship detected): approaching Numa V, the passenger — silent the whole journey — begs you not to hand her over, and is cut off by the Basilisk's Chief Aide promising a reward.
  1. `Hand her over.` → **gain an augmentation** plus low scrap.
     "May your children erode into dust!"
  2. `Refuse to comply.` → **gain a Rockman crewmember named Ariadne**, and immediately fight the Basilisk's escort Rock ship (destroyed → medium scrap with resources; crew killed → high scrap with resources).
- Resources: augment, crew (gain), scrap, fuel, missiles, drone parts, quest marker; hull damage risk
- Tags: `chain`, `delayed`, `moral`, `optional-fight`, `walk-away`
- Chain: the moral choice is deferred a full jump — you accept a cargo, and only at the destination learn the cargo objects.
### Rock and Slug standoff
- Where: Rock Controlled, Rock Homeworlds; normal beacon (no ship detected).
  Unique.
  (Identical event text runs in Slug sectors as `Slug and Rock standoff in nebula`.)
- Setup: A Slug Cruiser and a Rock ship face each other with weapons armed.
  The dispute is a billing dispute: the Slugs upgraded the Rock ship's reactor, the Rock crew call the work shoddy, the Slugs call them "thick boulder heads."
- Choices:
  1. `Hail them to see what's wrong.` → then:
     - `Offer to pay off the Rock debt.` (costs **10–15 scrap**) → peace holds; go to the Slug reward table.
     - `Demand the Rock ship pay the agreed upon price.` → odds hidden, three branches: the Rock pay up (Slug reward table); the Rock turn on you as the "slime balls' defender" and you fight a Rock ship (low/medium scrap, then the Slug reward table); or the Rock ship's badly-upgraded reactor **explodes**, debris hits you for **5 hull damage and 1 damage to each of two systems**, and the Slugs jump away.
     - `You have better things to attend to, leave them.` → nothing happens.
  2. `Leave them be.` → nothing happens.
  - Slug reward table (odds hidden): a **free reactor upgrade**; or a reactor upgrade offered at a "fair" price (**10–15 scrap**, accept or decline); or just thanks and nothing.
- Resources: scrap (spend), reactor (upgrade), hull, system damage; fight rewards
- Tags: `gamble (odds-hidden)`, `trade`, `walk-away`, `optional-fight`, `moral`
### Mantis ship with Rock body parts
- Where: Rock Controlled, Rock Homeworlds; normal beacon (ship detected).
  Unique.
- Setup: "A Mantis ship here is adorned with Rock body parts!
  It would be a gorier display if they had internal organs, but the message is clear enough: this is a hunter of a very specialized kind."
- Choices:
  1. `Attack!` → fight the Mantis ship, default rewards.
  2. `Ignore them.` → nothing happens.
     They are waiting for Rock ships, not you — and this holds even if you are flying the Rock Cruiser.
  - `[requires: Rock Plating augment]` `Ram the bastards.` → fight the Mantis ship **with its engines disabled** (no evasion, cannot flee).
  - `[requires: Rock crewmember]` `Put your Rock crewmember on the comm.` → pure flavour, same fight.
    "Cave-dwelling pebble-man!" yells the Mantis captain.
    "See, I paint my ship with your companions!
    I paint my ship with you!"
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `gated`, `optional-fight`, `walk-away`, `moral`
### Mantis ships battle for Rock freighter
- Where: Rock Controlled, Rock Homeworlds; normal beacon (no ship detected).
  Unique.
- Setup: A disabled Rock freighter drifts while two Mantis craft fight each other over the salvage rights.
- Choices:
  1. `Wait, then attack the surviving Mantis.` → odds hidden.
     Either the winner's **weapon control is down 2 power** when you strike, or both Mantis notice you and the larger one attacks at full strength.
     Either way: victory → medium scrap with resources, and the Rock freighter repairs its FTL and slips away.
  2. `Ignore them.` → nothing happens.
  - `[requires: Repair Drone]` `Repair the Rock ship.` (costs 1 drone part; bugged so that it often costs nothing) → the Rock crew, once mobile, immediately kamikaze both Mantis ships.
    **No fight for you**, high scrap with resources.
  - `[requires: Hull Repair Drone]` `Repair their hull.` (costs 1 drone part) → the Rock chase one Mantis, the other turns on you.
    Fight, medium scrap with resources.
- Resources: drone parts (spend), scrap, fuel, missiles; hull damage risk
- Tags: `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`, `trade`
### Empty beacon (Rock)
- Where: Rock Controlled, Rock Homeworlds; empty beacon (no ship detected).
  Non-unique.
- Setup: Seven rotating nothing-texts, nearly all about being refused service.
  "You see a small trading post and ask about refuelling but they respond, 'Go away!
  We don't serve your kind here.'" A Zoltan merchant will not even be seen talking to you: "it took years to gain their trust."
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`
### Store (Rock)
- Where: Rock Controlled, Rock Homeworlds; store beacon.
- Setup: Five framings, each one an explanation of why trade is happening at all despite Rock xenophobia — a ship back from a rare diplomatic mission, a post dumping its last stock and expecting to "pay their dues for their transgression when they return home," an opportunistic Mantis crew filling the gap, Zoltan traders operating out of an abandoned capital ship, or a stranded Federation sympathiser.
- Choices:
  1. *(none)* → a store opens.
- Resources: scrap (spend), fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrades, hull repair
- Tags: `no-choice`, `trade`
### Dense asteroid field distress — Crystal chain, step 1
- Where: Rock Controlled, Rock Homeworlds, Engi sectors, Pirate Controlled; **distress beacon** (no ship detected).
  Unique.
- Setup: A ship with no life signs is broadcasting distress from inside a dense asteroid field.
- Choices:
  1. `Search for the ship.` → odds hidden, three branches:
     - Asteroids get through: **5 hull damage, 1 engine damage**, you pull out with nothing.
     - An abandoned pirate ship: a random amount of scrap with resources.
     - The derelict (below).
  2. `Avoid the area.` → nothing happens.
  - `[requires: Rock Plating augment]` `Make a thorough search for the ship without fear of stray asteroids.` → the derelict, guaranteed.
  - The derelict: a hull "coated with ice or crystal."
    An asteroid is inbound and your crew can only grab one thing.
    - `Take the weapon and any spare scrap.` → **gain a weapon** plus low scrap.
    - `Grab the stasis chamber.` → **gain the Damaged Stasis Pod augment** plus low scrap.
      "You see nothing but shards of crystal inside."
- Resources: hull, engines (damage), scrap, weapon, augment
- Tags: `gamble (odds-hidden)`, `gated`, `chain`, `delayed`, `walk-away`, `sacrifice`
- Chain: step 1 of 3 toward the Crystal Cruiser.
  Taking the weapon ends the chain.
### Zoltan research facility — Crystal chain, step 2
- Where: Engi Controlled, Engi Homeworlds, Zoltan Controlled, Zoltan Homeworlds; normal beacon (no ship detected).
  Non-unique (once per Zoltan sector, one or two per Engi sector).
  Listed here because it is the middle link of a chain that ends in Rock Homeworlds.
- Setup: Zoltan researchers studying "genetic distortion due to stasis sleep and prolonged FTL travel" ask to scan your crew.
- Choices:
  1. `Participate in their study.` → odds hidden.
     Usually low scrap and "small cakes made from stiff dough"; sometimes it is a hostage ambush — **2 boarders** and a pirate ship — and clearing it yields medium/high scrap with resources plus a **drone schematic** and low resources.
  2. `Decline.` → nothing happens.
  - `[requires: Medbay lvl 3]` `Give them your medical records.` → **drone schematic** plus low resources and scrap, no risk.
  - `[requires: Damaged Stasis Pod augment]` `Ask if they can fix this.` → they revive it.
    "The hunks of crystal inside reform to build a humanoid structure." → **gain a Crystal crewmember named Ruwen**, and **a quest marker appears in the Rock Homeworlds** as long as Ruwen stays alive.
- Resources: scrap, drone schematic, crew (gain), quest marker; boarders and hull damage risk
- Tags: `gated`, `gamble (odds-hidden)`, `chain`, `delayed`, `walk-away`
- Chain: step 2 of 3.
  Requires the Stasis Pod from step 1; the marker it plants is step 3.
### Ancient device — Crystal chain, step 3 (Crystal Cruiser unlock)
- Where: **Rock Homeworlds only**; normal beacon (no ship detected), which becomes a quest beacon if Ruwen is aboard.
  Unique.
- Setup: "An ancient device is orbiting within the crystal rings of a nearby gas giant.
  You can't discern its nature or function, but it seems to have been deactivated for a very long time."
- Choices:
  1. `Scrap it.` → odds hidden.
     Either high scrap, or a Rock military ship jumps in — "You think you can come into our sector and just steal whatever you please?!" — and you fight.
  2. `Leave it alone.` → nothing happens.
     "The Rock people are unlikely to respond well to vandalism."
  - `[requires: Crystal crewmember]` `Reactivate it.` → **gain 1 fuel**, a wormhole opens, and spending **1 fuel** takes you to the Hidden Crystal Worlds — an entire hidden sector.
    There, Ruwen gives you a **quest marker**; at it, a Crystalline cruiser is sent to the Federation and you **unlock the Crystal Cruiser**, receive medium fuel and scrap, the **Crystal Vengeance augment**, and **10 hull repairs**.
- Resources: fuel, scrap, hull (repair), augment, ship unlock, quest marker, map (you are moved to a hidden sector); hull damage risk from the fight
- Tags: `gated`, `chain`, `delayed`, `gift`, `optional-fight`, `walk-away`
- Chain: step 3 of 3.
  Any Crystal crewmember opens the wormhole, but only Ruwen makes the beacon show as a quest, so the chain is really a map-generation gamble: the three steps must appear in the right sector order or it cannot be finished.
  Exiting the Crystal sector also takes away your choice of next sector.
### Rock war vessel encounter — Rock Cruiser unlock
- Where: **Rock Homeworlds only**; normal beacon (ship detected).
  Unique per run.
  **Three-stage chain.**
- Setup: An imposing Rock war vessel hails first, and it is contemptuous: "You're the ship off to 'save the Federation,' aren't you?
  And you expect to survive with that hunk of junk?"
- Choices:
  1. `"We're going to save them or die trying."` → **quest marker**.
     "The latter being more likely.
     Still..."
  2. `"We're strong enough to destroy you!"` → **quest marker**.
     "One ship is not the same as a fleet, but at least you've got some fire."
  3. `Ignore them.` → nothing happens, and the unlock is gone.
     "If the Federation is as weak as you it deserves to fall."
- Stage 2 (quest marker at a **red giant** beacon, ship detected): "Let's see how long your puny ship can handle this heat!"
  You fight a Rock Assault (Elite) that is *trying to leave* on a 32-second timer.
  The test is endurance, not victory:
  - **They get away** → they relay coordinates: a second quest marker.
    This is the success path.
  - Destroyed → medium scrap with resources, "you feel a twinge of guilt," no unlock.
  - Crew killed → high scrap with resources, no unlock.
- Stage 3 (quest marker, ship detected): a Rockman shipyard, with the ship that just tried to kill you already in dock.
  "Well fought!
  I must say I did not expect you to survive." → **unlock the Rock Cruiser**, **Rock Plating augment**, and **29 hull repairs**.
- Resources: quest marker, ship unlock, augment, hull (repair), scrap, fuel, missiles, drone parts; hull damage and fire risk at the star
- Tags: `chain`, `delayed`, `fight`, `walk-away`, `gift`
- Chain: the win condition inverts the usual one — you unlock the ship by *failing* to kill it while surviving a solar-flare beacon.

---

## Slug sectors
Note on the sector: most Slug beacons sit inside nebula, which kills your sensors (you cannot see inside the enemy ship) but slows the Rebel fleet to 80% pursuit when you jump from one.
Several Slug events are flagged "occurs at a regular beacon, but when you arrive there will be a nebula environment" — the sector hides information from you structurally, before any event text runs.
### Slug fight
- Where: Slug Controlled Nebula, Slug Home Nebula; normal (non-nebula) beacon (ship detected).
  Unique.
- Setup: "It's rare for the Slugs to stay exposed in open space for long periods - the ship here may be lost, or just passing through, but either way he moves in to attack!"
- Choices:
  1. *(none — forced)* → fight a Slug ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Slug fight in nebula
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Non-unique.
- Setup: Five intro lines, all about being out-sensed: "Your sensors are no match for the Slug's telepathic abilities - a ship you never even saw opens fire from astern!"
  One is a fake asylum plea: "Please, your worthy alien highnessesss, we are unarmed and sseeking asssylum."
- Choices:
  1. *(none — forced)* → fight a Slug ship in a nebula (no sensors on the enemy ship). 50% chance of a surrender offer at 30–40% hull, 50% chance of an escape attempt at 30–40% hull.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
- Chain: this event is **deliberately indistinguishable** from `Slug Home Nebula surrender` — same intro text, same surrender text.
  The only way to tell them apart is to accept the surrender.
### Slug fight in plasma storm
- Where: Slug Controlled Nebula, Slug Home Nebula; plasma-storm beacon outside a nebula (ship detected).
  Non-unique.
- Setup: An ion storm is shutting down your systems while Slug ships, largely unaffected, circle "like space-vultures."
- Choices:
  1. *(none — forced)* → fight a Slug ship while ion storms periodically halve your system power.
     Same 50/50 surrender and escape rolls.
- Resources: scrap, fuel, missiles, drone parts; system power loss, hull damage
- Tags: `no-choice`, `fight`
### Mantis fight (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (ship detected).
  Unique.
- Setup: Intercepted Mantis chatter that reads you by smell: "Look.
  This ship appears not to be owned by the squishy ones.
  Maybe they won't smell so bad when we cut them open."
- Choices:
  1. *(none — forced)* → fight a Mantis ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Mantis fight in nebula (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Unique.
- Setup: "The Mantis attack ship here looks to have been hunting Slugs on their home turf - a rare test of honor for the mightiest Mantis crews."
- Choices:
  1. *(none — forced)* → fight a Mantis ship in a nebula.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Pirate fight (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (ship detected).
  Non-unique.
- Setup: "Be on your guard; anyone trying to hunt in Slug territory is either formidable or deeply stupid, and in space, either can be dangerous."
- Choices:
  1. *(none — forced)* → fight a pirate ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Pirate fight choice in nebula
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Unique.
- Setup: You move in to help a stranded ship, then see the pirate insignia.
- Choices:
  1. `Attack!` → fight a pirate ship, default rewards.
  2. `Keep your distance and hope they haven't seen you yet.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `optional-fight`, `walk-away`
### Rebel fight (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (ship detected).
  Non-unique.
- Setup: Rebels reaching into Slug space.
  "Looks like our intelligence was correct!
  Sneaking through the clouds with the Slugs...
  No one can hide from the rebellion!"
- Choices:
  1. *(none — forced)* → fight a Rebel ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Rebel fight chance
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Non-unique.
- Setup: A colony, a Federation encrypted message, or the wreck of a civilian ship still repeating "Rebels attacking, please send aid!" — a rogue Rebel is somewhere in the system and you are asked to find it.
- Choices:
  1. `Go looking for the Rebel ship.` → odds hidden: find it quickly and fight; find it slowly and fight with **Rebel fleet pursuit doubled for 1 jump**; or fail to find it at all (nothing happens).
  2. `No time to search, you prepare to jump away.` → nothing happens.
  - `[requires: Sensors lvl 2]` `Perform a scan of the area.` → find it immediately, fight, no fleet cost.
  - `[requires: Sensors lvl 3]` `Pinpoint the Rebel's location.` → fight it **with its engines permanently disabled**.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet advance; hull damage risk
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`
### Slug drink
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Unique.
- Setup: A Slug captain invites himself aboard with a flask.
  "Now, most gracioussss captain, you must join me please in a drink to our alliance!"
- Choices:
  1. `Drink.` → odds hidden.
     Either "it's a thousand to one chance, but this Slug actually seems to be trustworthy" — **10 hull repairs and a store opens**; or you wake in the cargo hold and **lose 25–35 scrap**.
  2. `Refuse.` → he "feigns offense... but you sense that he respects your caution," then returns to his ship and opens fire.
     Fight a Slug ship.
  - `[requires: Rock crewmember]` `Have your Rockman pose as captain.` → odds hidden, but both outcomes are good for you: either the drink is clean (**10 repairs + store**), or the Rockman's robust digestion detects "a heavy anaesthetic" and the ruse being blown starts a fight you were going to have anyway.
- Resources: hull (repair), scrap (lose), store access; fight rewards
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `moral`
### Slug hacker (choice)
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (no ship detected).
  Unique.
- Setup: "I'm feeling generouss today.
  I shall allow you to choose your own death.
  Which do you like leasst: shields, oxygen, or weaponsss?"
  You pick which of your own systems gets hacked.
- Choices:
  1. `Shields.` → fight a Slug ship with **your shields halved**.
     Destroyed → medium scrap with resources; crew killed → high.
  2. `Oxygen.` → fight with **oxygen halved**.
     Either win → medium scrap with resources.
  3. `Weapons.` → fight with **weapon control halved**.
     Either win → high scrap with resources.
  4. `Offer 35 scrap to leave you alone.` (costs **35 scrap**) → "I really am feeling generousss..."
     They take it and leave.
     No fight.
  - `[requires: Hacking system]` `Counter any hack attempt.` → "Wait.
    Why isn't this working?"
    Fight with only **your Hacking offline** — the best outcome, and high scrap with resources.
- Resources: scrap (spend or gain), fuel, missiles, drone parts, system power (temporarily halved); hull damage risk
- Tags: `trade`, `gated`, `sacrifice`, `optional-fight`, `walk-away`
- Note: the "Shields" option can be picked even with no shield system installed, and the "Weapons" hack does not touch Artillery — the menu is not honest about what it costs you.
### Slug hacker (doors)
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (no ship detected).
  Unique.
- Setup: "There are few more vicious beasts in the galaxy than a Slug with his back to the wall."
  A faltering ship carrying fire weapons hacks your doors: "they're going to burn you out!"
- Choices:
  1. `Continue...` → fight a Slug ship with **your door system offline** (doors freeze in whatever state they were in when you jumped) against a ship guaranteed to carry a Fire Beam or Fire Bomb.
     Destroyed → medium scrap with resources; crew killed → high.
  - `[requires: Hacking system]` `Counter the remote hacking.` → fight with only **your Hacking offline**; high scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, doors subsystem (disabled); hull damage, fire, crew injury
- Tags: `no-choice` (unless gated), `gated`, `fight`
### Slug hacker (medical)
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Unique.
- Setup: "We've detected some worrying radiation coming from your medical unit, perhaps you should take a look?"
  As he signs off, your medbay shuts down and boarders arrive.
  "They don't look like engineers."
- Choices:
  1. `Continue...` → **2 Slug boarders** plus a Slug ship, with **your Medbay/Clone Bay offline** — boarders while you cannot heal.
  - `[requires: Medbay lvl 2+]` `Try to squeeze some extra power to the system.` → same fight with **Medbay halved** instead of dead.
  - `[requires: Hacking system]` `Counter the remote hacking.` → same fight with only **your Hacking offline**.
  - Any win → high scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, medbay (disabled); crew injury/loss, hull damage
- Tags: `gated`, `fight`
### Slug hacker (oxygen)
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Unique.
- Setup: "The slugs here use a tactic you hoped you'd never see: They sabotage your oxygen production system and then charge fire-weapons - you're going to suffocate!"
  Fire consumes oxygen; you cannot make more.
- Choices:
  1. `Continue...` → fight a Slug ship with **oxygen offline**, against a ship guaranteed to carry a Fire Beam or Fire Bomb.
  - `[requires: Oxygen lvl 2+]` `Try to squeeze some extra power to the system.` → **oxygen halved** instead of dead.
    (The only blue option in the game that uses an upgraded Oxygen subsystem.)
  - `[requires: Hacking system]` `Counter the remote hacking.` → only **your Hacking offline**.
  - Any win → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, oxygen (disabled); crew suffocation, fire, hull damage
- Tags: `gated`, `fight`
### Slug repair station
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (no ship detected).
  Unique.
- Setup: "Greetingsss traveller!
  Care for a fix up?
  We could eassily patch up ssome of that damage."
  A free repair offer, in Slug space.
- Choices:
  1. `No thanks.` → nothing happens.
     "Too bad!
     Trussst iss a rare commodity these days."
  2. `Sure.` → odds hidden, three branches:
     - **10 hull repairs**, then you cannot undock → extortion (below).
     - **1 hull repair** after a long wait, then you cannot undock → extortion (below).
     - An EMP blast kills your engines and a hidden ship attacks: fight with **engines limited to level 1**.
  3. `Ask if they would like payment.` → odds hidden: either you overhear "They're not falling for it.
     Just kill the crew and we can ssstrip..." and fight; or they turn honest — "Ahhh.
     A fellow businessman" — and sell you **10 repairs for 50 scrap**, accept or decline.
  - Extortion table (odds hidden, after a "free" repair): either they demand **15 fuel** — pay, or refuse and take **5 hull damage, 1 system damage, and a fight**; or they reveal they installed a limiter on your weapons and demand **50 scrap** — pay, or break away and fight with **weapon control halved**.
- Resources: hull (repair or damage), fuel, scrap, engines/weapons (limited), system damage
- Tags: `gamble (odds-hidden)`, `trade`, `push-your-luck`, `walk-away`, `optional-fight`
- Note: the honest-looking free option is the trap, and the suspicious "would you like payment?" option is the one that can produce a fair trade.
### Slug store ship
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (ship detected).
  Unique.
- Setup: A Slug transport with a military escort.
  "We have been waiting for a customer for agesss.
  Care to see our waresss?"
  The whole event is a stalling script: each question you answer buys them teleport time.
- Choices:
  1. `Decline.` → nothing happens.
  2. `Ask to see the goods.` → "I need to explain sssome ground ruless of our transsaction." → `Understood.` → a second disclaimer ("We hold no liability for productsss damaged post ssale") → `Not a problem.` → odds hidden:
     - **Gain 5 fuel and a store opens.**
       "It's not often I meet patient alienss."
     - "please die quietly" — **2 Slug boarders** and a Slug ship fight.
     - Your weapons were disabled during the conversation — **1 Slug boarder** and a fight with **Weapon Control offline**, which stays offline until you jump.
     - `Forget this.` at the second prompt → odds hidden: either **1 boarder plus a fight**, or a clean exit.
     - `Forget this.` at the first prompt → nothing happens.
  - `[requires: Slug crewmember]` `Our Slug senses someone aboard the ship. Investigate it.` → you catch the intruder mid-teleport; straight fight with no boarders and no disabled systems.
- Resources: fuel, store access, scrap, weapons (disabled); crew injury, hull damage
- Tags: `push-your-luck`, `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`
### Store in nebula (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; store beacon inside nebula.
- Setup: Two framings: a Slug teleports onto your bridge unannounced and starts "brandishing things at you," or you land on a Slug colony on an asteroid — "it can take weeks to get the mucus out of your clothes."
- Choices:
  1. *(none)* → a store opens.
- Resources: scrap (spend), fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrades, hull repair
- Tags: `no-choice`, `trade`
### Slug moons question
- Where: Slug Controlled Nebula, Slug Home Nebula; **distress beacon** (no ship detected), nebula environment on arrival.
  Unique.
- Setup: A Slug marooned on a moon offers to join you if you answer one question: "How many moons are there in orbit here?"
  The intro text — which you already read — states the number.
- Choices:
  1. `Investigate.` then `Five.` / `Six.` / `Seven.` / `Eleven.`
     - Correct → **gain a Slug crewmember**.
       "That isss... correct.
       You sssurprise me."
     - Wrong → "Further, I have taken advantage of your lack of acuity to beam aboard your ship and steal your stuff!"
       **Lose 35 scrap, 2–4 fuel, and 1–2 drone parts.**
- Resources: crew (gain), scrap, fuel, drone parts (all lost on a wrong answer)
- Tags: `gamble (odds-shown)` — the answer is in the text, so it is a reading test rather than a roll — `tax`, `gift`
- Note: before Advanced Edition the four intro variants could be told apart by their punctuation, which was patched out.
  The event is now purely a test of whether you read the setup.
### Slocknog
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected), nebula environment on arrival.
  Unique.
- Setup: A Slug alone on a moon.
  "Ah, a sssentient ssspecies, after all this time.
  I am Slocknog, a wandering hero ssseeking adventure.
  You may hire me for a ssmall sssum."
- Choices:
  1. `Hire Slocknog.` (costs **55 scrap**; his skills are shown before you pay) → **gain a Slug crewmember named Slocknog**.
  2. `Ignore Slocknog.` → he immediately drops the price to zero: "Please, I ssee you are a sssly captain.
     You have an advantage.
     Very well."
     Then:
     - `Rescue him.` → **gain Slocknog for free** (his skill set can differ from the paid version).
     - `Leave him.` → nothing happens.
- Resources: scrap (spend), crew (gain)
- Tags: `trade`, `walk-away`, `gift`
- Note: the "ignore" branch is strictly better than paying — the event rewards calling the bluff.
### Slug oxygen malfunction
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (ship detected), nebula environment.
  Unique.
  (Meant to be a distress beacon; a missing tag in the data files stops it.)
- Setup: "Ah, yesss, we are having problems with our oxygen generation unit.
  Perhaps your crew can assist in repairsss?"
- Choices:
  1. `Send some crew to help.` → odds hidden:
     - Genuine: **high scrap**.
     - Trap: **1–3 Slug boarders** aboard and a Slug ship fight.
     - Worse trap: **lose a crewmember** (revived `[requires: Clone Bay]`) and a Slug ship fight.
  2. `Ignore them.` → nothing happens.
     "You know better than to trust the Slugs."
  - `[requires: Mantis crewmember]` `Have your Mantis oversee the repairs.` → "nothing is wrong with their O2 system.
    Almost expecting this, your Mantis calmly responds to the trap.
    Once a couple of the Slugs have been spread across the walls of their ship, the rest surrender."
    **High scrap**, guaranteed, no fight.
- Resources: scrap, crew (lose), fuel, missiles, drone parts; hull damage risk
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`, `moral`
### Slug ship boarding Rock ship
- Where: Slug Controlled Nebula, Slug Home Nebula; **distress beacon** (no ship detected), nebula environment.
  Unique.
- Setup: A Slug ship is boarding a disabled Rock freighter.
- Choices:
  1. `Engage the Slug ship.` → odds hidden: either a fight (win → medium scrap with resources, then either the Rock leave with a curt "Thanks." or the freighter turns out to have been **abandoned all along**, worth another medium scrap with resources); or the Slugs back down without a shot and the Rock crew jump away without a word.
  2. `Ignore them.` → odds hidden: usually nothing; sometimes the "disabled" Rock ship springs to life, destroys the Slugs, and turns on you — "You are either a coward or an ally of the Slugs.
     Either way, you don't deserve to live."
     Fight a Rock ship.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `gamble (odds-hidden)`, `optional-fight`, `moral`, `walk-away`
### Slug and Rock standoff in nebula
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (no ship detected).
  Unique.
- Setup: "You detect multiple ships running at maximum power nearby, but you can't see anything through this thick nebula."
  A wrapper that hides what the encounter is until you commit.
- Choices:
  1. `Get closer.` → loads the full `Rock and Slug standoff` event (see Rock section) inside the nebula.
  2. `Ignore them.` → nothing happens.
- Resources: same as `Rock and Slug standoff` — scrap, reactor upgrade, hull, system damage
- Tags: `gamble (odds-hidden)`, `walk-away`, `chain`
### Mantis ship attacking Slug ship
- Where: Slug Controlled Nebula, Slug Home Nebula; **distress beacon** (no ship detected).
  Unique.
- Setup: A Slug ship caught in open space by a Mantis raider: "Please, we'll give you all we have if you sssave ussss!"
- Choices:
  1. `Attack the Mantis ship.` → win → medium scrap with resources, then the Slugs renege: "we do not currently have the liquid asssets to reward you at this time."
     Then:
     - `Leave them be.` → nothing happens.
     - `Finish them off.` → odds hidden: either they suddenly find the money — "A misstake!
       A sssimple misstake.
       Of course we can pay you!" — and you get an **augmentation plus low scrap**; or they break apart and you loot a random amount of scrap with resources.
  2. `Attack the Slug ship.` → fight the Slug ship instead; win → **high scrap with resources**, "after, that is, you split your takings with the Mantis."
  3. `Of all the species in the galaxy, these two deserve one another. You power up the jump drive.` → nothing happens.
- Resources: scrap, augment, fuel, missiles, drone parts; hull damage risk
- Tags: `gamble (odds-hidden)`, `moral`, `optional-fight`, `walk-away`
- Note: threatening the people you just rescued is the highest-value line in the event.
### The Black Raven
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (ship detected).
  Unique.
- Setup: A Slug pirate ship with "The Black Raven" painted on the side.
  "I am the dreaded pirate, Captain Nights.
  You mussst be full of fear, no?
  You have heard of me... no?"
  (A Princess Bride reference.)
- Choices:
  1. `No.` → "Well I have heard of you and I must see if you are as dangerousss as they say.
     I challenge you!"
     Then:
     - `Accept his challenge.` → fight the Black Raven (always a Slug Assault — the only way to meet one as early as sector 4).
     - `Decline.` → "However you have no choice in the matter!"
       Same fight.
     - `[requires: Slug crewmember]` `Engage in a duel of the mind.` → odds hidden: your Slug loses and collapses — **1–2 Slug boarders** plus the fight; or your Slug **wins the telepathic duel outright** and Nights concedes: **gain a weapon plus high scrap, with no combat at all**.
  - Fight outcomes: surrender at 30–40% hull → `Accept his surrender.` (weapon and scrap shown first) → **weapon plus high scrap**; or `Ignore him and attack.` → fight continues.
    Destroyed → medium scrap with resources; crew killed → high.
- Resources: weapon, scrap, fuel, missiles, drone parts; crew injury, hull damage
- Tags: `gated`, `gamble (odds-hidden)`, `fight`, `trade`
### Slug comm tapping
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon (no ship detected).
  Unique.
  **Two-stage chain.**
- Setup: Two Slug ships talking to each other at a beacon.
  "They don't see you."
- Choices:
  1. `Tap their comm frequency.` → you learn they are about to raid a wealthy pirate; **quest marker added**.
  2. `Ignore them.` → nothing happens.
- Stage 2 (quest marker, nebula on arrival, no ship detected): the raid is underway, one Slug ship is already burning, and the survivors offer a deal: "We sssugest you distract the pirate vesssel while we retrieve the valuables.
  Fifty fifty sssplit."
  - `Engage the pirate.` → fight.
    At 30–40% hull the pirate surrenders *and* you notice the Slugs securing the loot and preparing to jump:
    - `Continue fighting the pirate.` → fight continues; destroyed → medium scrap with resources, crew killed → high, and the Slugs leave with the cache.
    - `Let the pirate escape and go after the Slugman ship.` → you catch them; "Ah, of courssse, we would never leave without providing the agreed upon ssspoils."
      **High scrap.**
  - `Head for the cache.` → the Slugs abandon you instantly ("Foolish alienss, no eye for profit") and you fight the pirate alone for low/medium scrap with resources, and the cache is lost in the clouds.
- Resources: scrap, fuel, missiles, drone parts, quest marker; hull damage risk
- Tags: `chain`, `delayed`, `fight`, `gamble (odds-hidden)`, `walk-away`
- Note: the event is built around a choice between a promised split and a visible prize, and the promised split pays better.
### Empty beacon (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; empty beacon outside the clouds (no ship detected).
  Non-unique.
- Setup: Five nothing-texts, all about the relief of having sensors again.
  "You arrive at the beacon and are relieved at the sight of open space.
  Nebulas are terribly claustrophobic."
  One explains the sector's logic outright: "The Slugs rely heavily on their telepathic powers and are reluctant to give up that advantage by extending beyond nebulas."
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`
### Empty nebula beacon (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; empty nebula beacon (no ship detected).
  Non-unique.
- Setup: Six nothing-texts, all about not being able to confirm you are alone.
  "When it comes to Slugs, no news is not necessarily good news.
  However, if they are watching, they don't seem to want to confront you."
  "It's not unusual to feel paranoia in a Slug controlled nebula, but for once, it is unfounded."
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`
### Refugee (Slug) / Refugee distress (Slug)
- Where: Slug Controlled Nebula, Slug Home Nebula; nebula beacon and distress beacon respectively (no ship detected).
  Non-unique.
  Two pages, one body.
- Setup: A refugee ship drifting out of fuel, fleeing the Rebel advance.
  In the non-distress version: "It doesn't appear to have detected you... or else it is trying to avoid notice."
- Choices:
  1. `Hail them.` → odds hidden:
     - They propose a resource trade (the exact offer is shown before you choose): `Trade with them.` → one of **1–2 drone parts for 5–10 fuel**, **1–2 fuel for 4–5 missiles**, **2–3 missiles for 2–3 drone parts**, or **2–4 missiles for 4–10 fuel**. `Politely decline.` → nothing.
     - It is bait: a pirate ship jumps in.
       Fight (no surrender, no escape); destroyed → medium scrap with resources, crew killed → high, plus low scrap with resources from the grateful refugees.
  2. `Ignore the refugees.` → nothing happens.
- Resources: fuel, missiles, drone parts, scrap; hull damage risk
- Tags: `trade`, `gamble (odds-hidden)`, `walk-away`, `optional-fight`
### Slug Home Nebula surrender — Slug Cruiser unlock
- Where: **Slug Home Nebula only**; nebula beacon (ship detected).
  Unique per run.
  **Three-stage chain.**
- Setup: Identical in every visible respect to `Slug fight in nebula` — same five intro lines, same surrender text.
  The wiki is explicit: "This event is impossible to distinguish... the only way to find out is to accept the surrender."
- Choices:
  1. *(forced fight)* → a Slug ship with a **guaranteed** surrender offer at 30–40% hull (and a 50% chance it tries to flee first, which delays the offer).
  - On surrender: "You have besssted us!
    Will you accept what is in our storeesss in exchange for our livess?"
    - `Let them live.` → then:
      - `Accept the prototype weapon.` → **gain the Anti-Bio Beam**.
        "This odd beam weapon does no damage to ships but instead greatly hurts the crew!
        Diabolical!"
      - `We don't want the weapon, we want information.` → "By telling you we will probably die jussst as like as not...
        Oh well."
        **Quest marker** — the coordinates of a prototype cruiser's mobile construction platform.
    - `We will not accept surrender!` → fight continues, unlock lost.
- Stage 2 (quest marker, nebula on arrival, no ship detected): the cruiser is under construction on a platform slipping into the clouds, guarded by a Slug Assault.
  You have not been seen.
  - `Charge them before they escape.` → you win the fight but the platform is gone.
    High scrap with resources, no unlock.
  - `Try to tail them without being noticed.` →
    - `Fly slowly toward their last known position.` → "They must have been able to detect you with their telepathy!"
      Assault fight, platform lost.
    - `Wait and hope the escort leaves.` → you lose track of everything.
      Nothing happens.
    - `[requires: Slug crewmember]` `Have your crewmember monitor their life signatures.` → the assault ship leaves; only an interceptor remains.
    - `[requires: Sensors lvl 2+]` `Try to maintain a lock on their ships from a distance.` → same result.
- Stage 3: fight the Slug Interceptor, which begins escaping on a 35-second timer.
  Its FTL is linked to the cruiser's — if it jumps, the prize jumps with it and you get **nothing**.
  Kill it in time → **unlock the Slug Cruiser**, high scrap with resources, and the **Slug Repair Gel augment**.
- Resources: weapon (Anti-Bio Beam), quest marker, ship unlock, augment, scrap, fuel, missiles, drone parts
- Tags: `chain`, `delayed`, `gated`, `fight`, `trade`, `sacrifice`
- Chain: the whole unlock is built on refusing a known good item (the Anti-Bio Beam) for an unknown lead, in an event you cannot identify as the unlock event before you commit.
### Plagued station
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Unique.
- Setup: A dilapidated station, apparently abandoned, but with "faint life signatures on board."
- Choices:
  1. `Board the station and look for survivors.` → odds hidden:
     - Nothing alive: low scrap.
     - A lone survivor locked in a storage closet: **gain a Human crewmember** plus low scrap.
     - A plague: low scrap, and then one of your crew starts retching. `Continue...` → **lose a crewmember**, and the Clone Bay explicitly **cannot** save them: "You stop your crew's clone from forming, knowing that the disease would follow into his next life." `[requires: Medbay lvl 2+]` `Try to cure the disease.` → cured, nothing lost.
  2. `Scrap some of the debris.` → a random amount of scrap, no risk.
- Resources: scrap, crew (gain or permanently lose)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `walk-away`
- Note: one of the very few crew losses in the game a Clone Bay does not undo.
### Abandoned station
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Unique.
  (Advanced Edition.)
- Setup: An abandoned station near the beacon — a colonised moon gone quiet, a battlefield with one intact structure.
- Choices:
  1. `Move in to examine the station.` → odds hidden:
     - A disused rest stop: low scrap.
     - Pirate ambush: **2 boarders** and a pirate ship fight.
     - Worse ambush: **2–4 boarders** and a remote **Anti-Ship Battery** firing on you from the planet, with no ship to destroy to stop it.
     - A partially intact cloning bay → `[requires: Clone Bay]` `Search for a surviving DNA bank.` → odds hidden: **gain a crewmember**, or the clone "emerges in a crazed frenzy" as **1 boarder**. `Scrap the machinery.` → low scrap.
     - An empty shell: nothing.
  2. `Stay near the Beacon.` → nothing happens.
- Resources: scrap, crew (gain), fuel, missiles, drone parts; hull damage, crew injury
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`
### Rebel checkpoint
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Non-unique.
- Setup: A Rebel checkpoint inspecting civilian ships for Federation ties.
  Every intro ends with the same clause: "The Rebels haven't noticed you yet."
- Choices:
  1. `Fend for yourself, attack, and escape.` → fight a Rebel ship, default rewards.
  2. `Bribe the Rebels to release the civilian ships.` (costs **10–15 scrap**) → they always take it ("obviously revolutionaries are under paid"), then `Contact the civilian ships.` → odds hidden: a loyalist outs themselves and an eavesdropping Rebel destroys them and attacks you; or low scrap with resources; or low scrap; or nothing.
  3. `Fly behind a moon and stay hidden.` (or equivalent) → nothing happens.
- Resources: scrap (spend), fuel, missiles, drone parts; hull damage risk
- Tags: `trade`, `moral`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
### Rebel ship supplying civilians
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Non-unique.
- Setup: A Rebel ship — sometimes a combat ship reassigned as a supply vessel — distributing food and equipment to colonists cut off by the war.
- Choices:
  1. `Attack the Rebels.` → fight (no surrender, no escape).
     Destroyed → low scrap with resources; crew killed → medium.
     Then `Steal the civilian supplies.` or `Leave the civilians alone.`
  2. `Wait and steal the supplies from the civilians.` → straight to the steal table.
  3. `Leave them be.` → nothing happens.
  - Steal table (odds hidden): **1 drone part plus scrap** ("This is why the Rebels will always have support!"); low scrap; **booby-trapped cargo — 2 hull damage and 2 damage with fires or a breach**; or nothing but "vaccinations for a local plague."
  - Leave-alone table: four different messages telling you the colony will now die.
    "My son was on that ship.
    He only helped the Rebels because they cared enough to help us."
- Resources: scrap, drone parts, hull, system damage, fire, breach
- Tags: `moral`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
- Note: the "good" option has no mechanical reward and four separate texts rubbing that in.
### Pirate ship selling drones
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Unique.
- Setup: A ship with "conspicuous pirate markings" broadcasting that it has equipment for sale.
- Choices:
  1. `Hail the ship.` → `Dock with the ship.` → "A human in an exquisite suit meets you on board."
     A drone shop:
     - `Buy some Drone parts.` → **25 scrap for 5 drone parts**.
     - `Buy a Drone schematic.` → **25–35 scrap** (offer shown first) for a **drone schematic**.
     - `Buy Drone Control system upgrade.` → **15–20 / 25–33 / 50–65 scrap** depending on current level.
     - `Buy nothing.` → "You shouldn't waste people's time Captain!"
       **3 hull damage**, engine damage with fire or breach, two more rooms damaged, and a pirate fight.
     - `This seems dangerous, leave.` (before docking) → hidden weapons, forced fight.
     - `[requires: Slug crewmember]` `"Sir: We can dock, but I sense that we better plan on making a purchase..."` → identical to docking, but the option text itself warns you that leaving empty-handed is punished.
     - `[requires: Hacking system]` `Disable their Weapon system before docking.` → "Here, take your 'standard toll'.
       I really should do business elsewhere, scum."
       **Low scrap**, no fight, no purchase needed.
  2. `Attack him before he can attack!` → fight a pirate ship, default rewards.
  3. `Quickly prepare to jump away.` → nothing happens.
- Resources: scrap (spend or gain), drone parts, drone schematic, Drone Control (upgrade), hull, system damage
- Tags: `trade`, `gated`, `tax`, `optional-fight`, `walk-away`
- Note: the Slug blue option's only effect is to tell the player the rule before they break it.
### Intelligent ponies
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Unique.
  (Donor event.)
- Setup: Unregistered intelligent life on a nearby planet — "small, brightly colored, six-legged, horse-like animals" that stare silently at you.
- Choices:
  1. `Investigate.` →
     - `Try to communicate peacefully.` → odds hidden: they lead you to an Engi crash site — **gain an Engi crewmember plus low scrap with resources**; or they just stand there "silently judging you with their large, expressionless eyes."
     - `Bring some of the creatures on board to sell.` → odds hidden: they stampede and **you lose a crewmember** (revived `[requires: Clone Bay]`); or you retreat in time and nothing happens.
     - `Leave.` → nothing happens.
     - `[requires: Slug crewmember]` `Attempt to communicate telepathically.` → guaranteed **Engi crewmember**.
  2. `Ignore it.` → nothing happens.
- Resources: crew (gain or lose), scrap
- Tags: `gamble (odds-hidden)`, `gated`, `moral`, `sacrifice`, `walk-away`
### Terraforming scan
- Where: Slug Controlled Nebula, Slug Home Nebula; normal beacon (no ship detected).
  Unique.
- Setup: "Captain, we are Federation Terraforming Team C12 and are in need of assistance."
  They need a planet scanned for life before they flatten it.
- Choices:
  1. `You offer your assistance.` → `Attempt to scan the planet.` → odds hidden: your sensors are not strong enough (nothing happens), or the scan succeeds.
     - `[requires: Sensors lvl 2+]` `Set sensors to maximum and scan.` → success.
     - `[requires: Zoltan crewmember]` `Send your crewman to overcharge their systems.` → success.
  2. `You do not have time.` → nothing happens.
  - On a successful scan, odds hidden:
     - No life → they **upgrade your Oxygen system** as thanks.
     - One ship on the surface → it is a pirate; forced fight.
     - A simple mold → `Tell them to stop. Any life is valuable.` → "Who cares about some silly mold?
       We'll pay you to look the other way!" → `Accept the bribe and leave.` → **gain 15–25 scrap**; `Offer to pay them to at least delay until the mold can be studied.` → **spend 15–25 scrap**, and they upgrade your **Oxygen system** anyway as an apology; `Power your weapons and demand they leave at once.` → they evacuate, nothing gained.
       Or `Leave them to their work.` → nothing.
- Resources: scrap (gain or spend), Oxygen system (upgrade); hull damage risk from the pirate
- Tags: `gated`, `gamble (odds-hidden)`, `trade`, `moral`, `walk-away`
- Note: the ethical option (paying to delay) is also the one that pays, which is unusual in this pool.

---

## Abandoned Sector (Lanius)
All Advanced Edition content.
Two facts govern the whole pool: the Lanius consume metal (they eat ships, stations, and jump beacons), and they **drain oxygen from any room they occupy**, so a Lanius boarder is a suffocation hazard rather than a melee one.
Their ships also surrender and flee far more readily than any other race's — the standard Lanius ship has an 80% surrender chance and an 80% escape chance at low hull — which makes "default Lanius rewards" its own reward table on the wiki.
### Lanius fight
- Where: Abandoned Sector; normal beacon (ship detected).
  Non-unique.
- Setup: Eleven intro lines, and the recurring note is that you are cargo, not an enemy.
  A wide-band broadcast not even addressed to you: "... metallic opportunity... acquisition... by force..."
  Or: "they've marked your ship for salvage!"
- Choices:
  1. *(none — forced)* → fight a Lanius ship, default Lanius rewards. 80% chance it offers surrender at 20–40% hull; 80% chance it attempts escape at 30–40% hull.
- Resources: scrap, fuel, missiles, drone parts; hull damage, oxygen loss
- Tags: `no-choice`, `fight`
### Lanius fight distress
- Where: Abandoned Sector; **distress beacon** (ship detected).
  Unique.
- Setup: "You are too late - whatever once was emitting the distress signal from this system drew a Lanius ship as well as your own.
  Having consumed the original target, the Lanius turn their attention to your vessel."
- Choices:
  1. *(none — forced)* → fight a Lanius ship, default Lanius rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage
- Tags: `no-choice`, `fight`
### Lanius fight in asteroid field
- Where: Abandoned Sector; asteroid field beacon (ship detected).
  Unique.
- Setup: "Half of the settlement has been disassembled by a number of Lanius scavengers.
  Their military escort moves in to scare you off."
- Choices:
  1. *(none — forced)* → fight a Lanius ship in an asteroid field.
- Resources: scrap, fuel, missiles, drone parts; hull, system damage
- Tags: `no-choice`, `fight`
### Lanius fight near pulsar
- Where: Abandoned Sector; pulsar beacon (ship detected).
  Unique.
- Setup: A research station beside a pulsar, "although it's hard to tell since a portion of it has been melted."
  The Lanius ship working on it intercepts you, "totally oblivious to the threat of EM pulses."
- Choices:
  1. *(none — forced)* → fight a Lanius ship while pulsar bursts periodically knock out systems and drain shields on both ships.
- Resources: scrap, fuel, missiles, drone parts; system power loss, hull damage
- Tags: `no-choice`, `fight`
### Lanius fight with friendly ASB support
- Where: Abandoned Sector; normal beacon (ship detected, planetary defence present).
  Unique.
- Setup: A planet's Anti-Ship Battery is firing on Lanius ships and one of them decides you are with the planet.
  The battery is on **your** side — the only such event in this pool.
- Choices:
  1. *(none — forced)* → fight a Lanius ship with an Anti-Ship Battery shooting at it.
     Destroyed → medium scrap with resources; crew killed → high.
     Then odds hidden: the defence team offers **8 hull repairs**, or the fight rolls on and you leave.
- Resources: scrap, fuel, missiles, drone parts, hull (repair); hull damage risk
- Tags: `no-choice`, `fight`, `gamble (odds-hidden)`
### Lanius lone ship
- Where: Abandoned Sector; normal beacon (ship detected).
  Unique.
- Setup: A civilian ship fleeing a lone Lanius craft.
  "Help!
  The metal monsters are coming to melt down our ship!" — but "strangely, no active weapon signatures are detected."
- Choices:
  1. `Attack the Lanius ship.` → fight a Lanius ship, default Lanius rewards.
  2. `Stay out of it.` → the Lanius does not pursue.
     "You wonder if they were ever a threat at all."
  3. `Try to contact the Lanius ship.` (over the civilian's protest: "Don't go any closer!
     Just kill them!") → odds hidden:
     - "Explore.
       Assess trade potential."
       It was a merchant.
       **A store opens.**
     - The translator garbles your question, the Lanius are enraged "for an indiscernible reason", fight.
     - Mutual incomprehension — "Expunge...
       Floral...
       Proposition..." — and both sides give up.
       Nothing happens.
  - `[requires: Lanius crewmember]` `Try to contact the ship.` → guaranteed **store**, plus the detail that they are scouting for a merchant's guild.
- Resources: store access, scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`, `moral`
- Note: the civilian's distress call is honest panic, not a lie — and acting on it destroys a trade partner.
### Lanius powered-down ship
- Where: Abandoned Sector; normal beacon (ship detected).
  Unique.
- Setup: An undamaged Lanius vessel drifting with no power.
  The crew are in hibernation and wake when metal comes near.
- Choices:
  1. `Scan the ship for lifeforms.` → "the scan frequencies awaken the Lanius from hibernation - and they're hungry for raw materials!"
     Fight.
  2. `Power weapons to attack.` → odds hidden: they wake and fight, or no response, in which case `Investigate the vessel` or `Destroy and scrap it` (which wakes them anyway).
  3. *(go straight to)* `Investigate the vessel.` →
     - `Ignore the vessel.` → nothing happens.
     - `Navigate carefully around the ship and strip what materials from the hull you can.` → odds hidden: you wake them and fight, or you get **low scrap**.
     - `[requires: Lanius crewmember]` `Send over a Lanius crewmember to plunder the ship of resources.` → **medium resources with some scrap**, no fight.
     - `[requires: Piloting lvl 2+]` `Engage the autopilot to strip the ship safely.` → **medium scrap with resources**, no fight.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `gamble (odds-hidden)`, `gated`, `push-your-luck`, `optional-fight`, `walk-away`
### Lanius ship salvager
- Where: Abandoned Sector; normal beacon (ship detected).
  Non-unique.
- Setup: Five framings of the same scene — a lone Lanius ship taking apart a wreck, a station, an asteroid.
  "It's hard to say if it was abandoned or attacked by the Lanius."
- Choices:
  1. `Attack the ship.` → fight a Lanius ship, default Lanius rewards.
  2. `Leave them alone.` → nothing happens.
  - `[requires: Lanius crewmember]` `Request some scrap.` → odds hidden: they share (**medium scrap**); they refuse rudely — "Get your own, lazy solder" — and you may then attack or leave; or they are genuinely out and nothing happens.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
### Lanius ship in rich debris field
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: A Lanius vessel working a rich debris field.
  There is enough for both of you, in principle.
- Choices:
  1. `Attempt to harvest some for yourself.` → "you come too close to the Lanius ship - and they proceed to try to harvest you!"
     Fight, then investigate the debris.
  2. `Attack the vessel.` → fight, then investigate the debris.
  3. `Ignore the vessel.` → nothing happens.
     "No sense in antagonizing the Lanius if you don't need to."
  - `[requires: Piloting lvl 2]` `Engage the auto-pilot and safely harvest the debris.` → **medium scrap with resources**, no fight.
  - `[requires: Piloting lvl 3]` same option → **high scrap with resources**, no fight.
  - Debris table after a fight (odds hidden): high, medium, or low scrap with resources depending on how much they had already eaten.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
### Lanius ship absorbing automated scout
- Where: Abandoned Sector; normal beacon (ship detected).
  Unique.
- Setup: A Lanius ship eating a Rebel automated scout.
  "If you scare off the Lanius you could probably make use of it."
- Choices:
  1. `Fight the ship.` → fight (80% escape chance at 20–40% hull).
     Whether it dies or flees, you reach the scout: destroyed → medium scrap with resources; crew killed → high; escaped → nothing but the scout.
     - Scout table (odds hidden): a random amount of scrap and **the current sector map is revealed**; or a random amount of scrap and **the Rebel fleet is delayed 1 turn** by feeding it false position data.
  2. `Leave them alone.` → nothing happens.
- Resources: scrap, map reveal, rebel fleet delay; hull damage risk
- Tags: `optional-fight`, `gamble (odds-hidden)`, `walk-away`
### Lanius ship absorbing rebel base
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: Several Lanius ships consuming a forward Rebel base and its scouts.
  "They don't seem to be aggressive.
  Perhaps their desire for metal could prove to be useful?"
- Choices:
  1. `Try to use them to delay the Rebels.` → odds hidden: they take the tip and jump toward the fleet — **medium scrap with resources and the Rebel fleet delayed 1 turn**; they scoff and one ship attacks; or the translation fails and nothing happens.
  2. `Leave them alone.` → nothing happens.
  - `[requires: Lanius crewmember]` `Try to use them to delay the Rebels.` → guaranteed **medium scrap with resources and 1-turn fleet delay**.
- Resources: scrap, fuel, missiles, drone parts, rebel fleet delay; hull damage risk
- Tags: `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
- Note: one of very few events in the game that *slows* the Rebel fleet, by pointing a hungry species at it.
### Lanius ship absorbing jump beacon
- Where: Abandoned Sector; normal beacon (ship detected).
  Unique.
- Setup: A damaged Lanius vessel docked with the jump beacon itself, eating it — "risking destroying it and becoming stranded."
  They are starving.
- Choices:
  1. `Ask if they require assistance.` → odds hidden: either the translator manages "critical... must... metal..." and you may `Give them 30 scrap` (→ **gain an augmentation**) or `Leave` (odds hidden: nothing, or they turn out to be fully operational and attack); or they power weapons defensively at once and you fight.
  2. `Send them 30 scrap.` (costs **30 scrap**) → odds hidden: **gain an augmentation**; or "it appears you haven't sated their lust for metal" — a fight, and **the 30 scrap is not refunded**.
  3. `Leave.` → odds hidden: nothing, or they detach and attack.
  - `[requires: Lanius crewmember]` `Ask if they require assistance.` → they explain clearly and offer a guaranteed trade: **30 scrap**, **6 missiles**, or **6 drone parts**, each for an **augmentation**.
    Or decline.
  - `[requires: Hull Repair Drone]` `Send a drone to help.` → they eat the drone, are grateful, repair their ship, and **one of their crew joins you: a Lanius crewmember.**
- Resources: scrap, missiles, drone parts, augment, crew (gain); hull damage risk
- Tags: `trade`, `gated`, `gamble (odds-hidden)`, `optional-fight`, `walk-away`
- Note: the ungated charity option can take your scrap and attack you anyway; the gated version turns the same charity into a priced menu.
### Lanius ship attacking civilian
- Where: Abandoned Sector; normal beacon (ship detected).
  Unique.
- Setup: Three framings, and they carefully decline to settle who started it.
  "It's impossible to say who instigated the aggression."
  One Lanius ship is in pursuit of an unarmed civilian, though "it's hard to say if it's truly a threat since its weapons are not charging."
- Choices:
  1. `Attack the Lanius ship.` → fight; destroyed → medium scrap with resources, crew killed → high, then the standard rescue table (a weapon with low scrap, a crewmember, 5 hull repairs, medium scrap with resources, low scrap, or nothing — odds hidden).
  2. `Avoid the conflict.` → nothing happens.
     "Unfortunately it is not your mission to save every person affected by this war or the Lanius invasion."
- Resources: scrap, weapon, crew (gain), hull (repair), fuel, missiles, drone parts
- Tags: `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Lanius ship attacking civilian distress
- Where: Abandoned Sector; **distress beacon** (ship detected).
  Unique.
- Setup: A civilian vessel under fire.
  "Not all Lanius are content with simply scavenging the wrecks of previous battles."
- Choices:
  1. `Fight the Lanius ship.` → fight; medium/high scrap with resources, then the rescue table.
  2. `Avoid the conflict.` → nothing happens.
     "Your crew seems unhappy to leave the civilians to such a fate but you try to convince them of the greater good.
     You don't speak of your own misgivings, however."
  - `[requires: Lanius crewmember]` `Have your crew admonish their captain.` → odds hidden: either the ship "has gone completely rogue," refuses even its own kind, and fights; or your crewmember successfully invokes "their treatise promising to leave the property of sentient aliens alone", the weapons power down, and you get the rescue table **with no fight at all**.
- Resources: scrap, weapon, crew (gain), hull (repair), fuel, missiles, drone parts
- Tags: `gated`, `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Lanius ship attacking Mantis
- Where: Abandoned Sector; **distress beacon** (no ship detected).
  Unique.
- Setup: A Mantis ship's distress beacon is malfunctioning "likely due to the Lanius ship mining their hull and sub-systems!"
- Choices:
  1. `Attack the Lanius ship.` → fight (no surrender, no escape); either win → medium scrap with resources, then `Contact the Mantis.` → odds hidden: the Mantis are "angry at being saved, and angry at themselves for needing to be saved" and hand over **medium missiles and scrap**; or there are no survivors and you salvage medium scrap with resources.
  2. `Leave the Mantis to their fate.` → nothing happens.
     "You move away as the Lanius feed on the remains."
- Resources: missiles, scrap, fuel, drone parts; hull damage risk
- Tags: `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Lanius ship attacking Rock
- Where: Abandoned Sector; **distress beacon** (no ship detected).
  Unique.
- Setup: "Their hull (and their crew) are being mined by the Lanius, lasers and weapons tearing through the ship!"
- Choices:
  1. `Attack the Lanius ship.` → fight; win → medium scrap with resources, then `Contact the Rockmen.` → odds hidden: they had already jumped and left spare parts behind (**medium scrap with resources**); or they give "an awkwardly-translated message that seems to indicate something about gratitude" and jump away with nothing for you.
  2. `Leave the Rockmen to their fate.` → nothing happens.
     "You watch the Lanius ship slowly feed on the remains - and the crew."
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Lanius ship attacking Slug
- Where: Abandoned Sector; **distress beacon** (no ship detected).
  Unique.
- Setup: "The Slugs beg for assistance as the Lanius tear into their hull plating."
- Choices:
  1. `Attack the Lanius ship.` → fight; win → medium scrap with resources, then `Contact the Slugs.` → odds hidden: they "reluctantly thank you for your help, protest they had the whole situation under control, attempt to make you pay for them helping you, and an hour later, finally relent" (**medium scrap with resources**); or they simply left during the firefight ("So much for gratitude").
  2. `Leave the Slugs to their fate.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Lanius trader
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: A Lanius ship "laden with recently collected metal" wants to swap it for consumables.
  "Metal sufficient.
  Request exchange."
- Choices:
  1. `Agree to the exchange.` (the offer is shown before you choose) → one of: **3–7 fuel → 15–30 scrap**; **3–7 missiles → 20–40 scrap**; **3–7 drone parts → 20–40 scrap**.
  2. `Decline.` → nothing happens.
     "They leave without a word."
  - `[requires: Lanius crewmember]` `Ask for an alternative trade.` → a fresh roll with a better band: **3–7 fuel → 20–35 scrap**, **3–7 missiles → 25–50 scrap**, **3–7 drone parts → 25–50 scrap**.
    The reroll can land on a different resource and can come out worse than the first offer.
- Resources: fuel, missiles, drone parts (spend), scrap (gain)
- Tags: `trade`, `gated`, `gamble (odds-hidden)`, `walk-away`
### Lanius trader with translator
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: The same trader, but with a working translator: "Metal content more than sufficient.
  Does your ship care to exchange resources for our excess metal?"
- Choices:
  1. `Agree to the exchange.` → same three trades as above (3–7 fuel → 15–30 scrap, etc.).
  2. `Decline.` → nothing happens.
  3. `Decline but ask about their translation device.` → "Yes.
     It is quality.
     Our ship contains excess.
     Care to purchase?"
     - `Purchase the translator for 40 scrap.` (costs **40 scrap**) → the device is a person: **gain a Lanius crewmember named Translator**.
     - `Decline again.` → "No matter.
       This one does not mind this ship."
       Nothing happens.
- Resources: scrap (spend or gain), fuel, missiles, drone parts, crew (gain)
- Tags: `trade`, `walk-away`
- Note: the best outcome comes from turning the advertised deal down and asking about the tool the seller used to make the offer.
### Lanius craftsmen
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: A merchant ship docked with a Lanius transport, studying "the Lanius's ability to reshape metal."
  They will convert your scrap into equipment.
  "They appear to meld part of their bodies into the metal and reshape it."
- Choices:
  1. `Inquire about the process.` →
     - `Give 45 scrap to craft an augmentation.` → **an Advanced Edition augmentation**.
     - `Give 50 scrap to craft a weapon.` → **an Advanced Edition weapon**.
     - `Give 40 scrap to craft a drone schematic.` → **an Advanced Edition drone schematic**.
     - `Decline their offer.` → nothing happens.
     - `[requires: Lanius crewmember]` `Offer to help in the process.` → the same three purchases at a **10 scrap discount** each.
  2. `Leave them to their research.` → nothing happens.
- Resources: scrap (spend), weapon, augment, drone schematic
- Tags: `trade`, `gated`, `walk-away`
- Note: the only place in the game that sells a guaranteed item category for a fixed price outside a store.
### Lanius with Federation science craft
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: A Federation science craft docked with Lanius ships, "attempting to understand our region's newest visitors... although we have been making little headway in deciphering their language."
- Choices:
  1. `Ask if they have anything that could help your mission.` → odds hidden: **a weapon**; **medium drone parts and scrap**; **medium scrap**; or "Sorry we don't carry much equipment that would be of use to a military vessel" (nothing).
  2. `Leave.` → nothing happens.
  - `[requires: Lanius crewmember]` `Offer to copy your translator's data suite.` → your ship's self-improving translator is worth more to them than anything they asked for: **a weapon, a drone schematic, or an augmentation**.
- Resources: weapon, drone schematic, drone parts, augment, scrap
- Tags: `gift`, `gated`, `gamble (odds-hidden)`, `walk-away`
### Refueling platform garbled broadcast
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: A refuelling platform whose broadcast is unintelligible.
  The garble is the tell, and it can mean two different things.
- Choices:
  1. `Hail the platform and attempt to communicate.` → "The platform suddenly begins to move, revealing itself to be a Lanius ship!"
     Fight; win → medium scrap with resources, then **3–5 fuel** from the real reserves.
  2. `Dock with the platform.` → `Signal for a refuel.` → odds hidden:
     - Abandoned station: **gain 3–5 fuel**.
       Then `[requires: Sensors lvl 2]` → **1–3 more fuel**; `[requires: Sensors lvl 3]` → **2–3 more fuel and 1–3 drone parts**.
     - A trap: **3 hull damage, 3 engine damage**, and a Lanius fight.
     - A worse trap: **a hull breach, 1 Lanius boarder** (draining the room's oxygen), and a Lanius fight.
     - `[requires: Doors lvl 2+]` `Secure your blast doors - best to be safe when docked.` → the ambush fails, "you wipe them out one by one with your weapon array," and you take the station's **5 fuel**.
  3. `Ignore the platform.` → nothing happens.
- Resources: fuel, drone parts, hull, engines (damage), breach, scrap
- Tags: `gamble (odds-hidden)`, `gated`, `push-your-luck`, `walk-away`, `optional-fight`
### Boarders: Humans (Abandoned)
- Where: Abandoned Sector; normal beacon (**no ship detected**).
  Non-unique.
- Setup: "Those metal bastards think they can just absorb half of our engines and leave us here to die?
  I hope you understand the need to take your ship by force."
  Humans the Lanius stranded, taking it out on you.
- Choices:
  1. *(none — forced)* → **3–4 human boarders**, no enemy ship.
- Resources: crew (injure / lose), system damage
- Tags: `no-choice`, `fight`, `tax`
- Note: if this follows a Lanius fight, the boarders carry **Emergency Respirators** — they are immune to the oxygen drain you are not.
### Pirate fight (Lanius)
- Where: Abandoned Sector; normal beacon (ship detected).
  Non-unique.
- Setup: Pirates who have adapted to the sector.
  One has been baiting Lanius with scrap metal: "It must be using the metal to lure the Lanius into a trap."
  Another is sitting in a field of dead Lanius ships: "These punks think they can jus' waltz in here into our sector?"
- Choices:
  1. *(none — forced)* → fight a pirate ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Pirate ship attacking civilian (Lanius)
- Where: Abandoned Sector; normal beacon (ship detected).
  Non-unique.
- Setup: Pirates preying on people fleeing the Lanius.
  "We were trying to escape before the Lanius came only to be caught by pirates!"
  One is punishing traders: "...saw you trading with those damned scavengers.
  I'll show you what happens when you try and undercut the Red Giant gang!"
- Choices:
  1. `Attack the pirate.` → fight; destroyed → medium scrap with resources, crew killed → high, then the standard rescue table.
  2. `Avoid the conflict.` → nothing happens.
- Resources: scrap, weapon, crew (gain), hull (repair), fuel, missiles, drone parts
- Tags: `moral`, `optional-fight`, `walk-away`, `gamble (odds-hidden)`
### Rebel fight (Lanius)
- Where: Abandoned Sector; normal beacon (ship detected).
  Non-unique.
- Setup: Six intros, most of which show the Rebels losing control of the sector.
  One is a patrol dismissing a colony's warnings mid-sentence — "all reports indicate the metal bastards target abandoned settlements only.
  If we relocated our fleets based on every request from backwater... wait, what's that..." — before the channel cuts.
- Choices:
  1. *(none — forced)* → fight a Rebel ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts; hull damage risk
- Tags: `no-choice`, `fight`
### Free scrap with resources (Lanius)
- Where: Abandoned Sector; normal beacon (no ship detected).
  Unique.
- Setup: "You stumble across a badly damaged Lanius craft.
  It jumps away as soon as it sees you.
  Looking around the area, you discover a number of destroyed Rebel automated ships."
- Choices:
  1. *(none)* → **high scrap with resources**.
- Resources: scrap, fuel, missiles, drone parts
- Tags: `no-choice`, `gift`
### Lanius empty distress beacon 1
- Where: Abandoned Sector; **distress beacon** (no ship detected).
  Unique.
- Setup: The signal comes from "a small plastic satellite orbiting a moon" — plastic, because anything metal is gone.
  The looping message says settlers left because of the Lanius; there is no settlement to find.
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`
### Lanius empty distress beacon 2
- Where: Abandoned Sector; **distress beacon** (no ship detected).
  Unique.
- Setup: The signal blinks out while you are looking for it, and you notice "the small fleet of scavenger ships absorbing debris from a large battle nearby.
  You can't help but wonder where the distress signal came from, but you decide not to risk pressuring the fleet."
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`
### Empty beacon (Lanius)
- Where: Abandoned Sector; empty beacon (no ship detected).
  Non-unique.
- Setup: Six nothing-texts that do most of the sector's worldbuilding.
  Erasure: "Yet another area sucked dry by the Lanius."
  Uncertainty: "You have no way of knowing if the area was always uninhabited or if it was simply erased by the Lanius."
  Internal politics: "another metal ship actually fired on its companion until it backed off.
  Apparently there are disagreements among the Lanius about what should be salvaged."
  Restraint: settlements fired ASB warning shots and "the Lanius moved on despite clearly having the firepower to overwhelm the settlements."
  And a human cult: "There was some cult rambling about the spreading of the disease, Humanitis.
  They forcefully boarded our ship and tried to open all of our airlocks, shouting, 'Be purged!'"
- Choices:
  1. *(none)* → nothing happens.
- Resources: none
- Tags: `no-choice`
### Store (Lanius)
- Where: Abandoned Sector; store beacon.
- Setup: Six framings, all of them about commerce at the edge of an evacuation — "the only store not afraid of scavengers this side of Omacron 6"; an apocalyptic cult that turns out to be an advert ("The end is upon us!
  The metal demons have come to absorb your very being!
  But it's not too late to prepare for the worst!"); a depot with hand-made "Everything Must Go!" signs; merchants working the refugee traffic; a transport selling off stock while it waits on a coolant shaft repair.
- Choices:
  1. *(none)* → a store opens.
- Resources: scrap (spend), fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrades, hull repair
- Tags: `no-choice`, `trade`

---

## Rebel sectors
These two sectors share one event pool; Rebel Stronghold adds `Rebel shipyard` and is the only difference in the listing.
Both are also the sectors where the Rebel fleet pursues fastest.
### Empty beacon (Rebel)
- Where: Rebel Controlled, Rebel Stronghold — normal beacon (no ship detected).
  Non-unique.
- Setup: You arrive somewhere thick with Rebel logistics — supply freighters, a refueling depot, a comm relay chattering about troop movements, a recently "liberated" planet.
  Nobody is hunting you here.
  One of five flavor texts fires.
- Choices:
  1. `Continue` → nothing happens.
- Resources: none
- Tags: `no-choice`
### Store (Rebel)
- Where: Rebel Controlled, Rebel Stronghold — store beacon (no ship detected).
- Setup: A re-supply station, a black-market broadcaster, or a public shipyard "willing to work on any ship, not only those of Rebel hue."
  You transmit a fake ship ID and dock.
- Choices:
  1. `Continue` → a store opens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrade, hull repair (all via the store interface)
- Tags: `no-choice`, `trade`
### Rebel shipyard
- Where: Rebel Stronghold only — normal beacon (no ship detected).
  Unique, once per game.
- Setup: You jump into a colossal Rebel construction yard: scaffolding, drones, nearby planets strip-mined to feed a hull of immense size.
  It is a *second* Rebel Flagship, half-built.
- Choices:
  1. `Look around.` → the incomplete Flagship powers up.
     Forced fight against a second Rebel Flagship (unfinished — Flagship Phase-3 layout, but no Mind Control and no Power Surge, and unlike the real Flagship its systems/crew scale with difficulty and sector).
     - Win (destroyed or crew killed) → weapon + high scrap + 5 fuel + 5 missiles + 5 drone parts, Rebel Fleet delayed 2 turns, and you unlock the **Federation Cruiser**.
  2. `Leave immediately.` → nothing happens.
- Resources: weapon, scrap, fuel, missiles, drone parts, rebel fleet delay, ship unlock, hull (at risk in the fight)
- Tags: `gamble (odds-hidden)`, `optional-fight`, `walk-away`, `gift`
- Chain: the only in-sector Federation Cruiser unlock (otherwise unlocked by winning with the Engi Cruiser).
### Rebel defector
- Where: Rebel Controlled, Rebel Stronghold — normal beacon (ship detected).
  Unique.
- Setup: A Rebel patrol engages, and mid-scramble a teleporter signature lands an unarmed, panicky Rebel soldier on your deck.
  He says the rebel life has lost its charm.
- Choices:
  1. `Accept his proposal, and prepare to fight the Rebel ship.` → random, plus a Rebel ship fight (default rewards) in every branch:
     - he really joins → gain a Human crewmember (3 flavor variants)
     - he is lying → 3 hull damage, 1 damage to Engines, **Rebel Fleet pursuit doubled**
     - he detonates a beacon → 3 hull damage, 2 human boarders beam aboard
     - he murders someone → lose a crewmember, 1 human boarder aboard
       - `[requires: Clone Bay]` the killed crewmember is revived
     - he is overpowered → nothing extra, or 1 human boarder aboard — odds hidden.
  2. `Reject his offer. You can never trust these Rebels.` → he counter-offers a scrap cache:
     1. `Reluctantly accept his proposal and fight the Rebel ship.` → same branch set as above, and the good branch also adds a **quest marker** (a resource cache: `fuel 3-6, missiles 4-8, drone parts 1-2` with scrap, or just low scrap).
        Wiki notes the crew icon is bugged and always shows.
     2. `Reject him outright and execute him on the spot.` → straight Rebel ship fight.
     3. `Reject his offer again.` → 1 human boarder aboard, then the Rebel ship fight.
- Resources: crew (gain / lose / revive), hull, system damage (engines, piloting), boarders, scrap, fuel, missiles, drone parts, quest marker, rebel fleet advance
- Tags: `gamble (odds-hidden)`, `fight`, `gated`, `delayed`, `chain`, `moral`
- Chain: the accept-after-reject path plants a resource-cache quest marker in the sector.
### Rebel fight with boarders
- Where: Rebel Controlled, Rebel Stronghold — normal beacon (ship detected).
  Non-unique.
- Setup: A Rebel officer hails to say he wants your ship intact and your crew dead; the teleporter is already spinning up.
  Four flavor intros.
- Choices:
  1. (forced) → 2-3 human boarders beam aboard **and** you fight a Rebel ship (default rewards).
- Resources: crew (injure / lose), system damage from boarders, scrap/fuel/missiles/drone parts, hull (at risk)
- Tags: `no-choice`, `fight`, `tax`
### Auto-ship near radar station
- Where: Rebel Controlled, Rebel Stronghold only — normal beacon (ship detected).
  Unique.
- Setup: A dormant Rebel auto-ship guards a forward radar station that feeds the Rebel Fleet your position.
  You can try to poison the feed.
- Choices:
  1. `Approach the station.` → the auto-ship wakes and attacks.
     On destroying it: medium scrap, then a second decision — `Attempt to manually hack into the station` (the random Access table below), `Don't risk it. Leave the station` (nothing), or
     - `[requires: Hacking system]` `Use a drone to hack into the station.` [costs 1 drone part] → **sector map revealed and Rebel Fleet delayed 1 turn** (guaranteed, no downside)
  2. `Keep your distance and wait for the FTL to charge.` → nothing happens.
  - `[requires: Combat Drone — Mk I/II or Anti-Ship Beam I/II]` `Send a drone to distract the automated ship.` [costs 1 drone part] → random: the drone lures it away and you access the station, or the auto-ship shoots the drone down and attacks you.
  - Manual **Access the station** table (random): Rebel Fleet delayed 1 turn / sector map revealed / **Rebel Fleet pursuit doubled for 1 jump** (tripped alarm) / nothing.
- Resources: drone parts (cost), scrap, map reveal, rebel fleet delay, rebel fleet advance, hull (at risk)
- Tags: `gamble (odds-hidden)`, `gated`, `optional-fight`, `walk-away`, `trade`
- Notes: the only event in the game that both delays *and* can advance the fleet from the same draw.

## Pirate Controlled Sector
Pirate sectors have no faction ships of their own beyond pirates; the whole pool is extortion, ambush and the choice between paying and shooting.
Pirate ships are the only hostiles in the game that routinely **surrender** and **flee**, so most fights here are negotiations.
### Empty beacon (Pirate)
- Where: Pirate Controlled — normal beacon (no ship detected).
  Non-unique.
- Setup: A small ship de-cloaks behind you and then just keeps going; a pirate admires your hull; a mining structure already picked clean; or a squadron of Engi ships primly informing you that "Piracy results in negative societal impact.
  Not permitted."
- Choices:
  1. `Continue` → nothing happens.
- Resources: none
- Tags: `no-choice`
### Store (Pirate)
- Where: Pirate Controlled — store beacon (no ship detected).
- Setup: Honest merchants you nearly shot by reflex, a corporate depot with armed escorts, or a depot that advertises its "152 automated turret satellites" in the welcome message.
- Choices:
  1. `Continue` → a store opens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrade, hull repair
- Tags: `no-choice`, `trade`
### Boarders: Humans (Pirate)
- Where: Pirate Controlled — normal beacon (no ship detected).
  Unique.
- Setup: A friendly hail, a "damaged" ship, life signs on the beacon itself, a distress signal on a moon — all of them cover for a teleporter lock.
  No enemy ship ever appears; the whole event is the boarding party.
- Choices:
  1. (forced) → 3-5 human boarders beam aboard your ship.
- Resources: crew (injure / lose), system damage, hull (breaches from fighting)
- Tags: `no-choice`, `tax`, `fight`
### Destroyed cargo ship
- Where: Pirate Controlled — normal beacon (no ship detected).
  Unique.
- Setup: A wrecked cargo hauler with its crates scattered nearby, intact.
- Choices:
  1. `Bring it aboard.` → random: medium scrap with resources (military supplies) / low scrap (consumer goods) / 2-4 human boarders burst out of the crates / 2-4 boarders **and** a pirate ship decloaks and attacks (that ship has a 70% chance to try to escape at 20-40% hull and can offer surrender at low hull).
  2. `Leave it alone, this looks suspicious.` → nothing happens.
  - `[requires: Advanced Sensors level 2+]` or `[requires: Long-Ranged Scanners augment]` `Run an advanced scan on the boxes.` → **Scan the boxes** (random): 20-35 scrap / medium scrap with resources / the scan reveals armed life signs inside — a planned ambush — with a sub-choice: `Destroy the crates to prevent another ship from falling victim.` (pirates scattered into vacuum, then a pirate ship attacks: "You will pay for that!") or `Leave it alone and prepare to jump.` (nothing).
- Resources: scrap, fuel, missiles, drone parts, crew (injure/lose from boarders), hull (at risk)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `optional-fight`, `moral`
### Refugee (Pirate)
- Where: Pirate Controlled — normal beacon (no ship detected).
  Non-unique.
- Setup: Sensors catch a refugee ship drifting through, one of many fleeing the Rebel advance.
  It has not noticed you — or is pretending not to.
- Choices:
  1. `Hail them.` → random:
     - they are short on supplies and propose a trade. `Trade with them.` (the exact offer is shown before you commit) → one of: 1-2 drone parts for 5-10 fuel; 1-2 fuel for 4-5 missiles; 2-3 missiles for 2-3 drone parts; 2-4 missiles for 4-10 fuel.
       Or `Politely decline.` → nothing.
     - it was bait: a pirate ship jumps in (no surrender, no escape).
       Destroy → medium scrap with resources; crew killed → high scrap with resources; then the grateful refugees add low scrap with resources.
  2. `Ignore the refugees.` → nothing happens.
- Resources: fuel, missiles, drone parts, scrap, hull (at risk)
- Tags: `gamble (odds-hidden)`, `trade (odds-shown for the trade itself)`, `optional-fight`, `walk-away`
### Refugee distress (Pirate)
- Where: Pirate Controlled — **distress beacon** (no ship detected).
  Non-unique.
- Setup: Identical content to `Refugee (Pirate)`, but reached through an active distress beacon: the refugee ship fled the Rebel advance, ran out of fuel, and you cannot tell if anyone is aboard.
- Choices: as `Refugee (Pirate)` above.
- Resources: fuel, missiles, drone parts, scrap, hull (at risk)
- Tags: `gamble (odds-hidden)`, `trade`, `optional-fight`, `walk-away`
### Research station with no response
- Where: Pirate Controlled — normal beacon (no ship detected).
  Unique.
- Setup: A research station broadcasting distress.
  Nobody answers your hails.
  (An alien neurotoxin has driven the staff into a murderous frenzy.)
- Choices:
  1. `Dock with the station and investigate.` → random:
     - dismembered scientists; you grab 1 drone part with scrap
     - a survivor makes it aboard → **gain a crewmember**, then: `Prepare for a fight!` (3-4 human boarders) or `[requires: Medbay level 3]` `Have the advanced medbay analyze their condition.` → the medbay synthesizes an antidote; gain a **second** crewmember with 1 Repair skill and medium scrap
     - one of *your* away team is infected → `Drag him back to the ship and prepare for a fight.` (**lose a crewmember, who turns hostile**, plus 3-4 boarders), or `[requires: Teleporter]` `Use your Teleporter to retrieve your crew.` (lose the infected crewmember, who turns hostile, but no boarders), or `[requires: Medbay level 2]` `Drag him back to the Medbay.` (crewmember saved; 3-4 boarders still come), or `[requires: Medbay level 3]` `Have the Advanced Medbay analyze their condition.` (crewmember saved **and** gain a crewmember, no fight)
  2. `Leave it alone.` → nothing happens.
  - `[requires: Anti-Personnel Drone]` `Send your battle drone in to help.` [costs 1 drone part; wiki notes a bug where no drone part is consumed on the 2-in-9 drone-part reward] → random: nothing (drone abandoned or destroyed), or medium scrap with resources.
  - `[requires: Lifeform Scanner augment]` `Run advanced life scans.` → random: no life signs, safe salvage → medium scrap with resources; or living-but-violent signatures → you move on, nothing.
- Resources: crew (gain / lose to hostility), drone parts (cost and reward), scrap, hull (at risk from boarders)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `sacrifice`, `moral`
- Chain: also appears as the "station doesn't respond" branch of `Merchant's request`, where the Lifeform Scanner option is absent.

## Uncharted Nebula and nebula hazards
Sector flavor text sets the terms: *"Nebulas were always dangerous places.
Many electronics fail in these clouds.
You will have to tread lightly."* / *"You've entered a sector thick with nebulas.
You'll have to navigate on instinct."*

Mechanically, an Uncharted Nebula sector: has **no starting map** (beacon connections are hidden until visited), **slows the Rebel fleet**, and every nebula beacon **disables your Sensors** and **disables enemy Sensors** too.
Plasma-storm beacons additionally **halve your reactor output** for the whole encounter.
Beacon budget: 0-1 stores, 1-3 item beacons, 1 nebula store, 4 empty nebula beacons, 5-6 nebula hostile encounters.
(Roughly 0.8% of Uncharted Nebulas generate with no store at all.)
### Store in nebula (Uncharted)
- Where: Uncharted Nebula only — nebula store beacon (no ship detected).
- Setup: Element extractors, an Engi cargo vessel proposing "mutually beneficial exchange of properties", or a cluster of Federation refugee ships who need scrap to keep their engines running.
- Choices:
  1. `Continue` → a store opens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew, system upgrade, hull repair
- Tags: `no-choice`, `trade`
### Nebula wreckage
- Where: Uncharted Nebula, Slug Controlled Nebula — nebula beacon (no ship detected).
  Unique.
- Setup: Two ships destroyed each other here; the debris is still tumbling away into the clouds and you cannot tell who fought.
- Choices:
  1. `Investigate the battlefield.` → random: nothing (3 variants of "the wreckage is drifting faster than it first appeared"); or **5 hull damage plus 1 fire damage to a random room**; or you spot a floating survivor → `Assist the survivor.` / `Leave the battlefield before other ships arrive.`
  2. `Leave the battlefield before other ships arrive.` → nothing happens.
  - `[requires: Slug crewmember]` `Ask your Slug crew to scan for survivors.` → your Slug reads the dying mind directly; go straight to `Assist the survivor.` with no hull risk.
  - **Assist the survivor** — they are mortally wounded:
    1. `Make them comfortable for their final moments.` → they gasp out coordinates and the single word "ABADOTH", then die.
       **A quest marker is added to your map.**
    - `[requires: Medbay level 2+]` `Get them into the medbay!` → they recover and join your crew.
    - `[requires: Clone Bay]` `Try to clone them before it's too late.` → "You clone the individual and let the host pass away."
      Gain a crewmember.
- Resources: hull, fire/system damage, crew (gain), quest marker, scrap (downstream)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `delayed`, `chain`, `moral`
- Chain: → **ABADOTH quest marker.**
  The coordinates are empty space.
  Options: `Do a full system scan - though you're sure to lose some of your lead with the Rebels.` (**Rebel Fleet pursuit doubled for 1 jump**, then you find the ship) or `[requires: Slug crewmember]` `Ask your Slug crewmember to scan for life forms.` (free).
  A Zoltan ship decloaks and demands to know why you are there.
  You must produce the password: `Say ABADOTH.` → medium scrap with resources. `Say ANODYNE.` or `Say ABATODH.` or `Explain about finding the dead crewman.` → a Zoltan ship fight. `[requires: Engi crewmember]` `Say ABADOTH.` → your Engi recalls the word from memory, same reward.
  This is FTL's only password puzzle: the answer is stated in the earlier event's text and the wrong answers are near-anagrams.
### Mantis fight choice in nebula
- Where: Uncharted Nebula only — nebula beacon (ship detected).
  Unique.
- Setup: Blind in the fog you nearly collide with a Mantis ship.
  They hail: "Pah!
  This transgression will be overlooked.
  Nebula, very dangerous.
  Next time, humans all die."
- Choices:
  1. `There won't be a next time. Open fire!` → fight a Mantis ship, default rewards.
  2. `This place is dangerous enough. Move on.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, hull, crew (at risk)
- Tags: `optional-fight`, `walk-away`
### Pirate fight in nebula
- Where: Pirate Controlled, Uncharted Nebula — nebula beacon (ship detected).
  Non-unique.
- Setup: A pirate drifts down out of the clouds into your wake: "You know what I love about this part of the galaxy?
  The explorers!
  You always carry such fine loot."
- Choices:
  1. (forced) → fight a Pirate ship, default rewards.
- Resources: scrap, fuel, missiles, drone parts, hull
- Tags: `no-choice`, `fight`
- Notes: **this event can never fire.**
  An `eventList` in the game files shares its name, so the game loads a random nebula event from that list instead (boarders, empty nebula beacon, smuggler, trade, lost ship, plasma-storm wrecks, rebel-in-nebula variants).
  Even if it did fire, a missing environment tag would drop the nebula hazard on arrival.
### Rebel fight chance in nebula
- Where: Uncharted Nebula, Slug nebulae — nebula beacon (ship detected).
  Unique.
- Setup: "You spot a rebel ship in the nebula ahead and stay off their radar.
  Try to engage?"
  For once you have the information advantage.
- Choices:
  1. `Stay hidden.` → nothing happens.
  2. `Prepare to chase them!` → random: you catch them (Rebel ship fight, default rewards); or you lose your bearings in the fog and waste time — **Rebel Fleet pursuit doubled**; or you can't hold a lock without sensors and they slip away (nothing).
  - `[requires: Sensors level 3]`, `[requires: Long-Ranged Scanners augment]`, or `[requires: Lifeform Scanner augment]` `Try to track them as you move to engage.` / `Use their life signatures to follow.` → you always catch them; the fight happens with no risk of the fleet advancing.
- Resources: scrap, fuel, missiles, drone parts, hull, rebel fleet advance
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`, `optional-fight`
### Rock ship in plasma storm
- Where: Uncharted Nebula only — plasma storm beacon (ship detected).
  Unique.
- Setup: A Rock armoured transport has lost its bearings, but refuses help on principle: "Whatever life-form you are, we find you repugnant.
  We seek no aid.
  Leave.
  Now."
- Choices:
  1. `Leave.` → nothing happens.
  2. `Repugnant? Arm the weapons!` → fight a Rock ship, default rewards, at half reactor power.
  - `[requires: Rock crewmember]` `Offer to lead them out of the nebula.` → they grudgingly hand you the helm; **high scrap with resources**.
- Resources: scrap, fuel, missiles, drone parts, hull, reactor (halved)
- Tags: `optional-fight`, `gated`, `walk-away`, `moral`

---

## Hidden Crystal Worlds
*Reached only through the Crystal Cruiser chain: find a Damaged Stasis Pod, open it at a `Zoltan research facility` (Ruwen joins), then take Ruwen to the wormhole marker in the Rock Homeworlds.
The sector has no exit to the rest of the map except onward; the whole sector is a detour.
Nearly every event here turns on being an outsider in a xenophobic society that just had its Long-Range Beacon reopened by you.*
### Auto-ship fight (Crystal)
- Where: Hidden Crystal Worlds — normal beacon (ship detected), once per sector
- Setup: A Rebel automated scout has tracked you even here.
- Choices:
  1. (single option) → fight an Auto-ship → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Boarders: Crystal
- Where: Hidden Crystal Worlds — normal beacon (no ship), repeatable
- Setup: Crystal ships rounding up "intruders" teleport a capture party aboard.
  Three intros, one of which is overheard: "Try to take them alive this time, there's a lot of money to be had on aliens."
- Choices:
  1. (single option) → **2–3 Crystal boarders** aboard.
     (Crystal crew can lock down a room, making these unusually dangerous.)
- Resources: crew (injure / lose), system (damage)
- Tags: `no-choice`, `fight`, `tax`
### Crystal chat
- Where: Hidden Crystal Worlds — normal beacon (no ship), once per sector
- Setup: A civilian recognises you as "that alien that opened up the portal" and wants to ask questions.
- Choices:
  1. `Yes.` → `Try to answer his questions.` → three branches (odds hidden): he cheerfully flags down a passing Rebel ship and you must fight it (default rewards); random resources with some scrap; or **6 hull repairs**. `"I don't have time for this."` → nothing.
  2. `No.` → nothing happens.
  - `[requires: Crystal crew]` `Have your crew speak to them.` → a random amount of fuel and scrap, no fight.
- Resources: scrap, fuel, missiles, drone parts, hull (repair / combat)
- Tags: `gamble (odds-hidden)`, `gated`, `walk-away`
### Crystal fight choice
- Where: Hidden Crystal Worlds — normal beacon (no ship), once per sector
- Setup: A Rebel advance ship is firing on a Crystalline vessel.
- Choices:
  1. `Engage the Rebel ship.` → the Crystal ship kills the Rebel itself, then turns on you: "You, you are like these other aliens!
     You brought them here!"
     Fight a Crystal ship (default rewards; no surrender, no escape).
  2. `Leave them alone.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `optional-fight`, `walk-away`
- Note: helping is punished outright — there is no good outcome on the intervening branch.
### Crystal fight with surrender offer (Human crew)
- Where: Hidden Crystal Worlds — normal beacon (ship detected), once per sector
- Setup: A Crystal hunter ship with human captives in its cargo bay opens fire on sight.
- Choices:
  1. (single option) → fight the Crystal ship.
     **50% chance of a surrender offer at 30–40% hull**: `Accept their surrender.` → **a Human crewmember**, and the fight continues anyway (the surrender lacks the stop-fight tag, so you can take the crewmember *and* the kill reward); `Finish them off.` → fight continues.
     Destroyed or crew killed → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), hull (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `moral`
- Note: a bug makes mercy strictly free — you keep the prisoner and still get the kill.
### Crystal fight with surrender offer (hull repairs)
- Where: Hidden Crystal Worlds — normal beacon (ship detected), once per sector
- Setup: A civilian convoy's escort attacks you pre-emptively even though you show no hostility.
- Choices:
  1. (single option) → fight a Crystal ship.
     **100% surrender offer at 30–40% hull**: `Stop the fight.` → they turn out to be miners and colonists fleeing pirates; low fuel and scrap plus **8 hull repairs**. `Finish them off.` → fight continues; destroyed or crew killed → medium scrap with resources.
- Resources: scrap, fuel, hull (repair / combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `moral`
### Crystal fight
- Where: Hidden Crystal Worlds — normal beacon (ship detected), repeatable
- Setup: A Crystal ship attacks.
  Seven rotating intros, most of them xenophobic: "Hah.
  It looks like another worthless alien-filled craft."
- Choices:
  1. (single option) → fight a Crystal ship (default rewards).
     **40% chance of a surrender offer at 30–40% hull.**
     On surrender: `Accept their surrender.` → three sub-branches (odds hidden): a young soldier asks to join — `Yes` gives **a Crystal crewmember**, `No` gives random resources with some scrap; or an apology plus random resources with some scrap; or nothing. `Ignore them.` → fight continues.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), hull (combat)
- Tags: `no-choice`, `fight`, `gamble (odds-shown)`, `moral`
- Note: this is the main way to pick up a Crystal crewmember without a store.
### Crystal scrap collector
- Where: Hidden Crystal Worlds — normal beacon (no ship), once per sector
- Setup: A private collector of alien artifacts wants to buy your junk.
  "What is scrap to you is priceless to me."
- Choices:
  1. `Offer 35 scrap.` (−35 scrap) → he would rather come along: `Accept.` → **a Crystal crewmember**. `Request another payment.` → two branches (odds hidden): the **Crystal Lockdown Bomb** or the **Crystal Burst Mark II** weapon.
  2. `Turn him down.` → nothing happens.
- Resources: scrap, crew (gain), weapon
- Tags: `trade`, `walk-away`, `gamble (odds-hidden)`
- Note: a rare fixed-price purchase of a crewmember or a named weapon.
### Crystal ship attacking Federation loyalists
- Where: Hidden Crystal Worlds — normal beacon (no ship), repeatable
- Setup: A Crystalline border guard is running down a small Federation ship.
- Choices:
  1. `Save the Federation ship.` → fight a Crystal ship (no surrender, no escape) → medium scrap with resources (high if crew killed), then contact: **a crewmember** + low scrap with resources, or random resources with some scrap (odds hidden).
  2. `Prepare to leave.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, crew (gain), hull (combat)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
### Crystalline cache
- Where: Hidden Crystal Worlds — normal beacon (no ship), once per sector
- Setup: A crater on a huge orbiting asteroid has been sealed under thick crystal.
  Something is inside.
- Choices:
  1. `Attempt to break through with the weapons you have.` → two branches (odds hidden): the barrier holds, nothing happens; or a lucky shot opens it → `Investigate the cache`.
  - `[requires: Breach Missiles]` `Use a breach missile.` (costs 1 missile) → opens it.
  - `[requires: Crystal crew]` `Have your Crystalline Being recalibrate your weapons.` → opens it, free.
- Investigate the cache (three branches, odds hidden):
  - A forgotten weapons cache → **a Crystal weapon** + low resources and scrap.
  - The owners return → same weapon and scrap, **plus 2–3 Crystal boarders**.
  - A **singularity booby trap** with a crewmember inside: `Pull out now!` → **lose a crewmember** (Clone Bay revives); `Detonate your entire fuel reserves to escape with your crew and the cargo.` → **a weapon** + low resources and scrap, but **all your fuel** (up to 100); `[requires: Teleporter level 2+]` → crewmember back, nothing gained; `[requires: Engines level 7+]` → **a weapon** + low resources and scrap, everyone and everything saved.
- Resources: scrap, fuel (potentially all of it), missiles, drone parts, weapon, crew (lose), hull/crew (boarding)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `push-your-luck`
- Note: the fuel-detonation option is the game's most expensive single choice — an entire resource stock for one weapon.
### Crystalline men buried
- Where: Hidden Crystal Worlds — normal beacon (ship detected), once per sector
- Setup: A large Crystalline ship needs help digging out men buried on a planet, and asks for one of your crew.
- Choices:
  1. `Send a crewmember to help.` → the dig will take days, not hours.
     Then, repeatedly:
     - `Leave your crew member behind.` → **lose a crewmember** permanently (Clone Bay cannot help) + medium fuel and scrap.
     - `Pull your guy out.` → the captain takes it as an insult; fight a Crystal ship (default rewards, no surrender, no escape).
     - `Wait.` → **the Rebel fleet's pursuit doubles for 1 jump**, then the same three options again with better payouts: leaving him behind now gives high fuel and scrap; waiting a *second* time returns your crewmember plus the **Heavy Crystal Mark II** weapon, at the cost of another doubled-pursuit jump.
  2. `Refuse.` → nothing happens; they call your species soft and weak.
- Resources: fuel, scrap, crew (lose), weapon, rebel fleet advance (accelerated)
- Tags: `push-your-luck`, `sacrifice`, `chain`, `walk-away`, `optional-fight`
- Note: the clearest push-your-luck structure in the group — each `Wait` costs real time against the fleet and improves the prize.
### Crystalline research facility
- Where: Hidden Crystal Worlds — normal beacon (no ship), once per sector
- Setup: A Crystal scientist is curious about alien physiology and asks to run "a few simple tests."
- Choices:
  1. `Allow them to run tests on a crew member.` → three branches (odds hidden): they kill your crewmember by accident — **lose a crewmember** (Clone Bay revives) and receive **a weapon** with low scrap; medium resources with some scrap; or **a drone schematic** with low scrap.
  2. `Refuse.` → two branches (odds hidden): nothing, or they decide to take a sample by force — fight a Crystal ship (default rewards, no surrender, no escape).
  - `[requires: Rock crew]` `Send your Rockman crew.` → medium scrap with resources (they are delighted to scan an "evolutionary cousin").
  - `[requires: Backup DNA Bank augment]` `Send your crew's data.` → **a weapon** with medium scrap, nobody risked.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone (schematic), crew (lose), hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `sacrifice`, `optional-fight`
- Note: refusing is not safe — it has its own fight branch.
### Crystalline ship messaging about Rebels
- Where: Hidden Crystal Worlds — normal beacon (ship detected), once per sector
- Setup: A Crystal ship wants to buy your flight path so it can hand the Rebels a route out of Crystal space.
- Choices:
  1. `Give them your flight plans.` → **high scrap**, and **the Rebel fleet's pursuit doubles for 1 jump**.
  2. `Accept the scrap but give them false flight plans.` → two branches (odds hidden): **high scrap and the fleet is delayed 1 jump**; or they spot the forgery — **1–2 Crystal boarders** plus a Crystal ship fight, no scrap.
  3. `Refuse.` → nothing happens.
  - `[requires: Distraction Buoys augment]` `Accept the scrap but give them falsified flight plans.` → high scrap and the fleet delayed 1 jump, guaranteed.
- Resources: scrap, rebel fleet advance (accelerated or delayed), crew (boarding), hull (combat)
- Tags: `gamble (odds-hidden)`, `gated`, `trade`, `walk-away`, `moral`
- Note: one of the few events where lying is both the best outcome and the risky one, and an augment removes the risk entirely.
### Empty beacon (Crystal)
- Where: Hidden Crystal Worlds — normal beacon (no ship), repeatable
- Setup: Nothing is here.
  Six flavour lines, most of them about being unwelcome: a station that cloaks itself and vanishes as you arrive; evacuating colonists who shout "Damn you aliens!
  This is why we closed that Long-range Beacon in the first place!"
- Choices:
  1. (single option) → nothing happens.
- Resources: none
- Tags: `no-choice`
### Federation deserters
- Where: Hidden Crystal Worlds — normal beacon (ship detected), once per sector
- Setup: A Federation military ship that deserted the fleet has taken refuge in this sector.
- Choices:
  1. `Offer supplies.` (−15–25 scrap, −1–3 fuel) → **the current sector map is revealed**.
  2. `Attack the traitors.` → fight a Federation ship (default rewards, no surrender, no escape).
  3. `Leave them be.` → nothing happens.
- Resources: scrap, fuel, map reveal, hull (combat)
- Tags: `trade`, `optional-fight`, `walk-away`, `moral`
- Note: the only event in the game that lets you attack a non-pirate Federation ship.
### Mantis ship attacking Crystal
- Where: Hidden Crystal Worlds — normal beacon (no ship), repeatable
- Setup: A Mantis ship is attacking a small Crystal civilian vessel while others flee.
- Choices:
  1. `Attack the Mantis.` → fight a Mantis ship (no surrender, no escape) → medium scrap with resources (high if crew killed), then the shared `Crystal Ship Saved` roll (odds hidden): random resources with some scrap; nothing, with the rescued ship blaming you for bringing the war ("I should kill you myself..."); or **a Crystal weapon**.
  2. `Ignore them.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, hull (combat)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
### Pirate ship attacking Crystal
- Where: Hidden Crystal Worlds — normal beacon (no ship), repeatable
- Setup: A pirate that followed you through the reactivated Long-Range Beacon charges a Crystal transport.
- Choices:
  1. `Attack the pirate.` → fight a Pirate ship → medium scrap with resources (high if crew killed), then the `Crystal Ship Saved` roll (random resources with some scrap / nothing / a Crystal weapon).
  2. `Ignore them.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, hull (combat)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
### Rebel fight (Crystal)
- Where: Hidden Crystal Worlds — normal beacon (ship detected), repeatable
- Setup: A Rebel ship jumps in right behind you.
- Choices:
  1. (single option) → fight a Rebel ship (default rewards).
- Resources: scrap, fuel, missiles, drone parts, hull (combat)
- Tags: `no-choice`, `fight`
### Rebel ship attacking Crystal ship
- Where: Hidden Crystal Worlds — normal beacon (no ship), repeatable
- Setup: A Crystal ship and a Rebel are already shooting at each other when you arrive.
- Choices:
  1. `Attack the Rebel.` → fight a Rebel ship → medium scrap with resources (high if crew killed), then the `Crystal Ship Saved` roll (random resources with some scrap / nothing / a Crystal weapon).
  2. `Attack the Crystalline ship.` → the Rebel jumps away to report your position: **the fleet's pursuit doubles for 1 jump**, and you fight a Crystal ship (default rewards, no surrender, no escape).
  3. `Ignore them.` → nothing happens.
- Resources: scrap, fuel, missiles, drone parts, weapon, rebel fleet advance (accelerated), hull (combat)
- Tags: `optional-fight`, `walk-away`, `gamble (odds-hidden)`, `moral`
### Store (Crystal)
- Where: Hidden Crystal Worlds — **store beacon** (no ship)
- Setup: A Crystal merchant or artifact collector opens trade.
  One intro is a vendor apologising that it has been a long time since he needed the universal translator: "Please, buy, buy!"
- Choices:
  1. (single option) → a store opens.
- Resources: scrap, fuel, missiles, drone parts, weapon, drone, augment, crew (gain), hull (repair), system (upgrade)
- Tags: `no-choice`, `trade`
- Note: the only stores in the game that normally sell Crystal crewmembers.

---

## The Last Stand
Sector intro: *"You arrive at an outpost close to the Federation Base.
Your access codes get you past initial security and an officer sets up a direct feed to the Federation Base's war room.
Admiral Tully speaks first saying, 'What is the meaning of this?!
Who are you?'"*

Sector-level rules, which matter more than any individual event here:
- **On arrival you get 10 hull repairs and 10 fuel**, free.
- The **Rebel Flagship** is drawn on the map orbiting a beacon, on the right side of the sector.
  It jumps **once per two jumps you make**, and the beacon it will jump to next is shown with a dotted or solid line.
  Landing on its beacon starts the fight.
- The **Federation Base** spawns just right of centre.
  It can never be overtaken, and **acts as an empty beacon** — there is no Federation Base event.
  If the Flagship sits on it for **3 consecutive turns, you lose the game.**
  Driving the Flagship off returns the base to Federation control.
- The Rebel fleet does not advance as a wall from the left.
  It **overtakes random individual beacons** each turn, flagged with flashing red outlines.
  The Flagship also overtakes whatever beacon it occupies.
- **You may wait at a beacon even with fuel.**
  Waiting ticks the map forward, and if a fight results from waiting you start it with a full FTL charge.
- **No quests can spawn in sector 8.**
  A quest pushed out of sector 7 is simply cancelled.
- Beacon budget: 1 store, 3 repair stations, 6 hostile encounters, 7-10 neutral encounters.
  Crew available: Human (common), Engi and Mantis, Rockmen (rare).
### Empty beacon (Last Stand)
- Where: The Last Stand — normal beacon (no ship detected).
  Non-unique.
- Setup: Federation forward-carriers and dreadnoughts in formation; wreckage from skirmishes; a settlement mid-evacuation; missile locks that drop the moment you transmit your ship signature; a battalion of fighters tangling with a Rebel scout squadron near a moon.
- Choices:
  1. `Continue` → nothing happens.
- Resources: none
- Tags: `no-choice`
- Notes: the only "empty beacon" in the game whose flavor is *friendly* congestion rather than emptiness.
  This is also what the Federation Base beacon plays as.
### Fight in Last Stand
- Where: The Last Stand — normal beacon (ship detected).
  Non-unique.
- Setup: A Rebel scout has slipped past the Federation line; or the Rebels are planting a forward jump beacon behind a moon; or a "small trade vessel" turns out to have a fake registration.
- Choices:
  1. (forced) → fight either a Rebel ship or an Auto-ship, default rewards.
     Never surrenders, never escapes.
     The draw is weighted across 2x Auto-Scout, 1x Auto-Surveyor, 2x Auto-Assault, 1x Auto-Hacker, 2x Rebel Rigger, 1x Rebel Disruptor, 2x Rebel Fighter, 1x Rebel Invader.
- Resources: scrap, fuel, missiles, drone parts, hull (at risk)
- Tags: `no-choice`, `fight`, `gamble (odds-hidden)`
### Rebel fight among Rebel fleet
- Where: The Last Stand — normal beacon (ship detected).
  Non-unique.
- Setup: You arrive inside the Rebel fleet itself.
  Your disguise buys you nothing but the attention of a single fighter.
  *"What was once a great series of space stations is now nothing but a small ring of debris around the nearby moon.
  There's no time to mourn the dead; an enemy approaches!"*
- Choices:
  1. (forced) → fight a Rebel ship (never surrenders, never escapes).
     - destroyed → **low scrap only** — "There's no time to salvage all of the wreck, the fleet is still nearby."
     - crew killed → medium scrap with resources
- Resources: scrap, fuel, missiles, drone parts, hull (at risk)
- Tags: `no-choice`, `fight`
- Notes: the reward is deliberately stunted versus the same fight anywhere else — killing the crew rather than the hull is the only way to get a full payout in sector 8.
### Rebel fight among Federation and Rebel fleets
- Where: The Last Stand — normal beacon (ship detected).
  Non-unique.
- Setup: The two fleets are destroying each other in the middle distance and you are trying to slip around the edge.
  *"The sheer scale of the destruction in the distance is almost breath-taking.
  Unfortunately, your position as an independent observer doesn't last for long!"*
- Choices:
  1. (forced) → fight a Rebel ship (never surrenders, never escapes); destroyed → low scrap; crew killed → medium scrap with resources.
- Resources: scrap, fuel, missiles, drone parts, hull (at risk)
- Tags: `no-choice`, `fight`
### Rebel ship attacking civilians in Last Stand
- Where: The Last Stand — normal beacon (no ship detected).
  Non-unique.
- Setup: A Rebel bomber has slipped past the escort screen onto a column of transports; or a colony, a station, or a civilian ship on a secure Federation channel is asking for help.
  Several intros end in a direct question to the player: *"Will you respond?"*
- Choices:
  1. `Prepare to fight the Rebel ship!` → fight a Rebel ship (50% chance to try to escape at 40-80% hull).
     Destroyed → medium scrap with resources; crew killed → high scrap with resources.
     Then **Contact the survivors** (random): **8 hull repairs** / `fuel 2-4, missiles 2-4, 1 drone part` with scrap / nothing but thanks from refugees.
  2. `There's no time, get ready to jump.` → "You try to block out the horrors of war and focus on your mission."
     Nothing happens.
- Resources: scrap, fuel, missiles, drone parts, hull repair, hull (at risk)
- Tags: `optional-fight`, `walk-away`, `moral`, `gamble (odds-hidden)`
- Notes: the only remaining `moral` choice in sector 8, and the only one where the game's framing ("focus on your mission") actively excuses walking away.
### Repair station in Last Stand
- Where: The Last Stand — repair beacon (3 per sector, each usable once, and each can be overtaken by the fleet before you reach it).
- Setup: A mobile construction platform, a converted Engi shipyard, or Federation engineers working out of a repurposed trade station.
  Your command codes or mission priority get you to the front of the queue.
- Choices:
  1. `Continue` → **15 hull repairs, 22-44 scrap, 5 fuel, 4 missiles, 5 drone parts.**
- Resources: hull repair, scrap, fuel, missiles, drone parts
- Tags: `no-choice`, `gift`
- Notes: by a distance the largest unconditional handout in the game — sector 8 stops charging you for anything except time.
### The Rebel Flagship
- Where: The Last Stand — the Flagship's own beacon, wherever it currently sits.
  Forced on contact.
- Setup: The game's final boss and its only three-stage fight.
  It jumps once per two of your jumps, toward the Federation Base.
  Three consecutive turns on the base and you lose.
  Beating a stage makes it jump away and wait one turn before resuming its assault.
- Choices:
  1. (forced on arrival) → fight the current stage.
     You may jump away mid-stage and come back; the Flagship's **hull, system damage, fires and breaches are fully repaired between stages and between retreats**, but its **crew is persistent** and killed crew are never replaced — with one exception, that retreating during stage 1 restores its crew.
- Across all stages:
  - Shields 8 (four layers; three on Easy without Advanced Edition).
    Medbay 3, Oxygen 2, Piloting 3.
  - Weapons are **artillery systems in isolated rooms** — they cannot be manned, and on Hard mode two extra corridors connect the Laser and Missile rooms to the ship, making them easier to repair.
    The missile artillery **never consumes ammunition**.
  - Killing the whole crew does **not** win.
    A message says the AI has taken control; the ship then behaves as an auto-ship, treating undamaged systems as manned and progressively self-repairing everything not on fire or breached.
  - The Flagship **caps your Sensors at level 2**, so enemy power allocation and weapon charge are visible only through Hacking.
  - With a Clone Bay, crew left aboard the Flagship can be cloned after it jumps — unique to this fight.
  - **Destroying stage 1 and stage 2 each pay a high scrap reward at sector-1 values.**
    Stage 3 pays nothing; the reward is the ending.
- Stage 1 — hull 20, reactor 42, **11 Human crew**, 10 drone parts.
  Weapons: Boss Ion (3), Boss Laser (3), Boss Missile (3), Boss Beam (3).
  Systems include Cloaking 2, Doors 3, Engines 2, and **Hacking 3** (Advanced Edition).
  Dodge 10% base / 20% manned.
  Losing the stage strips the Ion.
- Stage 2 — hull 22, reactor 44, crew carried over, 10 drone parts.
  Weapons: Laser, Missile, Beam.
  Drone system 8 running Combat Mk I, Anti-Ship Beam I, Defense Mk I and a Boarding Drone; Cloaking, Doors and Hacking are gone.
  **Power Surge** (cooldown random 20-30s, 5-second audible warning) spawns 4 / 6 / 7 extra Beam-and-Combat drones on Easy / Normal / Hard.
  Surge drones cost no drone parts and are unaffected by hacking or destroying the Drone system.
  Dodge 15% / 25%.
  Losing the stage strips the Beam.
- Stage 3 — hull 20, reactor 32, crew carried over, **Zoltan Shield with 12 health**.
  Weapons: Boss Laser (4), Boss Missile (4).
  Systems add **Teleporter 2**, Engines 6, and **Mind Control 3** (Advanced Edition).
  **Power Surge** fires 7 simultaneous lasers, and every 4th surge instead fully restores the Zoltan Shield.
  Surge lasers are Heavy Laser Mk I hard-coded to 1 damage: 30% fire, 21% breach, 20% stun.
  Boarders left aboard when the Zoltan Shield returns are **stuck there** until it breaks again, unless you carry Zoltan Shield Bypass.
  Dodge 28% / 38%.
- Resources: hull, scrap (stages 1 and 2), crew (at heavy risk), systems, the run itself
- Tags: `no-choice`, `fight`, `chain`, `push-your-luck`
- Chain: three stages, plus the parallel loss condition of the Flagship reaching the base — the only fight in FTL with a clock that can end the run without ever shooting you.

---

## Structural notes

### Scheduling, timers, gates, and repetition (all sectors)
**How events are scheduled.**
A run is eight sectors; each sector is a graph of roughly 17–25 beacons, and every beacon is stocked at sector-generation time by drawing from named event lists in a fixed order.
The sector's own data specifies how many of each kind.
A Civilian Sector is 2–3 stores, 2–3 "various items", 2–4 neutral encounters, 1–2 empty beacons, 1–2 distress beacons, 6–8 hostile encounters, 0–2 quests, and 0–8 nebula spaces.
Engi sectors are 2–3 stores, 5 items, 1–2 empty, 1–3 distress, 1 quest, 4–7 neutral, 5–7 hostile.
Zoltan sectors guarantee one `Zoltan research facility` (Zoltan Homeworlds also guarantees one `Unarmed Zoltan transport`), plus 2 stores, 1–2 empty, 1–2 distress, 1–2 boarder events, 6–8 hostile, 5–6 neutral, 0–1 quests, 2–6 nebula.
Hidden Crystal Worlds is the outlier: 12 neutral encounters, 6–10 hostile, 2–3 stores, 2 items, 2 empty, 1–2 boarders, and no quest beacon at all.
Roughly a third to a half of beacons are forced fights, a third are text events with real choices, and the rest are stores, item gifts and empty space.
Filler events backfill any beacon slots the sector list did not use; an `alsooccur=exit` event can also be the exit beacon.

**The fleet timer.**
The Rebel fleet advances one step per jump, shading the map from the left.
Jumping into the shaded area forces a fight with an Elite Fighter under Anti-Ship Battery fire for almost no reward, so the timer is a real deadline, not a mood.
Events move it in both directions: letting a fleeing scout escape (`Auto-ship warning`, `Rebel ship warning`, `No fuel: Auto-ship warning`) **doubles** pursuit for a turn; so does abandoning the miners in `Asteroid belt distress`, siding with the Rebels in `Zoltan quest primitives`, selling your flight path in `Crystalline ship messaging about Rebels`, or each `Wait` in `Crystalline men buried`.
Going the other way, `The mercenary` buys 2 turns of delay for 10–25 scrap, `Engi cache` buys 2 turns for 2 missiles, and `No fuel: Rebel fleet delay` gives 1 turn free.
Nebula beacons halve the advance rate; Distraction Buoys postpone it a turn at sector start.
Almost every interesting decision in the game is priced in this currency rather than in scrap.

**Distress beacons.**
Distress beacons are drawn from a separate list and are visible on the map before you jump.
They pay better on average and they are where most of the crew-loss events live (`Giant alien spiders`, `Fire on research station`, `Unknown disease on mining colony`). `Pirate ship distress trap` appears in every sector family, which is what makes answering a distress call a genuine risk.
Long-Ranged Scanners shows whether a beacon has a ship, but "no ship detected" does not mean no fight, and "possible ship detected" often means a friendly.

**Quest markers.**
A quest is two or three beacons: an event places a marker somewhere in the sector, you fly to it, and a second event resolves.
Markers are placed in the current sector unless there are too few jumps left, in which case they push to the next sector; in sector 7 they are silently cancelled, because sector 8 cannot hold quests.
Quest chains in this group: `Mantis war camp`, `Space station under construction`, `Capture the ship`, `Escort civilians` (both variants), `Settlement mercenary work`, `Merchant's request` (three separate marker types), the Hidden Federation Base chain (reachable from four different events), `Zoltan trade hub` → `Zoltan quest primitives`, `Engi fleet discussion` (three stages, unlocks the Stealth Cruiser), `Unarmed Zoltan transport` (unlocks the Zoltan Cruiser), and the three-sector Crystal Cruiser chain (`Dense asteroid field distress` → `Zoltan research facility` → the Rock Homeworlds wormhole → Hidden Crystal Worlds).

**Stores.**
Stores are guaranteed beacons, 2–3 per sector, and they are the only reliable place to convert scrap into weapons, drones, augments, crew, hull and system upgrades.
Several events also open a store as an outcome (`Large trade station`, `Zoltan trade hub`, `Pirate briber`, `Settlement mercenary work`, the escort destination), which effectively adds stores to the run.
Alongside them sit fixed-rate service beacons that never vary: `Repair station` at 2 scrap per hull point, `Refueling station` at 2 scrap per fuel, `Sell missiles` at 3 scrap each, `Sell drone parts` at 4 scrap each.
Those flat rates are the baseline every gamble in the game is measured against.

**Blue options.**
A blue option is an extra choice that appears only if you hold a specific prerequisite: a system at a level (Sensors 2/3, Cloaking 1/2/3, Hacking 1/2/3, Medbay 2/3, Engines 3-5/6+/7+, Piloting 2+, Weapon Control 6+, Door System 2+, Clone Bay 2+, Teleporter 1/2+), a crew race (Human, Engi, Mantis, Rock, Slug, Zoltan, Crystal, Lanius), an augment (Rock Plating, Scrap Recovery Arm, Lifeform Scanner, Long-Ranged Scanners, Distraction Buoys, Backup DNA Bank, Damaged Stasis Pod, Advanced FTL Navigation, Engi Med-bot Dispersal), or a weapon or drone class (any Beam, any Ion weapon, Fire Bomb, Anti-Bio Beam, Breach Missiles, Healing Burst, Defense/Repair/Boarding/Anti-Personnel/Beam/Hull Repair drones).
Some consume ammunition; most just need to be owned.
Roughly a third of text events carry at least one, and the richest carry six (`The Engi virus`, `Malfunctioning defense system`).
They change expected value in three distinct ways, and the distinction is the design lesson: some **remove the risk** (`Engi research station`'s scan turns a crew-death dilemma into a free pick; `Large asteroid field`'s Scrap Recovery Arm replaces a six-way lottery with guaranteed high scrap), some **raise the ceiling** (`Mantis war camp`'s Fire Bomb pays a free Engi crewmember; `Malfunctioning defense system` scales its payout with how surgical your tool is), and some **buy information only** (`Deactivated Auto-ship`'s Sensors 3 tells you whether the gamble is safe and then still asks; `Single life form on moon`'s Slug reads the stranger's mind; `Pirate ship selling weapon`'s Mind Control shows you the weapon before you pay 45 scrap).
A handful are jokes — `Asteroid mining colony`'s "Offer to solve their problem by launching a missile" exists only to be refused on union-safety grounds.

**Repetition.**
Every event carries a `unique` flag.
Unique events fire at most once per sector but can recur in a later sector of the same type; non-unique events (most plain fights, `Empty beacon`, `Free weapon`, `Trade resources`, `Refugee`) can fill several beacons in one sector.
Ship-unlock events are once per run.
So a long run sees the same eight or ten fight intros many times while the memorable set-pieces appear once each, which is why the fights carry twenty rotating intro texts and the set-pieces carry one.

**Register.**
Terse, wry, and willing to let a bad outcome just land:

> "You find what appears to be pieces of a derelict ship coated with ice or crystal.
> Before you have a chance to dock, a few asteroids get past your shields and partially damage your engines.
> You'll have to pull out!"

> "It looks as if the ship ran out of fuel, and the crew ran out of food not long after.
> Despite the grisly scene that remains, you find one surviving crewman locked in the freezer, almost perfectly preserved and apparently overlooked by the starving crew."

> "While I appreciate your enthusiasm, we have certain protocols for the use of explosives around the workplace.
> Launching a military grade weapon into our mines isn't exactly what I'd call 'union-friendly'."

> "Personally," says the captain, "I'd have stuck with the Federation.
> But I'm a soldier, sir, and I'm no use without a war to fight.
> Raise your shields!"

> "Holy crap!
> A weapon is just floating in space!"

### Mantis, Rock, Slug, and Lanius sectors
**Mantis space threatens your crew, not your ship.**
The pool's distinctive move is putting hostiles *inside* you: `Boarders: Mantis` has no enemy ship at all and is flagged "no ship detected" on Long-Ranged Scanners, so the warning system lies to you by omission. `Escape pod`, `Mantis fugitive` and `Mantis ship-collectors` all resolve into boarders or crew changes rather than hull trades.
Mantis ships never surrender and rarely flee — the sector has almost no `trade` or `walk-away` outcomes, and stores are framed as anomalies ("Merchants are not highly respected among the Mantis race, so few undertake the profession").
The two gated options that matter are a Mantis crewmember (flavour only) and a Cloaking system.
The unlock chain is the purest expression: you get the Mantis Cruiser only by killing the crew without destroying the hull and then having the medical infrastructure to save the captain you were shooting at.

**Rock space gates on equipment and punishes trespass.**
The recurring blue options are Rock Plating, Rock crew, a missile weapon, a drone part, an engine or sensor level — possessions, not people.
The common failure mode is not ambush but offence: you hailed on a trading frequency, you scanned a station, you scrapped a device, and a patrol arrives believing you are a pirate.
Rock events are also where the game runs its longest chains — `Rock bride` and `Rock war vessel encounter` both defer their real decision a full jump, and the Crystal chain needs three events to appear in the right sector order or it is unwinnable.
Rock ships are the only ones in this group that routinely offer surrender, which reads as ritual rather than fear.

**Slug space attacks information.**
Nearly every Slug beacon sits in nebula, which disables your sensors and hides the enemy's rooms; several events are explicitly flagged "occurs at a regular beacon, but when you arrive there will be a nebula environment."
The `Slug hacker` family hands you a menu of your own systems and asks which to lose, then does not honour it ("Shields" can be picked with no shield system; "Weapons" spares Artillery). `Slug repair station` and `Slug store ship` are both stalling scripts where every polite answer buys the other side time. `Slug moons question` puts the correct answer in the setup text and robs you if you did not read it.
Most pointedly, `Slug Home Nebula surrender` is *deliberately indistinguishable* from an ordinary `Slug fight in nebula` — the ship unlock is hidden inside a routine encounter, and you can only find it by accepting a surrender you would normally refuse.
A Slug crewmember is the counter-key, appearing as a blue option across most of the pool.

**Lanius space is about what is not there.**
The sector is named for its absence, and the empty beacons carry the theme rather than the fights: "Yet another area sucked dry by the Lanius."
"You have no way of knowing if the area was always uninhabited or if it was simply erased."
The oxygen mechanic runs underneath everything — Lanius boarders drain the air from the room they stand in, so a single boarder is a slow structural failure, and the human boarders in `Boarders: Humans (Abandoned)` arrive wearing Emergency Respirators when they follow a Lanius fight.
Metal is the sector's currency: the Lanius eat stations, debris fields, the jump beacon you arrived on, and the repair drone you send to help them.
Their ships also surrender and flee at 80%, so the pool is unusually full of encounters that end without a kill.
Its blue options are almost all a Lanius crewmember, and what that crewmember buys is *translation* — `Lanius lone ship`, `Lanius ship absorbing jump beacon` and `Lanius ship attacking civilian distress` all turn a fight into a trade, a gift, or a stand-down once someone can actually talk.

Three snippets that show the register:

> "You question a local settlement and they describe a fleet of metal ships wordlessly collecting all of the abandoned metal and debris in the area."

> "A Mantis female comes on the vidscreen.
> The females don't make it to authority unless they're particularly vicious.
> You power the weapons."

> "I'm feeling generouss today.
> I shall allow you to choose your own death.
> Which do you like leasst: shields, oxygen, or weaponsss?"

And one that shows how the writing handles the ethical options, from `Rebel ship supplying civilians`:

> "You wonder if any more Rebels will be available to help these civilians on the edge of nowhere.
> Oh well, for you a few more dead Rebels matter more than the lives of a thousand colonists."

### Rebel, Pirate, nebula, and Last Stand sectors
**Rebel and Pirate sectors shift the mix toward fights and extortion.**
In an ordinary sector most beacons are a store, a trade, a wreck to search, or nothing.
In Rebel space the same beacon slots are filled with ships that are already hunting you: `Rebel fight`, `Rebel fight with boarders`, `Rebel fight near pulsar`, plus the whole auto-ship family, which exists because auto-ships are *Rebel* technology.
The distinctive Rebel pressure is not damage but **information about your position**. `Rebel ship warning` and `Auto-ship warning` are scouts on a 40-second FTL timer whose escape doubles the Rebel fleet's pursuit; `Rebel defector` can double it as a betrayal; `Auto-ship near radar station` is the one event that can *delay* the fleet a turn, and can also trip an alarm and speed it up.
The player's real resource in Rebel space is the map clock.
Pirate space runs the opposite economy: pirates are the only faction that routinely surrenders and flees, so almost every Pirate encounter is priced. `Pirate toll` charges 15-25 scrap to skip the fight outright. `Pirate briber` pays you to look away and pays *more* if you fight and then accept. `Pirate ship selling weapon` sells you a weapon you are not allowed to see. `Slaver (hostile)` asks for a crew member and explicitly closes the Clone Bay loophole in text.
The Pirate pool's recurring move is to convert a combat encounter into a transaction with an unfavourable information asymmetry, then let you pay, fight, or walk.

**Nebula sectors change information, and the events change with it.**
A nebula sector starts with no map, every nebula beacon disables Sensors on both ships, plasma-storm beacons halve your reactor, and the whole sector slows the Rebel fleet — so a nebula is a trade of sight for time.
The events mirror that exactly. `Empty nebula beacon` has nine texts about not being able to confirm that nothing is there. `Boarders: Humans in nebula` and `Boarders: rebels in nebula` open with shots already inside your hull and no enemy ship ever visible. `Auto-ship near storage station in nebula` adds a line the non-nebula version does not have — "without functioning sensors it is impossible to tell what is inside" — and answers it with four blue options where the clear-sky version has one.
The blue options here usually do not add reward; they delete risk, which is what information is worth. `Plasma storm incapacitated ships` is the clearest case: Piloting 2+ removes both bad branches and slightly downgrades the weapon.
Two nebula events, `Rebel fight in nebula` and `Pirate fight in nebula`, **can never fire** — identically named eventLists shadow them, so "a nebula hostile encounter" is in practice a roll on a table of other nebula events.

**The Last Stand is structurally unlike every other sector.**
It is the only sector with a losing clock that is not the fleet: the Flagship jumps once per two of your jumps and wins if it holds the Federation Base for three turns.
Waiting at a beacon becomes a legal move, with a full FTL charge as a reward.
Quests cannot spawn at all.
The fleet stops advancing as a wall and starts flipping random individual beacons.
Economically the sector stops charging you — 10 free repairs and 10 fuel on arrival, three repair beacons worth 15 hull plus 22-44 scrap plus 5 fuel, 4 missiles and 5 drone parts each — while simultaneously *cutting* combat rewards: the two fleet-battle events pay low scrap on a kill because "there's no time to salvage."
Sector 8 explicitly stops being about accumulation and becomes about routing and timing.
And the Flagship is the only fight with three stages, persistent enemy crew across stages but fully restored hull, a crew-kill that does not win (the AI takes over), a hard cap on your Sensors, and a reward structure that pays for stages 1 and 2 and nothing for stage 3.

**Register.**
The writing is dry, close third person, and it lets antagonists be reasonable:

> "Personally," says the captain, "I'd have stuck with the Federation.
> But I'm a soldier, sir, and I'm no use without a war to fight.
> Raise your shields!"

> "Greetings and welcome to our beacon!
> For a small fee, we'll let you continue on your way."

> With the sensors down, you spend a good deal of time staring out the window.
> It is, you must admit, rather beautiful here.

## Counts

| Pool | Events |
|---|---|
| Sector-agnostic events | 72 |
| Out of fuel (global sub-pool) | 17 |
| Civilian Sector | 12 |
| Engi sectors | 16 |
| Zoltan sectors | 27 |
| Mantis sectors | 11 |
| Rock sectors | 21 |
| Slug sectors | 36 |
| Abandoned Sector (Lanius) | 31 |
| Rebel sectors | 6 |
| Pirate Controlled Sector | 7 |
| Uncharted Nebula and nebula hazards | 6 |
| Hidden Crystal Worlds | 20 |
| The Last Stand | 7 |
| **Total** | **289** |
