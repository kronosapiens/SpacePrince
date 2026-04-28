import { useCallback, useState } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/routes";
import { loadProfile, saveProfile } from "@/state/profile";
import { loadRun, saveRun } from "@/state/run-store";
import { loadDevSettings } from "@/state/settings";
import { EncounterCombatScreen } from "./EncounterCombat";
import { EncounterNarrativeScreen } from "./EncounterNarrative";
import type { Profile, RunState } from "@/game/types";

export function EncounterScreen() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [run, setRun] = useState<RunState | null>(() => loadRun());
  const settings = loadDevSettings();

  const updateProfile = useCallback((p: Profile) => {
    saveProfile(p);
    setProfile(p);
  }, []);
  const updateRun = useCallback((r: RunState) => {
    saveRun(r);
    setRun(r);
  }, []);

  if (!profile) return <Navigate to={ROUTES.title} replace />;
  if (!run) return <Navigate to={ROUTES.title} replace />;
  const enc = run.currentEncounter;
  if (!enc) return <Navigate to={ROUTES.map} replace />;

  if (enc.kind === "combat") {
    return (
      <EncounterCombatScreen
        run={run}
        profile={profile}
        encounter={enc}
        setRun={updateRun}
        setProfile={updateProfile}
        devUnlockAll={settings.unlockAll}
      />
    );
  }
  return (
    <EncounterNarrativeScreen
      run={run}
      profile={profile}
      encounter={enc}
      setRun={updateRun}
      setProfile={updateProfile}
    />
  );
}
