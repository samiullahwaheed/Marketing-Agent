"use client";

import { LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rejectPostAction } from "@/lib/actions";
import { formatDayMonth } from "@/lib/format";
import { paragraphs } from "@/lib/highlight";
import { PLATFORMS } from "@/lib/platforms";
import { checkboxClass, inputClass } from "@/lib/ui";
import type { Post } from "@/lib/types";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Pill } from "@/components/Pill";
import { PostImage } from "@/components/PostImage";

const REJECT_REASONS = ["Doesn't sound like us", "Wrong topic", "Incorrect facts", "Bad timing", "Something else"];

/** First quoted word in the note, e.g. "game-changer". */
const quotedWord = (note: string) => note.match(/["“]([^"”]+)["”]/)?.[1];

export default function RejectView({ post, bannedWords }: { post: Post; bannedWords: string[] }) {
  const router = useRouter();
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [banWord, setBanWord] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const word = quotedWord(note);
  const alreadyBanned = word ? bannedWords.includes(word.toLowerCase()) : false;
  const toneProblem = reasons.includes(REJECT_REASONS[0]);
  const alreadyRejected = post.status === "rejected";

  const primaryPlatform = post.platforms[0];
  const previewText = (primaryPlatform && post.content[primaryPlatform]?.text) || post.topic;

  async function reject() {
    setSaving(true);
    setSaveError(null);
    try {
      await rejectPostAction(post.id, {
        reason: reasons[0],
        note,
        banWord: word && banWord && !alreadyBanned ? word.toLowerCase() : undefined,
      });
      router.push("/approvals");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Couldn't reject the post");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-[22px] max-w-[1080px] mx-auto -mt-2">
      <BackLink to="/approvals">Approvals</BackLink>
      <PageHeader size="md" title="Reject this post?" subtitle="It won't be published. Telling the agent why helps it write better next time." />

      <div className="grid gap-5 items-start grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]">
        <section className="bg-white/35 backdrop-blur-md border border-white/50 rounded-2xl px-6 py-[22px] flex flex-col gap-3.5">
          <p className="eyebrow">The post</p>
          <div className="flex gap-3.5 items-center">
            <PostImage className="w-24" aspect="1/1" />
            <div>
              <div className="heading text-xl">{post.topic}</div>
              <div className="text-muted text-sm flex items-center gap-1.5 mt-1">
                <PlatformBadge platform={post.platforms[0]} size="sm" />
                {post.platforms.map((p) => PLATFORMS[p].label).join(" + ")} · {alreadyRejected ? "was set for" : "set for"}{" "}
                {formatDayMonth(post.date)}
              </div>
            </div>
          </div>
          <div className="text-nav text-[15px] flex flex-col gap-2.5">
            {paragraphs(previewText).map((p, i) => (
              <p key={i} className="m-0">
                {p}
              </p>
            ))}
          </div>
        </section>

        <Card className="px-6 py-[22px] flex flex-col gap-[18px]">
          <fieldset className="border-0 m-0 p-0">
            <legend className="font-bold text-[15px] p-0 mb-3">
              What was wrong? <span className="text-muted font-medium">Pick any</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {REJECT_REASONS.map((r) => (
                <Pill
                  key={r}
                  className="min-h-[42px] px-4"
                  on={reasons.includes(r)}
                  onClick={() => setReasons((l) => (l.includes(r) ? l.filter((x) => x !== r) : [...l, r]))}
                >
                  {r}
                </Pill>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-2 font-bold text-[15px]">
            Anything the agent should know?
            <textarea className={`${inputClass} resize-y font-normal`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {toneProblem && (
            <div className="flex flex-wrap gap-3 items-center bg-primary-light rounded-xl px-4 py-3.5">
              <span className="flex-[1_1_220px] text-sm text-primary-hover">
                <strong>Tone problems are usually fixable.</strong> Want a rewrite in your brand voice instead?
              </span>
              <Button to={`/post/${post.id}/rewrite`} className="min-h-10">
                Rewrite instead
              </Button>
            </div>
          )}
          {word && !alreadyBanned && (
            <label className="flex items-center gap-2.5 text-sm min-h-11">
              <input type="checkbox" className={checkboxClass} checked={banWord} onChange={(e) => setBanWord(e.target.checked)} />
              Add &ldquo;{word}&rdquo; to words we never use
            </label>
          )}
        </Card>
      </div>

      <div className="bg-white/55 backdrop-blur-xl backdrop-saturate-150 border border-white/60 rounded-2xl px-[18px] py-3.5 flex flex-wrap gap-3 items-center justify-end">
        <span className="text-muted text-[13.5px] mr-auto">
          {saveError ? <span className="text-error font-semibold">{saveError}</span> : "You can find it later under Approvals › Rejected."}
        </span>
        <Button to="/approvals">Cancel</Button>
        <Button variant="danger" size="lg" onClick={reject} disabled={saving || alreadyRejected}>
          {saving ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <X size={16} strokeWidth={2.4} aria-hidden="true" />}
          {alreadyRejected ? "Already rejected" : "Reject post"}
        </Button>
      </div>
    </div>
  );
}
