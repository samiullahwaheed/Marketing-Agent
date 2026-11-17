import type { NextRequest } from "next/server";
import { backToSettings, connectLinkedIn, readCallback } from "@/lib/oauth";
import { requireUserId } from "@/lib/users";

// LinkedIn sends the user back here after "Allow".
export async function GET(req: NextRequest) {
  const userId = await requireUserId();
  const cb = await readCallback(req, "linkedin");
  if ("error" in cb) return backToSettings(req, { connect_error: `linkedin_${cb.error}` });

  try {
    await connectLinkedIn(req, userId, cb.code);
    return backToSettings(req, { connected: "linkedin" });
  } catch (err) {
    console.error("LinkedIn connect failed:", err instanceof Error ? err.message : err);
    return backToSettings(req, { connect_error: "linkedin_failed" });
  }
}
