"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDayMonthTime } from "@/lib/format";
import { paragraphs } from "@/lib/highlight";
import { PLATFORMS } from "@/lib/platforms";
import type { Post } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PlatformBadge } from "@/components/PlatformBadge";
import { PostImage } from "@/components/PostImage";
import { MetricCard } from "@/components/StatCard";
import { StatusChip } from "@/components/StatusChip";

export default function PublishedView({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false);
  const platform = post.platforms[0];
  const result = post.results?.[platform];

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

  const primaryText = post.content[platform]?.text || post.topic;

  async function copy() {
    try {
      await navigator.clipboard.writeText(primaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px] max-w-[1120px] mx-auto -mt-2">
      <BackLink to="/">Home</BackLink>
      <header className="flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <StatusChip status={post.status} />
            <span className="text-muted text-sm flex items-center gap-1.5">
              <PlatformBadge platform={platform} size="sm" />
              {post.platforms.map((p) => PLATFORMS[p].label).join(" + ")} · {formatDayMonthTime(post.date, post.time)}
            </span>
          </div>
          <h1 className="heading text-[32px] sm:text-[38px] leading-[1.08]">{post.topic}</h1>
        </div>
        {result?.url && (
          <Button href={result.url}>
            Open on {PLATFORMS[platform].label}
            <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        )}
      </header>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]">
        <MetricCard label="Views" value={String(totals.views)} note="Since it went out" />
        <MetricCard label="Reactions" value={String(totals.reactions)} note="Across all platforms" />
        <MetricCard label="Comments" value={String(totals.comments)} note="Across all platforms" />
        {engagement && <MetricCard label="Engagement rate" value={`${engagement}%`} note="(Reactions + comments) ÷ views" highlight />}
      </div>

      <Card className="px-6 py-[22px] flex flex-col gap-3.5">
        <h2 className="heading text-xl">The post</h2>
        <PostImage className="w-full" aspect="1200/627" />
        <div className="m-0 text-nav flex flex-col gap-2">
          {paragraphs(primaryText).map((p, i) => (
            <p key={i} className="m-0">
              {p}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-10" onClick={copy}>
            {copied ? "Copied" : "Copy text"}
          </Button>
          <Button to={`/new-post?topic=${encodeURIComponent(`Follow-up: ${post.topic}`)}`} className="min-h-10">
            Write a follow-up
          </Button>
        </div>
      </Card>
    </div>
  );
}
