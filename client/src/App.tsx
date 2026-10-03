import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ActivePlanetTint } from "@/components/ActivePlanetTint";
import { Starfield } from "@/components/Starfield";
import { DevChrome } from "@/components/DevChrome";
import { ROUTES } from "./routes";
import { TitleScreen } from "@/screens/TitleScreen";
import { PlaySurface } from "@/screens/PlaySurface";
import { IndexScreen } from "@/screens/IndexScreen";
import { GameLayout } from "@/screens/GameLayout";
import { installAudioUnlock } from "@/audio/engine";

const GalleryScreen = import.meta.env.DEV
  ? lazy(() => import("@/screens/GalleryScreen"))
  : null;

export function App() {
  // Audio boots on the first gesture (browser autoplay policy); every sound
  // call before then no-ops.
  useEffect(() => installAudioUnlock(), []);
  return (
    <>
      <Starfield />
      <ActivePlanetTint />
      <Routes>
        <Route element={<GameLayout />}>
          <Route path={ROUTES.title} element={<TitleScreen />} />
          <Route path={ROUTES.play} element={<PlaySurface />} />
        </Route>
        <Route path={ROUTES.index} element={<IndexScreen />} />
        {GalleryScreen && <Route path={ROUTES.gallery} element={
          <Suspense fallback={<div className="screen">Loading gallery…</div>}>
            <GalleryScreen />
          </Suspense>
        } />}
        <Route path="*" element={<Navigate to={ROUTES.title} replace />} />
      </Routes>
      {import.meta.env.DEV && <DevChrome />}
    </>
  );
}
