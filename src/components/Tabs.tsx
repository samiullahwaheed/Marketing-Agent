"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  /** Link tabs navigate; others call onChange. */
  to?: string;
}

const sizes = {
  sm: { list: "gap-6", tab: "min-h-11 px-1 gap-2 text-[15px]" },
  md: { list: "gap-7", tab: "min-h-[52px] px-1.5 gap-2.5 text-[15px]" },
  lg: { list: "gap-7", tab: "min-h-12 px-1 gap-2 text-base" },
};

const tabBase = "inline-flex items-center border-b-[2.5px] no-underline cursor-pointer bg-transparent border-x-0 border-t-0";
const on = "border-ink text-ink font-bold hover:text-ink";
const off = "border-transparent text-muted font-semibold hover:text-ink";

export function Tabs({
  items,
  value,
  onChange,
  label,
  size = "sm",
}: {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  label: string;
  size?: keyof typeof sizes;
}) {
  const s = sizes[size];
  const pathname = usePathname();

  if (items.every((i) => i.to)) {
    return (
      <nav aria-label={label} className={`flex flex-wrap border-b border-border ${s.list}`}>
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.to!}
            className={`${tabBase} ${s.tab} ${pathname === item.to ? on : off}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div role="tablist" aria-label={label} className={`flex flex-wrap border-b border-border ${s.list}`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === value}
          onClick={() => onChange?.(item.id)}
          className={`${tabBase} ${s.tab} ${item.id === value ? on : off}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
