import { useCallback, useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChartAnchor } from "@/components/ChartAnchor";
import { MapDiagram } from "@/components/MapDiagram";
import { ROUTES } from "@/routes";
import { useProfile } from "@/state/ProfileStore";
import { useRun, useRunDispatch } from "@/state/RunStore";
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
import { getTree } from "@/data/narrative-trees";
import {
  generateSeedHash,
  getOrCreateDevProfile,
  makeDevMap,
  seedFromHash,
  syntheticDevDistance,
} from "@/state/dev-state";
import { blankSideState, seededChart } from "@/game/chart";
import type {
  EncounterState,
  MapState,
  PlanetName,
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
  const profile = useProfile();
  const run = useRun();
  const dispatchRun = useRunDispatch();
  const startRun = useStartRun();
  const rolloverMap = useRolloverMap();
  const { setActive } = useActivePlanet();

  // Bootstrap: if we have a profile but no live run, start one. Persistence
  // is handled by the RunStore effect. If the run is `over`, leave it alone —
  // EndOfRunScreen handles the "Begin again" path via run/clear.
  useEffect(() => {
    if (!profile) return;
    if (run) return;
    startRun(profile);
  }, [profile, run, startRun]);

  // Tint follows the player's current node when it has content; otherwise
  // falls back to the terminal node's ruler (the map's destination), so a
  // freshly-entered map already carries the through-line color rather than
  // sitting on neutral bone until the first encounter resolves.
  const tintPlanet = useMemo<PlanetName | null>(() => {
    if (!run) return null;
    return mapTintPlanet(run.currentMap);
  }, [run]);

  useEffect(() => {
    setActive(tintPlanet);
  }, [tintPlanet, setActive]);

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
      // commitNarrative covers any pre-encounter run mutations (rolledNodes,
      // visitedNodeIds, currentNodeId). The reducer just adopts the new state.
      dispatchRun({ type: "run/commitNarrative", nextRun });
      navigate(ROUTES.encounter);
    },
    [run, profile, settings, navigate, dispatchRun],
  );

  useEffect(() => {
    if (!run) return;
    if (run.currentEncounter) return;
    if (run.currentMap.currentNodeId !== TERMINAL_NODE_ID) return;
    rolloverMap(run);
  }, [run, rolloverMap]);

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
  const distance = useMemo(() => syntheticDevDistance(seed, map), [seed, map]);
  const { setActive } = useActivePlanet();
  const tintPlanet = useMemo(() => mapTintPlanet(map), [map]);
  useEffect(() => { setActive(tintPlanet); }, [tintPlanet, setActive]);

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
        <span className="map-distance-v">{Math.round(distance)}</span>
      </div>
      <div className="map-diagram-wrap">
        <MapDiagram map={map} onSelectNode={handleNodeSelect} />
      </div>
    </div>
  );
}
