import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChartAnchor } from "@/components/ChartAnchor";
import { MapDiagram } from "@/components/MapDiagram";
import { ROUTES } from "@/routes";
import { loadProfile } from "@/state/profile";
import { loadRun, saveRun } from "@/state/run-store";
import { loadDevSettings } from "@/state/settings";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { mulberry32, randomSeed, hashString } from "@/game/rng";
import { rollNodeContent } from "@/game/map-content";
import { unlockedPlanets } from "@/game/unlocks";
import { TERMINAL_NODE_ID } from "@/game/map-gen";
import { beginRun, rolloverMap } from "@/game/run";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { HOUSES } from "@/data/houses";
import { pickFragment } from "@/data/chorus";
import { getTree } from "@/data/narrative-trees";
import {
  generateSeedHash,
  getOrCreateDevProfile,
  makeDevMap,
  seedFromHash,
} from "@/state/dev-state";
import { blankSideState } from "@/game/chart";
import type {
  EncounterState,
  Profile,
  RunState,
  NodeContent,
} from "@/game/types";

const blankSideStateConst = blankSideState();

export function MapScreen() {
  const settings = loadDevSettings();
  if (settings.devModeActive) return <DevMapScreen />;
  return <NormalMapScreen />;
}

function NormalMapScreen() {
  const navigate = useNavigate();
  const [profile] = useState<Profile | null>(() => loadProfile());
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

  useEffect(() => {
    setActive(null); // map fades to neutral
  }, [setActive]);

  const settings = loadDevSettings();
  const playerUnlocked = useMemo(
    () => (profile ? unlockedPlanets(profile.lifetimeEncounterCount, settings.unlockAll) : []),
    [profile, settings.unlockAll],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!run || !profile) return;
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
  if (run.currentEncounter) return <Navigate to={ROUTES.encounter} replace />;
  if (run.over) return <Navigate to={ROUTES.end} replace />;

  const mapNumber = run.mapHistory.length + 1;
  const runNumber = profile.scarsLevel + 1;

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
        <span className="eyebrow">DISTANCE</span>
        <span className="map-distance-v">{Math.round(run.runDistance)}</span>
      </div>
      <div className="map-diagram-wrap">
        <MapDiagram map={run.currentMap} onSelectNode={handleNodeSelect} />
      </div>
      <div className="map-caption">
        <span className="eyebrow">RUN {roman(runNumber)} · MAP {roman(mapNumber)}</span>
      </div>
    </div>
  );
}

function roman(n: number): string {
  if (n <= 0) return "I";
  const numerals: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let v = n;
  let out = "";
  for (const [k, s] of numerals) {
    while (v >= k) { out += s; v -= k; }
  }
  return out;
}

// ── Dev mode map ───────────────────────────────────────────────────────────

function DevMapScreen() {
  const navigate = useNavigate();
  const { seed: seedHash } = useParams<{ seed?: string }>();

  // Bare /map → generate a hash and replace into the URL.
  useEffect(() => {
    if (!seedHash) {
      navigate(`${ROUTES.map}/${generateSeedHash()}`, { replace: true });
    }
  }, [seedHash, navigate]);

  const seed = seedHash ? seedFromHash(seedHash) : 0;
  const profile = useMemo(() => getOrCreateDevProfile(), []);
  const map = useMemo(() => makeDevMap(seed), [seed]);
  const { setActive } = useActivePlanet();
  useEffect(() => { setActive(null); }, [setActive]);

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      const content = map.rolledNodes[nodeId];
      if (!content) return;
      const nextHash = generateSeedHash();
      if (content.kind === "combat") {
        navigate(`${ROUTES.encounter}/${nextHash}`);
      } else {
        navigate(`${ROUTES.narrative}/${nextHash}?house=${content.house}`);
      }
    },
    [map, navigate],
  );

  if (!seedHash) return null; // wait for redirect

  return (
    <div className="map-screen">
      <div className="map-anchor">
        <ChartAnchor
          chart={profile.chart}
          state={blankSideStateConst}
          unlockedPlanets={unlockedPlanets(999)}
        />
      </div>
      <div className="map-distance">
        <span className="eyebrow">DISTANCE</span>
        <span className="map-distance-v">—</span>
      </div>
      <div className="map-diagram-wrap">
        <MapDiagram map={map} onSelectNode={handleNodeSelect} />
      </div>
      <div className="map-caption">
        <span className="eyebrow">DEV · {seedHash}</span>
      </div>
    </div>
  );
}
