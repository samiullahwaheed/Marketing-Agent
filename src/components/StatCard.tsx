import type { Stat } from "@/lib/mock-strategy";

const noteTones = {
  success: "text-success font-semibold",
  warning: "text-warning font-semibold",
  error: "text-error font-semibold",
  muted: "text-muted",
};

/** Frosted tile (Home "Last 30 days"). */
export function StatCard({ label, value, note, noteTone = "muted" }: Stat) {
  return (
    // Sits inside a glass card, so it is a flat tint rather than a second blurred layer.
    <div className="bg-white/70 border border-[rgb(23_32_28/0.06)] rounded-xl px-4 py-3.5">
      <div className="text-muted text-[13px]">{label}</div>
      <div className="heading text-[28px]">{value}</div>
      <div className={`text-[13px] ${noteTones[noteTone]}`}>{note}</div>
    </div>
  );
}

/** Bordered card with a large number (Insights, Published post). */
export function MetricCard({ label, value, note, noteTone = "muted", highlight }: Stat) {
  if (highlight) {
    return (
      <div className="bg-primary-light/85 backdrop-blur-md border border-[#C9DDD0]/80 rounded-2xl px-5 py-[18px] flex flex-col gap-1 text-primary-hover">
        <span className="text-sm">{label}</span>
        <span className="heading text-[34px]">{value}</span>
        <span className="text-[13px] font-semibold">{note}</span>
      </div>
    );
  }
  return (
    <div className="bg-white/60 backdrop-blur-xl backdrop-saturate-150 border border-white/70 rounded-2xl px-5 py-[18px] flex flex-col gap-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_1px_2px_rgb(23_32_28/0.05),0_10px_32px_rgb(23_32_28/0.08)]">
      <span className="text-muted text-sm">{label}</span>
      <span className="heading text-[34px]">{value}</span>
      <span className={`text-[13px] ${noteTones[noteTone]}`}>{note}</span>
    </div>
  );
}
