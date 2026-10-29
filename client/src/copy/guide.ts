/** Guide copy — every player-facing word in the three tutorial guides
 *  (`CombatGuide`, `MapGuide`, `NarrativeGuide`), gathered so the wording can
 *  be tuned in one place. Layout stays in the guides: note keys, anchors,
 *  spotlights, placements, and phase order are code.
 *  Register: direct game instructions, accurate to MECHANICS.md, limited to
 *  what the player needs to act on the screen — the instruction line already
 *  names what to click, and the screen shows its own numbers. Pair the
 *  game's terms with familiar meanings at first mention, once per screen's
 *  full tutorial: Afflict deals damage, Testify heals, and combusted means
 *  knocked out until revived.
 *  Casing per SCREENS.md §1.2: named quantities capped
 *  (Resolve, Fortune, Light, Afflict, Testify — TermText golds these,
 *  plus aspect/aspects and combust/combusted in any case);
 *  substances, processes, and stats lowercase in prose.
 *  A note runs two beats: the label names the thing, the body says what it is
 *  and what turns on it.
 *  `{placeholders}` are filled by `TermText`'s `vars` (bodies) or `fillLabel`
 *  (labels):
 *    encounter — {ruler} the encounter's ruler; {rule} how you gain Light
 *      under it; {light} the previewed gain; {action} Afflict or Testify
 *    map — {ruler} a node's ruler
 *  Variants are separate entries, never a conditional inside a string. */

export const GUIDE_COPY = {
  encounter: {
    open: "Study this encounter",
    close: "Close encounter guide",
    phases: {
      read: "Read the encounter",
      act: "Choose an action",
    },
    notes: {
      self: {
        label: "Self",
        body: "Your chart. The arc around each planet is its health; at zero it combusts (knocked out until revived).",
      },
      activePlanet: {
        label: "Incoming move",
        body: "Their acting planet will damage or heal the planet you choose, by this much. You act first, and your action lands on it.",
      },
      ruler: {
        label: "Ruler and scoring",
        body: "Light is your run's score. The ruler, {ruler}, decides what earns it: {rule}.",
      },
      actions: {
        label: "Damage or heal",
        body: "Afflict damages, Testify heals. Either can earn Light, depending on the ruler. Hover or focus to preview.",
      },
      projection: {
        label: "{action} preview",
        body: "This move would gather {light} Light.",
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
        body: "Gather Light, your run's score, on your way across the map.",
      },
      encounter: {
        label: "An encounter",
        body: "Another chart to meet. Its ruler, {ruler}, decides what earns Light there.",
      },
      house: {
        label: "A house",
        body: "A story event. Its choices trade between health and Light.",
      },
      chart: {
        label: "Your chart",
        body: "Damage carries from one encounter to the next. Click a planet to inspect it.",
      },
      crossing: {
        label: "The crossing",
        body: "Leads to the next map. A run lasts seven maps, or until every planet combusts.",
      },
    },
  },

  narrative: {
    open: "Study this scene",
    close: "Close scene guide",
    phases: {
      scene: "Read the scene",
    },
    notes: {
      house: {
        label: "The house",
        body: "A story event. Which choices appear depends on your planets and how they're faring.",
      },
      commit: {
        label: "Choose",
        body: "Each option lists its costs and effects. Hover or focus to preview; your choice ends the scene.",
      },
    },
  },
} as const;
