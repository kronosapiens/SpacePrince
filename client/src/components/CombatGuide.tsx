import { useMemo } from "react";
import { GUIDE_COPY } from "@/copy/guide";
import type { PlanetName, Polarity } from "@/game/types";
import { fillLabel, planetName, TermText } from "@/components/TermText";
import {
  chartGlyphs,
  chartShape,
  CORONA_REACH,
  planetAnchor,
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

export type CombatGuidePhase = "read" | "act";

interface CombatGuideProps {
  open: boolean;
  phase: CombatGuidePhase;
  ruler: PlanetName;
  rule: string;
  opponentPlanet: PlanetName | null;
  /** The planet the act view opens on; without one there is nothing to act with. */
  examplePlanet: PlanetName | null;
  previewAction: Polarity | null;
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

/** The chart's shapes first; past them, the encounter's own readouts, which
 *  each want their own padding. */
function encounterShape(id: string, rects: GuideRects, reachOf: (id: string) => number): GuideShape | undefined {
  const chart = chartShape(id, rects, reachOf);
  if (chart) return chart;

  const rect = rectOf(id, rects);
  if (!rect) return undefined;
  if (id === "planet-panel") return boxShape(rect, PANEL_PAD, PANEL_PAD, PANEL_RADIUS);
  if (id === "light") return boxShape(rect, 8, 6);
  // The sentence sits 12px under the readouts; its line box already holds the
  // descenders, so the box hugs it top and bottom to keep air between.
  if (id === "opponent-move") return boxShape(rect, 8, 0);
  return undefined;
}

export function CombatGuide({
  open,
  phase,
  ruler,
  rule,
  opponentPlanet,
  examplePlanet,
  previewAction,
  projectedLight,
  onOpen,
  onClose,
  onPhaseChange,
}: CombatGuideProps) {
  const phases: CombatGuidePhase[] = examplePlanet ? ["read", "act"] : ["read"];

  const notes = useMemo<GuideNote[]>(() => {
    if (phase === "read") {
      const readNotes: GuideNote[] = [
        {
          key: "self",
          anchor: "label-self",
          spotlights: ["wheel-self", "label-self"],
          placement: "left",
          label: COPY.notes.self.label,
          body: <TermText text={COPY.notes.self.body} />,
        },
        {
          key: "ruler",
          anchor: "ruler+rule",
          placement: "top",
          label: COPY.notes.ruler.label,
          body: <TermText text={COPY.notes.ruler.body} vars={{ ruler: planetName(ruler), rule }} />,
        },
      ];

      if (opponentPlanet) {
        readNotes.push({
          key: "active-planet",
          anchor: "opponent-move",
          spotlights: ["opponent-move", planetAnchor("other", opponentPlanet)],
          placement: "bottom",
          label: COPY.notes.activePlanet.label,
          body: <TermText text={COPY.notes.activePlanet.body} />,
        });
      }

      return readNotes;
    }

    const actionName = previewAction === "Affliction" ? "Afflict" : "Testify";
    return [
      {
        key: "actions",
        anchor: "planet-panel",
        // The preview is drawn on both charts.
        spotlights: ["planet-panel", "wheel-self", "wheel-other"],
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
  }, [phase, ruler, rule, opponentPlanet, previewAction, projectedLight]);

  const shapes = useMemo<GuideShapes>(() => {
    // The other's acting planet always carries its corona; in the act phase
    // the example planet carries one too, for the verb being previewed.
    const actingId = opponentPlanet ? planetAnchor("other", opponentPlanet) : null;
    const reachOf = (id: string) => (id === actingId || phase === "act" ? CORONA_REACH : PLANET_REACH);

    return {
      measure: [...WHEELS, ...chartGlyphs("self"), ...chartGlyphs("other")],
      shape: (id, rects) => encounterShape(id, rects, reachOf),
      // Above or below according to which half of its wheel the planet sits
      // in, so the note leaves the wheel rather than crossing it.
      outwardFrom: (anchor, rects): GuidePoint | undefined => {
        const wheel = rects[wheelOf(anchor)];
        return wheel ? center(wheel) : undefined;
      },
    };
  }, [phase, opponentPlanet]);

  return (
    <GuideOverlay
      open={open}
      phase={phase}
      phases={phases}
      phaseLabel={COPY.phases}
      notes={notes}
      shapes={shapes}
      revision={`${previewAction}:${projectedLight}`}
      openLabel={COPY.open}
      closeLabel={COPY.close}
      onOpen={onOpen}
      onClose={onClose}
      onPhaseChange={onPhaseChange}
    />
  );
}
