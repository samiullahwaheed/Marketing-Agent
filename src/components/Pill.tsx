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
      className={`press inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full border text-sm font-semibold cursor-pointer select-none ${
        dashed ? "border-dashed" : ""
      } ${
        on
          ? "bg-ink border-ink text-white shadow-[0_1px_2px_rgb(23_32_28/0.2)]"
          : "bg-white/85 border-[rgb(23_32_28/0.09)] text-ink hover:bg-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}
