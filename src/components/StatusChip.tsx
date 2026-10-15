import { statusInfo } from "@/lib/status";
import type { PostStatus } from "@/lib/types";
import { Chip } from "./Chip";

export function StatusChip({ status }: { status: PostStatus }) {
  const s = statusInfo[status];
  return <Chip tone={s.tone}>{s.label}</Chip>;
}
