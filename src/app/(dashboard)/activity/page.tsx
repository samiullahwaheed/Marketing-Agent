import Link from "next/link";
import { RotateCw } from "lucide-react";
import { getActivityData, getAccounts, getSettings, postsCollection } from "@/lib/db";
import { formatDayMonth } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import { statusDotColor, statusPill } from "@/lib/status";
import StatusDot from "@/components/StatusDot";
import Pill from "@/components/Pill";
import { approvePostAction, rejectPostAction, requestRewriteAction } from "@/lib/actions";
import type { Post } from "@/lib/types";

export default async function ActivityPage() {
  const [{ waiting, others }, accounts, settings] = await Promise.all([
    getActivityData(),
    getAccounts(),
    getSettings(),
  ]);

  const reconnectAccounts = accounts.filter((a) => a.status === "reconnect");
  let blockedCount = 0;
  if (reconnectAccounts.length > 0) {
    const col = await postsCollection();
    blockedCount = await col.countDocuments({
      status: { $in: ["waiting_approval", "scheduled"] },
      platforms: { $in: reconnectAccounts.map((a) => a.platform) },
    });
  }
  const creditsLow = settings.aiCreditsPercent <= 20;
  const alertCount = reconnectAccounts.length + (creditsLow ? 1 : 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Activity</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {waiting.length} post{waiting.length === 1 ? "" : "s"} waiting · {alertCount} alert
        {alertCount === 1 ? "" : "s"}
      </p>

      <div className="mt-6 flex gap-6">
        <div className="flex-1 space-y-6">
          <div className="rounded-xl border border-black/5 bg-white">
            <div className="px-5 pt-4 pb-2 text-sm font-medium text-neutral-500">Waiting for you</div>
            {waiting.length === 0 ? (
              <div className="px-5 pb-5 text-sm text-neutral-400">Nothing needs your review.</div>
            ) : (
              <div className="divide-y divide-black/5">
                {waiting.map((post) => (
                  <WaitingCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/5 bg-white">
            <div className="px-5 pt-4 pb-2 text-sm font-medium text-neutral-500">Everything else</div>
            <div className="divide-y divide-black/5">
              {others.length === 0 ? (
                <div className="px-5 pb-5 text-sm text-neutral-400">Nothing here yet.</div>
              ) : (
                others.map((post) => {
                  const pill = statusPill(post.status);
                  const failed = post.status === "failed";
                  return (
                    <div key={post.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1.5">
                          <StatusDot color={statusDotColor(post.status)} />
                        </span>
                        <div>
                          <Link
                            href={`/post/${post.id}`}
                            className="text-sm font-medium text-neutral-900 hover:underline"
                          >
                            {post.topic}
                          </Link>
                          <p className={`mt-0.5 text-sm ${failed ? "text-red-600" : "text-neutral-500"}`}>
                            {post.status === "published" && `Published ${formatDayMonth(post.date)}`}
                            {post.status === "failed" && `Failed · tried ${post.attempts} of ${post.maxAttempts}`}
                            {post.status === "scheduled" &&
                              `${post.platforms.map((p) => PLATFORMS[p].label).join(", ")} · scheduled ${formatDayMonth(post.date)}`}
                            {post.status === "rejected" && "Rejected"}
                            {post.status === "processing" && "Generating content…"}
                          </p>
                        </div>
                      </div>
                      {failed ? (
                        <RotateCw size={16} className="mt-1 shrink-0 text-neutral-400" />
                      ) : (
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0 space-y-3">
          {reconnectAccounts.map((a) => (
            <div key={a.id} className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{PLATFORMS[a.platform].label} login expired</p>
              <p className="mt-0.5 text-sm text-red-700">
                {blockedCount} post{blockedCount === 1 ? "" : "s"} blocked
              </p>
            </div>
          ))}
          {creditsLow && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">AI credits low</p>
              <p className="mt-0.5 text-sm text-amber-700">
                About {settings.aiCreditsPostsLeft} posts left
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WaitingCard({ post }: { post: Post }) {
  const primaryPlatform = post.platforms[0];
  const snippet = (primaryPlatform && post.content[primaryPlatform]?.text) || "";

  return (
    <div className="px-5 py-4">
      <div className="flex gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-300">
          <ImageIcon />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/post/${post.id}`} className="text-[15px] font-medium text-neutral-900 hover:underline">
            {post.topic}
          </Link>
          <p className="mt-0.5 text-sm text-neutral-500">
            {post.platforms.map((p) => PLATFORMS[p].label).join(", ")} · {formatDayMonth(post.date)}, {post.time}
          </p>
          {snippet && <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{snippet}</p>}
          <Link href={`/post/${post.id}`} className="mt-1 inline-block text-sm text-blue-600 hover:underline">
            Read full post
          </Link>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <form action={approvePostAction.bind(null, post.id)}>
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Approve
          </button>
        </form>
        <form action={requestRewriteAction.bind(null, post.id)}>
          <button
            type="submit"
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/3"
          >
            Rewrite
          </button>
        </form>
        <form action={rejectPostAction.bind(null, post.id)}>
          <button
            type="submit"
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Reject
          </button>
        </form>
      </div>
    </div>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
