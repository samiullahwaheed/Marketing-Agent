import { NextRequest, NextResponse } from "next/server";
import { getPostById, updatePost } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import type { Platform, PlatformContent, PlatformResult, PostStatus } from "@/lib/types";

// Called by the n8n workflow (1) once it has generated per-platform content
// and stored the image in Supabase Storage, and (2) once per platform after
// publishing. Protect with the shared secret so this public endpoint can't be
// used to overwrite arbitrary posts.
//
// Header: x-callback-secret: <N8N_CALLBACK_SECRET>
//
// Generation callback:
// {
//   "postId": "<uuid of the post>",
//   "imageUrl": "https://<project>.supabase.co/storage/v1/object/public/post-images/...",
//   "content": {
//     "linkedin": { "text": "...", "hashtags": ["automation", "n8n"], "suggestedHashtags": ["nocode"] },
//     "x": { "text": "...", "hashtags": [...] }
//   },
//   "warnings": ["\"11 hours\" has no source — check before posting"],
//   "status": "waiting_approval",          // or "failed" together with "error"
//   "error": "Claude returned no text for x"
// }
//
// Publish callback:
// { "postId": "<uuid>", "platformResults": { "linkedin": { "status": "published", "url": "..." } } }
const STATUSES: PostStatus[] = ["processing", "waiting_approval", "scheduled", "published", "failed", "rejected"];
const RESULT_STATUSES: PlatformResult["status"][] = ["not_sent", "scheduled", "published", "failed"];

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-callback-secret") ?? req.headers.get("x-api-key");
  if (!process.env.N8N_CALLBACK_SECRET || secret !== process.env.N8N_CALLBACK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    postId?: string;
    imageUrl?: string;
    content?: Partial<Record<Platform, PlatformContent>>;
    warnings?: string[];
    status?: PostStatus;
    error?: string;
    platformResults?: Partial<Record<Platform, PlatformResult>>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { postId, imageUrl, content, warnings, status, error, platformResults } = body;
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid post status" }, { status: 400 });
  }

  const existing = await getPostById(postId);
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (platformResults) {
    if (
      Object.entries(platformResults).some(
        ([platform, result]) =>
          !existing.platforms.includes(platform as Platform) || !result || !RESULT_STATUSES.includes(result.status)
      )
    ) {
      return NextResponse.json({ error: "Unknown platform in publish results" }, { status: 400 });
    }

    // Atomic merge + final status, see supabase/schema.sql.
    const { error: rpcError } = await getSupabase().rpc("apply_publish_results", {
      p_id: postId,
      p_results: platformResults,
    });
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const nextStatus: PostStatus = status ?? (error ? "failed" : "waiting_approval");
  await updatePost(postId, {
    ...(imageUrl ? { imageUrl } : {}),
    ...(content ? { content: { ...existing.content, ...content } } : {}),
    ...(warnings ? { warnings } : {}),
    status: nextStatus,
    lastError: error || (nextStatus === "failed" ? existing.lastError : null),
  });

  return NextResponse.json({ ok: true });
}
