"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getPostById,
  getSettings,
  insertPost,
  setAccountStatus,
  updatePost,
  updateSettings,
} from "./db";
import { triggerCreatePostWebhook, triggerPublishPostWebhook } from "./n8n";
import { createImageUploadTarget, uploadPostImage } from "./supabase";
import type { Platform, PlatformContent, PlatformResult, Post, PostDoc, RewriteRequest } from "./types";

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

export async function createPostAction(formData: FormData): Promise<void> {
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

  const settings = await getSettings();
  const now = new Date();
  const doc: PostDoc = {
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
      await updatePost(postId, { imageUrl });
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
    await updatePost(postId, {
      status: "failed",
      lastError: err instanceof Error ? err.message : "Could not start the create-post workflow.",
    });
  }

  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals");
}

export async function approvePostAction(id: string): Promise<void> {
  const post = await getPostById(id);
  if (!post) return;

  const results: Partial<Record<Platform, PlatformResult>> = { ...(post.results || {}) };
  for (const p of post.platforms) {
    results[p] = { ...(results[p] || { status: "not_sent" }), status: "scheduled" };
  }

  await updatePost(id, { status: "scheduled", results });
  const res = await triggerPublishPostWebhook({
    postId: id,
    topic: post.topic,
    date: post.date,
    time: post.time,
    scheduledAt: publishAt(post),
    platforms: post.platforms,
    content: post.content,
    imageUrl: post.imageUrl,
    callbackUrl: callbackUrl(),
  });
  if (!res.called || res.ok === false) {
    await updatePost(id, {
      status: "failed",
      lastError: res.error || "Could not reach the n8n publish workflow.",
    });
  }
  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function rejectPostAction(
  id: string,
  input?: { reason?: string; note?: string; banWord?: string }
): Promise<void> {
  await updatePost(id, {
    status: "rejected",
    rejectionReason: input?.reason,
    rejectionNote: input?.note,
  });

  if (input?.banWord) await addBannedWord(input.banWord);

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
  revalidatePath(`/post/${id}/review`);
}

export async function requestRewriteAction(id: string, request?: RewriteRequest): Promise<void> {
  const post = await getPostById(id);
  if (!post) return;

  const settings = await getSettings();
  await updatePost(id, {
    status: "processing",
    warnings: [],
  });

  try {
    // Keep the current image; only ask n8n for a new one if the last attempt never produced it.
    const imageUpload =
      post.imageMode === "ai" && !post.imageUrl ? await createImageUploadTarget(id) : undefined;
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
      rewrite: true,
      rewriteRequest: request,
      currentContent: post.content,
      callbackUrl: callbackUrl(),
    });
    if (!res.called || res.ok === false) {
      throw new Error(res.error || "Could not reach the n8n rewrite workflow.");
    }
  } catch (err) {
    await updatePost(id, {
      status: "failed",
      lastError: err instanceof Error ? err.message : "Could not start the rewrite workflow.",
    });
  }

  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function retryPostAction(id: string): Promise<void> {
  const post = await getPostById(id);
  if (!post) return;

  const platforms = post.platforms.filter((platform) => post.results?.[platform]?.status !== "published");
  const results: Partial<Record<Platform, PlatformResult>> = { ...(post.results || {}) };
  for (const p of platforms) {
    results[p] = { ...(results[p] || { status: "not_sent" }), status: "scheduled", error: undefined };
  }

  await updatePost(id, {
    status: "scheduled",
    attempts: (post.attempts || 0) + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: null,
    results,
  });
  const res = await triggerPublishPostWebhook({
    postId: id,
    topic: post.topic,
    date: post.date,
    time: post.time,
    scheduledAt: publishAt(post),
    platforms,
    content: post.content,
    imageUrl: post.imageUrl,
    callbackUrl: callbackUrl(),
  });
  if (!res.called || res.ok === false) {
    await updatePost(id, {
      status: "failed",
      lastError: res.error || "Could not reach the n8n publish workflow.",
    });
  }

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function giveUpOnPostAction(id: string): Promise<void> {
  await updatePost(id, { status: "rejected" });
  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals");
}

export async function updatePlatformContentAction(
  id: string,
  platform: Platform,
  content: PlatformContent
): Promise<void> {
  const post = await getPostById(id);
  if (!post) return;
  await updatePost(id, { content: { ...post.content, [platform]: content } });
  revalidatePath(`/post/${id}`);
}

export async function reschedulePostAction(id: string, date: string): Promise<void> {
  const post = await getPostById(id);
  if (!post) return;

  // Shift the stored instant by the same number of days so the author's time zone is kept.
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round(
    (new Date(`${date}T00:00:00Z`).getTime() - new Date(`${post.date}T00:00:00Z`).getTime()) / dayMs
  );
  const base = post.scheduledAt ? new Date(post.scheduledAt).getTime() : new Date(`${post.date}T${post.time}:00Z`).getTime();
  await updatePost(id, {
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
  const file = formData.get("imageFile");
  if (!validImage(file)) return;
  const imageUrl = await uploadPostImage(id, file);
  await updatePost(id, { imageUrl });
  revalidatePath(`/post/${id}`);
}

export async function reconnectAccountAction(platform: Platform): Promise<void> {
  await setAccountStatus(platform, "connected");
  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/new-post");
}

export async function saveBrandVoiceAction(formData: FormData): Promise<void> {
  const tone = String(formData.get("tone") || "");
  const keywords = String(formData.get("keywords") || "");
  const sampleText = String(formData.get("sampleText") || "");
  const doNots = String(formData.get("doNots") || "");

  await updateSettings({ brandVoice: { tone, keywords, sampleText, doNots } });
  revalidatePath("/settings");
}

async function addBannedWord(word: string): Promise<void> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return;
  const { bannedWords = [] } = await getSettings();
  if (!bannedWords.includes(trimmed)) {
    await updateSettings({ bannedWords: [...bannedWords, trimmed] });
  }
}

export async function addBannedWordAction(word: string): Promise<void> {
  await addBannedWord(word);
  revalidatePath("/settings");
}

export async function removeBannedWordAction(word: string): Promise<void> {
  const { bannedWords = [] } = await getSettings();
  await updateSettings({ bannedWords: bannedWords.filter((w) => w !== word) });
  revalidatePath("/settings");
}
