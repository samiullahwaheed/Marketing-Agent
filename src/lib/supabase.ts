import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_BUCKET = "post-images";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

declare global {
  var _supabase: SupabaseClient | undefined;
}

/** Server-only client using the service role key. Never import from client components. */
export function getSupabase(): SupabaseClient {
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Add them to .env.local (Supabase → Project Settings → API)."
    );
  }
  if (!global._supabase) {
    global._supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return global._supabase;
}

/** Throws a readable error for a failed Supabase call, otherwise returns its data. */
export function unwrap<T>(res: { data: T; error: { message: string } | null }, context: string): T {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  return res.data;
}

/** Like unwrap, for calls that must return a value (e.g. `.single()`). */
export function unwrapOne<T>(res: { data: T; error: { message: string } | null }, context: string): NonNullable<T> {
  const data = unwrap(res, context);
  if (data === null || data === undefined) throw new Error(`${context}: no data returned`);
  return data;
}

function extensionFor(type: string): string {
  const sub = type.split("/")[1]?.toLowerCase() ?? "png";
  return sub === "jpeg" ? "jpg" : sub.replace(/[^a-z0-9]/g, "") || "png";
}

/** Uploads an image file to the public bucket and returns its public URL. */
export async function uploadPostImage(postId: string, file: File): Promise<string> {
  const supabase = getSupabase();
  const path = `posts/${postId}/upload-${Date.now()}.${extensionFor(file.type)}`;
  unwrap(
    await supabase.storage.from(IMAGE_BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "image/png",
      upsert: true,
    }),
    "Image upload failed"
  );
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface ImageUploadTarget {
  /** n8n PUTs the generated image bytes here; no Supabase credential needed in n8n. Valid for 2 hours. */
  signedUrl: string;
  /** Where the image can be read once uploaded. */
  publicUrl: string;
  path: string;
}

/** Creates a one-off signed upload URL so n8n can store an AI-generated image. */
export async function createImageUploadTarget(postId: string): Promise<ImageUploadTarget> {
  const supabase = getSupabase();
  const path = `posts/${postId}/ai-${Date.now()}.jpg`; // JPEG: the only format Instagram accepts
  const { signedUrl } = unwrapOne(
    await supabase.storage.from(IMAGE_BUCKET).createSignedUploadUrl(path, { upsert: true }),
    "Could not create image upload URL"
  );
  return {
    signedUrl,
    publicUrl: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl,
    path,
  };
}
