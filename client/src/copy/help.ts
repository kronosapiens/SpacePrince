/** Screen-help copy — the chart study's "?" card. The gameplay surfaces
 *  teach themselves with a guide overlay instead (`GuideOverlay`).
 *  Every card runs three beats:
 *    1. one sentence — the screen's purpose in the run, carrying stakes
 *       (the test: it should survive with the title deleted);
 *    2. two-three sentences — goals and affordances in one breath;
 *    3. a slightly longer close — the concepts that change decisions,
 *       never a systems manual (previews teach the numbers).
 *  Chrome register: plain second-person help, accurate to MECHANICS.md.
 *  Player-facing vocabulary is encounter / self / other —
 *  tension held and relieved; adversary is an internal dev term. Casing per SCREENS.md §1.2: named
 *  quantities capped (Resolve, Fortune, Light — TermText accents these);
 *  substances, processes, and stats lowercase in prose. */

export type HelpScreen = "chart";

export const SCREEN_HELP: Record<HelpScreen, { title: string; paragraphs: string[] }> = {
  chart: {
    title: "The Chart",
    paragraphs: [
      "Your chart is the character sheet, the save file, and the artifact you keep — one object, and everything in the game reads from it.",
      "Tap a planet to read it: the panel names its sign, its dignity there, and its stats — the small i opens fuller study notes. The arc around each planet shows the Resolve it has left. Planets drawn as faint outlines have not yet unlocked.",
      "Twelve signs ring the wheel; your seven planets hold the places the sky gave them at minting, and those places never change. The lines between them are aspects, and effects travel along them — green lines are soft and carry part of what lands onward in kind, red lines are hard and carry it inverted. When a planet's Resolve runs out it combusts and goes dark, dropping out of the web until it returns.",
    ],
  },
};
