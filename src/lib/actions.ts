"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postsCollection, accountsCollection, settingsCollection } from "./db";
import { triggerCreatePostWebhook } from "./n8n";
import type { Platform, PlatformContent, PlatformResult, PostDoc } from "./types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function getBaseUrl(): string {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}

async function setPostFields(id: string, patch: Partial<PostDoc>): Promise<void> {
  const col = await postsCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } }
  );
}

export async function createPostAction(formData: FormData): Promise<void> {
  const topic = String(formData.get("topic") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const platforms = formData.getAll("platforms").map(String) as Platform[];
  const imageMode = String(formData.get("imageMode") || "ai") as "ai" | "upload";
  const imagePrompt = String(formData.get("imagePrompt") || "").trim();
  const imageFile = formData.get("imageFile");

  if (!topic || !date || !time || platforms.length === 0) {
    throw new Error("Topic, date, time, and at least one platform are required.");
  }

  let imageUrl: string | undefined;
  if (imageMode === "upload" && imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > MAX_UPLOAD_BYTES) {
      throw new Error("Image is larger than 5MB.");
    }
    const buf = Buffer.from(await imageFile.arrayBuffer());
    imageUrl = `data:${imageFile.type};base64,${buf.toString("base64")}`;
  }

  const col = await postsCollection();
  const now = new Date();
  const hasWebhook = Boolean(process.env.N8N_CREATE_POST_WEBHOOK_URL);

  const doc: PostDoc = {
    topic,
    date,
    time,
    platforms,
    imageMode,
    imagePrompt: imageMode === "ai" ? imagePrompt : undefined,
    imageUrl,
    content: {},
    warnings: [],
    status: hasWebhook ? "processing" : "waiting_approval",
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc);
  const postId = String(result.insertedId);

  if (hasWebhook) {
    const res = await triggerCreatePostWebhook({
      postId,
      topic,
      date,
      time,
      platforms,
      imageMode,
      imagePrompt,
      callbackUrl: `${getBaseUrl()}/api/n8n/callback`,
    });
    if (!res.called || res.ok === false) {
      await setPostFields(postId, {
        status: "waiting_approval",
        warnings: [
          "Could not reach the n8n workflow. Add content manually or check N8N_CREATE_POST_WEBHOOK_URL.",
        ],
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals");
}

export async function approvePostAction(id: string): Promise<void> {
  const col = await postsCollection();
  const post = await col.findOne({ _id: new ObjectId(id) });
  if (!post) return;

  const results: Partial<Record<Platform, PlatformResult>> = { ...(post.results || {}) };
  for (const p of post.platforms) {
    results[p] = { ...(results[p] || { status: "not_sent" }), status: "scheduled" };
  }

  await setPostFields(id, { status: "scheduled", results });
  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function rejectPostAction(
  id: string,
  input?: { reason?: string; note?: string; banWord?: string }
): Promise<void> {
  await setPostFields(id, {
    status: "rejected",
    rejectionReason: input?.reason,
    rejectionNote: input?.note,
  });

  if (input?.banWord) {
    const settings = await settingsCollection();
    await settings.updateOne(
      { _id: "global" },
      { $addToSet: { bannedWords: input.banWord } },
      { upsert: true }
    );
  }

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
  revalidatePath(`/post/${id}/review`);
}

export async function requestRewriteAction(id: string): Promise<void> {
  const col = await postsCollection();
  const post = await col.findOne({ _id: new ObjectId(id) });
  if (!post) return;

  const hasWebhook = Boolean(process.env.N8N_CREATE_POST_WEBHOOK_URL);
  await setPostFields(id, {
    status: hasWebhook ? "processing" : "waiting_approval",
    warnings: [],
  });

  if (hasWebhook) {
    await triggerCreatePostWebhook({
      postId: id,
      topic: post.topic,
      date: post.date,
      time: post.time,
      platforms: post.platforms,
      imageMode: post.imageMode,
      imagePrompt: post.imagePrompt,
      callbackUrl: `${getBaseUrl()}/api/n8n/callback`,
    });
  }

  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function retryPostAction(id: string): Promise<void> {
  const col = await postsCollection();
  const post = await col.findOne({ _id: new ObjectId(id) });
  if (!post) return;

  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "scheduled",
        attempts: (post.attempts || 0) + 1,
        lastAttemptAt: new Date().toISOString(),
        updatedAt: new Date(),
      },
      $unset: { lastError: "" },
    }
  );

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
}

export async function giveUpOnPostAction(id: string): Promise<void> {
  await setPostFields(id, { status: "rejected" });
  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals");
}

export async function updatePlatformContentAction(
  id: string,
  platform: Platform,
  content: PlatformContent
): Promise<void> {
  const col = await postsCollection();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { [`content.${platform}`]: content, updatedAt: new Date() } }
  );
  revalidatePath(`/post/${id}`);
}

export async function reschedulePostAction(id: string, date: string): Promise<void> {
  await setPostFields(id, { date });
  revalidatePath("/calendar");
  revalidatePath("/approvals");
  revalidatePath(`/post/${id}`);
  revalidatePath(`/post/${id}/review`);
}

export async function updatePostImageAction(id: string, formData: FormData): Promise<void> {
  const file = formData.get("imageFile");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is larger than 5MB.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const imageUrl = `data:${file.type};base64,${buf.toString("base64")}`;
  await setPostFields(id, { imageUrl });
  revalidatePath(`/post/${id}`);
}

export async function reconnectAccountAction(platform: Platform): Promise<void> {
  const col = await accountsCollection();
  await col.updateOne(
    { platform },
    { $set: { status: "connected", updatedAt: new Date() } },
    { upsert: true }
  );
  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/new-post");
}

export async function saveBrandVoiceAction(formData: FormData): Promise<void> {
  const tone = String(formData.get("tone") || "");
  const keywords = String(formData.get("keywords") || "");
  const sampleText = String(formData.get("sampleText") || "");
  const doNots = String(formData.get("doNots") || "");

  const col = await settingsCollection();
  await col.updateOne(
    { _id: "global" },
    { $set: { brandVoice: { tone, keywords, sampleText, doNots } } },
    { upsert: true }
  );
  revalidatePath("/settings");
}

export async function addBannedWordAction(word: string): Promise<void> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return;
  const col = await settingsCollection();
  await col.updateOne(
    { _id: "global" },
    { $addToSet: { bannedWords: trimmed } },
    { upsert: true }
  );
  revalidatePath("/settings");
}

export async function removeBannedWordAction(word: string): Promise<void> {
  const col = await settingsCollection();
  await col.updateOne({ _id: "global" }, { $pull: { bannedWords: word } });
  revalidatePath("/settings");
}
