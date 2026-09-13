import type { ButtonHTMLAttributes } from "react";
import { playFocusSound, playHoverSound } from "@/audio/interaction";

export function BeginButton({
  children,
  className = "",
  type = "button",
  onPointerEnter,
  onFocus,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`begin-btn invite-text ${className}`}
      type={type}
      {...props}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        playHoverSound(e);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        playFocusSound(e);
      }}
    >
      {children}
    </button>
  );
}
