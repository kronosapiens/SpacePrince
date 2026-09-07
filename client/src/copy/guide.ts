/** Guide copy — every player-facing word in the three tutorial guides
 *  (`CombatGuide`, `MapGuide`, `NarrativeGuide`), gathered so the wording can
 *  be tuned in one place. Layout stays in the guides: note keys, anchors,
 *  spotlights, placements, and phase order are code.
 *  Register, as `help.ts`: plain second-person help, accurate to
 *  MECHANICS.md; no chorus voice. Player-facing vocabulary is encounter /
 *  self / other — combat, opponent, and adversary are internal dev terms and
 *  never appear here. Casing per SCREENS.md §1.2: named quantities capped
 *  (Resolve, Fortune, Light, Afflict, Testify — TermText golds these);
 *  substances, processes, and stats lowercase in prose.
 *  A note runs two beats: the label names the thing, the body says what it is
 *  and what turns on it.
 *  `{placeholders}` are filled by `TermText`'s `vars` (bodies) or `fillLabel`
 *  (labels):
 *    encounter — {current}/{total} the turn's numbers; {ruler} the encounter's
 *      ruler; {rule} what gathers Light under it; {planet} the planet opened
 *      as the example; {light} the previewed gain; {action} Afflict or Testify
 *    map — {ruler} a node's ruler; {name}/{gloss} the picked house;
 *      {n} the map's numeral
 *    narrative — {ruler} the house's ruler; {joy} its joy;
 *      {fortune} the lit planet carrying wagers; {theme} the house's theme sentence
 *  Variants are separate entries (turn/turnSettled, theirMove/wayOut,
 *  housePlanet/housePlanetNoJoy), never a conditional inside a string. */

