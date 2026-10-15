"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { plan } from "@/lib/mock-strategy";
import type { PlanAction } from "@/lib/mock-strategy";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StrategyHeader } from "@/components/StrategyHeader";

const kindColor: Record<PlanAction["tone"], string> = {
  success: "text-success",
  error: "text-error",
  info: "text-info",
  warning: "text-warning",
};

/** Heatmap shades, from fewest to most interactions. */
const SHADES = ["#F1F3EE", "#D5E5DA", "#A9CBB5", "#5E9A78", "#1F5C46"];

function ActionCard({ action }: { action: PlanAction }) {
  const [done, setDone] = useState<string[]>([]);
  return (
    <Card as="article" className="px-6 py-[22px] flex flex-col gap-3">
      <p className={`eyebrow ${kindColor[action.tone]}`}>{action.kind}</p>
      <h3 className="heading text-xl">{action.title}</h3>
      <p className="m-0 text-muted">{action.text}</p>
      <div className="flex flex-wrap gap-2 mt-auto">
        {action.buttons.map((b) =>
          b.to ? (
            <Button key={b.label} variant={b.variant ?? "secondary"} to={b.to}>
              {b.label}
            </Button>
          ) : (
            <Button
              key={b.label}
              variant={b.variant ?? "secondary"}
              aria-pressed={done.includes(b.label)}
              onClick={() => setDone((d) => (d.includes(b.label) ? d.filter((x) => x !== b.label) : [...d, b.label]))}
            >
              {done.includes(b.label) && <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
              {done.includes(b.label) ? b.doneLabel ?? b.label : b.label}
            </Button>
          )
        )}
      </div>
    </Card>
  );
}

function ContentMix({ mix }: { mix: typeof plan.mix }) {
  const [editing, setEditing] = useState(false);
  const [targets, setTargets] = useState(mix.map((m) => m.target));
  // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the editable copy when the source data changes
  useEffect(() => setTargets(mix.map((m) => m.target)), [mix]);

  return (
    <Card className="px-6 py-[22px] flex flex-col gap-[18px]">
      <div className="flex justify-between items-baseline gap-2.5">
        <h2 className="heading text-xl">Content mix</h2>
        <Button size="sm" onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
          {editing ? "Done" : "Edit targets"}
        </Button>
      </div>
      <p className="-mt-2 mb-0 text-muted text-sm">Bar = what you posted. Line = your target.</p>
      {mix.map((m, i) => (
        <div key={m.topic} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-2.5 text-sm">
            <strong>{m.topic}</strong>
            <span className="text-muted">
              {m.current}% now · target {targets[i]}%
            </span>
          </div>
          <div className="relative h-3.5 rounded-full bg-divider">
            <span className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: `${m.current}%`, background: m.color }} />
            <span className="absolute -top-1 -bottom-1 w-[3px] rounded-sm bg-ink" style={{ left: `calc(${targets[i]}% - 1.5px)` }} />
          </div>
          {editing && (
            <label className="flex items-center gap-3 text-[13px] text-muted">
              Target
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={targets[i]}
                onChange={(e) => setTargets((t) => t.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                className="flex-1 accent-primary"
                aria-label={`Target for ${m.topic}`}
              />
            </label>
          )}
        </div>
      ))}
    </Card>
  );
}

export default function StrategyPlanPage() {
  const data = plan;

  return (
    <div className="flex flex-col gap-6 max-w-[1120px] mx-auto">
      <StrategyHeader />
      <p className="m-0 -mt-4 text-muted text-[13px]">Illustrative sample data — real analytics aren&apos;t connected yet.</p>

      <section className="bg-ink border border-ink text-white rounded-2xl px-6 py-[22px] flex flex-wrap gap-6 items-center">
        <div className="flex-[1_1_300px] flex flex-col gap-1.5">
          <p className="eyebrow text-[#B9CBBF]">{data.week.label}</p>
          <h2 className="heading text-[26px] text-white">{data.week.title}</h2>
          <p className="m-0 text-[#D7E6DD] text-[14.5px]">{data.week.text}</p>
        </div>
        <div className="flex-[1_1_240px] flex flex-col gap-2.5">
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-label="Posts this week"
            aria-valuenow={data.week.done}
            aria-valuemin={0}
            aria-valuemax={data.week.total}
          >
            {Array.from({ length: data.week.total }, (_, i) => (
              <span key={i} className={`flex-1 h-2.5 rounded-full ${i < data.week.done ? "bg-marigold-soft" : "bg-[#3B4741]"}`} />
            ))}
          </div>
          <Button to="/new-post" className="self-start bg-marigold-soft border-marigold-soft text-ink hover:bg-marigold hover:border-marigold">
            Plan the next post
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap justify-between items-baseline gap-2.5">
        <h2 className="heading text-2xl">What to do next</h2>
        <span className="text-muted text-[13.5px]">{data.basis}</span>
      </div>

      <div className="grid gap-[18px] grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        {data.actions.map((a) => (
          <ActionCard key={a.id} action={a} />
        ))}
      </div>

      <div className="grid gap-5 items-start grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))]">
        <ContentMix mix={data.mix} />

        <Card className="px-6 py-[22px] flex flex-col gap-3.5">
          <h2 className="heading text-xl">When your posts do best</h2>
          <div className="overflow-x-auto">
            <div
              className="min-w-[380px] grid gap-[5px] text-[12.5px]"
              style={{ gridTemplateColumns: `52px repeat(${data.heatmap.slots.length}, minmax(0, 1fr))` }}
            >
              <span />
              {data.heatmap.slots.map((s) => (
                <span key={s} className="text-muted text-center">
                  {s}
                </span>
              ))}
              {data.heatmap.rows.map((r) => (
                <div key={r.day} className="contents">
                  <span className="font-semibold self-center">{r.day}</span>
                  {r.values.map((v, i) => (
                    <span
                      key={i}
                      title={`${r.day} ${data.heatmap.slots[i]}: level ${v}`}
                      className={`block h-[34px] rounded-[7px] ${v === 0 ? "border border-border" : ""}`}
                      style={{ background: SHADES[v] }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-muted flex-wrap">
            Fewer
            {SHADES.map((c, i) => (
              <span key={c} className={`w-[18px] h-3 rounded-[3px] ${i === 0 ? "border border-border" : ""}`} style={{ background: c }} />
            ))}
            more interactions per post
          </div>
        </Card>
      </div>

      <Card className="px-6 py-5 flex flex-wrap gap-5 items-center">
        <div className="flex-[1_1_320px] flex flex-col gap-1">
          <p className="eyebrow">Experiment running</p>
          <h3 className="heading text-[19px]">{data.experiment.title}</h3>
          <p className="m-0 text-muted text-sm">{data.experiment.text}</p>
        </div>
        <div className="flex-[1_1_260px] flex flex-col gap-2 text-[13.5px]">
          {data.experiment.variants.map((v, i) => (
            <div key={v.label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2.5 items-center">
              <span>{v.label}</span>
              <span className="h-2.5 rounded-full" style={{ width: `${v.value}%`, background: i === 0 ? "#1F5C46" : "#A9CBB5" }} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
