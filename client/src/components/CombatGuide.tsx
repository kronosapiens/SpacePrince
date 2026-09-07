import { useMemo } from "react";
import { GUIDE_COPY } from "@/copy/guide";
import type { PlanetName, Polarity } from "@/game/types";
import { fillLabel, planetName, TermText } from "@/components/TermText";
import {
  arcAnchor,
  aspectAnchor,
  chartGlyphs,
  chartShape,
  CORONA_REACH,
  planetAnchor,
  planetCircle,
  PLANET_REACH,
  wheelOf,
  WHEELS,
} from "@/components/chart-guide";
import {
  boxShape,
  center,
  GuideOverlay,
  rectOf,
  type GuideNote,
  type GuidePoint,
  type GuideRects,
  type GuideShape,
  type GuideShapes,
} from "@/components/GuideOverlay";

export type CombatGuidePhase = "read" | "chart" | "act";

interface CombatGuideProps {
  open: boolean;
  phase: CombatGuidePhase;
  turn: { current: number; total: number };
  ruler: PlanetName;
  rule: string;
  opponentPlanet: PlanetName | null;
  examplePlanet: PlanetName | null;
  /** The far end of one of the example planet's aspect lines, if it has any. */
  exampleAspect: PlanetName | null;
  selectedPlanet: PlanetName | null;
  pendingAction: Polarity | null;
  projectedLight: number | null;
  onOpen: () => void;
  onClose: () => void;
  onPhaseChange: (phase: CombatGuidePhase) => void;
}

const COPY = GUIDE_COPY.encounter;

/** The panel's outline is concentric with its card (the card's 14px plus the
 *  padding). */
const PANEL_PAD = 8;
const PANEL_RADIUS = 14 + PANEL_PAD;

/** Every glyph on both wheels: never lit as a group, but notes keep off them
 *  whenever a clear side exists. */
const GLYPHS = (["self", "other"] as const).flatMap(chartGlyphs);

/** The chart's shapes first; past them, the encounter's own readouts, which
 *  each want their own padding. */
function encounterShape(id: string, rects: GuideRects, reachOf: (id: string) => number): GuideShape | undefined {
  const chart = chartShape(id, rects, reachOf);
  if (chart) return chart;

  const rect = rectOf(id, rects);
  if (!rect) return undefined;
  if (id === "planet-panel") return boxShape(rect, PANEL_PAD, PANEL_PAD, PANEL_RADIUS);
  if (id === "turn" || id === "light") return boxShape(rect, 8, 6);
  // The sentence sits 12px under the readouts; its line box already holds the
  // descenders, so the box hugs it top and bottom to keep air between.
  if (id === "opponent-move") return boxShape(rect, 8, 0);
  return undefined;
}

