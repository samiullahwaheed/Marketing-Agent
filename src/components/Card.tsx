import type { ElementType, ReactNode } from "react";

export function Card({
  as: Tag = "section",
  className = "",
  /** Set false when the caller supplies its own background/border (avoids conflicting bg-* utilities). */
  glass = true,
  children,
}: {
  as?: ElementType;
  className?: string;
  glass?: boolean;
  children: ReactNode;
}) {
  const base = glass
    ? "bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 shadow-[0_8px_32px_rgba(23,32,28,0.10)]"
    : "";
  return <Tag className={`${base} rounded-2xl ${className}`}>{children}</Tag>;
}

/** Card title row: heading on the left, optional link or chip on the right. */
export function CardHeader({ title, aside, className = "" }: { title: string; aside?: ReactNode; className?: string }) {
  return (
    <div className={`flex justify-between items-center gap-3 ${className}`}>
      <h2 className="heading text-[21px]">{title}</h2>
      {aside}
    </div>
  );
}
