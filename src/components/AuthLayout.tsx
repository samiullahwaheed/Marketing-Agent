"use client";

import { useState, type ReactNode } from "react";

function LogoOnGreen() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="#FFFFFF" />
        <path
          d="M8 22c3-9 6-9 8.5-3.5S22 24 26 12"
          stroke="#1F5C46"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="26" cy="12" r="2.8" fill="#E8A33D" />
      </svg>
      <span className="heading text-xl text-white">Marketing agent</span>
    </div>
  );
}

/** Green story panel on the left, form on the right. Stacks on small screens. */
export function AuthLayout({
  hero,
  children,
  heroBasis,
  formBasis,
}: {
  hero: ReactNode;
  children: ReactNode;
  heroBasis: string;
  formBasis: string;
}) {
  return (
    <div className="flex flex-wrap min-h-screen">
      <section
        className="bg-primary text-white pt-11 pb-12 px-[clamp(24px,5vw,72px)] flex flex-col gap-12 overflow-hidden"
        style={{ flex: `1 1 ${heroBasis}` }}
      >
        <LogoOnGreen />
        {hero}
      </section>
      <section className="flex items-center justify-center py-12 px-6" style={{ flex: `1 1 ${formBasis}` }}>
        {children}
      </section>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  className,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete: string;
  className: string;
  name?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input
        className={`${className} pr-[76px]`}
        type={shown ? "text" : "password"}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus
        required
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1.5 min-h-9 px-3 border-0 bg-transparent text-primary font-bold text-sm cursor-pointer"
      >
        {shown ? "Hide" : "Show"}
      </button>
    </span>
  );
}
