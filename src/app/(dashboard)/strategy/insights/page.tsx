"use client";

import { useState } from "react";
import Link from "next/link";
import { insights } from "@/lib/mock-strategy";
import { number } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PlatformBadge } from "@/components/PlatformBadge";
import { MetricCard } from "@/components/StatCard";
import { StrategyHeader } from "@/components/StrategyHeader";

const BAR_MAX_PX = 170;
const select = "min-h-11 px-3.5 border border-control rounded-[10px] bg-card text-sm font-semibold text-ink";
const th = "text-left text-xs font-bold tracking-[.07em] uppercase text-muted px-3 py-2.5 border-b border-border";
const td = "px-3 py-3.5 border-b border-divider";

export default function StrategyInsightsPage() {
  const data = insights;
  const [range, setRange] = useState(data.ranges[0]);
  const [platform, setPlatform] = useState<"all" | Platform>("all");

  const filters = (
    <div className="flex flex-wrap gap-2.5">
      <label>
        <span className="sr-only">Date range</span>
        <select className={select} value={range} onChange={(e) => setRange(e.target.value)}>
          {data.ranges.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Platform</span>
        <select className={select} value={platform} onChange={(e) => setPlatform(e.target.value as "all" | Platform)}>
          <option value="all">All platforms</option>
          {data.platforms
            .filter((p) => p.connected)
            .map((p) => (
              <option key={p.platform} value={p.platform}>
                {PLATFORMS[p.platform].label}
              </option>
            ))}
        </select>
      </label>
    </div>
  );

  const max = Math.max(...data.weeks.map((w) => w.views));
  const cols = { gridTemplateColumns: `repeat(${data.weeks.length}, minmax(0, 1fr))` };
  const topicMax = Math.max(...data.topics.map((t) => t.avg));

  return (
    <div className="flex flex-col gap-6 max-w-[1120px] mx-auto">
      <StrategyHeader actions={filters} />

      <p className="m-0 -mt-4 text-muted text-[13px]">Illustrative sample data — real analytics aren&apos;t connected yet.</p>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]">
        {data.stats.map((s) => (
          <MetricCard key={s.label} {...s} />
        ))}
      </div>

      <Card className="px-6 py-[22px] flex flex-col gap-[18px]">
        <div className="flex flex-wrap justify-between items-baseline gap-2.5">
          <h2 className="heading text-xl">Views per week</h2>
          <span className="text-muted text-[13px]">{data.weekNote}</span>
        </div>
        <div
          className="grid gap-[clamp(10px,3vw,36px)] items-end h-[220px] px-1 border-b border-[#DADDD6]"
          style={cols}
          role="img"
          aria-label={data.weeks.map((w) => `${w.label}: ${number(w.views)} views`).join(", ")}
        >
          {data.weeks.map((w) => (
            <div key={w.label} className="flex flex-col items-center justify-end gap-1.5 h-full">
              <span className="font-bold text-sm tabular-nums">{number(w.views)}</span>
              <span
                className="block w-full max-w-[88px] rounded-[10px_10px_4px_4px]"
                style={{
                  height: `${Math.round((w.views / max) * BAR_MAX_PX)}px`,
                  background: w.partial ? "repeating-linear-gradient(135deg,#A9CBB5 0 6px,#C9DDD0 6px 12px)" : "#1F5C46",
                }}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-[clamp(10px,3vw,36px)] px-1 -mt-2" style={cols}>
          {data.weeks.map((w) => (
            <span key={w.label} className="text-muted text-center text-[13px]">
              {w.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="px-6 py-[22px] flex flex-col gap-2.5">
        <h2 className="heading text-xl">By platform</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr>
                <th className={th}>Platform</th>
                <th className={`${th} text-right`}>Posts</th>
                <th className={`${th} text-right`}>Views</th>
                <th className={`${th} text-right`}>Interactions</th>
                <th className={`${th} text-right`}>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.platforms
                .filter((p) => platform === "all" || p.platform === platform)
                .map((p) => (
                  <tr key={p.platform}>
                    <td className={td}>
                      <span className="flex items-center gap-2.5 font-semibold">
                        <PlatformBadge platform={p.platform} />
                        {PLATFORMS[p.platform].label}
                      </span>
                    </td>
                    {p.connected ? (
                      <>
                        <td className={`${td} text-right tabular-nums`}>{p.posts}</td>
                        <td className={`${td} text-right tabular-nums`}>{number(p.views ?? 0)}</td>
                        <td className={`${td} text-right tabular-nums`}>{number(p.interactions ?? 0)}</td>
                        <td className={`${td} text-right tabular-nums`}>
                          <strong className={p.weak ? "text-error" : ""}>{p.engagement}</strong>
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={3} className={`${td} text-muted`}>
                          Not connected
                        </td>
                        <td className={`${td} text-right`}>
                          <Link href="/settings" className="font-bold">
                            Connect
                          </Link>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="m-0 text-muted text-[13px]">Each platform counts views differently, so compare posts within a platform.</p>
      </Card>

      <Card className="px-6 py-[22px] flex flex-col gap-3.5">
        <div className="flex flex-wrap justify-between items-baseline gap-2.5">
          <h2 className="heading text-xl">By topic</h2>
          <span className="text-muted text-[13px]">Average interactions per post</span>
        </div>
        <div className="flex flex-col gap-3.5">
          {data.topics.map((t) => (
            <div key={t.name} className="grid gap-x-3.5 gap-y-1 items-center grid-cols-[1fr_auto] sm:grid-cols-[minmax(150px,220px)_minmax(0,1fr)_120px]">
              <span className="font-semibold">{t.name}</span>
              <span className="h-3.5 rounded-full bg-divider overflow-hidden col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto">
                <span className="block h-full rounded-full" style={{ width: `${(t.avg / topicMax) * 100}%`, background: t.color }} />
              </span>
              <span className="tabular-nums row-start-1 col-start-2 sm:row-start-auto sm:col-start-auto">
                <strong>{t.avg}</strong> <span className="text-muted text-[13px]">· {t.posts} posts</span>
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-between bg-primary-light rounded-xl px-4 py-3.5 mt-1.5">
          <span className="text-[14.5px] text-primary-hover">{data.tip}</span>
          <Button variant="primary" to="/strategy/plan" className="min-h-10">
            See what to do next
          </Button>
        </div>
      </Card>
    </div>
  );
}
