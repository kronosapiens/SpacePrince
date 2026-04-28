import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ChartAnchor } from "@/components/ChartAnchor";
import { MapDiagram } from "@/components/MapDiagram";
import { DistanceReadout } from "@/components/DistanceReadout";
import { ROUTES } from "@/routes";
import { loadProfile } from "@/state/profile";
import { loadRun, saveRun } from "@/state/run-store";
import { loadDevSettings } from "@/state/settings";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { mulberry32, randomSeed, hashString } from "@/game/rng";
import { rollNodeContent } from "@/game/map-content";
import { unlockedPlanets } from "@/game/unlocks";
import { eligibleNext, TERMINAL_NODE_ID } from "@/game/map-gen";
import { beginRun, rolloverMap } from "@/game/run";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { HOUSES } from "@/data/houses";
import { pickFragment } from "@/data/chorus";
import { getTree } from "@/data/narrative-trees";
import type {
  EncounterState,
  Profile,
  RunState,
  NodeContent,
} from "@/game/types";

export function MapScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [run, setRun] = useState<RunState | null>(() => {
    const p = loadProfile();
    if (!p) return null;
    const existing = loadRun();
    if (existing && !existing.over) return existing;
    const fresh = beginRun(p);
    saveRun(fresh);
    return fresh;
  });
  const { setActive } = useActivePlanet();

  void setProfile;
  // Map ambient tint fades to neutral on mount.
  useEffect(() => {
    setActive(null);
  }, [setActive]);

  const settings = useMemo(() => loadDevSettings(), []);
  const playerUnlocked = useMemo(
    () => (profile ? unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll) : []),
    [profile, settings.unlockAll],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!run || !profile) return;
      // Roll content for the target node if not yet rolled.
      let nextRun: RunState = { ...run };
      const existing = nextRun.currentMap.rolledNodes[nodeId];
      let content: NodeContent;
      if (existing) {
        content = existing;
      } else {
        const rng = mulberry32(hashString(`${run.currentMap.seed}_${nodeId}`));
        content = rollNodeContent({
          rng,
          lastNarrativeHouse: nextRun.currentMap.lastNarrativeHouse,
          forceNarrativeHouse: settings.forceNarrativeHouse,
          forceCombat: settings.forceCombat,
        });
        nextRun = {
          ...nextRun,
          currentMap: {
            ...nextRun.currentMap,
            rolledNodes: { ...nextRun.currentMap.rolledNodes, [nodeId]: content },
            lastNarrativeHouse: content.kind === "narrative" ? content.house : nextRun.currentMap.lastNarrativeHouse,
          },
        };
      }

      // Move player to the node.
      nextRun = {
        ...nextRun,
        currentMap: {
          ...nextRun.currentMap,
          currentNodeId: nodeId,
          visitedNodeIds: nextRun.currentMap.visitedNodeIds.includes(nodeId)
            ? nextRun.currentMap.visitedNodeIds
            : [...nextRun.currentMap.visitedNodeIds, nodeId],
        },
      };

      // Begin the encounter at this node.
      let encounter: EncounterState;
      if (content.kind === "combat") {
        encounter = beginCombatEncounter({
          run: nextRun,
          opponentSeed: content.opponentSeed,
          lifetimeEncounterCount: profile.lifetimeEncounterCount,
          devUnlockAll: settings.unlockAll,
        });
      } else {
        const house = HOUSES[content.house - 1]!;
        const tree = getTree(content.house);
        const rng = mulberry32(hashString(`${run.id}_${content.house}_${nodeId}`));
        const fragment = pickFragment({
          planet: house.ruler,
          mood: tree.fragmentMood,
          exclude: nextRun.seenFragmentIds,
          rng,
        });
        encounter = beginNarrativeEncounter({
          run: nextRun,
          house: content.house,
          treeId: `house_${content.house}_v1`,
          rootNodeId: tree.rootId,
          fragmentId: fragment?.id ?? `${house.ruler.toLowerCase()}-stub`,
        });
      }
      nextRun = { ...nextRun, currentEncounter: encounter };
      saveRun(nextRun);
      setRun(nextRun);
      navigate(ROUTES.encounter);
    },
    [run, profile, settings, navigate],
  );

  // Auto-rollover when reaching the terminal node with no encounter.
  useEffect(() => {
    if (!run) return;
    if (run.currentEncounter) return;
    if (run.currentMap.currentNodeId !== TERMINAL_NODE_ID) return;
    const nextSeed = randomSeed();
    const next = rolloverMap(run, nextSeed);
    saveRun(next);
    setRun(next);
  }, [run]);

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  if (!run) return null;

  // If an encounter is mid-flight (e.g. browser refresh), bounce to it.
  if (run.currentEncounter) return <Navigate to={ROUTES.encounter} replace />;
  if (run.over) return <Navigate to={ROUTES.end} replace />;

  const eligible = eligibleNext(run.currentMap.graph, run.currentMap.currentNodeId);
  void eligible;

  return (
    <div className="map-screen">
      <div className="map-anchor">
        <ChartAnchor
          chart={profile.chart}
          state={run.perPlanetState}
          unlockedPlanets={playerUnlocked}
        />
      </div>
      <div className="map-distance">
        <DistanceReadout value={run.runDistance} />
      </div>
      <div className="map-diagram-wrap">
        <MapDiagram map={run.currentMap} onSelectNode={handleNodeSelect} />
      </div>
    </div>
  );
}
