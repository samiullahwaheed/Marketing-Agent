"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDayMonthTime } from "@/lib/format";
import { paragraphs } from "@/lib/highlight";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform, Post } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { PlatformBadge } from "@/components/PlatformBadge";
import { PostImage } from "@/components/PostImage";
import { MetricCard } from "@/components/StatCard";
import { StatusChip } from "@/components/StatusChip";
import { Tabs } from "@/components/Tabs";

const resultChip = {
  published: { tone: "success", label: "Published" },
  failed: { tone: "error", label: "Failed" },
  scheduled: { tone: "info", label: "Sending" },
  not_sent: { tone: "neutral", label: "Not sent" },
} as const;

export default function PublishedView({ post }: { post: Post }) {
  const [active, setActive] = useState<Platform>(post.platforms[0]);
  const [copied, setCopied] = useState(false);

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
  const engagement = totals.views > 0 ? (((totals.reactions + totals.comments) / totals.views) * 100).toFixed(1) : null;

  const content = post.content[active];
  const result = post.results?.[active];
  const chip = resultChip[result?.status ?? "not_sent"];
  const text = content?.text || post.topic;
  const hashtags = content?.hashtags ?? [];
  const fullText = hashtags.length ? `${text}\n\n${hashtags.map((h) => `#${h}`).join(" ")}` : text;
  const meta = PLATFORMS[active];

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px] max-w-[1120px] mx-auto -mt-2">
      <BackLink to="/">Home</BackLink>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <StatusChip status={post.status} postNow={post.postNow} />
          <span className="text-muted text-sm flex items-center gap-1.5">
            {post.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} size="sm" />
            ))}
            {post.platforms.map((p) => PLATFORMS[p].label).join(" + ")} · {formatDayMonthTime(post.date, post.time)}
          </span>
        </div>
        <h1 className="heading text-[32px] sm:text-[38px] leading-[1.08]">{post.topic}</h1>
      </header>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]">
        <MetricCard label="Views" value={String(totals.views)} note="Since it went out" />
        <MetricCard label="Reactions" value={String(totals.reactions)} note="Across all platforms" />
        <MetricCard label="Comments" value={String(totals.comments)} note="Across all platforms" />
        {engagement && <MetricCard label="Engagement rate" value={`${engagement}%`} note="(Reactions + comments) ÷ views" highlight />}
      </div>

      <Tabs
        label="Platform versions"
        size="md"
        value={active}
        onChange={(p) => {
          setActive(p as Platform);
          setCopied(false);
        }}
        items={post.platforms.map((p) => ({
          id: p,
          label: (
            <>
              <PlatformBadge platform={p} />
              {PLATFORMS[p].label}
              <Chip tone={resultChip[post.results?.[p]?.status ?? "not_sent"].tone}>
                {resultChip[post.results?.[p]?.status ?? "not_sent"].label}
              </Chip>
            </>
          ),
        }))}
      />

      <Card className="px-6 py-[22px] flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlatformBadge platform={active} size="lg" />
            <div>
              <h2 className="heading text-xl">{meta.label} post</h2>
              {/* Local time differs between the server (UTC) and the browser. */}
              <div className="text-muted text-[13px]" suppressHydrationWarning>
                {result?.publishedAt ? `Went out ${new Date(result.publishedAt).toLocaleString()}` : chip.label}
              </div>
            </div>
          </div>
          {result?.url && (
            <Button href={result.url}>
              Open on {meta.label}
              <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          )}
        </div>

        {result?.status === "failed" && result.error && (
          <p role="alert" className="m-0 rounded-xl bg-error-bg text-error px-3.5 py-2.5 text-sm">
            {meta.label} refused this post: {result.error}
          </p>
        )}

        <PostImage className="w-full max-w-[720px]" aspect={`${meta.imageWidth}/${meta.imageHeight}`} src={post.imageUrl} alt={post.topic} />
        <div className="m-0 text-nav flex flex-col gap-2">
          {paragraphs(text).map((para, i) => (
            <p key={i} className="m-0">
              {para}
            </p>
          ))}
          {hashtags.length > 0 && <p className="m-0 text-linkedin font-semibold">{hashtags.map((h) => `#${h}`).join(" ")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-10" onClick={copy}>
            {copied ? "Copied" : `Copy ${meta.label} text`}
          </Button>
          <Button to={`/new-post?topic=${encodeURIComponent(`Follow-up: ${post.topic}`)}`} className="min-h-10">
            Write a follow-up
          </Button>
        </div>
      </Card>
    </div>
  );
}
