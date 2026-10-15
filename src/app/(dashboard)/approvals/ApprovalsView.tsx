"use client";

import { CircleAlert, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { retryPostAction } from "@/lib/actions";
import { formatDayMonth, formatDayMonthTime, relativeDays } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import { APPROVALS_TABS, approvalsTab, approvalsTabLabel, postLink, type ApprovalsTab } from "@/lib/status";
import type { Platform, Post } from "@/lib/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { PageHeader } from "@/components/PageHeader";
import { PlatformBadge } from "@/components/PlatformBadge";
import { PostImage } from "@/components/PostImage";
import { StatusChip } from "@/components/StatusChip";
import { Tabs } from "@/components/Tabs";

const row = "flex flex-wrap items-center gap-3.5 py-3.5 border-t border-divider";

function WaitingCard({ post }: { post: Post }) {
  const review = `/post/${post.id}/review`;
  const primaryPlatform = post.platforms[0];
  const excerpt = (primaryPlatform && post.content[primaryPlatform]?.text) || "";

  return (
    <Card className="p-6 flex flex-wrap gap-6">
      <Link href={review} aria-label={`Open ${post.topic}`} className="block flex-none">
        <PostImage className="w-[260px]" />
      </Link>
      <div className="flex-[1_1_360px] min-w-0 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <StatusChip status={post.status} />
        </div>
        <h2 className="heading text-[26px]">
          <Link href={review} className="text-ink no-underline hover:text-ink">
            {post.topic}
          </Link>
        </h2>
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted">
          {post.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
          <span>
            Goes out {formatDayMonthTime(post.date, post.time)} · {relativeDays(post.date, post.time)}
          </span>
        </div>
        {excerpt && <p className="m-0 text-nav max-w-[620px] line-clamp-2">{excerpt}</p>}
        {post.warnings && post.warnings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Chip tone="warning">
              {post.warnings.length} check{post.warnings.length === 1 ? "" : "s"} need attention
            </Chip>
          </div>
        )}
        <div className="flex flex-wrap gap-2.5 mt-1">
          <Button variant="primary" to={review}>
            Review &amp; approve
          </Button>
          <Button to={`/post/${post.id}/rewrite`}>Rewrite</Button>
          <Button variant="dangerOutline" to={`/post/${post.id}/reject`}>
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ApprovalsView({
  posts,
  reconnectPlatforms,
}: {
  posts: Post[];
  reconnectPlatforms: Platform[];
}) {
  const [tab, setTab] = useState<ApprovalsTab>("waiting");
  const [query, setQuery] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const bucketed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => p.topic.toLowerCase().includes(q));
  }, [posts, query]);

  const count = (t: ApprovalsTab) => bucketed.filter((p) => approvalsTab(p.status) === t).length;
  const inTab = bucketed
    .filter((p) => approvalsTab(p.status) === tab)
    .sort((a, b) =>
      tab === "published" || tab === "rejected"
        ? `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
        : `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
  const failed = bucketed.filter((p) => approvalsTab(p.status) === "failed");
  const recentlyDecided = bucketed
    .filter((p) => p.status === "scheduled" || p.status === "rejected")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  function retry(id: string) {
    setRetrying(id);
    startTransition(() => {
      void retryPostAction(id).finally(() => setRetrying(null));
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1120px] mx-auto">
      <PageHeader
        title="Approvals"
        subtitle="Every post stops here first. Approve it, change it, or send it back."
        actions={
          <label className="relative flex-[0_1_300px]">
            <Search size={18} strokeWidth={2} className="absolute left-3.5 top-[13px] text-muted" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search posts"
              placeholder="Search posts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-11 py-2.5 pr-3.5 pl-[42px] border border-control rounded-[10px] text-[15px] bg-card"
            />
          </label>
        }
      />

      <Tabs
        label="Post status"
        value={tab}
        onChange={(id) => setTab(id as ApprovalsTab)}
        items={APPROVALS_TABS.map((t) => ({
          id: t,
          label: (
            <>
              {approvalsTabLabel[t]}
              <span className={`rounded-full px-2 text-xs font-bold text-ink ${t === "waiting" && count(t) ? "bg-marigold" : "bg-divider"}`}>
                {count(t)}
              </span>
            </>
          ),
        }))}
      />

      {tab === "waiting" && reconnectPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-3.5 items-center bg-error-bg rounded-[14px] px-[18px] py-3.5 text-error">
          <CircleAlert size={22} strokeWidth={2} className="flex-none" aria-hidden="true" />
          <span className="flex-[1_1_300px]">
            <strong>{PLATFORMS[reconnectPlatforms[0]].label} login expired.</strong> Posts for{" "}
            {reconnectPlatforms.map((p) => PLATFORMS[p].label).join(", ")} will skip those platforms until you reconnect.
          </span>
          <Button to="/settings" className="border-[#E3BDB7]">
            Reconnect
          </Button>
        </div>
      )}

      {tab === "waiting" ? (
        <>
          {inTab.length ? (
            inTab.map((post) => <WaitingCard key={post.id} post={post} />)
          ) : (
            <Card className="p-6 text-muted">
              {query ? "No waiting posts match your search." : "Nothing is waiting for you. Nice."}
            </Card>
          )}

          {failed.length > 0 && (
            <Card className="px-6 pt-5 pb-2">
              <h2 className="heading text-[19px] pb-1.5">Needs a fix</h2>
              {failed.map((post) => (
                <div key={post.id} className={row}>
                  <PlatformBadge platform={post.platforms[0]} />
                  <div className="flex-[1_1_260px] min-w-0">
                    <div className="font-bold">{post.topic}</div>
                    <div className="text-sm text-error">
                      {post.lastError || `Failed · tried ${post.attempts} of ${post.maxAttempts}`}
                    </div>
                  </div>
                  <Button onClick={() => retry(post.id)} disabled={retrying === post.id}>
                    {retrying === post.id && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                    Try again
                  </Button>
                  <Button variant="ghost" to={`/post/${post.id}/review`}>
                    Edit post
                  </Button>
                </div>
              ))}
            </Card>
          )}

          <Card className="px-6 pt-5 pb-2">
            <div className="flex justify-between items-center gap-3 pb-1.5">
              <h2 className="heading text-[19px]">Recently decided</h2>
              <Link href="/calendar" className="font-bold text-sm">
                View in calendar
              </Link>
            </div>
            {recentlyDecided.length === 0 ? (
              <p className="py-3.5 m-0 text-muted border-t border-divider">Nothing decided yet.</p>
            ) : (
              recentlyDecided.map((post) => (
                <div key={post.id} className={row}>
                  <PlatformBadge platform={post.platforms[0]} />
                  <div className="flex-[1_1_260px] min-w-0">
                    <div className="font-bold">{post.topic}</div>
                    <div className="text-muted text-sm">
                      {post.status === "rejected"
                        ? post.rejectionReason ?? "Rejected"
                        : `Scheduled for ${formatDayMonthTime(post.date, post.time)}`}
                    </div>
                  </div>
                  <StatusChip status={post.status} />
                </div>
              ))
            )}
          </Card>
        </>
      ) : (
        <Card className="px-6 pt-2 pb-2">
          {inTab.length ? (
            inTab.map((post, i) => (
              <Link
                key={post.id}
                href={postLink(post)}
                className={`${row} ${i === 0 ? "border-t-0" : ""} text-ink no-underline hover:text-ink hover:bg-subtle`}
              >
                <span className="flex gap-1">
                  {post.platforms.map((p) => (
                    <PlatformBadge key={p} platform={p} />
                  ))}
                </span>
                <div className="flex-[1_1_260px] min-w-0">
                  <div className="font-bold">{post.topic}</div>
                  <div className="text-muted text-sm">
                    {post.status === "published" && `Published ${formatDayMonth(post.date)}`}
                    {post.status === "failed" && (post.lastError || `Failed · tried ${post.attempts} of ${post.maxAttempts}`)}
                    {post.status === "rejected" && (post.rejectionReason ?? "Rejected")}
                    {post.status === "scheduled" && `Scheduled for ${formatDayMonthTime(post.date, post.time)}`}
                  </div>
                </div>
                <StatusChip status={post.status} />
              </Link>
            ))
          ) : (
            <p className="py-4 m-0 text-muted">No posts here{query ? " match your search" : " yet"}.</p>
          )}
        </Card>
      )}
    </div>
  );
}
