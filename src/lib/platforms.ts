import type { Platform } from "./types";

export interface PlatformMeta {
  key: Platform;
  label: string;
  /** Short mark used in badges, e.g. "in", "IG", "f". */
  short: string;
  /** Tailwind background colour class for badges/tiles. */
  bg: string;
  charLimit: number;
  maxHashtags: number;
  cutoffChars?: number;
  cutoffLabel?: string;
  threadNote?: string;
  imageWidth: number;
  imageHeight: number;
}

export const PLATFORM_ORDER: Platform[] = ["linkedin", "instagram", "facebook"];

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    short: "in",
    bg: "bg-linkedin",
    charLimit: 3000,
    maxHashtags: 5,
    cutoffChars: 210,
    cutoffLabel: '"see more"',
    imageWidth: 1200,
    imageHeight: 627,
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    short: "IG",
    bg: "bg-instagram",
    charLimit: 2200,
    maxHashtags: 5,
    cutoffChars: 125,
    cutoffLabel: '"more"',
    imageWidth: 1080,
    imageHeight: 1080,
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    short: "f",
    bg: "bg-facebook",
    charLimit: 63206,
    maxHashtags: 10,
    imageWidth: 1200,
    imageHeight: 630,
  },
};

export function formatCharLimit(n: number): string {
  return n.toLocaleString("en-US");
}

export function hashtagsCharCount(hashtags: string[]): number {
  if (hashtags.length === 0) return 0;
  return hashtags.reduce((sum, h) => sum + h.length + 1, -1);
}
