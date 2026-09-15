import { getSettings } from "@/lib/db";
import { saveBrandVoiceAction } from "@/lib/actions";

export default async function BrandVoicePage() {
  const settings = await getSettings();
  const bv = settings.brandVoice;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Brand voice</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tell the agent how to sound. It uses this when it writes every post.
      </p>

      <form action={saveBrandVoiceAction} className="mt-6 max-w-2xl space-y-5">
        <Field label="Tone" hint="A couple of words that describe how this brand talks.">
          <input
            type="text"
            name="tone"
            defaultValue={bv.tone}
            placeholder="Direct, a little dry, no corporate speak"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </Field>

        <Field label="Keywords" hint="Words and phrases the agent should reach for.">
          <textarea
            name="keywords"
            defaultValue={bv.keywords}
            rows={3}
            placeholder="automation, n8n, small business, no-code"
            className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </Field>

        <Field label="Sample posts" hint="Paste one or two posts that sound right. The agent matches this style.">
          <textarea
            name="sampleText"
            defaultValue={bv.sampleText}
            rows={6}
            placeholder="Paste an example post here…"
            className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </Field>

        <Field label="Avoid" hint="Words, claims, or topics the agent should never use.">
          <textarea
            name="doNots"
            defaultValue={bv.doNots}
            rows={3}
            placeholder="No exclamation marks, no unverified stats, no emojis"
            className="w-full resize-none rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </Field>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-neutral-800">{label}</div>
      <p className="mb-1.5 text-xs text-neutral-400">{hint}</p>
      {children}
    </div>
  );
}
