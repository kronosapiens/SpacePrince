import jsYaml from "js-yaml";
import type { PlanetName } from "@/game/types";
import { hashString } from "@/game/rng";

import sunYaml from "@planets/sun.yaml?raw";
import moonYaml from "@planets/moon.yaml?raw";
import mercuryYaml from "@planets/mercury.yaml?raw";
import venusYaml from "@planets/venus.yaml?raw";
import marsYaml from "@planets/mars.yaml?raw";
import jupiterYaml from "@planets/jupiter.yaml?raw";
import saturnYaml from "@planets/saturn.yaml?raw";

export interface RawFragment {
  text: string;
  author?: string;
  source?: string;
  translation?: string;
  source_url?: string;
  moods?: string[];
}

export interface Fragment extends RawFragment {
  id: string;
  planet: PlanetName;
  text: string;
  moods: string[];
}

const RAW: Record<PlanetName, string> = {
  Sun: sunYaml,
  Moon: moonYaml,
  Mercury: mercuryYaml,
  Venus: venusYaml,
  Mars: marsYaml,
  Jupiter: jupiterYaml,
  Saturn: saturnYaml,
};

let _cache: Record<PlanetName, Fragment[]> | null = null;

export function loadFragments(): Record<PlanetName, Fragment[]> {
  if (_cache) return _cache;
  const out = {} as Record<PlanetName, Fragment[]>;
  for (const planet of Object.keys(RAW) as PlanetName[]) {
    const raw = jsYaml.load(RAW[planet]) as RawFragment[] | null;
    const list = (raw ?? []).map((f) => ({
      ...f,
      planet,
      moods: f.moods ?? [],
      text: f.text.trim(),
      id: `${planet.toLowerCase()}_${hashString(`${planet}::${f.text.trim()}`).toString(36)}`,
    }));
    out[planet] = list;
  }
  _cache = out;
  return out;
}
