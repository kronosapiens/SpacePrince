import { useEffect, useRef, useState } from "react";
import { PLANETS } from "../game/data";
import type { PlanetName, RunState } from "../game/types";

const PRIMARY_DELAY = 200;
const STEP_DELAY = 520;
const STEP_OFFSET = 800;
const STEP_GLOW_OFFSET = 140;
const STEP_CLEAR_OFFSET = 320;
const END_OFFSET = 300;

export function useCombatAnimation() {
  const [animating, setAnimating] = useState(false);
  const [actionPlanet, setActionPlanet] = useState<PlanetName | null>(null);
  const [actionOpponent, setActionOpponent] = useState<PlanetName | null>(null);
  const [highlightAffliction, setHighlightAffliction] = useState<Record<string, boolean>>({});
  const [highlightLines, setHighlightLines] = useState<Record<string, boolean>>({});
  const [displayAffliction, setDisplayAffliction] = useState<{
    self: Record<string, number>;
    other: Record<string, number>;
  } | null>(null);
  const animationTimeouts = useRef<number[]>([]);

  const clearAnimationTimeouts = () => {
    animationTimeouts.current.forEach((id) => window.clearTimeout(id));
    animationTimeouts.current = [];
  };

  const finishAnimation = () => {
    clearAnimationTimeouts();
    setHighlightLines({});
    setHighlightAffliction({});
    setActionPlanet(null);
    setActionOpponent(null);
    setDisplayAffliction(null);
    setAnimating(false);
  };

  useEffect(() => clearAnimationTimeouts, []);

  const startAnimation = (entry: RunState["log"][number], previousRun: RunState) => {
    clearAnimationTimeouts();
    setAnimating(true);
    setActionPlanet(entry.playerPlanet);
    setActionOpponent(entry.opponentPlanet);
    const initialSelf = Object.fromEntries(
      PLANETS.map((planet) => [planet, previousRun.playerState[planet].affliction])
    );
    const initialOther = Object.fromEntries(
      PLANETS.map((planet) => [planet, previousRun.opponentState[planet].affliction])
    );
    setDisplayAffliction({ self: initialSelf, other: initialOther });

    const applyAffliction = (side: "self" | "other", planet: PlanetName, delta: number) => {
      setDisplayAffliction((prev) => {
        if (!prev) return prev;
        const next = { ...prev[side], [planet]: (prev[side][planet] ?? 0) + delta };
        return { ...prev, [side]: next };
      });
    };

    setHighlightLines({});

    const primaryId = window.setTimeout(() => {
      const primarySign = entry.polarity === "Testimony" ? -1 : 1;
      applyAffliction("self", entry.playerPlanet, entry.playerDelta * primarySign);
      applyAffliction("other", entry.opponentPlanet, entry.opponentDelta * primarySign);
      setHighlightAffliction({
        [`self-${entry.playerPlanet}`]: true,
        [`other-${entry.opponentPlanet}`]: true,
      });
    }, PRIMARY_DELAY);
    animationTimeouts.current.push(primaryId);

    const steps = entry.propagation
      .filter((prop) => prop.target)
      .map((prop) => ({
        lineKey: `${entry.playerPlanet}-${prop.target}`,
        target: prop.target,
        delta: prop.delta,
      }));

    let delay = STEP_OFFSET;

    steps.forEach((step) => {
      const startId = window.setTimeout(() => {
        setHighlightLines({ [step.lineKey]: true });
      }, delay);
      animationTimeouts.current.push(startId);

      const afflictId = window.setTimeout(() => {
        applyAffliction("self", step.target, step.delta);
        setHighlightAffliction({ [`self-${step.target}`]: true });
      }, delay + STEP_GLOW_OFFSET);
      animationTimeouts.current.push(afflictId);

      const clearId = window.setTimeout(() => {
        setHighlightLines({});
        setHighlightAffliction({});
      }, delay + STEP_CLEAR_OFFSET);
      animationTimeouts.current.push(clearId);

      delay += STEP_DELAY;
    });

    const endId = window.setTimeout(() => {
      finishAnimation();
    }, delay + END_OFFSET);
    animationTimeouts.current.push(endId);
  };

  return {
    animating,
    actionPlanet,
    actionOpponent,
    highlightAffliction,
    highlightLines,
    displayAffliction,
    startAnimation,
    finishAnimation,
  };
}
