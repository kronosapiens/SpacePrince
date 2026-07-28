/** Screen-help copy — the "?" info card for each gameplay surface. Chrome
 *  register: plain second-person help, accurate to MECHANICS.md; no chorus
 *  voice. Drafted for iteration. */

export type HelpScreen = "map" | "combat" | "narrative";

export const SCREEN_HELP: Record<HelpScreen, { title: string; paragraphs: string[] }> = {
  map: {
    title: "The Map",
    paragraphs: [
      "Each map is a small constellation of encounters. Tap a node to consider it, tap it again to travel — paths lead onward, never back. Nothing is hidden: every node shows what it holds before you commit.",
      "Combat nodes hold an adversary. The rest open a scene in one of the twelve houses. Your chart stands beside the map — inspect it to study your planets between encounters.",
      "The far node crosses into the next map. Fortune turns at the crossing: each combusted planet rolls to return, and the barrage wounds the lit ones. A run is seven maps at most; Distance is its lasting record.",
    ],
  },
  combat: {
    title: "Combat",
    paragraphs: [
      "The adversary commits first: its planet and its verb are locked and revealed before you choose. Answer by tapping one of your planets, choosing Afflict or Testify, then tapping the verb again to commit.",
      "Affliction wounds. When it reaches a planet's Resolve, the planet combusts and falls silent. Testimony heals affliction away — and only testimony landed on the adversary's chart earns Distance. Combusting their planet is a trade: it can no longer act, but what afflicts it can no longer be resolved.",
      "Effects ripple along aspect lines — soft aspects carry them onward, hard aspects invert them. Nothing here is rolled: the numbers you preview are the numbers that land. The fight runs as many turns as the map you are on.",
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
