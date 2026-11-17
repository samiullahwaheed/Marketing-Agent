"use client";

import { useState, type FormEvent } from "react";
import { addBannedWordAction, removeBannedWordAction, saveBrandVoiceAction } from "@/lib/actions";
import { inputClass } from "@/lib/ui";
import type { Account, SettingsDoc } from "@/lib/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Pill } from "@/components/Pill";
import { ConnectedAccounts } from "./ConnectedAccounts";

export default function SettingsView({
  accounts,
  settings,
  connected,
  connectError,
}: {
  accounts: Account[];
  settings: SettingsDoc;
  connected?: string;
  connectError?: string;
}) {
  const [bannedWords, setBannedWords] = useState(settings.bannedWords ?? []);
  const [newWord, setNewWord] = useState<string | null>(null);
  function addWord(e: FormEvent) {
    e.preventDefault();
    const word = newWord?.trim().toLowerCase();
    if (word && !bannedWords.includes(word)) {
      setBannedWords((w) => [...w, word]);
      void addBannedWordAction(word);
    }
    setNewWord(null);
  }

  function removeWord(word: string) {
    setBannedWords((w) => w.filter((x) => x !== word));
    void removeBannedWordAction(word);
  }

  const creditsLow = settings.aiCreditsPercent <= 20;

  return (
    <div className="flex flex-col gap-6 max-w-[1120px] mx-auto">
      <PageHeader title="Settings" subtitle="Your accounts, how you sound, and what the agent should avoid." />

      <div className="grid gap-[22px] items-start grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))]">
        <div className="flex flex-col gap-[22px]">
          <ConnectedAccounts accounts={accounts} connected={connected} connectError={connectError} />

          <Card className="px-6 py-5 flex flex-col gap-3.5">
            <h2 className="heading text-xl">AI credits</h2>
            <div className="flex justify-between gap-2.5 items-baseline">
              <strong className="heading text-[22px]">About {settings.aiCreditsPostsLeft} posts left</strong>
              {creditsLow && <span className="text-muted text-[13.5px] text-warning font-semibold">Running low</span>}
            </div>
            <div
              className="h-2.5 rounded-full bg-divider overflow-hidden"
              role="progressbar"
              aria-label="AI credits left"
              aria-valuenow={settings.aiCreditsPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-marigold" style={{ width: `${Math.max(0, Math.min(100, settings.aiCreditsPercent))}%` }} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-[22px]">
          <form action={saveBrandVoiceAction}>
            <Card className="px-6 py-5 flex flex-col gap-[18px]">
              <div>
                <h2 className="heading text-xl">Brand voice</h2>
                <p className="mt-1 mb-0 text-muted text-sm">Every draft follows these rules.</p>
              </div>
              <label className="flex flex-col gap-[7px] font-bold text-[14.5px]">
                Tone
                <input
                  type="text"
                  name="tone"
                  defaultValue={settings.brandVoice.tone}
                  placeholder="Direct, a little dry, no corporate speak"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-[7px] font-bold text-[14.5px]">
                Keywords
                <textarea
                  name="keywords"
                  defaultValue={settings.brandVoice.keywords}
                  rows={2}
                  placeholder="automation, n8n, small business, no-code"
                  className={`${inputClass} resize-y font-normal`}
                />
              </label>
              <label className="flex flex-col gap-[7px] font-bold text-[14.5px]">
                Sample posts
                <textarea
                  name="sampleText"
                  defaultValue={settings.brandVoice.sampleText}
                  rows={4}
                  placeholder="Paste one or two posts that sound right…"
                  className={`${inputClass} resize-y font-normal`}
                />
              </label>
              <label className="flex flex-col gap-[7px] font-bold text-[14.5px]">
                Avoid
                <textarea
                  name="doNots"
                  defaultValue={settings.brandVoice.doNots}
                  rows={2}
                  placeholder="No exclamation marks, no unverified stats, no emojis"
                  className={`${inputClass} resize-y font-normal`}
                />
              </label>
              <Button variant="primary" type="submit" className="self-start">
                Save brand voice
              </Button>
            </Card>
          </form>

          <Card className="px-6 py-5 flex flex-col gap-[18px]">
            <div>
              <h2 className="heading text-xl">Words you never use</h2>
              <p className="mt-1 mb-0 text-muted text-sm">The agent avoids these. Also used when you reject a post for tone.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {bannedWords.map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-label={`Remove ${w}`}
                  title="Remove"
                  onClick={() => removeWord(w)}
                  className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-full bg-error-bg text-error text-[13px] font-semibold border-0 cursor-pointer hover:brightness-95"
                >
                  {w}
                  <span aria-hidden="true" className="opacity-60">
                    ✕
                  </span>
                </button>
              ))}
              {newWord === null ? (
                <Pill dashed className="min-h-[38px] text-[13.5px]" onClick={() => setNewWord("")}>
                  + Add word
                </Pill>
              ) : (
                <form onSubmit={addWord} className="flex gap-1.5">
                  <input
                    className="min-h-[38px] px-3 border border-control rounded-full text-[13.5px] w-40"
                    aria-label="Word to never use"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setNewWord(null)}
                    autoFocus
                  />
                  <Button size="sm" variant="primary" type="submit" className="rounded-full">
                    Add
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
