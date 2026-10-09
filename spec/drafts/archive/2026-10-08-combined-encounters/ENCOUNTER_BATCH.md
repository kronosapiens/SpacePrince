# Narrative encounter writing batch

**Status: Archived experiment, superseded 2026-10-08.**
This combined narrative and economics exercise is retained as a historical record.
Its proposals were not adopted; fresh writing follows the separate narrative review process.
See the [working draft index](../../README.md) for active work.

Draft encounters for reviewing how the researched references combine into playable choices.
The batch contains twelve situations, twenty-four sign versions, twenty-four selected occupant approaches, and the seven applicable joy approaches.
Prices, eligibility details, and replacement priorities below are proposals for this exercise, not changes to the runtime or the authoring spec.
The [review](ENCOUNTER_BATCH_REVIEW.md) records findings and remaining decisions.

## Encounter index

| House | Situation | Signs | Selected occupants | Joy |
|---|---|---|---|---|
| [I Self](#i-self) | Before the portrait | Aries, Aquarius | Mars, Saturn | Mercury |
| [II Livelihood](#ii-livelihood) | The provisioner's surplus | Taurus, Sagittarius | Venus, Jupiter | — |
| [III Communication](#iii-communication) | The returned letter | Cancer, Gemini | Mercury, Moon | Moon |
| [IV Home](#iv-home) | The room kept ready | Scorpio, Taurus | Moon, Saturn | — |
| [V Creativity](#v-creativity) | The last verse | Leo, Libra | Sun, Venus | Venus |
| [VI Labor](#vi-labor) | The linen press | Virgo, Pisces | Mercury, Mars | Mars |
| [VII Relationships](#vii-relationships) | The rehearsal room | Capricorn, Cancer | Venus, Mars | — |
| [VIII Transformation](#viii-transformation) | The last collection | Libra, Aries | Saturn, Moon | — |
| [IX Pilgrimage](#ix-pilgrimage) | The school above the pass | Sagittarius, Gemini | Jupiter, Mercury | Sun |
| [X Achievement](#x-achievement) | The public demonstration | Capricorn, Cancer | Mars, Sun | — |
| [XI Friendship](#xi-friendship) | The place in the circle | Aquarius, Libra | Jupiter, Venus | Jupiter |
| [XII The Hidden](#xii-the-hidden) | The room beyond visiting hours | Pisces, Virgo | Saturn, Moon | Saturn |

V, VI, and X were drafted and independently reviewed before expansion.
The [displayed menu examples](ENCOUNTER_BATCH_REVIEW.md#displayed-menu-examples) provide a shorter route through the assembled results.

## How to read the encounters

Each sign version supplies a prompt, action labels, and immediate consequences.
Its terms table supplies the corresponding mechanical asides verbatim; these stay separate from the fictional copy.
A and B identify the two ordinary choices for comparison, and Exit is always free.
The additional rows are replacements, never extra simultaneous choices.
Each scene states which replacement occupies each position when several qualify.
The resulting menu contains at most A, B, and Exit.

For this exercise, an occupant approach requires the named planet to occupy the house and be unlocked.
Combustion alone does not remove an approach whose effects can resolve on another planet.
This unlock convention needs review during implementation; the current resolver has no occupant predicate.
All occupants share their whole-sign house's sign.
Only the listed approaches are authored for this scene; another occupant leaves its ordinary offers intact.

Joy uses the current condition rule: the assigned planet is unlocked, lit, and below 96 affliction, wherever it resides.
Its dignity does not increase the joy offer in this batch.
Domicile and exaltation can improve the explicitly priced occupant offer; neutral, detriment, and fall still receive the stated special approach.
No advantages automatically stack.
Selection precedes affordability: an eligible but unaffordable offer stays visible and disabled, as do offers without valid targets.
The scoped Mars and Saturn joy replacements receive particular scrutiny because they can remove a useful ordinary target.

“Choose a lit planet” means an unlocked, non-combusted planet.
Affliction costs must fit its remaining margin before any benefit applies, including before a Resolve increase.
Paid recovery requires actual recovery and clamps to carried affliction; its displayed amount remains the authored maximum.
Revival requires an unlocked combusted planet and restores it at half its own Resolve ceiling.
Light purchases require full payment; outcomes resolve together.
An exit has no mechanical effects and creates no later obligation.

The [economy table](../../../../client/src/data/economy.ts) supplies the ordinary purchase baselines: 48 Light for 24 recovery, 180 for revival, 240 for +12 Resolve or +6 displayed Fortune, and 360 for +12 Testify or Afflict.
Stat gains last for the rest of the run and still require resolver support.
The growth examples assume targets below the provisional Resolve maximum and displayed Fortune limit; treatment at those limits remains open in the [review](ENCOUNTER_BATCH_REVIEW.md#remaining-implementation-decisions).
Wages, mixed payments, and special terms below are authored proposals; the recovery price does not establish a reversible price for taking affliction.
The ordinary terms and targets stay identical between a scene's two sign versions.
This exercises writing variation without claiming a completed economic cycle for all house–sign combinations.

Opening fragments are selected verbatim from the existing [planetary quotation collection](../../../../planets), with its attribution retained.
They use the fixed game ruler, separately from the natal sign ruler, occupants, and joy.
Scene copy and economic adaptations are original; their source links identify the references informing them, not historical authority for their prices.
The chart examples specify relevant placements only and obey whole-sign relationships; they are illustrative arrangements, not sampled astronomical birth charts.

## I Self

### Before the portrait

**Composition.**
[I](../../../concept/HOUSE_MATRIX.md#i--self) is angular and contains the Ascendant: the Prince can establish his own presence before accepting the portraitist's arrangement.
Mars supplies the opening voice; Mercury supplies the joy.
[Mars I](../../../concept/HOUSE_PLANET_MATRIX.md#mars-i--self) answers by acting; [Saturn I](../../../concept/HOUSE_PLANET_MATRIX.md#saturn-i--self) negotiates possession of his bearing.
Aries begins with a bodily attempt; Aquarius questions the prescribed pose and seating convention, informed by their [placement references](../../../concept/PLANET_MATRIX.md).
The Prince can enjoy being looked at or dislike being arranged without either feeling determining the efficient purchase.

**Opening — Mars:** “The art of life is more like the wrestler's art than the dancer's, in respect of this, that it should stand ready and firm to meet onsets which are sudden and unexpected.”
Marcus Aurelius, *Meditations* VII.61, George Long translation, 1862, from [mars.yaml](../../../../planets/mars.yaml).

| Choice | Aside in Aries | Aside in Aquarius |
|---|---|---|
| A | Gain 24 Light; choose a lit planet to take 12 affliction. | Gain 24 Light; choose a lit planet to take 12 affliction. |
| B | Pay 240 Light; give a chosen lit planet +12 Resolve for the rest of the run. | Pay 240 Light; give a chosen lit planet +12 Resolve for the rest of the run. |
| Mars replaces A | Gain 48 Light; choose a lit planet to take 12 affliction. | Gain 36 Light; choose a lit planet to take 12 affliction. |
| Saturn replaces B | Pay 228 Light; give a chosen lit planet +12 Resolve for the rest of the run. | Pay 216 Light; give a chosen lit planet +12 Resolve for the rest of the run. |
| Joy replaces B | Pay 228 Light; give a chosen lit planet +12 Resolve for the rest of the run. | Pay 228 Light; give a chosen lit planet +12 Resolve for the rest of the run. |
| Exit | No cost or effect. | No cost or effect. |

Mars is domicile in Aries and neutral in Aquarius; Saturn is fall in Aries and domicile in Aquarius.
Mars takes A when eligible; B prefers Saturn, then joy, then ordinary B.
Saturn's terms equal or improve upon joy and preserve the ordinary target set.
Resolve gains need implementation and increase capacity, without removing existing affliction.

**Aries — Aries rising.**
A portraitist will pay you to hold the stance marked on her floor, or sell you a lesson in standing without locking your breath.
She reaches for your shoulder before you have put down your bag.

| Choice | Action | Consequence |
|---|---|---|
| A | Hold the marked stance. | Your thigh trembles through the last strokes before she releases you and pays. |
| B | Buy the breathing lesson. | You practice rising and settling until your breath stays with the movement. |
| Mars | Show her your own stance first. | She pays extra to sketch the abrupt turn you chose, which you hold until your leg begins to shake. |
| Saturn | Ask to begin before you feel ready. | She agrees a shorter, cheaper lesson, and you find a stance you can keep without pretending it came easily. |
| Joy | Ask what the pose is making you hold. | Your question lets her begin the lesson at its useful part, for a smaller fee. |
| Exit | Put your shoulder beyond her reach. | She lowers her hand, and you leave with your bag still on your arm. |

**Aquarius — Aquarius rising.**
A portraitist has built a chair to keep every sitter at the same angle, and pays for a study or charges for a lesson in balanced posture.
Your knees fit nowhere between its carefully placed bars.

| Choice | Action | Consequence |
|---|---|---|
| A | Fit yourself into the chair. | You hold the awkward angle until she finishes the study and hands over the fee. |
| B | Buy the posture lesson. | Away from the chair, you practice finding your balance without its bars. |
| Mars | Turn the chair around. | She pays more for the unfamiliar arrangement, and you hold it despite the strain beneath your ribs. |
| Saturn | Ask to adjust the lesson's frame together. | You and the portraitist reset its supports around the body actually present, at the lower agreed price. |
| Joy | Ask whose body the chair remembers. | She laughs, drops the opening exercise and part of its price, and teaches you to balance without the frame. |
| Exit | Leave the chair empty. | Its bars keep their exact angle after you have gone. |

**Menus to inspect.**
An empty I without Mercury joy shows A, B, Exit.
Aries I with unlocked Mars and Saturn shows Mars, Saturn, Exit despite Saturn's fall.
Aquarius I with Saturn unlocked and Mercury joyful elsewhere shows A, Saturn, Exit at 216 Light for growth, not a stacked 204.
If only the Moon is unlocked, neither selected occupant qualifies; a zero-Light Prince can earn using the Moon when it has 12 margin or leave.

## II Livelihood

### The provisioner's surplus

**Composition.**
[II](../../../concept/HOUSE_MATRIX.md#ii--livelihood) is succedent and averse: provisions exist in abundance, but access depends on the seller's terms.
Venus supplies the opening voice; there is no joy.
[Venus II](../../../concept/HOUSE_PLANET_MATRIX.md#venus-ii--livelihood) spends on wanted enjoyment; [Jupiter II](../../../concept/HOUSE_PLANET_MATRIX.md#jupiter-ii--livelihood) wants enough to keep more possibilities open.
Taurus values the goods through touch and taste; Sagittarius sees several possible journeys in the same provisions, following their [placement references](../../../concept/PLANET_MATRIX.md).
Physical carrying, rather than wanting abundance, incurs the affliction cost.

**Opening — Venus:** “O for a life of Sensations rather than of Thoughts!”
John Keats, letter to Benjamin Bailey, 22 November 1817, from [venus.yaml](../../../../planets/venus.yaml).

| Choice | Aside in Taurus | Aside in Sagittarius |
|---|---|---|
| A | Gain 48 Light; choose a lit planet to take 36 affliction. | Gain 48 Light; choose a lit planet to take 36 affliction. |
| B | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| Jupiter replaces A | Gain 60 Light; choose a lit planet to take 36 affliction. | Gain 72 Light; choose a lit planet to take 36 affliction. |
| Venus replaces B | Pay 24 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Exit | No cost or effect. | No cost or effect. |

Venus is domicile in Taurus and neutral in Sagittarius; Jupiter is neutral in Taurus and domicile in Sagittarius.
Jupiter takes A and Venus takes B when eligible.
The larger wage buys no stored supplies or later route access.

**Taurus — Aries rising.**
A provisioner has bought too many pears and offers wages for carrying the heavy crates down to his cellar.
He also sells a shaded meal of ripe fruit, bread, and thick cream beside the emptying cart.

| Choice | Action | Consequence |
|---|---|---|
| A | Carry the crates below. | The last crate scrapes your wrist before the provisioner counts out your wage. |
| B | Buy the shaded meal. | You eat slowly with your feet raised on an empty box. |
| Jupiter | Name a wage worth filling your purse. | You carry the same crates for the larger sum and enjoy its weight when the work is over. |
| Venus | Ask for the fruit that must be eaten now. | He makes a cheaper plate of the ripest pears, and you take your time with every slice. |
| Exit | Pass the cart. | The smell of ripe fruit follows you to the corner. |

**Sagittarius — Scorpio rising.**
A provisioner is breaking up supplies bought for an expedition that never left, and pays to have its heavy crates moved indoors.
At his table, a map holds down the cloth beneath a meal of food from three distant ports.

| Choice | Action | Consequence |
|---|---|---|
| A | Move the abandoned expedition's crates. | You finish with sore arms and a wage that no longer belongs to someone else's departure. |
| B | Buy a place at the map. | You rest over unfamiliar dishes while tracing journeys you do not have to choose today. |
| Jupiter | Bargain for enough to leave several roads open. | The provisioner agrees the larger wage, and you move the heavy crates while imagining how far it might take you. |
| Venus | Ask to taste what you cannot name. | He serves a cheaper plate of samples, and you linger over the ones whose flavors surprise you. |
| Exit | Leave the map on the table. | You walk on without deciding whether the canceled journey was fortunate. |

**Menus to inspect.**
Without selected occupants: A, B, Exit, including in an empty house.
With Venus and Jupiter together in Taurus II unlocked: Jupiter, Venus, Exit at the Taurus prices.
In Sagittarius II, only Jupiter's dignity improves its wage; Venus's different meal still provides its neutral special price.
With no afflicted lit target, recovery is disabled even if affordable; earning and exit retain their own eligibility.

## III Communication

### The returned letter

**Composition.**
[III](../../../concept/HOUSE_MATRIX.md#iii--communication) is cadent and sextile the Ascendant: nearby news and assistance pass through other people's ordinary routes.
Mercury supplies the opening voice; Moon supplies the joy.
[Mercury III](../../../concept/HOUSE_PLANET_MATRIX.md#mercury-iii--communication) follows an unexplained detail; [Moon III](../../../concept/HOUSE_PLANET_MATRIX.md#moon-iii--communication) uses an ordinary exchange to invite connection.
Cancer attends to remembered phrasing; Gemini multiplies possible accounts, using their [placement references](../../../concept/PLANET_MATRIX.md).
Curiosity need not repair a relationship, and accepting a refund need not end in a lesson.

**Opening — Mercury:** “You cannot step twice into the same rivers; for fresh waters are ever flowing in upon you.”
Heraclitus, fragments 41 and 42 in Bywater's numbering, John Burnet translation, 1908, from [mercury.yaml](../../../../planets/mercury.yaml).

| Choice | Aside in Cancer | Aside in Gemini |
|---|---|---|
| A | Gain 12 Light. | Gain 12 Light. |
| B | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| Mercury replaces A | Gain 24 Light. | Gain 36 Light. |
| Moon replaces B | Pay 24 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Joy replaces B | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Exit | No cost or effect. | No cost or effect. |

Mercury is neutral in Cancer and domicile in Gemini; Moon is domicile in Cancer and neutral in Gemini.
Mercury takes A; B prefers Moon, then joy, then ordinary B, with no combined discount.
The ordinary gift is available without having to demonstrate deserving behavior.

**Cancer — Taurus rising.**
Your brother's letter has returned to the local posting house, and the clerk offers back the unused delivery fee.
Next door, the keeper rents quiet couches with tea while callers wait for news.

| Choice | Action | Consequence |
|---|---|---|
| A | Take the returned fee. | The clerk counts it out while your brother's familiar opening remains unread. |
| B | Buy a quiet hour. | You lie beside the tea tray with the letter closed on your chest. |
| Mercury | Ask why the second address was crossed out. | Your question uncovers another unused delivery charge, which the clerk adds to the refund. |
| Moon | Read the small mishap aloud. | The keeper recognizes the worry beneath your brother's joke and offers you a cheaper couch without asking for the rest. |
| Joy | Accept the keeper's invitation to stay. | She lowers the charge and leaves you beside the tea without requiring conversation. |
| Exit | Leave the fee at the desk. | You fold the letter along the crease your brother made. |

**Gemini — Aries rising.**
Three neighbors have supplied three addresses for the same missing cousin, and your letter has come back with the unused postage.
The posting-house keeper offers paid couches beside a window where everyone stops to tell a different version.

| Choice | Action | Consequence |
|---|---|---|
| A | Collect the unused postage. | You pocket the refund without choosing which neighbor to believe. |
| B | Rent the window couch. | You stretch out and let the passing accounts entertain you without following anyone. |
| Mercury | Compare the three delivery marks. | The clerk sees that two routes were charged twice and returns the larger sum while you are still comparing stories. |
| Moon | Tell the keeper the version you wish were true. | She offers the couch for less and listens while your explanation wanders toward what worried you. |
| Joy | Take the place she has kept free. | The keeper names a smaller price, and ordinary street talk carries the hour along. |
| Exit | Keep the letter and go. | You leave with three addresses and no obligation to settle them today. |

**Menus to inspect.**
An empty III without Moon joy shows A, B, Exit; A remains valid even with no injured planets.
With Moon in Cancer III unlocked and joyful: A, Moon, Exit at 24 Light, not a stacked 12.
With Mercury and Moon in Gemini III unlocked: Mercury, Moon, Exit.
If Moon is elsewhere and combusted, joy disappears; Mercury's refund remains if its own placement qualifies.

## IV Home

### The room kept ready

**Composition.**
[IV](../../../concept/HOUSE_MATRIX.md#iv--home) is angular and square the Ascendant: the setting is private, but the Prince can choose the domestic arrangement directly.
Moon supplies the opening voice; there is no joy.
[Moon IV](../../../concept/HOUSE_PLANET_MATRIX.md#moon-iv--home) seeks a room answering a present need; [Saturn IV](../../../concept/HOUSE_PLANET_MATRIX.md#saturn-iv--home) preserves part of an old household without accepting every habit.
Scorpio gives closeness a protected boundary; Taurus attends to familiar material comfort, following their [placement references](../../../concept/PLANET_MATRIX.md).
Revival concerns a combusted planet represented by a lamp, not reversing the death of a person in the fiction.

**Opening — Moon:** “For a long time I used to go to bed early.”
Marcel Proust, *Swann's Way*, Overture, C. K. Scott Moncrieff translation, 1922, from [moon.yaml](../../../../planets/moon.yaml).

| Choice | Aside in Scorpio | Aside in Taurus |
|---|---|---|
| A | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| B | Pay 180 Light; revive a chosen unlocked combusted planet at half its Resolve ceiling. | Pay 180 Light; revive a chosen unlocked combusted planet at half its Resolve ceiling. |
| Moon replaces A | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 24 Light; remove up to 24 affliction from a chosen lit planet. |
| Saturn replaces B | Pay 168 Light; revive a chosen unlocked combusted planet at half its Resolve ceiling. | Pay 168 Light; revive a chosen unlocked combusted planet at half its Resolve ceiling. |
| Exit | No cost or effect. | No cost or effect. |

Moon is fall in Scorpio and exalted in Taurus; Saturn is neutral in both.
Moon takes A; Saturn takes B only when at least one unlocked planet is combusted.
B is absent otherwise, leaving two visible choices rather than manufacturing a third.
Both outcomes already exist, while the new occupant selection and prices remain proposals.

**Scorpio — Leo rising.**
The household that once sheltered you now takes paying lodgers, but its keeper still has the key to your old room.
She offers rest behind its thick door and also performs a hearth rite for rekindling extinguished lamps.

| Choice | Action | Consequence |
|---|---|---|
| A | Rent the old room. | You lie down while the house moves around the other side of the door. |
| B | Pay for the hearth rite. | The keeper warms the dark lamp until its small flame holds without her hands around it. |
| Moon | Ask for the room without questions. | She lowers the charge and leaves you its key without asking what brought you back. |
| Saturn | Keep the rite behind the closed door. | She accepts the smaller fee for a private rite, and the lamp catches without summoning the household. |
| Exit | Return the key. | She places it on its old hook without asking you to call that a homecoming. |

**Taurus — Aquarius rising.**
Your old room smells of the same wax and clean linen, though the household now charges travelers for a bed.
Beside its familiar hearth, the keeper also offers to kindle an extinguished lamp.

| Choice | Action | Consequence |
|---|---|---|
| A | Pay for the familiar bed. | You settle into the worn hollow of the mattress and let the household's sounds continue without you. |
| B | Buy the hearth rite. | The keeper tends the dark lamp until a steady, modest flame returns. |
| Moon | Ask for the blanket you remember. | She brings the old blanket at a lower room charge, and you stop testing whether the mattress has changed. |
| Saturn | Use the hearth's saved materials. | The keeper reduces the fee, and the lamp burns again among the household's carefully kept things. |
| Exit | Leave the bed made. | You smooth the cover once and close the door from outside. |

**Menus to inspect.**
Without combustion: A, Exit, or Moon, Exit if the occupant qualifies.
With an unlocked combusted Sun, an unlocked lit Moon in Taurus IV, and Saturn elsewhere: Moon, B, Exit; the revived target can be the Sun.
With Saturn also in Taurus IV unlocked: Moon, Saturn, Exit, and the revival costs 168 regardless of Saturn's own affliction.
With zero Light, paid choices remain disabled and Exit resolves freely; the prompt does not force a payment for belonging.

## V Creativity

### The last verse

**Composition.**
[V](../../../concept/HOUSE_MATRIX.md#v--creativity) is succedent and trine the Ascendant: a pleasure already in progress invites participation, supported by other people.
Sun supplies the opening voice; Venus supplies the joy.
The selected [Sun V](../../../concept/HOUSE_PLANET_MATRIX.md#sun-v--creativity) and [Venus V](../../../concept/HOUSE_PLANET_MATRIX.md#venus-v--creativity) wants concern making something his and following delight.
Leo makes the performance an expansive entrance; Libra makes it a responsive duet, using their [sign and placement references](../../../concept/PLANET_MATRIX.md).
The Prince may want applause or a particular person's attention; the player weighs earning against recovery.

**Opening — Sun:** “Do I contradict myself? / Very well then I contradict myself, / (I am large, I contain multitudes.)”
Walt Whitman, *Song of Myself* §51, from [sun.yaml](../../../../planets/sun.yaml); slashes indicate the stored line breaks.

| Choice | Aside in Leo | Aside in Libra |
|---|---|---|
| A | Gain 36 Light; choose a lit planet to take 24 affliction. | Gain 36 Light; choose a lit planet to take 24 affliction. |
| B | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| Sun replaces A | Gain 60 Light; choose a lit planet to take 24 affliction. | Gain 48 Light; choose a lit planet to take 24 affliction. |
| Venus replaces B | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 24 Light; remove up to 24 affliction from a chosen lit planet. |
| Joy replaces B | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Exit | No cost or effect. | No cost or effect. |

Sun is domicile in Leo and fall in Libra; Venus is neutral in Leo and domicile in Libra.
For A, Sun takes precedence over the ordinary offer.
For B, Venus takes precedence over joy, which takes precedence over the ordinary offer: the occupant's terms are equal or better in both versions.
These offers retain their ordinary targets and do not combine discounts.

**Leo — Aries rising.**
A singer has saved the last verse for anyone willing to outdo her ridiculous sea monster, and the listeners have put a purse beside the stage.
Behind them, an attendant is selling cushions and cool drinks to people content to watch.

| Choice | Action | Consequence |
|---|---|---|
| A | Sing the monster's return. | You hold its impossible final note until your ribs ache and the purse lands at your feet. |
| B | Buy a place among the cushions. | You stretch out with a cold cup while someone else's monster brings down the house. |
| Sun | Give it a voice nobody has heard. | Your monster sings in your own absurd falsetto, and the listeners add to the purse while you catch your breath. |
| Venus | Ask for the cushion beside the singer. | The attendant lowers the price, and the singer sits close enough to hear your private imitation of her monster. |
| Joy | Take the place the singer has saved. | Her invitation settles the attendant's price, and you let the next verse pass without getting up. |
| Exit | Leave before the final verse. | The monster finds another voice as you step into the street. |

**Libra — Gemini rising.**
Two singers are trading extravagant complaints about the same imaginary lover, with a purse for whoever supplies the ending.
An attendant rents soft seats along the wall, where the woman playing their lover is already laughing into her cup.

| Choice | Action | Consequence |
|---|---|---|
| A | Answer both singers. | You keep switching voices until the ending earns the purse and your throat gives out. |
| B | Buy the empty seat. | You settle against the cushions and enjoy an argument nobody needs to win. |
| Sun | Give the lover your own reply. | Your answer refuses both complaints, and the listeners pay to hear you sustain its extravagant last line. |
| Venus | Ask to sit beside the lover. | She makes room, the attendant accepts less, and you discover how much you enjoy making her laugh. |
| Joy | Accept the singers' seat. | The singers arrange a cheaper place for you and carry on their quarrel across the room. |
| Exit | Let someone else finish it. | A listener takes your place, already arguing with the rhyme. |

**Menus to inspect.**
With neither selected occupant and Venus unavailable: A, B, Exit.
With Sun in Leo V unlocked and Venus joyful elsewhere: Sun, Joy, Exit.
With Venus in Libra V unlocked and joyful: A, Venus, Exit; joy adds no further discount.
With both Sun and Venus in Libra V unlocked: Sun, Venus, Exit, including the fall Sun's substantive offer.
At zero Light, the recovery choice remains disabled while earning and exit remain usable if the chosen planet can carry the cost.

## VI Labor

### The linen press

**Composition.**
[VI](../../../concept/HOUSE_MATRIX.md#vi--labor) is cadent and averse: the laundry keeper sets the wage and owns the press, while the Prince can negotiate method or receive care.
Mercury supplies the opening voice; Mars supplies the joy.
[Mercury VI](../../../concept/HOUSE_PLANET_MATRIX.md#mercury-vi--labor) turns practical understanding into a claim on pay; [Mars VI](../../../concept/HOUSE_PLANET_MATRIX.md#mars-vi--labor) wants command over how the work is borne.
Virgo emphasizes diagnosis and a measured routine; Pisces follows the workers' changing rhythm, using their [placement references](../../../concept/PLANET_MATRIX.md).
Resentment can remain after the work is paid; recovery is not a reward for being agreeable.

**Opening — Mercury:** “The way up and the way down is one and the same.”
Heraclitus, fragment 69 in Bywater's numbering, John Burnet's 1908 translation, from [mercury.yaml](../../../../planets/mercury.yaml).

| Choice | Aside in Virgo | Aside in Pisces |
|---|---|---|
| A | Gain 36 Light; choose a lit planet to take 36 affliction. | Gain 36 Light; choose a lit planet to take 36 affliction. |
| B | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| Mercury replaces A | Gain 60 Light; choose a lit planet to take 36 affliction. | Gain 48 Light; choose a lit planet to take 36 affliction. |
| Mars replaces B | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Joy replaces A | Gain 36 Light; Mars takes 24 affliction. | Gain 36 Light; Mars takes 24 affliction. |
| Exit | No cost or effect. | No cost or effect. |

Mercury is domicile in Virgo and detriment in Pisces under the client's single-label precedence; those signs also have its traditional exaltation and fall respectively.
Mars is neutral in both versions, so its terms do not differ.
For A, Mercury takes precedence over joy, which takes precedence over the ordinary offer.
For B, Mars takes precedence over the ordinary offer.
This tentative priority favors freely chosen targets but suppresses the cheaper Mars burden when Mercury is also eligible; the review compares the lost alternative.
Joy uses the existing joy target and requires Mars to have the full 24 margin.

**Virgo — Aries rising.**
The laundry keeper pays by the stack, but a crooked guide makes every sheet catch under the press.
Beside the counting board, her brother offers hot water and a worked salve for aching hands.

| Choice | Action | Consequence |
|---|---|---|
| A | Finish a stack at the press. | You wrench the caught sheets free until the counted stack earns its wage. |
| B | Pay for the hand treatment. | Warm water loosens your fingers while the next stack goes to someone else. |
| Mercury | Price the fault before taking the stack. | You name the crooked guide, bargain for extra pay, and finish the stubborn stack without pretending the press is sound. |
| Mars | Set the treatment's pace yourself. | You specify the pressure and pauses, and the shorter treatment costs less without leaving your hands clenched. |
| Joy | Brace the press with the spare beam. | The beam carries part of each heave while you finish the stack at the same wage. |
| Exit | Leave the stack untouched. | The keeper moves her chalk to the next name without raising your wage. |

**Pisces — Libra rising.**
Wet linen arrives faster than the press can empty, and the workers have begun timing their pulls to a song that keeps changing.
The keeper offers a stack's wage or a paid place beside the warm rinsing basin.

| Choice | Action | Consequence |
|---|---|---|
| A | Join the pulling rhythm. | You follow the voices through the last heavy fold and collect the stack's wage with shaking arms. |
| B | Buy a turn at the warm basin. | You let your arms float while the song wanders beyond the doorway. |
| Mercury | Ask what keeping their time is worth. | You find the signal beneath the changing song, agree a higher wage, and keep the heavy stack moving with it. |
| Mars | Ask for quiet while you recover. | The keeper offers the cheaper side basin, where you work the stiffness out at your own pace. |
| Joy | Move to the braced handle. | You settle against its support and finish the same work with less of the weight passing through your arms. |
| Exit | Step out of the rhythm. | The workers close the gap, and their song reaches you for several streets. |

**Menus to inspect.**
With neither selected occupant and Mars unavailable: A, B, Exit.
With Mercury in Virgo VI unlocked and Mars joyful elsewhere: Mercury, B, Exit; the proposed priority omits Joy.
With Mars in Pisces VI unlocked, lit, below 96 affliction, and able to carry 24: Joy, Mars, Exit; the two routes have separate eligibility and do not compound their benefits.
If that Mars becomes combusted: A, Mars, Exit; its occupant approach may still recover another lit planet under this draft's unlock convention.
With Mars in Pisces at 60 affliction against its current 72 Resolve ceiling, it is joyful but has only 12 remaining margin: Joy is disabled despite an ordinary A target potentially remaining usable, exposing the replacement problem rather than silently adding a fallback.

## VII Relationships

### The rehearsal room

**Composition.**
[VII](../../../concept/HOUSE_MATRIX.md#vii--relationships) is angular and opposite the Ascendant: a particular counterpart has a force and preference the Prince must meet directly.
Venus supplies the opening voice; there is no joy.
[Venus VII](../../../concept/HOUSE_PLANET_MATRIX.md#venus-vii--relationships) values their chosen way of being together; [Mars VII](../../../concept/HOUSE_PLANET_MATRIX.md#mars-vii--relationships) enjoys a forceful ally or challenger.
Capricorn makes partnership deliberate and practiced; Cancer carries the remembered ways they protect or irritate each other, using their [placement references](../../../concept/PLANET_MATRIX.md).
The paid exercise develops forceful replies, while shared quiet can be worthwhile without solving the disagreement.

**Opening — Venus:** “With freedom, flowers, books, and the moon, who could not be perfectly happy?”
Oscar Wilde, *De Profundis*, from [venus.yaml](../../../../planets/venus.yaml).

| Choice | Aside in Capricorn | Aside in Cancer |
|---|---|---|
| A | Pay 360 Light; give a chosen lit planet +12 Afflict for the rest of the run. | Pay 360 Light; give a chosen lit planet +12 Afflict for the rest of the run. |
| B | Remove up to 12 affliction from a chosen lit planet, free. | Remove up to 12 affliction from a chosen lit planet, free. |
| Mars replaces A | Pay 336 Light; give a chosen lit planet +12 Afflict for the rest of the run. | Pay 348 Light; give a chosen lit planet +12 Afflict for the rest of the run. |
| Venus replaces B | Remove up to 24 affliction from a chosen lit planet, free. | Remove up to 24 affliction from a chosen lit planet, free. |
| Exit | No cost or effect. | No cost or effect. |

Mars is exalted in Capricorn and fall in Cancer; Venus is neutral in both.
Mars takes A and Venus takes B when eligible.
Venus supplies an extra 12 recovery at either dignity, not a sign discount.
The Afflict stat gain needs implementation and does not itself add carried affliction.

**Capricorn — Cancer rising.**
Your traveling companion has reserved a practice room where you can pay for a hard session of question and reply, sharing her hired tutor's time.
She has also kept the bench outside free, though you had expected her to want every minute together put to use.

| Choice | Action | Consequence |
|---|---|---|
| A | Pay to practice the difficult reply. | Your companion presses each weak answer until your reply can meet her without retreating. |
| B | Take the bench together. | She closes her notebook, and you sit without making the interval useful. |
| Mars | Ask her to bring her hardest objections. | She agrees to a shorter, cheaper session, and you relish having someone who makes your replies land harder. |
| Venus | Tell her you wanted this idle hour. | She settles closer on the bench, pleased that you asked for her company without another task. |
| Exit | Leave her the reserved room. | She takes in her notebook while you continue down the passage. |

**Cancer — Capricorn rising.**
Your companion has hired a tutor's room to rehearse the sort of quarrel that used to leave you speaking for each other, and offers to share its paid session.
Outside, she has brought the old blanket on which you once spent a whole afternoon avoiding the same argument.

| Choice | Action | Consequence |
|---|---|---|
| A | Pay to rehearse your answer. | You repeat your reply until her interruption no longer makes you lose it. |
| B | Sit on the blanket. | You let the familiar cloth warm your legs while the argument remains indoors. |
| Mars | Ask her to stand on your side this time. | She agrees to a cheaper rehearsal and helps you make the answer forceful without giving it in your place. |
| Venus | Tell her what you remember about the blanket. | She recalls a different part of the afternoon, and you rest together without choosing whose memory should prevail. |
| Exit | Leave the blanket folded. | She accepts your departure without giving it a name you have to answer. |

**Menus to inspect.**
An empty VII shows A, B, Exit, including free recovery at zero Light.
With Mars and Venus in Cancer VII unlocked: Mars, Venus, Exit; Mars's fall does not remove its approach.
If every lit planet is clean, free recovery has no mechanical benefit but creates no payment trap; Exit remains available.
The growth and recovery choices are alternatives, so their benefits cannot be added when comparing this house with another.

## VIII Transformation

### The last collection

**Composition.**
[VIII](../../../concept/HOUSE_MATRIX.md#viii--transformation) is succedent and averse: access to resources after a death depends on a settlement made by others.
Mars supplies the opening voice; there is no joy.
[Saturn VIII](../../../concept/HOUSE_PLANET_MATRIX.md#saturn-viii--transformation) distinguishes obligations he accepts from inherited claims; [Moon VIII](../../../concept/HOUSE_PLANET_MATRIX.md#moon-viii--transformation) seeks immediate support amid loss.
Libra asks who agrees to the settlement; Aries wants the unfinished act completed now, following their [placement references](../../../concept/PLANET_MATRIX.md).
The crate carrying, not grief or refusal, causes affliction.
Neither a better payment nor recovery makes the death beneficial.

**Opening — Mars:** “I came like lightning and like wind I go.”
Ferdowsi, *Shahnameh*, Kai Kaus §21, Arthur George and Edmond Warner translation, 1906, from [mars.yaml](../../../../planets/mars.yaml).

| Choice | Aside in Libra | Aside in Aries |
|---|---|---|
| A | Gain 72 Light; choose a lit planet to take 36 affliction. | Gain 72 Light; choose a lit planet to take 36 affliction. |
| B | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| Saturn replaces A | Gain 84 Light; choose a lit planet to take 24 affliction. | Gain 72 Light; choose a lit planet to take 24 affliction. |
| Moon replaces B | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Exit | No cost or effect. | No cost or effect. |

Saturn is exalted in Libra and fall in Aries; Moon is neutral in both.
Saturn takes A and Moon takes B when eligible.
Saturn's ordinary placement advantage reduces the carried burden; dignity adds 12 Light in Libra without reducing it again.
The collection and payment finish here; no later estate claim is tracked.

**Libra — Pisces rising.**
Your dead benefactor's executor will release your portion if you carry the listed crates to the waiting cart; a relative has quietly added another crate to the row.
An attendant offers paid rest in the emptied sitting room while the other claimants settle their shares.

| Choice | Action | Consequence |
|---|---|---|
| A | Carry the whole row and collect. | You finish the heavy extra crate before the executor releases your portion. |
| B | Pay for the sitting room. | You rest among the pale marks where the furniture stood while the voices beyond the door continue. |
| Saturn | Settle which crates belong to your portion. | The executor removes the added crate and corrects your payment after you carry only the agreed load. |
| Moon | Ask to sit with the other mourner. | The attendant accepts less for the shared room, where neither of you has to fill the silence. |
| Exit | Leave the portion uncollected. | You step past the cart while the relative keeps a hand on the extra crate. |

**Aries — Virgo rising.**
The executor is closing your dead benefactor's rooms and offers to pay out your portion once the crates reach the cart, including one nobody has assigned.
An attendant sells a quiet place in the bare sitting room while the corridor fills with people urging each other to finish.

| Choice | Action | Consequence |
|---|---|---|
| A | Carry the crates and end the waiting. | You haul the last unclaimed crate onto the cart and take the payment with your arms shaking. |
| B | Pay to sit behind the door. | You lower yourself into the remaining chair while the hurried footsteps pass. |
| Saturn | Name the load you will carry. | You leave the unassigned crate where it is, finish your smaller load, and take your portion without an apology. |
| Moon | Ask for a place right now. | The attendant opens a cheaper room at once, and you sit before finding anything to say about the loss. |
| Exit | Walk away from the cart. | The executor calls the next claimant, and you keep walking. |

**Menus to inspect.**
Without selected occupants: A, B, Exit; the larger payment has a visible physical cost.
With Saturn in Libra VIII unlocked: Saturn, B, Exit, with 24 rather than 36 chosen affliction and an 84-Light payment.
With Saturn and Moon in Aries VIII unlocked: Saturn, Moon, Exit; the fall Saturn still limits the load.
A lit target with only 24 margin can take Saturn's offer but not ordinary A; landing exactly at its ceiling combusts it after the full payment resolves.

## IX Pilgrimage

### The school above the pass

**Composition.**
[IX](../../../concept/HOUSE_MATRIX.md#ix--pilgrimage) is cadent and trine the Ascendant: the Prince depends on a distant school's forms of teaching, which nevertheless offer him room to learn and question.
Jupiter supplies the opening voice; Sun supplies the joy.
[Jupiter IX](../../../concept/HOUSE_PLANET_MATRIX.md#jupiter-ix--pilgrimage) considers an account he could live by; [Mercury IX](../../../concept/HOUSE_PLANET_MATRIX.md#mercury-ix--pilgrimage) wants to think within an unfamiliar system.
Sagittarius pursues its larger claim; Gemini compares its competing explanations, using their [placement references](../../../concept/PLANET_MATRIX.md).
Standing demonstration supplies a physical part-payment without making conviction a virtue that earns strength.

**Opening — Jupiter:** “The light which puts out our eyes is darkness to us. Only that day dawns to which we are awake. There is more day to dawn. The sun is but a morning star.”
Henry David Thoreau, *Walden*, Conclusion, from [jupiter.yaml](../../../../planets/jupiter.yaml).

| Choice | Aside in Sagittarius | Aside in Gemini |
|---|---|---|
| A | Pay 240 Light; give a chosen lit planet +12 Resolve for the rest of the run. | Pay 240 Light; give a chosen lit planet +12 Resolve for the rest of the run. |
| B | Pay 216 Light; a chosen lit planet takes 24 affliction and gains +12 Resolve for the rest of the run. | Pay 216 Light; a chosen lit planet takes 24 affliction and gains +12 Resolve for the rest of the run. |
| Mercury replaces A | Pay 228 Light; give a chosen lit planet +12 Resolve for the rest of the run. | Pay 216 Light; give a chosen lit planet +12 Resolve for the rest of the run. |
| Jupiter replaces B | Pay 204 Light; a chosen lit planet takes 12 affliction and gains +12 Resolve for the rest of the run. | Pay 216 Light; a chosen lit planet takes 12 affliction and gains +12 Resolve for the rest of the run. |
| Joy replaces A | Pay 228 Light; give a chosen lit planet +12 Resolve for the rest of the run. | Pay 228 Light; give a chosen lit planet +12 Resolve for the rest of the run. |
| Exit | No cost or effect. | No cost or effect. |

Jupiter is domicile in Sagittarius and detriment in Gemini; Mercury is detriment in Sagittarius and domicile in Gemini.
A prefers Mercury, then joy, then ordinary A; Jupiter takes B when eligible.
The same selected planet bears the affliction and gains Resolve in B, and the affliction must fit its ceiling before the gain.
Final combustion is derived from the state after the atomic exchange, including its increased Resolve ceiling.
For example, a planet at 48 affliction with 72 Resolve can pay 24 affliction and finish at 72 affliction against 84 Resolve, lit with 12 margin.
This does not revive an already-combusted target, which is ineligible before the exchange.
The mixed exchange and run-long stat effect need implementation before the offer can ship.
The ordinary B saves 24 Light for 24 affliction, whose later removal costs 48 at baseline: the trade preserves current Light rather than supplying a profitable round trip.

**Sagittarius — Aries rising.**
Above the pass, a school teaches a standing observance said to prepare the mind for journeys without a promised return.
You may pay for a seated lesson or reduce its fee by demonstrating the long postures for the other students.

| Choice | Action | Consequence |
|---|---|---|
| A | Buy the seated lesson. | You practice its breathing until you can hold the thought of departure without cutting your breath short. |
| B | Pay partly by demonstrating. | Your legs ache through the long postures, but you leave able to sustain their breathing on your own. |
| Mercury | Ask how the practice makes room for return. | The teacher offers a shorter, cheaper lesson around your question, leaving you with a practice and an unsettled answer. |
| Jupiter | Teach the observance you brought. | The school credits your shorter demonstration against the fee, and you try its breathing while your own conviction remains audible. |
| Joy | Take the teacher's open place. | She lowers the seated lesson's charge and makes room for you without asking you to affirm its claim. |
| Exit | Continue over the pass. | The students' measured breathing fades before you decide what you think of it. |

**Gemini — Libra rising.**
At a school above the pass, two teachers disagree about why the same standing practice steadies a traveler.
They sell a seated lesson or accept a smaller fee from someone willing to demonstrate its long postures while they compare accounts.

| Choice | Action | Consequence |
|---|---|---|
| A | Buy a lesson with both accounts. | You learn the breathing while the teachers leave its explanation divided between them. |
| B | Demonstrate while they compare. | Your legs tire before the debate does, but the practiced breathing stays with you. |
| Mercury | Try the point where their accounts differ. | They shorten the lesson and its price around your experiment, which gives you a usable method without ending their disagreement. |
| Jupiter | Add the practice you learned elsewhere. | Your shorter demonstration earns part of the fee, and the lesson ends with three accounts you still want to think about. |
| Joy | Accept the unclaimed seated place. | The teachers offer it for less, and you learn without having to settle which one should be believed. |
| Exit | Leave them to the comparison. | Their disagreement follows you down the first steps and then disappears beneath the wind. |

**Menus to inspect.**
Without selected occupants or joy: A, B, Exit, with the same beneficiary for the burden and growth in B.
At 216 Light and at least 24 existing margin, ordinary B is affordable while A is not.
With Mercury and Jupiter in Gemini IX unlocked: Mercury, Jupiter, Exit; A now costs 216 without affliction, so the detriment Jupiter offer at the same price is economically dominated in this combination.
With those occupants in Sagittarius IX: Mercury costs 228 without affliction; Jupiter costs 204 with 12 affliction, preserving a meaningful immediate-resource trade.
Sun joy elsewhere replaces ordinary A at 228 only when Mercury is absent; it has no automatic dignity upgrade.
These examples expose a combination that needs revision before catalogue adoption rather than treating every authored special offer as useful in every chart.

## X Achievement

### The public demonstration

**Composition.**
[X](../../../concept/HOUSE_MATRIX.md#x--achievement) is angular and square the Ascendant: a public demonstration gives the Prince a consequential role under observation.
Saturn supplies the opening voice; X has no joy assignment.
[Mars X](../../../concept/HOUSE_PLANET_MATRIX.md#mars-x--achievement) seeks control of the attempt; [Sun X](../../../concept/HOUSE_PLANET_MATRIX.md#sun-x--achievement) seeks authorship of its public account.
Capricorn organizes the occasion through rank and procedure; Cancer through a town's familiar names and remembered expectations, using their [placement references](../../../concept/PLANET_MATRIX.md).
Neither response establishes permanent office or later reputation state.

**Opening — Saturn:** “When the work is done, and one's name is becoming distinguished, to withdraw into obscurity is the way of Heaven.”
Lao Tzu, *Tao Te Ching* 9, James Legge translation, 1891, from [saturn.yaml](../../../../planets/saturn.yaml).

| Choice | Aside in Capricorn | Aside in Cancer |
|---|---|---|
| A | Gain 48 Light; choose a lit planet to take 24 affliction. | Gain 48 Light; choose a lit planet to take 24 affliction. |
| B | Pay 360 Light; give a chosen lit planet +12 Testify for the rest of the run. | Pay 360 Light; give a chosen lit planet +12 Testify for the rest of the run. |
| Mars replaces A | Gain 72 Light; choose a lit planet to take 24 affliction. | Gain 60 Light; choose a lit planet to take 24 affliction. |
| Sun replaces B | Pay 348 Light; give a chosen lit planet +12 Testify for the rest of the run. | Pay 348 Light; give a chosen lit planet +12 Testify for the rest of the run. |
| Exit | No cost or effect. | No cost or effect. |

Mars is exalted in Capricorn and fall in Cancer; Sun is neutral in both versions.
Mars takes A and Sun takes B when eligible, so simultaneous occupants do not compete here.
The growth outcome needs implementation; the earnings effects already exist, while their occupancy selection does not.

**Capricorn — Aries rising.**
The guild pays a demonstrator to work its stiff harbor model before the examiners, or sells a lesson in presenting a proposed route to the hall.
Your place on the platform is already marked below the master whose method you are expected to follow.

| Choice | Action | Consequence |
|---|---|---|
| A | Work the master's demonstration. | You haul the model through its prescribed route and receive the fee under the master's name. |
| B | Pay to rehearse your account. | The tutor has you repeat your explanation until you can carry it to the back of the hall. |
| Mars | Claim the difficult route. | You set the model's course yourself and collect the larger demonstration fee with its rope marks still on your palms. |
| Sun | Make the lesson about your own method. | The tutor agrees a smaller fee, and you rehearse an account whose first sentence names the passage you mean to attempt. |
| Exit | Give up the marked place. | The usher removes your marker while the examiners continue their conversation. |

**Cancer — Libra rising.**
Your old town pays volunteers to demonstrate its stiff harbor model during the homecoming, while a speaker sells lessons in addressing the crowd.
The announcer introduces you by your childhood nickname before you have touched the rope.

| Choice | Action | Consequence |
|---|---|---|
| A | Give them the familiar demonstration. | You pull the model through its remembered route while the front row calls out the turns, then collect your fee. |
| B | Buy a lesson with the speaker. | You practice sending your voice past the familiar faces until it reaches the strangers at the back. |
| Mars | Ask them to follow your route. | You interrupt the shouted directions, pull the model through your chosen passage, and receive the extra fee. |
| Sun | Begin with the name you use now. | The speaker lowers the lesson's price, and you practice an introduction that the old nickname cannot finish for you. |
| Exit | Leave the rope for someone else. | The announcer calls another name before the familiar faces turn away. |

**Menus to inspect.**
An empty X shows A, B, Exit.
Mars in Capricorn X unlocked replaces A with its 72-Light offer; Mars in Cancer X still replaces it, at 60 Light.
With Sun and Mars together in Cancer X unlocked: Mars, Sun, Exit, with no invented joy bonus.
At 348 Light, the Sun lesson is affordable where ordinary B at 360 is not; at zero Light it stays disabled, leaving earning or exit.
Public status supplies the fiction; the preview promises only the listed Light, affliction, or run-long Testify change.

## XI Friendship

### The place in the circle

**Composition.**
[XI](../../../concept/HOUSE_MATRIX.md#xi--friendship) is succedent and sextile the Ascendant: help arrives through an existing circle, and participation can extend what that circle makes available.
Saturn supplies the opening voice; Jupiter supplies the joy.
[Jupiter XI](../../../concept/HOUSE_PLANET_MATRIX.md#jupiter-xi--friendship) wants access and membership; [Venus XI](../../../concept/HOUSE_PLANET_MATRIX.md#venus-xi--friendship) wants particular company and can feel jealous of a newcomer.
Aquarius changes the group's usual format; Libra attends to how partners are paired, following their [placement references](../../../concept/PLANET_MATRIX.md).
Accepting help and wanting a friend's undivided attention can coexist without a corrective ending.

**Opening — Saturn:** “While we are postponing, life speeds by.”
Seneca, *Moral Letters* 1.2, Richard M. Gummere translation, 1917, from [saturn.yaml](../../../../planets/saturn.yaml).

| Choice | Aside in Aquarius | Aside in Libra |
|---|---|---|
| A | Gain 24 Light. | Gain 24 Light. |
| B | Pay 240 Light; give a chosen lit planet +6 Fortune for the rest of the run. | Pay 240 Light; give a chosen lit planet +6 Fortune for the rest of the run. |
| Jupiter replaces A | Gain 36 Light. | Gain 36 Light. |
| Venus replaces B | Pay 228 Light; give a chosen lit planet +6 Fortune for the rest of the run. | Pay 216 Light; give a chosen lit planet +6 Fortune for the rest of the run. |
| Joy replaces A | Gain 36 Light. | Gain 36 Light. |
| Exit | No cost or effect. | No cost or effect. |

Jupiter is neutral in both versions; Venus is neutral in Aquarius and domicile in Libra.
A prefers Jupiter, then joy, then ordinary A; their equal gifts never add together.
Venus takes B when eligible.
Displayed +6 Fortune corresponds to +12 underlying Luck and is a determined run-long gain, not a random wager.
The growth effect needs implementation.

**Aquarius — Aries rising.**
Your friends have put aside a small traveling purse for you, then moved their evening game to a board with no agreed center.
An invited player charges for a lesson in noticing openings, and your usual partner is already puzzling over it with a newcomer.

| Choice | Action | Consequence |
|---|---|---|
| A | Accept the traveling purse. | A friend presses it into your palm without interrupting the dispute over the board. |
| B | Buy the lesson at the strange board. | You practice seeing an opening from each player's position before it closes. |
| Jupiter | Ask to join the circle's introduction. | Your friends introduce you to their guest and add to your purse while making room for your questions. |
| Venus | Ask your friend to learn beside you. | You share the smaller lesson fee and their attention, still aware of how easily they laughed with the newcomer. |
| Joy | Accept the purse they have enlarged. | Someone adds the extra coins without asking what you intend to do with them. |
| Exit | Leave them to their new game. | Your friend looks up as you go, and you lift a hand without explaining the evening. |

**Libra — Sagittarius rising.**
Your friends have saved a traveling purse and a place at their game, but your usual partner has promised the first round to a newcomer.
Their guest offers a paid lesson in reading the moment when a balanced position can change.

| Choice | Action | Consequence |
|---|---|---|
| A | Take the purse with thanks. | The gift passes across the table while your friend finishes arranging the pairs. |
| B | Buy the guest's lesson. | You practice recognizing the instant when an apparently even position offers room to act. |
| Jupiter | Let your friends make the introduction. | They add to the purse and introduce you as someone they want their guest to know. |
| Venus | Tell your friend you wanted to learn together. | They arrange a cheaper shared lesson, and you enjoy their company without pretending you never felt left out. |
| Joy | Accept the larger gift. | Your friends count out the extra coins and leave the choice of staying entirely with you. |
| Exit | Give up the reserved place. | The newcomer moves into the gap while your friend keeps watching you for a moment. |

**Menus to inspect.**
An empty XI without Jupiter joy shows A, B, Exit, including the ordinary gift.
Jupiter joyful elsewhere shows Joy, B, Exit at 36 Light, even when XI has no occupant.
Jupiter and Venus in Libra XI unlocked show Jupiter, Venus, Exit; Jupiter's gift stays 36 even if it is also joyful.
At zero Light the growth offer is disabled, but either available gift or Exit remains valid.
Taking the gift grants no later access, debt, friendship score, or lesson.

## XII The Hidden

### The room beyond visiting hours

**Composition.**
[XII](../../../concept/HOUSE_MATRIX.md#xii--the-hidden) is cadent and averse: the retreat's visiting restrictions and keeper limit access, while privacy can be wanted as well as imposed.
Jupiter supplies the opening voice; Saturn supplies the joy.
[Saturn XII](../../../concept/HOUSE_PLANET_MATRIX.md#saturn-xii--the-hidden) wants some say over separation; [Moon XII](../../../concept/HOUSE_PLANET_MATRIX.md#moon-xii--the-hidden) wants feeling to have room without forced explanation.
Pisces distinguishes one's own mood from the building's mingled voices; Virgo makes the boundary concrete through a finished task or a closed latch, using their [placement references](../../../concept/PLANET_MATRIX.md).
Repeated hauling, rather than loneliness, causes the affliction cost.

**Opening — Jupiter:** “Time is endless in thy hands, my lord. There is none to count thy minutes.”
Rabindranath Tagore, *Gitanjali* 82, from [jupiter.yaml](../../../../planets/jupiter.yaml).

| Choice | Aside in Pisces | Aside in Virgo |
|---|---|---|
| A | Gain 36 Light; choose a lit planet to take 48 affliction. | Gain 36 Light; choose a lit planet to take 48 affliction. |
| B | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. | Pay 48 Light; remove up to 24 affliction from a chosen lit planet. |
| Saturn replaces A | Gain 48 Light; choose a lit planet to take 48 affliction. | Gain 48 Light; choose a lit planet to take 48 affliction. |
| Moon replaces B | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. | Pay 36 Light; remove up to 24 affliction from a chosen lit planet. |
| Joy replaces A | Gain 36 Light; Saturn takes 24 affliction. | Gain 36 Light; Saturn takes 24 affliction. |
| Exit | No cost or effect. | No cost or effect. |

Saturn and Moon are neutral in both versions.
A tentatively prefers joy, then Saturn, then ordinary A, giving containment priority in this scene; Moon takes B.
Joy uses the existing fixed joy target, not a new target type.
Saturn's current base Resolve is at least 120, so a lit Saturn below 96 affliction can pay this 24 cost; VI's small-margin counterexample does not apply here.
The remaining tradeoff is losing the option to place a larger burden on another planet for a larger wage.

**Pisces — Aries rising.**
Visiting hours have ended at the retreat, but voices still travel through its water pipes while the keeper offers wages for hauling the heavy night shutters into place.
You can instead pay for a quiet room beyond their reach, and the outer door remains open if you want to leave.

| Choice | Action | Consequence |
|---|---|---|
| A | Haul the night shutters. | You finish the repeated lifts and collect your wage while the voices still seem to sound inside your arms. |
| B | Pay for the quiet room. | Behind the thick door, the borrowed voices fade and your breathing becomes your own again. |
| Saturn | Ask to finish the work without visitors. | The keeper agrees a higher wage for the solitary shift, and you complete the heavy lifts without answering anyone. |
| Moon | Ask for quiet without giving a reason. | The keeper offers a cheaper unoccupied room, where you rest before deciding what you feel. |
| Joy | Take the counterweighted shutter line. | Its weights contain the heaviest part of each lift, and you collect the ordinary wage without the full strain. |
| Exit | Go through the outer door. | The retreat's voices become indistinct behind you without becoming easier to understand. |

**Virgo — Libra rising.**
The retreat keeper's night list includes hauling a row of heavy shutters, and he names a wage for completing every marked window.
There is also a paid room where nobody will bring you another task, or you may leave through the still-open outer door.

| Choice | Action | Consequence |
|---|---|---|
| A | Finish the marked windows. | You haul each shutter shut and take your wage with the list complete and your shoulders throbbing. |
| B | Buy the room with the inside latch. | You close the latch and rest while someone else's steps finish the corridor. |
| Saturn | Define where your list ends. | The keeper agrees a higher wage for the exact shift, which you finish without taking on the unmarked rooms. |
| Moon | Ask for the smallest room you can put in order. | The keeper accepts less, and you straighten its cover before finally lying down. |
| Joy | Use the shutter stops. | You set the supports at each window, finish the list with less carried strain, and collect the ordinary wage. |
| Exit | Leave the list on its hook. | The unfinished marks remain legible as you walk out. |

**Menus to inspect.**
Without selected occupants and without Saturn joy: A, B, Exit.
With Saturn joyful elsewhere: Joy, B, Exit, with the smaller burden fixed to Saturn.
With Saturn and Moon in Virgo XII unlocked and Saturn joyful: Joy, Moon, Exit; Saturn's occupant wage is suppressed by this scene's proposed priority.
At 96 affliction, a lit Saturn loses joy but retains its occupant approach under the draft convention: Saturn, Moon, Exit, and another planet can carry the 48 cost.
If no lit planet has 48 margin, that earning offer stays disabled while recovery or Exit may still resolve.
