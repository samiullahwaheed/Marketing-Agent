const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Date-only strings ("2026-10-20") are read as local midnight, not UTC. */
const toDate = (value: string | Date) =>
  typeof value === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value) : value;

export function todayLong(): string {
  return longDate(new Date());
}

export function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
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

export function platformLabelList(platforms: string[], labels: Record<string, string>): string {
  return platforms.map((p) => labels[p] ?? p).join(", ");
}

/** "Wednesday, 14 October" */
export function longDate(value: string | Date) {
  const d = toDate(value);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Fri 9 Oct" — alias: formatDayMonth kept for existing callers. */
export function shortDate(value: string | Date) {
  const d = toDate(value);
  return `${shortDay(d)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export const formatDayMonth = (date: string) => `${toDate(date).getDate()} ${MONTHS[toDate(date).getMonth()].slice(0, 3)}`;

export function formatDayMonthTime(date: string, time: string): string {
  return `${formatDayMonth(date)}, ${time}`;
}

export function formatDayMonthYear(date: string): string {
  const d = toDate(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function formatIsoDayMonth(iso: string): string {
  return formatDayMonth(iso.slice(0, 10));
}

/** "Thu" */
export function shortDay(value: string | Date) {
  return DAYS[toDate(value).getDay()].slice(0, 3);
}

/** "09:00" */
export function time(value: string | Date) {
  const d = toDate(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "October 2026" */
export function monthYear(value: string | Date) {
  const d = toDate(value);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "9 Oct" */
export function dayMonth(value: string | Date) {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "2026-10-14", in local time */
export function dateKey(value: string | Date) {
  const d = toDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Whole days from `from` to `to`, ignoring the time of day. */
export function daysBetween(from: string | Date, to: string | Date) {
  const a = toDate(from);
  const b = toDate(to);
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** "6,300" */
export function number(n: number) {
  return n.toLocaleString("en-GB");
}
