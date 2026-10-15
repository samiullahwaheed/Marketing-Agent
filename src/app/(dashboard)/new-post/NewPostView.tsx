"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { createPostAction } from "@/lib/actions";
import { audiences } from "@/lib/mock-strategy";
import { PLATFORM_ORDER, PLATFORMS } from "@/lib/platforms";
import { hintClass, inputClass, labelClass } from "@/lib/ui";
import type { Account, Platform } from "@/lib/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { PostImage } from "@/components/PostImage";

const GOALS = [
  { id: "seen", label: "Get seen", hint: "More views" },
  { id: "leads", label: "Get leads", hint: "Calls, DMs, sign-ups" },
  { id: "chat", label: "Start a chat", hint: "Comments & replies" },
];
const LANGUAGES = ["English", "اردو", "Roman Urdu", "English + Urdu mix"];

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[26px] h-[26px] rounded-full bg-ink text-white text-[13px] font-bold leading-none inline-flex items-center justify-center flex-none">
        {n}
      </span>
      <h2 className="heading text-[21px]">{title}</h2>
    </div>
  );
}

function Segment({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex-[1_1_120px] min-h-[46px] px-3 py-2 border rounded-[10px] text-sm font-semibold text-left cursor-pointer ${
        on
          ? "bg-primary-light border-primary text-primary-hover shadow-[inset_0_0_0_1px_#1F5C46]"
          : "bg-white/50 backdrop-blur-md border-control text-ink hover:bg-white/75"
      }`}
    >
      {children}
    </button>
  );
}

function PlatformTile({ platform }: { platform: Platform }) {
  const p = PLATFORMS[platform];
  return (
    <span
      className={`inline-flex items-center justify-center w-[34px] h-[34px] rounded-[9px] text-white text-[13px] font-bold leading-none flex-none ${p.bg}`}
      aria-hidden="true"
    >
      {p.short}
    </span>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full min-h-[54px] inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary text-white text-base font-semibold cursor-pointer hover:bg-primary-hover disabled:opacity-70 disabled:cursor-wait"
    >
      {pending ? (
        <>
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          Writing your draft…
        </>
      ) : (
        <>
          Write my draft
          <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </>
      )}
    </button>
  );
}

export default function NewPostView({ accounts, defaultTopic = "" }: { accounts: Account[]; defaultTopic?: string }) {
  const accountByPlatform = useMemo(() => Object.fromEntries(accounts.map((a) => [a.platform, a])), [accounts]);

  const [topic, setTopic] = useState(defaultTopic);
  const [goal, setGoal] = useState("leads");
  const [audience, setAudience] = useState(audiences.audiences.find((a) => a.status === "default")?.name ?? "");
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [imageMode, setImageMode] = useState<"ai" | "upload">("ai");
  const [imagePrompt, setImagePrompt] = useState("Flat illustration, muted colours, a desk with papers");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<Platform>>(
    () => new Set(PLATFORM_ORDER.filter((p) => accountByPlatform[p]?.status !== "not_connected").slice(0, 2))
  );
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");

  function toggle(p: Platform) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  const canSubmit = topic.trim().length > 0 && selected.size > 0 && !fileError;
  const audienceOptions = audiences.audiences.filter((a) => a.status !== "suggested");

  return (
    <form action={createPostAction} className="flex flex-col gap-6 max-w-[1120px] mx-auto">
      <PageHeader
        title="New post"
        subtitle={
          <span className="block max-w-[640px]">
            Tell the agent what you want. It writes a version for each platform, checks it, and sends it to Approvals. Nothing goes live without you.
          </span>
        }
      />

      <div className="grid gap-6 items-start grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))]">
        <div className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-5">
            <Step n={1} title="What's it about?" />
            <label className={labelClass}>
              Topic
              <textarea
                name="topic"
                className={`${inputClass} resize-y`}
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <span className={hintClass}>A sentence is enough. Add a real example if you have one, and the agent will use it.</span>
            </label>
            <fieldset className="border-0 m-0 p-0 flex flex-col gap-2">
              <legend className="font-bold text-[14.5px] p-0 mb-2">What should this post do?</legend>
              <div className="flex flex-wrap gap-2.5">
                {GOALS.map((g) => (
                  <Segment key={g.id} on={goal === g.id} onClick={() => setGoal(g.id)}>
                    {g.label}
                    <span className={`block font-normal text-[13px] ${goal === g.id ? "text-primary" : "text-muted"}`}>{g.hint}</span>
                  </Segment>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]">
              <label className={labelClass}>
                Who is it for?
                <select className={inputClass} value={audience} onChange={(e) => setAudience(e.target.value)}>
                  {audienceOptions.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                      {a.status === "default" ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="border-0 m-0 p-0">
              <legend className="font-bold text-[14.5px] p-0 mb-2.5">Language</legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Pill key={l} on={language === l} onClick={() => setLanguage(l)}>
                    {l}
                  </Pill>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card className="p-6 flex flex-col gap-[18px]">
            <Step n={2} title="Image" />
            <div className="flex flex-wrap gap-2.5">
              <Segment on={imageMode === "ai"} onClick={() => setImageMode("ai")}>
                Let AI make it
              </Segment>
              <Segment on={imageMode === "upload"} onClick={() => setImageMode("upload")}>
                Upload mine
              </Segment>
            </div>
            <input type="hidden" name="imageMode" value={imageMode} />
            {imageMode === "ai" ? (
              <div className="flex flex-wrap gap-4 items-start">
                <PostImage className="w-[180px]" />
                <label className={`${labelClass} flex-[1_1_240px]`}>
                  Describe the picture
                  <textarea
                    name="imagePrompt"
                    className={`${inputClass} resize-y`}
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                  />
                  <span className={hintClass}>Sized automatically for each platform.</span>
                </label>
              </div>
            ) : (
              <label className={labelClass}>
                Choose an image
                <input
                  className={inputClass}
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setFileError("Image is larger than 5MB.");
                      setFileName(null);
                      e.target.value = "";
                      return;
                    }
                    setFileError(null);
                    setFileName(file?.name ?? null);
                  }}
                />
                <span className={hintClass}>{fileName ?? "Sized automatically for each platform. Max 5MB."}</span>
                {fileError && <span className="text-error font-semibold">{fileError}</span>}
              </label>
            )}
          </Card>
        </div>

        <Card className="p-6 flex flex-col gap-5">
          <Step n={3} title="Where and when" />
          <div className="flex flex-col gap-2.5">
            {PLATFORM_ORDER.map((platform) => {
              const p = PLATFORMS[platform];
              const account = accountByPlatform[platform];
              const checked = selected.has(platform);

              if (!account || account.status === "not_connected") {
                return (
                  <div key={platform} className="flex items-center gap-3 px-3.5 py-3 border border-border rounded-xl min-h-[60px]">
                    <span className="w-5" aria-hidden="true" />
                    <PlatformTile platform={platform} />
                    <span className="flex-1">
                      <strong>{p.label}</strong>
                      <span className={`${hintClass} block`}>Not connected</span>
                    </span>
                    <Button to="/settings" className="min-h-[38px]">
                      Connect
                    </Button>
                  </div>
                );
              }

              const checkbox = (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="platforms"
                    value={platform}
                    className="w-5 h-5 accent-primary flex-none"
                    checked={checked}
                    onChange={() => toggle(platform)}
                  />
                  <PlatformTile platform={platform} />
                  <span className="flex-1">
                    <strong>{p.label}</strong>
                    <span className={`block font-normal text-[13px] ${account.status === "reconnect" ? "text-error" : "text-muted"}`}>
                      {account.status === "reconnect" ? "Login expired" : "Connected"}
                    </span>
                  </span>
                </label>
              );

              if (account.status === "reconnect") {
                return (
                  <div key={platform} className="flex flex-col gap-2.5 px-3.5 py-3 border border-[#E3BDB7] bg-[#FDF6F5] rounded-xl">
                    {checkbox}
                    <div className="flex flex-wrap gap-2.5 items-center justify-between text-[13.5px] text-error">
                      <span>Reconnect before {date} or the {p.label} version won&apos;t post.</span>
                      <Button to="/settings" className="min-h-[38px]">
                        Reconnect
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={platform}
                  className={`px-3.5 py-3 border rounded-xl min-h-[60px] flex flex-col justify-center ${
                    checked ? "border-primary bg-[#F6FAF7]" : "border-border"
                  }`}
                >
                  {checkbox}
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))]">
            <label className={labelClass}>
              Date
              <input className={inputClass} type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className={labelClass}>
              Time
              <input className={inputClass} type="time" name="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </label>
          </div>
          <SubmitButton disabled={!canSubmit} />
          <p className={`${hintClass} -mt-2 mb-0 text-center`}>Takes about a minute. You&apos;ll find it in Approvals. Uses 1 AI credit.</p>
        </Card>
      </div>
    </form>
  );
}
