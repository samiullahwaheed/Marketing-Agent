import Link from "next/link";
import { AlertCircle, ImageIcon as ImageIconLucide } from "lucide-react";
import { formatDayMonth, formatDayMonthTime } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import Pill from "@/components/Pill";
import CopyButton from "@/components/CopyButton";
import PlatformIcon from "@/components/PlatformIcon";
import {
  giveUpOnPostAction,
  reconnectAccountAction,
  rejectPostAction,
  retryPostAction,
} from "@/lib/actions";
import { statusPill } from "@/lib/status";
import type { Account, Post } from "@/lib/types";

export default function PostDetailView({ post, accounts }: { post: Post; accounts: Account[] }) {
  const accountByPlatform = Object.fromEntries(accounts.map((a) => [a.platform, a]));
  const pill = statusPill(post.status);

  const primaryPlatform = post.platforms[0];
  const previewText = (primaryPlatform && post.content[primaryPlatform]?.text) || post.topic;

  const totals = post.platforms.reduce(
    (acc, p) => {
      const r = post.results?.[p];
      acc.views += r?.views || 0;
      acc.reactions += r?.reactions || 0;
      acc.comments += r?.comments || 0;
      return acc;
    },
    { views: 0, reactions: 0, comments: 0 }
  );

  const failingPlatform =
    post.platforms.find((p) => accountByPlatform[p]?.status === "reconnect") ?? post.platforms[0];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Post</h1>
      <p className="mt-1 text-sm text-neutral-500">Opened from your dashboard</p>

      <div className="mt-6 rounded-xl border border-black/5 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-neutral-900">{post.topic}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {post.status === "failed" && `Was due ${formatDayMonthTime(post.date, post.time)}`}
              {post.status === "published" && `Published ${formatDayMonth(post.date)}`}
              {post.status === "scheduled" && `Scheduled for ${formatDayMonthTime(post.date, post.time)}`}
              {post.status === "processing" && "The agent is generating this post"}
              {post.status === "rejected" && "Rejected · not published"}
            </p>
          </div>
          <Pill tone={pill.tone}>{pill.label}</Pill>
        </div>

        {post.status === "failed" && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3.5">
            <div className="flex gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <div className="text-sm text-red-700">
                <p className="font-medium">
                  Your {PLATFORMS[failingPlatform].label} login expired
                </p>
                <p className="mt-0.5">
                  {post.lastError || "The post was written and the image was made, but the account needs reconnecting."}
                </p>
                <p className="mt-1.5 text-xs text-red-600">
                  Tried {post.attempts}
                  {post.attempts === 1 ? " time" : " times"}
                  {post.lastAttemptAt && ` · last at ${new Date(post.lastAttemptAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  {" · "}
                  {Math.max(0, post.maxAttempts - post.attempts)} attempt
                  {Math.max(0, post.maxAttempts - post.attempts) === 1 ? "" : "s"} left
                </p>
              </div>
            </div>
          </div>
        )}

        {post.status === "published" && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatBox label="Views" value={totals.views} />
            <StatBox label="Reactions" value={totals.reactions} />
            <StatBox label="Comments" value={totals.comments} />
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-medium text-neutral-700">
            {post.status === "published" ? "Where it went" : "What happened on each"}
          </p>
          <div className="mt-2 divide-y divide-black/5 rounded-lg border border-black/5">
            {post.platforms.map((p) => {
              const r = post.results?.[p];
              return (
                <div key={p} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform={p} size={20} />
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{PLATFORMS[p].label}</p>
                      <p className="text-xs text-neutral-500">
                        {r?.status === "published" && `Published ${r.publishedAt ? formatDayMonthTime(post.date, post.time) : formatDayMonth(post.date)}`}
                        {r?.status === "scheduled" && `Scheduled ${formatDayMonthTime(post.date, post.time)}`}
                        {(!r || r.status === "not_sent" || r.status === "failed") && "Not sent"}
                      </p>
                    </div>
                  </div>
                  {r?.status === "published" && r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open on {PLATFORMS[p].label} ↗
                    </a>
                  ) : (
                    <span className="text-sm text-neutral-400">
                      {r?.status === "published" ? "Not sent" : ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-neutral-700">The post</p>
          <div className="mt-2 flex gap-3 rounded-lg border border-black/5 p-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50 text-neutral-300">
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIconLucide size={20} strokeWidth={1.5} />
              )}
            </div>
            <p className="line-clamp-3 text-sm text-neutral-600">{previewText}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-black/5 pt-5">
          {post.status === "failed" && (
            <>
              <form action={reconnectAccountAction.bind(null, failingPlatform)}>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Reconnect {PLATFORMS[failingPlatform].label}
                </button>
              </form>
              <form action={retryPostAction.bind(null, post.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/3"
                >
                  Try again
                </button>
              </form>
              <form action={giveUpOnPostAction.bind(null, post.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Give up on this
                </button>
              </form>
            </>
          )}

          {post.status === "published" && (
            <>
              <Link
                href={`/new-post?topic=${encodeURIComponent(`Follow-up: ${post.topic}`)}`}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/3"
              >
                Write a follow-up
              </Link>
              <CopyButton text={previewText} />
            </>
          )}

          {post.status === "scheduled" && (
            <form action={rejectPostAction.bind(null, post.id)}>
              <button
                type="submit"
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cancel this post
              </button>
            </form>
          )}

          {post.status === "rejected" && (
            <form action={retryPostAction.bind(null, post.id)}>
              <button
                type="submit"
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/3"
              >
                Restore to review
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-neutral-50 p-3.5">
      <div className="text-xl font-semibold text-neutral-900">{value}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{label}</div>
    </div>
  );
}
