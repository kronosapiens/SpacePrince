import { PlanetIntroCard } from "@/components/PlanetIntroCard";
import { useInfoCards } from "@/state/InfoCardContext";
import { usePrince } from "@/state/PrinceStore";

/** Presents queued info cards, one at a time; dismissing advances the queue.
 *  Mounted only on stable surfaces (map, end) so interstitials never land
 *  over a running encounter. */
export function InfoCardHost() {
  const { current, dismissCard } = useInfoCards();
  const prince = usePrince();
  if (!current || !prince) return null;

  switch (current.kind) {
    case "planet-intro":
      return (
        <PlanetIntroCard key={current.planet} chart={prince.chart} planet={current.planet} onClose={dismissCard} />
      );
  }
}
