import type { FocusEvent, PointerEvent } from "react";
import { playUISound } from "./engine";

export function playHoverSound(event: PointerEvent<Element>): void {
  if (!event.defaultPrevented && event.pointerType !== "touch" && !isDisabled(event.currentTarget)) playUISound("hover");
}

export function playFocusSound(event: FocusEvent<Element>): void {
  // Pointer clicks already have their own cue; only keyboard focus ticks.
  if (!event.defaultPrevented && !isDisabled(event.currentTarget) && event.currentTarget.matches(":focus-visible")) playUISound("hover");
}

function isDisabled(element: Element): boolean {
  return element.matches(':disabled, [aria-disabled="true"]');
}
