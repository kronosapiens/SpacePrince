import { useMemo } from "react";
import type { HouseDef } from "@/data/houses";
import type { PlanetName } from "@/game/types";
import { PLANET_PRIMARY } from "@/svg/palette";
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

export type NarrativeGuidePhase = "scene" | "choices" | "chart";

interface NarrativeGuideProps {
  open: boolean;
  phase: NarrativeGuidePhase;
  house: HouseDef;
  /** 1-based index of the first option carrying an aside, if any. */
  asideIndex: number | null;
  onOpen: () => void;
  onClose: () => void;
  onPhaseChange: (phase: NarrativeGuidePhase) => void;
}

const PHASE_LABEL: Record<NarrativeGuidePhase, string> = {
  scene: "Read the scene",
  choices: "Choose",
  chart: "What it touches",
};

const PHASES: NarrativeGuidePhase[] = ["scene", "choices", "chart"];

/** The blocks of the column a note keeps off while a clear side exists. Not
 *  the wheel, which the choice notes are meant to sit over; not the
 *  composition, whose box reaches into the one band the house note can stand
 *  in; and not the house line or the prompt, which a note above the options
 *  straddles wherever it goes. */
const COLUMN = ["narrative-text", "narrative-options", "narrative-light"];

function planetName(planet: PlanetName) {
  return <span style={{ color: PLANET_PRIMARY[planet] }}>{planet}</span>;
}

export function NarrativeGuide({
  open,
  phase,
  house,
  asideIndex,
  onOpen,
  onClose,
  onPhaseChange,
}: NarrativeGuideProps) {
  // The planet the house reads: its joy, or its ruler in the five houses that
  // have no joy — the same planet the screen rolls a wager against.
  const housePlanet = house.joy ?? house.ruler;

  const notes = useMemo<GuideNote[]>(() => {
    if (phase === "scene") {
      return [
        {
          key: "house",
          anchor: "narrative-house",
          placement: "top",
          label: "The house",
          body: <>One of the twelve houses, where the chart is tended — or taxed. {planetName(house.ruler)} rules it.</>,
        },
        {
          key: "chorus",
          anchor: "narrative-text",
          placement: "top",
          label: "The chorus",
          body: <>A voice from the chorus, in {planetName(house.ruler)}'s key. It sets the mood and asks nothing of you.</>,
        },
      ];
    }

    if (phase === "choices") {
      const choiceNotes: GuideNote[] = [
        {
          key: "commit",
          anchor: "narrative-options",
          placement: "bottom",
          label: "Arm, then commit",
          body: <>Tap an option to arm it, tap again to commit. Everything lands exactly as written unless odds are shown.</>,
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
          label: "The aside",
          body: <>Each aside names an option's price and effect before you decide. Odds in sixtieths mark a wager, rolled against Fortune.</>,
        });
      }
      return choiceNotes;
    }

    return [
      {
        key: "house-planet",
        anchor: planetAnchor("self", housePlanet),
        spotlights: ["wheel-self", planetAnchor("self", housePlanet)],
        placement: "outward",
        label: "The house's planet",
        body: house.joy
          ? <>This house reads {planetName(house.joy)}, its joy planet. Its Fortune decides any wager here, and some choices open only under the right sky — a joy present or harmed, a dignified ruler, a planet already lost.</>
          : <>This house has no joy planet, so it reads its ruler, {planetName(house.ruler)}. Its Fortune decides any wager here, and some choices open only under the right sky — a dignified ruler, or a planet already lost.</>,
      },
      {
        key: "outcomes",
        anchor: "narrative-light",
        // The readout spans the column, so there is no "beside" — above it is.
        placement: "top",
        label: "Outcomes",
        body: <>Outcomes land on the chart itself: affliction taken or relieved, Light spent or gathered, sometimes a combusted planet called back.</>,
      },
    ];
  }, [phase, house, housePlanet, asideIndex]);

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
      className="narrative-guide"
      open={open}
      phase={phase}
      phases={PHASES}
      phaseLabel={PHASE_LABEL}
      notes={notes}
      shapes={shapes}
      openLabel="Study this scene"
      closeLabel="Close scene guide"
      onOpen={onOpen}
      onClose={onClose}
      onPhaseChange={onPhaseChange}
    />
  );
}
