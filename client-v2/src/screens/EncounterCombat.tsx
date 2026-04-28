import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { VesicaSeam } from "@/components/VesicaSeam";
import { ROUTES } from "@/routes";
import { resolveTurn } from "@/game/turn";
import { mulberry32 } from "@/game/rng";
import { unlockedPlanets } from "@/game/unlocks";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { saveRun } from "@/state/run-store";
import { saveProfile } from "@/state/profile";
import { PLANETS } from "@/game/data";
import { computeProjectedEffects } from "@/game/projections";
import { getAspects } from "@/game/aspects";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import type {
  CombatEncounter,
  NodeOutcome,
  PlanetName,
  Profile,
  RunState,
} from "@/game/types";

interface CombatScreenProps {
  run: RunState;
  profile: Profile;
  encounter: CombatEncounter;
  setRun: (r: RunState) => void;
  setProfile: (p: Profile) => void;
  devUnlockAll: boolean;
}

export function EncounterCombatScreen(props: CombatScreenProps) {
  const { run, profile, encounter, setRun, setProfile, devUnlockAll } = props;
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();

  const [selected, setSelected] = useState<PlanetName | null>(null);
  const [hovered, setHovered] = useState<PlanetName | null>(null);
  const [hoveredOpponent, setHoveredOpponent] = useState<PlanetName | null>(null);
  const [settling, setSettling] = useState(false);

  const opponentTurn = encounter.sequence[encounter.turnIndex] ?? null;

  useEffect(() => {
    setActive(opponentTurn);
  }, [opponentTurn, setActive]);

  const playerUnlocked = useMemo(
    () => unlockedPlanets(profile.lifetimeEncounterCount, devUnlockAll),
    [profile.lifetimeEncounterCount, devUnlockAll],
  );

  const projection = useMemo(() => {
    if (!selected || !opponentTurn) return null;
    if (run.perPlanetState[selected].combusted) return null;
    const playerAspects = getAspects(profile.chart);
    const opponentAspects = getAspects(encounter.opponentChart);
    return computeProjectedEffects({
      playerChart: profile.chart,
      opponentChart: encounter.opponentChart,
      playerPlanet: selected,
      opponentPlanet: opponentTurn,
      playerState: run.perPlanetState,
      opponentState: encounter.opponentState,
      playerAspects,
      opponentAspects,
    });
  }, [selected, opponentTurn, run.perPlanetState, encounter.opponentState, encounter.opponentChart, profile.chart]);

  const handlePlayerClick = useCallback(
    (planet: PlanetName) => {
      if (encounter.resolved || settling) return;
      if (!playerUnlocked.includes(planet)) return;
      if (run.perPlanetState[planet].combusted) return;
      if (selected !== planet) {
        setSelected(planet);
        return;
      }
      const rng = mulberry32((run.seed ^ encounter.turnIndex ^ Date.now()) >>> 0);
      const result = resolveTurn(run, profile.chart, planet, rng);
      if (!result) return;
      let nextRun = result.run;
      if (result.encounterEnded) {
        const nextProfile: Profile = {
          ...profile,
          lifetimeEncounterCount: profile.lifetimeEncounterCount + 1,
        };
        saveProfile(nextProfile);
        setProfile(nextProfile);
        const combusts = PLANETS.filter(
          (p) => nextRun.perPlanetState[p].combusted && !run.perPlanetState[p].combusted,
        );
        const outcome: NodeOutcome = {
          nodeId: nextRun.currentMap.currentNodeId,
          kind: "combat",
          summary: `Combat · ${result.encounter.opponentChart.name}`,
          distanceDelta: nextRun.runDistance - run.runDistance,
          combusts,
        };
        nextRun = {
          ...nextRun,
          currentMap: {
            ...nextRun.currentMap,
            outcomes: { ...nextRun.currentMap.outcomes, [outcome.nodeId]: outcome },
          },
        };
      }
      saveRun(nextRun);
      setRun(nextRun);
      setSelected(null);
      setSettling(true);
      window.setTimeout(() => setSettling(false), 1000);
    },
    [encounter, profile, run, selected, playerUnlocked, setProfile, setRun, settling],
  );

  const handleContinue = () => {
    if (run.over) {
      navigate(ROUTES.end);
      return;
    }
    const cleared: RunState = { ...run, currentEncounter: null };
    saveRun(cleared);
    setRun(cleared);
    navigate(ROUTES.map);
  };

  return (
    <div className="combat">
      <div className="combat-side">
        <Chart
          chart={profile.chart}
          state={run.perPlanetState}
          unlockedPlanets={playerUnlocked}
          selectedPlanet={selected}
          hoveredPlanet={hovered}
          inspectPlanet={selected}
          entrance="left"
          side="self"
          onPlanetClick={handlePlayerClick}
          onPlanetHover={setHovered}
          projection={projection ? { deltas: projection.self } : undefined}
        />
        <div className="combat-side-label">SELF</div>
      </div>

      <div className="combat-seam">
        {!encounter.resolved && opponentTurn && (
          <div className="combat-opp-of-turn">
            <span className="eyebrow">ANSWER</span>
            <span
              className="combat-opp-glyph"
              style={{ color: PLANET_PRIMARY[opponentTurn] }}
            >
              {PLANET_GLYPH[opponentTurn]}
            </span>
            <span className="combat-opp-name">{opponentTurn.toUpperCase()}</span>
          </div>
        )}
        {encounter.resolved && (
          <div className="combat-opp-of-turn is-dim">
            <span className="combat-opp-name">{run.over ? "COMBUST" : "SETTLED"}</span>
          </div>
        )}

        <div className="combat-vesica">
          <VesicaSeam planet={opponentTurn ?? "Mars"} />
        </div>

        <div className="combat-turn-dots">
          {Array.from({ length: encounter.sequence.length }).map((_, i) => {
            const cls = i < encounter.turnIndex ? "is-on" :
                        i === encounter.turnIndex ? "is-current" : "";
            return <span key={i} className={`combat-dot ${cls}`} />;
          })}
        </div>

        <div className="combat-distance">
          <span className="eyebrow">DISTANCE</span>
          <span className="combat-distance-v">{Math.round(run.runDistance)}</span>
        </div>
      </div>

      <div className="combat-side">
        <Chart
          chart={encounter.opponentChart}
          state={encounter.opponentState}
          activePlanet={opponentTurn}
          hoveredPlanet={hoveredOpponent}
          entrance="right"
          side="other"
          onPlanetHover={setHoveredOpponent}
          projection={projection ? { deltas: projection.other } : undefined}
          passive
        />
        <div className="combat-side-label">OTHER</div>
      </div>

      {encounter.resolved && (
        <div className="continue-prompt">
          <button className="begin-btn" onClick={handleContinue}>
            {run.over ? "Walk back" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
