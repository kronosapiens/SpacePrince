import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ActivePlanetTint } from "@/components/ActivePlanetTint";
import { Starfield } from "@/components/Starfield";
import { DevChrome } from "@/components/DevChrome";
import { ROUTES } from "./routes";
import { TitleScreen } from "@/screens/TitleScreen";
import { PlaySurface } from "@/screens/PlaySurface";
import { IndexScreen } from "@/screens/IndexScreen";
import { installAudioUnlock } from "@/audio/engine";

export function App() {
  // Audio boots on the first gesture (browser autoplay policy); every sound
  // call before then no-ops.
  useEffect(() => installAudioUnlock(), []);
  return (
    <>
      <Starfield />
      <ActivePlanetTint />
      <Routes>
        <Route path={ROUTES.title} element={<TitleScreen />} />
        <Route path={ROUTES.play} element={<PlaySurface />} />
        <Route path={ROUTES.index} element={<IndexScreen />} />
        <Route path="*" element={<Navigate to={ROUTES.title} replace />} />
      </Routes>
      {import.meta.env.DEV && <DevChrome />}
    </>
  );
}
