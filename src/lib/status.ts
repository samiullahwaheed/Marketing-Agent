import type { PostStatus } from "./types";

export type DotColor = "blue" | "green" | "red" | "amber" | "gray";
export type PillTone = "green" | "amber" | "red" | "blue" | "gray";

export function statusDotColor(status: PostStatus): DotColor {
  switch (status) {
    case "scheduled":
      return "blue";
    case "published":
      return "green";
    case "failed":
      return "red";
    case "waiting_approval":
      return "amber";
    case "processing":
      return "gray";
    case "rejected":
    default:
      return "gray";
  }
}

export function statusPill(status: PostStatus): { label: string; tone: PillTone } {
  switch (status) {
    case "scheduled":
      return { label: "Approved", tone: "blue" };
    case "published":
      return { label: "Published", tone: "green" };
    case "failed":
      return { label: "Failed", tone: "red" };
    case "waiting_approval":
      return { label: "Waiting", tone: "amber" };
    case "processing":
      return { label: "Processing", tone: "gray" };
    case "rejected":
    default:
      return { label: "Rejected", tone: "gray" };
  }
}
