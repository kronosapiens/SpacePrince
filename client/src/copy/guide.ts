/** Guide copy — every player-facing word in the three tutorial guides
 *  (`CombatGuide`, `MapGuide`, `NarrativeGuide`), gathered so the wording can
 *  be tuned in one place. Layout stays in the guides: note keys, anchors,
 *  spotlights, placements, and phase order are code.
 *  Register: direct game instructions, accurate to MECHANICS.md. Pair the
 *  game's terms with familiar meanings at first mention, once per screen's
 *  full tutorial: Resolve is maximum health, Afflict deals damage, Testify
 *  heals, and combusted means knocked out until revived.
 *  Casing per SCREENS.md §1.2: named quantities capped
 *  (Resolve, Fortune, Light, Afflict, Testify — TermText golds these);
 *  substances, processes, and stats lowercase in prose.
 *  A note runs two beats: the label names the thing, the body says what it is
 *  and what turns on it.
 *  `{placeholders}` are filled by `TermText`'s `vars` (bodies) or `fillLabel`
 *  (labels):
 *    encounter — {current}/{total} the turn's numbers; {ruler} the encounter's
 *      ruler; {rule} how you gain Light under it; {planet} the planet opened
 *      as the example; {light} the previewed gain; {action} Afflict or Testify
 *    map — {ruler} a node's ruler; {name}/{gloss} the picked house;
 *      {n} the map's numeral
 *    narrative — {ruler} the house's ruler; {joy} its joy
 *  Variants are separate entries (housePlanet/housePlanetNoJoy), never a
 *  conditional inside a string. */

export const GUIDE_COPY = {
  encounter: {
    open: "Study this encounter",
    close: "Close encounter guide",
    phases: {
      chart: "Read the charts",
      read: "Read the encounter",
      act: "Choose an action",
    },
    notes: {
      self: {
        label: "Self",
        body: "This is your chart: seven planets with fixed positions. Pulsing rings mark planets available to act; tap to select.",
      },
      other: {
        label: "Other",
        body: "The opposing chart, which follows the same rules as yours. Your action affect its acting planet.",
      },
      activePlanet: {
        label: "Incoming move",
        body: "This planet will damage (Afflict, amber) or heal (Testify, violet) your selected planet by this amount. You act first; knocking it out stops its move.",
      },
      anatomy: {
        label: "Health and linked effects",
        body: "Resolve is maximum health; the arc shows what remains. At zero, planets are combusted -- knocked out until revived. Aspect links spread damage or healing; red flips the effect.",
      },
      turn: {
        label: "Turn",
        body: "Turn {current} of {total}. Each map adds one turn to encounters. They end early if either side is out of planets.",
      },
      light: {
        label: "Your goal: gather Light",
        body: "Light is your run's score. The final total becomes a permanent star on your Prince. The number beside it previews this turn's gain (or loss).",
      },
      ruler: {
        label: "Ruler and scoring",
        body: "The ruler, {ruler}, sets the scoring rule: earn Light from {rule}. Other effects can help you survive, but earn no points.",
      },
      example: {
        label: "Choose a planet",
        body: "Select any planet with a pulsing ring. {planet}'s stats set your action's effect; the target's aspects determine which other planets are affected.",
      },
      actions: {
        label: "Damage or heal",
        body: "Either action can earn Light, depending on the ruler. Healing cannot revive combusted planets. Tap once to preview the action, then again to confirm.",
      },
      projection: {
        label: "{action} preview",
        body: "The charts preview this turn's damage, healing, and knockouts. You would gain {light} Light. Check effects before confirming.",
      },
    },
  },

  map: {
    open: "Study this map",
    close: "Close map guide",
    phases: {
      map: "Read the map",
      chart: "Between encounters",
    },
    notes: {
      here: {
        label: "You are here",
        body: "Gather Light, your run's score. This node marks your location; lit nodes are next destinations. Tap once to preview, again to travel.",
      },
      encounter: {
        label: "An encounter",
        body: "An encounter is turn-based interaction between your planets and another chart. Its ruler, {ruler}, determines how you earn Light. Check the scoring rule when planning your route.",
      },
      house: {
        label: "A house",
        body: "Houses are story events. Choices change health or Light, or revive knocked-out planets. This is {name}: {gloss}. Its ruler, {ruler}, sets its colour.",
      },
      chart: {
        label: "Your chart",
        body: "Tap a planet to inspect it. Affliction is damage taken and persists between encounters. Combusted planets are knocked out until revived.",
      },
      crossing: {
        label: "The crossing",
        body: "Crossings lead to the next map. Combusted planets may revive, and available planets take some damage. Each planet's Fortune affects its outcome.",
      },
      index: {
        label: "Map {n} of VII",
        body: "Each map adds one turn to encounters. Your run ends after seven maps, or when all your planets combust.",
      },
      boundary: {
        label: "Crossing results",
        body: "These are your crossing results: planets revived and damage taken.",
      },
    },
  },

  narrative: {
    open: "Study this scene",
    close: "Close scene guide",
    phases: {
      scene: "Read the scene",
      choices: "Choose",
    },
    notes: {
      house: {
        label: "The house",
        body: "A house is a story event: your choice can change health or Light, your run's score. Its ruler, {ruler}, sets the stage.",
      },
      chorus: {
        label: "The chorus",
        body: "The chorus is flavour text voiced by {ruler}. It sets the mood and reveals the planet's character.",
      },
      commit: {
        label: "Preview, then confirm",
        body: "Tap an option to preview, then tap the again to confirm. Confirming ends the scene.",
      },
      aside: {
        label: "Costs and effects",
        body: "The aside lists an option's costs and effects. Calling back a knocked-out planet revives it at half its maximum health (Resolve).",
      },
      housePlanet: {
        label: "The house's planet",
        body: "{joy} is this house's joy planet: its damage and dignity (how favourably it is placed in its sign) determine which choices appear.",
      },
      housePlanetNoJoy: {
        label: "The house's planet",
        body: "Some choices require {ruler} to be available with favourable dignity. Others need enough health or Light to pay their cost.",
      },
    },
  },
} as const;
