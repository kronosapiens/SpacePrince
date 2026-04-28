import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { TurnDots } from "@/components/TurnDots";
import { OpponentIndicator } from "@/components/OpponentIndicator";
import { DistanceReadout } from "@/components/DistanceReadout";
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

  // Tint to the opponent-of-the-turn (constant of the turn) per STYLE.md §5.
  useEffect(() => {
    setActive(opponentTurn);
  }, [opponentTurn, setActive]);

  const playerUnlocked = useMemo(
    () => unlockedPlanets(profile.lifetimeEncounterCount, devUnlockAll),
    [profile.lifetimeEncounterCount, devUnlockAll],
  );

  // Projection — when the player has tap-previewed a planet, compute the
  // affliction deltas that would land on each side if they commit.
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
      // First tap = preview; second tap on same planet = commit.
      if (selected !== planet) {
        setSelected(planet);
        return;
      }
      // Commit
      const rng = mulberry32((run.seed ^ encounter.turnIndex ^ Date.now()) >>> 0);
      const result = resolveTurn(run, profile.chart, planet, rng);
      if (!result) return;
      let nextRun = result.run;
      if (result.encounterEnded) {
        // Award lifetime encounter increment when the encounter completes.
        const nextProfile: Profile = {
          ...profile,
          lifetimeEncounterCount: profile.lifetimeEncounterCount + 1,
        };
        saveProfile(nextProfile);
        setProfile(nextProfile);
        // Capture outcome on the map node for End-of-Run inspection.
        const combusts = PLANETS.filter((p) =>
          nextRun.perPlanetState[p].combusted && !run.perPlanetState[p].combusted,
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
      // Settle phase — gives the eye a beat to register the change before
      // the next opponent planet shows up. Roughly the trine duration.
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
    // Clear encounter, return to map.
    const cleared: RunState = { ...run, currentEncounter: null };
    saveRun(cleared);
    setRun(cleared);
    navigate(ROUTES.map);
  };

  return (
    <div className="encounter">
      <div className="encounter-side">
        <Chart
          chart={profile.chart}
          state={run.perPlanetState}
          unlockedPlanets={playerUnlocked}
          selectedPlanet={selected}
          hoveredPlanet={hovered}
          entrance="left"
          side="self"
          onPlanetClick={handlePlayerClick}
          onPlanetHover={setHovered}
          projection={projection ? { deltas: projection.self } : undefined}
        />
      </div>

      <div className="encounter-seam">
        <TurnDots total={encounter.sequence.length} current={encounter.turnIndex} />
        {!encounter.resolved && <OpponentIndicator planet={opponentTurn} />}
        {encounter.resolved && (
          <div className="opponent-indicator" style={{ opacity: 0.7 }}>
            <div>{run.over ? "Combust" : "Settled"}</div>
          </div>
        )}
        <DistanceReadout value={run.runDistance} />
      </div>

      <div className="encounter-side">
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
      </div>

      {encounter.resolved && (
        <div
          className="continue-prompt anim-fragment-in"
          style={{ position: "fixed", bottom: 28, left: 0, right: 0, zIndex: 5 }}
        >
          <button className="continue-prompt-btn" onClick={handleContinue}>
            {run.over ? "Walk back" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
