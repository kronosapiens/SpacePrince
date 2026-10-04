import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import path from "node:path";

export default defineConfig({
  plugins: [react(), vitePrerenderPlugin({ renderTarget: "#root" })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@client-audio": path.resolve(__dirname, "../client/src/audio"),
    },
    dedupe: ["tone"],
  },
  server: { fs: { allow: [path.resolve(__dirname, "..")] } },
});
