"use client";

import {
  Calendar,
  ChartColumn,
  House,
  Inbox,
  LogOut,
  Plus,
  SlidersHorizontal,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import { Logo } from "./Logo";

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 min-h-11 px-3 rounded-[10px] no-underline text-[15px] ${
        active
          ? "bg-primary-light text-primary-hover font-bold hover:text-primary-hover"
          : "text-nav font-medium hover:bg-page hover:text-ink"
      }`}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
      {!!badge && (
        <span className="ml-auto bg-marigold text-ink text-xs font-bold rounded-full px-2 py-px">
          {badge}
          <span className="sr-only"> waiting</span>
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({
  showLogo = true,
  hasActivityAlert,
  aiCreditsPercent,
  aiCreditsPostsLeft,
}: {
  showLogo?: boolean;
  hasActivityAlert: number;
  aiCreditsPercent: number;
  aiCreditsPostsLeft: number;
}) {
  const low = aiCreditsPercent <= 20;

  return (
    <nav aria-label="Main" className="flex flex-col gap-[22px] px-4 pt-6 pb-7 text-ink">
      {showLogo && <Logo />}

      <Link
        href="/new-post"
        className="flex items-center justify-center gap-2 min-h-[46px] rounded-[10px] bg-primary text-white no-underline font-bold text-[15px] hover:bg-primary-hover hover:text-white"
      >
        <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
        New post
      </Link>

      <div className="flex flex-col gap-0.5">
        <NavItem href="/" icon={House} label="Home" />
        <NavItem href="/calendar" icon={Calendar} label="Calendar" />
        <NavItem href="/approvals" icon={Inbox} label="Approvals" badge={hasActivityAlert} />
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="mb-1.5 mt-0 px-3 text-[11.5px] font-bold tracking-[.08em] uppercase text-muted">Strategy</p>
        <NavItem href="/strategy/insights" icon={ChartColumn} label="Insights" />
        <NavItem href="/strategy/plan" icon={Target} label="Plan" />
        <NavItem href="/strategy/audiences" icon={Users} label="Audiences" />
      </div>

      <div className="flex flex-col gap-0.5">
        <NavItem href="/settings" icon={SlidersHorizontal} label="Settings" />
      </div>

      <div className="border border-white/55 rounded-xl p-3.5 flex flex-col gap-2.5 bg-white/40 backdrop-blur-md">
        <div className="flex justify-between items-baseline gap-2">
          <span className="font-bold text-sm">AI credits</span>
          {low && <span className="text-[13px] text-warning font-semibold">Running low</span>}
        </div>
        <div
          className="h-1.5 rounded-full bg-divider overflow-hidden"
          role="progressbar"
          aria-label="AI credits left"
          aria-valuenow={aiCreditsPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-marigold" style={{ width: `${Math.max(0, Math.min(100, aiCreditsPercent))}%` }} />
        </div>
        <div className="flex justify-between text-[13px] text-muted">
          <span>About {aiCreditsPostsLeft} posts left</span>
          <Link href="/settings" className="font-bold">
            Top up
          </Link>
        </div>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex items-center gap-2.5 px-2 min-h-9 text-[13px] text-muted hover:text-ink border-0 bg-transparent cursor-pointer w-full"
        >
          <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
          Sign out
        </button>
      </form>
    </nav>
  );
}
