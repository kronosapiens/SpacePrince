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
        body: "Self is your chart: seven planets with fixed positions. Pulsing rings mark planets available to act; tap one to select it.",
      },
      other: {
        label: "Other",
        body: "Other is the opposing chart. It follows the same rules as yours. Your action targets its acting planet.",
      },
      activePlanet: {
        label: "Incoming move",
        body: "This planet will damage (Afflict, amber) or heal (Testify, violet) your selected planet by this amount. You act first; knocking it out cancels its move.",
      },
      anatomy: {
        label: "Health and linked effects",
        body: "Resolve is maximum health; the arc shows what remains. At zero, planets are combusted: knocked out until revived. Aspect links spread damage or healing; red links swap the two.",
      },
      turn: {
        label: "Turn",
        body: "Turn {current} of {total}. Each map adds one turn to encounters. They end early if either side has no planets able to act.",
      },
      light: {
        label: "Your goal: gather Light",
        body: "Light is your run's score. Your final total becomes a star on your Prince. The number beside it previews this turn's gain.",
      },
      ruler: {
        label: "Ruler and scoring",
        body: "The ruler, {ruler}, sets this encounter's scoring rule: earn Light from {rule}. Other effects can help you survive, but earn no points.",
      },
      example: {
        label: "Choose a planet",
        body: "Select any planet with a pulsing ring. {planet}'s stats set your action's strength; the target's aspects determine which other planets are affected.",
      },
      actions: {
        label: "Damage or heal",
        body: "Either action can earn Light, depending on the ruler. Healing cannot revive combusted planets. Tap once to preview your score and effects, then again to confirm.",
      },
      projection: {
        label: "{action} preview",
        body: "The charts preview this turn's damage, healing, and knockouts. You would gain {light} Light. Check the linked effects before confirming.",
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
        body: "Gather Light, your run's score. This node marks your location; lit nodes are next destinations. Tap once to preview, then again to travel.",
      },
      encounter: {
        label: "An encounter",
        body: "An encounter is turn-based combat between your planets and another chart. Its ruler, {ruler}, determines how you earn Light. Check the scoring rule when planning your route.",
      },
      house: {
        label: "A house",
        body: "Houses are story events. Choices change health or Light, or revive knocked-out planets. This is {name}: {gloss}. Its ruler, {ruler}, sets its colour.",
      },
      chart: {
        label: "Your chart",
        body: "Tap your chart to inspect your planets. Affliction is damage taken and persists between encounters. Combusted planets are knocked out until revived.",
      },
      crossing: {
        label: "The crossing",
        body: "Crossings lead to the next map. Combusted planets roll to revive, then available planets take damage without being knocked out. Fortune is each planet's chance to revive or halve damage.",
      },
      index: {
        label: "Map {n} of VII",
        body: "Each map adds a turn to encounters. Your run ends after seven maps, or when all your unlocked planets are combusted.",
      },
      boundary: {
        label: "Crossing results",
        body: "These are your crossing results: planets revived and damage taken. The changes are already applied to your chart.",
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
        body: "A house is a story event: your choice can change health or Light, your run's score. Its ruler, {ruler}, sets the scene's tone.",
      },
      chorus: {
        label: "The chorus",
        body: "The chorus is flavour text voiced by {ruler}. It sets the scene's mood and reveals the planet's character, with no gameplay effect.",
      },
      commit: {
        label: "Preview, then confirm",
        body: "Tap an option to preview. For targeted choices, select a highlighted planet, then confirm beneath its stats. Otherwise, tap the option again. Confirming ends the scene.",
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
        body: "Some choices require {ruler} to be available with favourable dignity (placement in its sign). Others need enough health or Light to pay their cost.",
      },
    },
  },
} as const;
