import { useMemo } from "react";
import { NODE_R } from "@/components/MapDiagram";
import { HOUSES } from "@/data/houses";
import { chartRuler, seededChart } from "@/game/chart";
import { eligibleNext, ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { PLANET_PRIMARY } from "@/svg/palette";
import {
  center,
  circleRect,
  GuideOverlay,
  type GuideNote,
  type GuideRect,
  type GuideRects,
  type GuideShapes,
} from "@/components/GuideOverlay";
import type { MapState, NodeContent, PlanetName } from "@/game/types";

export type MapGuidePhase = "map" | "nodes" | "chart";

interface MapGuideProps {
  open: boolean;
  phase: MapGuidePhase;
  map: MapState;
  /** Maps already crossed — the index the screen prints under the diagram. */
  mapsCompleted: number;
  /** The screen is showing the crossing's record, bottom-right. */
  showBoundary: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPhaseChange: (phase: MapGuidePhase) => void;
}

/** Which map the player is on, as the End screen's rainbow labels it. */
export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

const PHASE_LABEL: Record<MapGuidePhase, string> = {
  map: "Read the map",
  nodes: "What a node holds",
  chart: "Between encounters",
};

const PHASES: MapGuidePhase[] = ["map", "nodes", "chart"];

/** Node rings are sized in the map's own units around the measured disc, not
 *  around the group — the halo and invite ring around it breathe, and a ring
 *  that followed them would too. Past the invite ring (28 + its 3 stroke) and
 *  the tap-preview ring (32 + 1.2), inside the current node's halo (55). */
const NODE_REACH = 40;

function nodeAnchor(id: string) {
  return `node-${id}`;
}

/** A circle of `NODE_REACH` map units around a node's disc. The disc's box
 *  excludes its stroke, so its width is exactly the disc's diameter. */
function nodeCircle(id: string, rects: GuideRects): GuideRect | null {
  const disc = rects[id];
  if (!disc) return null;
  const scale = disc.width / (2 * NODE_R);
  return circleRect(center(disc), NODE_REACH * scale);
}

/** A node holding `kind`: one the player can reach if there is one, else one
 *  still ahead, else any rolled node other than the root (which carries
 *  Fortune's mark, not content). */
function pickNode(map: MapState, eligible: string[], kind: NodeContent["kind"]): string | null {
  const holds = (id: string) => map.rolledNodes[id]?.kind === kind;
  const ids = map.graph.nodes.map((n) => n.id).filter((id) => id !== ROOT_NODE_ID);
  const ahead = ids.filter((id) => !map.visitedNodeIds.includes(id));
  return eligible.find(holds) ?? ahead.find(holds) ?? ids.find(holds) ?? null;
}

function rulerName(ruler: PlanetName) {
  return <span style={{ color: PLANET_PRIMARY[ruler] }}>{ruler}</span>;
}

export function MapGuide({
  open,
  phase,
  map,
  mapsCompleted,
  showBoundary,
  onOpen,
  onClose,
  onPhaseChange,
}: MapGuideProps) {
  const notes = useMemo<GuideNote[]>(() => {
    const eligible = eligibleNext(map.graph, map.currentNodeId, map.visitedNodeIds);

    if (phase === "map") {
      const mapNotes: GuideNote[] = [
        {
          key: "here",
          anchor: nodeAnchor(map.currentNodeId),
          placement: "right",
          label: "You are here",
          body: <>The node you stand on. The path you have walked is drawn solid.</>,
        },
      ];
      const next = eligible[0];
      if (next) {
        mapNotes.push({
          key: "next",
          anchor: nodeAnchor(next),
          placement: "right",
          label: "Next steps",
          body: <>Lit nodes are one step ahead: tap one to consider it, tap again to travel. Nothing on the map is hidden.</>,
        });
      }
      if (map.currentNodeId !== TERMINAL_NODE_ID) {
        mapNotes.push({
          key: "crossing",
          anchor: nodeAnchor(TERMINAL_NODE_ID),
          placement: "right",
          label: "The crossing",
          body: <>The far node crosses into the next map. Fortune turns there: each combusted planet rolls to return, and the lit ones take on fresh affliction.</>,
        });
      }
      return mapNotes;
    }

    if (phase === "nodes") {
      const nodeNotes: GuideNote[] = [];
      const combatId = pickNode(map, eligible, "combat");
      const combat = combatId ? map.rolledNodes[combatId] : undefined;
      if (combatId && combat?.kind === "combat") {
        const ruler = chartRuler(seededChart(combat.opponentSeed, ""));
        nodeNotes.push({
          key: "encounter",
          anchor: nodeAnchor(combatId),
          placement: "right",
          label: "An encounter",
          body: <>Self and other, face to face. {rulerName(ruler)} rules this one, and decides what gathers Light there.</>,
        });
      }
      const houseId = pickNode(map, eligible, "narrative");
      const house = houseId ? map.rolledNodes[houseId] : undefined;
      if (houseId && house?.kind === "narrative") {
        const ruler = HOUSES[house.house - 1]!.ruler;
        nodeNotes.push({
          key: "house",
          anchor: nodeAnchor(houseId),
          placement: "right",
          label: "A house",
          body: <>A scene in one of the twelve houses, where the chart is tended — or taxed. The numeral is the house; the colour its ruler, {rulerName(ruler)}.</>,
        });
      }
      return nodeNotes;
    }

    const chartNotes: GuideNote[] = [
      {
        key: "chart",
        anchor: "chart",
        placement: "right",
        label: "Your chart",
        body: <>Your planets, carried between encounters. Tap the chart to study them.</>,
      },
      {
        key: "index",
        anchor: "map-index",
        placement: "top",
        label: `Map ${ROMAN[mapsCompleted] ?? mapsCompleted + 1} of VII`,
        body: <>A run is seven maps at most, and encounters run one turn longer with each map.</>,
      },
    ];
    if (showBoundary) {
      chartNotes.push({
        key: "boundary",
        anchor: "map-boundary",
        placement: "left",
        label: "The crossing's record",
        body: <>What the last crossing did: which planets returned, and what affliction the lit ones took.</>,
      });
    }
    return chartNotes;
  }, [phase, map, mapsCompleted, showBoundary]);

  const shapes = useMemo<GuideShapes>(() => {
    const nodeIds = map.graph.nodes.map((n) => nodeAnchor(n.id));
    // The chart's outer ring sits at 96% of its box; the circle clears it.
    const chartCircle = (rects: GuideRects): GuideRect | null => {
      const rect = rects["chart"];
      return rect ? circleRect(center(rect), rect.width / 2 + 6) : null;
    };

    return {
      // The diagram itself: nothing points at it, but observing it re-measures
      // every node when the map resizes.
      measure: [...nodeIds, "map"],
      shape: (id, rects) => {
        if (id.startsWith("node-")) {
          const circle = nodeCircle(id, rects);
          return circle ? { rect: circle, radius: circle.width / 2 } : undefined;
        }
        if (id === "chart") {
          const circle = chartCircle(rects);
          return circle ? { rect: circle, radius: circle.width / 2 } : undefined;
        }
        return undefined;
      },
      obstacles: (rects) => ({
        soft: [
          ...nodeIds.flatMap((id) => {
            const circle = nodeCircle(id, rects);
            return circle ? [circle] : [];
          }),
          ...(chartCircle(rects) ? [chartCircle(rects)!] : []),
        ],
      }),
    };
  }, [map.graph.nodes]);

  return (
    <GuideOverlay
      open={open}
      phase={phase}
      phases={PHASES}
      phaseLabel={PHASE_LABEL}
      notes={notes}
      shapes={shapes}
      openLabel="Study this map"
      closeLabel="Close map guide"
      onOpen={onOpen}
      onClose={onClose}
      onPhaseChange={onPhaseChange}
    />
  );
}
