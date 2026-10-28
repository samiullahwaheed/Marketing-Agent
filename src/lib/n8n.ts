import type { Platform, PlatformContent } from "./types";

export interface CreatePostWebhookPayload {
  postId: string;
  topic: string;
  date: string;
  time: string;
  scheduledAt: string;
  platforms: Platform[];
  imageMode: "ai" | "upload";
  imageUrl?: string;
  imagePrompt?: string;
  audience?: string;
  goal?: string;
  language?: string;
  brandVoice?: {
    tone: string;
    keywords: string;
    sampleText: string;
    doNots: string;
  };
  rewrite?: boolean;
  currentContent?: Partial<Record<Platform, PlatformContent>>;
  callbackUrl: string;
}

export interface PublishPostWebhookPayload {
  postId: string;
  topic: string;
  date: string;
  time: string;
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
