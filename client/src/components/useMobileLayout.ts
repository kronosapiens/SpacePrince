import { useSyncExternalStore } from "react";

// Matches the stacked chart layout in layout.css.
const QUERY = "(max-width: 899px)";
const snapshot = () => window.matchMedia?.(QUERY).matches ?? false;
const subscribe = (notify: () => void) => {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener?.("change", notify);
  return () => media?.removeEventListener?.("change", notify);
};

export function useMobileLayout() {
  return useSyncExternalStore(subscribe, snapshot);
}
