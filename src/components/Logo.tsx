import Link from "next/link";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="#1F5C46" />
      <path
        d="M8 22c3-9 6-9 8.5-3.5S22 24 26 12"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="12" r="2.8" fill="#E8A33D" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 text-ink no-underline hover:text-ink">
      <LogoMark />
      <span className="font-heading text-lg font-bold tracking-[-0.02em] whitespace-nowrap">Marketing agent</span>
    </Link>
  );
}
