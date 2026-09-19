# FTL: Faster Than Light — achievement inventory

Audited 2026-09-18 for Space Prince's proposed achievement system.
The comparison is in [ACHIEVEMENTS.md](ACHIEVEMENTS.md); the narrative-event inventory remains in [FTL.md](FTL.md).

## Coverage and sources

All **51 named achievements** in FTL: Advanced Edition: 21 general achievements and three for each of ten cruiser families.
The count and names match the [official Steam catalogue](https://steamcommunity.com/stats/212680/achievements/).
Conditions below are paraphrased.

The primary source was the installed game's `ftl.dat`, specifically `data/achievements.xml` and the English `data/text_achievements.xml`.
Parsing the XML yielded 51 active definitions; two additional definitions are commented out and excluded.
The definitions supply cruiser restrictions that some Steam descriptions omit, including those for the Lanius achievements.
This is an audit of published conditions and metadata, not a verification of the executable's trigger logic.

The wiki's [general achievement list](https://ftl.fandom.com/wiki/Achievements) and [ship achievement list](https://ftl.fandom.com/wiki/Ship_Achievements) supplied grouping and unlock context.
The latter also describes **per-layout victory records and ship-unlock quest records**, which are additional hangar marks, outside the 51-name catalogue below.

## General achievements

### General Progression — 7

| Achievement | Earning condition | Scope |
|---|---|---|
| Just Getting Started | Reach sector 5. | Run |
| Federation Base in Range | Reach sector 8. | Run |
| Federation Victory (Easy) | Defeat the final boss on Easy. | Run |
| Federation Victory (Normal) | Defeat the final boss on Normal. | Run |
| Your Own Fleet | Obtain every cruiser's Type A layout. | Lifetime |
| Rule Ten: Greed is Eternal | Accumulate 10,000 scrap earned over multiple runs. | Lifetime |
| Warlord | Accumulate 1,000 defeated ships over multiple runs. | Lifetime |

### Going the Distance — 7

| Achievement | Earning condition | Scope |
|---|---|---|
| I don't need no stinkin' upgrades! | Reach sector 5 without upgrading systems or the reactor. | Run |
| Coming in for my Pacifism run! | Reach sector 5 without firing weapons, deploying offensive drones, or teleporting. | Run |
| On a Wing and a Prayer | Reach sector 5 without purchasing store repairs. | Run |
| Ballistophobia | Reach sector 8 without employing missiles or bombs. | Run |
| Technophobia | Reach sector 8 without employing drones. | Run |
| Living off the Land | Reach sector 8 without store purchases other than repairs. | Run |
| No Redshirts Here | Reach sector 8 with no crew losses. | Run |

### Skill and Equipment Feats — 7

| Achievement | Earning condition | Scope |
|---|---|---|
| Some people just like to watch ships burn | Ignite every tile of an enemy ship simultaneously. | Encounter |
| Astronomically Low Odds | With engines fully upgraded and powered, suffer five consecutive failed dodges. | Encounter |
| They never saw it coming | With a Weapon Pre-Igniter, destroy a ship in the opening volley before it fires. | Encounter |
| BOARDING OBJECTIVE SUCCESSFUL | One boarding drone kills four crew on the same enemy ship. | Encounter |
| Trustworthy Auto-Pilot | Defeat an enemy while your entire crew is aboard its ship. | Encounter |
| Slice and Dice | Beam-hit every enemy room within a window shorter than five seconds. | Encounter |
| Victory through Asphyxiation | Reduce a hostile, crewed ship's overall oxygen below 5%. | Encounter |

## Cruiser achievements — 30

Every condition in this table requires the named cruiser family.
Eligible achievements can be earned across its layouts and across different runs; earning any two of the three unlocks its Type B layout.
The third remains optional for that unlock.
This relationship is documented by [Subset's achievement announcement](https://new.subsetgames.com/forum/viewtopic.php?t=716) and the [ship achievement reference](https://ftl.fandom.com/wiki/Ship_Achievements).

| Cruiser | Achievement | Earning condition | Scope |
|---|---|---|---|
| Kestrel | The United Federation | Employ six different crew species simultaneously. | Run state |
| Kestrel | Full Arsenal | Install eleven systems at once. | Run state |
| Kestrel | Tough Little Ship | Recover from one remaining hull point to full hull. | Run |
| Zoltan | Shields Holding | Destroy an enemy before it penetrates the Zoltan Shield. | Encounter |
| Zoltan | Givin' her all she's got, Captain! | Supply 29 power to systems simultaneously. | Run state |
| Zoltan | Manpower | Reach sector 5 without reactor upgrades. | Run |
| Stealth | Bird of Prey | Destroy an initially undamaged enemy within one cloak. | Encounter |
| Stealth | Phase Shift | Evade nine damage during one cloak. | Encounter |
| Stealth | Tactical Approach | Reach sector 8 without visiting an environmental-hazard beacon. | Run |
| Engi | Robotic Warfare | Operate three drones simultaneously. | Encounter |
| Engi | I hardly lifted a finger | Destroy an enemy through drones alone, without weapon fire. | Encounter |
| Engi | The guns... They've stopped | Keep four enemy systems or subsystems ion-disabled simultaneously. | Encounter |
| Rock | Is it warm in here? | Your crew kills a burning enemy aboard the enemy ship. | Encounter |
| Rock | Defense Drones Don't Do D'anything! | Defeat an enemy with an active defense drone using missiles alone. | Encounter |
| Rock | Ancestry | Enter the Hidden Crystal Worlds. | Run |
| Mantis | Take no prisoners! | Defeat twenty ships by eliminating their crews by the end of sector 6. | Run |
| Mantis | Avast, ye scurvy dogs! | Kill five enemy crew in one fight without hull damage or crew losses. | Encounter |
| Mantis | Battle Royale | Your sole surviving crew member kills the enemy's last crew member aboard its ship. | Encounter |
| Slug | We're in Position! | See every enemy room while your sensors are inoperative. | Encounter |
| Slug | Home Sweet Home | Visit thirty nebula beacons before reaching sector 8. | Run |
| Slug | Disintegration Ray | Kill three enemy crew with one Anti-Bio Beam shot. | Encounter |
| Federation | Master of Patience | Win solely through the Artillery Beam while suffering no hull damage. | Encounter |
| Federation | Diplomatic Immunity | Use four crew-dependent blue event options by the end of sector 5. | Run |
| Federation | Artillery Mastery | Reach sector 5 without improving Weapons Control. | Run |
| Crystal | Sweet Revenge | Deliver a ship's killing blow with a Crystal Vengeance shard. | Encounter |
| Crystal | No Escape | Confine four enemy crew in one room using crystal lockdown or a Lockdown Bomb. | Encounter |
| Crystal | Clash of the Titans | Destroy ten Rock ships during one run; pirate variants qualify. | Run |
| Lanius | Advanced Mastery | Activate Hacking, Mind Control, and Backup Battery simultaneously. | Encounter |
| Lanius | Scrap Hoarder | Hold at least 600 unspent scrap. | Run state |
| Lanius | Loss of Cabin Pressure | Reach sector 8 while keeping overall oxygen at or below 20% after the first jump. | Run |

The individual references for [Take no prisoners!](https://ftl.fandom.com/wiki/Take_no_prisoners%21) and [Diplomatic Immunity](https://ftl.fandom.com/wiki/Diplomatic_Immunity) clarify that their sector deadlines include the named sector.
The game's shorter descriptions use the potentially ambiguous word "by".

## How the achievements relate to progression

The 30 cruiser achievements have a direct mechanical role through their two-of-three Type B unlocks.
The general achievements are records; for example, Your Own Fleet recognizes ships already unlocked.
The game's separate quest and victory routes to ships should not be described as rewards for every general achievement.
See the [ship achievement reference](https://ftl.fandom.com/wiki/Ship_Achievements).

The unlocked layouts change starting equipment, crew, and available strategies.
For example, the [Mantis Type B](https://ftl.fandom.com/wiki/The_Mantis_Cruiser#Layout_B) starts without weapons and has a four-person teleporter.
This is access to a different configuration, not a permanent stat increase applied to every future ship.
It does not imply that all layouts are equally powerful.

The installed definitions mark 46 of the 51 achievements with `multiDifficulty`.
The two named victory achievements and the three lifetime progression achievements lack that field.
Difficulty can therefore enrich an existing mark without making another named achievement for every level.

## Design observations

These are interpretations of the catalogue, not claims about player enjoyment or developer intent.

- **Specific identity supplies specific challenges.**
  Cloaking, boarding, drones, power-producing crew, and oxygen independence give different ships different things to demonstrate.
- **Most recognition does not require winning the whole game.**
  Only the two general victory conditions explicitly require defeating the final boss.
  Many run restrictions stop at sector 5 or sector 8, and 23 catalogue entries concern a single encounter.
- **A partial set can unlock content.**
  Two of three allows a player to avoid one awkward or chance-dependent task while still obtaining another layout.
- **Narrative interaction has a narrow presence.**
  Diplomatic Immunity counts access to crew-conditioned options; Ancestry recognizes discovery through an event chain.
  Neither specifically asks the player to live with a lasting narrative sacrifice.
- **Some conditions can distort play.**
  Hoarding scrap delays useful spending; waiting for failed dodges or a retaliation kill can encourage stalling; reaching one hull can be deliberately engineered.
  These are incentive risks inferred from the predicates, not evidence that every player pursues them that way.
