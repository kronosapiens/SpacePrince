import type { PlanetName, SignName } from "@/game/types";

/** The prose that opens a chart-to-chart encounter: the beginning of a
 *  meeting, before the player acts, held unchanged for the whole encounter.
 *  Keyed on the encounter's ruler and that planet's own natal sign in the
 *  Other's chart. Each opening says what the Other seeks from the exchange,
 *  the thing the ruler's Light rule rewards, in the manner of the sign. It
 *  never says how they arrive or what they will do, and it leaves the player's
 *  response unwritten, so it stays true whichever way the turns go. Each block
 *  is headed by the rule it should make emotionally legible (`RULER_RULES`).
 *  Placement colour draws on docs/writing/PLANET_MATRIX.md and the planet
 *  introductions. */
export const ENCOUNTER_OPENINGS: Record<PlanetName, Record<SignName, string>> = {
  // Gain Light from tension eased on the Other's chart.
  Moon: {
    Aries: "Their complaint is ready before the kettle boils. They want to get it out into the open, where your answer might make it easier to bear.",
    Taurus: "The station keeps a borrowed summer behind glass. They are looking for that kind of warmth from you: something their tired body can trust for a while.",
    Gemini: "Their account of the day has too many beginnings. They hope that telling it to you will untangle what still keeps them awake.",
    Cancer: "The cup they carry has survived three moves between worlds. They want the comfort of being recognized without having to unpack the whole story.",
    Leo: "Their festival coat has lost most of its shine. They are hoping for a welcome that lets them put down the work of being splendid.",
    Virgo: "They have mended every loose strap except the one rubbing their shoulder. They want help with the small discomfort they keep putting last.",
    Libra: "They have made room for everyone else's worries. They want your company to give them ease without another careful compromise.",
    Scorpio: "Their message is folded with the writing inward. They want relief from carrying it, without having to hand you every word.",
    Sagittarius: "The next departure is still hours away. They hope your company will give their troubles somewhere to stretch beyond the waiting room.",
    Capricorn: "They are still wearing the heavy coat in which everyone asks them for help. They want a place with you where its weight can finally be set down.",
    Aquarius: "The lodging house has never had a guest quite like them. They want company in which resting does not require an explanation of their differences.",
    Pisces: "Other people's worries follow them home like songs heard through a wall. They hope your attention can quiet the room enough to hear themselves.",
  },
  // Gain Light from effects contrary to the Other's action.
  Mercury: {
    Aries: "Their question has no wrapping. They want an answer that pushes against it, before politeness persuades either of you to agree.",
    Taurus: "They have carried this idea longer than the tool in their pocket. They want you to try it from the other end and find what their hands have missed.",
    Gemini: "Even the station announcements agree with them today. They are hungry for a contrary answer, something their own voice could not have supplied.",
    Cancer: "Their family has polished this story through generations of telling. They want you to turn it over and look at the side no one displays.",
    Leo: "They know how to make a room agree with them. What interests them now is an answer strong enough to interrupt the applause.",
    Virgo: "The little machine works exactly as their notes predict. They want you to dispute the notes; a successful explanation can still conceal a mistake.",
    Libra: "They have left the opposite chair empty on purpose. They want someone who will take the other side of the question and give it a fair voice.",
    Scorpio: "Two accounts of the same disappearance agree too neatly. They want your resistance to their explanation, even where they have begun to trust it.",
    Sagittarius: "Their map ends in an arrow toward places they have never seen. They hope your answer will bend that arrow somewhere they have not imagined.",
    Capricorn: "They have numbered every step of the plan. They want you to lean against it, finding the weakness before someone has to stand there.",
    Aquarius: "Their companions all call the design revolutionary. They want you to question the part everyone, including them, has mistaken for ordinary.",
    Pisces: "The picture in their mind changes whenever they describe it. They want you to answer from the far shore, where its shape might look different.",
  },
  // Gain Light from tension eased directly on both charts.
  Venus: {
    Aries: "The second bowl is already on the table. They hope the two of you can answer kindness with kindness before either thinks of a reason to wait.",
    Taurus: "The fruit grows slowly on this cold moon. They want to enjoy its sweetness with you, giving each other enough time to feel restored.",
    Gemini: "They are looking for a joke that belongs to both of you. A little laughter, freely returned, would make the day's troubles easier on each side.",
    Cancer: "They keep a cup for every person they miss. They hope to give you the comfort of a place kept ready, and find some of that comfort in return.",
    Leo: "Their idea of affection includes making a small occasion splendid. They want to warm you with that attention and be welcomed just as gladly themselves.",
    Virgo: "They know how to make a burden easier to carry. They hope you will notice the weight on their own shoulder, so the care can travel both ways.",
    Libra: "They want the kind of ease that two people make together: each shifting a little, until neither has to sit on the cold edge of the bench.",
    Scorpio: "They hope for care that can receive an awkward truth and remain gentle. They want to offer you the same shelter they are asking for.",
    Sagittarius: "Neither of you knows the customs of this inn. They hope you can make a welcome for each other while the unfamiliar room becomes a little warmer.",
    Capricorn: "Their gifts are made to survive daily use. They want a steady exchange of care, something each of you can rest in without a ceremony.",
    Aquarius: "They have brought two different cups. They want care to pass both ways, with room for each person's comfort.",
    Pisces: "They hope you can be tender with each other's unfinished things. A little care passed back and forth would be enough to begin.",
  },
  // Gain Light from effects in accord with the Other's action.
  Sun: {
    Aries: "Their place is at the first door, where the paint is still wet. They want you to answer their initiative in kind, giving the meeting the same beginning.",
    Taurus: "They tend the same ground through changing skies. They want your answer to match their manner, gentle or forceful.",
    Gemini: "They value a conversation that finds its rhythm in returning phrases. They want what they give the meeting to come back from you in the same spirit.",
    Cancer: "Their house has a greeting for every return. They want warmth answered with warmth, firmness with firmness.",
    Leo: "The light on their coat is their own handiwork. They want a wholehearted answer in kind, someone willing to meet the brightness they bring.",
    Virgo: "They take as much care with a small act as a large one. They want you to work in accord with them, giving the same kind of attention back.",
    Libra: "They want the exchange to balance through answering in kind. Whatever weight they bring to their side, they hope to feel its counterpart in yours.",
    Scorpio: "They distrust a welcome that changes in private. They want your answer to match theirs, as gentle or as exacting.",
    Sagittarius: "Their chosen road crosses country no one here can name. They want you to answer their manner of travelling, sharing the pace they set.",
    Capricorn: "They measure an undertaking by the work it receives. They want your answer to follow the same grain as theirs, so both efforts belong to one piece.",
    Aquarius: "Their common room began as a drawing on a wall. They want your answer in the same spirit as their own.",
    Pisces: "They know the tune before they know its name. They want an answer in accord with what they offer, a voice that can meet the same note.",
  },
  // Gain Light from tension created on the Other's chart.
  Mars: {
    Aries: "The new handles still have splinters. They want you to put their eager strength under real pressure.",
    Taurus: "Their hands know the weight of a day's work. They want you to press them beyond the familiar load and discover what their steadiness can bear.",
    Gemini: "They have practised every familiar answer. They want you to make their part difficult in a new way, giving their quickness something worth catching.",
    Cancer: "The shelter they care for has weathered gentler seasons. They want you to test their strength now, while there is still room to learn where it gives.",
    Leo: "Their practice clothes are far less splendid than their public ones. They want your full pressure, an honest difficulty they cannot dress up as success.",
    Virgo: "They can show you exactly where their last attempt failed. They want you to press the new work there, finding whether the repair has earned its name.",
    Libra: "They want the courtesy of a demanding partner: pressure from you that makes their own strength work.",
    Scorpio: "Their patient hands have found a stubborn task. They want real strain from you, beyond what easy work asks of them.",
    Sagittarius: "Their boots are worn past the distance marked on the map. They want a challenge from you that makes them find another mile in themselves.",
    Capricorn: "Their strength comes from small tasks repeated. They want your pressure against it, enough to make all that preparation matter.",
    Aquarius: "Their new method has attracted plenty of praise. They want you to put them under pressure; an untested success tells them very little.",
    Pisces: "The shape slips between their fingers. They want you to press their effort harder than the soft material can.",
  },
  // Gain Light from direct effects on both charts.
  Jupiter: {
    Aries: "Their plans are larger than the empty workshop. They want both of you fully involved, willing to be challenged as freely as helped.",
    Taurus: "They have set out more than one person can enjoy. They want a generous exchange in both directions, with room for demands as well as gifts.",
    Gemini: "Their notebook has room between accounts. They want both of you to give and receive, whether comfort or challenge.",
    Cancer: "Their house makes room for every guest. They want both of you to give and receive, through warmth or demands.",
    Leo: "They want an occasion big enough for both of you: something substantial given each way, whether encouragement or difficulty.",
    Virgo: "There is work for both pairs of hands. They want help or pressure to pass directly between you, with each affecting the other.",
    Libra: "They want both sides of the exchange to carry weight. An easy welcome or a difficult answer can serve, provided neither of you is left untouched.",
    Scorpio: "The room has heard enough careful talk. They want both of you touched by the exchange, whether it comforts or challenges.",
    Sagittarius: "Their stories disagree with guidebooks. They want this meeting to reach you both, through comfort or difficulty.",
    Capricorn: "They have time for an undertaking that asks something of both people. They want effort and help to pass freely between you, enough to build upon.",
    Aquarius: "Their workshop has tools for different hands. They want support or challenge to pass both ways, reaching each of you.",
    Pisces: "They hope to let the meeting reach both of you without deciding its shape in advance. There is room in their welcome for comfort and for difficulty.",
  },
  // Gain Light from planets going dark on both charts.
  Saturn: {
    Aries: "Their hands cannot finish all they began. They want to find where either person's strength runs out and work must stop.",
    Taurus: "The winter store has a last jar, however carefully it is counted. They want to learn what happens when either of you reaches the end of a reserve.",
    Gemini: "Their agreement is worn thin at the folds. They want to face where either person's strength to sustain it runs out.",
    Cancer: "They have kept an empty house warm. They want to face where either person's strength is spent and the tending ends.",
    Leo: "Their name is stitched inside clothes grown too heavy for the ceremony. They want to find where either of you must finally lay an exhausted part aside.",
    Virgo: "Unfinished tasks fill their ledger. They want to reach the point where either person's capacity is spent, with work still waiting.",
    Libra: "They want to follow an obligation to the place where one of you can no longer carry it. The last measure matters to them as much as the first.",
    Scorpio: "The sealed room has needed guarding for years. They want to discover what gives when either of you has no strength left to keep a door closed.",
    Sagittarius: "Their belief has travelled farther than their body. They want to face the point where either person's strength runs out.",
    Capricorn: "They know how a house endures winter. They want to find where either person's strength runs out and holding on must end.",
    Aquarius: "The rules assume endless patience. They want to find what remains when either person's capacity to comply is spent.",
    Pisces: "Their promises have spread farther than their hands can reach. They want to meet the limit of either person's care, where there is nothing left to give.",
  },
};
