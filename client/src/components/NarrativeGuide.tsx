import { useMemo } from "react";
import type { PlanetName } from "@/game/types";
import { GUIDE_COPY } from "@/copy/guide";
import type { HouseDef } from "@/data/houses";
import { planetName, TermText } from "@/components/TermText";
import {
  chartGlyphs,
  chartShape,
  CORONA_REACH,
  planetAnchor,
  planetCircle,
  PLANET_REACH,
  wheelOf,
} from "@/components/chart-guide";
import {
  center,
  GuideOverlay,
  type GuideNote,
  type GuidePoint,
  type GuideShapes,
} from "@/components/GuideOverlay";

export type NarrativeGuidePhase = "scene" | "choices";

interface NarrativeGuideProps {
  open: boolean;
  phase: NarrativeGuidePhase;
  house: HouseDef;
  fortunePlanet: PlanetName | null;
  /** 1-based index of the first option carrying an aside, if any. */
  asideIndex: number | null;
  onOpen: () => void;
  onClose: () => void;
  onPhaseChange: (phase: NarrativeGuidePhase) => void;
}

const COPY = GUIDE_COPY.narrative;

const PHASES: NarrativeGuidePhase[] = ["scene", "choices"];

/** The blocks of the column a note keeps off while a clear side exists. Not
 *  the wheel, which the choice notes are meant to sit over; not the
 *  composition, whose box reaches into the one band the house note can stand
 *  in; and not the house line or the prompt, which a note above the options
 *  straddles wherever it goes. */
const COLUMN = ["narrative-text", "narrative-options", "narrative-light"];

export function NarrativeGuide({
  open,
  phase,
  house,
  fortunePlanet,
  asideIndex,
  onOpen,
  onClose,
  onPhaseChange,
}: NarrativeGuideProps) {
  // Point to the lit planet whose Fortune the displayed wagers use.
  const housePlanet = fortunePlanet ?? house.ruler;

  const notes = useMemo<GuideNote[]>(() => {
    if (phase === "scene") {
      return [
        {
          key: "house-planet",
          anchor: planetAnchor("self", housePlanet),
          spotlights: ["wheel-self", planetAnchor("self", housePlanet)],
          placement: "outward",
          label: house.joy ? COPY.notes.housePlanet.label : COPY.notes.housePlanetNoJoy.label,
          body: house.joy
            ? <TermText text={COPY.notes.housePlanet.body} vars={{ joy: planetName(house.joy), fortune: fortunePlanet ? planetName(fortunePlanet) : "no lit planet" }} />
            : <TermText text={COPY.notes.housePlanetNoJoy.body} vars={{ ruler: planetName(house.ruler), fortune: fortunePlanet ? planetName(fortunePlanet) : "no lit planet" }} />,
        },
        {
          key: "house",
          anchor: "narrative-house",
          placement: "top",
          label: COPY.notes.house.label,
          body: <TermText text={COPY.notes.house.body} vars={{ ruler: planetName(house.ruler), theme: house.theme }} />,
        },
        {
          key: "chorus",
          anchor: "narrative-text",
          placement: "top",
          label: COPY.notes.chorus.label,
          body: <TermText text={COPY.notes.chorus.body} vars={{ ruler: planetName(house.ruler) }} />,
        },
      ];
    }

    const choiceNotes: GuideNote[] = [
      {
        key: "commit",
        anchor: "narrative-options",
        placement: "bottom",
        label: COPY.notes.commit.label,
        body: <TermText text={COPY.notes.commit.body} />,
      },
    ];
    if (asideIndex) {
      choiceNotes.push({
        key: "aside",
        // Lit on the aside, but hung off its whole row: the aside is inset
        // far enough that a note 28px to its left would stand inside the lit
        // list. Only the left is free either way — that side is the chart's,
        // and this note is meant to sit over it.
        anchor: `option-${asideIndex}`,
        spotlights: [`option-aside-${asideIndex}`],
        placement: "left",
        label: COPY.notes.aside.label,
        body: <TermText text={COPY.notes.aside.body} />,
      });
    }
    return choiceNotes;
  }, [phase, house, housePlanet, fortunePlanet, asideIndex]);

  const shapes = useMemo<GuideShapes>(() => {
    // Only the joy planet wears the active halo here (the chart's
    // `activePlanet`), so only its ring has to clear a corona.
    const joyId = house.joy ? planetAnchor("self", house.joy) : null;
    const glyphs = chartGlyphs("self");

    return {
      measure: ["wheel-self", ...glyphs, ...COLUMN],
      shape: (id, rects) => chartShape(id, rects, (planet) => (planet === joyId ? CORONA_REACH : PLANET_REACH)),
      obstacles: (rects) => ({
        soft: [
          ...glyphs.flatMap((id) => planetCircle(id, PLANET_REACH, rects) ?? []),
          ...COLUMN.flatMap((id) => rects[id] ?? []),
        ],
      }),
      // Away from the wheel's centre, so a planet's note leaves the chart
      // rather than crossing it.
      outwardFrom: (anchor, rects): GuidePoint | undefined => {
        const wheel = rects[wheelOf(anchor)];
        return wheel ? center(wheel) : undefined;
      },
    };
  }, [house.joy]);

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
