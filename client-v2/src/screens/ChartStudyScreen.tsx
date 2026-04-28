import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { Chart } from "@/components/Chart";
import { loadProfile } from "@/state/profile";
import { loadRun } from "@/state/run-store";
import { loadDevSettings } from "@/state/settings";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { getAspects } from "@/game/aspects";
import { wholeSignHouses } from "@/game/chart";
import type { PlanetName, Profile, RunState } from "@/game/types";

export function ChartStudyScreen() {
  const [profile] = useState<Profile | null>(() => loadProfile());
  const [run] = useState<RunState | null>(() => loadRun());
  const [selected, setSelected] = useState<PlanetName | null>(null);
  const { setActive } = useActivePlanet();

  useEffect(() => {
    setActive(null);
  }, [setActive]);

  const meta = useMemo(() => {
    if (!profile || !selected) return null;
    const placement = profile.chart.planets[selected];
    const houses = wholeSignHouses(profile.chart.ascendantSign);
    let houseNum = 1;
    for (let i = 1; i <= 12; i++) {
      if (houses[i] === placement.sign) { houseNum = i; break; }
    }
    const aspects = getAspects(profile.chart);
    const summary = aspects
      .filter((a) => a.from === selected && a.from < a.to)
      .map((a) => `${a.aspect.toLowerCase()} ${a.to.toLowerCase()}`)
      .join(" · ");
    const afflictionCount = run ? Math.round(run.perPlanetState[selected].affliction) : 0;
    return {
      label: `${selected.toUpperCase()} · ${placement.sign.toUpperCase()} · ${houseNum}${ordinal(houseNum)} HOUSE`,
      name: planetEpithet(selected, placement.sign),
      meta: [
        afflictionCount > 0 ? `${afflictionCount} affliction${afflictionCount === 1 ? "" : "s"}` : null,
        summary || null,
      ].filter(Boolean).join(" · "),
    };
  }, [profile, selected, run]);

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  const settings = loadDevSettings();
  const unlocked = unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll);

  return (
    <div className="study">
      <div className="study-chart-wrap">
        <Chart
          chart={profile.chart}
          state={run?.perPlanetState}
          unlockedPlanets={unlocked}
          inspectPlanet={selected}
          showColorField
          showSubstrate
          onPlanetClick={(p) => setSelected((cur) => (cur === p ? null : p))}
        />
      </div>
      <div className="study-caption">
        {meta ? (
          <>
            <span className="eyebrow">{meta.label}</span>
            <div className="study-name"><em>{meta.name}</em></div>
            {meta.meta && <div className="study-meta">{meta.meta}</div>}
          </>
        ) : (
          <span className="eyebrow">Tap a planet to inspect</span>
        )}
      </div>
      <Link className="title-second" to={ROUTES.title} style={{ marginTop: 12 }}>Back</Link>
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 1) return "ST";
  if (n === 2) return "ND";
  if (n === 3) return "RD";
  return "TH";
}

function planetEpithet(planet: PlanetName, sign: import("@/game/types").SignName): string {
  const phrases: Record<PlanetName, string> = {
    Sun: "Light, sovereign",
    Moon: "Silver, reflective",
    Mercury: "Quicksilver, shifting",
    Venus: "Copper, attuned",
    Mars: "Iron, cutting",
    Jupiter: "Royal blue, expansive",
    Saturn: "Lead, dark earth",
  };
  void sign;
  return phrases[planet] + ".";
}
