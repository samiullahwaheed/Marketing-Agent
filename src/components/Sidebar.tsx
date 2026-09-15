"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PenLine, Bell, Megaphone } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const NAV = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/new-post", label: "New post", icon: PenLine },
  { href: "/activity", label: "Activity", icon: Bell },
  { href: "/brand-voice", label: "Brand voice", icon: Megaphone },
];

export default function Sidebar({
  hasActivityAlert,
  aiCreditsPercent,
}: {
  hasActivityAlert: boolean;
  aiCreditsPercent: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-black/5 bg-[#faf9f7] px-3 py-5">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
          M
        </div>
        <span className="text-[15px] font-medium text-neutral-800">Marketing agent</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] transition-colors ${
                active
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-neutral-600 hover:bg-black/4"
              }`}
            >
              <Icon size={16} strokeWidth={2} className={active ? "text-blue-600" : "text-neutral-500"} />
              <span>{label}</span>
              {label === "Activity" && hasActivityAlert && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
          <span>AI credits</span>
          <span className={aiCreditsPercent <= 20 ? "font-medium text-amber-600" : ""}>
            {aiCreditsPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full ${aiCreditsPercent <= 20 ? "bg-amber-500" : "bg-blue-600"}`}
            style={{ width: `${Math.max(0, Math.min(100, aiCreditsPercent))}%` }}
          />
        </div>
      </div>

      <form action={logoutAction} className="px-2 pt-3">
        <button type="submit" className="text-[11px] text-neutral-400 hover:text-neutral-600">
          Sign out
        </button>
      </form>
    </aside>
  );
}
