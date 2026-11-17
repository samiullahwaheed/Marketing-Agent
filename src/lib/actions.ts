"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteConnection, getAccounts, getPublishAccounts } from "./connections";
import { getPostById, getSettings, insertPost, updatePost, updateSettings } from "./db";
import { triggerCreatePostWebhook, triggerPublishPostWebhook } from "./n8n";
import { PLATFORMS } from "./platforms";
import { createImageUploadTarget, uploadPostImage } from "./supabase";
import type { Platform, PlatformContent, PlatformResult, Post, PostDoc, RewriteRequest } from "./types";
import { requireUserId } from "./users";

// Every action starts from the signed-in user and only touches that user's posts and settings.

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function getBaseUrl(): string {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}

const callbackUrl = () => `${getBaseUrl()}/api/n8n/callback`;

/** When the publish workflow should post: now for "post now", otherwise the saved time (or now if it has passed). */
function publishAt(post: Post): string {
  const now = Date.now();
  if (post.postNow || !post.scheduledAt) return new Date(now).toISOString();
  return new Date(Math.max(now, new Date(post.scheduledAt).getTime())).toISOString();
}

function validImage(file: FormDataEntryValue | null): file is File {
  if (!(file instanceof File) || file.size === 0) return false;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 5MB.");
  if (file.type && !file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  return true;
}

/**
 * Sends a post to the publish workflow with the owner's own account credentials.
 * Stops before calling n8n if a platform isn't connected (or needs reconnecting).
 */
async function sendToPublish(userId: string, post: Post, platforms: Platform[]): Promise<void> {
  const fail = (lastError: string) => updatePost(userId, post.id, { status: "failed", lastError });

  let publish: Awaited<ReturnType<typeof getPublishAccounts>>;
  try {
    publish = await getPublishAccounts(userId, platforms);
  } catch (err) {
    await fail(err instanceof Error ? err.message : "Could not load your connected accounts.");
    return;
  }
  if (publish.missing.length) {
    const names = publish.missing.map((p) => PLATFORMS[p].label).join(", ");
    await fail(`Connect ${names} in Settings, then press Try again.`);
    return;
  }

  const res = await triggerPublishPostWebhook({
    postId: post.id,
    topic: post.topic,
    date: post.date,
    time: post.time,
    scheduledAt: publishAt(post),
    platforms,
    content: post.content,
    imageUrl: post.imageUrl,
    accounts: publish.accounts,
    callbackUrl: callbackUrl(),
  });
  if (!res.called || res.ok === false) {
    await fail(res.error || "Could not reach the n8n publish workflow.");
  }
}

export async function createPostAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const topic = String(formData.get("topic") || "").trim();
  const postNow = formData.get("postNow") === "1";
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const scheduledAt = postNow ? "" : String(formData.get("scheduledAt") || "");
  const platforms = formData.getAll("platforms").map(String) as Platform[];
  const imageMode = String(formData.get("imageMode") || "ai") as "ai" | "upload";
  const imagePrompt = String(formData.get("imagePrompt") || "").trim();
  const audience = String(formData.get("audience") || "").trim();
  const language = String(formData.get("language") || "").trim();
  const imageFile = formData.get("imageFile");

  if (!topic || platforms.length === 0) {
    throw new Error("Topic and at least one platform are required.");
  }
  if (!date || !time || (!postNow && !scheduledAt)) {
    throw new Error("Pick a date and time, or choose Post now.");
  }
  const hasUpload = imageMode === "upload" && validImage(imageFile);

  const linked = new Set((await getAccounts(userId)).filter((a) => a.status !== "not_connected").map((a) => a.platform));
  if (platforms.some((p) => !linked.has(p))) {
    throw new Error("Connect that account in Settings before posting to it.");
  }

  const settings = await getSettings(userId);
  const now = new Date();
  const doc: PostDoc = {
    userId,
    topic,
    date,
    time,
    scheduledAt: scheduledAt || undefined,
    postNow,
    platforms,
    imageMode,
    imagePrompt: imageMode === "ai" ? imagePrompt : undefined,
    content: {},
    warnings: [],
    audience,
    language,
    status: "processing",
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
  };

  const postId = await insertPost(doc);

  let imageUrl: string | undefined;
  try {
    if (hasUpload) {
      imageUrl = await uploadPostImage(postId, imageFile as File);
      await updatePost(userId, postId, { imageUrl });
    }
    const imageUpload = imageMode === "ai" ? await createImageUploadTarget(postId) : undefined;

    const res = await triggerCreatePostWebhook({
      postId,
      topic,
      date,
      time,
      scheduledAt: scheduledAt || null,
      postNow,
      platforms,
      imageMode,
      imageUrl,
      imagePrompt,
      imageUpload,
      audience,
      language,
      brandVoice: settings.brandVoice,
      bannedWords: settings.bannedWords,
      callbackUrl: callbackUrl(),
    });
    if (!res.called || res.ok === false) {
      throw new Error(res.error || "Could not reach the n8n create-post workflow.");
    }
  } catch (err) {
    await updatePost(userId, postId, {
      status: "failed",
      lastError: err instanceof Error ? err.message : "Could not start the create-post workflow.",
    });
  }

  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals");
}

