"use client";

import type { ReactNode } from "react";

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
    <div className="flex flex-wrap min-h-dvh">
      <section
        className="bg-primary text-white pt-11 pb-12 px-[clamp(24px,5vw,72px)] flex flex-col gap-12 overflow-hidden"
        style={{ flex: `1 1 ${heroBasis}` }}
      >
        <LogoOnGreen />
        {hero}
      </section>
      <main className="flex items-center justify-center py-12 px-6" style={{ flex: `1 1 ${formBasis}` }}>
        {children}
      </main>
    </div>
  );
}
