"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LiveRefresh } from "./LiveRefresh";
import Sidebar, { type SidebarUser } from "./Sidebar";
import { Logo } from "./Logo";

export default function AppLayout({
  children,
  user,
  hasActivityAlert,
  aiCreditsPercent,
  aiCreditsPostsLeft,
}: {
  children: React.ReactNode;
  user: SidebarUser | null;
  hasActivityAlert: number;
  aiCreditsPercent: number;
  aiCreditsPostsLeft: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the mobile menu on navigation
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const sidebarProps = { user, hasActivityAlert, aiCreditsPercent, aiCreditsPostsLeft };

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[10px] focus:bg-ink focus:text-white focus:px-4 focus:py-2.5 focus:font-bold focus:no-underline"
      >
        Skip to content
      </a>
      <LiveRefresh />
      {/* Heavier material for the structural region; content stays the lighter layer. */}
      <aside className="hidden lg:block w-60 flex-none bg-white/55 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/60 shadow-[1px_0_0_rgb(23_32_28/0.04)]">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          <Sidebar {...sidebarProps} />
        </div>
      </aside>

      {/* Dim to focus: the open menu is a modal task, so the page behind steps back. */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`lg:hidden fixed inset-0 z-10 bg-[rgb(23_32_28/0.28)] transition-opacity duration-300 ease-out ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <header className="lg:hidden sticky top-0 z-20 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/60">
        <div className="flex items-center justify-between h-16 px-4">
          <Logo />
          <button
            type="button"
            className="press w-11 h-11 flex items-center justify-center rounded-[10px] border border-[rgb(23_32_28/0.09)] bg-white/85 text-ink cursor-pointer hover:bg-white"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        {/* The sheet grows down out of the header that opened it, and closes back up the same way. */}
        <div
          id="mobile-menu"
          inert={!menuOpen}
          className="grid transition-[grid-template-rows,opacity] duration-[var(--duration-spring)] ease-[var(--ease-spring)]"
          style={{ gridTemplateRows: menuOpen ? "1fr" : "0fr", opacity: menuOpen ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <div className="border-t border-white/60 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
              <Sidebar showLogo={false} {...sidebarProps} />
            </div>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 min-w-0 pt-10 pb-16 px-[clamp(20px,4vw,48px)] focus:outline-none">
        {/* Keyed by route so each page settles in once on arrival; live refreshes don't replay it. */}
        <div key={pathname} className="page-in">
          {children}
        </div>
      </main>
    </div>
  );
}
