import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/Chart";
import { KandinskyComposition } from "@/components/KandinskyComposition";
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

const ROMAN = ["i", "ii", "iii", "iv", "v"];

const HOUSE_NAMES = [
  "First House", "Second House", "Third House", "Fourth House",
  "Fifth House", "Sixth House", "Seventh House", "Eighth House",
  "Ninth House", "Tenth House", "Eleventh House", "Twelfth House",
];

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

  useEffect(() => {
    setActive(ariaPlanet);
  }, [ariaPlanet, setActive]);

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
    let outcomes = option.outcomes ?? [];
    let resolutionText = "";
    if (option.outcomesOnSuccess || option.outcomesOnFail) {
      const luckPlanet = joyPlanet ?? house.ruler;
      const placement = profile.chart.planets[luckPlanet];
      const luck = placement.base.luck + placement.buffs.luck;
      const chance = Math.min(0.85, 0.4 + luck * 0.06);
      const success = Math.random() < chance;
      outcomes = success ? (option.outcomesOnSuccess ?? []) : (option.outcomesOnFail ?? []);
      resolutionText = success ? "The wager holds." : "The wager falls.";
    }

    let nextRun = applyOutcomes(run, profile, outcomes);
    if (fragment && !nextRun.seenFragmentIds.includes(fragment.id)) {
      nextRun = { ...nextRun, seenFragmentIds: [...nextRun.seenFragmentIds, fragment.id] };
    }

    if (option.next) {
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

    const finalEnc: NarrativeEncounter = {
      ...encounter,
      resolved: true,
      resolutionText: resolutionText || option.text,
    };
    nextRun = { ...nextRun, currentEncounter: finalEnc };

    const nextProfile: Profile = {
      ...profile,
      lifetimeEncounterCount: profile.lifetimeEncounterCount + 1,
    };
    saveProfile(nextProfile);
    setProfile(nextProfile);

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

  const fragmentLines = (fragment?.text ?? "").split(/\n+/);

  return (
    <div className="narrative">
      <div className="narrative-chart">
        <Chart
          chart={profile.chart}
          state={run.perPlanetState}
          unlockedPlanets={playerUnlocked}
          activePlanet={joyPlanet ?? null}
          inspectPlanet={joyPlanet ?? null}
          entrance="left"
          showColorField
          passive
        />
        <div className="narrative-distance">
          <span className="eyebrow">DISTANCE</span>
          <span className="narrative-distance-v">{Math.round(run.runDistance)}</span>
        </div>
      </div>

      <div className="narrative-column">
        <div className="narrative-composition">
          <KandinskyComposition planet={ariaPlanet} size={280} />
        </div>

        <div className="narrative-text anim-fragment-in">
          {fragment && (
            <>
              <div className="narrative-fragment">
                {fragmentLines.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < fragmentLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </div>
              <div className="narrative-attrib">
                {fragment.author?.toUpperCase() ?? ""}
                {fragment.source ? ` · ${fragment.source.toUpperCase()}` : ""}
              </div>
            </>
          )}
        </div>

        <div className="narrative-body">
          <div className="narrative-house">{HOUSE_NAMES[house.num - 1]}</div>
          <p>{resolved ? (resolutionLine ?? "It is finished.") : node.text}</p>
        </div>

        <div className="narrative-options">
          {!resolved && options.map((o, i) => (
            <button
              key={o.id}
              className={`option ${i === 1 ? "is-emph" : ""}`}
              onClick={() => handleOption(o)}
              type="button"
            >
              <span className="option-index">{ROMAN[i] ?? `${i + 1}`}.</span>
              <span className="option-text">
                {o.text}
                {resolveAside(o, ctx) && (
                  <span className="option-aside">{resolveAside(o, ctx)}</span>
                )}
              </span>
            </button>
          ))}
          {resolved && (
            <button className="begin-btn" onClick={handleContinue}>
              {run.over ? "Walk back" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
