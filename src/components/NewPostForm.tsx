"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPostAction } from "@/lib/actions";
import { PLATFORM_ORDER, PLATFORMS, formatCharLimit } from "@/lib/platforms";
import PlatformIcon from "@/components/PlatformIcon";
import type { Account } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
    >
      {pending ? "Creating…" : "Create post"}
    </button>
  );
}

export default function NewPostForm({
  accounts,
  defaultTopic = "",
}: {
  accounts: Account[];
  defaultTopic?: string;
}) {
  const accountByPlatform = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.platform, a])),
    [accounts]
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(PLATFORM_ORDER.filter((p) => accountByPlatform[p]?.status !== "not_connected").slice(0, 2))
  );
  const [imageMode, setImageMode] = useState<"ai" | "upload">("ai");
  const [topic, setTopic] = useState(defaultTopic);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function togglePlatform(p: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  const canSubmit = topic.trim().length > 0 && selected.size > 0 && !error;

  return (
    <form action={createPostAction} className="mt-6 flex gap-6">
      <div className="flex-1 space-y-6">
        <div className="rounded-xl border border-black/5 bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <input
                type="date"
                name="date"
                defaultValue={todayIso()}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                name="time"
                defaultValue="09:00"
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Topic">
              <textarea
                name="topic"
                required
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should this post be about?"
                className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-5">
          <div className="text-sm font-medium text-neutral-700">Image</div>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setImageMode("ai")}
              className={`rounded-md py-1.5 text-sm transition-colors ${
                imageMode === "ai"
                  ? "bg-white font-medium text-neutral-900 shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              Let AI make it
            </button>
            <button
              type="button"
              onClick={() => setImageMode("upload")}
              className={`rounded-md py-1.5 text-sm transition-colors ${
                imageMode === "upload"
                  ? "bg-white font-medium text-neutral-900 shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              Upload mine
            </button>
          </div>
          <input type="hidden" name="imageMode" value={imageMode} />

          <div className="mt-3">
            {imageMode === "ai" ? (
              <textarea
                name="imagePrompt"
                rows={3}
                placeholder="Flat illustration, muted colours, a desk with papers"
                className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/15 px-3 py-6 text-center text-sm text-neutral-500 hover:border-blue-400">
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("Image is larger than 5MB.");
                      setFileName(null);
                      e.target.value = "";
                      return;
                    }
                    setError(null);
                    setFileName(file?.name ?? null);
                  }}
                />
                {fileName ? (
                  <span className="text-neutral-800">{fileName}</span>
                ) : (
                  <span>Click to choose an image (max 5MB)</span>
                )}
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0 space-y-4">
        <div className="rounded-xl border border-black/5 bg-white p-5">
          <div className="text-sm font-medium text-neutral-700">Post to</div>
          <div className="mt-3 space-y-1">
            {PLATFORM_ORDER.map((p) => {
              const meta = PLATFORMS[p];
              const account = accountByPlatform[p];
              const disabled = !account || account.status === "not_connected";
              const checked = selected.has(p);
              return (
                <label
                  key={p}
                  className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm ${
                    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-black/3"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      name="platforms"
                      value={p}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => togglePlatform(p)}
                      className="h-4 w-4 rounded border-black/20 text-blue-600 focus:ring-blue-500"
                    />
                    <PlatformIcon platform={p} size={18} />
                    <span className="text-neutral-800">{meta.label}</span>
                  </span>
                  <span className="text-neutral-400">{formatCharLimit(meta.charLimit)} characters</span>
                </label>
              );
            })}
          </div>
        </div>

        <SubmitButton disabled={!canSubmit} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-center text-xs text-neutral-400">Goes to Activity for your approval</p>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-neutral-500">{label}</div>
      {children}
    </div>
  );
}
