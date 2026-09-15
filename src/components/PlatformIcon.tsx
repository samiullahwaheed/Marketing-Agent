import type { Platform } from "@/lib/types";

const STYLES: Record<Platform, { bg: string; label: string }> = {
  linkedin: { bg: "bg-[#0A66C2]", label: "in" },
  x: { bg: "bg-black", label: "X" },
  instagram: { bg: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]", label: "" },
  facebook: { bg: "bg-[#1877F2]", label: "f" },
};

export default function PlatformIcon({
  platform,
  size = 20,
}: {
  platform: Platform;
  size?: number;
}) {
  const s = STYLES[platform];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white ${s.bg}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
    >
      {platform === "instagram" ? (
        <svg
          viewBox="0 0 24 24"
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      ) : (
        s.label
      )}
    </span>
  );
}
