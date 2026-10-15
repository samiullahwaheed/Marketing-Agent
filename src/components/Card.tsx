import type { ElementType, ReactNode } from "react";

export function Card({
  as: Tag = "section",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`bg-card border border-border rounded-2xl ${className}`}>{children}</Tag>;
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
