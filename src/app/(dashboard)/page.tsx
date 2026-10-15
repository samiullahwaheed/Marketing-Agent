import { Clock, Lightbulb, Plus, TriangleAlert, Unlink } from "lucide-react";
import Link from "next/link";
import { getHomeData, getAccounts, getSettings, postsCollection } from "@/lib/db";
import { todayLong, formatDayMonth, shortDay } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import { postLink } from "@/lib/status";
import { Button } from "@/components/Button";
import { Card, CardHeader } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { PlatformBadge } from "@/components/PlatformBadge";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

const row = "flex flex-wrap items-center py-4 border-t border-divider";

interface NeedsYouItem {
  id: string;
  tone: "warning" | "error";
  icon: "clock" | "unlink" | "alert";
  title: string;
  detail: string;
  action: { label: string; href: string; variant: "primary" | "secondary" };
}

const needsYouIcons = { clock: Clock, unlink: Unlink, alert: TriangleAlert };
const needsYouBox = {
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
};

function sumViews(post: { results?: Partial<Record<string, { views?: number }>> }): number {
  if (!post.results) return 0;
  return Object.values(post.results).reduce((sum, r) => sum + (r?.views || 0), 0);
}

export default async function HomePage() {
  const [home, accounts, settings] = await Promise.all([
    getHomeData(),
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

  const needsYou: NeedsYouItem[] = [];
  if (home.waitingCount > 0) {
    needsYou.push({
      id: "waiting",
      tone: "warning",
      icon: "clock",
      title: `${home.waitingCount} post${home.waitingCount === 1 ? "" : "s"} waiting for your approval`,
      detail: "Review the text, hashtags and image before they go out.",
      action: { label: "Review posts", href: "/approvals", variant: "primary" },
    });
  }
  for (const a of reconnectAccounts) {
    needsYou.push({
      id: `reconnect-${a.platform}`,
      tone: "error",
      icon: "unlink",
      title: `${PLATFORMS[a.platform].label} login expired`,
      detail: `${blockedCount} post${blockedCount === 1 ? "" : "s"} blocked until you reconnect.`,
      action: { label: `Reconnect ${PLATFORMS[a.platform].label}`, href: "/settings", variant: "secondary" },
    });
  }
  if (home.failedCount > 0) {
    needsYou.push({
      id: "failed",
      tone: "error",
      icon: "alert",
      title: `${home.failedCount} post${home.failedCount === 1 ? "" : "s"} failed to publish`,
      detail: "Check Approvals for what went wrong.",
      action: { label: "Go to Approvals", href: "/approvals", variant: "secondary" },
    });
  }
  if (creditsLow) {
    needsYou.push({
      id: "credits",
      tone: "warning",
      icon: "alert",
      title: "AI credits running low",
      detail: `About ${settings.aiCreditsPostsLeft} posts left this month.`,
      action: { label: "Top up", href: "/settings", variant: "secondary" },
    });
  }

  return (
    <div className="flex flex-col gap-7 max-w-[1120px] mx-auto">
      <PageHeader
        eyebrow={todayLong()}
        title="Home"
        subtitle={needsYou.length === 0 ? "Everything is on track." : "Here's what needs your attention."}
        actions={
          <Button variant="primary" to="/new-post">
            <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
            New post
          </Button>
        }
      />

      {needsYou.length > 0 && (
        <Card className="px-6 py-1.5">
          <CardHeader
            title="Needs you"
            className="pt-4 pb-2.5"
            aside={<Chip tone="warning">{needsYou.length} things</Chip>}
          />
          {needsYou.map((item) => {
            const Icon = needsYouIcons[item.icon];
            return (
              <div key={item.id} className={`${row} gap-4`}>
                <span className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center flex-none ${needsYouBox[item.tone]}`}>
                  <Icon size={22} strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="flex-[1_1_300px] min-w-0">
                  <div className="font-bold text-base">{item.title}</div>
                  <div className="text-muted text-sm">{item.detail}</div>
                </div>
                <Button variant={item.action.variant} to={item.action.href}>
                  {item.action.label}
                </Button>
              </div>
            );
          })}
        </Card>
      )}

      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))]">
        <Card className="px-6 pt-[22px] pb-2">
          <CardHeader title="Coming up" className="pb-3" aside={<Link href="/calendar" className="font-bold text-sm">Open calendar</Link>} />
          {home.comingUp.length === 0 ? (
            <p className="py-4 m-0 text-muted">Nothing scheduled yet.</p>
          ) : (
            home.comingUp.map((post) => (
              <Link
                key={post.id}
                href={postLink(post)}
                className={`${row} gap-3.5 text-ink no-underline hover:text-ink hover:bg-white/40`}
              >
                <div className="w-[54px] text-center border border-white/55 rounded-[10px] py-[5px] flex-none bg-white/45 backdrop-blur-sm">
                  <div className="eyebrow text-[10.5px]">{shortDay(`${post.date}T00:00`)}</div>
                  <div className="heading text-[21px] leading-[1.1]">{new Date(`${post.date}T00:00`).getDate()}</div>
                </div>
                <div className="flex-[1_1_180px] min-w-0">
                  <div className="font-bold">{post.topic}</div>
                  <div className="text-muted text-[13.5px] flex items-center gap-1.5">
                    {post.time}
                    {post.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                  </div>
                </div>
                <Chip tone="info">Scheduled</Chip>
              </Link>
            ))
          )}
        </Card>

        <Card className="px-6 pt-[22px] pb-6 flex flex-col gap-[18px]">
          <CardHeader title="Last 30 days" aside={<Link href="/strategy/insights" className="font-bold text-sm">See insights</Link>} />
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Published this month" value={String(home.publishedThisMonth)} note="" />
            <StatCard
              label="Waiting for you"
              value={String(home.waitingCount)}
              note={home.waitingCount > 0 ? "Needs review" : "All clear"}
              noteTone={home.waitingCount > 0 ? "warning" : "muted"}
            />
            <StatCard
              label="Failed"
              value={String(home.failedCount)}
              note={home.failedCount > 0 ? "Needs a fix" : "None"}
              noteTone={home.failedCount > 0 ? "error" : "muted"}
            />
            <StatCard label="Scheduled" value={String(home.scheduledCount)} note="" />
          </div>
          <div className="flex gap-3 items-start bg-primary-light rounded-xl px-4 py-3.5">
            <Lightbulb size={20} strokeWidth={2} className="text-primary flex-none mt-0.5" aria-hidden="true" />
            <div className="text-sm text-primary-hover">
              Want the full breakdown of what&rsquo;s working?{" "}
              <Link href="/strategy/insights" className="font-bold">
                See insights
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Card className="px-6 pt-[22px] pb-2">
        <CardHeader title="Recent" className="pb-2.5" aside={<Link href="/approvals" className="font-bold text-sm">All posts</Link>} />
        {home.recent.length === 0 ? (
          <p className="py-4 m-0 text-muted">Nothing published yet.</p>
        ) : (
          home.recent.map((post) => {
            const failed = post.status === "failed";
            return (
              <Link
                key={post.id}
                href={failed ? "/approvals" : `/post/${post.id}`}
                className="flex flex-wrap items-center gap-3.5 py-3.5 border-t border-divider no-underline text-ink hover:text-ink hover:bg-white/40"
              >
                <PlatformBadge platform={post.platforms[0]} />
                <div className="flex-[1_1_220px] min-w-0">
                  <div className="font-bold">{post.topic}</div>
                  <div className="text-muted text-[13.5px]">
                    {failed
                      ? `Failed · tried ${post.attempts} of ${post.maxAttempts}`
                      : `Published ${formatDayMonth(post.date)} · ${sumViews(post)} views`}
                  </div>
                </div>
                <Chip tone={failed ? "error" : "success"}>{failed ? "Failed" : "Published"}</Chip>
              </Link>
            );
          })
        )}
      </Card>
    </div>
  );
}
