/** Astral Codex copy — the glossary summoned from settings. One entry per
 *  term of art the player meets in play, grouped as the index shows them.
 *  Register: PRIMER.md "Voice" — spare, confident, unhurried; assumes no
 *  astrology; not a textbook. `paragraphs` give the traditional meaning,
 *  drawn from spec/concept/ASTROLOGY.md (eras and attributions as it gives
 *  them) and, for affliction, testimony and combustion, from the common
 *  traditional usage; `inPlay` appears only where the game really uses the
 *  concept, accurate to MECHANICS.md and client/src/game. Vocabulary per the
 *  copy/help.ts header: encounter / self / other; Resolve, Fortune, Light
 *  capped; stats and processes lowercase. One string per paragraph, rendered
 *  through `TermText`. `see` lists related entry ids. */

export interface CodexEntry {
  id: string;
  term: string;
  paragraphs: string[];
  inPlay?: string;
  see?: string[];
}

export interface CodexGroup {
  heading: string;
  entries: CodexEntry[];
}

export const CODEX: CodexGroup[] = [
  {
    heading: "The chart",
    entries: [
      {
        id: "natal-chart",
        term: "Natal chart",
        paragraphs: [
          "A map of the sky at one moment, seen from one place — usually a birth. It shows where each planet stood in the zodiac, and how the zodiac lay against the horizon.",
          "Babylon read the sky for the fate of the city. Greek astrologers, around the turn of the common era, turned it on the single person: the chart as the capacities of one life, and the roles it might come to occupy.",
        ],
        inPlay: "Your Prince is a natal chart, cast from a real moment and place. It never changes: it is your character, your save file, and the artifact you keep. Every Other is a real sky too.",
        see: ["planet", "zodiac", "house", "ascendant"],
      },
      {
        id: "planet",
        term: "Planet",
        paragraphs: [
          "To the ancients a planet was a wandering star — any light that moves against the fixed stars. Seven can be followed with the naked eye: the Sun, Moon, Mercury, Venus, Mars, Jupiter and Saturn. Babylon named them.",
          "Each is a way of acting — a will, a mood, a kind of force.",
        ],
        inPlay: "Your planets are what you send. Each has its own affliction, testimony, Resolve and luck, set by its nature and lifted by its sign. They unlock one at a time, the Moon first.",
        see: ["natal-chart", "rulership", "sect"],
      },
      {
        id: "zodiac",
        term: "Zodiac",
        paragraphs: [
          "The band of sky the Sun, Moon and planets travel through, divided into twelve signs of 30° each, from Aries to Pisces. The 360° circle and the twelve signs come from Babylon.",
          "Its arithmetic is base sixty, which divides by 2, 3, 4, 5, 6, 10 and 12 — so halves, thirds and quarters of the sky come out whole. Western astrology fixes the zodiac to the seasons: 0° Aries is the spring equinox.",
        ],
        inPlay: "The game's numbers use the same arithmetic. Stats and Resolve are multiples of 12, aspects carry fractions of the circle, and odds are counted in sixtieths.",
        see: ["element", "modality", "aspect"],
      },
      {
        id: "house",
        term: "House",
        paragraphs: [
          "Houses divide a chart into twelve domains of life: self, resources, siblings, home, pleasure, labor, partners, death, far journeys, public standing, friends, and what is hidden. Where a planet falls is where it has its say.",
          "The first astrologers to use them, in the Hellenistic world, counted whole signs: the rising sign is the first house, the next sign the second, and so on around the wheel. Each of seven houses is also the joy of one planet — the place it rejoices in.",
        ],
        inPlay: "Some stops on the map are houses. A house's ruling planet and its joy, read in your own chart, decide which choices it offers.",
        see: ["ascendant", "rulership", "dignity"],
      },
      {
        id: "ascendant",
        term: "Ascendant",
        paragraphs: [
          "The sign rising over the eastern horizon at the moment of birth. It ties a chart to a place as well as a time, and turns through all twelve signs in a day.",
          "The Ascendant came with Hellenistic natal astrology. Its sign is the first house, and the planet that rules it was called the ruler of the chart.",
        ],
        inPlay: "Your rising sign sits at the left of your wheel, and the other signs follow from it. The planet ruling the Other's Ascendant rules the encounter, and decides what gathers Light.",
        see: ["house", "rulership"],
      },
    ],
  },
  {
    heading: "Signs",
    entries: [
      {
        id: "element",
        term: "Element",
        paragraphs: [
          "Each sign belongs to one of four elements, three signs apiece, spaced evenly around the circle. Fire: Aries, Leo, Sagittarius. Earth: Taurus, Virgo, Capricorn. Air: Gemini, Libra, Aquarius. Water: Cancer, Scorpio, Pisces.",
          "The signs are older than the scheme laid over them. It became systematic in the 2nd century, when Ptolemy fitted astrology to Aristotle's physics of hot and cold, wet and dry.",
        ],
        inPlay: "A planet's element lifts one stat: fire its affliction, water its testimony, earth its Resolve, air its luck.",
        see: ["modality", "trine", "sextile"],
      },
      {
        id: "modality",
        term: "Modality",
        paragraphs: [
          "Each season holds three signs. Cardinal signs open it and begin things: Aries, Cancer, Libra, Capricorn. Fixed signs hold its middle and sustain: Taurus, Leo, Scorpio, Aquarius. Mutable signs close it and turn toward what comes next: Gemini, Virgo, Sagittarius, Pisces.",
          "A Greek innovation. The Babylonians had the twelve signs but not this seasonal logic, which works only because the zodiac is fixed to the solstices and equinoxes.",
        ],
        inPlay: "A planet's modality lifts one stat: cardinal its affliction, mutable its testimony, fixed its Resolve. Modality never touches luck.",
        see: ["element", "square"],
      },
    ],
  },
  {
    heading: "Aspects",
    entries: [
      {
        id: "aspect",
        term: "Aspect",
        paragraphs: [
          "An angle between two planets. The word is Latin, aspectus — beholding: planets in aspect see each other across the circle. Hellenistic astrologers counted four, sign to sign: sextile, square, trine and opposition.",
          "The sextile and trine are soft, and ease. The square and opposition are hard, and strain.",
        ],
        inPlay: "Aspects are the lines on your chart, and effects travel along them at the aspect's share of the circle. Hard aspects turn an effect over: affliction arrives as testimony, testimony as affliction.",
        see: ["conjunction", "sextile", "square", "trine", "opposition", "aversion"],
      },
      {
        id: "conjunction",
        term: "Conjunction",
        paragraphs: [
          "Two planets in one sign are conjunct. The tradition did not count this as an aspect: the planets do not behold each other across distance, they share a place. It called this co-presence — a fusion of their meanings, and the most powerful configuration of all.",
        ],
        inPlay: "What lands on one conjunct planet reaches the other in full.",
        see: ["aspect"],
      },
      {
        id: "sextile",
        term: "Sextile",
        paragraphs: [
          "Two signs apart: 60°, a sixth of the circle. The lesser soft aspect, joining signs of friendly elements — fire with air, earth with water.",
        ],
        inPlay: "Carries a sixth of an effect onward, in kind.",
        see: ["aspect", "trine"],
      },
      {
        id: "square",
        term: "Square",
        paragraphs: [
          "Three signs apart: 90°, a quarter of the circle. The lesser hard aspect, joining signs of one modality whose aims cross.",
        ],
        inPlay: "Carries a quarter of an effect onward, inverted.",
        see: ["aspect", "opposition"],
      },
      {
        id: "trine",
        term: "Trine",
        paragraphs: [
          "Four signs apart: 120°, a third of the circle. The greater soft aspect, joining signs of one element in easy agreement.",
        ],
        inPlay: "Carries a third of an effect onward, in kind.",
        see: ["aspect", "sextile"],
      },
      {
        id: "opposition",
        term: "Opposition",
        paragraphs: [
          "Six signs apart: 180°, across the circle, face to face. The greater hard aspect.",
        ],
        inPlay: "Carries half of an effect onward, inverted.",
        see: ["aspect", "square"],
      },
      {
        id: "aversion",
        term: "Aversion",
        paragraphs: [
          "Signs one or five apart — 30° or 150° — form no aspect. They cannot see each other, and are said to be in aversion.",
        ],
        inPlay: "Planets in aversion carry nothing between them, and no line joins them on the chart.",
        see: ["aspect"],
      },
    ],
  },
  {
    heading: "Standing",
    entries: [
      {
        id: "rulership",
        term: "Rulership",
        paragraphs: [
          "Each sign has a planet that rules it, with authority over that part of the sky. The scheme is symmetric: the Sun rules Leo and the Moon Cancer, and the other five each rule two signs, outward in order of distance — Mercury Gemini and Virgo, Venus Taurus and Libra, Mars Aries and Scorpio, Jupiter Sagittarius and Pisces, Saturn Capricorn and Aquarius.",
          "Hellenistic astrologers formalized it from older Babylonian affinities, and taught it through the Thema Mundi, a mythical birth chart of the world.",
        ],
        inPlay: "Every encounter has a ruler: the planet that rules the Other's Ascendant. It colours the stop on the map and decides what gathers Light.",
        see: ["domicile", "dignity", "ascendant"],
      },
      {
        id: "dignity",
        term: "Dignity",
        paragraphs: [
          "How well a planet can act from where it stands. In its own sign or its exaltation it is strong, like an official in their home jurisdiction; in the signs opposite those — detriment and fall — it is out of place, weakened or undermined.",
          "Medieval astrologers worked the idea into a full system of strengths and weaknesses.",
        ],
        inPlay: "Dignity never changes the numbers in an encounter. In a house, a ruler or joy planet in its domicile or exaltation opens choices a weaker one does not.",
        see: ["domicile", "exaltation", "detriment", "fall"],
      },
      {
        id: "domicile",
        term: "Domicile",
        paragraphs: [
          "A planet in a sign it rules is in domicile — at home, acting on its own authority. Venus in Libra; Saturn in Capricorn.",
        ],
        see: ["rulership", "detriment", "dignity"],
      },
      {
        id: "exaltation",
        term: "Exaltation",
        paragraphs: [
          "Each planet has one sign where it is exalted — raised up and honored, like a guest of high standing. The Sun in Aries, the Moon in Taurus, Mercury in Virgo, Venus in Pisces, Mars in Capricorn, Jupiter in Cancer, Saturn in Libra.",
        ],
        see: ["fall", "dignity"],
      },
      {
        id: "detriment",
        term: "Detriment",
        paragraphs: [
          "The sign opposite a planet's domicile is its detriment: far from home, working against the grain. Mars in Libra; Venus in Aries.",
        ],
        see: ["domicile", "dignity"],
      },
      {
        id: "fall",
        term: "Fall",
        paragraphs: [
          "The sign opposite a planet's exaltation is its fall: brought low. The Sun in Libra; the Moon in Scorpio.",
        ],
        see: ["exaltation", "dignity"],
      },
      {
        id: "sect",
        term: "Sect",
        paragraphs: [
          "Charts divide into day and night, by whether the Sun was above the horizon at birth. The Sun, Jupiter and Saturn belong to the day; the Moon, Venus and Mars to the night; Mercury joins the day as a morning star and the night as an evening star. A planet of the chart's own sect acts more easily.",
          "Sect fell out of use for centuries, and was recovered by the traditional revival that began in the 1990s.",
        ],
        inPlay: "A planet whose sect matches its chart's gains luck.",
        see: ["planet"],
      },
    ],
  },
  {
    heading: "Condition",
    entries: [
      {
        id: "affliction",
        term: "Affliction",
        paragraphs: [
          "A planet is afflicted when something harms it — the malefics Mars and Saturn, a hard aspect from them, or standing too near the Sun. An afflicted planet struggles to deliver what it signifies.",
        ],
        inPlay: "Afflict is one of the two verbs: a planet sends its affliction, and what it reaches accumulates it. The arc around each planet shows how much more it can take.",
        see: ["testimony", "combustion"],
      },
      {
        id: "testimony",
        term: "Testimony",
        paragraphs: [
          "A planet testifies to a matter when it bears witness to it — aspecting it, ruling it, lending it strength. The more testimony a matter gathers, the surer its outcome.",
        ],
        inPlay: "Testify is the other verb: a planet sends its testimony, which relieves affliction. It defends a planet, but never brings back one that has combusted.",
        see: ["affliction", "combustion"],
      },
      {
        id: "combustion",
        term: "Combustion",
        paragraphs: [
          "A planet too close to the Sun is combust — its light overwhelmed, unable to show itself or act. The tradition counted it among the worst conditions a planet could suffer.",
        ],
        inPlay: "A planet combusts when its affliction reaches its Resolve, and goes dark. It can return between maps on a roll of its Fortune, or be called back in a house — at half Resolve.",
        see: ["affliction", "testimony"],
      },
    ],
  },
];
