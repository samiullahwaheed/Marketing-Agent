"use client";

import type { ReactNode } from "react";

/** Rounded toggle button. Dark when on. */
export function Pill({
  on,
  onClick,
  children,
  className = "",
  dashed = false,
}: {
  on?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  dashed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on === undefined ? undefined : on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full border text-sm font-semibold cursor-pointer ${
        dashed ? "border-dashed" : ""
      } ${on ? "bg-ink border-ink text-white" : "bg-white/50 backdrop-blur-md border-white/60 text-ink hover:bg-white/75"} ${className}`}
    >
      {children}
    </button>
  );
}
