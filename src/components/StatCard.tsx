import type { Stat } from "@/lib/mock-strategy";

const noteTones = {
  success: "text-success font-semibold",
  warning: "text-warning font-semibold",
  error: "text-error font-semibold",
  muted: "text-muted",
};

/** Small grey tile (Home "Last 30 days"). */
export function StatCard({ label, value, note, noteTone = "muted" }: Stat) {
  return (
    <div className="bg-tile rounded-xl px-4 py-3.5">
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
      <div className="bg-primary-light border border-[#C9DDD0] rounded-2xl px-5 py-[18px] flex flex-col gap-1 text-primary-hover">
        <span className="text-sm">{label}</span>
        <span className="heading text-[34px]">{value}</span>
        <span className="text-[13px] font-semibold">{note}</span>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-[18px] flex flex-col gap-1">
      <span className="text-muted text-sm">{label}</span>
      <span className="heading text-[34px]">{value}</span>
      <span className={`text-[13px] ${noteTones[noteTone]}`}>{note}</span>
    </div>
  );
}
