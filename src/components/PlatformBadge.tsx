import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";

const sizes = {
  sm: "w-5 h-5 rounded-[7px] text-[10px]",
  md: "w-6 h-6 rounded-[7px] text-[11px]",
};

export function PlatformBadge({ platform, size = "md" }: { platform: Platform; size?: keyof typeof sizes }) {
  const p = PLATFORMS[platform];
  return (
    <span
      title={p.label}
      className={`inline-flex items-center justify-center flex-none text-white font-bold leading-none ${p.bg} ${sizes[size]}`}
    >
      <span aria-hidden="true">{p.short}</span>
      <span className="sr-only">{p.label}</span>
    </span>
  );
}
