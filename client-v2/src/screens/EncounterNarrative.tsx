import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { ChorusFragment } from "@/components/ChorusFragment";
import { ROUTES } from "@/routes";
import { unlockedPlanets } from "@/game/unlocks";
import { applyOutcomes, buildNarrativeContext } from "@/game/narrative";
import { saveProfile } from "@/state/profile";
import { saveRun } from "@/state/run-store";
import { useActivePlanet } from "@/state/ActivePlanetContext";
import { HOUSES } from "@/data/houses";
import { getTree, getTreeNode, resolveAside, visibleOptions, type Option } from "@/data/narrative-trees";
import { getFragmentById, pickFragment } from "@/data/chorus";
import { mulberry32 } from "@/game/rng";
import { PLANETS } from "@/game/data";
import type {
  NarrativeEncounter,
  NodeOutcome,
  PlanetName,
  Profile,
  RunState,
} from "@/game/types";

interface NarrativeScreenProps {
  run: RunState;
  profile: Profile;
  encounter: NarrativeEncounter;
  setRun: (r: RunState) => void;
  setProfile: (p: Profile) => void;
}

export function EncounterNarrativeScreen(props: NarrativeScreenProps) {
  const { run, profile, encounter, setRun, setProfile } = props;
  const navigate = useNavigate();
  const { setActive } = useActivePlanet();

  const house = HOUSES[encounter.house - 1]!;
  const tree = useMemo(() => getTree(encounter.house), [encounter.house]);
  const ariaPlanet: PlanetName = house.ruler;
  const joyPlanet: PlanetName | null = house.joy;

  // Tint the canvas the house's natural ruler.
  useEffect(() => {
    setActive(ariaPlanet);
  }, [ariaPlanet, setActive]);

  // Resolve fragment by id (already chosen at encounter open). If id not found, fall back to a fresh pick.
  const fragment = useMemo(() => {
    const fixed = getFragmentById(encounter.fragmentId);
    if (fixed) return fixed;
    const rng = mulberry32(encounter.house * 1000 + run.seed);
    return pickFragment({
      planet: ariaPlanet,
      mood: tree.fragmentMood,
      exclude: run.seenFragmentIds,
      rng,
    });
  }, [encounter.fragmentId, encounter.house, run.seed, run.seenFragmentIds, ariaPlanet, tree.fragmentMood]);

  const ctx = useMemo(
    () =>
      buildNarrativeContext({
        profile,
        run,
        joyPlanet,
        rulerPlanet: house.ruler,
      }),
    [profile, run, joyPlanet, house.ruler],
  );

  const [resolved, setResolved] = useState(encounter.resolved);
  const [resolutionLine, setResolutionLine] = useState<string | null>(encounter.resolutionText ?? null);
  const playerUnlocked = unlockedPlanets(profile.lifetimeEncounterCount);

  const node = useMemo(() => getTreeNode(tree, encounter.currentNodeId), [tree, encounter.currentNodeId]);
  const options = useMemo(() => visibleOptions(node, ctx), [node, ctx]);

  const handleOption = (option: Option) => {
    if (resolved) return;

    // Resolve outcomes (including push-your-luck rolls)
    let outcomes = option.outcomes ?? [];
    let resolutionText = "";
    if (option.outcomesOnSuccess || option.outcomesOnFail) {
      // Luck roll vs joy planet (or ruler if no joy)
      const luckPlanet = joyPlanet ?? house.ruler;
      const placement = profile.chart.planets[luckPlanet];
      const luck = placement.base.luck + placement.buffs.luck;
      const chance = Math.min(0.85, 0.4 + luck * 0.06);
      const success = Math.random() < chance;
      outcomes = success ? (option.outcomesOnSuccess ?? []) : (option.outcomesOnFail ?? []);
      resolutionText = success ? "The wager holds." : "The wager falls.";
    }

    let nextRun = applyOutcomes(run, profile, outcomes);

    // Mark fragment as seen
    if (fragment && !nextRun.seenFragmentIds.includes(fragment.id)) {
      nextRun = { ...nextRun, seenFragmentIds: [...nextRun.seenFragmentIds, fragment.id] };
    }

    if (option.next) {
      // Advance to child node within this encounter
      const updatedEnc: NarrativeEncounter = {
        ...encounter,
        currentNodeId: option.next,
        visitedNodeIds: [...encounter.visitedNodeIds, option.next],
      };
      nextRun = { ...nextRun, currentEncounter: updatedEnc };
      saveRun(nextRun);
      setRun(nextRun);
      return;
    }

    // Terminal — encounter resolves.
    const finalEnc: NarrativeEncounter = {
      ...encounter,
      resolved: true,
      resolutionText: resolutionText || option.text,
    };
    nextRun = { ...nextRun, currentEncounter: finalEnc };

    // Increment lifetime encounter count (narrative also counts)
    const nextProfile: Profile = {
      ...profile,
      lifetimeEncounterCount: profile.lifetimeEncounterCount + 1,
    };
    saveProfile(nextProfile);
    setProfile(nextProfile);

    // Capture outcome on the map node for End-of-Run inspection.
    const combusts = PLANETS.filter(
      (p) => nextRun.perPlanetState[p].combusted && !run.perPlanetState[p].combusted,
    );
    const outcome: NodeOutcome = {
      nodeId: nextRun.currentMap.currentNodeId,
      kind: "narrative",
      summary: `${house.name} · ${option.text}`,
      distanceDelta: nextRun.runDistance - run.runDistance,
      combusts,
    };
    nextRun = {
      ...nextRun,
      currentMap: {
        ...nextRun.currentMap,
        outcomes: { ...nextRun.currentMap.outcomes, [outcome.nodeId]: outcome },
      },
    };

    saveRun(nextRun);
    setRun(nextRun);
    setResolved(true);
    setResolutionLine(resolutionText || option.text);
  };

  const handleContinue = () => {
    if (run.over) {
      navigate(ROUTES.end);
      return;
    }
    const cleared: RunState = { ...run, currentEncounter: null };
    saveRun(cleared);
    setRun(cleared);
    navigate(ROUTES.map);
  };

  return (
    <div className="encounter narrative">
      <div className="encounter-side">
        <Chart
          chart={profile.chart}
          state={run.perPlanetState}
          unlockedPlanets={playerUnlocked}
          activePlanet={joyPlanet ?? null}
          entrance="left"
          passive
        />
      </div>
      <div className="narrative-column anim-encounter-open-fade">
        {fragment && (
          <ChorusFragment
            planet={ariaPlanet}
            text={fragment.text}
            attribution={fragment.author ? `— ${fragment.author}${fragment.source ? `, ${fragment.source}` : ""}` : undefined}
          />
        )}
        <div className="narrative-text anim-fragment-in anim-fragment-in-3">
          {resolved ? (resolutionLine ?? "It is finished.") : node.text}
        </div>
        <div className="narrative-options anim-fragment-in anim-fragment-in-4">
          {!resolved && options.map((o) => (
            <button
              key={o.id}
              className="narrative-option"
              onClick={() => handleOption(o)}
              type="button"
            >
              <span>{o.text}</span>
              {resolveAside(o, ctx) && (
                <span className="narrative-option-aside">{resolveAside(o, ctx)}</span>
              )}
            </button>
          ))}
          {resolved && (
            <button
              className="continue-prompt-btn"
              onClick={handleContinue}
              type="button"
            >
              {run.over ? "Walk back" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
