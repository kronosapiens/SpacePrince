import type { PlanetName } from "@/game/types";

export type HouseValence = "good" | "bad";
export type HouseKind =
  | "double-anchored"
  | "pure-angular"
  | "benefic-joy"
  | "contained-malefic"
  | "pure-bad-place";

export interface HouseDef {
  num: number;
  name: string;
  /** Short complementary gloss for UI (e.g. "health and service"). */
  gloss: string;
  classicalName: string;
  valence: HouseValence;
  /** Joy planet — mechanical conditioning lever. Null for the 5 houses without joys. */
  joy: PlanetName | null;
  /** Natural-zodiac ruler — visual color anchor (matches map node color). */
  ruler: PlanetName;
  kind: HouseKind;
  theme: string;
  angular: "ASC" | "IC" | "DSC" | "MC" | null;
}

/**
 * 12 houses per HOUSES.md §5. Joy column matches §3.3.
 * Ruler column = natural-zodiac sign rulership per SCREENS.md §4.5.
 */
export const HOUSES: HouseDef[] = [
  { num: 1,  name: "Self",            gloss: "the body and vitality",   classicalName: "Horoskopos",      valence: "good", joy: "Mercury", ruler: "Mars",    kind: "double-anchored",   theme: "Identity, the body, emergence — the chart's point of view.",                                          angular: "ASC" },
  { num: 2,  name: "Livelihood",      gloss: "money and resources",     classicalName: "Gate of Hades",   valence: "bad",  joy: null,      ruler: "Venus",   kind: "pure-bad-place",    theme: "Resources, scarcity, what one must secure to keep going.",                                            angular: null  },
  { num: 3,  name: "Communication",   gloss: "siblings and short trips", classicalName: "Goddess",         valence: "good", joy: "Moon",    ruler: "Mercury", kind: "benefic-joy",       theme: "Siblings, short journeys, dreams, daily speech — close, intimate.",                                   angular: null  },
  { num: 4,  name: "Home",            gloss: "roots and ancestry",      classicalName: "Hypogeion",       valence: "good", joy: null,      ruler: "Moon",    kind: "pure-angular",      theme: "Roots, ancestors, endings — the hidden foundation beneath the public self.",                         angular: "IC"  },
  { num: 5,  name: "Creativity",      gloss: "pleasure and play",       classicalName: "Good Fortune",    valence: "good", joy: "Venus",   ruler: "Sun",     kind: "benefic-joy",       theme: "Children, pleasure, play, generative delight.",                                                       angular: null  },
  { num: 6,  name: "Labor",           gloss: "health and service",      classicalName: "Bad Fortune",     valence: "bad",  joy: "Mars",    ruler: "Mercury", kind: "contained-malefic", theme: "Illness, servitude, toil — the body as a site of grinding work, contained when honestly employed.",  angular: null  },
  { num: 7,  name: "Relationships",   gloss: "partners and rivals",     classicalName: "Dysis",           valence: "good", joy: null,      ruler: "Venus",   kind: "pure-angular",      theme: "Partnership, contracts, open enemies — the threshold of the other.",                                  angular: "DSC" },
  { num: 8,  name: "Transformation",  gloss: "death and inheritance",   classicalName: "Argon",           valence: "bad",  joy: null,      ruler: "Mars",    kind: "pure-bad-place",    theme: "Death, inheritance, others' resources, crisis — the zero-sum house.",                                 angular: null  },
  { num: 9,  name: "Pilgrimage",      gloss: "wisdom and far places",   classicalName: "Theos",           valence: "good", joy: "Sun",     ruler: "Jupiter", kind: "benefic-joy",       theme: "Long journeys, wisdom, foreign lands — illumination at distance.",                                    angular: null  },
  { num: 10, name: "Achievement",     gloss: "career and reputation",   classicalName: "Mesouranema",     valence: "good", joy: null,      ruler: "Saturn",  kind: "pure-angular",      theme: "Reputation, public life, action visible to the world.",                                               angular: "MC"  },
  { num: 11, name: "Friendship",      gloss: "allies and fortune",      classicalName: "Agathos Daimon",  valence: "good", joy: "Jupiter", ruler: "Saturn",  kind: "benefic-joy",       theme: "Friends, allies, hopes, gifts that arrive from outside.",                                              angular: null  },
  { num: 12, name: "The Hidden",      gloss: "sorrow and the unseen",   classicalName: "Kakos Daimon",    valence: "bad",  joy: "Saturn",  ruler: "Jupiter", kind: "contained-malefic", theme: "Sorrows, hidden enemies, exile — slow heavy concealment, contained when honestly employed.",          angular: null  },
];
