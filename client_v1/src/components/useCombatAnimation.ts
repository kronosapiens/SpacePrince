import { useEffect, useRef, useState } from "react";
import { PLANETS } from "../game/data";
import type { PlanetName, RunState } from "../game/types";

const ANIMATION_TIMINGS = {
  primaryDelay: 200,
  stepDelay: 520,
  stepOffset: 800,
  stepGlowOffset: 140,
  stepClearOffset: 320,
  endOffset: 300,
} as const;

export function useCombatAnimation() {
  const [animating, setAnimating] = useState(false);
  const [actionPlanet, setActionPlanet] = useState<PlanetName | null>(null);
  const [actionOpponent, setActionOpponent] = useState<PlanetName | null>(null);
  const [highlightAffliction, setHighlightAffliction] = useState<Record<string, boolean>>({});
  const [critPlanets, setCritPlanets] = useState<Record<string, boolean>>({});
  const [highlightLines, setHighlightLines] = useState<{
    self: Record<string, boolean>;
    other: Record<string, boolean>;
  }>({ self: {}, other: {} });
  const [displayAffliction, setDisplayAffliction] = useState<{
    self: Record<string, number>;
    other: Record<string, number>;
  } | null>(null);
  const [displayCombusted, setDisplayCombusted] = useState<{
    self: Record<string, boolean>;
    other: Record<string, boolean>;
  } | null>(null);
  const animationTimeouts = useRef<number[]>([]);

  const clearAnimationTimeouts = () => {
    animationTimeouts.current.forEach((id) => window.clearTimeout(id));
    animationTimeouts.current = [];
  };

  const finishAnimation = () => {
    clearAnimationTimeouts();
    setHighlightLines({ self: {}, other: {} });
    setHighlightAffliction({});
    setCritPlanets({});
    setActionPlanet(null);
    setActionOpponent(null);
    setDisplayAffliction(null);
    setDisplayCombusted(null);
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
    const initialSelfCombust = Object.fromEntries(
      PLANETS.map((planet) => [planet, previousRun.playerState[planet].combusted])
    );
    const initialOtherCombust = Object.fromEntries(
      PLANETS.map((planet) => [planet, previousRun.opponentState[planet].combusted])
    );
    setDisplayAffliction({ self: initialSelf, other: initialOther });
    setDisplayCombusted({ self: initialSelfCombust, other: initialOtherCombust });

    const applyAffliction = (side: "self" | "other", planet: PlanetName, delta: number) => {
      setDisplayAffliction((prev) => {
        if (!prev) return prev;
        const next = { ...prev[side], [planet]: (prev[side][planet] ?? 0) + delta };
        return { ...prev, [side]: next };
      });
    };
    const applyCombust = (side: "self" | "other", planet: PlanetName) => {
      setDisplayCombusted((prev) => {
        if (!prev) return prev;
        const next = { ...prev[side], [planet]: true };
        return { ...prev, [side]: next };
      });
    };

    setHighlightLines({ self: {}, other: {} });
    const primaryId = window.setTimeout(() => {
      const primarySign = entry.polarity === "Testimony" ? -1 : 1;
      applyAffliction("self", entry.playerPlanet, entry.playerDelta * primarySign);
      applyAffliction("other", entry.opponentPlanet, entry.opponentDelta * primarySign);
      setCritPlanets({
        ...(entry.playerCrit ? { [`self-${entry.playerPlanet}`]: true } : {}),
        ...(entry.opponentCrit ? { [`other-${entry.opponentPlanet}`]: true } : {}),
      });
      setHighlightAffliction({
        [`self-${entry.playerPlanet}`]: true,
        [`other-${entry.opponentPlanet}`]: true,
      });
    }, ANIMATION_TIMINGS.primaryDelay);
    animationTimeouts.current.push(primaryId);

    const steps = entry.propagation
      .filter((prop) => prop.target)
      .map((prop) => ({
        lineKey: `${prop.source}-${prop.target}`,
        side: prop.side,
        target: prop.target,
        delta: prop.delta,
        combust: prop.note === "Combusts",
      }));
    const selfSteps = steps.filter((step) => step.side === "self");
    const otherSteps = steps.filter((step) => step.side === "other");
    const maxSteps = Math.max(selfSteps.length, otherSteps.length);

    const scheduleStep = (step: (typeof steps)[number], delay: number) => {
      const startId = window.setTimeout(() => {
        setHighlightLines((prev) => ({
          ...prev,
          [step.side]: { ...prev[step.side], [step.lineKey]: true },
        }));
      }, delay);
      animationTimeouts.current.push(startId);

      const afflictId = window.setTimeout(() => {
        applyAffliction(step.side, step.target, step.delta);
        if (step.combust) applyCombust(step.side, step.target);
        const targetKey = `${step.side}-${step.target}`;
        setHighlightAffliction((prev) => ({ ...prev, [targetKey]: true }));
      }, delay + ANIMATION_TIMINGS.stepGlowOffset);
      animationTimeouts.current.push(afflictId);

      const clearId = window.setTimeout(() => {
        setHighlightLines((prev) => {
          const nextSide = { ...prev[step.side] };
          delete nextSide[step.lineKey];
          return { ...prev, [step.side]: nextSide };
        });
        setHighlightAffliction((prev) => {
          const next = { ...prev };
          delete next[`${step.side}-${step.target}`];
          return next;
        });
      }, delay + ANIMATION_TIMINGS.stepClearOffset);
      animationTimeouts.current.push(clearId);
    };

    selfSteps.forEach((step, index) => {
      scheduleStep(step, ANIMATION_TIMINGS.stepOffset + index * ANIMATION_TIMINGS.stepDelay);
    });
    otherSteps.forEach((step, index) => {
      scheduleStep(step, ANIMATION_TIMINGS.stepOffset + index * ANIMATION_TIMINGS.stepDelay);
    });

    const finalPropagationDelay =
      maxSteps > 0
        ? ANIMATION_TIMINGS.stepOffset +
          Math.max(0, maxSteps - 1) * ANIMATION_TIMINGS.stepDelay +
          ANIMATION_TIMINGS.stepGlowOffset
        : ANIMATION_TIMINGS.primaryDelay;
    const combustId = window.setTimeout(() => {
      if (entry.opponentCombust) applyCombust("other", entry.opponentPlanet);
      if (entry.playerCombust) applyCombust("self", entry.playerPlanet);
    }, finalPropagationDelay);
    animationTimeouts.current.push(combustId);

    const endId = window.setTimeout(() => {
      finishAnimation();
    }, ANIMATION_TIMINGS.stepOffset +
      Math.max(0, maxSteps - 1) * ANIMATION_TIMINGS.stepDelay +
      ANIMATION_TIMINGS.stepClearOffset +
      ANIMATION_TIMINGS.endOffset);
    animationTimeouts.current.push(endId);
  };

  return {
    animating,
    actionPlanet,
    actionOpponent,
    highlightAffliction,
    critPlanets,
    highlightLines,
    displayAffliction,
    displayCombusted,
    startAnimation,
    finishAnimation,
  };
}
