export const ROUTES = {
  // The whole game is two routes: the Title/menu, and a single state-derived
  // play surface (mint / map / encounter / end all derive from the active run;
  // see PlaySurface + SCREENS.md). The Prince identity will live on /play as a
  // `?prince=` param once onchain.
  title: "/",
  play: "/play",
  index: "/__index",
} as const;
