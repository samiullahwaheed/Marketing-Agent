import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link href={to} className="inline-flex items-center gap-1.5 font-bold text-sm no-underline min-h-8 self-start">
      <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </Link>
  );
}
