import type { Post, PostStatus } from "./types";
import type { Tone } from "./tones";

export const statusInfo: Record<PostStatus, { label: string; tone: Tone }> = {
  processing: { label: "Writing…", tone: "neutral" },
  waiting_approval: { label: "Waiting for you", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "info" },
  published: { label: "Published", tone: "success" },
  failed: { label: "Failed", tone: "error" },
  rejected: { label: "Rejected", tone: "neutral" },
};

export type ApprovalsTab = "waiting" | "scheduled" | "failed" | "published" | "rejected";

export const APPROVALS_TABS: ApprovalsTab[] = ["waiting", "scheduled", "failed", "published", "rejected"];

export const approvalsTabLabel: Record<ApprovalsTab, string> = {
  waiting: "Waiting for you",
  scheduled: "Scheduled",
  failed: "Failed",
  published: "Published",
  rejected: "Rejected",
};

/** Buckets the real PostStatus values into the 5 Approvals tabs. */
export function approvalsTab(status: PostStatus): ApprovalsTab {
  if (status === "processing" || status === "waiting_approval") return "waiting";
  return status;
}

/**
 * Where clicking a post should take you. Published posts open their report;
 * everything else (waiting, processing, scheduled, rejected) opens the review
 * screen, which shows an "Already {status}" chip instead of Approve when it
 * isn't awaiting approval. Failed posts are only ever reached inline from
 * Approvals' "Needs a fix" row, never through this helper.
 */
export function postLink(post: Pick<Post, "id" | "status">): string {
  if (post.status === "published") return `/post/${post.id}`;
  return `/post/${post.id}/review`;
}
