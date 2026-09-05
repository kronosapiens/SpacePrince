/** Screen-help copy — the "?" info card for each gameplay surface.
 *  Every card runs three beats:
 *    1. one sentence — the screen's purpose in the run, carrying stakes
 *       (the test: it should survive with the title deleted);
 *    2. two-three sentences — goals and affordances in one breath;
 *    3. a slightly longer close — the concepts that change decisions,
 *       never a systems manual (previews teach the numbers).
 *  Chrome register: plain second-person help, accurate to MECHANICS.md; no
 *  chorus voice. Player-facing vocabulary is encounter / self / other —
 *  tension held and relieved; combat and adversary are internal dev
 *  metaphors and never appear here. Casing per SCREENS.md §1.2: named
 *  quantities capped (Resolve, Fortune, Light — TermText golds these);
 *  substances, processes, and stats lowercase in prose. */

export type HelpScreen = "map" | "combat" | "narrative" | "chart";

export const SCREEN_HELP: Record<HelpScreen, { title: string; paragraphs: string[] }> = {
  map: {
    title: "The Map",
    paragraphs: [
      "The run is this crossing: a small constellation of encounters, traveled one way; the Light it gathers is what remains.",
      "Choose your path node by node — tap a node to consider it, tap it again to travel. Nothing is hidden: every node shows what it holds before you commit. Your chart stands beside the map; inspect it to study your planets between encounters.",
      "Some nodes hold an encounter, self and other face to face; the rest open a scene in one of the twelve houses. The far node crosses into the next map, and Fortune turns at the crossing: each combusted planet rolls to return, and the lit ones take on fresh affliction. A run is seven maps at most, and encounters run one turn longer with each map.",
    ],
  },
  combat: {
    title: "The Encounter",
    paragraphs: [
      "This is where Light gathers: self and other, two charts face to face, holding and relieving tension.",
      "Every encounter has a ruler — the planet whose color its node carries on the map — and the ruler decides what gathers Light here; the rule is written under the readouts. Meet it while keeping your own planets from combusting. The other commits first, its planet and verb shown before you choose; answer by tapping a planet of your own, choosing Testify or Afflict, then tapping the verb again to commit.",
      "Affliction builds tension; when it reaches a planet's Resolve, the planet combusts and goes quiet. Combusting one of the other's planets is a trade — it acts no more, but what it carries can no longer be relieved. Effects ripple along aspect lines, soft aspects carrying them onward, hard aspects inverting them. Nothing is rolled: the numbers you preview are the numbers that land, and the encounter runs as many turns as the map you are on.",
    ],
  },
  chart: {
    title: "The Chart",
    paragraphs: [
      "Your chart is the character sheet, the save file, and the artifact you keep — one object, and everything in the game reads from it.",
      "Tap a planet to read it: the panel names its sign, its dignity there, and its stats — the small i opens fuller study notes. The pill beside each planet counts its affliction. Planets drawn as faint outlines have not yet unlocked.",
      "Twelve signs ring the wheel; your seven planets hold the places the sky gave them at minting, and those places never change. The lines between them are aspects, and effects travel along them — green lines are soft and carry part of what lands onward in kind, red lines are hard and carry it inverted. When a planet's affliction reaches its Resolve it combusts and goes dark, dropping out of the web until it returns.",
    ],
  },
  narrative: {
    title: "The Houses",
    paragraphs: [
      "Between encounters the run passes through the twelve houses, where the chart is tended — or taxed.",
      "Read the scene, then choose: tap an option to arm it, tap again to commit. Each option's aside names its price and its effect before you decide.",
      "Outcomes land on the chart itself — affliction taken or relieved, Light spent or gathered, and sometimes a rite that calls a combusted planet back. Some doors open only under the right sky: the house's joy-planet, its ruler, or a planet already lost. A few choices are wagers rolled against a planet's Fortune, the odds shown before you commit; everything else lands exactly as written.",
    ],
  },
};
