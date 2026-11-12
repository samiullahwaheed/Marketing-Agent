"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "dangerOutline" | "ghost";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-[10px] border font-semibold leading-none no-underline cursor-pointer whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-60";

const sizes = {
  sm: "min-h-9 px-3 text-[13px]",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-[22px] text-sm",
};

const variants: Record<ButtonVariant, string> = {
  // Solid — reserved for the one action a screen wants you to take.
  primary:
    "border-primary bg-primary text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(23_32_28/0.18)] hover:bg-primary-hover hover:border-primary-hover hover:text-white",
  danger:
    "border-danger bg-danger text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(23_32_28/0.18)] hover:bg-danger-hover hover:border-danger-hover hover:text-white",
  // Buttons usually sit on a glass card, so they are near-solid rather than another
  // translucent layer — stacked light glass loses legibility.
  secondary:
    "border-[rgb(23_32_28/0.09)] bg-white/85 text-ink shadow-[0_1px_2px_rgb(23_32_28/0.06)] hover:bg-white hover:text-ink",
  dangerOutline:
    "border-[#E3BDB7] bg-white/85 text-danger shadow-[0_1px_2px_rgb(23_32_28/0.06)] hover:bg-white hover:text-danger",
  // Text colour is inherited so callers can tint it (e.g. a red "Remove")
  ghost: "border-transparent bg-transparent hover:bg-[rgb(23_32_28/0.05)]",
};

type Props = {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  /** Renders a Next.js link instead of a <button>. */
  to?: string;
  /** Renders a plain external link. */
  href?: string;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "secondary",
  size = "md",
  to,
  href,
  className = "",
  children,
  type = "button",
  ...rest
}: Props) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  if (to) {
    return (
      <Link href={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
