import { useRef } from "react";
import { BeginButton } from "./BeginButton";
import { ENCOUNTER_COPY } from "@/copy/encounter";
import { playUISound } from "@/audio/engine";

/** Leaving a finished encounter is the player's act: it fades in, takes focus,
 *  and leaves once however often it is activated. An open guide disables it,
 *  as guides permit no commitment. */
export function EncounterContinue({ className, disabled, onContinue }: {
  className: string;
  disabled: boolean;
  onContinue: () => void;
}) {
  const left = useRef(false);
  return (
    <BeginButton
      className={`encounter-continue anim-announce-in ${className}`}
      autoFocus
      disabled={disabled}
      onClick={() => {
        if (left.current) return;
        left.current = true;
        playUISound("select");
        onContinue();
      }}
    >
      {ENCOUNTER_COPY.continue}
    </BeginButton>
  );
}
