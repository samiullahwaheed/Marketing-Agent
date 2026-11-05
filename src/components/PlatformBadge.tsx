import type { ReactNode } from "react";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";

const sizes = {
  sm: 20,
  md: 24,
  lg: 34,
};

// Official brand marks. LinkedIn and Facebook paths are the Simple Icons glyphs (CC0);
// Instagram is the camera glyph drawn on the brand gradient. Gradient is CSS, not an
// SVG <defs> id, so repeated badges (e.g. a hidden mobile sidebar) always render.
const LOGOS: Record<Platform, (px: number) => ReactNode> = {
  linkedin: (px) => (
    <svg viewBox="0 0 24 24" width={px} height={px} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="3" fill="#FFFFFF" />
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  ),
  facebook: (px) => (
    <svg viewBox="0 0 24 24" width={px} height={px} aria-hidden="true">
      <circle cx="12" cy="12" r="11.5" fill="#FFFFFF" />
      <path
        fill="#0866FF"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    </svg>
  ),
  instagram: (px) => (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: px,
        height: px,
        borderRadius: Math.round(px * 0.27),
        background:
          "radial-gradient(circle at 30% 107%, #FDF497 0%, #FDF497 5%, #FD5949 45%, #D6249F 60%, #285AEB 90%)",
      }}
    >
      <svg viewBox="0 0 24 24" width={Math.round(px * 0.72)} height={Math.round(px * 0.72)} aria-hidden="true" fill="none" stroke="#FFFFFF">
        <rect x="3" y="3" width="18" height="18" rx="5.2" strokeWidth="2.2" />
        <circle cx="12" cy="12" r="4.3" strokeWidth="2.2" />
        <circle cx="17.4" cy="6.6" r="1.25" fill="#FFFFFF" stroke="none" />
      </svg>
    </span>
  ),
};

export function PlatformBadge({ platform, size = "md" }: { platform: Platform; size?: keyof typeof sizes }) {
  const p = PLATFORMS[platform];
  return (
    <span title={p.label} className="inline-flex items-center justify-center flex-none leading-none">
      {LOGOS[platform](sizes[size])}
      <span className="sr-only">{p.label}</span>
    </span>
  );
}