export function CombatGuide({
  open,
  phase,
  turn,
  ruler,
  rule,
  opponentPlanet,
  examplePlanet,
  exampleAspect,
  selectedPlanet,
  pendingAction,
  projectedLight,
  onOpen,
  onClose,
  onPhaseChange,
}: CombatGuideProps) {
  const actingPlanet = selectedPlanet ?? examplePlanet;
  const canAct = examplePlanet !== null;
  // The charts first: what self and other are is the ground the turn's
  // readouts stand on.
  const phases: CombatGuidePhase[] = canAct ? ["chart", "read", "act"] : ["chart", "read"];

  const notes = useMemo<GuideNote[]>(() => {
    if (phase === "read") {
      return [
        {
          key: "turn",
          anchor: "turn",
          placement: "left",
          label: COPY.notes.turn.label,
          body: <TermText text={COPY.notes.turn.body} vars={{ current: turn.current, total: turn.total }} />,
        },
        {
          key: "light",
          anchor: "light",
          placement: "right",
          label: COPY.notes.light.label,
          body: <TermText text={COPY.notes.light.body} />,
        },
        {
          key: "their-move",
          anchor: "opponent-move",
          placement: "bottom",
          label: COPY.notes.theirMove.label,
          body: <TermText text={COPY.notes.theirMove.body} />,
        },
        {
          key: "ruler",
          anchor: "ruler+rule",
          placement: "top",
          label: COPY.notes.ruler.label,
          body: <TermText text={COPY.notes.ruler.body} vars={{ ruler: planetName(ruler), rule }} />,
        },
      ];
    }

    if (phase === "chart") {
      const chartNotes: GuideNote[] = [
        {
          key: "self",
          anchor: "label-self",
          spotlights: ["wheel-self", "label-self"],
          placement: "left",
          label: COPY.notes.self.label,
          body: <TermText text={COPY.notes.self.body} />,
        },
        {
          key: "other",
          anchor: "label-other",
          spotlights: ["wheel-other", "label-other"],
          placement: "right",
          label: COPY.notes.other.label,
          body: <TermText text={COPY.notes.other.body} />,
        },
      ];

      if (opponentPlanet) {
        chartNotes.push({
          key: "active-planet",
          anchor: planetAnchor("other", opponentPlanet),
          placement: "outward",
          label: COPY.notes.activePlanet.label,
          body: <TermText text={COPY.notes.activePlanet.body} />,
        });
      }

      if (examplePlanet) {
        chartNotes.push({
          key: "anatomy",
          anchor: arcAnchor("self", examplePlanet),
          spotlights: [
            arcAnchor("self", examplePlanet),
            ...(exampleAspect ? [aspectAnchor("self", examplePlanet, exampleAspect)] : []),
          ],
          placement: "outward",
          label: COPY.notes.anatomy.label,
          body: <TermText text={COPY.notes.anatomy.body} />,
        });
      }

      return chartNotes;
    }

    if (!actingPlanet) return [];
    const actionName = pendingAction === "Affliction" ? "Afflict" : "Testify";
    return [
      {
        key: "example",
        anchor: planetAnchor("self", actingPlanet),
        spotlights: ["wheel-self", "wheel-other", planetAnchor("self", actingPlanet)],
        placement: "outward",
        label: COPY.notes.example.label,
        body: <TermText text={COPY.notes.example.body} vars={{ planet: planetName(actingPlanet) }} />,
      },
      {
        key: "actions",
        anchor: "planet-panel",
        placement: "bottom",
        label: COPY.notes.actions.label,
        body: <TermText text={COPY.notes.actions.body} />,
      },
      {
        key: "projection",
        anchor: "light",
        placement: "right",
        label: fillLabel(COPY.notes.projection.label, { action: actionName }),
        body: <TermText text={COPY.notes.projection.body} vars={{ light: projectedLight ?? 0 }} />,
      },
    ];
  }, [phase, turn, ruler, rule, opponentPlanet, examplePlanet, exampleAspect, actingPlanet, pendingAction, projectedLight]);

  const shapes = useMemo<GuideShapes>(() => {
    // The other's acting planet always carries its corona; in the act phase
    // the example planet carries one too, for the verb being previewed.
    const actingId = opponentPlanet ? planetAnchor("other", opponentPlanet) : null;
    const reachOf = (id: string) => (id === actingId || phase === "act" ? CORONA_REACH : PLANET_REACH);
    // An arc's circle is centred on its glyph, so measure that too.
    const named = [...notes.flatMap((note) => note.spotlights ?? [note.anchor]), ...notes.map((note) => note.anchor)]
      .flatMap((id) => id.split("+"));
    const arcGlyphs = named.filter((id) => id.startsWith("arc-")).map((id) => id.replace("arc-", "planet-"));

    return {
      measure: [...WHEELS, ...GLYPHS, ...arcGlyphs],
      shape: (id, rects) => encounterShape(id, rects, reachOf),
      obstacles: (rects) => {
        // The acting planet's corona is the incoming move; a note never covers
        // it, lit or not.
        const acting = actingId ? planetCircle(actingId, CORONA_REACH, rects) : null;
        return {
          hard: acting ? [acting] : [],
          soft: GLYPHS.flatMap((id) => {
            const rect = planetCircle(id, PLANET_REACH, rects);
            return rect ? [rect] : [];
          }),
        };
      },
      // Above or below according to which half of its wheel the planet sits
      // in, so the note leaves the wheel rather than crossing it.
      outwardFrom: (anchor, rects): GuidePoint | undefined => {
        const wheel = rects[wheelOf(anchor)];
        return wheel ? center(wheel) : undefined;
      },
    };
  }, [notes, phase, opponentPlanet]);

  return (
    <GuideOverlay
      open={open}
      phase={phase}
      phases={phases}
      phaseLabel={COPY.phases}
      notes={notes}
      shapes={shapes}
      revision={`${pendingAction}:${projectedLight}`}
      openLabel={COPY.open}
      closeLabel={COPY.close}
      onOpen={onOpen}
      onClose={onClose}
      onPhaseChange={onPhaseChange}
    />
  );
}
