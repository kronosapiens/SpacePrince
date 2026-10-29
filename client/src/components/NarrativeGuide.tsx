import { GUIDE_COPY } from "@/copy/guide";
import { TermText } from "@/components/TermText";
import { GuideOverlay, type GuideNote } from "@/components/GuideOverlay";

interface NarrativeGuideProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const COPY = GUIDE_COPY.narrative;

const NOTES: GuideNote[] = [
  {
    key: "house",
    anchor: "narrative-house",
    placement: "top",
    label: COPY.notes.house.label,
    body: <TermText text={COPY.notes.house.body} />,
  },
  {
    key: "commit",
    anchor: "narrative-options",
    placement: "bottom",
    label: COPY.notes.commit.label,
    body: <TermText text={COPY.notes.commit.body} />,
  },
];

export function NarrativeGuide({ open, onOpen, onClose }: NarrativeGuideProps) {
  return (
    <GuideOverlay
      open={open}
      phase="scene"
      phases={["scene"]}
      phaseLabel={COPY.phases}
      notes={NOTES}
      openLabel={COPY.open}
      closeLabel={COPY.close}
      onOpen={onOpen}
      onClose={onClose}
      onPhaseChange={() => {}}
    />
  );
}
