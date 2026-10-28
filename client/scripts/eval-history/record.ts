import { createHash } from "node:crypto";

/** Object keys are sorted; array order and every recorded gameplay field remain significant. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Excludes old observer timings and extra diagnostics, retaining the corrected summary. */
export function recordHash(record: { trial: unknown; summary: unknown; steps: unknown }): string {
  return sha256(canonical({ trial: record.trial, summary: record.summary, steps: record.steps }));
}
