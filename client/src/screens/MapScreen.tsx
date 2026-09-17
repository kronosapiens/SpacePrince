import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { GameLayoutContext } from "./GameLayout";
import { BeginButton } from "@/components/BeginButton";
import { MapDiagram } from "@/components/MapDiagram";
import { MapGuide, ROMAN, type MapGuidePhase } from "@/components/MapGuide";
import { usePrince, usePrinceDispatch, useActiveRun } from "@/state/PrinceStore";
import { playUISound, setTheme } from "@/audio/engine";
import { isOver, MAPS_PER_RUN } from "@/game/run";
import { useRolloverMap, useStartRun } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { mulberry32, hashString } from "@/game/rng";
import { rollNodeContent } from "@/game/map-content";
import { unlockedPlanets } from "@/game/unlocks";
import { ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { PLANET_PRIMARY } from "@/svg/palette";
import { PLANET_GLYPH } from "@/svg/glyphs";
import { beginCombatEncounter, beginNarrativeEncounter } from "@/game/encounter";
import { HOUSES } from "@/data/houses";
import { pickFragment } from "@/data/chorus";
import { pickScenario } from "@/data/narrative-scenarios";
import { chartRuler, seededChart } from "@/game/chart";
import type {
  EncounterState,
  MapState,
  PlanetName,
  Run,
} from "@/game/types";

export function MapScreen() {
  const prince = usePrince();
  const run = useActiveRun();
  const dispatch = usePrinceDispatch();
  const rolloverMap = useRolloverMap();
  const startRun = useStartRun();
  const { setActive } = useActivePlanet();
  const { guideOpen, setGuideOpen } = useOutletContext<GameLayoutContext>();
  const [guidePhase, setGuidePhase] = useState<MapGuidePhase>("map");
  const runOver = !!prince && !!run && isOver(run, prince.chart, prince.numEncounters);

  const tintPlanet = useMemo<PlanetName | null>(() => {
    if (!run) return null;
    return mapTintPlanet(run.map);
  }, [run]);

  useEffect(() => {
    setActive(tintPlanet);
  }, [tintPlanet, setActive]);

  // The score: on the map you hear yourself — the Prince's own chart ruler,
  // at the down mix (MUSIC.md: theme by planet, variant by surface).
  const princeRuler = prince ? chartRuler(prince.chart) : null;
  useEffect(() => {
    if (princeRuler) setTheme(princeRuler, "map");
  }, [princeRuler]);

  const settings = loadDevSettings();
  const playerUnlocked = useMemo(
    () => (prince ? unlockedPlanets(prince.numEncounters, settings.unlockAll) : []),
    [prince, settings.unlockAll],
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!run || !prince || runOver) return;
      let nextRun: Run = { ...run };
      // Content is pre-rolled at map creation; the dev force cheats re-roll
      // the node here so "the next node you enter" is the forced kind. The
      // !content fallback covers persisted maps that predate eager rolling.
      const forced = settings.forceCombat || !!settings.forceNarrativeHouse;
      let content = nextRun.map.rolledNodes[nodeId];
      if (!content || forced) {
        const rng = mulberry32(hashString(`${run.map.seed}_${nodeId}`));
        content = rollNodeContent({
          rng,
          forceNarrativeHouse: settings.forceNarrativeHouse,
          forceCombat: settings.forceCombat,
          combatRulers: playerUnlocked,
        });
        nextRun = {
          ...nextRun,
          map: {
            ...nextRun.map,
            rolledNodes: { ...nextRun.map.rolledNodes, [nodeId]: content },
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
        const scenario = pickScenario(content.house, nextRun.seenScenarioIds ?? [], rng);
        const fragment = pickFragment({
          planet: house.ruler,
          mood: scenario.fragmentMood,
          exclude: nextRun.seenFragmentIds,
          rng,
        });
        encounter = beginNarrativeEncounter({
          run: nextRun,
          house: content.house,
          scenarioId: scenario.scenarioId,
          fragmentId: fragment?.id ?? `${house.ruler.toLowerCase()}-stub`,
        });
        nextRun = {
          ...nextRun,
          seenScenarioIds: [...(nextRun.seenScenarioIds ?? []), scenario.scenarioId],
        };
      }
      nextRun = { ...nextRun, encounter };
      // Commit the pre-encounter run mutations (rolledNodes, visitedNodeIds,
      // currentNodeId, the new encounter) to the tail run. PlaySurface sees the
      // encounter and renders it — no navigation needed.
      dispatch({ kind: "commitRun", run: nextRun });
      playUISound("commit");
    },
    [run, prince, runOver, settings, playerUnlocked, dispatch],
  );

  useEffect(() => {
    if (!run || !prince || runOver) return;
    if (run.encounter) return;
    if (run.map.currentNodeId !== TERMINAL_NODE_ID) return;
    // The chart + fielded roster cross the map boundary (MECHANICS §11.3):
    // uncombust rolls, then the barrage, both seeded by the new map.
    rolloverMap(run, prince.chart, playerUnlocked);
  }, [run, prince, runOver, playerUnlocked, rolloverMap]);

  if (!prince || !run) return null;

  const mapIndex = Math.min(run.mapsCompleted, MAPS_PER_RUN - 1);
  const beginNew = () => {
    startRun();
    playUISound("commit");
  };

  // The boundary record shows only while standing at the root — what the
  // crossing did (§11.3), before the first step commits.
  const boundary = run.map.boundary;
  const showBoundary =
    !!boundary &&
    run.map.currentNodeId === ROOT_NODE_ID &&
    (boundary.uncombusts.length > 0 || boundary.barrage.length > 0);

  return (
    <>
      <MapGuide
        open={guideOpen}
        phase={guidePhase}
        map={run.map}
        examplePlanet={playerUnlocked[0] ?? "Moon"}
        mapsCompleted={mapIndex}
        showBoundary={showBoundary}
        onOpen={() => { setGuidePhase("map"); setGuideOpen(true); }}
        onClose={() => setGuideOpen(false)}
        onPhaseChange={setGuidePhase}
      />
      <div className="map-content anim-surface-in">
        <div className="map-diagram-wrap">
          <MapDiagram map={run.map} onSelectNode={runOver ? undefined : guideOpen ? noop : handleNodeSelect} />
        </div>
        <div className="map-index" data-guide="map-index">
          <span className="map-index-v">{ROMAN[mapIndex]}</span>
        </div>
        {showBoundary && boundary && (
          <div className="map-boundary" data-guide="map-boundary">
            <span className="eyebrow">MAP {ROMAN[mapIndex]}</span>
            {boundary.uncombusts.map((u) => (
              <div key={`u-${u.planet}`} className="map-boundary-line">
                <span className="map-boundary-glyph" style={{ color: PLANET_PRIMARY[u.planet] }}>
                  {PLANET_GLYPH[u.planet]}
                </span>
                {u.success ? `${u.planet} uncombusts` : `${u.planet} stays combust`} ·{" "}
                {Math.round(u.chance * 100)}%
              </div>
            ))}
            {boundary.barrage.map((b) => (
              <div key={`b-${b.planet}`} className="map-boundary-line">
                <span className="map-boundary-glyph" style={{ color: PLANET_PRIMARY[b.planet] }}>
                  {PLANET_GLYPH[b.planet]}
                </span>
                {b.planet} +{b.amount} affliction{b.halved ? " · halved" : ""}
              </div>
            ))}
          </div>
        )}
        {runOver && <BeginButton onClick={beginNew} disabled={guideOpen}>New Run</BeginButton>}
      </div>
    </>
  );
}

const noop = () => {};

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
  return chartRuler(seededChart(content.opponentSeed, ""));
}
