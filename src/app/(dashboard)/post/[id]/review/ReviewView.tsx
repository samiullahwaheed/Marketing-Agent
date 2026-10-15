"use client";

import { AlertTriangle, Check, LoaderCircle, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  approvePostAction,
  updatePlatformContentAction,
  updatePostImageAction,
} from "@/lib/actions";
import { formatDayMonthTime } from "@/lib/format";
import { paragraphs } from "@/lib/highlight";
import { PLATFORMS, formatCharLimit } from "@/lib/platforms";
import { inputClass } from "@/lib/ui";
import type { Account, Platform, PlatformContent, Post } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { PlatformBadge } from "@/components/PlatformBadge";
import { PostImage } from "@/components/PostImage";
import { StatusChip } from "@/components/StatusChip";
import { Tabs } from "@/components/Tabs";

const activeTag = "border border-[#A9CBB5] bg-[#EEF5F0] text-primary-hover";
const suggestionTag = "border border-dashed border-[#9AA59E] bg-card text-ink hover:bg-page";
const tagBase = "inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full text-[13.5px] font-semibold cursor-pointer";

export default function ReviewView({ post, accounts }: { post: Post; accounts: Account[] }) {
  const router = useRouter();
  const accountByPlatform = useMemo(() => Object.fromEntries(accounts.map((a) => [a.platform, a])), [accounts]);

  const [active, setActive] = useState<Platform>(post.platforms[0] ?? "linkedin");
  const [content, setContent] = useState<Record<Platform, PlatformContent>>(() => {
    const init = {} as Record<Platform, PlatformContent>;
    for (const p of post.platforms) {
      init[p] = post.content[p] ?? { text: "", hashtags: [], suggestedHashtags: [], keywords: [] };
    }
    return init;
  });
  const [editing, setEditing] = useState(false);
  const [newKeyword, setNewKeyword] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [imagePending, startImageTransition] = useTransition();
  const [approving, setApproving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = PLATFORMS[active];
  const current = content[active] ?? { text: "", hashtags: [], suggestedHashtags: [], keywords: [] };
  const canApprove = post.status === "waiting_approval";

  function persist(platform: Platform, next: PlatformContent) {
    setContent((prev) => ({ ...prev, [platform]: next }));
    startTransition(() => {
      void updatePlatformContentAction(post.id, platform, next);
    });
  }

  function removeHashtag(tag: string) {
    persist(active, { ...current, hashtags: current.hashtags.filter((h) => h !== tag) });
  }
  function addHashtag(tag: string) {
    if (current.hashtags.includes(tag) || current.hashtags.length >= meta.maxHashtags) return;
    persist(active, { ...current, hashtags: [...current.hashtags, tag] });
  }
  function removeKeyword(word: string) {
    persist(active, { ...current, keywords: (current.keywords ?? []).filter((k) => k !== word) });
  }
  function addKeyword(word: string) {
    const trimmed = word.trim();
    if (!trimmed || (current.keywords ?? []).includes(trimmed)) return;
    persist(active, { ...current, keywords: [...(current.keywords ?? []), trimmed] });
  }

  const availableSuggestions = (current.suggestedHashtags ?? []).filter((t) => !current.hashtags.includes(t));

  async function approve() {
    setApproving(true);
    try {
      await approvePostAction(post.id);
      router.push("/approvals");
    } catch {
      setApproving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1160px] mx-auto -mt-2">
      <BackLink to="/approvals">Approvals</BackLink>
      <header className="flex flex-col gap-2">
        <span className="self-start">
          <StatusChip status={post.status} />
        </span>
        <h1 className="heading text-[32px] sm:text-[38px] leading-[1.08]">{post.topic}</h1>
        <p className="m-0 text-muted text-base">
          Goes out <strong className="text-ink">{formatDayMonthTime(post.date, post.time)}</strong>
        </p>
      </header>

      <Tabs
        label="Platform versions"
        size="md"
        value={active}
        onChange={(p) => setActive(p as Platform)}
        items={post.platforms.map((p) => {
          const account = accountByPlatform[p];
          const onHold = account?.status === "reconnect";
          return {
            id: p,
            label: (
              <>
                <PlatformBadge platform={p} />
                {PLATFORMS[p].label}
                {onHold ? (
                  <span className="inline-flex px-2.5 py-[3px] rounded-full bg-error-bg text-error text-xs font-semibold">On hold</span>
                ) : (
                  <span className="text-muted font-medium text-[13px]">
                    {formatCharLimit((content[p]?.text ?? "").length)} / {formatCharLimit(PLATFORMS[p].charLimit)}
                  </span>
                )}
              </>
            ),
          };
        })}
      />

      <div className="flex flex-wrap gap-6 items-start">
        <section className="flex-[3_1_520px] min-w-0 flex flex-col gap-3">
          {post.warnings && post.warnings.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center bg-warning-bg border border-[#EFD39C] rounded-[14px] px-3.5 py-3">
              <AlertTriangle size={20} strokeWidth={2} className="text-warning flex-none" aria-hidden="true" />
              <span className="flex-[1_1_220px] text-[14.5px] text-[#5C3803]">{post.warnings[0]}</span>
            </div>
          )}

          <article className="bg-card border border-border rounded-2xl px-[18px] pt-[18px] pb-3.5 flex flex-col gap-3 shadow-[0_1px_2px_rgba(23,32,28,.04),0_8px_24px_rgba(23,32,28,.06)]">
            <div className="flex gap-2.5 items-center">
              <PlatformBadge platform={active} size="md" />
              <div>
                <div className="font-bold text-[14.5px]">{PLATFORMS[active].label} preview</div>
                <div className="text-muted text-[12.5px]">{formatDayMonthTime(post.date, post.time)}</div>
              </div>
            </div>
            {editing ? (
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Edit the {PLATFORMS[active].label} version
                <textarea
                  className={`${inputClass} resize-y font-normal`}
                  rows={12}
                  value={current.text}
                  onChange={(e) => setContent((prev) => ({ ...prev, [active]: { ...current, text: e.target.value } }))}
                  onBlur={() => persist(active, content[active])}
                />
              </label>
            ) : (
              <div className="text-[14.5px] leading-[1.55] text-ink flex flex-col gap-2.5">
                {paragraphs(current.text).map((p, i) => (
                  <p key={i} className="m-0">
                    {p}
                  </p>
                ))}
                {current.hashtags.length > 0 && (
                  <p className="m-0 text-linkedin font-semibold">{current.hashtags.map((h) => `#${h}`).join(" ")}</p>
                )}
              </div>
            )}
            <PostImage className="w-full" aspect="1200/627" />
            <div className="flex justify-between gap-3 text-muted text-[12.5px]">
              <span>
                {PLATFORMS[active].imageWidth} × {PLATFORMS[active].imageHeight} · fits {PLATFORMS[active].label}
              </span>
              <button
                type="button"
                disabled={imagePending}
                onClick={() => fileInputRef.current?.click()}
                className="font-bold text-primary cursor-pointer hover:text-primary-hover underline disabled:opacity-50"
              >
                {imagePending ? "Uploading…" : "Change image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.set("imageFile", file);
                  startImageTransition(() => {
                    void updatePostImageAction(post.id, fd);
                  });
                }}
              />
            </div>
          </article>
        </section>

        <aside className="flex-[2_1_340px] min-w-0 flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-[18px]">
            <div>
              <h2 className="heading text-[19px]">Help people find this post</h2>
              <p className="mt-0.5 mb-0 text-muted text-[13px]">Tap + to add, or type your own.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px]">
                <strong>Hashtags</strong>
                <span className="text-muted">
                  {current.hashtags.length} of {meta.maxHashtags}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {current.hashtags.map((h) => (
                  <button key={h} type="button" className={`${tagBase} ${activeTag}`} aria-label={`Remove #${h}`} onClick={() => removeHashtag(h)}>
                    #{h} <span aria-hidden="true">✕</span>
                  </button>
                ))}
                {availableSuggestions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`${tagBase} ${suggestionTag} disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`Add #${h}`}
                    disabled={current.hashtags.length >= meta.maxHashtags}
                    onClick={() => addHashtag(h)}
                  >
                    + #{h}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-divider" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px]">
                <strong>Keywords</strong>
                <span className="text-muted">words to work into the post</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {(current.keywords ?? []).map((k) => (
                  <button key={k} type="button" className={`${tagBase} ${activeTag}`} aria-label={`Remove keyword ${k}`} onClick={() => removeKeyword(k)}>
                    <Check size={13} strokeWidth={3} aria-hidden="true" />
                    {k}
                    <span aria-hidden="true">✕</span>
                  </button>
                ))}
                {newKeyword === null ? (
                  <button type="button" className={`${tagBase} ${suggestionTag}`} onClick={() => setNewKeyword("")}>
                    + Add keyword
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addKeyword(newKeyword);
                      setNewKeyword(null);
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      className="min-h-9 px-3 border border-control rounded-full text-[13.5px] w-32"
                      aria-label="New keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && setNewKeyword(null)}
                      autoFocus
                    />
                    <Button size="sm" variant="primary" type="submit" className="rounded-full">
                      Add
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <div className="bg-card border border-border rounded-2xl px-[18px] py-3.5 flex flex-wrap gap-3 items-center justify-between shadow-[0_8px_24px_rgba(23,32,28,.08)]">
        <div className="flex flex-wrap gap-2.5">
          <Button variant="dangerOutline" to={`/post/${post.id}/reject`}>
            <XIcon size={16} strokeWidth={2.4} aria-hidden="true" />
            Reject
          </Button>
          <Button to={`/post/${post.id}/rewrite`}>Ask for a rewrite</Button>
          <Button aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
            {editing ? "Done editing" : "Edit text myself"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {canApprove ? (
            <Button variant="primary" size="lg" onClick={approve} disabled={approving || pending}>
              {approving ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Check size={18} strokeWidth={2.4} aria-hidden="true" />}
              Approve {post.platforms.map((p) => PLATFORMS[p].label).join(" + ")}
            </Button>
          ) : (
            <Chip tone="info">Already {post.status === "scheduled" ? "approved" : post.status}</Chip>
          )}
        </div>
      </div>
    </div>
  );
}
