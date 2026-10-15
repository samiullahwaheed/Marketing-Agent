"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition, type DragEvent } from "react";
import { reschedulePostAction } from "@/lib/actions";
import { dateKey, dayMonth, monthYear } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import { postLink, statusInfo } from "@/lib/status";
import { toneClasses } from "@/lib/tones";
import type { Platform, Post } from "@/lib/types";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heldOutline = "outline-[1.5px] outline-dashed outline-danger -outline-offset-[1.5px]";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Monday on or before `d`. */
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

function buildDays(view: "month" | "week", cursor: Date) {
  if (view === "week") {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((((first.getDay() + 6) % 7) + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => addDays(start, i));
}

function periodLabel(view: "month" | "week", cursor: Date) {
  if (view === "month") return monthYear(cursor);
  const start = startOfWeek(cursor);
  const end = addDays(start, 6);
  return start.getMonth() === end.getMonth() ? `${start.getDate()}–${dayMonth(end)}` : `${dayMonth(start)} – ${dayMonth(end)}`;
}

function CalendarEvent({ post, held, link }: { post: Post; held: Platform[]; link: string }) {
  const movable = post.status === "waiting_approval" || post.status === "scheduled" || post.status === "processing";
  const tone = statusInfo[post.status].tone;
  return (
    <Link
      href={link}
      draggable={movable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", post.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`block px-2 py-1.5 rounded-lg text-[12.5px] leading-[1.3] no-underline hover:brightness-[.96] ${toneClasses[tone]} ${
        held.length ? heldOutline : ""
      } ${movable ? "cursor-grab" : ""}`}
    >
      <strong>{post.time}</strong> {post.topic}
      {held.length > 0 && <span className="block font-bold text-error">{held.map((p) => PLATFORMS[p].label).join(", ")} on hold</span>}
    </Link>
  );
}

export default function CalendarView({ posts, reconnectPlatforms }: { posts: Post[]; reconnectPlatforms: Platform[] }) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [localPosts, setLocalPosts] = useState(posts);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const todayKey = dateKey(new Date());
  const days = buildDays(view, cursor);

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of [...localPosts].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))) {
      map.set(p.date, [...(map.get(p.date) ?? []), p]);
    }
    return map;
  }, [localPosts]);

  function move(step: number) {
    setCursor((c) => (view === "month" ? new Date(c.getFullYear(), c.getMonth() + step, 1) : addDays(c, step * 7)));
  }

  function drop(e: DragEvent, day: Date) {
    e.preventDefault();
    setDropTarget(null);
    const id = e.dataTransfer.getData("text/plain");
    const newDate = dateKey(day);
    setLocalPosts((list) => list.map((p) => (p.id === id ? { ...p, date: newDate } : p)));
    startTransition(() => {
      void reschedulePostAction(id, newDate);
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1180px] mx-auto">
      <header className="flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="heading text-[34px] sm:text-[42px] leading-[1.08]">Calendar</h1>
          <p className="m-0 text-muted text-[17px]">Click a post to open it. Drag one to a new day to reschedule.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1">
            <Button className="px-3" aria-label={view === "month" ? "Previous month" : "Previous week"} onClick={() => move(-1)}>
              <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
            </Button>
            <span className="heading text-xl min-w-[150px] text-center" aria-live="polite">
              {periodLabel(view, cursor)}
            </span>
            <Button className="px-3" aria-label={view === "month" ? "Next month" : "Next week"} onClick={() => move(1)}>
              <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
          <div className="flex border border-control rounded-[10px] overflow-hidden">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`min-h-[42px] px-3.5 border-0 text-sm font-semibold cursor-pointer ${
                  view === v ? "bg-ink text-white" : "bg-card text-ink hover:bg-page"
                }`}
              >
                {v === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
          <Button variant="primary" to="/new-post">
            New post
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2.5 items-center text-[13px]">
        <Chip tone="success">Published</Chip>
        <Chip tone="info">Scheduled</Chip>
        <Chip tone="warning">Waiting for you</Chip>
        <Chip tone="error">Failed</Chip>
        <span className={`inline-flex rounded-full ${heldOutline}`}>
          <Chip tone="info">On hold (reconnect needed)</Chip>
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[840px]">
            <div className="grid grid-cols-7 border-b border-border bg-subtle">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-3 py-2.5 text-xs font-bold tracking-[.07em] uppercase text-muted">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const key = dateKey(day);
                const outside = view === "month" && day.getMonth() !== cursor.getMonth();
                const weekend = i % 7 >= 5;
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTarget(key);
                    }}
                    onDragLeave={() => setDropTarget((t) => (t === key ? null : t))}
                    onDrop={(e) => drop(e, day)}
                    className={`p-2 flex flex-col gap-1.5 border-b border-divider ${view === "week" ? "min-h-[320px]" : "min-h-[124px]"} ${
                      i % 7 === 6 ? "" : "border-r"
                    } ${dropTarget === key ? "bg-primary-light" : outside ? "bg-[#F5F6F2]" : weekend ? "bg-[#FCFCFA]" : "bg-card"}`}
                  >
                    {isToday ? (
                      <span
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm"
                        aria-label={`${day.getDate()}, today`}
                      >
                        {day.getDate()}
                      </span>
                    ) : (
                      <span className={`block px-0.5 py-1 font-semibold text-sm ${outside ? "text-[#6B746F]" : "text-ink"}`}>{day.getDate()}</span>
                    )}
                    {(byDay.get(key) ?? []).map((post) => {
                      const held = post.platforms.filter((p) => reconnectPlatforms.includes(p));
                      return <CalendarEvent key={post.id} post={post} held={held} link={postLink(post)} />;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
