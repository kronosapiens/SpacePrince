import { BrowserRouter, Route, Routes } from "react-router-dom";
import IndexScreen from "./screens/IndexScreen";
import MapScreen from "./screens/MapScreen";
import EncounterScreen from "./screens/EncounterScreen";
import NarrativeScreen from "./screens/NarrativeScreen";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexScreen />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/encounter" element={<EncounterScreen />} />
        <Route path="/narrative" element={<NarrativeScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
