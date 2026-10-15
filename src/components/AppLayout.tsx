"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Logo } from "./Logo";

export default function AppLayout({
  children,
  hasActivityAlert,
  aiCreditsPercent,
  aiCreditsPostsLeft,
}: {
  children: React.ReactNode;
  hasActivityAlert: number;
  aiCreditsPercent: number;
  aiCreditsPostsLeft: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the mobile menu on navigation
  useEffect(() => setMenuOpen(false), [pathname]);

  const sidebarProps = { hasActivityAlert, aiCreditsPercent, aiCreditsPostsLeft };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:block w-60 flex-none bg-white/50 backdrop-blur-xl backdrop-saturate-150 border-r border-white/55">
        <div className="sticky top-0 max-h-screen overflow-y-auto">
          <Sidebar {...sidebarProps} />
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-20 bg-white/60 backdrop-blur-xl backdrop-saturate-150 border-b border-white/55">
        <div className="flex items-center justify-between h-16 px-4">
          <Logo />
          <button
            type="button"
            className="w-11 h-11 flex items-center justify-center rounded-[10px] border border-white/60 bg-white/50 backdrop-blur-md text-ink cursor-pointer hover:bg-white/75"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        {menuOpen && (
          <div id="mobile-menu" className="bg-white/60 backdrop-blur-xl backdrop-saturate-150 border-t border-white/55 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <Sidebar showLogo={false} {...sidebarProps} />
          </div>
        )}
      </header>

      <main className="flex-1 min-w-0 pt-10 pb-16 px-[clamp(20px,4vw,48px)]">{children}</main>
    </div>
  );
}
