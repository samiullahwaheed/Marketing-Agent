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
    ? // Bright top edge = light catching the material; two-layer shadow reads as real depth.
      "bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_1px_2px_rgb(23_32_28/0.05),0_10px_32px_rgb(23_32_28/0.08)]"
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
