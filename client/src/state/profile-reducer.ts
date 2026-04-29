import type { Profile } from "@/game/types";

export type ProfileAction =
  | { type: "profile/set"; profile: Profile }
  | { type: "profile/clear" }
  | { type: "profile/incrementLifetime" }
  /** Idempotent per runId — revisiting End-of-Run for the same run is a no-op. */
  | { type: "profile/incrementScars"; runId: string }
  | { type: "profile/setEncounterCount"; count: number };

export function profileReducer(
  state: Profile | null,
  action: ProfileAction,
): Profile | null {
  switch (action.type) {
    case "profile/set":
      return action.profile;
    case "profile/clear":
      return null;
  }
  if (!state) return null;
  switch (action.type) {
    case "profile/incrementLifetime":
      return {
        ...state,
        lifetimeEncounterCount: state.lifetimeEncounterCount + 1,
      };
    case "profile/incrementScars":
      if (state.lastScarsBumpRunId === action.runId) return state;
      return {
        ...state,
        scarsLevel: state.scarsLevel + 1,
        lastScarsBumpRunId: action.runId,
      };
    case "profile/setEncounterCount":
      return { ...state, lifetimeEncounterCount: Math.max(0, action.count) };
  }
}
