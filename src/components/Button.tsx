"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "dangerOutline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border font-semibold leading-none no-underline cursor-pointer whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60";

const sizes = {
  sm: "min-h-9 px-3 text-[13px]",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-[22px] text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary-hover hover:border-primary-hover hover:text-white",
  secondary: "border-control bg-card text-ink hover:bg-page hover:text-ink",
  danger: "border-danger bg-danger text-white hover:bg-danger-hover hover:border-danger-hover hover:text-white",
  dangerOutline: "border-[#E3BDB7] bg-card text-danger hover:bg-page hover:text-danger",
  // Text colour is inherited so callers can tint it (e.g. a red "Remove")
  ghost: "border-transparent bg-transparent hover:bg-page",
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
