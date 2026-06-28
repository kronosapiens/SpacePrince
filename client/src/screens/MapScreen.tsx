import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ChartAnchor } from "@/components/ChartAnchor";
import { ChartStudyOverlay } from "@/components/ChartStudyOverlay";
import { MapDiagram } from "@/components/MapDiagram";
import { ROUTES } from "@/routes";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { isOver } from "@/game/run";
import { useStartRun, useRolloverMap } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { mulberry32, hashString } from "@/game/rng";
import { rollNodeContent } from "@/game/map-content";
import { unlockedPlanets } from "@/game/unlocks";
import { TERMINAL_NODE_ID } from "@/game/map-gen";
import { RULERSHIP } from "@/game/data";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { HOUSES } from "@/data/houses";
import { pickFragment } from "@/data/chorus";
import { pickScenario } from "@/data/narrative-trees";
import { seededChart } from "@/game/chart";
import type {
  EncounterState,
  MapState,
  PlanetName,
  Run,
  NodeContent,
} from "@/game/types";

export function MapScreen() {
  const navigate = useNavigate();
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const startRun = useStartRun();
  const rolloverMap = useRolloverMap();
  const { setActive } = useActivePlanet();
  const [studyOpen, setStudyOpen] = useState(false);

  // Bootstrap: a minted Prince with no runs yet gets one (StartScreen normally
  // appends the first run, but direct nav lands here). The tail run — over or
  // not — is left alone; an over run redirects to the End screen below.
  useEffect(() => {
    if (!prince) return;
    if (run) return;
    startRun();
  }, [prince, run, startRun]);

  // Tint follows the player's current node when it has content; otherwise
  // falls back to the terminal node's ruler (the map's destination), so a
  // freshly-entered map already carries the through-line color rather than
  // sitting on neutral bone until the first encounter resolves.
  const tintPlanet = useMemo<PlanetName | null>(() => {
    if (!run) return null;
    return mapTintPlanet(run.map);
  }, [run]);

  useEffect(() => {
    setActive(tintPlanet);
  }, [tintPlanet, setActive]);

  const settings = loadDevSettings();
  const playerUnlocked = useMemo(
    () => (prince ? unlockedPlanets(prince.numEncounters, settings.unlockAll) : []),
    [prince, settings.unlockAll],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!run || !prince) return;
      let nextRun: Run = { ...run };
      const existing = nextRun.map.rolledNodes[nodeId];
      let content: NodeContent;
      if (existing) {
        content = existing;
      } else {
        const rng = mulberry32(hashString(`${run.map.seed}_${nodeId}`));
        content = rollNodeContent({
          rng,
          lastNarrativeHouse: nextRun.map.lastNarrativeHouse,
          forceNarrativeHouse: settings.forceNarrativeHouse,
          forceCombat: settings.forceCombat,
        });
        nextRun = {
          ...nextRun,
          map: {
            ...nextRun.map,
            rolledNodes: { ...nextRun.map.rolledNodes, [nodeId]: content },
            lastNarrativeHouse: content.kind === "narrative" ? content.house : nextRun.map.lastNarrativeHouse,
          },
        };
      }

      nextRun = {
        ...nextRun,
        map: {
          ...nextRun.map,
          currentNodeId: nodeId,
          visitedNodeIds: nextRun.map.visitedNodeIds.includes(nodeId)
            ? nextRun.map.visitedNodeIds
            : [...nextRun.map.visitedNodeIds, nodeId],
        },
      };

      let encounter: EncounterState;
      if (content.kind === "combat") {
        encounter = beginCombatEncounter({
          run: nextRun,
          opponentSeed: content.opponentSeed,
          lifetimeEncounterCount: prince.numEncounters,
          devUnlockAll: settings.unlockAll,
        });
      } else {
        const house = HOUSES[content.house - 1]!;
        const rng = mulberry32(hashString(`${run.id}_${content.house}_${nodeId}`));
        const tree = pickScenario(content.house, nextRun.seenScenarioIds ?? [], rng);
        const fragment = pickFragment({
          planet: house.ruler,
          mood: tree.fragmentMood,
          exclude: nextRun.seenFragmentIds,
          rng,
        });
        encounter = beginNarrativeEncounter({
          run: nextRun,
          house: content.house,
          treeId: tree.scenarioId,
          rootNodeId: tree.rootId,
          fragmentId: fragment?.id ?? `${house.ruler.toLowerCase()}-stub`,
        });
        nextRun = {
          ...nextRun,
          seenScenarioIds: [...(nextRun.seenScenarioIds ?? []), tree.scenarioId],
        };
      }
      nextRun = { ...nextRun, encounter };
      // Commit the pre-encounter run mutations (rolledNodes, visitedNodeIds,
      // currentNodeId, the new encounter) to the tail run.
      dispatch({ kind: "commitRun", run: nextRun });
      navigate(ROUTES.encounter);
    },
    [run, prince, settings, navigate, dispatch],
  );

  useEffect(() => {
    if (!run || !prince) return;
    if (isOver(run, prince.numEncounters)) return; // ended (combust or completion)
    if (run.encounter) return;
    if (run.map.currentNodeId !== TERMINAL_NODE_ID) return;
    rolloverMap(run);
  }, [run, prince, rolloverMap]);

  if (!prince) return <Navigate to={ROUTES.title} replace />;
  if (!run) return null;
  if (run.encounter) return <Navigate to={ROUTES.encounter} replace />;
  if (isOver(run, prince.numEncounters)) return <Navigate to={ROUTES.end} replace />;

  return (
    <div className="map-screen">
      <div className="map-anchor">
        <ChartAnchor
          chart={prince.chart}
          state={run.state}
          unlockedPlanets={playerUnlocked}
          onExpand={() => setStudyOpen(true)}
        />
      </div>
      <div className="map-distance">
        <span className="eyebrow">DISTANCE</span>
        <span className="map-distance-v">{Math.round(run.distance)}</span>
      </div>
      <div className="map-diagram-wrap">
        <MapDiagram map={run.map} onSelectNode={handleNodeSelect} />
      </div>
      {studyOpen && (
        <ChartStudyOverlay
          chart={prince.chart}
          state={run.state}
          unlockedPlanets={playerUnlocked}
          onClose={() => setStudyOpen(false)}
        />
      )}
    </div>
  );
}

/** Pick a planet for the active-planet tint of a map screen. Prefer the
 *  current node's ruler (where the player is standing); fall back to the
 *  terminal node's ruler (the destination) so freshly-entered maps still
 *  carry a color. Returns null if neither has been rolled yet. */
function mapTintPlanet(map: MapState): PlanetName | null {
  return rulerOf(map, map.currentNodeId) ?? rulerOf(map, TERMINAL_NODE_ID);
}

function rulerOf(map: MapState, nodeId: string | undefined): PlanetName | null {
  if (!nodeId) return null;
  const content = map.rolledNodes[nodeId];
  if (!content) return null;
  if (content.kind === "narrative") return HOUSES[content.house - 1]!.ruler;
  const chart = seededChart(content.opponentSeed, "");
  return RULERSHIP[chart.ascendantSign];
}
