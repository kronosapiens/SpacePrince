import { Navigate, Route, Routes } from "react-router-dom";
import { ActivePlanetTint } from "@/components/ActivePlanetTint";
import { PageDropdown } from "@/components/PageDropdown";
import { DevConsole } from "@/components/DevConsole";
import { ROUTES } from "./routes";
import { TitleScreen } from "@/screens/TitleScreen";
import { PlaySurface } from "@/screens/PlaySurface";
import { IndexScreen } from "@/screens/IndexScreen";

export function App() {
  return (
    <>
      <ActivePlanetTint />
      <Routes>
        <Route path={ROUTES.title} element={<TitleScreen />} />
        <Route path={ROUTES.play} element={<PlaySurface />} />
        <Route path={ROUTES.index} element={<IndexScreen />} />
        <Route path="*" element={<Navigate to={ROUTES.title} replace />} />
      </Routes>
      {import.meta.env.DEV && <PageDropdown />}
      {import.meta.env.DEV && <DevConsole />}
    </>
  );
}
