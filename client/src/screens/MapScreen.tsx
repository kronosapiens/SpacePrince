import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { GameLayoutContext } from "./GameLayout";
import { BeginButton } from "@/components/BeginButton";
import { MapDiagram } from "@/components/MapDiagram";
import { MapGuide, type MapGuidePhase } from "@/components/MapGuide";
import { INSTRUCTION } from "@/copy/instruction";
import { MAP_COPY } from "@/copy/map";
import { Instruction } from "@/components/Instruction";
import { useFirstGuide } from "@/components/useFirstGuide";
import { usePrince, useActiveRun } from "@/state/PrinceStore";
import { playUISound, setTheme } from "@/audio/engine";
import { isOver, MAPS_PER_RUN, shouldRolloverMap } from "@/game/run";
import { useEnterNode, useRolloverMap, useStartRun } from "@/state/store-actions";
import { loadDevSettings } from "@/state/settings";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { unlockedPlanets } from "@/game/unlocks";
import { TERMINAL_NODE_ID } from "@/game/map-gen";
import { HOUSES } from "@/data/houses";
import { chartRuler } from "@/game/chart";
import { nodeRuler } from "@/game/map-content";
import { timings } from "@/svg/timings";
import type { MapState, PlanetName } from "@/game/types";

/** Roman numerals for the current map. */
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function MapScreen() {
  const prince = usePrince();
  const run = useActiveRun();
  const enterNode = useEnterNode();
  const rolloverMap = useRolloverMap();
  const startRun = useStartRun();
  const { setActive } = useActivePlanet();
  const { guideOpen, setGuideOpen, openingActive } = useOutletContext<GameLayoutContext>();
  const [guidePhase, setGuidePhase] = useState<MapGuidePhase>("map");
  const [crossing, setCrossing] = useState<"close" | "arrive" | null>(null);
  const runOver = !!prince && !!run && isOver(run, prince.chart, prince.numRelationalEncounters);
  const finished = !!prince && !!run && shouldRolloverMap(run, prince.chart, prince.numRelationalEncounters);
  const lastMap = !!run && run.mapsCompleted >= MAPS_PER_RUN - 1;
  // A finished map other than the seventh stays until the player crosses.
  const waiting = finished && !lastMap;
  const openGuide = useCallback(() => {
    setGuidePhase("map");
    setGuideOpen(true);
  }, [setGuideOpen]);
  useFirstGuide("map", !openingActive, openGuide);

  const settings = loadDevSettings();
  const playerUnlocked = useMemo(
    () => (prince ? unlockedPlanets(prince.numRelationalEncounters, settings.unlockAll) : []),
    [prince, settings.unlockAll],
  );

  const tintPlanet = useMemo<PlanetName | null>(() => {
    if (!run) return null;
    return mapTintPlanet(run.map, playerUnlocked);
  }, [run, playerUnlocked]);

  useEffect(() => {
    setActive(tintPlanet);
  }, [tintPlanet, setActive]);

  // The score: on the map you hear yourself — the Prince's own chart ruler,
  // at the down mix (MUSIC.md: theme by planet, variant by surface).
  const princeRuler = prince ? chartRuler(prince.chart) : null;
  useEffect(() => {
    if (princeRuler) setTheme(princeRuler, "map");
  }, [princeRuler]);

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!run || !prince || runOver || openingActive) return;
      enterNode(nodeId);
      playUISound("commit");
    },
    [run, prince, runOver, openingActive, enterNode],
  );

  // The seventh map ends the run in place.
  useEffect(() => {
    if (!run || !prince || !finished || !lastMap) return;
    rolloverMap(run, prince.chart, playerUnlocked);
  }, [run, prince, finished, lastMap, playerUnlocked, rolloverMap]);

  useEffect(() => {
    if (crossing !== "close" || !run || !prince) return;
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : timings().crossing.close;
    const timer = window.setTimeout(() => {
      // The chart + fielded roster cross the map boundary (MECHANICS §11.3):
      // uncombust rolls, seeded by the new map.
      rolloverMap(run, prince.chart, playerUnlocked);
      setCrossing("arrive");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [crossing, run, prince, playerUnlocked, rolloverMap]);

  if (!prince || !run) return null;

  const mapIndex = Math.min(run.mapsCompleted, MAPS_PER_RUN - 1);
  const beginNew = () => {
    startRun();
    playUISound("commit");
  };
  const cross = () => {
    if (crossing) return;
    setCrossing("close");
    playUISound("commit");
  };
  const motion = crossing === "close" ? "anim-crossing-close"
    : crossing === "arrive" ? "anim-crossing-arrive" : "anim-surface-in";

  return (
    <>
      <MapGuide
        open={guideOpen}
        phase={guidePhase}
        map={run.map}
        unlockedPlanets={playerUnlocked}
        examplePlanet={playerUnlocked[0] ?? "Moon"}
        onOpen={() => { if (!openingActive) openGuide(); }}
        onClose={() => setGuideOpen(false)}
        onPhaseChange={setGuidePhase}
      />
      {!guideOpen && !openingActive && !runOver && !waiting && (
        <Instruction text={INSTRUCTION.map.node} />
      )}
      <div className={`map-content ${motion}`}>
        <div className="map-diagram-wrap">
          <MapDiagram map={run.map} unlockedPlanets={playerUnlocked} onSelectNode={runOver || openingActive ? undefined : guideOpen ? noop : handleNodeSelect} />
        </div>
        <div className="map-index">
          <span className="map-index-v">{ROMAN[mapIndex]}</span>
        </div>
        {waiting && <BeginButton onClick={cross} disabled={guideOpen || openingActive}>{MAP_COPY.continue}</BeginButton>}
        {runOver && <BeginButton onClick={beginNew} disabled={guideOpen}>{MAP_COPY.newRun}</BeginButton>}
      </div>
    </>
  );
}

const noop = () => {};

/** Pick a planet for the active-planet tint of a map screen. Prefer the
 *  current node's ruler (where the player is standing); fall back to the
 *  terminal node's ruler (the destination) so freshly-entered maps still
 *  carry a color. Returns null if neither has been rolled yet. */
function mapTintPlanet(map: MapState, playerUnlocked: PlanetName[]): PlanetName | null {
  return rulerOf(map, map.currentNodeId, playerUnlocked) ?? rulerOf(map, TERMINAL_NODE_ID, playerUnlocked);
}

function rulerOf(map: MapState, nodeId: string | undefined, playerUnlocked: PlanetName[]): PlanetName | null {
  if (!nodeId) return null;
  const content = map.rolledNodes[nodeId];
  if (!content) return null;
  if (content.kind === "narrative") return HOUSES[content.house - 1]!.ruler;
  return nodeRuler(content, playerUnlocked);
}
