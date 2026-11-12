"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

const tabBase =
  "inline-flex items-center no-underline cursor-pointer bg-transparent border-0 transition-colors duration-150 ease-out select-none";
const on = "text-ink font-bold hover:text-ink";
const off = "text-muted font-semibold hover:text-ink";

type Indicator = { x: number; y: number; w: number } | null;

/**
 * One underline that travels between tabs on a spring, so the eye follows the selection
 * from where it was to where it went, instead of one line vanishing and another appearing.
 */
function useIndicator(activeKey: string | undefined) {
  const listRef = useRef<HTMLElement | null>(null);
  const [indicator, setIndicator] = useState<Indicator>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const el = list.querySelector<HTMLElement>("[data-active='true']");
      setIndicator(el ? { x: el.offsetLeft, y: el.offsetTop + el.offsetHeight - 2.5, w: el.offsetWidth } : null);
    };
    measure();
    // Skip the transition on first paint so the line doesn't slide in from 0.
    const raf = requestAnimationFrame(() => setReady(true));
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [activeKey]);

  const bar = indicator && (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 h-[2.5px] rounded-full bg-ink pointer-events-none"
      style={{
        width: indicator.w,
        transform: `translate(${indicator.x}px, ${indicator.y}px)`,
        transition: ready
          ? "transform var(--duration-spring) var(--ease-spring), width var(--duration-spring) var(--ease-spring)"
          : "none",
      }}
    />
  );

  return { listRef, bar };
}

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
  const isLinks = items.every((i) => i.to);
  const activeId = isLinks ? items.find((i) => i.to === pathname)?.id : value;
  const { listRef, bar } = useIndicator(activeId);

  if (isLinks) {
    return (
      <nav
        ref={(el) => {
          listRef.current = el;
        }}
        aria-label={label}
        className={`relative flex flex-wrap border-b border-border ${s.list}`}
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.to!}
              data-active={active}
              aria-current={active ? "page" : undefined}
              className={`${tabBase} ${s.tab} ${active ? on : off}`}
            >
              {item.label}
            </Link>
          );
        })}
        {bar}
      </nav>
    );
  }

  return (
    <div
      ref={(el) => {
        listRef.current = el;
      }}
      role="tablist"
      aria-label={label}
      className={`relative flex flex-wrap border-b border-border ${s.list}`}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-active={active}
            aria-selected={active}
            onClick={() => onChange?.(item.id)}
            className={`${tabBase} ${s.tab} ${active ? on : off}`}
          >
            {item.label}
          </button>
        );
      })}
      {bar}
    </div>
  );
}