export const GUIDE_COPY = {
  encounter: {
    open: "Study this encounter",
    close: "Close encounter guide",
    phases: {
      chart: "Read the charts",
      read: "Read the encounter",
      act: "Choose an answer",
    },
    notes: {
      self: {
        label: "Self",
        body: "You. Seven planets in the places the sky gave them, and they never change. The whole of play is choosing which one answers, and each breathing ring can.",
      },
      other: {
        label: "Other",
        body: "Another chart, made the same way, and the tension between the two is what you play. Your answer lands on the planet acting now.",
      },
      activePlanet: {
        label: "Acting planet",
        body: "The corona marks the planet moving against you this turn, and its colour is the verb: amber afflicts, violet testifies. Combust it before it resolves and its move never lands.",
      },
      anatomy: {
        label: "Resolve and aspects",
        body: "The arc is Resolve, what this planet can still absorb. Spend it and the planet combusts, dark until something calls it back. Lines are aspects: what lands on one planet travels along them, and red lines turn it into its opposite.",
      },
      turn: {
        label: "Turn",
        body: "Turn {current} of {total}. An encounter is a fixed number of turns, one more with each map. When they are spent it is settled, whatever state the charts are in.",
      },
      turnSettled: {
        label: "Turn",
        body: "Every turn has been answered.",
      },
      light: {
        label: "Light",
        body: "The run's one lasting measure. Whatever Light you leave with becomes a star on your Prince, and nothing else about the run is kept. A previewed gain appears beside it.",
      },
      theirMove: {
        label: "Their move",
        body: "Declared before you choose: this planet, this verb, this much. You resolve first, so you answer knowing everything. Nothing here is hidden from you.",
      },
      wayOut: {
        label: "The way out",
        body: "The encounter is settled. The way onward is here, and nothing more is asked of you.",
      },
      ruler: {
        label: "The ruler",
        body: "{ruler} rules this encounter, and the ruler decides what counts: Light gathers from {rule}. Everything else you do here shapes the next turn but pays nothing.",
      },
      example: {
        label: "Choose a planet",
        body: "{planet} is opened as an example, not advice. Any lit planet can answer, and who you send is the whole of the choice: its strength sets the amount, its lines set where it travels.",
      },
      actions: {
        label: "Choose a verb",
        body: "Afflict adds tension to the planet facing you. Testify relieves it. Neither is right in general: the ruler says which pays here, and the preview says how much. The first tap previews, the second commits.",
      },
      projection: {
        label: "{action} preview",
        body: "Nothing here is a gamble. The charts now show exactly what this answer does, and it would gather {light} Light. Read the ripple before you commit.",
      },
    },
  },

  map: {
    open: "Study this map",
    close: "Close map guide",
    phases: {
      map: "Read the map",
      nodes: "What a node holds",
      chart: "Between encounters",
    },
    notes: {
      here: {
        label: "You are here",
        body: "The node you stand on. A map is walked one node at a time, each an encounter of some kind, and the path behind you is drawn solid.",
      },
      next: {
        label: "Next steps",
        body: "Lit nodes are one step ahead: tap one to consider it, tap again to travel. Nothing is hidden, so a route can be read in full before you take it: which rulers, which houses.",
      },
      crossing: {
        label: "The crossing",
        body: "The far node crosses into the next map. Fortune turns there: each combusted planet rolls to return, the lit ones take on fresh affliction, and every map opens nearer the edge than the last.",
      },
      encounter: {
        label: "An encounter",
        body: "Self and other, face to face, for a fixed number of turns. {ruler} rules this one and decides what gathers Light there, so choose your route with the ruler in view.",
      },
      house: {
        label: "A house",
        body: "A scene in one of the twelve houses, the domains of a life, where the chart is tended or taxed: affliction relieved, a lost planet called back, Light spent or gathered. This one is {name}, {gloss}, coloured by its ruler, {ruler}.",
      },
      chart: {
        label: "Your chart",
        body: "Your planets as they stand. Affliction carries from node to node, so what you leave an encounter with is what you bring to the next. Tap the chart to study them.",
      },
      index: {
        label: "Map {n} of VII",
        body: "A run is seven maps at most, and each one adds a turn to its encounters. It ends when the seventh is crossed, or when all seven planets have combusted.",
      },
      boundary: {
        label: "The crossing's record",
        body: "What the last crossing did: which planets returned, and what affliction the lit ones took. It is already done, and the map opens from here.",
      },
    },
  },

  narrative: {
    open: "Study this scene",
    close: "Close scene guide",
    phases: {
      scene: "Read the scene",
      choices: "Choose",
      chart: "What it touches",
    },
    notes: {
      house: {
        label: "The house",
        body: "One of the twelve houses, the domains of a life, where the chart is tended or taxed. {ruler} rules this one and sets its terms: {theme}",
      },
      chorus: {
        label: "The chorus",
        body: "A voice from {ruler}'s chorus, setting the mood of the house. It asks nothing of you. Over many runs the voices are how you come to know each planet.",
      },
      commit: {
        label: "Arm, then commit",
        body: "Tap an option to arm it, choose any planets it asks for, then tap the option again to commit. The whole scene resolves in that one decision.",
      },
      aside: {
        label: "The aside",
        body: "Each aside names an option's price and its effect before you decide, so nothing here is a surprise. Odds in sixtieths mark a wager, rolled against Fortune.",
      },
      housePlanet: {
        label: "The house's planet",
        body: "The condition of {joy} opens some choices; dignity opens others. Any wager here reads {fortune}'s Fortune, using a lit planet when the house's own planets cannot answer.",
      },
      housePlanetNoJoy: {
        label: "The house's planet",
        body: "No planet has its joy here. Some choices read the condition of {ruler}; others ask what your chart can spare. Any wager uses {fortune}'s Fortune, passing to a lit planet when the ruler cannot answer.",
      },
      outcomes: {
        label: "Outcomes",
        body: "Outcomes land on the chart itself: affliction taken or relieved, Light spent or gathered, sometimes a combusted planet called back. What you carry out of here, you carry into the next node.",
      },
    },
  },
} as const;
