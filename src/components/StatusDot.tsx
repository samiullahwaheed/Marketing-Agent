import type { DotColor } from "@/lib/status";

const DOT: Record<DotColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  gray: "bg-neutral-300",
};

export default function StatusDot({ color }: { color: DotColor }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT[color]}`} />;
}
