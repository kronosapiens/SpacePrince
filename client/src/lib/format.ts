export function roundDisplay(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatDisplay(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

export function formatSignedRounded(value: number): string {
  const rounded = roundDisplay(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}
