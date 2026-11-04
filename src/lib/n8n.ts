import type { ImageUploadTarget } from "./supabase";
import type { Platform, PlatformContent, RewriteRequest } from "./types";

export interface CreatePostWebhookPayload {
  postId: string;
  topic: string;
  date: string;
  time: string;
  /** ISO time to publish at, or null to publish as soon as it is approved. */
  scheduledAt: string | null;
  postNow: boolean;
  platforms: Platform[];
  imageMode: "ai" | "upload";
  /** Existing public image (user upload, or the image kept from a previous draft). */
  imageUrl?: string;
  imagePrompt?: string;
  /** Where n8n should PUT a freshly generated AI image. Only sent when one is needed. */
  imageUpload?: ImageUploadTarget;
  audience?: string;
  language?: string;
  brandVoice?: {
    tone: string;
    keywords: string;
    sampleText: string;
    doNots: string;
  };
  bannedWords?: string[];
  rewrite?: boolean;
  rewriteRequest?: RewriteRequest;
  currentContent?: Partial<Record<Platform, PlatformContent>>;
  callbackUrl: string;
}

export interface PublishPostWebhookPayload {
  postId: string;
  topic: string;
  date: string;
  time: string;
  /** ISO time to publish at. Now (or in the past) means publish immediately. */
  scheduledAt: string;
  platforms: Platform[];
  content: Partial<Record<Platform, PlatformContent>>;
  imageUrl?: string;
  callbackUrl: string;
}

const CREATE_POST_WEBHOOK_URL =
  process.env.N8N_CREATE_POST_WEBHOOK_URL ||
  "https://marketing-agent1.app.n8n.cloud/webhook/social-post-create";
const PUBLISH_POST_WEBHOOK_URL =
  process.env.N8N_PUBLISH_POST_WEBHOOK_URL ||
  "https://marketing-agent1.app.n8n.cloud/webhook/social-post-publish";

async function postWebhook(
  url: string,
  payload: CreatePostWebhookPayload | PublishPostWebhookPayload
): Promise<{ called: boolean; ok?: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (process.env.N8N_WEBHOOK_API_KEY) {
      headers["x-api-key"] = process.env.N8N_WEBHOOK_API_KEY;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return { called: true, ok: res.ok, ...(res.ok ? {} : { error: await res.text() }) };
  } catch (err) {
    return {
      called: true,
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reach n8n webhook",
    };
  }
}

export async function triggerCreatePostWebhook(
  payload: CreatePostWebhookPayload
): Promise<{ called: boolean; ok?: boolean; error?: string }> {
  return postWebhook(CREATE_POST_WEBHOOK_URL, payload);
}

export async function triggerPublishPostWebhook(
  payload: PublishPostWebhookPayload
): Promise<{ called: boolean; ok?: boolean; error?: string }> {
  return postWebhook(PUBLISH_POST_WEBHOOK_URL, payload);
}
