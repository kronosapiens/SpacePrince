import { MemoryRouter, Route, Routes } from "react-router-dom";
import { GameLayout } from "@/screens/GameLayout";
import { TitleScreen } from "@/screens/TitleScreen";
import { PlaySurface } from "@/screens/PlaySurface";
import { InfoCardProvider } from "@/state/InfoCardContext";
import { PrinceStoreProvider } from "@/state/PrinceStore";

export function GameTest({ path = "/" }: { path?: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <PrinceStoreProvider>
        <InfoCardProvider>
        <Routes>
          <Route element={<GameLayout />}>
            <Route path="/" element={<TitleScreen />} />
            <Route path="/play" element={<PlaySurface />} />
          </Route>
        </Routes>
        </InfoCardProvider>
      </PrinceStoreProvider>
    </MemoryRouter>
  );
}
