/** Guide copy — every player-facing word in the three tutorial guides
 *  (`CombatGuide`, `MapGuide`, `NarrativeGuide`), gathered so the wording can
 *  be tuned in one place. Layout stays in the guides: note keys, anchors,
 *  spotlights, placements, and phase order are code.
 *  Register: direct game instructions, accurate to MECHANICS.md. Pair the
 *  game's terms with familiar meanings: Resolve is health, Afflict deals
 *  damage, Testify heals, and combusted means knocked out until revived.
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
 *    narrative — {ruler} the house's ruler; {joy} its joy;
 *      {theme} the house's theme sentence
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
        body: "Self is your chart: your team of seven planets. Their positions are fixed. Planets with pulsing rings are available to act; tap one to select it.",
      },
      other: {
        label: "Other",
        body: "Other is the opposing chart. It follows the same rules as yours. Your action targets its acting planet.",
      },
      activePlanet: {
        label: "Incoming move",
        body: "The corona, or glowing ring, marks the opposing planet acting this turn. Amber means Afflict (damage); violet means Testify (healing). Combust it (knock it out) before it acts to cancel its move.",
      },
      anatomy: {
        label: "Health and linked effects",
        body: "Resolve is maximum health; the arc shows how much remains. At zero, the planet is combusted: knocked out until revived. Aspects are links that spread damage and healing between planets. Red links reverse the effect: damage becomes healing, and healing becomes damage.",
      },
      turn: {
        label: "Turn",
        body: "Turn {current} of {total}. Encounters last up to this many turns, increasing by one per map. They end early if either side has no planets left that can act.",
      },
      light: {
        label: "Your goal: gather Light",
        body: "Gather Light as your Prince travels the universe. Light is your score for the run; your final total becomes a star on your Prince. The number beside it previews this turn's gain.",
      },
      theirMove: {
        label: "Their move",
        body: "The opponent's move is shown before you choose: which planet will act, whether it will damage or heal your selected planet, and how much. You act first.",
      },
      ruler: {
        label: "Ruler and scoring",
        body: "{ruler} is this encounter's ruler: the planet that sets its scoring rule. You earn Light from {rule}. Other effects can help you survive or set up later turns, but earn no points.",
      },
      example: {
        label: "Choose a planet",
        body: "You are inspecting {planet}. Choose any planet with a pulsing ring. Its Afflict and Testify stats set its damage and healing; the target's aspects determine which other planets are affected.",
      },
      actions: {
        label: "Damage or heal",
        body: "Afflict deals damage (affliction) to the opposing planet. Testify heals it (testimony). Healing cannot revive a combusted planet. Damage and healing can both earn Light, depending on the ruler. Tap once to preview your score and effects, then again to confirm.",
      },
      projection: {
        label: "{action} preview",
        body: "The charts preview the exact damage, healing, and knockouts from this turn. You would gain {light} Light. Check the linked effects before confirming.",
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
        body: "Guide your Prince through the universe, gathering Light along the way. This node marks your location; lit nodes are your next destinations. Tap once to preview, then again to travel. Check rulers and houses across the map to plan your route.",
      },
      encounter: {
        label: "An encounter",
        body: "An encounter is turn-based combat between your planets and another chart. Its ruler, {ruler}, determines how you earn Light, your score. Check the scoring rule when planning your route.",
      },
      house: {
        label: "A house",
        body: "A house is a story event where choices can heal or damage your planets, revive knocked-out planets, or change your Light. Each of the twelve houses covers an area of life. This is {name}: {gloss}. Its ruler, {ruler}, sets its colour.",
      },
      chart: {
        label: "Your chart",
        body: "Your chart shows your planets' current health. Affliction is damage taken; it carries between encounters, so health does not reset after combat. Combusted planets are knocked out until revived. Tap the chart to inspect your team.",
      },
      crossing: {
        label: "The crossing",
        body: "The crossing is the exit to the next map. Combusted planets roll to revive, then all available planets take damage. Fortune is each planet's chance to revive or halve its damage. Later crossings can deal more damage, but never knock a planet out.",
      },
      index: {
        label: "Map {n} of VII",
        body: "A run lasts up to seven maps, and each adds a turn to its combat encounters. The run ends when you complete the seventh map or all your unlocked planets are combusted (knocked out).",
      },
      boundary: {
        label: "Crossing results",
        body: "The results of entering this map: which planets revived and how much damage each took. These changes have already been applied to your chart.",
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
        body: "A house is a story event where one choice can change your planets' health or your Light, the run's score. Its ruler, {ruler}, sets the theme: {theme}",
      },
      chorus: {
        label: "The chorus",
        body: "The chorus is flavour text: a voice associated with {ruler} that sets the scene's mood. It has no gameplay effect. These voices reveal each planet's character over multiple runs.",
      },
      commit: {
        label: "Preview, then confirm",
        body: "Tap an option to preview it. If it needs a target, choose a highlighted planet, check the preview, and confirm beneath its stats. Otherwise, tap the option again to confirm. Confirming applies the effects and ends the scene.",
      },
      aside: {
        label: "Costs and effects",
        body: "The aside is an option's cost and effect summary. Inspect a planet to preview the effect on your chart. Calling back a combusted planet means reviving it at half its maximum health (Resolve).",
      },
      housePlanet: {
        label: "The house's planet",
        body: "{joy} has its joy here: it is the planet whose condition changes this house's choices. Its damage and dignity (how favourably it is placed in its sign) determine which options appear.",
      },
      housePlanetNoJoy: {
        label: "The house's planet",
        body: "A joy planet is one whose condition changes the house's choices; this house has none. Some options depend on its ruler, {ruler}, being available with favourable dignity (placement in its sign). Others require enough health or Light to pay their cost.",
      },
    },
  },
} as const;
