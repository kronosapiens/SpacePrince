import type { PlanetName, SignName } from "@/game/types";

// Append U+FE0E (Variation Selector-15) to force text-presentation rendering.
// Without it, macOS / iOS fall back to colored emoji glyphs with their own backgrounds.
const VS15 = "︎";

export const PLANET_GLYPH: Record<PlanetName, string> = {
  Sun: "☉" + VS15,
  Moon: "☽" + VS15,
  Mercury: "☿" + VS15,
  Venus: "♀" + VS15,
  Mars: "♂" + VS15,
  Jupiter: "♃" + VS15,
  Saturn: "♄" + VS15,
};

export const SIGN_GLYPH: Record<SignName, string> = {
  Aries: "♈" + VS15,
  Taurus: "♉" + VS15,
  Gemini: "♊" + VS15,
  Cancer: "♋" + VS15,
  Leo: "♌" + VS15,
  Virgo: "♍" + VS15,
  Libra: "♎" + VS15,
  Scorpio: "♏" + VS15,
  Sagittarius: "♐" + VS15,
  Capricorn: "♑" + VS15,
  Aquarius: "♒" + VS15,
  Pisces: "♓" + VS15,
};
