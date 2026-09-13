import type { ButtonHTMLAttributes } from "react";

export function BeginButton({
  children,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`begin-btn invite-text ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
