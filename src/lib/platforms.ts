import type { Platform } from "./types";

export interface PlatformMeta {
  key: Platform;
  label: string;
  charLimit: number;
  maxHashtags: number;
  cutoffChars?: number;
  cutoffLabel?: string;
  threadNote?: string;
  imageWidth: number;
  imageHeight: number;
}

export const PLATFORM_ORDER: Platform[] = ["linkedin", "x", "instagram", "facebook"];

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    charLimit: 3000,
    maxHashtags: 5,
    cutoffChars: 210,
    cutoffLabel: '"see more"',
    imageWidth: 1200,
    imageHeight: 627,
  },
  x: {
    key: "x",
    label: "X",
    charLimit: 280,
    maxHashtags: 2,
    threadNote: "Over 280 becomes a thread",
    imageWidth: 1200,
    imageHeight: 675,
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
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
