"use client";

import { Globe, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { audiences as audiencesData } from "@/lib/mock-strategy";
import type { Audience } from "@/lib/mock-strategy";
import { inputClass, labelClass } from "@/lib/ui";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PlatformBadge } from "@/components/PlatformBadge";
import { StrategyHeader } from "@/components/StrategyHeader";

function Bars({ title, items }: { title: string; items: { label: string; pct: number; color: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="eyebrow">{title}</p>
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[130px_minmax(0,1fr)_44px] gap-3 items-center text-sm">
          <span>{i.label}</span>
          <span className="h-2.5 rounded-full bg-divider overflow-hidden">
            <span className="block h-full" style={{ width: `${i.pct}%`, background: i.color }} />
          </span>
          <strong>{i.pct}%</strong>
        </div>
      ))}
    </div>
  );
}

function AudienceCard({ audience, onSave, onDismiss }: { audience: Audience; onSave: () => void; onDismiss: () => void }) {
  const suggested = audience.status === "suggested";
  const isDefault = audience.status === "default";
  return (
    <Card
      as="article"
      className={`p-[22px] flex flex-col gap-3 ${isDefault ? "border-2 border-primary" : suggested ? "border-dashed border-[#9AA59E] bg-subtle" : ""}`}
    >
      <div className="flex justify-between gap-2.5 items-start">
        <h3 className="heading text-xl">{audience.name}</h3>
        {isDefault && <span className="inline-flex px-2.5 py-[3px] rounded-full bg-primary text-white text-[13px] font-semibold leading-[1.4]">Default</span>}
        {suggested && <span className="inline-flex px-2.5 py-[3px] rounded-full bg-warning-bg text-warning text-[13px] font-semibold leading-[1.4]">Suggested</span>}
      </div>
      <div className="flex gap-2 items-center text-sm text-nav">
        <MapPin size={16} strokeWidth={2} aria-hidden="true" />
        {audience.location}
      </div>
      <p className="m-0 text-[14.5px]">
        <span className="text-muted">Wants:</span> {audience.wants}
      </p>
      {audience.reason && <p className="m-0 text-muted text-[13.5px]">{audience.reason}</p>}
      {audience.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {audience.tags.map((t) => (
            <span key={t} className="inline-flex px-2.5 py-[3px] rounded-full bg-page text-nav text-[13px] font-semibold leading-[1.4]">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-auto pt-1.5">
        {suggested ? (
          <>
            <Button variant="primary" className="min-h-10" onClick={onSave}>
              Save audience
            </Button>
            <Button variant="ghost" className="min-h-10" onClick={onDismiss}>
              Dismiss
            </Button>
          </>
        ) : (
          <>
            <Button variant={isDefault ? "primary" : "secondary"} to="/new-post" className="min-h-10">
              Write for them
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export default function StrategyAudiencesPage() {
  const data = audiencesData;
  const [list, setList] = useState<Audience[]>(data.audiences);
  const [dismissed, setDismissed] = useState<Audience[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", location: "", wants: "" });

  function update(id: string, change: Partial<Audience>) {
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...change } : a)));
  }

  function addAudience(e: FormEvent) {
    e.preventDefault();
    setList((l) => [...l, { id: `aud-${Date.now()}`, ...draft, tags: [], status: "saved" }]);
    setDraft({ name: "", location: "", wants: "" });
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1120px] mx-auto">
      <StrategyHeader />
      <p className="m-0 -mt-4 text-muted text-[13px]">Illustrative sample data — real analytics aren&apos;t connected yet.</p>

      <div className="flex flex-wrap justify-between items-end gap-3.5">
        <div>
          <h2 className="heading text-2xl">Who you&apos;re writing for</h2>
          <p className="mt-1 mb-0 text-muted text-[14.5px]">The agent uses these to choose words, examples and topics.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            disabled={!dismissed.length}
            title={dismissed.length ? undefined : "No new suggestions right now"}
            onClick={() => {
              setList((l) => [...l, ...dismissed]);
              setDismissed([]);
            }}
          >
            Suggest audiences
          </Button>
          <Button variant="primary" onClick={() => setAdding(true)}>
            Add audience
          </Button>
        </div>
      </div>

      {adding && (
        <form onSubmit={addAudience}>
          <Card as="div" className="p-[22px] grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] items-end">
            <label className={labelClass}>
              Name
              <input className={inputClass} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Clinic owners" required autoFocus />
            </label>
            <label className={labelClass}>
              Where · language
              <input className={inputClass} value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} placeholder="e.g. Pakistan · English" required />
            </label>
            <label className={labelClass}>
              What they want
              <input className={inputClass} value={draft.wants} onChange={(e) => setDraft((d) => ({ ...d, wants: e.target.value }))} placeholder="e.g. fewer no-shows" required />
            </label>
            <div className="flex gap-2">
              <Button variant="primary" type="submit">
                Save
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </form>
      )}

      <div className="grid gap-[18px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        {list.map((a) => (
          <AudienceCard
            key={a.id}
            audience={a}
            onSave={() => update(a.id, { status: "saved", reason: undefined })}
            onDismiss={() => {
              setList((l) => l.filter((x) => x.id !== a.id));
              setDismissed((d) => [...d, a]);
            }}
          />
        ))}
      </div>

      {showBanner && (
        <section className="flex flex-wrap gap-4 items-center bg-warning-bg rounded-2xl px-[22px] py-5">
          <span className="w-11 h-11 rounded-xl bg-card text-warning flex items-center justify-center flex-none">
            <Globe size={22} strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="flex-[1_1_320px] text-[#5C3803]">
            <strong className="text-[#3B2A08] text-base">{data.banner.title}</strong> {data.banner.text}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="border-[#E2C48A]"
              onClick={() => {
                setList((l) => [...l, data.banner.audience]);
                setShowBanner(false);
              }}
            >
              Add UK &amp; US audience
            </Button>
            <Button variant="ghost" className="text-[#5C3803] hover:text-[#5C3803]" onClick={() => setShowBanner(false)}>
              Keep focus
            </Button>
          </div>
        </section>
      )}

      <Card className="px-6 py-[22px] flex flex-col gap-[18px]">
        <div className="flex flex-wrap justify-between items-baseline gap-2.5">
          <h2 className="heading text-xl">Who actually follows you</h2>
          <span className="text-muted text-[13px] flex items-center gap-1.5">
            <PlatformBadge platform="linkedin" size="sm" />
            LinkedIn followers. Not the same as people who saw a post.
          </span>
        </div>
        <div className="grid gap-7 grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))]">
          <div>
            <div className="text-muted text-sm">Followers</div>
            <div className="heading text-[38px]">{data.followers.total}</div>
            <div className="text-[13.5px] text-success font-semibold">{data.followers.growth}</div>
          </div>
          <Bars title="Where they are" items={data.followers.locations} />
          <Bars title="What they do" items={data.followers.industries} />
        </div>
      </Card>
    </div>
  );
}
