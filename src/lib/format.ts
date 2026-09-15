export function todayLong(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function formatDayMonth(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function formatDayMonthTime(date: string, time: string): string {
  return `${formatDayMonth(date)}, ${time}`;
}

export function formatDayMonthYear(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function relativeDays(date: string, time: string): string {
  const target = parseDateTime(date, time);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

export function formatIsoDayMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function platformLabelList(platforms: string[], labels: Record<string, string>): string {
  return platforms.map((p) => labels[p] ?? p).join(", ");
}
