import { useMemo } from "react";
import { NODE_R } from "@/components/MapDiagram";
import { GUIDE_COPY } from "@/copy/guide";
import { HOUSES } from "@/data/houses";
import { chartRuler, seededChart } from "@/game/chart";
import { eligibleNext, ROOT_NODE_ID, TERMINAL_NODE_ID } from "@/game/map-gen";
import { fillLabel, planetName, TermText } from "@/components/TermText";
import {
  center,
  circleRect,
  GuideOverlay,
  type GuideNote,
  type GuideRect,
  type GuideRects,
  type GuideShapes,
} from "@/components/GuideOverlay";
import type { MapState, NodeContent } from "@/game/types";

export type MapGuidePhase = "map" | "chart";

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

const COPY = GUIDE_COPY.map;

const PHASES: MapGuidePhase[] = ["map", "chart"];

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
          label: COPY.notes.here.label,
          body: <TermText text={COPY.notes.here.body} />,
        },
      ];
      const combatId = pickNode(map, eligible, "combat");
      const combat = combatId ? map.rolledNodes[combatId] : undefined;
      if (combatId && combat?.kind === "combat") {
        const ruler = chartRuler(seededChart(combat.opponentSeed, ""));
        mapNotes.push({
          key: "encounter",
          anchor: nodeAnchor(combatId),
          placement: "right",
          label: COPY.notes.encounter.label,
          body: <TermText text={COPY.notes.encounter.body} vars={{ ruler: planetName(ruler) }} />,
        });
      }
      const houseId = pickNode(map, eligible, "narrative");
      const house = houseId ? map.rolledNodes[houseId] : undefined;
      if (houseId && house?.kind === "narrative") {
        const def = HOUSES[house.house - 1]!;
        mapNotes.push({
          key: "house",
          anchor: nodeAnchor(houseId),
          placement: "right",
          label: COPY.notes.house.label,
          body: (
            <TermText
              text={COPY.notes.house.body}
              vars={{ name: def.name, gloss: def.gloss, ruler: planetName(def.ruler) }}
            />
          ),
        });
      }
      return mapNotes;
    }

    const chartNotes: GuideNote[] = [
      {
        key: "chart",
        anchor: "chart",
        placement: "right",
        label: COPY.notes.chart.label,
        body: <TermText text={COPY.notes.chart.body} />,
      },
    ];
    if (map.currentNodeId !== TERMINAL_NODE_ID) {
      chartNotes.push({
        key: "crossing",
        anchor: nodeAnchor(TERMINAL_NODE_ID),
        placement: "right",
        label: COPY.notes.crossing.label,
        body: <TermText text={COPY.notes.crossing.body} />,
      });
    }
    chartNotes.push({
      key: "index",
      anchor: "map-index",
      placement: "top",
      label: fillLabel(COPY.notes.index.label, { n: ROMAN[mapsCompleted] ?? mapsCompleted + 1 }),
      body: <TermText text={COPY.notes.index.body} />,
    });
    if (showBoundary) {
      chartNotes.push({
        key: "boundary",
        anchor: "map-boundary",
        placement: "left",
        label: COPY.notes.boundary.label,
        body: <TermText text={COPY.notes.boundary.body} />,
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
      phaseLabel={COPY.phases}
      notes={notes}
      shapes={shapes}
      openLabel={COPY.open}
      closeLabel={COPY.close}
      onOpen={onOpen}
      onClose={onClose}
      onPhaseChange={onPhaseChange}
    />
  );
}