export async function approvePostAction(id: string): Promise<void> {
  const userId = await requireUserId();
  const post = await getPostById(userId, id);
  if (!post) return;

  const results: Partial<Record<Platform, PlatformResult>> = { ...(post.results || {}) };
  for (const p of post.platforms) {
    results[p] = { ...(results[p] || { status: "not_sent" }), status: "scheduled" };
  }

  await updatePost(userId, id, { status: "scheduled", results });
  await sendToPublish(userId, post, post.platforms);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function rejectPostAction(
  id: string,
  input?: { reason?: string; note?: string; banWord?: string }
): Promise<void> {
  const userId = await requireUserId();
  await updatePost(userId, id, {
    status: "rejected",
    rejectionReason: input?.reason,
    rejectionNote: input?.note,
  });

  if (input?.banWord) await addBannedWord(userId, input.banWord);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
  revalidatePath(`/post/${id}/review`);
}

/** Sends a post to the n8n create workflow: a rewrite when `rewrite` is set, otherwise a fresh first draft. */
async function startGeneration(userId: string, post: Post, rewrite?: { request?: RewriteRequest }): Promise<void> {
  const id = post.id;
  const settings = await getSettings(userId);
  await updatePost(userId, id, {
    status: "processing",
    warnings: [],
    lastError: null,
  });

  try {
    // Keep the current image; only ask n8n for a new one if the last attempt never produced it.
    const imageUpload =
      post.imageMode === "ai" && !post.imageUrl ? await createImageUploadTarget(id) : undefined;
    const request = rewrite?.request;
    const platforms = request?.platforms?.length
      ? post.platforms.filter((p) => request.platforms?.includes(p))
      : post.platforms;

    const res = await triggerCreatePostWebhook({
      postId: id,
      topic: post.topic,
      date: post.date,
      time: post.time,
      scheduledAt: post.postNow ? null : post.scheduledAt ?? null,
      postNow: post.postNow,
      platforms,
      imageMode: post.imageMode,
      imageUrl: post.imageUrl,
      imagePrompt: post.imagePrompt,
      imageUpload,
      audience: post.audience,
      language: post.language,
      brandVoice: settings.brandVoice,
      bannedWords: settings.bannedWords,
      ...(rewrite ? { rewrite: true, rewriteRequest: request, currentContent: post.content } : {}),
      callbackUrl: callbackUrl(),
    });
    if (!res.called || res.ok === false) {
      throw new Error(res.error || "Could not reach the n8n create-post workflow.");
    }
  } catch (err) {
    await updatePost(userId, id, {
      status: "failed",
      lastError: err instanceof Error ? err.message : "Could not start the create-post workflow.",
    });
  }
}

export async function requestRewriteAction(id: string, request?: RewriteRequest): Promise<void> {
  const userId = await requireUserId();
  const post = await getPostById(userId, id);
  if (!post) return;

  await startGeneration(userId, post, { request });

  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function retryPostAction(id: string): Promise<void> {
  const userId = await requireUserId();
  const post = await getPostById(userId, id);
  if (!post) return;

  // Failed before any draft was written (e.g. n8n unreachable): write the draft again, don't publish.
  if (!post.platforms.some((p) => post.content[p]?.text)) {
    await updatePost(userId, id, { attempts: (post.attempts || 0) + 1, lastAttemptAt: new Date().toISOString() });
    await startGeneration(userId, post);
    revalidatePath("/");
    revalidatePath("/approvals");
    revalidatePath(`/post/${id}`);
    return;
  }

  const platforms = post.platforms.filter((platform) => post.results?.[platform]?.status !== "published");
  if (platforms.length === 0) {
    await updatePost(userId, id, { status: "published", lastError: null });
    revalidatePath("/");
    revalidatePath("/approvals");
    revalidatePath(`/post/${id}`);
    return;
  }
  const results: Partial<Record<Platform, PlatformResult>> = { ...(post.results || {}) };
  for (const p of platforms) {
    results[p] = { ...(results[p] || { status: "not_sent" }), status: "scheduled", error: undefined };
  }

  await updatePost(userId, id, {
    status: "scheduled",
    attempts: (post.attempts || 0) + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: null,
    results,
  });
  await sendToPublish(userId, post, platforms);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function giveUpOnPostAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await updatePost(userId, id, { status: "rejected" });
  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals");
}

export async function updatePlatformContentAction(
  id: string,
  platform: Platform,
  content: PlatformContent
): Promise<void> {
  const userId = await requireUserId();
  const post = await getPostById(userId, id);
  if (!post) return;
  await updatePost(userId, id, { content: { ...post.content, [platform]: content } });
  revalidatePath(`/post/${id}`);
}

export async function reschedulePostAction(id: string, date: string): Promise<void> {
  const userId = await requireUserId();
  const post = await getPostById(userId, id);
  if (!post) return;

  // Shift the stored instant by the same number of days so the author's time zone is kept.
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round(
    (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${post.date}T00:00:00Z`).getTime()) / dayMs
  );
  const base = post.scheduledAt ? new Date(post.scheduledAt).getTime() : new Date(`${post.date}T${post.time}:00Z`).getTime();
  await updatePost(userId, id, {
    date,
    postNow: false,
    scheduledAt: new Date(base + days * dayMs).toISOString(),
  });
  revalidatePath("/calendar");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
  revalidatePath(`/post/${id}/review`);
}

export async function updatePostImageAction(id: string, formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const file = formData.get("imageFile");
  if (!validImage(file)) return;
  // Check ownership before writing to storage under this post's id.
  if (!(await getPostById(userId, id))) return;
  const imageUrl = await uploadPostImage(id, file);
  await updatePost(userId, id, { imageUrl });
  revalidatePath(`/post/${id}`);
}

export async function disconnectAccountAction(platform: Platform): Promise<void> {
  const userId = await requireUserId();
  await deleteConnection(userId, platform);
  revalidatePath("/settings");
  revalidatePath("/new-post");
}

export async function saveBrandVoiceAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const tone = String(formData.get("tone") || "");
  const keywords = String(formData.get("keywords") || "");
  const sampleText = String(formData.get("sampleText") || "");
  const doNots = String(formData.get("doNots") || "");

  await updateSettings(userId, { brandVoice: { tone, keywords, sampleText, doNots } });
  revalidatePath("/settings");
}

async function addBannedWord(userId: string, word: string): Promise<void> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return;
  const { bannedWords = [] } = await getSettings(userId);
  if (!bannedWords.includes(trimmed)) {
    await updateSettings(userId, { bannedWords: [...bannedWords, trimmed] });
  }
}

export async function addBannedWordAction(word: string): Promise<void> {
  await addBannedWord(await requireUserId(), word);
  revalidatePath("/settings");
}

export async function removeBannedWordAction(word: string): Promise<void> {
  const userId = await requireUserId();
  const { bannedWords = [] } = await getSettings(userId);
  await updateSettings(userId, { bannedWords: bannedWords.filter((w) => w !== word) });
  revalidatePath("/settings");
}
