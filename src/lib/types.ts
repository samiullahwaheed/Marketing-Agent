export type Platform = "linkedin" | "x" | "instagram" | "facebook";

export type PostStatus =
  | "processing"
  | "waiting_approval"
  | "scheduled"
  | "published"
  | "failed"
  | "rejected";

export type AccountStatus = "connected" | "reconnect" | "not_connected";

export interface PlatformContent {
  text: string;
  hashtags: string[];
  suggestedHashtags?: string[];
  keywords?: string[];
}

export interface PlatformResult {
  status: "not_sent" | "scheduled" | "published" | "failed";
  url?: string;
  views?: number;
  reactions?: number;
  comments?: number;
  publishedAt?: string;
  error?: string;
}

export interface PostDoc {
  id?: string;
  topic: string;
  date: string;
  time: string;
  scheduledAt?: string;
  /** No date/time was picked: publish as soon as the post is approved. */
  postNow: boolean;
  platforms: Platform[];
  imageMode: "ai" | "upload";
  imagePrompt?: string;
  imageUrl?: string;
  audience?: string;
  language?: string;
  content: Partial<Record<Platform, PlatformContent>>;
  warnings?: string[];
  status: PostStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  lastAttemptAt?: string;
  results?: Partial<Record<Platform, PlatformResult>>;
  rejectionReason?: string;
  rejectionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post extends Omit<PostDoc, "id" | "createdAt" | "updatedAt"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDoc {
  platform: Platform;
  label: string;
  status: AccountStatus;
  updatedAt: Date;
}

export interface Account extends Omit<AccountDoc, "updatedAt"> {
  id: string;
  updatedAt: string;
}

export interface BrandVoiceDoc {
  tone: string;
  keywords: string;
  sampleText: string;
  doNots: string;
}

export interface SettingsDoc {
  aiCreditsPercent: number;
  aiCreditsPostsLeft: number;
  brandVoice: BrandVoiceDoc;
  bannedWords?: string[];
}

/** What the user asked for on the Rewrite page; forwarded to n8n. */
export interface RewriteRequest {
  instructions?: string;
  options?: string[];
  platforms?: Platform[];
  keepHashtags?: boolean;
}
