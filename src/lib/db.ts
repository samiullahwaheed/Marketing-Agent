import "server-only";
import { getSupabase, unwrap, unwrapOne } from "./supabase";
import type {
  AccountDoc,
  Account,
  Platform,
  PostDoc,
  Post,
  SettingsDoc,
} from "./types";

// Column names in Postgres are snake_case; the app works in camelCase.
// These mappers are the only place that knows both shapes.

export interface PostRow {
  id: string;
  topic: string;
  post_date: string;
  post_time: string;
  scheduled_at: string | null;
  post_now: boolean;
  platforms: Platform[];
  image_mode: "ai" | "upload";
  image_prompt: string | null;
  image_url: string | null;
  audience: string | null;
  language: string | null;
  content: PostDoc["content"];
  warnings: string[];
  status: PostDoc["status"];
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  last_attempt_at: string | null;
  results: NonNullable<PostDoc["results"]>;
  rejection_reason: string | null;
  rejection_note: string | null;
  created_at: string;
  updated_at: string;
}

const opt = <T,>(v: T | null): T | undefined => (v === null ? undefined : v);

export function serializePost(row: PostRow): Post {
  return {
    id: row.id,
    topic: row.topic,
    date: row.post_date,
    time: row.post_time,
    scheduledAt: opt(row.scheduled_at),
    postNow: row.post_now,
    platforms: row.platforms,
    imageMode: row.image_mode,
    imagePrompt: opt(row.image_prompt),
    imageUrl: opt(row.image_url),
    audience: opt(row.audience),
    language: opt(row.language),
    content: row.content ?? {},
    warnings: row.warnings ?? [],
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastError: opt(row.last_error),
    lastAttemptAt: opt(row.last_attempt_at),
    results: row.results ?? {},
    rejectionReason: opt(row.rejection_reason),
    rejectionNote: opt(row.rejection_note),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const POST_COLUMNS: Record<keyof Omit<PostDoc, "createdAt" | "updatedAt">, keyof PostRow> = {
  id: "id",
  topic: "topic",
  date: "post_date",
  time: "post_time",
  scheduledAt: "scheduled_at",
  postNow: "post_now",
  platforms: "platforms",
  imageMode: "image_mode",
  imagePrompt: "image_prompt",
  imageUrl: "image_url",
  audience: "audience",
  language: "language",
  content: "content",
  warnings: "warnings",
  status: "status",
  attempts: "attempts",
  maxAttempts: "max_attempts",
  lastError: "last_error",
  lastAttemptAt: "last_attempt_at",
  results: "results",
  rejectionReason: "rejection_reason",
  rejectionNote: "rejection_note",
};

/** Converts a camelCase patch to a row patch. `null` clears a column; `undefined` is skipped. */
export function toPostRow(patch: { [K in keyof PostDoc]?: PostDoc[K] | null }): Partial<PostRow> {
  const row: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(POST_COLUMNS)) {
    const value = patch[key as keyof PostDoc];
    if (value !== undefined) row[column] = value;
  }
  return row as Partial<PostRow>;
}

export async function insertPost(doc: PostDoc): Promise<string> {
  const row = unwrapOne(
    await getSupabase().from("posts").insert(toPostRow(doc)).select("id").single(),
    "Could not save post"
  );
  return row.id;
}

export async function updatePost(
  id: string,
  patch: { [K in keyof PostDoc]?: PostDoc[K] | null }
): Promise<void> {
  unwrap(
    await getSupabase()
      .from("posts")
      .update({ ...toPostRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id),
    "Could not update post"
  );
}

export async function countPosts(filter: {
  status?: PostDoc["status"] | PostDoc["status"][];
  platforms?: Platform[];
  updatedSince?: Date;
}): Promise<number> {
  let q = getSupabase().from("posts").select("id", { count: "exact", head: true });
  if (Array.isArray(filter.status)) q = q.in("status", filter.status);
  else if (filter.status) q = q.eq("status", filter.status);
  if (filter.platforms) q = q.overlaps("platforms", filter.platforms);
  if (filter.updatedSince) q = q.gte("updated_at", filter.updatedSince.toISOString());
  const { count, error } = await q;
  if (error) throw new Error(`Could not count posts: ${error.message}`);
  return count ?? 0;
}

interface AccountRow {
  platform: Platform;
  label: string;
  status: AccountDoc["status"];
  updated_at: string;
}

export function serializeAccount(row: AccountRow): Account {
  return {
    id: row.platform,
    platform: row.platform,
    label: row.label,
    status: row.status,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const DEFAULT_ACCOUNTS: Array<Pick<AccountDoc, "platform" | "label" | "status">> = [
  { platform: "linkedin", label: "LinkedIn", status: "connected" },
  { platform: "instagram", label: "Instagram", status: "connected" },
  { platform: "facebook", label: "Facebook", status: "connected" },
];

export async function getAccounts(): Promise<Account[]> {
  const supabase = getSupabase();
  let rows = unwrap(await supabase.from("accounts").select("*"), "Could not load accounts") as AccountRow[];
  if (rows.length === 0) {
    rows = unwrap(
      await supabase.from("accounts").upsert(DEFAULT_ACCOUNTS, { onConflict: "platform" }).select("*"),
      "Could not create default accounts"
    ) as AccountRow[];
  }
  const order = ["linkedin", "instagram", "facebook"];
  rows.sort((a, b) => order.indexOf(a.platform) - order.indexOf(b.platform));
  return rows.map(serializeAccount);
}

export async function setAccountStatus(platform: Platform, status: AccountDoc["status"]): Promise<void> {
  const label = DEFAULT_ACCOUNTS.find((a) => a.platform === platform)?.label ?? platform;
  unwrap(
    await getSupabase()
      .from("accounts")
      .upsert({ platform, label, status, updated_at: new Date().toISOString() }, { onConflict: "platform" }),
    "Could not update account"
  );
}

interface SettingsRow {
  id: string;
  ai_credits_percent: number;
  ai_credits_posts_left: number;
  brand_voice: SettingsDoc["brandVoice"];
  banned_words: string[];
}

export async function getSettings(): Promise<SettingsDoc> {
  const supabase = getSupabase();
  let row = unwrap(
    await supabase.from("settings").select("*").eq("id", "global").maybeSingle(),
    "Could not load settings"
  ) as SettingsRow | null;
  if (!row) {
    row = unwrap(
      await supabase.from("settings").upsert({ id: "global" }, { onConflict: "id" }).select("*").single(),
      "Could not create settings"
    ) as SettingsRow;
  }
  return {
    aiCreditsPercent: row.ai_credits_percent,
    aiCreditsPostsLeft: row.ai_credits_posts_left,
    brandVoice: row.brand_voice,
    bannedWords: row.banned_words ?? [],
  };
}

export async function updateSettings(
  patch: Partial<Pick<SettingsDoc, "brandVoice" | "bannedWords">>
): Promise<void> {
  unwrap(
    await getSupabase()
      .from("settings")
      .upsert(
        {
          id: "global",
          ...(patch.brandVoice ? { brand_voice: patch.brandVoice } : {}),
          ...(patch.bannedWords ? { banned_words: patch.bannedWords } : {}),
        },
        { onConflict: "id" }
      ),
    "Could not save settings"
  );
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = unwrap(
    await getSupabase().from("posts").select("*").eq("id", id).maybeSingle(),
    "Could not load post"
  ) as PostRow | null;
  return row ? serializePost(row) : null;
}

export interface HomeData {
  publishedThisMonth: number;
  waitingCount: number;
  failedCount: number;
  scheduledCount: number;
  comingUp: Post[];
  recent: Post[];
}

export async function getHomeData(): Promise<HomeData> {
  const supabase = getSupabase();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    publishedThisMonth,
    waitingCount,
    failedCount,
    scheduledCount,
    comingUpRes,
    recentRes,
  ] = await Promise.all([
    countPosts({ status: "published", updatedSince: monthStart }),
    countPosts({ status: "waiting_approval" }),
    countPosts({ status: "failed" }),
    countPosts({ status: "scheduled" }),
    supabase
      .from("posts")
      .select("*")
      .eq("status", "scheduled")
      .order("post_date")
      .order("post_time")
      .limit(3),
    supabase
      .from("posts")
      .select("*")
      .in("status", ["published", "failed"])
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  return {
    publishedThisMonth,
    waitingCount,
    failedCount,
    scheduledCount,
    comingUp: (unwrap(comingUpRes, "Could not load scheduled posts") as PostRow[]).map(serializePost),
    recent: (unwrap(recentRes, "Could not load recent posts") as PostRow[]).map(serializePost),
  };
}

export async function getCalendarPosts(): Promise<Post[]> {
  const rows = unwrap(
    await getSupabase().from("posts").select("*").order("post_date").order("post_time"),
    "Could not load calendar"
  ) as PostRow[];
  return rows.map(serializePost);
}

export interface ActivityData {
  posts: Post[];
}

export async function getActivityData(): Promise<ActivityData> {
  const rows = unwrap(
    await getSupabase().from("posts").select("*").order("updated_at", { ascending: false }).limit(200),
    "Could not load posts"
  ) as PostRow[];
  return { posts: rows.map(serializePost) };
}
