import type { PillTone } from "@/lib/status";

const TONES: Record<PillTone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-neutral-100 text-neutral-600",
};

export default function Pill({
  tone,
  children,
}: {
  tone: PillTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
