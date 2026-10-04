import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { ActivePlanetProvider } from "@/state/ActivePlanetContext";
import { App } from "./App";
import "./style/reset.css";
import "./style/tokens.css";
import "./style/motion.css";
import "./style/layout.css";

const app = (
  <React.StrictMode>
    <ActivePlanetProvider>
      <App />
    </ActivePlanetProvider>
  </React.StrictMode>
);

// Builds prerender the page into #root (vite-prerender-plugin); the dev server
// serves it empty.
if (typeof window !== "undefined") {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("#root missing");
  if (rootEl.hasChildNodes()) hydrateRoot(rootEl, app);
  else createRoot(rootEl).render(app);
}

export async function prerender() {
  const { renderToString } = await import("react-dom/server");
  return { html: renderToString(app) };
}
