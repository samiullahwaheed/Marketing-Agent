import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { postsCollection } from "@/lib/db";
import type { Platform, PlatformContent, PostStatus } from "@/lib/types";

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
//   "status": "waiting_approval" // optional, defaults to waiting_approval; use "failed" if generation itself failed
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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { postId, imageUrl, content, warnings, status, error } = body;
  if (!postId || !ObjectId.isValid(postId)) {
    return NextResponse.json({ error: "Missing or invalid postId" }, { status: 400 });
  }

  const col = await postsCollection();
  const existing = await col.findOne({ _id: new ObjectId(postId) });
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await col.updateOne(
    { _id: new ObjectId(postId) },
    {
      $set: {
        ...(imageUrl ? { imageUrl } : {}),
        ...(content ? { content: { ...existing.content, ...content } } : {}),
        ...(warnings ? { warnings } : {}),
        status: status ?? "waiting_approval",
        ...(error ? { lastError: error } : {}),
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true });
}
