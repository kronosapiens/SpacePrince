/** Screen-help copy — the "?" info card for each gameplay surface. Chrome
 *  register: plain second-person help, accurate to MECHANICS.md; no chorus
 *  voice. Player-facing vocabulary is encounter / self / other — tension
 *  held and relieved; combat and adversary are internal dev metaphors and
 *  never appear here (SCREENS.md). Drafted for iteration. */

export type HelpScreen = "map" | "combat" | "narrative";

export const SCREEN_HELP: Record<HelpScreen, { title: string; paragraphs: string[] }> = {
  map: {
    title: "The Map",
    paragraphs: [
      "Each map is a small constellation of encounters. Tap a node to consider it, tap it again to travel — paths lead onward, never back. Nothing is hidden: every node shows what it holds before you commit.",
      "Some nodes hold an encounter — self and other, two charts face to face. The rest open a scene in one of the twelve houses. Your chart stands beside the map — inspect it to study your planets between encounters.",
      "The far node crosses into the next map. Fortune turns at the crossing: each combusted planet rolls to return, and the lit ones take on fresh affliction. A run is seven maps at most; Distance is its lasting record.",
    ],
  },
  combat: {
    title: "The Encounter",
    paragraphs: [
      "The other commits first: its planet and its verb are shown before you choose. Answer with a planet of your own — tap it, choose Afflict or Testify, then tap the verb again to commit.",
      "Affliction builds tension. When it reaches a planet's Resolve, the planet combusts and goes quiet. Testimony relieves tension — and only testimony landed on the other's chart earns Distance. Combusting one of their planets is a trade: it acts no more, but what it carries can no longer be resolved.",
      "Effects ripple along aspect lines — soft aspects carry them onward, hard aspects invert them. Nothing here is rolled: the numbers you preview are the numbers that land. The encounter runs as many turns as the map you are on.",
    ],
  },
  narrative: {
    title: "The Houses",
    paragraphs: [
      "A scene from one of the twelve houses. Read it, then choose: tap an option to arm it, tap again to commit. Each option's aside names its price and its effect before you decide.",
      "Outcomes land on the chart itself — affliction taken or healed, Distance spent or earned, and sometimes a rite that calls a combusted planet back. Some doors open only under the right sky: the house's joy-planet, its ruler, or a planet already lost.",
      "A few choices are wagers, rolled against a planet's luck, the odds shown before you commit. Everything else resolves exactly as written.",
    ],
  },
};
