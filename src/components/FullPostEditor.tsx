"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, ImageIcon as ImageIconLucide, X as XIcon } from "lucide-react";
import {
  PLATFORM_ORDER,
  PLATFORMS,
  formatCharLimit,
  hashtagsCharCount,
} from "@/lib/platforms";
import {
  approvePostAction,
  rejectPostAction,
  requestRewriteAction,
  updatePlatformContentAction,
  updatePostImageAction,
} from "@/lib/actions";
import PlatformIcon from "@/components/PlatformIcon";
import type { Account, Platform, PlatformContent, Post } from "@/lib/types";

export default function FullPostEditor({
  post,
  accounts,
}: {
  post: Post;
  accounts: Account[];
}) {
  const accountByPlatform = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.platform, a])),
    [accounts]
  );

  const [active, setActive] = useState<Platform>(post.platforms[0] ?? "linkedin");
  const [content, setContent] = useState<Record<Platform, PlatformContent>>(() => {
    const init = {} as Record<Platform, PlatformContent>;
    for (const p of PLATFORM_ORDER) {
      init[p] = post.content[p] ?? { text: "", hashtags: [], suggestedHashtags: [] };
    }
    return init;
  });
  const [pending, startTransition] = useTransition();
  const [imagePending, startImageTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const meta = PLATFORMS[active];
  const current = content[active];
  const textLen = current.text.length;
  const hashtagsUsed = hashtagsCharCount(current.hashtags);
  const remaining = meta.charLimit - textLen - (current.hashtags.length ? hashtagsUsed : 0);
  const overLimit = textLen > meta.charLimit;
  const barPct = Math.min(100, Math.round((textLen / meta.charLimit) * 100));

  function persist(platform: Platform, next: PlatformContent) {
    startTransition(() => {
      void updatePlatformContentAction(post.id, platform, {
        text: next.text,
        hashtags: next.hashtags,
      });
    });
  }

  function updateText(text: string) {
    setContent((prev) => ({ ...prev, [active]: { ...prev[active], text } }));
  }

  function removeHashtag(tag: string) {
    setContent((prev) => {
      const next = { ...prev[active], hashtags: prev[active].hashtags.filter((h) => h !== tag) };
      persist(active, next);
      return { ...prev, [active]: next };
    });
  }

  function addHashtag(tag: string) {
    setContent((prev) => {
      if (prev[active].hashtags.includes(tag)) return prev;
      if (prev[active].hashtags.length >= meta.maxHashtags) return prev;
      const next = { ...prev[active], hashtags: [...prev[active].hashtags, tag] };
      persist(active, next);
      return { ...prev, [active]: next };
    });
  }

  const availableSuggestions = (current.suggestedHashtags ?? []).filter(
    (t) => !current.hashtags.includes(t)
  );

  return (
    <div>
      <div className="flex items-center gap-1 rounded-xl border border-black/5 bg-white p-1.5">
        {PLATFORM_ORDER.map((p) => {
          const inPost = post.platforms.includes(p);
          const account = accountByPlatform[p];
          const enabled = inPost && account && account.status !== "not_connected";
          const isActive = active === p;
          return (
            <button
              key={p}
              type="button"
              disabled={!enabled}
              onClick={() => setActive(p)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm transition-colors ${
                !enabled
                  ? "cursor-not-allowed text-neutral-300"
                  : isActive
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-500 hover:bg-black/3"
              }`}
            >
              <PlatformIcon platform={p} size={16} />
              {PLATFORMS[p].label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-black/5 bg-white p-5">
        <div className="grid grid-cols-[260px_1fr] gap-6">
          <div>
            <div
              className="flex items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-neutral-50 text-neutral-300"
              style={{ aspectRatio: `${meta.imageWidth} / ${meta.imageHeight}` }}
            >
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIconLucide size={28} strokeWidth={1.5} />
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-400">
              <span>
                {meta.imageWidth} × {meta.imageHeight} · fits {meta.label}
              </span>
              <button
                type="button"
                disabled={imagePending}
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:underline disabled:opacity-50"
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

            {post.warnings && post.warnings.length > 0 && (
              <div className="mt-3 flex gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{post.warnings[0]}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className={overLimit ? "font-medium text-red-600" : "font-medium text-neutral-800"}>
                {formatCharLimit(textLen)} characters
              </span>
              <span className="text-neutral-400">limit {formatCharLimit(meta.charLimit)}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${overLimit ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">
              {meta.cutoffChars &&
                `Cuts off after ${meta.cutoffChars} characters with ${meta.cutoffLabel}`}
              {meta.threadNote}
            </p>

            <textarea
              ref={textAreaRef}
              value={current.text}
              onChange={(e) => updateText(e.target.value)}
              onBlur={() => persist(active, content[active])}
              rows={8}
              className="mt-3 w-full resize-none rounded-lg border border-black/10 px-3 py-2.5 text-sm leading-relaxed text-neutral-800 outline-none focus:border-blue-500"
            />

            {meta.key === "x" && current.hashtags.length > 0 && (
              <div
                className={`mt-2 rounded-lg border p-2.5 text-xs ${
                  remaining < 0
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-amber-100 bg-amber-50 text-amber-700"
                }`}
              >
                Hashtags use {hashtagsUsed} of your {meta.charLimit} characters. Only{" "}
                {Math.max(0, remaining)} left.
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700">Hashtags</span>
              <span className="text-neutral-400">
                {current.hashtags.length} of {meta.maxHashtags}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {current.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  #{tag}
                  <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-blue-900">
                    <XIcon size={12} />
                  </button>
                </span>
              ))}
            </div>

            {availableSuggestions.length > 0 && (
              <div className="mt-2.5">
                <p className="text-xs text-neutral-400">Tap to add</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {availableSuggestions.map((tag) => {
                    const atLimit = current.hashtags.length >= meta.maxHashtags;
                    const cost = tag.length + 1;
                    const wouldExceed = meta.key === "x" && cost > Math.max(0, remaining);
                    const faded = atLimit || wouldExceed;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addHashtag(tag)}
                        disabled={atLimit}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          faded
                            ? "border-black/5 text-neutral-300"
                            : "border-black/10 text-neutral-500 hover:border-blue-300 hover:text-blue-700"
                        }`}
                      >
                        {meta.key === "x" && wouldExceed ? `+${tag} +${cost}` : `+ #${tag}`}
                      </button>
                    );
                  })}
                </div>
                {meta.key === "x" && availableSuggestions.some((t) => t.length + 1 > Math.max(0, remaining)) && (
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Faded because adding one would eat into your {meta.charLimit}. Tap anyway and the
                    text shortens to fit.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-black/5 pt-5">
          <form action={approvePostAction.bind(null, post.id)}>
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Approve all {post.platforms.length}
            </button>
          </form>
          <button
            type="button"
            onClick={() => textAreaRef.current?.focus()}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/3"
          >
            Edit text
          </button>
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
          {pending && <span className="ml-auto text-xs text-neutral-400">Saving…</span>}
        </div>
      </div>
    </div>
  );
}
