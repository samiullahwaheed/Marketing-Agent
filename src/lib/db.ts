import "server-only";
import { PLATFORM_ORDER } from "./platforms";
import { getSupabase, unwrap, unwrapOne } from "./supabase";
import type { Platform, PostDoc, Post, SettingsDoc } from "./types";

// Column names in Postgres are snake_case; the app works in camelCase.
// These mappers are the only place that knows both shapes.
//
// Every function takes the owner's user id and filters by it, so one user can never read
// or change another's posts. The only unscoped access is for the n8n callback (`*AsSystem`).

export interface PostRow {
  id: string;
  user_id: string;
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

// Rows written before a platform was removed (e.g. X) must not crash the UI.
const KNOWN_PLATFORMS: readonly string[] = PLATFORM_ORDER;
const isKnownPlatform = (p: string): p is Platform => KNOWN_PLATFORMS.includes(p);

function pickKnown<T>(map: Partial<Record<string, T>> | null | undefined): Partial<Record<Platform, T>> {
  return Object.fromEntries(Object.entries(map ?? {}).filter(([p]) => isKnownPlatform(p))) as Partial<Record<Platform, T>>;
}

export function serializePost(row: PostRow): Post {
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    date: row.post_date,
    time: row.post_time,
    scheduledAt: opt(row.scheduled_at),
    postNow: row.post_now,
    platforms: (row.platforms ?? []).filter(isKnownPlatform),
    imageMode: row.image_mode,
    imagePrompt: opt(row.image_prompt),
    imageUrl: opt(row.image_url),
    audience: opt(row.audience),
    language: opt(row.language),
    content: pickKnown(row.content),
    warnings: row.warnings ?? [],
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastError: opt(row.last_error),
    lastAttemptAt: opt(row.last_attempt_at),
    results: pickKnown(row.results),
    rejectionReason: opt(row.rejection_reason),
    rejectionNote: opt(row.rejection_note),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const POST_COLUMNS: Record<keyof Omit<PostDoc, "createdAt" | "updatedAt">, keyof PostRow> = {
  id: "id",
  userId: "user_id",
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

type PostPatch = { [K in keyof Omit<PostDoc, "userId">]?: PostDoc[K] | null };

/** Updates one of this user's posts. Owner can't be changed through a patch. */
export async function updatePost(userId: string, id: string, patch: PostPatch): Promise<void> {
  unwrap(
    await getSupabase()
      .from("posts")
      .update({ ...toPostRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId),
    "Could not update post"
  );
}

/** For the n8n callback only, which is authenticated by its shared secret, not a user session. */
export async function updatePostAsSystem(id: string, patch: PostPatch): Promise<void> {
  unwrap(
    await getSupabase()
      .from("posts")
      .update({ ...toPostRow(patch), updated_at: new Date().toISOString() })
      .eq("id", id),
    "Could not update post"
  );
}

export async function countPosts(userId: string, filter: {
  status?: PostDoc["status"] | PostDoc["status"][];
  platforms?: Platform[];
  updatedSince?: Date;
}): Promise<number> {
  let q = getSupabase().from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (Array.isArray(filter.status)) q = q.in("status", filter.status);
  else if (filter.status) q = q.eq("status", filter.status);
  if (filter.platforms) q = q.overlaps("platforms", filter.platforms);
  if (filter.updatedSince) q = q.gte("updated_at", filter.updatedSince.toISOString());
  const { count, error } = await q;
  if (error) throw new Error(`Could not count posts: ${error.message}`);
  return count ?? 0;
}

interface SettingsRow {
  id: string;
  ai_credits_percent: number;
  ai_credits_posts_left: number;
  brand_voice: SettingsDoc["brandVoice"];
  banned_words: string[];
}

/** One settings row per user, keyed by the user id; created with defaults on first read. */
export async function getSettings(userId: string): Promise<SettingsDoc> {
  const supabase = getSupabase();
  let row = unwrap(
    await supabase.from("settings").select("*").eq("id", userId).maybeSingle(),
    "Could not load settings"
  ) as SettingsRow | null;
  if (!row) {
    row = unwrap(
      await supabase.from("settings").upsert({ id: userId }, { onConflict: "id" }).select("*").single(),
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
  userId: string,
  patch: Partial<Pick<SettingsDoc, "brandVoice" | "bannedWords">>
): Promise<void> {
  unwrap(
    await getSupabase()
      .from("settings")
      .upsert(
        {
          id: userId,
          ...(patch.brandVoice ? { brand_voice: patch.brandVoice } : {}),
          ...(patch.bannedWords ? { banned_words: patch.bannedWords } : {}),
        },
        { onConflict: "id" }
      ),
    "Could not save settings"
  );
}

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/** This user's post, or null if it doesn't exist or belongs to someone else. */
export async function getPostById(userId: string, id: string): Promise<Post | null> {
  if (!isUuid(id)) return null;
  const row = unwrap(
    await getSupabase().from("posts").select("*").eq("id", id).eq("user_id", userId).maybeSingle(),
    "Could not load post"
  ) as PostRow | null;
  return row ? serializePost(row) : null;
}

/** For the n8n callback only. */
export async function getPostByIdAsSystem(id: string): Promise<Post | null> {
  if (!isUuid(id)) return null;
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

export async function getHomeData(userId: string): Promise<HomeData> {
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
    countPosts(userId, { status: "published", updatedSince: monthStart }),
    countPosts(userId, { status: "waiting_approval" }),
    countPosts(userId, { status: "failed" }),
    countPosts(userId, { status: "scheduled" }),
    supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .order("post_date")
      .order("post_time")
      .limit(3),
    supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
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

export async function getCalendarPosts(userId: string): Promise<Post[]> {
  const rows = unwrap(
    await getSupabase().from("posts").select("*").eq("user_id", userId).order("post_date").order("post_time"),
    "Could not load calendar"
  ) as PostRow[];
  return rows.map(serializePost);
}

export interface ActivityData {
  posts: Post[];
}

export async function getActivityData(userId: string): Promise<ActivityData> {
  const rows = unwrap(
    await getSupabase()
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(200),
    "Could not load posts"
  ) as PostRow[];
  return { posts: rows.map(serializePost) };
}
