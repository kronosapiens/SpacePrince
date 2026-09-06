/** Screen-help copy — the chart study's "?" card. The gameplay surfaces
 *  teach themselves with a guide overlay instead (`GuideOverlay`).
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

export type HelpScreen = "chart";

export const SCREEN_HELP: Record<HelpScreen, { title: string; paragraphs: string[] }> = {
  chart: {
    title: "The Chart",
    paragraphs: [
      "Your chart is the character sheet, the save file, and the artifact you keep — one object, and everything in the game reads from it.",
      "Tap a planet to read it: the panel names its sign, its dignity there, and its stats — the small i opens fuller study notes. The pill beside each planet counts its affliction. Planets drawn as faint outlines have not yet unlocked.",
      "Twelve signs ring the wheel; your seven planets hold the places the sky gave them at minting, and those places never change. The lines between them are aspects, and effects travel along them — green lines are soft and carry part of what lands onward in kind, red lines are hard and carry it inverted. When a planet's affliction reaches its Resolve it combusts and goes dark, dropping out of the web until it returns.",
    ],
  },
};
