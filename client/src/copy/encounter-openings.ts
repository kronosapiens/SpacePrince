import type { PlanetName, SignName } from "@/game/types";

/** The sentence that opens a chart-to-chart encounter: the beginning of a
 *  meeting, before the player acts, held unchanged for the whole encounter.
 *  Keyed on the encounter's ruler and that planet's own natal sign in the
 *  Other's chart. Each sentence says what the Other seeks from the exchange,
 *  the thing the ruler's Light rule rewards, in the manner of the sign. It
 *  never says how they arrive or what they will do, and it leaves the player's
 *  response unwritten, so it stays true whichever way the turns go. Each block
 *  is headed by the rule it should make emotionally legible (`RULER_RULES`).
 *  Placement colour draws on spec/concept/PLANET_MATRIX.md and the planet
 *  introductions. */
export const ENCOUNTER_OPENINGS: Record<PlanetName, Record<SignName, string>> = {
  // Gain Light from healing on the Other's chart.
  Moon: {
    Aries: "They come out with what is troubling them at once, hoping the air will clear once it is said.",
    Taurus: "They want a little steadiness from you, the kind a warm kitchen has while the bread cools.",
    Gemini: "They begin to speak about their day, hoping your company might help them feel more at ease.",
    Cancer: "They are hoping your company can bring back something of a lamplit room where someone once waited up for them.",
    Leo: "They want someone to be glad with them, since their happiness never feels quite real until it is shared.",
    Virgo: "They would like to put one small thing in order with you, which is easier than saying what is wrong.",
    Libra: "They want the two of you to be easy together, the way a conversation softens into companionable silence.",
    Scorpio: "They are holding something they are not ready to show, and hope you will let them keep their own pace with it.",
    Sagittarius: "They are hoping you will be a change of scene for them, somewhere with a little more room around what they feel.",
    Capricorn: "They have kept themselves composed for everyone else, and hope that with you the effort can finally be set down.",
    Aquarius: "They would like to be at ease with you without having to explain their differences, or pretend to fewer of them.",
    Pisces: "They have been carrying everyone else's moods all day, and hope that with you they can tell which feelings are their own.",
  },
  // Gain Light from effects contrary to the Other's action.
  Mercury: {
    Aries: "They put a question to you point-blank, and would rather be contradicted at once than agreed with slowly.",
    Taurus: "They offer you an idea they have carried for years, and want to see whether it holds up in other hands.",
    Gemini: "They want to hear whatever has occurred to you and not to them, and would be a little disappointed by plain agreement.",
    Cancer: "They tell you a story about something else entirely, hoping you will answer the thing underneath it.",
    Leo: "They tell the story well, and want an answer that is good enough to change how it ends.",
    Virgo: "They have thought this through carefully, and the most useful thing you could give them is the detail they missed.",
    Libra: "They put a proposition before you, leaving space for you to answer from the other side.",
    Scorpio: "They are not satisfied with the first explanation, yours or their own, and want to know what lies beneath it.",
    Sagittarius: "They have an idea of where all this leads, and want you to take it somewhere they had not expected.",
    Capricorn: "They have a plan laid out in order, and would trust it more if you tried to find the step that fails.",
    Aquarius: "They want you to unsettle an assumption they have stopped noticing, since no one in their own circle will.",
    Pisces: "They have a picture in mind that will not go into words, and hope you will come at it from another direction.",
  },
  // Gain Light from direct healing on both charts.
  Venus: {
    Aries: "They offer a kindness before they have thought it through, and hope you will answer it before you have either.",
    Taurus: "They would like to share something good with you, slowly, with neither of you in any hurry.",
    Gemini: "They are hoping for the kind of exchange that ends with both of you laughing at the same strange thing.",
    Cancer: "They care the way they keep things, tenderly and for years, and hope to be cared for in the same way.",
    Leo: "They want you to feel chosen, and to see on your face that they have been chosen too.",
    Virgo: "They show care by making things easier, and are hoping someone will notice and do a little of the same for them.",
    Libra: "They are hoping to make something graceful with you, even if it is only the next few minutes.",
    Scorpio: "They want a closeness that can survive honesty, and are willing to show you something they rarely show first.",
    Sagittarius: "They would like to discover something neither of you has seen, and to find out who you are when you see it.",
    Capricorn: "They do not trust warmth that arrives all at once, and hope for a kindness that would still be there tomorrow.",
    Aquarius: "They are hoping for an affection that leaves both of you free, and finds your strangeness part of the appeal.",
    Pisces: "They look at you more kindly than you expect, and hope to be looked at that way in return.",
  },
  // Gain Light from effects in accord with the Other's action.
  Sun: {
    Aries: "They have begun something and want you to begin too, matching them rather than waiting to see how it goes.",
    Taurus: "They have tended something for years and want you to meet it the way they do, steadily and with care.",
    Gemini: "They ask you a question and hope for one in return, since the exchange is where they find out who they are.",
    Cancer: "They care for people by keeping things ready for them, and want that care met in the spirit it is given.",
    Leo: "They put their whole heart where you can see it, and want yours to answer in kind rather than only watch.",
    Virgo: "They take care over small things and want you to meet them there, with the same attention they give.",
    Libra: "They want to be met as an equal, and will know at once if you are holding back or bearing down.",
    Scorpio: "They do not intend to pretend with you, and want you to go as far into the truth as they do.",
    Sagittarius: "They have their eye on something far off, and want you to want it with them rather than talk them out of it.",
    Capricorn: "They mean what they do and want you to mean it as much, since they measure people by what they keep.",
    Aquarius: "They have an idea of how things could be between people, and want you to take it up as your own.",
    Pisces: "They feel things before they can name them, and want you to feel this with them rather than explain it.",
  },
  // Gain Light from damage on the Other's chart.
  Mars: {
    Aries: "They step forward to test themselves against you, eager for something to push against.",
    Taurus: "They want to find out how long they can keep going against you, and would rather you did not go easy.",
    Gemini: "They want you to make this difficult in a way they have not seen, so they can find another way through.",
    Cancer: "They are protecting something, and want to find out whether they can keep hold of it when you press them.",
    Leo: "They want you to give them everything you have, since being met halfheartedly is the one thing they could not bear.",
    Virgo: "They have refined their approach and want you to find the flaw in it, since nothing else would teach them anything.",
    Libra: "They want to be met on even terms, pushed as hard as they push, since anything less would not be fair.",
    Scorpio: "They want a difficulty worth their full attention, and would rather you pushed to the end than relented halfway.",
    Sagittarius: "They want to find out how far they can go, and are hoping you will be the first real test of it.",
    Capricorn: "They have built their strength carefully and want to know whether it holds when real weight is put on it.",
    Aquarius: "They are trying something no one has made room for before, and want you to push back hard enough to improve it.",
    Pisces: "They are moved by something they cannot yet make real, and want you to push against them until it has a shape.",
  },
  // Gain Light from direct effects on both charts.
  Jupiter: {
    Aries: "They would rather both of you try something and get it wrong than have either of you hold back.",
    Taurus: "They have more than enough and would like to share it, and to be given to as freely in return.",
    Gemini: "They want the whole conversation, every idea you have and every one of theirs, with nothing kept back.",
    Cancer: "They want to make a place for you at their table, and to be welcomed just as fully at yours.",
    Leo: "They want both of you to be bolder for having met, whatever it takes to get there.",
    Virgo: "They want each of you to come away with something that works better than before, and are not fussy about how.",
    Libra: "They want this to come out well for both of you, and would rather risk something than settle for a careful nothing.",
    Scorpio: "They would rather the two of you be changed by this than comfortable, wherever that has to go.",
    Sagittarius: "They want this meeting to be large enough to think about on the way home, whichever way it goes.",
    Capricorn: "They are willing to give a great deal to this, and want whatever comes of it to be worth building on.",
    Aquarius: "They want this to be the kind of meeting that leaves both of you with more to offer everyone else.",
    Pisces: "They are willing to trust you before you have earned it, and want to see what that trust makes possible.",
  },
  // Gain Light from knockouts on both charts.
  Saturn: {
    Aries: "They have managed alone for as long as they could, and want to find out where that strength finally gives.",
    Taurus: "They are asking what their reserves are really for, and how much either of you can afford to spend.",
    Gemini: "They weigh every word, and want to know which of yours will still stand when the rest have given way.",
    Cancer: "They have held everyone else together for years, and want to learn what happens when they stop.",
    Leo: "They have practiced this until it holds, and want to know whether it will still hold when everything is at stake.",
    Virgo: "They want to know exactly how much is theirs to carry, and at what point either of you has done enough.",
    Libra: "They want to know what the two of you truly owe each other, and what it costs to pay it in full.",
    Scorpio: "They have carried something heavy in silence, and want to find out whether it can be borne by two.",
    Sagittarius: "They are testing whether what they believe can bear real weight, and are prepared for it not to.",
    Capricorn: "They ask how much either of you can carry before something has to give.",
    Aquarius: "They want to see what is still standing between you once both of you have spent everything you have.",
    Pisces: "They want to find the place where their care has to stop, and to learn it gently if they can.",
  },
};
