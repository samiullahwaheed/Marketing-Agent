import Link from "next/link";
import { RotateCw, Clock, AlertTriangle } from "lucide-react";
import { getHomeData, getAccounts, getSettings, postsCollection } from "@/lib/db";
import { todayLong, relativeDays, formatDayMonth } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import StatusDot from "@/components/StatusDot";
import Pill from "@/components/Pill";
import PlatformIcon from "@/components/PlatformIcon";
import { statusDotColor } from "@/lib/status";

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

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Home</h1>
          <p className="mt-1 text-sm text-neutral-500">{todayLong()}</p>
        </div>
        <Link
          href="/new-post"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New post
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <StatCard value={home.publishedThisMonth} label="Published this month" />
        <StatCard value={home.waitingCount} label="Waiting for you" tone="amber" />
        <StatCard value={home.failedCount} label="Failed" tone="red" />
        <StatCard value={home.scheduledCount} label="Scheduled" />
      </div>

      <div className="mt-6 flex gap-6">
        <div className="flex-1 space-y-6">
          <Card title="Coming up">
            {home.comingUp.length === 0 ? (
              <EmptyRow text="Nothing scheduled yet." />
            ) : (
              home.comingUp.map((post) => (
                <Row key={post.id}>
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
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {post.platforms.map((p) => PLATFORMS[p].label).join(", ")} · {formatDayMonth(post.date)}, {post.time}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-neutral-400">
                    {relativeDays(post.date, post.time)}
                  </span>
                </Row>
              ))
            )}
          </Card>

          <Card title="Recent">
            {home.recent.length === 0 ? (
              <EmptyRow text="Nothing published yet." />
            ) : (
              home.recent.map((post) => {
                const failed = post.status === "failed";
                return (
                  <Row key={post.id}>
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
                          {failed
                            ? `Failed · tried ${post.attempts} of ${post.maxAttempts}`
                            : `Published ${formatDayMonth(post.date)}`}
                        </p>
                      </div>
                    </div>
                    {failed ? (
                      <RotateCw size={16} className="mt-1 shrink-0 text-neutral-400" />
                    ) : (
                      <span className="shrink-0 text-sm text-neutral-500">
                        {sumViews(post)} views
                      </span>
                    )}
                  </Row>
                );
              })
            )}
          </Card>
        </div>

        <div className="w-72 shrink-0 space-y-3">
          {reconnectAccounts.map((a) => (
            <AlertCard
              key={a.id}
              tone="red"
              icon={Clock}
              title={`${PLATFORMS[a.platform].label} login expired`}
              detail={`${blockedCount} post${blockedCount === 1 ? "" : "s"} blocked`}
            />
          ))}
          {creditsLow && (
            <AlertCard
              tone="amber"
              icon={AlertTriangle}
              title="AI credits low"
              detail={`About ${settings.aiCreditsPostsLeft} posts left`}
            />
          )}

          <Card title="Accounts">
            {accounts.map((a) => (
              <Row key={a.id}>
                <div className="flex items-center gap-2.5">
                  <PlatformIcon platform={a.platform} size={20} />
                  <span className="text-sm text-neutral-800">{a.label}</span>
                </div>
                {a.status === "connected" && <Pill tone="green">Connected</Pill>}
                {a.status === "reconnect" && <Pill tone="amber">Reconnect</Pill>}
                {a.status === "not_connected" && <Pill tone="gray">Add</Pill>}
              </Row>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function sumViews(post: { results?: Partial<Record<string, { views?: number }>> }): number {
  if (!post.results) return 0;
  return Object.values(post.results).reduce((sum, r) => sum + (r?.views || 0), 0);
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "amber" | "red";
}) {
  const box =
    tone === "amber"
      ? "border-amber-100 bg-amber-50"
      : tone === "red"
        ? "border-red-100 bg-red-50"
        : "border-black/5 bg-white";
  const num =
    tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red-600" : "text-neutral-900";

  return (
    <div className={`rounded-xl border p-5 ${box}`}>
      <div className={`text-3xl font-semibold ${num}`}>{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white">
      <div className="px-5 pt-4 pb-2 text-sm font-medium text-neutral-500">{title}</div>
      <div className="divide-y divide-black/5">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 px-5 py-3.5">{children}</div>;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-5 py-6 text-sm text-neutral-400">{text}</div>;
}

function AlertCard({
  tone,
  icon: Icon,
  title,
  detail,
}: {
  tone: "red" | "amber";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  detail: string;
}) {
  const box = tone === "red" ? "border-red-100 bg-red-50" : "border-amber-100 bg-amber-50";
  const text = tone === "red" ? "text-red-700" : "text-amber-700";
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-4 ${box}`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${text}`} />
      <div>
        <p className={`text-sm font-medium ${text}`}>{title}</p>
        <p className={`mt-0.5 text-sm ${text}`}>{detail}</p>
      </div>
    </div>
  );
}
