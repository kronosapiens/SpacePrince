#!/usr/bin/env node
// One-time data build: GeoNames cities5000 -> client/src/assets/cities.json.
// Re-run if the upstream dataset moves materially. Output is committed.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "src/assets/cities.json");
const tmp = mkdtempSync(join(tmpdir(), "geonames-"));

const fetchUrl = (url, file) => {
  const r = spawnSync("curl", ["-fsSL", "-o", join(tmp, file), url], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`curl ${url} failed`);
};

fetchUrl("https://download.geonames.org/export/dump/cities5000.zip", "cities5000.zip");
fetchUrl("https://download.geonames.org/export/dump/countryInfo.txt", "countryInfo.txt");

const unz = spawnSync("unzip", ["-o", "-q", join(tmp, "cities5000.zip"), "-d", tmp], { stdio: "inherit" });
if (unz.status !== 0) throw new Error("unzip failed");

const countryNames = {};
for (const line of readFileSync(join(tmp, "countryInfo.txt"), "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const cols = line.split("\t");
  if (cols[0] && cols[4]) countryNames[cols[0]] = cols[4];
}

// GeoNames cities columns: 1 name, 4 lat, 5 lon, 8 cc, 10 admin1, 14 population, 17 timezone.
const rows = [];
for (const line of readFileSync(join(tmp, "cities5000.txt"), "utf8").split("\n")) {
  if (!line) continue;
  const c = line.split("\t");
  const lat = Math.round(Number(c[4]) * 100) / 100;
  const lon = Math.round(Number(c[5]) * 100) / 100;
  if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
  rows.push([c[1], c[10] || "", countryNames[c[8]] || c[8], lat, lon, Number(c[14]) || 0, c[17] || ""]);
}

rows.sort((a, b) => b[5] - a[5]); // population desc for stable rank tiebreak

writeFileSync(out, JSON.stringify(rows));
console.log(`Wrote ${rows.length} cities to ${out}`);
