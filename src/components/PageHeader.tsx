import type { ReactNode } from "react";

const sizes = {
  lg: { title: "text-[34px] sm:text-[42px]", subtitle: "text-[17px]" },
  md: { title: "text-[32px] sm:text-[38px]", subtitle: "text-base" },
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  size = "lg",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  size?: keyof typeof sizes;
}) {
  return (
    <header className="flex flex-wrap gap-4 items-end justify-between">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={`heading leading-[1.08] ${sizes[size].title}`}>{title}</h1>
        {subtitle && <p className={`m-0 text-muted ${sizes[size].subtitle}`}>{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}
