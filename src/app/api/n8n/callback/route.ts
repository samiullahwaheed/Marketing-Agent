import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { postsCollection } from "@/lib/db";
import type { Platform, PlatformContent, PlatformResult, PostStatus } from "@/lib/types";

// Called by the n8n workflow once it has generated per-platform content and
// uploaded the image to Google Drive. Protect with the shared secret so this
// public endpoint can't be used to overwrite arbitrary posts.
//
// Expected JSON body:
// {
//   "postId": "<mongo _id of the post>",
//   "imageUrl": "https://drive.google.com/...",
//   "content": {
//     "linkedin": { "text": "...", "hashtags": ["automation", "n8n"], "suggestedHashtags": ["nocode"] },
//     "x": { "text": "...", "hashtags": [...] }
//   },
//   "warnings": ["\"11 hours\" has no source — check before posting"],
//   "status": "waiting_approval", // optional for generation callbacks
//   "platformResults": { "linkedin": { "status": "published", "url": "..." } }
// }
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-callback-secret");
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
  if (!postId || !ObjectId.isValid(postId)) {
    return NextResponse.json({ error: "Missing or invalid postId" }, { status: 400 });
  }
  if (status && !["processing", "waiting_approval", "scheduled", "published", "failed", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid post status" }, { status: 400 });
  }

  const col = await postsCollection();
  const existing = await col.findOne({ _id: new ObjectId(postId) });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (
    platformResults &&
    Object.entries(platformResults).some(
      ([platform, result]) =>
        !existing.platforms.some((knownPlatform) => knownPlatform === platform) ||
        !result ||
        !["not_sent", "scheduled", "published", "failed"].includes(result.status)
    )
  ) {
    return NextResponse.json({ error: "Unknown platform in publish results" }, { status: 400 });
  }

  const platformError = Object.values(platformResults ?? {}).find(
    (result) => result?.status === "failed" && result.error
  )?.error;
  const setFields: Record<string, unknown> = {
    ...(imageUrl ? { imageUrl } : {}),
    ...(content ? { content: { ...existing.content, ...content } } : {}),
    ...(warnings ? { warnings } : {}),
    ...(status ? { status } : !platformResults ? { status: "waiting_approval" } : {}),
    ...(error || platformError ? { lastError: error || platformError } : {}),
    updatedAt: new Date(),
  };
  for (const [platform, result] of Object.entries(platformResults ?? {})) {
    if (result) setFields[`results.${platform}`] = result;
  }

  await col.updateOne(
    { _id: new ObjectId(postId) },
    {
      $set: setFields,
      ...(!error && !platformError && !platformResults ? { $unset: { lastError: "" } } : {}),
    }
  );

  if (platformResults) {
    const updated = await col.findOne({ _id: new ObjectId(postId) });
    if (updated) {
      const allResolved = existing.platforms.every((platform) =>
        ["published", "failed"].includes(updated.results?.[platform]?.status ?? "")
      );
      if (allResolved) {
        const allPublished = existing.platforms.every(
          (platform) => updated.results?.[platform]?.status === "published"
        );
        await col.updateOne(
          { _id: new ObjectId(postId) },
          {
            $set: { status: allPublished ? "published" : "failed", updatedAt: new Date() },
            ...(allPublished ? { $unset: { lastError: "" } } : {}),
          }
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
