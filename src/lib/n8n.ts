import type { Platform } from "./types";

export interface CreatePostWebhookPayload {
  postId: string;
  topic: string;
  date: string;
  time: string;
  platforms: Platform[];
  imageMode: "ai" | "upload";
  imagePrompt?: string;
  callbackUrl: string;
}

export async function triggerCreatePostWebhook(
  payload: CreatePostWebhookPayload
): Promise<{ called: boolean; ok?: boolean; error?: string }> {
  const url = process.env.N8N_CREATE_POST_WEBHOOK_URL;
  if (!url) {
    return { called: false };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { called: true, ok: res.ok };
  } catch (err) {
    return {
      called: true,
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reach n8n webhook",
    };
  }
}
