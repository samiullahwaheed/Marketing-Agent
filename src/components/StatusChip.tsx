import { statusInfo } from "@/lib/status";
import type { PostStatus } from "@/lib/types";
import { Chip } from "./Chip";

export function StatusChip({ status, postNow }: { status: PostStatus; postNow?: boolean }) {
  const s = statusInfo[status];
  // A "post now" draft is sent the moment it is approved, so it is publishing, not waiting for a date.
  const label = status === "scheduled" && postNow ? "Publishing…" : s.label;
  return <Chip tone={s.tone}>{label}</Chip>;
}
