import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface Variant {
  patches: string[];
  rules: string;
  archive: string;
  source: string;
  runtimeSha256: string;
}
export interface Experiment {
  seed: number;
  charts: number;
  runs: number;
  arms: string[];
  description: string;
  variants: Record<string, Variant>;
}
export interface Manifest {
  format: number;
  baseRevision: string;
  catalogue: string;
  commonPatches: string[];
  historicalNode: string;
  historicalViteNode: string;
  runtimeFingerprint: string;
  sourcePolicySha256: Record<string, string>;
  policySemantics: Record<string, string | number>;
  experiments: Record<string, Experiment>;
}
export const historyDirectory = fileURLToPath(new URL(".", import.meta.url));
export const manifest: Manifest = JSON.parse(readFileSync(new URL("manifest.json", import.meta.url), "utf8"));
