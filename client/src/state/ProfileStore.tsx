import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { profileReducer, type ProfileAction } from "./profile-reducer";
import { clearProfile, loadProfile, saveProfile } from "./profile";
import type { Profile } from "@/game/types";

const ProfileContext = createContext<Profile | null>(null);
const ProfileDispatchContext = createContext<Dispatch<ProfileAction> | null>(null);

export function ProfileStoreProvider({ children }: { children: ReactNode }) {
  const [profile, dispatch] = useReducer(profileReducer, undefined, () => loadProfile());

  useEffect(() => {
    if (profile) saveProfile(profile);
    else clearProfile();
  }, [profile]);

  return (
    <ProfileContext.Provider value={profile}>
      <ProfileDispatchContext.Provider value={dispatch}>
        {children}
      </ProfileDispatchContext.Provider>
    </ProfileContext.Provider>
  );
}

export function useProfile(): Profile | null {
  return useContext(ProfileContext);
}

export function useProfileDispatch(): Dispatch<ProfileAction> {
  const dispatch = useContext(ProfileDispatchContext);
  if (!dispatch) {
    throw new Error("useProfileDispatch must be used within ProfileStoreProvider");
  }
  return dispatch;
}
