import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ActivePlanetProvider } from "@/state/ActivePlanetContext";
import { ProfileStoreProvider } from "@/state/ProfileStore";
import { RunStoreProvider } from "@/state/RunStore";
import { App } from "./App";
import "./style/reset.css";
import "./style/tokens.css";
import "./style/motion.css";
import "./style/layout.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root missing");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProfileStoreProvider>
        <RunStoreProvider>
          <ActivePlanetProvider>
            <App />
          </ActivePlanetProvider>
        </RunStoreProvider>
      </ProfileStoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
