import type { ReactNode } from "react";
import { toneClasses } from "@/lib/tones";
import type { Tone } from "@/lib/tones";

export function Chip({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[13px] font-semibold leading-[1.4] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
