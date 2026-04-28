import { Navigate, Route, Routes } from "react-router-dom";
import { ActivePlanetTint } from "@/components/ActivePlanetTint";
import { DevBar } from "@/components/DevBar";
import { ROUTES } from "./routes";
import { TitleScreen } from "@/screens/TitleScreen";
import { MintScreen } from "@/screens/MintScreen";
import { MapScreen } from "@/screens/MapScreen";
import { EncounterScreen } from "@/screens/EncounterScreen";
import { NarrativeRoute } from "@/screens/NarrativeRoute";
import { EndOfRunScreen } from "@/screens/EndOfRunScreen";
import { ChartStudyScreen } from "@/screens/ChartStudyScreen";
import { IndexScreen } from "@/screens/IndexScreen";

export function App() {
  return (
    <>
      <ActivePlanetTint />
      <Routes>
        <Route path={ROUTES.title} element={<TitleScreen />} />
        <Route path={ROUTES.mint} element={<MintScreen />} />
        <Route path={ROUTES.map} element={<MapScreen />} />
        <Route path={`${ROUTES.map}/:seed`} element={<MapScreen />} />
        <Route path={ROUTES.encounter} element={<EncounterScreen />} />
        <Route path={`${ROUTES.encounter}/:seed`} element={<EncounterScreen />} />
        <Route path={ROUTES.narrative} element={<NarrativeRoute />} />
        <Route path={`${ROUTES.narrative}/:seed`} element={<NarrativeRoute />} />
        <Route path={ROUTES.end} element={<EndOfRunScreen />} />
        <Route path={ROUTES.study} element={<ChartStudyScreen />} />
        <Route path={ROUTES.index} element={<IndexScreen />} />
        <Route path="*" element={<Navigate to={ROUTES.title} replace />} />
      </Routes>
      <DevBar />
    </>
  );
}
