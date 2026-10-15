"use client";

import { CheckCircle2, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { requestRewriteAction } from "@/lib/actions";
import { paragraphs } from "@/lib/highlight";
import { PLATFORMS } from "@/lib/platforms";
import { checkboxClass, inputClass } from "@/lib/ui";
import type { Platform, Post } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Pill } from "@/components/Pill";

const REWRITE_OPTIONS = ["Shorter", "More professional", "Stronger hook", "Use my best hook style", "Include my keywords"];

export default function RewriteView({ post }: { post: Post }) {
  const [ask, setAsk] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>(post.platforms);
  const [keepHashtags, setKeepHashtags] = useState(true);
  const [working, setWorking] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const primaryPlatform = post.platforms[0];
  const currentText = (primaryPlatform && post.content[primaryPlatform]?.text) || post.topic;

  async function rewrite() {
    setWorking(true);
    setError(null);
    try {
      await requestRewriteAction(post.id);
      setRequested(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite request failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px] max-w-[1160px] mx-auto -mt-2">
      <BackLink to={`/post/${post.id}/review`}>Back to post</BackLink>
      <PageHeader
        size="md"
        title={`Rewrite "${post.topic}"`}
        subtitle="Say what to change. The agent rewrites it and sends the new draft back for your review."
      />

      <Card className="px-6 py-[22px] flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <label htmlFor="ask" className="font-bold text-[15px]">
            What should change?
          </label>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted">
            Rewrite for
            {post.platforms.map((p) => (
              <Pill key={p} on={platforms.includes(p)} onClick={() => setPlatforms((l) => toggle(l, p))}>
                <PlatformBadge platform={p} size="sm" />
                {PLATFORMS[p].label}
              </Pill>
            ))}
          </div>
        </div>
        <textarea id="ask" className={`${inputClass} resize-y`} rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {REWRITE_OPTIONS.map((o) => (
            <Pill key={o} on={selected.includes(o)} onClick={() => setSelected((l) => toggle(l, o))}>
              {o}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-3.5 items-center justify-between">
          <label className="flex items-center gap-2.5 text-sm min-h-11">
            <input type="checkbox" className={checkboxClass} checked={keepHashtags} onChange={(e) => setKeepHashtags(e.target.checked)} />
            Keep my hashtags
          </label>
          <Button variant="primary" onClick={rewrite} disabled={working || requested || !platforms.length}>
            {working ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={18} strokeWidth={2} aria-hidden="true" />}
            {working ? "Sending…" : requested ? "Rewrite requested" : "Rewrite"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="m-0 text-sm text-error font-semibold">
            {error}
          </p>
        )}
      </Card>

      <div className="grid gap-5 items-stretch grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))]">
        <section className="bg-white/35 backdrop-blur-md border border-white/50 rounded-2xl px-6 py-[22px] flex flex-col gap-3.5">
          <p className="eyebrow">Current version</p>
          <div className="text-nav text-[15px] flex flex-col gap-3">
            {paragraphs(currentText).map((p, i) => (
              <p key={i} className="m-0">
                {p}
              </p>
            ))}
          </div>
        </section>
        <section className="bg-white/60 backdrop-blur-xl border-2 border-primary rounded-2xl px-6 py-[22px] flex flex-col gap-3.5 items-start justify-center" aria-live="polite">
          {requested ? (
            <div className="flex gap-3 items-start text-success">
              <CheckCircle2 size={22} strokeWidth={2} className="flex-none mt-0.5" aria-hidden="true" />
              <div>
                <p className="m-0 font-bold">Rewrite requested.</p>
                <p className="m-0 text-nav text-sm">
                  The agent is working on a new draft. It&rsquo;ll show up back in Approvals once it&rsquo;s ready for your review.
                </p>
              </div>
            </div>
          ) : (
            <p className="m-0 text-muted">Say what to change, then press Rewrite. The new draft isn&apos;t generated instantly — check back in Approvals.</p>
          )}
        </section>
      </div>

      <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-2xl px-[18px] py-3.5 flex flex-wrap gap-3 items-center justify-end">
        <span className="text-muted text-[13.5px] mr-auto">Your current version stays until the rewrite comes back.</span>
        <Button to={`/post/${post.id}/review`}>{requested ? "Back to post" : "Cancel"}</Button>
      </div>
    </div>
  );
}
